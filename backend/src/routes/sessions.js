/**
 * Sessions Route — Session Replay data for recruiters
 *
 * GET /api/sessions/:candidateId/replay
 *   Returns a merged, sorted timeline of telemetry events + security events
 *   plus final code snapshot, evaluation result, and session metadata.
 *   Auth-gated: only the recruiter who owns the test can view the replay.
 */

import { Router } from 'express';
import { query } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// GET /api/sessions/:candidateId/replay
router.get('/:candidateId/replay', async (req, res, next) => {
  try {
    const { candidateId } = req.params;

    // 1. Verify recruiter owns the test this candidate belongs to
    const ownerCheck = await query(
      `SELECT c.id, c.name, c.email, c.score, c.status,
              t.name AS test_name, t.language
       FROM candidates c
       JOIN tests t ON t.id = c.test_id
       WHERE c.id = $1 AND t.recruiter_id = $2`,
      [candidateId, req.user.id]
    );
    if (!ownerCheck.rows.length) {
      return res.status(404).json({ error: 'Candidate not found or access denied' });
    }
    const candidate = ownerCheck.rows[0];

    // 2. Fetch evaluation session (most recent active/completed)
    const sessionResult = await query(
      `SELECT id, status, started_at, completed_at,
              telemetry, sandbox_files, evaluation_result, rubric_version
       FROM evaluation_sessions
       WHERE candidate_id = $1
       ORDER BY started_at DESC LIMIT 1`,
      [candidateId]
    );

    if (!sessionResult.rows.length) {
      return res.json({
        candidate: formatCandidate(candidate),
        session: null,
        timeline: [],
        snapshots: [],
        securityEvents: [],
        evaluationResult: null,
        finalFiles: {},
      });
    }

    const session = sessionResult.rows[0];
    const telemetry = Array.isArray(session.telemetry) ? session.telemetry : [];

    // 3. Fetch security events for this session
    const secResult = await query(
      `SELECT id, event_type, severity, payload, ts
       FROM security_events
       WHERE candidate_id = $1
       ORDER BY ts ASC`,
      [candidateId]
    );

    // 4. Fetch sandbox snapshots (code state over time)
    const snapResult = await query(
      `SELECT id, files, snapshot_at
       FROM sandbox_snapshots
       WHERE session_id = $1
       ORDER BY snapshot_at ASC`,
      [session.id]
    );

    // 5. Merge telemetry + security events into a unified timeline
    const telemetryEvents = telemetry.map((e, i) => ({
      id: `tel-${i}`,
      source: 'telemetry',
      eventType: e.eventType || e.event_type || 'UNKNOWN',
      timestamp: Number(e.timestamp) || Date.now(),
      payload: e.payload || {},
    }));

    const securityEvents = secResult.rows.map(e => ({
      id: `sec-${e.id}`,
      source: 'security',
      eventType: e.event_type,
      severity: e.severity,
      timestamp: new Date(e.ts).getTime(),
      payload: e.payload || {},
    }));

    const timeline = [...telemetryEvents, ...securityEvents].sort(
      (a, b) => a.timestamp - b.timestamp
    );

    const snapshots = snapResult.rows.map(s => ({
      id: s.id,
      files: s.files || {},
      snapshotAt: new Date(s.snapshot_at).getTime(),
    }));

    res.json({
      candidate: formatCandidate(candidate),
      session: {
        id: session.id,
        status: session.status,
        startedAt: session.started_at,
        completedAt: session.completed_at,
        durationMs: session.completed_at && session.started_at
          ? new Date(session.completed_at) - new Date(session.started_at)
          : null,
      },
      timeline,
      snapshots,
      securityEvents: secResult.rows.map(e => ({
        id: e.id,
        eventType: e.event_type,
        severity: e.severity,
        payload: e.payload,
        ts: e.ts,
      })),
      evaluationResult: session.evaluation_result || null,
      finalFiles: session.sandbox_files || {},
    });
  } catch (err) { next(err); }
});

function formatCandidate(c) {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    score: c.score,
    status: c.status,
    testName: c.test_name,
    language: c.language,
  };
}

export default router;
