import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// GET /api/users/me
router.get('/me', (req, res) => {
  res.json({ user: req.user });
});

// PATCH /api/users/me
router.patch('/me', async (req, res, next) => {
  try {
    const { name, phone, jobTitle, department, timezone, bio, avatarUrl } = req.body;

    let avatarInitials = req.user.avatar_initials;
    if (name) {
      avatarInitials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    }

    const result = await query(
      `UPDATE users SET
         name            = COALESCE($1, name),
         phone           = COALESCE($2, phone),
         job_title       = COALESCE($3, job_title),
         department      = COALESCE($4, department),
         timezone        = COALESCE($5, timezone),
         bio             = COALESCE($6, bio),
         avatar_url      = COALESCE($7, avatar_url),
         avatar_initials = $8,
         updated_at      = NOW()
       WHERE id = $9
       RETURNING id, name, email, role, avatar_initials, avatar_url, phone, job_title, department, timezone, bio, joined_on`,
      [name, phone, jobTitle, department, timezone, bio, avatarUrl, avatarInitials, req.user.id]
    );

    res.json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// POST /api/users/me/password
router.post('/me/password', async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'currentPassword and newPassword are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const result = await query(
      `SELECT password_hash FROM users WHERE id = $1`,
      [req.user.id]
    );
    const valid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await query(`UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`, [hash, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
