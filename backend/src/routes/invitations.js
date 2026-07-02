import { Router } from 'express';
import { query } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// GET /api/invitations/token/:token  — public, used by candidate test page
router.get('/token/:token', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
         i.id, i.test_id, i.candidate_id, i.candidate_email, i.candidate_name,
         i.invitation_token, i.status, i.invited_at, i.submitted_at, i.expires_at,
         t.id AS t_id, t.name AS t_name, t.role AS t_role, t.instructions AS t_instructions,
         json_agg(
           json_build_object('id', tc.id, 'name', tc.name, 'input', tc.input, 'expectedOutput', tc.expected_output)
           ORDER BY tc.created_at
         ) FILTER (WHERE tc.id IS NOT NULL) AS test_cases
       FROM invitations i
       JOIN tests t ON t.id = i.test_id
       LEFT JOIN test_cases tc ON tc.test_id = t.id
       WHERE i.invitation_token = $1
       GROUP BY i.id, t.id`,
      [req.params.token]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    const row = result.rows[0];

    if (new Date(row.expires_at) < new Date()) {
      await query(`UPDATE invitations SET status = 'expired' WHERE id = $1`, [row.id]);
      return res.status(410).json({ error: 'This invitation has expired' });
    }

    res.json({
      invitation: {
        id: row.id,
        testId: row.test_id,
        candidateEmail: row.candidate_email,
        candidateName: row.candidate_name,
        invitationToken: row.invitation_token,
        status: row.status,
        invitedAt: row.invited_at,
        submittedAt: row.submitted_at,
        expiresAt: row.expires_at,
      },
      test: {
        id: row.t_id,
        name: row.t_name,
        role: row.t_role,
        testConfig: {
          instructions: row.t_instructions,
          testCases: row.test_cases || [],
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// All routes below require auth (recruiter)
router.use(authenticate);

// POST /api/invitations
router.post('/', async (req, res, next) => {
  try {
    const { testId, candidateEmail, candidateName } = req.body;
    if (!testId || !candidateEmail || !candidateName) {
      return res.status(400).json({ error: 'testId, candidateEmail, and candidateName are required' });
    }

    // Verify test belongs to recruiter
    const testCheck = await query(
      `SELECT id FROM tests WHERE id = $1 AND recruiter_id = $2`,
      [testId, req.user.id]
    );
    if (!testCheck.rows.length) {
      return res.status(404).json({ error: 'Test not found' });
    }

    // Create candidate record
    const testRow = await query(`SELECT name, role FROM tests WHERE id = $1`, [testId]);
    const candidateResult = await query(
      `INSERT INTO candidates (test_id, name, email, role, status)
       VALUES ($1, $2, $3, $4, 'invited')
       RETURNING id`,
      [testId, candidateName, candidateEmail, testRow.rows[0]?.role || null]
    );
    const candidateId = candidateResult.rows[0].id;

    // Log invite activity
    await query(
      `INSERT INTO candidate_activity_log (candidate_id, status, note) VALUES ($1, 'invited', 'Invitation sent')`,
      [candidateId]
    );

    // Create invitation
    const invResult = await query(
      `INSERT INTO invitations (test_id, candidate_id, candidate_email, candidate_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, invitation_token, expires_at`,
      [testId, candidateId, candidateEmail, candidateName]
    );

    const inv = invResult.rows[0];
    const publicLink = `/test/${testId}?token=${inv.invitation_token}`;

    res.status(201).json({
      invitationToken: inv.invitation_token,
      publicLink,
      expiresAt: inv.expires_at,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/invitations?testId=xxx
router.get('/', async (req, res, next) => {
  try {
    const { testId } = req.query;
    const result = await query(
      `SELECT i.* FROM invitations i
       JOIN tests t ON t.id = i.test_id
       WHERE t.recruiter_id = $1 ${testId ? 'AND i.test_id = $2' : ''}
       ORDER BY i.invited_at DESC`,
      testId ? [req.user.id, testId] : [req.user.id]
    );
    res.json({ invitations: result.rows });
  } catch (err) {
    next(err);
  }
});

export default router;
