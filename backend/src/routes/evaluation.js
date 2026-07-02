import { Router } from 'express';
import { query } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';
import { runEvaluation } from '../evaluation/evaluator.js';

const router = Router();

// POST /api/evaluation/sessions  — candidate starts their test session
// Called from the candidate test page (no auth — validated by invitation token)
router.post('/sessions', async (req, res, next) => {
  try {
    const { invitationToken, testId } = req.body;
    if (!invitationToken) return res.status(400).json({ error: 'invitationToken is required' });

    const invResult = await query(
      `SELECT i.id, i.candidate_id, i.test_id, i.status, i.expires_at
       FROM invitations i WHERE i.invitation_token = $1`,
      [invitationToken]
    );

    if (!invResult.rows.length) return res.status(404).json({ error: 'Invitation not found' });
    const inv = invResult.rows[0];

    if (new Date(inv.expires_at) < new Date()) {
      return res.status(410).json({ error: 'Invitation expired' });
    }

    // Mark invitation accepted & candidate in_progress
    await query(`UPDATE invitations SET status = 'accepted' WHERE id = $1`, [inv.id]);
    await query(
      `UPDATE candidates SET status = 'in_progress', last_activity = NOW() WHERE id = $1`,
      [inv.candidate_id]
    );
    await query(
      `INSERT INTO candidate_activity_log (candidate_id, status, note)
       VALUES ($1, 'in_progress', 'Candidate started the test')`,
      [inv.candidate_id]
    );

    // Create evaluation session
    const sessionResult = await query(
      `INSERT INTO evaluation_sessions (candidate_id, test_id, invitation_id)
       VALUES ($1, $2, $3)
       RETURNING id, started_at`,
      [inv.candidate_id, inv.test_id, inv.id]
    );

    const session = sessionResult.rows[0];
    res.status(201).json({ sessionId: session.id, startedAt: session.started_at });
  } catch (err) {
    next(err);
  }
});

// POST /api/evaluation/sessions/:sessionId/telemetry  — stream events during test
router.post('/sessions/:sessionId/telemetry', async (req, res, next) => {
  try {
    const { events } = req.body; // Array of { type, timestamp, payload }
    if (!Array.isArray(events)) return res.status(400).json({ error: 'events must be an array' });

    await query(
      `UPDATE evaluation_sessions
       SET telemetry = telemetry || $1::jsonb
       WHERE id = $2`,
      [JSON.stringify(events), req.params.sessionId]
    );

    res.json({ received: events.length });
  } catch (err) {
    next(err);
  }
});

// POST /api/evaluation/sessions/:sessionId/submit  — candidate submits
router.post('/sessions/:sessionId/submit', async (req, res, next) => {
  try {
    const { finalCode, testResults } = req.body;

    const sessionResult = await query(
      `SELECT es.*, i.candidate_id, i.test_id
       FROM evaluation_sessions es
       LEFT JOIN invitations i ON i.id = es.invitation_id
       WHERE es.id = $1`,
      [req.params.sessionId]
    );

    if (!sessionResult.rows.length) return res.status(404).json({ error: 'Session not found' });
    const session = sessionResult.rows[0];

    // Add final submission to telemetry
    await query(
      `UPDATE evaluation_sessions
       SET telemetry = telemetry || $1::jsonb,
           status = 'completed',
           completed_at = NOW()
       WHERE id = $2`,
      [JSON.stringify([{ type: 'submission', timestamp: new Date().toISOString(), payload: { finalCode, testResults } }]), session.id]
    );

    // Update invitation + candidate status
    await query(`UPDATE invitations SET status = 'completed', submitted_at = NOW() WHERE id = $1`, [session.invitation_id]);
    await query(`UPDATE candidates SET status = 'completed', last_activity = NOW() WHERE id = $1`, [session.candidate_id]);
    await query(
      `INSERT INTO candidate_activity_log (candidate_id, status, note) VALUES ($1, 'completed', 'Test submitted')`,
      [session.candidate_id]
    );

    // Kick off async LangGraph evaluation (don't block the response)
    runEvaluation(session.id, session.candidate_id, session.test_id).catch(err =>
      console.error('[Evaluation] Background evaluation failed:', err)
    );

    res.json({ success: true, message: 'Submission received. Evaluation in progress.' });
  } catch (err) {
    next(err);
  }
});

// GET /api/evaluation/sessions/:sessionId  — recruiter polls for results
router.get('/sessions/:sessionId', authenticate, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT es.id, es.status, es.started_at, es.completed_at, es.evaluation_result
       FROM evaluation_sessions es
       JOIN tests t ON t.id = es.test_id
       WHERE es.id = $1 AND t.recruiter_id = $2`,
      [req.params.sessionId, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Session not found' });
    res.json({ session: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

export default router;
