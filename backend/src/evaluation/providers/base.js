/**
 * Abstract EvaluatorProvider
 *
 * All evaluation providers must extend this class and implement:
 *   - evaluateDimension(dimensionId, context, rubric)
 *   - synthesize(dimensionScores, context, rubric)
 *
 * The engine calls these methods in a standardised way, enabling:
 *   - Parallel multi-provider evaluation
 *   - Cross-model consensus scoring
 *   - Provider-level auditability
 *   - Future: hot-swapping providers without changing evaluation logic
 */

export class EvaluatorProvider {
  /** Unique identifier for this provider */
  get name() { throw new Error('Provider must implement get name()'); }

  /** Human-readable label */
  get label() { return this.name; }

  /** Which dimensions this provider can score */
  get capabilities() {
    return ['promptQuality', 'errorRecovery', 'codeQuality'];
  }

  /** Whether this provider is configured and ready */
  get isAvailable() { return false; }

  /**
   * Evaluate a single dimension.
   *
   * @param {string} dimensionId - one of rubric dimension ids
   * @param {object} context     - { telemetry, testConfig, files }
   * @param {object} rubric      - the full RUBRIC object
   * @returns {Promise<DimensionResult>}
   */
  async evaluateDimension(dimensionId, context, rubric) {
    throw new Error(`${this.name}: evaluateDimension not implemented`);
  }

  /**
   * Synthesize a human-readable overall assessment.
   *
   * @param {object} dimensionScores - { [dimensionId]: { score, feedback } }
   * @param {object} context
   * @param {object} rubric
   * @returns {Promise<string>} - 2-3 sentence recruiter-facing summary
   */
  async synthesize(dimensionScores, context, rubric) {
    throw new Error(`${this.name}: synthesize not implemented`);
  }
}

/**
 * @typedef {object} DimensionResult
 * @property {number}  score     - raw score (before rubric bounds applied)
 * @property {string}  feedback  - dimension-specific feedback
 * @property {string}  [highlight] - one positive standout observation
 * @property {string}  [concern]   - one main concern
 * @property {number}  [confidence] - 0.0–1.0, provider's confidence in its score
 * @property {string}  [reasoning]  - chain of thought (stored but not shown to candidate)
 */
