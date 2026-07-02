/**
 * HireOS Evaluation Engine — Multi-Provider Orchestrator
 *
 * Architecture (from the platform spec):
 *
 *   SUBMISSION ARRIVES
 *        │
 *   ORCHESTRATOR  ─── loads rubric, selects providers
 *        │
 *   ┌────┴────────────────────────────────────┐
 *   │  For each provider (parallel):          │
 *   │    ├─ promptQuality agent               │
 *   │    ├─ errorRecovery agent               │
 *   │    ├─ codeQuality agent                 │
 *   │    ├─ outputCorrectness (deterministic) │
 *   │    └─ executionEfficiency (deterministic│
 *   └────────────────────────────────────────┘
 *        │
 *   AGGREGATOR  ─── weighted_average | consensus
 *        │
 *   SECURITY PENALTY DEDUCTION
 *        │
 *   SYNTHESIS AGENT  ─── overall recruiter feedback
 *        │
 *   PERSIST  ─── candidates, evaluation_sessions, audit trail
 *
 * Future-proof design:
 *   - Add providers: new file in providers/, register in PROVIDERS map
 *   - Cross-model: set options.providers = ['gemini', 'openai'] → auto-parallel
 *   - Consensus: set options.aggregation = 'consensus' → flag outliers for human review
 *   - Custom rubric: pass options.rubricOverrides to adjust weights/thresholds per test
 */

import { RUBRIC, calcComposite, applyBounds, applySecurityPenalties, getDimensionFlags, requiresHumanReview } from './rubric.js';
import { GeminiProvider } from './providers/gemini.js';
import { query } from '../db/index.js';

// ─── Provider Registry ────────────────────────────────────────────────────
// To add a new provider: import it and add it here.
const PROVIDERS = {
  gemini: new GeminiProvider(),
  // openai:    new OpenAIProvider(),      // future
  // anthropic: new AnthropicProvider(),   // future
  // local:     new LocalLlamaProvider(),  // future
};

function getProviders(names = ['gemini']) {
  return names.map(n => {
    const p = PROVIDERS[n];
    if (!p) throw new Error(`Unknown provider: ${n}`);
    if (!p.isAvailable) throw new Error(`Provider ${n} is not configured (missing API key)`);
    return p;
  });
}

// ─── Deterministic Scorers (no LLM needed) ───────────────────────────────

function scoreOutputCorrectness(telemetry, rubricDim) {
  const testResults = (telemetry || []).filter(e =>
    ['TEST_CASE_RESULT', 'test_result'].includes(e.eventType || e.type)
  );
  const submission = (telemetry || []).find(e =>
    ['SESSION_SUBMITTED', 'submission'].includes(e.eventType || e.type)
  );
  const finalResults = submission?.payload?.testResults || testResults.map(e => e.payload) || [];

  if (!finalResults.length) {
    return { score: Math.round(rubricDim.maxRaw * 0.5), feedback: 'No test case results recorded.', confidence: 0.6 };
  }

  const passed = finalResults.filter(r => r.passed || r.status === 'passed').length;
  const total  = finalResults.length;
  const raw    = Math.round((passed / total) * rubricDim.maxRaw);
  const score  = applyBounds('outputCorrectness', raw);

  return {
    score,
    feedback:   `${passed}/${total} test cases passed (${Math.round(passed/total*100)}%).`,
    highlight:  passed === total ? 'All test cases passed.' : null,
    concern:    passed < total / 2 ? `Only ${passed} of ${total} test cases passed.` : null,
    confidence: 1.0,
  };
}

function scoreExecutionEfficiency(telemetry, rubricDim) {
  const events    = telemetry || [];
  const first     = events[0];
  const submitted = events.find(e => ['SESSION_SUBMITTED','submission'].includes(e.eventType || e.type))
                 || events[events.length - 1];
  const prompts   = events.filter(e => ['PROMPT_SENT','ai_prompt'].includes(e.eventType || e.type)).length;
  const execs     = events.filter(e => ['CODE_EXECUTED','code_execution'].includes(e.eventType || e.type)).length;
  const accepted  = events.filter(e => e.eventType === 'CODE_ACCEPTED').length;
  const rejected  = events.filter(e => e.eventType === 'CODE_REJECTED').length;

  let minutes = 0;
  if (first && submitted && submitted.timestamp !== first.timestamp) {
    minutes = (submitted.timestamp - first.timestamp) / 60000;
  }

  let score = 15;
  if (prompts > 30)   score -= 4;   // excessive AI calls
  if (prompts < 2)    score -= 3;   // didn't use AI
  if (minutes > 75)   score -= 4;   // way over time
  if (minutes > 60)   score -= 2;   // over time
  if (minutes < 3 && minutes > 0) score -= 2; // suspiciously fast
  if (rejected > accepted * 2) score -= 2;  // high reject rate

  const bounded = applyBounds('executionEfficiency', score);
  const parts = [
    minutes > 0 ? `${Math.round(minutes)}min` : null,
    `${prompts} AI prompts`,
    execs ? `${execs} runs` : null,
    accepted + rejected > 0 ? `${accepted} accepted / ${rejected} rejected` : null,
  ].filter(Boolean);

  return {
    score: bounded,
    feedback: parts.join(', '),
    highlight: bounded >= 16 ? 'Efficient, focused session.' : null,
    concern:   prompts > 25 ? 'High prompt count — possible difficulty staying on track.' : null,
    confidence: 1.0,
  };
}

// ─── Aggregation ──────────────────────────────────────────────────────────

function aggregateProviderScores(providerResults, strategy = 'weighted_average') {
  // providerResults: [{ provider, dimensionId, result }]
  const byDimension = {};
  for (const { dimensionId, result } of providerResults) {
    if (!byDimension[dimensionId]) byDimension[dimensionId] = [];
    byDimension[dimensionId].push(result);
  }

  const aggregated = {};
  for (const [dimId, results] of Object.entries(byDimension)) {
    if (results.length === 1) {
      aggregated[dimId] = results[0];
      continue;
    }

    // Filter by confidence floor
    const confident = results.filter(r => (r.confidence ?? 1) >= RUBRIC.aggregation.confidenceFloor);
    const pool = confident.length ? confident : results;

    if (strategy === 'weighted_average') {
      const avgScore = Math.round(pool.reduce((s, r) => s + r.score, 0) / pool.length);
      aggregated[dimId] = {
        score:    avgScore,
        feedback: pool[0].feedback, // primary provider's feedback
        highlight: pool.map(r => r.highlight).find(Boolean) || null,
        concern:   pool.map(r => r.concern).find(Boolean) || null,
        confidence: pool.reduce((s, r) => s + (r.confidence ?? 1), 0) / pool.length,
        providerScores: pool.map(r => r.score),
      };
    }
  }

  return aggregated;
}

// ─── Main Evaluation Runner ───────────────────────────────────────────────

export async function runEvaluation(sessionId, candidateId, testId, options = {}) {
  const rubric = RUBRIC;  // future: allow rubricOverrides
  const providerNames = options.providers || ['gemini'];
  const aggStrategy   = options.aggregation || rubric.aggregation.strategy;

  console.log(`[Engine] Starting evaluation — session:${sessionId} providers:[${providerNames}]`);

  // ── Load session from DB
  const sessionRow = await query(
    `SELECT es.telemetry, es.sandbox_files,
            t.name, t.instructions, t.language,
            json_agg(json_build_object(
              'name', tc.name,'input',tc.input,'expectedOutput',tc.expected_output,'is_hidden',tc.is_hidden
            )) FILTER (WHERE tc.id IS NOT NULL) AS test_cases
     FROM evaluation_sessions es
     JOIN tests t ON t.id = es.test_id
     LEFT JOIN test_cases tc ON tc.test_id = t.id
     WHERE es.id = $1
     GROUP BY es.id, t.id, t.name, t.instructions, t.language`,
    [sessionId]
  );

  if (!sessionRow.rows.length) throw new Error(`Session ${sessionId} not found`);
  const row = sessionRow.rows[0];

  const context = {
    telemetry:  row.telemetry  || [],
    files:      row.sandbox_files || {},
    testConfig: {
      name:         row.name,
      instructions: row.instructions,
      language:     row.language || 'python',
      testCases:    row.test_cases || [],
    },
  };

  // ── Run deterministic scorers
  const deterministicScores = {
    outputCorrectness:   scoreOutputCorrectness(context.telemetry, rubric.dimensions.outputCorrectness),
    executionEfficiency: scoreExecutionEfficiency(context.telemetry, rubric.dimensions.executionEfficiency),
  };

  // ── Run LLM providers in parallel
  let providers;
  try { providers = getProviders(providerNames); }
  catch (err) {
    console.warn(`[Engine] Provider init failed: ${err.message} — using floor scores`);
    providers = [];
  }

  const llmDimensions = ['promptQuality', 'errorRecovery', 'codeQuality'];
  const providerJobs  = providers.flatMap(provider =>
    llmDimensions
      .filter(d => provider.capabilities.includes(d))
      .map(async dimensionId => {
        try {
          const result = await provider.evaluateDimension(dimensionId, context, rubric);
          return { provider: provider.name, dimensionId, result };
        } catch (err) {
          console.warn(`[Engine] ${provider.name}/${dimensionId} failed: ${err.message}`);
          return {
            provider: provider.name, dimensionId,
            result: { score: rubric.dimensions[dimensionId].floor, feedback: 'Evaluation unavailable.', confidence: 0 },
          };
        }
      })
  );

  const llmResults = await Promise.allSettled(providerJobs);
  const settled    = llmResults
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);

  const llmScores = aggregateProviderScores(settled, aggStrategy);

  const dimensionScores = { ...deterministicScores, ...llmScores };

  // ── Composite score
  const rawComposite = calcComposite(
    Object.fromEntries(Object.entries(dimensionScores).map(([k, v]) => [k, v.score]))
  );

  // ── Security penalty
  const secEvents = (await query(
    `SELECT event_type, severity FROM security_events WHERE session_id = $1`,
    [sessionId]
  )).rows;

  const finalComposite = applySecurityPenalties(rawComposite, secEvents);
  const dimensionFlags = getDimensionFlags(
    Object.fromEntries(Object.entries(dimensionScores).map(([k, v]) => [k, v.score]))
  );
  const humanReview = requiresHumanReview({
    scoreBreakdown: Object.fromEntries(Object.entries(dimensionScores).map(([k, v]) => [k, v.score])),
    securityEvents: secEvents,
  });

  // ── Synthesis (primary provider)
  let overallFeedback = `Composite score: ${finalComposite}/100`;
  if (providers.length) {
    try {
      overallFeedback = await providers[0].synthesize(dimensionScores, context, rubric);
    } catch (err) {
      console.warn('[Engine] Synthesis failed:', err.message);
    }
  }

  // ── Per-provider audit trail
  const providerAudit = {};
  for (const { provider, dimensionId, result } of settled) {
    if (!providerAudit[provider]) providerAudit[provider] = {};
    providerAudit[provider][dimensionId] = result;
  }

  const highlights = Object.values(dimensionScores).map(v => v.highlight).filter(Boolean);
  const concerns   = Object.values(dimensionScores).map(v => v.concern).filter(Boolean);

  const evalResult = {
    compositeScore:   finalComposite,
    rawComposite,
    securityDeduction: rawComposite - finalComposite,
    scoreBreakdown:   Object.fromEntries(Object.entries(dimensionScores).map(([k, v]) => [k, v.score])),
    dimensionFeedback:Object.fromEntries(Object.entries(dimensionScores).map(([k, v]) => [k, v.feedback])),
    dimensionFlags,
    highlights,
    concerns,
    overallFeedback,
    humanReview,
    rubricVersion:    rubric.version,
    providers:        providerNames,
    evaluatedAt:      new Date().toISOString(),
  };

  // ── Persist
  await query(
    `UPDATE evaluation_sessions
     SET evaluation_result = $1, provider_results = $2, rubric_version = $3,
         status = 'completed', completed_at = NOW()
     WHERE id = $4`,
    [JSON.stringify(evalResult), JSON.stringify(providerAudit), rubric.version, sessionId]
  );

  await query(
    `UPDATE candidates
     SET score = $1, score_breakdown = $2, status = 'completed',
         last_activity = NOW(), updated_at = NOW()
     WHERE id = $3`,
    [finalComposite, JSON.stringify(evalResult.scoreBreakdown), candidateId]
  );

  await query(
    `INSERT INTO candidate_activity_log (candidate_id, status, note)
     VALUES ($1, 'completed', $2)`,
    [candidateId, `AI evaluation complete — ${finalComposite}/100 (${providerNames.join(', ')}) | rubric v${rubric.version}`]
  );

  if (humanReview.required) {
    await query(
      `UPDATE candidates SET status = 'needs_review' WHERE id = $1`,
      [candidateId]
    );
    console.log(`[Engine] ⚠ Session ${sessionId} flagged for human review: ${humanReview.triggers.join(', ')}`);
  }

  console.log(`[Engine] ✓ Session ${sessionId} → ${finalComposite}/100 (raw: ${rawComposite}, security deduction: ${rawComposite - finalComposite})`);
  return evalResult;
}
