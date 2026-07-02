/**
 * HireOS LangGraph Evaluation Engine
 *
 * Evaluates candidates across 5 dimensions (20 pts each = 100 total):
 *   1. Prompt Quality       — how precisely they directed the AI
 *   2. Error Recovery       — how well they handled AI mistakes / hallucinations
 *   3. Output Correctness   — test pass rates (deterministic)
 *   4. Code Quality         — readability, structure, best practices
 *   5. Execution Efficiency — time-to-solution, iteration count
 */

import { StateGraph, Annotation, END } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { query } from '../db/index.js';

// ─── State Definition ─────────────────────────────────────────────────────

const EvalState = Annotation.Root({
  sessionId:   Annotation(),
  candidateId: Annotation(),
  testId:      Annotation(),
  telemetry:   Annotation(),   // raw telemetry array from session
  testConfig:  Annotation(),   // test instructions + test cases
  scores: Annotation({
    reducer: (prev, next) => ({ ...prev, ...next }),
    default: () => ({}),
  }),
  feedback:    Annotation(),
  error:       Annotation(),
});

// ─── LLM Setup ────────────────────────────────────────────────────────────

function getLLM() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set — LangGraph evaluation requires OpenAI');
  }
  return new ChatOpenAI({ model: 'gpt-4o-mini', temperature: 0.2 });
}

// ─── Helper: safe LLM call ────────────────────────────────────────────────

async function scoreDimension(llm, systemPrompt, userContent, max = 20) {
  try {
    const res = await llm.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userContent),
    ]);
    const text = res.content;

    // Parse JSON score block from response: { "score": N, "reasoning": "..." }
    const match = text.match(/\{[\s\S]*"score"\s*:\s*(\d+)[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return {
        score: Math.min(max, Math.max(0, Number(parsed.score))),
        reasoning: parsed.reasoning || '',
      };
    }
    // Fallback: extract any number 0-20
    const numMatch = text.match(/\b(\d{1,2})\b/);
    return { score: numMatch ? Math.min(max, Number(numMatch[1])) : 10, reasoning: text };
  } catch {
    return { score: 10, reasoning: 'Score estimated (LLM unavailable)' };
  }
}

// ─── Graph Nodes ──────────────────────────────────────────────────────────

async function loadContext(state) {
  const sessionResult = await query(
    `SELECT es.telemetry, t.name, t.instructions,
       json_agg(json_build_object('name', tc.name, 'input', tc.input, 'expectedOutput', tc.expected_output))
         FILTER (WHERE tc.id IS NOT NULL) AS test_cases
     FROM evaluation_sessions es
     JOIN tests t ON t.id = es.test_id
     LEFT JOIN test_cases tc ON tc.test_id = t.id
     WHERE es.id = $1
     GROUP BY es.id, t.id`,
    [state.sessionId]
  );

  if (!sessionResult.rows.length) throw new Error('Session not found');
  const row = sessionResult.rows[0];

  return {
    telemetry:  row.telemetry || [],
    testConfig: { name: row.name, instructions: row.instructions, testCases: row.test_cases || [] },
  };
}

async function analyzePromptQuality(state) {
  const llm = getLLM();
  const aiEvents = (state.telemetry || []).filter(e => e.type === 'ai_prompt');

  if (!aiEvents.length) return { scores: { promptQuality: { score: 8, reasoning: 'No AI prompts recorded' } } };

  const promptSummary = aiEvents.slice(0, 10).map((e, i) =>
    `Prompt ${i + 1}: "${e.payload?.prompt?.slice(0, 300) || '(empty)'}"\nResponse quality signal: ${e.payload?.responseLength || 'unknown'} chars`
  ).join('\n\n');

  const result = await scoreDimension(
    llm,
    `You are an expert evaluator of AI-augmented engineering hiring.
Score the candidate's AI prompt quality out of 20 points.
Criteria:
  - Specificity and clarity of prompts (0-6 pts)
  - Context provided to the AI (0-5 pts)
  - Iterative refinement when first response was poor (0-5 pts)
  - Avoidance of vague/lazy prompts (0-4 pts)
Return ONLY valid JSON: {"score": <0-20>, "reasoning": "<2-3 sentence explanation>"}`,
    `Test: ${state.testConfig?.instructions || 'N/A'}\n\nAI Interactions:\n${promptSummary}`
  );

  return { scores: { promptQuality: result } };
}

async function analyzeErrorRecovery(state) {
  const llm = getLLM();
  const errorEvents    = (state.telemetry || []).filter(e => e.type === 'error' || e.type === 'test_fail');
  const recoveryEvents = (state.telemetry || []).filter(e => e.type === 'correction' || e.type === 'retry');

  if (!errorEvents.length) {
    return { scores: { errorRecovery: { score: 15, reasoning: 'No errors encountered — smooth execution' } } };
  }

  const summary = [
    `Errors encountered: ${errorEvents.length}`,
    `Recovery attempts: ${recoveryEvents.length}`,
    `Error types: ${[...new Set(errorEvents.map(e => e.payload?.errorType || 'unknown'))].join(', ')}`,
    `Sample error: ${errorEvents[0]?.payload?.message?.slice(0, 200) || 'N/A'}`,
  ].join('\n');

  const result = await scoreDimension(
    llm,
    `You are evaluating an engineer's ability to recover from AI errors in a hiring test.
Score out of 20 points.
Criteria:
  - Recognized when AI output was wrong (0-6 pts)
  - Corrected course effectively without spiraling (0-7 pts)
  - Maintained productivity despite errors (0-7 pts)
Return ONLY valid JSON: {"score": <0-20>, "reasoning": "<2-3 sentence explanation>"}`,
    summary
  );

  return { scores: { errorRecovery: result } };
}

async function analyzeOutputCorrectness(state) {
  // Deterministic — based on test pass rates from telemetry
  const submission = (state.telemetry || []).find(e => e.type === 'submission');
  const testResults = submission?.payload?.testResults || [];

  if (!testResults.length) {
    return { scores: { outputCorrectness: { score: 10, reasoning: 'No test results recorded' } } };
  }

  const passed = testResults.filter(r => r.passed).length;
  const total  = testResults.length;
  const ratio  = passed / total;
  const score  = Math.round(ratio * 20);

  return {
    scores: {
      outputCorrectness: {
        score,
        reasoning: `${passed}/${total} test cases passed (${Math.round(ratio * 100)}%)`,
      },
    },
  };
}

async function analyzeCodeQuality(state) {
  const llm = getLLM();
  const submission = (state.telemetry || []).find(e => e.type === 'submission');
  const finalCode  = submission?.payload?.finalCode || '';

  if (!finalCode.trim()) {
    return { scores: { codeQuality: { score: 8, reasoning: 'No final code submitted' } } };
  }

  const result = await scoreDimension(
    llm,
    `You are a senior engineer evaluating code quality in an AI-augmented hiring test.
Score out of 20 points.
Criteria:
  - Readability and naming conventions (0-5 pts)
  - Structure and organization (0-5 pts)
  - Error handling and edge cases (0-5 pts)
  - Appropriate use of AI-generated vs hand-written code (0-5 pts)
Return ONLY valid JSON: {"score": <0-20>, "reasoning": "<2-3 sentence explanation>"}`,
    `Task instructions: ${state.testConfig?.instructions || 'N/A'}\n\nSubmitted code:\n\`\`\`\n${finalCode.slice(0, 2000)}\n\`\`\``
  );

  return { scores: { codeQuality: result } };
}

async function analyzeExecutionEfficiency(state) {
  // Deterministic — time taken and iteration count
  const events = state.telemetry || [];
  const startEvent = events.find(e => e.type === 'session_start') || events[0];
  const endEvent   = events.find(e => e.type === 'submission')    || events[events.length - 1];

  const aiCallCount    = events.filter(e => e.type === 'ai_prompt').length;
  const codeEditCount  = events.filter(e => e.type === 'code_edit').length;

  let minutesTaken = 0;
  if (startEvent && endEvent) {
    minutesTaken = (new Date(endEvent.timestamp) - new Date(startEvent.timestamp)) / 60000;
  }

  // Score: fewer AI calls with better results = more efficient
  // Target: 5-20 AI calls, <45 min
  let score = 15;
  if (aiCallCount > 30) score -= 5;
  if (aiCallCount < 3 && aiCallCount > 0) score -= 3; // too few suggests no AI use
  if (minutesTaken > 60) score -= 4;
  if (minutesTaken < 5 && minutesTaken > 0) score -= 2;  // suspiciously fast
  score = Math.min(20, Math.max(0, score));

  return {
    scores: {
      executionEfficiency: {
        score,
        reasoning: `${minutesTaken.toFixed(0)} min, ${aiCallCount} AI calls, ${codeEditCount} code edits`,
      },
    },
  };
}

async function synthesizeFinalScore(state) {
  const scores = state.scores || {};
  const dims = ['promptQuality', 'errorRecovery', 'outputCorrectness', 'codeQuality', 'executionEfficiency'];
  const compositeScore = dims.reduce((sum, d) => sum + (scores[d]?.score || 0), 0);

  const llm = getLLM();
  let overallFeedback = '';
  try {
    const res = await llm.invoke([
      new SystemMessage(
        `You are HireOS, an agentic hiring intelligence platform. Write a concise 2-3 sentence overall assessment of this candidate based on their scores. Be direct and actionable for a recruiter.`
      ),
      new HumanMessage(
        `Composite Score: ${compositeScore}/100\n` +
        dims.map(d => `  ${d}: ${scores[d]?.score ?? 0}/20 — ${scores[d]?.reasoning || ''}`).join('\n')
      ),
    ]);
    overallFeedback = res.content;
  } catch {
    overallFeedback = `Composite score: ${compositeScore}/100 across 5 evaluation dimensions.`;
  }

  return { feedback: overallFeedback, scores: { composite: compositeScore } };
}

async function persistResults(state) {
  const scores = state.scores || {};
  const compositeScore = scores.composite || 0;

  const scoreBreakdown = {
    promptQuality:       scores.promptQuality?.score       ?? 0,
    errorRecovery:       scores.errorRecovery?.score       ?? 0,
    outputCorrectness:   scores.outputCorrectness?.score   ?? 0,
    codeQuality:         scores.codeQuality?.score         ?? 0,
    executionEfficiency: scores.executionEfficiency?.score ?? 0,
  };

  const evalResult = {
    compositeScore,
    scoreBreakdown,
    dimensionFeedback: {
      promptQuality:       scores.promptQuality?.reasoning       || '',
      errorRecovery:       scores.errorRecovery?.reasoning       || '',
      outputCorrectness:   scores.outputCorrectness?.reasoning   || '',
      codeQuality:         scores.codeQuality?.reasoning         || '',
      executionEfficiency: scores.executionEfficiency?.reasoning || '',
    },
    overallFeedback: state.feedback || '',
    evaluatedAt: new Date().toISOString(),
  };

  // Save to evaluation session
  await query(
    `UPDATE evaluation_sessions SET evaluation_result = $1, status = 'completed', completed_at = NOW() WHERE id = $2`,
    [JSON.stringify(evalResult), state.sessionId]
  );

  // Update candidate score
  await query(
    `UPDATE candidates SET
       score = $1,
       score_breakdown = $2,
       status = 'completed',
       last_activity = NOW(),
       updated_at = NOW()
     WHERE id = $3`,
    [compositeScore, JSON.stringify(scoreBreakdown), state.candidateId]
  );

  await query(
    `INSERT INTO candidate_activity_log (candidate_id, status, note)
     VALUES ($1, 'completed', $2)`,
    [state.candidateId, `AI evaluation complete — Score: ${compositeScore}/100`]
  );

  console.log(`[Evaluation] ✓ Session ${state.sessionId} scored ${compositeScore}/100`);
  return {};
}

// ─── Build the Graph ──────────────────────────────────────────────────────

function buildEvaluationGraph() {
  const graph = new StateGraph(EvalState)
    .addNode('loadContext',              loadContext)
    .addNode('analyzePromptQuality',     analyzePromptQuality)
    .addNode('analyzeErrorRecovery',     analyzeErrorRecovery)
    .addNode('analyzeOutputCorrectness', analyzeOutputCorrectness)
    .addNode('analyzeCodeQuality',       analyzeCodeQuality)
    .addNode('analyzeExecutionEfficiency', analyzeExecutionEfficiency)
    .addNode('synthesizeFinalScore',     synthesizeFinalScore)
    .addNode('persistResults',           persistResults)

    .addEdge('__start__',                  'loadContext')
    .addEdge('loadContext',                'analyzePromptQuality')
    .addEdge('loadContext',                'analyzeErrorRecovery')
    .addEdge('loadContext',                'analyzeOutputCorrectness')
    .addEdge('loadContext',                'analyzeCodeQuality')
    .addEdge('loadContext',                'analyzeExecutionEfficiency')
    .addEdge('analyzePromptQuality',       'synthesizeFinalScore')
    .addEdge('analyzeErrorRecovery',       'synthesizeFinalScore')
    .addEdge('analyzeOutputCorrectness',   'synthesizeFinalScore')
    .addEdge('analyzeCodeQuality',         'synthesizeFinalScore')
    .addEdge('analyzeExecutionEfficiency', 'synthesizeFinalScore')
    .addEdge('synthesizeFinalScore',       'persistResults')
    .addEdge('persistResults',             END);

  return graph.compile();
}

// ─── Public API ───────────────────────────────────────────────────────────

let _compiledGraph = null;

export async function runEvaluation(sessionId, candidateId, testId) {
  if (!_compiledGraph) _compiledGraph = buildEvaluationGraph();

  console.log(`[Evaluation] Starting session ${sessionId} for candidate ${candidateId}`);

  try {
    await _compiledGraph.invoke({
      sessionId,
      candidateId,
      testId,
      telemetry: [],
      testConfig: {},
      scores: {},
      feedback: '',
    });
  } catch (err) {
    console.error(`[Evaluation] Failed for session ${sessionId}:`, err.message);
    // Mark session as failed but don't crash the server
    await query(
      `UPDATE evaluation_sessions SET status = 'failed' WHERE id = $1`,
      [sessionId]
    ).catch(() => {});
  }
}
