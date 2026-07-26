import jwt from 'jsonwebtoken';

export const ADMIN_USER_ID = 'admin';

export function generateAdminToken() {
  return jwt.sign(
    { userId: ADMIN_USER_ID, role: 'admin', isAdmin: true },
    process.env.SESSION_SECRET,
    { expiresIn: '1d' }
  );
}

export function verifyAdminToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.SESSION_SECRET);
    if (!decoded.isAdmin || decoded.role !== 'admin') return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function authenticateAdmin(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No admin token provided' });
  }

  const decoded = verifyAdminToken(header.slice(7));
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired admin token' });
  }

  req.admin = decoded;
  next();
}
