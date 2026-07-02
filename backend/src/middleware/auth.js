import jwt from 'jsonwebtoken';
import { query } from '../db/index.js';

export async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.SESSION_SECRET);
    const result = await query(
      'SELECT id, name, email, role, avatar_initials, avatar_url, phone, job_title, department, timezone, bio, joined_on FROM users WHERE id = $1',
      [decoded.userId]
    );
    if (!result.rows.length) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = result.rows[0];
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function generateToken(userId) {
  return jwt.sign({ userId }, process.env.SESSION_SECRET, { expiresIn: '7d' });
}
