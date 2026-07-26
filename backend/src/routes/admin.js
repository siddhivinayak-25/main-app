import { Router } from 'express';
import { query } from '../db/index.js';
import { authenticateAdmin, generateAdminToken } from '../middleware/adminAuth.js';

const router = Router();

// Admin credentials — env override recommended; fallback to the values you supplied
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'sv2542004';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '@25SId2004';
const ADMIN_FAVORITE_PERSON = process.env.ADMIN_FAVORITE_PERSON || 'kranti';
const ADMIN_FAVORITE_NUMBER = process.env.ADMIN_FAVORITE_NUMBER || '134';

const ADMIN_DISPLAY = {
  id: 'admin',
  name: 'Supreme Administrator',
  username: ADMIN_USERNAME,
  role: 'admin',
  favoritePerson: ADMIN_FAVORITE_PERSON,
  favoriteNumber: ADMIN_FAVORITE_NUMBER,
};

// ─── POST /api/admin/login ───────────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const { username, password, favoritePerson, favoriteNumber } = req.body;
    if (
      username !== ADMIN_USERNAME ||
      password !== ADMIN_PASSWORD ||
      favoritePerson !== ADMIN_FAVORITE_PERSON ||
      String(favoriteNumber) !== String(ADMIN_FAVORITE_NUMBER)
    ) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const token = generateAdminToken();
    res.json({ admin: ADMIN_DISPLAY, token });
  } catch (err) {
    next(err);
  }
});

// All routes below require admin authentication
router.use(authenticateAdmin);

// ─── GET /api/admin/me ─────────────────────────────────────────────────────────
router.get('/me', (_req, res) => {
  res.json({ admin: ADMIN_DISPLAY });
});

// ─── GET /api/admin/stats ──────────────────────────────────────────────────────
router.get('/stats', async (_req, res, next) => {
  try {
    const [companies, candidates, tests, sessions, invitations, security] = await Promise.all([
      query(`SELECT COUNT(*) AS count FROM users`),
      query(`SELECT COUNT(*) AS count FROM candidates`),
      query(`SELECT COUNT(*) AS count FROM tests`),
      query(`SELECT COUNT(*) AS count FROM evaluation_sessions`),
      query(`SELECT COUNT(*) AS count FROM invitations`),
      query(`SELECT COUNT(*) AS count FROM security_events`),
    ]);

    const candidateStatus = await query(
      `SELECT status, COUNT(*) AS count FROM candidates GROUP BY status`
    );
    const statusCounts = Object.fromEntries(
      candidateStatus.rows.map(r => [r.status, Number(r.count)])
    );

    const avgScore = await query(
      `SELECT ROUND(AVG(score))::int AS avg FROM candidates WHERE score IS NOT NULL`
    );

    res.json({
      stats: {
        companies: Number(companies.rows[0].count),
        candidates: Number(candidates.rows[0].count),
        tests: Number(tests.rows[0].count),
        sessions: Number(sessions.rows[0].count),
        invitations: Number(invitations.rows[0].count),
        securityEvents: Number(security.rows[0].count),
        averageScore: avgScore.rows[0].avg ?? 0,
        candidateStatus: statusCounts,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/admin/companies ─────────────────────────────────────────────────
// Returns every recruiter/hiring company with activity and ownership metrics
router.get('/companies', async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT
         u.id,
         u.name,
         u.email,
         u.role,
         u.job_title,
         u.department,
         u.phone,
         u.timezone,
         u.bio,
         u.joined_on,
         u.created_at,
         COALESCE(t.test_count, 0) AS test_count,
         COALESCE(t.active_test_count, 0) AS active_test_count,
         COALESCE(c.candidate_count, 0) AS candidate_count,
         COALESCE(c.completed_count, 0) AS completed_count,
         COALESCE(i.invitation_count, 0) AS invitation_count,
         COALESCE(c.avg_score, 0) AS avg_score
       FROM users u
       LEFT JOIN (
         SELECT recruiter_id,
                COUNT(*) AS test_count,
                COUNT(*) FILTER (WHERE status = 'active') AS active_test_count
         FROM tests GROUP BY recruiter_id
       ) t ON t.recruiter_id = u.id
       LEFT JOIN (
         SELECT t.recruiter_id,
                COUNT(c.id) AS candidate_count,
                COUNT(c.id) FILTER (WHERE c.status = 'completed') AS completed_count,
                ROUND(AVG(c.score))::int AS avg_score
         FROM candidates c
         JOIN tests t ON t.id = c.test_id
         GROUP BY t.recruiter_id
        ) c ON c.recruiter_id = u.id
        LEFT JOIN (
          SELECT t.recruiter_id, COUNT(i.id) AS invitation_count
          FROM invitations i
          JOIN tests t ON t.id = i.test_id
          GROUP BY t.recruiter_id
        ) i ON i.recruiter_id = u.id
       ORDER BY u.created_at DESC`
    );

    res.json({ companies: result.rows });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/admin/candidates ────────────────────────────────────────────────
router.get('/candidates', async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT
         c.id,
         c.name,
         c.email,
         c.role,
         c.score,
         c.status,
         c.last_activity,
         c.created_at,
         c.score_breakdown,
         c.test_details,
         c.security_flags,
         t.id AS test_id,
         t.name AS test_name,
         u.id AS recruiter_id,
         u.name AS recruiter_name,
         u.email AS recruiter_email,
         COALESCE(s.session_count, 0) AS session_count,
         COALESCE(se.event_count, 0) AS security_event_count
       FROM candidates c
       LEFT JOIN tests t ON t.id = c.test_id
       LEFT JOIN users u ON u.id = t.recruiter_id
       LEFT JOIN (
         SELECT candidate_id, COUNT(*) AS session_count
         FROM evaluation_sessions GROUP BY candidate_id
       ) s ON s.candidate_id = c.id
       LEFT JOIN (
         SELECT candidate_id, COUNT(*) AS event_count
         FROM security_events GROUP BY candidate_id
       ) se ON se.candidate_id = c.id
       ORDER BY c.last_activity DESC`
    );

    res.json({ candidates: result.rows });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/admin/tests ─────────────────────────────────────────────────────
router.get('/tests', async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT
         t.id,
         t.name,
         t.role,
         t.status,
         t.language,
         t.time_limit,
         t.starter_code,
         t.instructions,
         t.created_at,
         t.updated_at,
         u.id AS recruiter_id,
         u.name AS recruiter_name,
         u.email AS recruiter_email,
         COALESCE(c.candidate_count, 0) AS candidate_count,
         COALESCE(c.completed_count, 0) AS completed_count,
         COALESCE(i.invitation_count, 0) AS invitation_count,
         latest_inv.invitation_token AS latest_invitation_token
       FROM tests t
       JOIN users u ON u.id = t.recruiter_id
       LEFT JOIN (
         SELECT test_id,
                COUNT(*) AS candidate_count,
                COUNT(*) FILTER (WHERE status = 'completed') AS completed_count
         FROM candidates GROUP BY test_id
       ) c ON c.test_id = t.id
       LEFT JOIN (
         SELECT test_id, COUNT(*) AS invitation_count
         FROM invitations GROUP BY test_id
       ) i ON i.test_id = t.id
       LEFT JOIN LATERAL (
         SELECT invitation_token
         FROM invitations
         WHERE test_id = t.id
         ORDER BY invited_at DESC
         LIMIT 1
       ) latest_inv ON true
       ORDER BY t.created_at DESC`
    );

    const domain = process.env.REPLIT_DEV_DOMAIN || '';

    const tests = result.rows.map(t => ({
      ...t,
      welcomeLink: t.latest_invitation_token
        ? `${domain}/welcome/${t.id}?token=${t.latest_invitation_token}`
        : `${domain}/welcome/${t.id}`,
      adminTakeLink: null, // generated on demand via POST /api/admin/tests/:id/take
      completionRate: t.candidate_count > 0
        ? Math.round((Number(t.completed_count || 0) / Number(t.candidate_count)) * 100)
        : 0,
    }));

    res.json({ tests });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/admin/tests/:id/take ───────────────────────────────────────────
// Creates an admin-only invitation so the supreme authority can experience any test
router.post('/tests/:id/take', async (req, res, next) => {
  try {
    const testId = req.params.id;
    const testCheck = await query(
      `SELECT id, name, role FROM tests WHERE id = $1`,
      [testId]
    );
    if (!testCheck.rows.length) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const test = testCheck.rows[0];

    // Create an admin candidate for this test attempt
    const candidateResult = await query(
      `INSERT INTO candidates (test_id, name, email, role, status)
       VALUES ($1, $2, $3, $4, 'invited')
       RETURNING id`,
      [testId, 'Admin', 'admin@hiresprint.local', test.role || null]
    );
    const candidateId = candidateResult.rows[0].id;

    await query(
      `INSERT INTO candidate_activity_log (candidate_id, status, note) VALUES ($1, 'invited', 'Admin self-invitation')`,
      [candidateId]
    );

    const invResult = await query(
      `INSERT INTO invitations (test_id, candidate_id, candidate_email, candidate_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, invitation_token, expires_at`,
      [testId, candidateId, 'admin@hiresprint.local', 'Admin']
    );
    const inv = invResult.rows[0];

    const domain = process.env.REPLIT_DEV_DOMAIN || '';
    const welcomeLink = `${domain}/welcome/${testId}?token=${inv.invitation_token}`;

    res.json({
      candidateId,
      invitationId: inv.id,
      invitationToken: inv.invitation_token,
      welcomeLink,
      expiresAt: inv.expires_at,
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/admin/sessions ──────────────────────────────────────────────────
router.get('/sessions', async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT
         es.id,
         es.status,
         es.started_at,
         es.completed_at,
         es.created_at,
         c.id AS candidate_id,
         c.name AS candidate_name,
         c.email AS candidate_email,
         t.id AS test_id,
         t.name AS test_name,
         u.name AS recruiter_name
       FROM evaluation_sessions es
       LEFT JOIN candidates c ON c.id = es.candidate_id
       LEFT JOIN tests t ON t.id = es.test_id
       LEFT JOIN users u ON u.id = t.recruiter_id
       ORDER BY es.started_at DESC`
    );
    res.json({ sessions: result.rows });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/admin/security-events ───────────────────────────────────────────
router.get('/security-events', async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT
         se.id,
         se.event_type,
         se.severity,
         se.payload,
         se.ts,
         c.id AS candidate_id,
         c.name AS candidate_name,
         t.name AS test_name
       FROM security_events se
       LEFT JOIN candidates c ON c.id = se.candidate_id
       LEFT JOIN tests t ON t.id = c.test_id
       ORDER BY se.ts DESC
       LIMIT 500`
    );
    res.json({ securityEvents: result.rows });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/admin/activities ────────────────────────────────────────────────
// Recent candidate activity log + invitation events + security events (last 7 days)
router.get('/activities', async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT
         cal.id,
         cal.status,
         cal.note,
         cal.created_at AS ts,
         c.id AS candidate_id,
         c.name AS candidate_name,
         t.name AS test_name,
         u.name AS recruiter_name
       FROM candidate_activity_log cal
       LEFT JOIN candidates c ON c.id = cal.candidate_id
       LEFT JOIN tests t ON t.id = c.test_id
       LEFT JOIN users u ON u.id = t.recruiter_id
       WHERE cal.created_at > NOW() - INTERVAL '7 days'
       ORDER BY cal.created_at DESC
       LIMIT 200`
    );
    res.json({ activities: result.rows });
  } catch (err) {
    next(err);
  }
});

export default router;
