import { Router } from 'express';
import { query } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

const CANDIDATE_SELECT = `
  SELECT
    c.id, c.name, c.email, c.role, c.score, c.status,
    c.last_activity, c.score_breakdown, c.test_details,
    t.name AS test_name,
    json_agg(
      json_build_object('id', cal.id, 'status', cal.status, 'timestamp', cal.created_at, 'note', cal.note)
      ORDER BY cal.created_at DESC
    ) FILTER (WHERE cal.id IS NOT NULL) AS activity_log
  FROM candidates c
  LEFT JOIN tests t ON t.id = c.test_id
  LEFT JOIN candidate_activity_log cal ON cal.candidate_id = c.id
`;

// GET /api/candidates
router.get('/', async (req, res, next) => {
  try {
    const result = await query(
      `${CANDIDATE_SELECT}
       WHERE t.recruiter_id = $1
       GROUP BY c.id, t.name
       ORDER BY c.last_activity DESC`,
      [req.user.id]
    );
    res.json({ candidates: result.rows.map(formatCandidate) });
  } catch (err) {
    next(err);
  }
});

// GET /api/candidates/:id
router.get('/:id', async (req, res, next) => {
  try {
    const result = await query(
      `${CANDIDATE_SELECT}
       WHERE c.id = $1
       GROUP BY c.id, t.name`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Candidate not found' });
    res.json({ candidate: formatCandidate(result.rows[0]) });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/candidates/:id/status
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const VALID = ['invited', 'in_progress', 'completed', 'reviewed', 'hired', 'rejected'];
    if (!VALID.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${VALID.join(', ')}` });
    }

    const result = await query(
      `UPDATE candidates SET status = $1, last_activity = NOW(), updated_at = NOW()
       WHERE id = $2
       RETURNING id`,
      [status, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Candidate not found' });

    // Append to activity log
    await query(
      `INSERT INTO candidate_activity_log (candidate_id, status, note) VALUES ($1, $2, $3)`,
      [req.params.id, status, note || null]
    );

    // Return full updated candidate
    const full = await query(
      `${CANDIDATE_SELECT} WHERE c.id = $1 GROUP BY c.id, t.name`,
      [req.params.id]
    );
    res.json({ candidate: formatCandidate(full.rows[0]) });
  } catch (err) {
    next(err);
  }
});

function formatCandidate(c) {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    role: c.role,
    score: c.score,
    status: c.status,
    lastActivity: c.last_activity,
    testName: c.test_name,
    scoreBreakdown: c.score_breakdown || {},
    testDetails: c.test_details || {},
    activityLog: c.activity_log || [],
  };
}

export default router;
