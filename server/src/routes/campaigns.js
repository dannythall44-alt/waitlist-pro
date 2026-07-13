import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db.js';
import { reqAuth } from '../middleware/auth.js';
const router = Router();

router.get('/', reqAuth, (req, res) => {
  const db = getDb();
  const campaigns = db.prepare('SELECT * FROM campaigns WHERE user_id=? ORDER BY created_at DESC').all(req.userId);
  // Add signup counts
  const counts = db.prepare('SELECT campaign_id, COUNT(*) as cnt FROM signups GROUP BY campaign_id').all();
  const cmap = {};
  counts.forEach(c => cmap[c.campaign_id] = c.cnt);
  campaigns.forEach(c => c.signup_count = cmap[c.id] || 0);
  res.json({ campaigns });
});

router.get('/:id', reqAuth, (req, res) => {
  const db = getDb();
  const c = db.prepare('SELECT * FROM campaigns WHERE id=? AND user_id=?').get(req.params.id, req.userId);
  if (!c) return res.status(404).json({ error: 'Not found' });
  c.signups = db.prepare('SELECT * FROM signups WHERE campaign_id=? ORDER BY position ASC').all(c.id);
  res.json({ campaign: c });
});

router.post('/', reqAuth, (req, res) => {
  const { name, headline, description, goal } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const db = getDb();
  const id = uuid();
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + uuid().slice(0, 6);
  db.prepare('INSERT INTO campaigns (id,user_id,name,slug,headline,description,goal) VALUES (?,?,?,?,?,?,?)').run(id, req.userId, name, slug, headline || '', description || '', goal || 100);
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id=?').get(id);
  campaign.signup_count = 0;
  res.status(201).json({ campaign });
});

router.put('/:id', reqAuth, (req, res) => {
  const { name, headline, description, bg_color, text_color, accent_color, logo_url, goal } = req.body;
  const db = getDb();
  const existing = db.prepare('SELECT * FROM campaigns WHERE id=? AND user_id=?').get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  db.prepare("UPDATE campaigns SET name=?,headline=?,description=?,bg_color=?,text_color=?,accent_color=?,logo_url=?,goal=?,updated_at=datetime('now') WHERE id=?")
    .run(name||existing.name, headline!==undefined?headline:existing.headline, description!==undefined?description:existing.description, bg_color||existing.bg_color, text_color||existing.text_color, accent_color||existing.accent_color, logo_url!==undefined?logo_url:existing.logo_url, goal||existing.goal, req.params.id);
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id=?').get(req.params.id);
  res.json({ campaign });
});

export default router;