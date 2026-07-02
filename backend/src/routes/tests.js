import { Router } from 'express';
import { query } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// GET /api/tests
router.get('/', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
         t.id, t.name, t.role, t.status, t.instructions, t.created_at,
         COUNT(DISTINCT c.id) FILTER (WHERE c.id IS NOT NULL) AS candidates,
         COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'completed') AS completed,
         json_agg(
           json_build_object('id', tc.id, 'name', tc.name, 'input', tc.input, 'expectedOutput', tc.expected_output)
           ORDER BY tc.created_at
         ) FILTER (WHERE tc.id IS NOT NULL) AS test_cases
       FROM tests t
       LEFT JOIN candidates c ON c.test_id = t.id
       LEFT JOIN test_cases tc ON tc.test_id = t.id
       WHERE t.recruiter_id = $1
       GROUP BY t.id
       ORDER BY t.created_at DESC`,
      [req.user.id]
    );

    const tests = result.rows.map(t => ({
      id: t.id,
      name: t.name,
      role: t.role,
      status: t.status,
      createdOn: t.created_at,
      candidates: Number(t.candidates),
      progress: t.candidates > 0
        ? Math.round((Number(t.completed) / Number(t.candidates)) * 100)
        : 0,
      testConfig: {
        instructions: t.instructions,
        testCases: t.test_cases || [],
      },
    }));

    res.json({ tests });
  } catch (err) {
    next(err);
  }
});

// GET /api/tests/:id
router.get('/:id', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
         t.id, t.name, t.role, t.status, t.instructions, t.created_at,
         json_agg(
           json_build_object('id', tc.id, 'name', tc.name, 'input', tc.input, 'expectedOutput', tc.expected_output)
           ORDER BY tc.created_at
         ) FILTER (WHERE tc.id IS NOT NULL) AS test_cases
       FROM tests t
       LEFT JOIN test_cases tc ON tc.test_id = t.id
       WHERE t.id = $1 AND t.recruiter_id = $2
       GROUP BY t.id`,
      [req.params.id, req.user.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const t = result.rows[0];
    res.json({
      test: {
        id: t.id,
        name: t.name,
        role: t.role,
        status: t.status,
        createdOn: t.created_at,
        testConfig: { instructions: t.instructions, testCases: t.test_cases || [] },
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/tests/:id/candidates
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
  } catch (err) {
    next(err);
  }
});

// POST /api/tests
router.post('/', async (req, res, next) => {
  try {
    const { name, role, instructions, testCases = [] } = req.body;
    if (!name) return res.status(400).json({ error: 'Test name is required' });

    const testResult = await query(
      `INSERT INTO tests (name, role, instructions, status, recruiter_id)
       VALUES ($1, $2, $3, 'active', $4)
       RETURNING id, name, role, status, instructions, created_at`,
      [name, role || null, instructions || null, req.user.id]
    );

    const test = testResult.rows[0];

    if (testCases.length) {
      for (const tc of testCases) {
        await query(
          `INSERT INTO test_cases (test_id, name, input, expected_output) VALUES ($1, $2, $3, $4)`,
          [test.id, tc.name, tc.input || null, tc.expectedOutput || null]
        );
      }
    }

    const tcResult = await query(
      `SELECT id, name, input, expected_output AS "expectedOutput" FROM test_cases WHERE test_id = $1`,
      [test.id]
    );

    res.status(201).json({
      test: {
        id: test.id,
        name: test.name,
        role: test.role,
        status: test.status,
        createdOn: test.created_at,
        candidates: 0,
        progress: 0,
        testConfig: { instructions: test.instructions, testCases: tcResult.rows },
      },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/tests/:id
router.patch('/:id', async (req, res, next) => {
  try {
    const { name, role, status, instructions } = req.body;
    const result = await query(
      `UPDATE tests SET
         name = COALESCE($1, name),
         role = COALESCE($2, role),
         status = COALESCE($3, status),
         instructions = COALESCE($4, instructions),
         updated_at = NOW()
       WHERE id = $5 AND recruiter_id = $6
       RETURNING id, name, role, status, instructions, created_at`,
      [name, role, status, instructions, req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Test not found' });
    res.json({ test: result.rows[0] });
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
