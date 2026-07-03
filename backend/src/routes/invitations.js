import { Router } from 'express';
import { query } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// ─── GET /api/invitations/token/:token — public, candidate-facing ─────────────
router.get('/token/:token', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
         i.id, i.test_id, i.candidate_id, i.candidate_email, i.candidate_name,
         i.invitation_token, i.status, i.invited_at, i.submitted_at, i.expires_at,
         t.id AS t_id, t.name AS t_name, t.role AS t_role,
         t.instructions AS t_instructions, t.language AS t_language,
         t.time_limit AS t_time_limit, t.starter_code AS t_starter_code,
         json_agg(
           json_build_object(
             'id', tc.id, 'name', tc.name, 'input', tc.input,
             'expectedOutput', tc.expected_output, 'isHidden', tc.is_hidden
           ) ORDER BY tc.created_at
         ) FILTER (WHERE tc.id IS NOT NULL AND tc.is_hidden = false) AS test_cases
       FROM invitations i
       JOIN tests t ON t.id = i.test_id
       LEFT JOIN test_cases tc ON tc.test_id = t.id
       WHERE i.invitation_token = $1
       GROUP BY i.id, t.id`,
      [req.params.token]
    );

    if (!result.rows.length) return res.status(404).json({ error: 'Invitation not found' });

    const row = result.rows[0];

    if (new Date(row.expires_at) < new Date()) {
      await query(`UPDATE invitations SET status = 'expired' WHERE id = $1`, [row.id]);
      return res.status(410).json({ error: 'This invitation has expired' });
    }

    res.json({
      invitation: {
        id: row.id,
        testId: row.test_id,
        candidateId: row.candidate_id,
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
        language: row.t_language || 'python',
        timeLimit: row.t_time_limit,
        starterCode: row.t_starter_code,
        testConfig: {
          instructions: row.t_instructions,
          testCases: row.test_cases || [],
        },
      },
    });
  } catch (err) { next(err); }
});

// ─── All routes below require auth (recruiter) ────────────────────────────────
router.use(authenticate);

// POST /api/invitations — create invitation for a candidate
router.post('/', async (req, res, next) => {
  try {
    const { testId, candidateEmail, candidateName } = req.body;
    if (!testId || !candidateEmail || !candidateName) {
      return res.status(400).json({ error: 'testId, candidateEmail, and candidateName are required' });
    }

    // Verify test belongs to recruiter
    const testCheck = await query(
      `SELECT id, name, role FROM tests WHERE id = $1 AND recruiter_id = $2`,
      [testId, req.user.id]
    );
    if (!testCheck.rows.length) return res.status(404).json({ error: 'Test not found' });

    // Check for existing active invitation to same email for same test
    const existing = await query(
      `SELECT id, invitation_token FROM invitations
       WHERE test_id = $1 AND candidate_email = $2 AND status NOT IN ('expired', 'revoked')`,
      [testId, candidateEmail]
    );
    if (existing.rows.length) {
      const token = existing.rows[0].invitation_token;
      return res.status(409).json({
        error: 'An active invitation already exists for this email',
        publicLink: `/test/${testId}?token=${token}`,
        invitationToken: token,
      });
    }

    // Create candidate record
    const test = testCheck.rows[0];
    const candidateResult = await query(
      `INSERT INTO candidates (test_id, name, email, role, status)
       VALUES ($1, $2, $3, $4, 'invited')
       RETURNING id`,
      [testId, candidateName, candidateEmail, test.role || null]
    );
    const candidateId = candidateResult.rows[0].id;

    await query(
      `INSERT INTO candidate_activity_log (candidate_id, status, note) VALUES ($1, 'invited', 'Invitation sent')`,
      [candidateId]
    );

    // Create invitation (DB default generates token + expires_at)
    const invResult = await query(
      `INSERT INTO invitations (test_id, candidate_id, candidate_email, candidate_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, invitation_token, expires_at`,
      [testId, candidateId, candidateEmail, candidateName]
    );

    const inv = invResult.rows[0];
    const publicLink = `${process.env.REPLIT_DEV_DOMAIN || ''}/test/${testId}?token=${inv.invitation_token}`;

    res.status(201).json({
      invitationToken: inv.invitation_token,
      publicLink,
      expiresAt: inv.expires_at,
      candidateId,
    });
  } catch (err) { next(err); }
});

// GET /api/invitations?testId=xxx — list all invitations for recruiter
router.get('/', async (req, res, next) => {
  try {
    const { testId } = req.query;
    const result = await query(
      `SELECT
         i.id, i.test_id, i.candidate_id, i.candidate_email, i.candidate_name,
         i.invitation_token, i.status, i.invited_at, i.submitted_at, i.expires_at,
         t.name AS test_name, t.role AS test_role,
         c.score AS candidate_score
       FROM invitations i
       JOIN tests t ON t.id = i.test_id
       LEFT JOIN candidates c ON c.id = i.candidate_id
       WHERE t.recruiter_id = $1 ${testId ? 'AND i.test_id = $2' : ''}
       ORDER BY i.invited_at DESC`,
      testId ? [req.user.id, testId] : [req.user.id]
    );
    res.json({ invitations: result.rows.map(formatInvitation) });
  } catch (err) { next(err); }
});

// PATCH /api/invitations/:id/revoke — mark as revoked
router.patch('/:id/revoke', async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE invitations i SET status = 'revoked'
       FROM tests t
       WHERE i.id = $1 AND i.test_id = t.id AND t.recruiter_id = $2
       RETURNING i.id`,
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Invitation not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// POST /api/invitations/:id/resend — reset expiry to 7 days from now
router.post('/:id/resend', async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE invitations i
       SET status = 'pending', expires_at = NOW() + INTERVAL '7 days'
       FROM tests t
       WHERE i.id = $1 AND i.test_id = t.id AND t.recruiter_id = $2
         AND i.status NOT IN ('submitted')
       RETURNING i.id, i.invitation_token, i.test_id, i.expires_at`,
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Invitation not found or already submitted' });
    const row = result.rows[0];
    const publicLink = `${process.env.REPLIT_DEV_DOMAIN || ''}/test/${row.test_id}?token=${row.invitation_token}`;
    res.json({ ok: true, publicLink, expiresAt: row.expires_at });
  } catch (err) { next(err); }
});

// ─── Helper ───────────────────────────────────────────────────────────────────
function formatInvitation(i) {
  return {
    id: i.id,
    testId: i.test_id,
    candidateId: i.candidate_id,
    candidateEmail: i.candidate_email,
    candidateName: i.candidate_name,
    invitationToken: i.invitation_token,
    status: i.status,
    invitedAt: i.invited_at,
    submittedAt: i.submitted_at,
    expiresAt: i.expires_at,
    testName: i.test_name,
    testRole: i.test_role,
    candidateScore: i.candidate_score,
  };
}

export default router;
