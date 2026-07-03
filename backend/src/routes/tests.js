import { Router } from 'express';
import { query } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// ─── GET /api/tests ──────────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
         t.id, t.name, t.role, t.status, t.instructions,
         t.language, t.time_limit, t.starter_code, t.created_at,
         COUNT(DISTINCT c.id) FILTER (WHERE c.id IS NOT NULL) AS candidates,
         COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'completed') AS completed,
         json_agg(
           json_build_object(
             'id', tc.id, 'name', tc.name, 'input', tc.input,
             'expectedOutput', tc.expected_output, 'isHidden', tc.is_hidden, 'weight', tc.weight
           ) ORDER BY tc.created_at
         ) FILTER (WHERE tc.id IS NOT NULL) AS test_cases
       FROM tests t
       LEFT JOIN candidates c ON c.test_id = t.id
       LEFT JOIN test_cases tc ON tc.test_id = t.id
       WHERE t.recruiter_id = $1
       GROUP BY t.id
       ORDER BY t.created_at DESC`,
      [req.user.id]
    );

    const tests = result.rows.map(formatTest);
    res.json({ tests });
  } catch (err) { next(err); }
});

// ─── GET /api/tests/:id ──────────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
         t.id, t.name, t.role, t.status, t.instructions,
         t.language, t.time_limit, t.starter_code, t.created_at,
         json_agg(
           json_build_object(
             'id', tc.id, 'name', tc.name, 'input', tc.input,
             'expectedOutput', tc.expected_output, 'isHidden', tc.is_hidden, 'weight', tc.weight
           ) ORDER BY tc.created_at
         ) FILTER (WHERE tc.id IS NOT NULL) AS test_cases
       FROM tests t
       LEFT JOIN test_cases tc ON tc.test_id = t.id
       WHERE t.id = $1 AND t.recruiter_id = $2
       GROUP BY t.id`,
      [req.params.id, req.user.id]
    );

    if (!result.rows.length) return res.status(404).json({ error: 'Test not found' });
    res.json({ test: formatTest(result.rows[0]) });
  } catch (err) { next(err); }
});

// ─── GET /api/tests/:id/candidates ──────────────────────────────────────────
router.get('/:id/candidates', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
         c.id, c.name, c.email, c.role, c.score, c.status,
         c.last_activity, c.score_breakdown, c.test_details,
         t.name AS test_name,
         json_agg(
           json_build_object('id', cal.id, 'status', cal.status, 'timestamp', cal.created_at, 'note', cal.note)
           ORDER BY cal.created_at DESC
         ) FILTER (WHERE cal.id IS NOT NULL) AS activity_log
       FROM candidates c
       JOIN tests t ON t.id = c.test_id
       LEFT JOIN candidate_activity_log cal ON cal.candidate_id = c.id
       WHERE c.test_id = $1
       GROUP BY c.id, t.name
       ORDER BY c.last_activity DESC`,
      [req.params.id]
    );

    res.json({ candidates: result.rows.map(formatCandidate) });
  } catch (err) { next(err); }
});

// ─── POST /api/tests ─────────────────────────────────────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const {
      name, role, instructions, language = 'python',
      time_limit, starter_code, testCases = [],
    } = req.body;

    if (!name) return res.status(400).json({ error: 'Test name is required' });

    // Convert time_limit to minutes if needed
    const timeLimitMinutes = time_limit ? Number(time_limit) : null;

    const testResult = await query(
      `INSERT INTO tests (name, role, instructions, language, time_limit, starter_code, status, recruiter_id)
       VALUES ($1, $2, $3, $4, $5, $6, 'active', $7)
       RETURNING id, name, role, status, instructions, language, time_limit, starter_code, created_at`,
      [name, role || null, instructions || null, language, timeLimitMinutes, starter_code || null, req.user.id]
    );

    const test = testResult.rows[0];

    if (testCases.length) {
      for (const tc of testCases) {
        await query(
          `INSERT INTO test_cases (test_id, name, input, expected_output, is_hidden, weight)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            test.id,
            tc.name || `Case ${testCases.indexOf(tc) + 1}`,
            tc.input || null,
            tc.expectedOutput || null,
            tc.isHidden ?? false,
            tc.weight != null ? Number(tc.weight) : 1.0,
          ]
        );
      }
    }

    const tcResult = await query(
      `SELECT id, name, input, expected_output AS "expectedOutput", is_hidden AS "isHidden", weight
       FROM test_cases WHERE test_id = $1 ORDER BY created_at`,
      [test.id]
    );

    res.status(201).json({
      test: {
        id: test.id,
        name: test.name,
        role: test.role,
        status: test.status,
        language: test.language,
        timeLimit: test.time_limit,
        starterCode: test.starter_code,
        createdOn: test.created_at,
        candidates: 0,
        progress: 0,
        testConfig: { instructions: test.instructions, testCases: tcResult.rows },
      },
    });
  } catch (err) { next(err); }
});

// ─── PATCH /api/tests/:id ────────────────────────────────────────────────────
router.patch('/:id', async (req, res, next) => {
  try {
    const { name, role, status, instructions, language, time_limit, starter_code } = req.body;

    const result = await query(
      `UPDATE tests SET
         name         = COALESCE($1, name),
         role         = COALESCE($2, role),
         status       = COALESCE($3, status),
         instructions = COALESCE($4, instructions),
         language     = COALESCE($5, language),
         time_limit   = COALESCE($6, time_limit),
         starter_code = COALESCE($7, starter_code),
         updated_at   = NOW()
       WHERE id = $8 AND recruiter_id = $9
       RETURNING id, name, role, status, instructions, language, time_limit, starter_code, created_at`,
      [name, role, status, instructions, language, time_limit, starter_code, req.params.id, req.user.id]
    );

    if (!result.rows.length) return res.status(404).json({ error: 'Test not found' });
    res.json({ test: formatTest(result.rows[0]) });
  } catch (err) { next(err); }
});

// ─── DELETE /api/tests/:id ───────────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await query(
      `DELETE FROM tests WHERE id = $1 AND recruiter_id = $2 RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Test not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTest(t) {
  return {
    id: t.id,
    name: t.name,
    role: t.role,
    status: t.status,
    language: t.language || 'python',
    timeLimit: t.time_limit,
    starterCode: t.starter_code,
    createdOn: t.created_at,
    candidates: Number(t.candidates || 0),
    progress: t.candidates > 0
      ? Math.round((Number(t.completed || 0) / Number(t.candidates)) * 100)
      : 0,
    testConfig: {
      instructions: t.instructions,
      testCases: t.test_cases || [],
    },
  };
}

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
