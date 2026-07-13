import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db.js';

const router = Router();

router.get('/:slug', (req, res) => {
  const db = getDb();
  const campaign = db.prepare('SELECT * FROM campaigns WHERE slug=?').get(req.params.slug);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
  const count = db.prepare('SELECT COUNT(*) as cnt FROM signups WHERE campaign_id=?').get(campaign.id);
  res.json({ campaign: { ...campaign, signup_count: count.cnt } });
});

router.post('/:slug/signup', (req, res) => {
  const { email, name, referral_code } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  const db = getDb();
  const campaign = db.prepare('SELECT * FROM campaigns WHERE slug=?').get(req.params.slug);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

  const existing = db.prepare('SELECT * FROM signups WHERE campaign_id=? AND email=?').get(campaign.id, email);
  if (existing) return res.status(409).json({ error: 'Already signed up' });

  const id = uuid();
  const myCode = uuid().replace(/-/g, '').slice(0, 8);
  const maxPos = db.prepare('SELECT COALESCE(MAX(position),0)+1 as pos FROM signups WHERE campaign_id=?').get(campaign.id);
  let referredBy = null;
  if (referral_code) {
    const referrer = db.prepare('SELECT * FROM signups WHERE campaign_id=? AND referral_code=?').get(campaign.id, referral_code);
    if (referrer) referredBy = referrer.id;
  }
  db.prepare('INSERT INTO signups (id,campaign_id,email,name,referral_code,referred_by,position) VALUES (?,?,?,?,?,?,?)')
    .run(id, campaign.id, email, name || '', myCode, referredBy, maxPos.pos);
  const count = db.prepare('SELECT COUNT(*) as cnt FROM signups WHERE campaign_id=?').get(campaign.id);
  res.status(201).json({ signup: { id, email, name, referral_code: myCode, position: maxPos.pos }, signup_count: count.cnt });
});

export default router;