/**
 * Evaluation Routes — uses the new multi-provider engine
 */
import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/index.js';
import { runEvaluation } from '../evaluation/engine.js';

const router = Router();

// POST /api/evaluation/sessions — start a session when candidate opens the test
router.post('/sessions', async (req, res, next) => {
  try {
    const { candidateId, testId, invitationId } = req.body;
    if (!candidateId || !testId) return res.status(400).json({ error: 'candidateId and testId required' });

    // Check for existing active session
    const existing = await query(
      `SELECT id FROM evaluation_sessions WHERE candidate_id=$1 AND status='active' LIMIT 1`,
      [candidateId]
    );
    if (existing.rows.length) return res.json({ sessionId: existing.rows[0].id, resumed: true });

    const result = await query(
      `INSERT INTO evaluation_sessions (id, candidate_id, test_id, invitation_id)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [uuidv4(), candidateId, testId, invitationId || null]
    );

    await query(
      `UPDATE candidates SET status='in_progress', last_activity=NOW() WHERE id=$1`,
      [candidateId]
    );
    await query(
      `UPDATE invitations SET status='accepted' WHERE id=$1`,
      [invitationId || null]
    );

    res.json({ sessionId: result.rows[0].id, resumed: false });
  } catch (err) { next(err); }
});

// POST /api/evaluation/sessions/:id/telemetry — append events
router.post('/sessions/:id/telemetry', async (req, res, next) => {
  try {
    const { events } = req.body;
    if (!Array.isArray(events)) return res.status(400).json({ error: 'events array required' });
    await query(
      `UPDATE evaluation_sessions SET telemetry = telemetry || $1::jsonb WHERE id=$2`,
      [JSON.stringify(events.map(e => ({ ...e, timestamp: e.timestamp || Date.now() }))), req.params.id]
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// POST /api/evaluation/sessions/:id/submit — submit test, fire evaluation async
router.post('/sessions/:id/submit', async (req, res, next) => {
  try {
    const { candidateId, testId, finalCode, testResults } = req.body;
    const sessionId = req.params.id;

    // Append final submission event
    await query(
      `UPDATE evaluation_sessions
       SET telemetry = telemetry || $1::jsonb, sandbox_files = COALESCE(sandbox_files, '{}') || $2::jsonb
       WHERE id=$3`,
      [
        JSON.stringify([{ eventType: 'SESSION_SUBMITTED', timestamp: Date.now(), payload: { finalCode, testResults } }]),
        JSON.stringify(req.body.files || {}),
        sessionId,
      ]
    );

    // Update invitation
    await query(`UPDATE invitations SET status='completed', submitted_at=NOW() WHERE candidate_id=$1`, [candidateId]);

    res.json({ ok: true, message: 'Submission received. Evaluation in progress.' });

    // Fire-and-forget evaluation with the new engine
    const providers = process.env.GEMINI_API_KEY ? ['gemini'] : [];
    runEvaluation(sessionId, candidateId, testId, { providers }).catch(err =>
      console.error('[Evaluation] Failed:', err.message)
    );
  } catch (err) { next(err); }
});

// GET /api/evaluation/sessions/:id/results — poll for results
router.get('/sessions/:id/results', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT status, evaluation_result, provider_results, rubric_version FROM evaluation_sessions WHERE id=$1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Session not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

export default router;
