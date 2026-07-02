import { Router } from 'express';
import { query } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// GET /api/dashboard/stats
router.get('/stats', async (req, res, next) => {
  try {
    const uid = req.user.id;

    const [totals, avgScore, hireRate, activeTests] = await Promise.all([
      query(
        `SELECT
           COUNT(DISTINCT c.id) AS total_candidates,
           COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'completed') AS completed,
           COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'in_progress') AS in_progress
         FROM candidates c
         JOIN tests t ON t.id = c.test_id
         WHERE t.recruiter_id = $1`,
        [uid]
      ),
      query(
        `SELECT ROUND(AVG(c.score))::int AS avg_score
         FROM candidates c
         JOIN tests t ON t.id = c.test_id
         WHERE t.recruiter_id = $1 AND c.score IS NOT NULL`,
        [uid]
      ),
      query(
        `SELECT
           COUNT(*) FILTER (WHERE c.status = 'hired') AS hired,
           COUNT(*) AS total
         FROM candidates c
         JOIN tests t ON t.id = c.test_id
         WHERE t.recruiter_id = $1 AND c.status IN ('hired', 'rejected', 'reviewed')`,
        [uid]
      ),
      query(
        `SELECT COUNT(*) AS count FROM tests WHERE recruiter_id = $1 AND status = 'active'`,
        [uid]
      ),
    ]);

    const t = totals.rows[0];
    const hired = Number(hireRate.rows[0].hired);
    const reviewedTotal = Number(hireRate.rows[0].total);
    const hireRateVal = reviewedTotal > 0 ? Math.round((hired / reviewedTotal) * 100) : 0;

    res.json({
      stats: [
        { label: 'Total Candidates', value: Number(t.total_candidates), iconName: 'Users', changeType: 'neutral' },
        { label: 'Active Tests',     value: Number(activeTests.rows[0].count), iconName: 'ClipboardList', changeType: 'neutral' },
        { label: 'Avg Score',        value: avgScore.rows[0].avg_score ?? 0, iconName: 'TrendingUp', changeType: 'positive' },
        { label: 'Hire Rate',        value: `${hireRateVal}%`, iconName: 'CheckCircle', changeType: hireRateVal > 50 ? 'positive' : 'neutral' },
      ],
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/pipeline
router.get('/pipeline', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT c.status, COUNT(*) AS count
       FROM candidates c
       JOIN tests t ON t.id = c.test_id
       WHERE t.recruiter_id = $1
       GROUP BY c.status`,
      [req.user.id]
    );

    const counts = Object.fromEntries(result.rows.map(r => [r.status, Number(r.count)]));
    const stages = ['invited', 'in_progress', 'completed', 'reviewed', 'hired', 'rejected'];

    res.json({
      pipeline: stages.map(stage => ({
        stage,
        count: counts[stage] || 0,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/recent-tests
router.get('/recent-tests', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
         t.id,
         t.name,
         COUNT(c.id) FILTER (WHERE c.status = 'completed') AS completed,
         COUNT(c.id) AS total
       FROM tests t
       LEFT JOIN candidates c ON c.test_id = t.id
       WHERE t.recruiter_id = $1 AND t.status = 'active'
       GROUP BY t.id
       ORDER BY t.created_at DESC
       LIMIT 5`,
      [req.user.id]
    );
    res.json({
      tests: result.rows.map(t => ({
        id: t.id,
        name: t.name,
        completed: Number(t.completed),
        total: Number(t.total),
      })),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/top-candidates
router.get('/top-candidates', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT c.id, c.name, c.score
       FROM candidates c
       JOIN tests t ON t.id = c.test_id
       WHERE t.recruiter_id = $1 AND c.score IS NOT NULL
       ORDER BY c.score DESC
       LIMIT 5`,
      [req.user.id]
    );
    res.json({ candidates: result.rows });
  } catch (err) {
    next(err);
  }
});

export default router;
