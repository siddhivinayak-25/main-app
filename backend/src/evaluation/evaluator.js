/**
 * HireOS LangGraph Evaluation Engine — powered by Gemini Flash
 *
 * Multi-agent scoring pipeline (mirrors the architecture doc):
 *
 *   ORCHESTRATOR
 *       │
 *       ├─► Prompt Quality Agent   (PROMPT_SENT / CODE_ACCEPTED / CODE_REJECTED events)
 *       ├─► Error Recovery Agent   (ERROR_ENCOUNTERED / ERROR_RECOVERED events)
 *       ├─► Output Correctness     (TEST_CASE_RESULT — deterministic, no LLM)
 *       ├─► Code Quality Agent     (final submitted code)
 *       └─► Execution Efficiency   (timing + iteration count — deterministic)
 *           │
 *       SYNTHESIS AGENT  →  final { total, breakdown, highlights, concerns }
 *           │
 *       PERSIST to DB (candidate score + evaluation_sessions.evaluation_result)
 *
 * Event types tracked (from session recorder):
 *   PROMPT_SENT | MODEL_RESPONSE | CODE_ACCEPTED | CODE_REJECTED | CODE_MODIFIED
 *   FILE_SAVED  | CODE_EXECUTED  | EXECUTION_OUTPUT | TEST_CASE_RESULT
 *   TERMINAL_COMMAND | ERROR_ENCOUNTERED | ERROR_RECOVERED | SESSION_SUBMITTED
 */

import { StateGraph, Annotation, END } from '@langchain/langgraph';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { query } from '../db/index.js';

// ─── State ────────────────────────────────────────────────────────────────

const EvalState = Annotation.Root({
  sessionId:   Annotation(),
  candidateId: Annotation(),
  testId:      Annotation(),
  telemetry:   Annotation(),
  testConfig:  Annotation(),
  scores: Annotation({
    reducer: (prev, next) => ({ ...prev, ...next }),
    default: () => ({}),
  }),
  feedback:    Annotation(),
  highlights:  Annotation({ default: () => [] }),
  concerns:    Annotation({ default: () => [] }),
});

// ─── LLM ──────────────────────────────────────────────────────────────────

function getLLM() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not set');
  }
  return new ChatGoogleGenerativeAI({
    model: 'gemini-2.5-flash',
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0.2,
    maxOutputTokens: 1024,
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function filterEvents(telemetry, ...types) {
  return (telemetry || []).filter(e => types.includes(e.eventType || e.type));
}

async function llmScore(llm, system, user, max = 20) {
  try {
    const res = await llm.invoke([
      new SystemMessage(system),
      new HumanMessage(user),
    ]);
    const text = typeof res.content === 'string' ? res.content : JSON.stringify(res.content);
    const match = text.match(/\{[\s\S]*?"score"\s*:\s*(\d+(?:\.\d+)?)[\s\S]*?\}/);
    if (match) {
      const obj = JSON.parse(match[0]);
      return {
        score:     Math.min(max, Math.max(0, Math.round(Number(obj.score)))),
        feedback:  obj.feedback  || obj.reasoning || '',
        highlight: obj.highlight || null,
        concern:   obj.concern   || null,
      };
    }
    const num = text.match(/\b(\d{1,2})\b/);
    return { score: num ? Math.min(max, Number(num[1])) : Math.round(max * 0.6), feedback: text.slice(0, 300) };
  } catch (err) {
    console.warn('[Evaluator] LLM call failed:', err.message);
    return { score: Math.round(max * 0.6), feedback: 'Score estimated — LLM unavailable' };
  }
}

// ─── Node 1: Load context from DB ─────────────────────────────────────────

async function loadContext(state) {
  const result = await query(
    `SELECT es.telemetry,
            t.name, t.instructions,
            json_agg(json_build_object(
              'name', tc.name, 'input', tc.input, 'expectedOutput', tc.expected_output
            )) FILTER (WHERE tc.id IS NOT NULL) AS test_cases
     FROM evaluation_sessions es
     JOIN tests t ON t.id = es.test_id
     LEFT JOIN test_cases tc ON tc.test_id = t.id
     WHERE es.id = $1
     GROUP BY es.id, t.id`,
    [state.sessionId]
  );
  if (!result.rows.length) throw new Error(`Session ${state.sessionId} not found`);
  const row = result.rows[0];
  return {
    telemetry:  row.telemetry || [],
    testConfig: { name: row.name, instructions: row.instructions, testCases: row.test_cases || [] },
  };
}

// ─── Node 2: Prompt Quality Agent ─────────────────────────────────────────
// Evaluates PROMPT_SENT events — clarity, specificity, iteration improvement

async function analyzePromptQuality(state) {
  const prompts = filterEvents(state.telemetry, 'PROMPT_SENT', 'ai_prompt');
  if (!prompts.length) {
    return { scores: { promptQuality: { score: 6, feedback: 'No AI prompts recorded in this session.' } } };
  }

  const llm = getLLM();
  const timeline = prompts.slice(0, 12).map((e, i) => {
    const prevEvent = state.telemetry
      .filter(t => t.timestamp < e.timestamp)
      .slice(-1)[0];
    const context = prevEvent?.eventType === 'CODE_REJECTED'
      ? '(after rejecting previous response)'
      : prevEvent?.eventType === 'ERROR_ENCOUNTERED'
      ? '(after encountering an error)'
      : '';
    return `[Prompt ${i + 1}${context ? ' ' + context : ''}]\n"${(e.payload?.prompt || e.payload?.content || '').slice(0, 400)}"`;
  }).join('\n\n');

  const result = await llmScore(
    llm,
    `You are evaluating a software engineering candidate's ability to effectively prompt AI models during an agentic coding test.
Score out of 20 points across these criteria:
- Specificity and clarity: were prompts vague ("write a function") or precise? (0-6 pts)
- Iteration quality: did prompts meaningfully improve after failures or rejections? (0-5 pts)
- Context inclusion: did they include error messages, expected behavior, constraints? (0-5 pts)
- Decomposition: did they break complex tasks into clear sub-goals? (0-4 pts)

Return ONLY valid JSON:
{"score": <0-20>, "feedback": "<2-3 sentence specific assessment>", "highlight": "<one standout positive or null>", "concern": "<one main weakness or null>"}`,
    `Test task: ${state.testConfig?.instructions || 'N/A'}\n\nPrompt timeline:\n${timeline}`
  );

  return { scores: { promptQuality: result } };
}

// ─── Node 3: Error Recovery Agent ─────────────────────────────────────────
// Evaluates ERROR_ENCOUNTERED → ERROR_RECOVERED sequences

async function analyzeErrorRecovery(state) {
  const errors    = filterEvents(state.telemetry, 'ERROR_ENCOUNTERED', 'error', 'test_fail');
  const recovered = filterEvents(state.telemetry, 'ERROR_RECOVERED', 'correction', 'retry');
  const rejected  = filterEvents(state.telemetry, 'CODE_REJECTED');

  if (!errors.length && !rejected.length) {
    return { scores: { errorRecovery: { score: 16, feedback: 'No errors or rejections — smooth execution throughout.' } } };
  }

  const llm = getLLM();

  // Build error/recovery pairs
  const errorSummary = errors.slice(0, 6).map((e, i) => {
    const recoveryAfter = state.telemetry
      .filter(t => t.timestamp > e.timestamp && (t.eventType === 'ERROR_RECOVERED' || t.eventType === 'PROMPT_SENT'))
      .slice(0, 1)[0];
    const timeDelta = recoveryAfter
      ? Math.round((recoveryAfter.timestamp - e.timestamp) / 1000) + 's to recover'
      : 'no recovery observed';
    return `Error ${i + 1}: ${(e.payload?.message || e.payload?.errorType || 'runtime error').slice(0, 200)}\nRecovery: ${timeDelta}`;
  }).join('\n\n');

  const result = await llmScore(
    llm,
    `You are evaluating a software engineering candidate's ability to recover from AI errors in an agentic coding test.
Score out of 20 points:
- Recognized when AI output was wrong or incomplete (0-6 pts)
- Corrected course effectively without spiraling (0-7 pts)
- Maintained momentum and productivity despite errors (0-7 pts)

Return ONLY valid JSON:
{"score": <0-20>, "feedback": "<2-3 sentence specific assessment>", "highlight": "<standout recovery moment or null>", "concern": "<main recovery weakness or null>"}`,
    `Errors encountered: ${errors.length}\nCode rejections: ${rejected.length}\nRecovery events: ${recovered.length}\n\nError/recovery log:\n${errorSummary || 'Only rejections, no runtime errors.'}`
  );

  return { scores: { errorRecovery: result } };
}

// ─── Node 4: Output Correctness (deterministic) ───────────────────────────

async function analyzeOutputCorrectness(state) {
  const testResults = filterEvents(state.telemetry, 'TEST_CASE_RESULT', 'test_result');
  const submission  = filterEvents(state.telemetry, 'SESSION_SUBMITTED', 'submission')[0];
  const finalResults = submission?.payload?.testResults || testResults.map(e => e.payload) || [];

  if (!finalResults.length) {
    return { scores: { outputCorrectness: { score: 10, feedback: 'No test case results recorded.' } } };
  }

  const passed = finalResults.filter(r => r.passed || r.status === 'passed').length;
  const total  = finalResults.length;
  const pct    = Math.round((passed / total) * 100);
  const score  = Math.round((passed / total) * 20);

  return {
    scores: {
      outputCorrectness: {
        score,
        feedback: `${passed}/${total} test cases passed (${pct}%).`,
        highlight: pct === 100 ? 'All test cases passed.' : null,
        concern:   pct < 50 ? 'Less than half the test cases passed.' : null,
      },
    },
  };
}

// ─── Node 5: Code Quality Agent ───────────────────────────────────────────

async function analyzeCodeQuality(state) {
  const submission = filterEvents(state.telemetry, 'SESSION_SUBMITTED', 'submission')[0];
  const savedFiles = filterEvents(state.telemetry, 'FILE_SAVED');
  const finalCode  = submission?.payload?.finalCode
    || savedFiles.slice(-1)[0]?.payload?.content
    || '';

  // Also look at Accept/Reject/Modify patterns
  const accepted = filterEvents(state.telemetry, 'CODE_ACCEPTED').length;
  const rejected = filterEvents(state.telemetry, 'CODE_REJECTED').length;
  const modified = filterEvents(state.telemetry, 'CODE_MODIFIED').length;

  if (!finalCode.trim()) {
    return { scores: { codeQuality: { score: 8, feedback: 'No final code found in submission.' } } };
  }

  const llm = getLLM();
  const result = await llmScore(
    llm,
    `You are a senior engineer evaluating code produced in an AI-augmented engineering hiring test.
The candidate used AI to help write this code — your job is to evaluate the RESULT, not penalise AI usage.
Score out of 20 points:
- Readability and naming (0-5 pts)
- Structure, modularity, organization (0-5 pts)
- Error handling and edge cases (0-5 pts)
- Appropriate AI usage — did they accept, modify, or improve generated code thoughtfully? (0-5 pts)

Accept/Reject/Modify breakdown: ${accepted} accepted, ${rejected} rejected, ${modified} modified.

Return ONLY valid JSON:
{"score": <0-20>, "feedback": "<2-3 sentence specific assessment>", "highlight": "<strongest aspect or null>", "concern": "<main weakness or null>"}`,
    `Task: ${state.testConfig?.instructions || 'N/A'}\n\nSubmitted code:\n\`\`\`\n${finalCode.slice(0, 2500)}\n\`\`\``
  );

  return { scores: { codeQuality: result } };
}

// ─── Node 6: Execution Efficiency (deterministic) ─────────────────────────

async function analyzeExecutionEfficiency(state) {
  const events       = state.telemetry || [];
  const firstEvent   = events[0];
  const submission   = filterEvents(events, 'SESSION_SUBMITTED', 'submission')[0] || events[events.length - 1];
  const promptCount  = filterEvents(events, 'PROMPT_SENT', 'ai_prompt').length;
  const execCount    = filterEvents(events, 'CODE_EXECUTED', 'code_execution').length;
  const acceptCount  = filterEvents(events, 'CODE_ACCEPTED').length;
  const rejectCount  = filterEvents(events, 'CODE_REJECTED').length;

  let minutesTaken = 0;
  if (firstEvent && submission && submission.timestamp !== firstEvent.timestamp) {
    minutesTaken = (submission.timestamp - firstEvent.timestamp) / 60000;
  }

  // Scoring heuristic: efficient = 5–20 AI calls, <45 min, more accepts than rejects
  let score = 15;
  if (promptCount > 30)    score -= 4;  // excessive prompting
  if (promptCount < 2)     score -= 3;  // barely used AI
  if (minutesTaken > 60)   score -= 3;  // over time
  if (minutesTaken < 3 && minutesTaken > 0) score -= 2; // suspiciously fast
  if (rejectCount > acceptCount * 2)  score -= 2; // high rejection rate
  score = Math.min(20, Math.max(0, score));

  const feedback = [
    minutesTaken > 0 ? `${Math.round(minutesTaken)} min total` : null,
    `${promptCount} AI prompts`,
    execCount > 0 ? `${execCount} code runs` : null,
    acceptCount + rejectCount > 0 ? `${acceptCount} accepted / ${rejectCount} rejected` : null,
  ].filter(Boolean).join(', ');

  return {
    scores: {
      executionEfficiency: {
        score,
        feedback,
        highlight: score >= 16 ? 'Efficient, focused session.' : null,
        concern:   promptCount > 25 ? 'High number of AI prompts may indicate difficulty staying on track.' : null,
      },
    },
  };
}

// ─── Node 7: Synthesis Agent ──────────────────────────────────────────────

async function synthesizeFinalScore(state) {
  const s = state.scores || {};
  const dims = ['promptQuality', 'errorRecovery', 'outputCorrectness', 'codeQuality', 'executionEfficiency'];
  const total = dims.reduce((sum, d) => sum + (s[d]?.score || 0), 0);

  // Collect highlights and concerns from sub-agents
  const highlights = dims.map(d => s[d]?.highlight).filter(Boolean);
  const concerns   = dims.map(d => s[d]?.concern).filter(Boolean);

  let overallFeedback = '';
  try {
    const llm = getLLM();
    const breakdown = dims.map(d =>
      `  ${d}: ${s[d]?.score ?? 0}/20 — ${s[d]?.feedback || ''}`
    ).join('\n');

    const res = await llm.invoke([
      new SystemMessage(
        `You are HireOS, an agentic hiring intelligence platform. Write a sharp, recruiter-facing 2-3 sentence overall assessment of this candidate. Be specific and actionable. Reference their actual behaviours, not just the numbers.`
      ),
      new HumanMessage(`Composite Score: ${total}/100\n\nBreakdown:\n${breakdown}\n\nHighlights: ${highlights.join('; ') || 'none'}\nConcerns: ${concerns.join('; ') || 'none'}`),
    ]);
    overallFeedback = typeof res.content === 'string' ? res.content : JSON.stringify(res.content);
  } catch {
    overallFeedback = `Composite score ${total}/100 across 5 evaluation dimensions.`;
  }

  return {
    feedback:   overallFeedback,
    highlights,
    concerns,
    scores: { composite: total },
  };
}

// ─── Node 8: Persist to DB ────────────────────────────────────────────────

async function persistResults(state) {
  const s     = state.scores || {};
  const total = s.composite || 0;

  const scoreBreakdown = {
    promptQuality:       s.promptQuality?.score       ?? 0,
    errorRecovery:       s.errorRecovery?.score       ?? 0,
    outputCorrectness:   s.outputCorrectness?.score   ?? 0,
    codeQuality:         s.codeQuality?.score         ?? 0,
    executionEfficiency: s.executionEfficiency?.score ?? 0,
  };

  const evalResult = {
    compositeScore: total,
    scoreBreakdown,
    dimensionFeedback: {
      promptQuality:       s.promptQuality?.feedback       || '',
      errorRecovery:       s.errorRecovery?.feedback       || '',
      outputCorrectness:   s.outputCorrectness?.feedback   || '',
      codeQuality:         s.codeQuality?.feedback         || '',
      executionEfficiency: s.executionEfficiency?.feedback || '',
    },
    overallFeedback: state.feedback || '',
    highlights:      state.highlights || [],
    concerns:        state.concerns   || [],
    evaluatedAt:     new Date().toISOString(),
    model:           'gemini-1.5-flash',
  };

  await query(
    `UPDATE evaluation_sessions
     SET evaluation_result = $1, status = 'completed', completed_at = NOW()
     WHERE id = $2`,
    [JSON.stringify(evalResult), state.sessionId]
  );

  await query(
    `UPDATE candidates
     SET score = $1, score_breakdown = $2, status = 'completed',
         last_activity = NOW(), updated_at = NOW()
     WHERE id = $3`,
    [total, JSON.stringify(scoreBreakdown), state.candidateId]
  );

  await query(
    `INSERT INTO candidate_activity_log (candidate_id, status, note)
     VALUES ($1, 'completed', $2)`,
    [state.candidateId, `AI evaluation complete — ${total}/100 (Gemini Flash)`]
  );

  console.log(`[Evaluator] ✓ Session ${state.sessionId} → ${total}/100`);
  return {};
}

// ─── Graph ────────────────────────────────────────────────────────────────

function buildGraph() {
  return new StateGraph(EvalState)
    // Nodes
    .addNode('loadContext',               loadContext)
    .addNode('analyzePromptQuality',      analyzePromptQuality)
    .addNode('analyzeErrorRecovery',      analyzeErrorRecovery)
    .addNode('analyzeOutputCorrectness',  analyzeOutputCorrectness)
    .addNode('analyzeCodeQuality',        analyzeCodeQuality)
    .addNode('analyzeExecutionEfficiency',analyzeExecutionEfficiency)
    .addNode('synthesizeFinalScore',      synthesizeFinalScore)
    .addNode('persistResults',            persistResults)
    // Edges: load → all 5 agents in parallel → synthesize → persist
    .addEdge('__start__',                   'loadContext')
    .addEdge('loadContext',                 'analyzePromptQuality')
    .addEdge('loadContext',                 'analyzeErrorRecovery')
    .addEdge('loadContext',                 'analyzeOutputCorrectness')
    .addEdge('loadContext',                 'analyzeCodeQuality')
    .addEdge('loadContext',                 'analyzeExecutionEfficiency')
    .addEdge('analyzePromptQuality',        'synthesizeFinalScore')
    .addEdge('analyzeErrorRecovery',        'synthesizeFinalScore')
    .addEdge('analyzeOutputCorrectness',    'synthesizeFinalScore')
    .addEdge('analyzeCodeQuality',          'synthesizeFinalScore')
    .addEdge('analyzeExecutionEfficiency',  'synthesizeFinalScore')
    .addEdge('synthesizeFinalScore',        'persistResults')
    .addEdge('persistResults',              END)
    .compile();
}

let _graph = null;

export async function runEvaluation(sessionId, candidateId, testId) {
  if (!_graph) _graph = buildGraph();
  console.log(`[Evaluator] Starting session ${sessionId}`);
  try {
    await _graph.invoke({ sessionId, candidateId, testId, telemetry: [], testConfig: {}, scores: {}, feedback: '', highlights: [], concerns: [] });
  } catch (err) {
    console.error(`[Evaluator] Failed — session ${sessionId}:`, err.message);
    await query(`UPDATE evaluation_sessions SET status = 'failed' WHERE id = $1`, [sessionId]).catch(() => {});
  }
}
