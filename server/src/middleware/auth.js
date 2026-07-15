import jwt from 'jsonwebtoken';
const SECRET = process.env.JWT_SECRET || 'waitlist-dev';
export function genToken(u) { return jwt.sign({ userId: u }, SECRET, { expiresIn: '7d' }); }
export function reqAuth(req, res, next) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ error: 'Auth required' });
  try { req.userId = jwt.verify(h.slice(7), SECRET).userId; next(); } catch { res.status(401).json({ error: 'Invalid token' }); }
}