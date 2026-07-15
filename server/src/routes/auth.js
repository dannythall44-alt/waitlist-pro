import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db.js';
import { genToken } from '../middleware/auth.js';
const router = Router();
const SECRET = process.env.JWT_SECRET || 'waitlist-dev';
router.post('/signup', async (req, res) => {
  try {
    const { email, name, password } = req.body;
    if (!email || !name || !password) return res.status(400).json({ error: 'All fields required' });
    const db = getDb();
    if (db.prepare('SELECT id FROM users WHERE email=?').get(email)) return res.status(409).json({ error: 'Email exists' });
    const id = uuid();
    db.prepare('INSERT INTO users (id,email,name,password_hash) VALUES (?,?,?,?)').run(id, email, name, await bcrypt.hash(password, 10));
    res.status(201).json({ token: genToken(id), user: { id, email, name } });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email=?').get(email);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ token: genToken(user.id), user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});
router.get('/me', (req, res) => {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ error: 'Auth required' });
  try { const d = jwt.verify(h.slice(7), SECRET); const db = getDb(); const u = db.prepare('SELECT id,email,name FROM users WHERE id=?').get(d.userId); if (!u) return res.status(404).json({ error: 'Not found' }); res.json({ user: u }); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
});
export default router;