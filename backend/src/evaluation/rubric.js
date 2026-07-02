/**
 * HireOS Scoring Rubric — Ethical Parameter Registry
 *
 * EVERY numerical parameter in the evaluation system is declared here.
 * This is the single source of truth for all scoring bounds, weights,
 * and thresholds. No magic numbers anywhere else in the codebase.
 *
 * Design principles:
 *  1. Transparency  — every parameter has a `rationale` field explaining why
 *  2. Boundedness   — every score has floor + ceiling; no runaway scores
 *  3. Fairness      — floor prevents bias against candidates who had errors
 *  4. Auditability  — rubric version is stored with every evaluation result
 *  5. Extensibility — adding a new dimension requires only adding it here
 *
 * Future multi-model: providers read this rubric and score within its bounds.
 * Cross-model evaluation: each provider produces a ProviderResult, the engine
 * aggregates them using the `aggregation` strategy below.
 */

export const RUBRIC = {
  version: '1.0.0',

  // ─── Scoring Dimensions ──────────────────────────────────────────────────
  // weight must sum to 1.0 exactly
  dimensions: {
    promptQuality: {
      id:            'promptQuality',
      label:         'Prompt Quality',
      description:   'How precisely and iteratively the candidate directed AI models',
      weight:         0.25,
      maxRaw:        20,   // points this dimension can contribute
      floor:          2,   // min score if ≥1 prompt was sent (never zero punish)
      ceiling:       20,
      failThreshold:  4,   // below → dimension:fail flag
      passThreshold: 12,
      rationale: `
        Prompt quality is the primary signal of AI-native skill.
        Floor=2 prevents penalising candidates who sent few but highly effective prompts.
        Weight=0.25 is highest because this is the core differentiator vs. HackerRank.
      `,
    },

    errorRecovery: {
      id:            'errorRecovery',
      label:         'Error Recovery',
      description:   'Ability to diagnose and recover from AI mistakes, hallucinations, and runtime errors',
      weight:         0.20,
      maxRaw:        20,
      floor:          8,   // if no errors occurred, a floor of 8 reflects clean execution
      ceiling:       20,
      failThreshold:  4,
      passThreshold: 12,
      rationale: `
        Floor=8 for zero-error sessions (clean run is a valid positive signal).
        Prevents over-penalising candidates whose code worked first time.
      `,
    },

    outputCorrectness: {
      id:            'outputCorrectness',
      label:         'Output Correctness',
      description:   'Test case pass rate — deterministic, model-independent',
      weight:         0.25,
      maxRaw:        20,
      floor:          0,   // zero test passes = zero score; no floor (objective metric)
      ceiling:       20,
      failThreshold:  6,
      passThreshold: 14,
      rationale: `
        Deterministic — not AI-scored. No floor because test pass rate is objective.
        Weight=0.25 matches promptQuality: a brilliant prompt that produces wrong output
        should still be penalised.
      `,
    },

    codeQuality: {
      id:            'codeQuality',
      label:         'Code Quality',
      description:   'Readability, structure, error handling, and thoughtful AI-code integration',
      weight:         0.15,
      maxRaw:        20,
      floor:          3,
      ceiling:       20,
      failThreshold:  4,
      passThreshold: 11,
      rationale: `
        Lower weight (0.15) than prompt/correctness because this is AI-augmented work —
        we reward the human judgment shown via Accept/Reject/Modify, not raw syntax.
        Floor=3 prevents penalising AI-generated code that is functional but not "clean".
      `,
    },

    executionEfficiency: {
      id:            'executionEfficiency',
      label:         'Execution Efficiency',
      description:   'Time-to-solution, iteration discipline, and productive use of the sandbox',
      weight:         0.15,
      maxRaw:        20,
      floor:          5,
      ceiling:       20,
      failThreshold:  4,
      passThreshold: 11,
      rationale: `
        Time pressure is real in hiring. Floor=5 ensures speed alone doesn't crush a
        methodical candidate. Ceiling=20 caps so we don't unfairly reward luck.
      `,
    },
  },

  // ─── Composite Thresholds ─────────────────────────────────────────────────
  composite: {
    max:              100,
    passMark:          50,   // configurable per-test via test.passMark
    meritMark:         70,
    honorableMention:  80,
    exceptional:       90,
  },

  // ─── Security Penalty System ──────────────────────────────────────────────
  // Security incidents reduce the composite score. Every penalty is bounded.
  securityPenalties: {
    TAB_SWITCH:           { points: 2,  cap: 10, rationale: 'Repeated tab switching = likely distraction or resource lookup' },
    FACE_NOT_DETECTED:    { points: 3,  cap: 15, rationale: 'Face not in frame = possible candidate substitution risk' },
    MULTIPLE_FACES:       { points: 5,  cap: 20, rationale: 'Multiple faces = possible unauthorized assistance' },
    COPY_PASTE:           { points: 2,  cap: 6,  rationale: 'Copy-paste from outside = possible external resource' },
    WINDOW_BLUR:          { points: 1,  cap: 5,  rationale: 'Window focus loss' },
    CAMERA_DISABLED:      { points: 10, cap: 10, rationale: 'Disabling camera after enabling is a critical signal' },
    BIOMETRIC_ANOMALY:    { points: 3,  cap: 10, rationale: 'Keystroke pattern shift may indicate candidate substitution' },
  },
  // Ethical bound: total security penalty can never exceed this % of composite
  maxSecurityPenaltyPct: 0.20,  // 20 points max deduction regardless of incidents

  // ─── Multi-Provider Aggregation ───────────────────────────────────────────
  // Used when multiple AI providers evaluate the same session
  aggregation: {
    strategy:            'weighted_average',  // 'weighted_average' | 'consensus' | 'highest' | 'lowest'
    // For future: 'consensus' uses all providers and flags outliers
    confidenceFloor:     0.60,   // provider confidence below this → score excluded
    outliersThreshold:   0.30,   // if two providers differ by >30%, flag for human review
    humanReviewTriggers: [
      'outlier_scores',
      'all_dimensions_fail',
      'security_critical',
      'provider_disagreement',
    ],
  },

  // ─── Dimension Weights Validation ─────────────────────────────────────────
  // Called on startup to ensure weights are consistent
  validate() {
    const sum = Object.values(this.dimensions).reduce((s, d) => s + d.weight, 0);
    if (Math.abs(sum - 1.0) > 0.001) {
      throw new Error(`Rubric weights must sum to 1.0 — got ${sum.toFixed(4)}`);
    }
    return true;
  },
};

RUBRIC.validate();

/**
 * Apply rubric bounds to a raw score from an evaluator provider.
 * Ensures floor, ceiling, and reasonable default if provider errors.
 */
export function applyBounds(dimensionId, rawScore) {
  const dim = RUBRIC.dimensions[dimensionId];
  if (!dim) return rawScore;
  if (rawScore === null || rawScore === undefined || isNaN(rawScore)) {
    return Math.round((dim.floor + dim.ceiling) / 2);
  }
  return Math.min(dim.ceiling, Math.max(dim.floor, Math.round(rawScore)));
}

/**
 * Calculate composite score from dimension scores.
 * Weights come from rubric; result is bounded [0, 100].
 */
export function calcComposite(dimensionScores) {
  let total = 0;
  for (const [id, dim] of Object.entries(RUBRIC.dimensions)) {
    const raw = dimensionScores[id] ?? dim.floor;
    const bounded = applyBounds(id, raw);
    // Each dimension's max raw contribution to 100:
    // weight × (bounded / maxRaw) × 100
    total += dim.weight * (bounded / dim.maxRaw) * 100;
  }
  return Math.min(100, Math.max(0, Math.round(total)));
}

/**
 * Apply security penalties to composite score.
 * Penalties are bounded by maxSecurityPenaltyPct of compositeMax.
 */
export function applySecurityPenalties(composite, securityEvents) {
  if (!securityEvents || securityEvents.length === 0) return composite;

  const maxDeduction = Math.round(RUBRIC.composite.max * RUBRIC.maxSecurityPenaltyPct);
  let totalDeduction = 0;

  const counts = {};
  for (const event of securityEvents) {
    const type = event.event_type || event.eventType;
    counts[type] = (counts[type] || 0) + 1;
  }

  for (const [type, count] of Object.entries(counts)) {
    const penalty = RUBRIC.securityPenalties[type];
    if (!penalty) continue;
    const deduction = Math.min(penalty.cap, count * penalty.points);
    totalDeduction += deduction;
  }

  const bounded = Math.min(maxDeduction, totalDeduction);
  return Math.max(0, composite - bounded);
}

/**
 * Flag which dimensions failed / passed.
 */
export function getDimensionFlags(dimensionScores) {
  const flags = {};
  for (const [id, dim] of Object.entries(RUBRIC.dimensions)) {
    const score = dimensionScores[id] ?? 0;
    flags[id] = {
      score,
      status: score >= dim.passThreshold ? 'pass'
            : score >= dim.failThreshold ? 'borderline'
            : 'fail',
    };
  }
  return flags;
}

/**
 * Determine if a result should be flagged for human review.
 */
export function requiresHumanReview(result) {
  const triggers = [];
  const flags = getDimensionFlags(result.scoreBreakdown || {});
  const failCount = Object.values(flags).filter(f => f.status === 'fail').length;
  if (failCount >= 3) triggers.push('all_dimensions_fail');
  if ((result.securityEvents || []).some(e => e.severity === 'critical')) {
    triggers.push('security_critical');
  }
  return { required: triggers.length > 0, triggers };
}
