/**
 * Security REST API — Biometric & Integrity event ingestion
 *
 * Used as a fallback when WebSocket is not available.
 * Primary path for security events is the /ws/security WebSocket channel.
 */

import { Router } from 'express';
import { query } from '../db/index.js';

const router = Router();

const SEVERITY_MAP = {
  TAB_SWITCH:        'warning',
  FACE_NOT_DETECTED: 'warning',
  MULTIPLE_FACES:    'critical',
  COPY_PASTE:        'warning',
  WINDOW_BLUR:       'info',
  CAMERA_DISABLED:   'critical',
  BIOMETRIC_ANOMALY: 'warning',
  FOCUS_LOST:        'info',
  DEVTOOLS_OPEN:     'critical',
  SESSION_STARTED:   'info',
};

// POST /api/security/event — log a single event
router.post('/event', async (req, res, next) => {
  try {
    const { sessionId, candidateId, eventType, payload } = req.body;
    if (!sessionId || !eventType) {
      return res.status(400).json({ error: 'sessionId and eventType required' });
    }

    const severity = SEVERITY_MAP[eventType] || 'info';

    await query(
      `INSERT INTO security_events (session_id, candidate_id, event_type, severity, payload)
       VALUES ($1, $2, $3, $4, $5)`,
      [sessionId, candidateId || null, eventType, severity, JSON.stringify(payload || {})]
    );

    res.json({ ok: true, severity });
  } catch (err) { next(err); }
});

// POST /api/security/batch — log multiple events at once (beacon API pattern)
router.post('/batch', async (req, res, next) => {
  try {
    const { events } = req.body; // [{ sessionId, candidateId, eventType, payload, ts }]
    if (!Array.isArray(events) || !events.length) {
      return res.status(400).json({ error: 'events array required' });
    }

    const values = events.slice(0, 50).map(e => ({
      session_id:   e.sessionId,
      candidate_id: e.candidateId || null,
      event_type:   e.eventType,
      severity:     SEVERITY_MAP[e.eventType] || 'info',
      payload:      JSON.stringify(e.payload || {}),
    }));

    for (const v of values) {
      await query(
        `INSERT INTO security_events (session_id, candidate_id, event_type, severity, payload)
         VALUES ($1, $2, $3, $4, $5)`,
        [v.session_id, v.candidate_id, v.event_type, v.severity, v.payload]
      );
    }

    res.json({ ok: true, logged: values.length });
  } catch (err) { next(err); }
});

// GET /api/security/report/:sessionId — get all events for a session
router.get('/report/:sessionId', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const result = await query(
      `SELECT event_type, severity, payload, ts
       FROM security_events
       WHERE session_id = $1
       ORDER BY ts ASC`,
      [sessionId]
    );

    const events = result.rows;
    const summary = {
      total:    events.length,
      critical: events.filter(e => e.severity === 'critical').length,
      warning:  events.filter(e => e.severity === 'warning').length,
      byType:   events.reduce((acc, e) => {
        acc[e.event_type] = (acc[e.event_type] || 0) + 1;
        return acc;
      }, {}),
    };

    res.json({ events, summary });
  } catch (err) { next(err); }
});

export default router;
