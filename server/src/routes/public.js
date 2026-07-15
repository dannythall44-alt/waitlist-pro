import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db.js';
import { sendEmail } from '../email.js';

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

  // Send confirmation email
  const appUrl = process.env.APP_URL || 'http://localhost:3004';
  const shareLink = `${appUrl}/w/${campaign.slug}?ref=${myCode}`;
  sendEmail({
    to: email,
    subject: `You're on the waitlist for ${campaign.name}!`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <h1 style="color:#6366f1;margin-bottom:16px">You're on the list!</h1>
      <p>Hi ${name || 'there'},</p>
      <p>You've joined the waitlist for <strong>${campaign.name}</strong>.</p>
      <p>Your position: <strong>#${maxPos.pos}</strong></p>
      <p style="margin:24px 0">Share this link to move up the list:<br/>
        <a href="${shareLink}" style="color:#6366f1">${shareLink}</a>
      </p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
      <p style="color:#888;font-size:13px">Powered by Waitlist Pro</p>
    </div>`
  });

  res.status(201).json({ signup: { id, email, name, referral_code: myCode, position: maxPos.pos }, signup_count: count.cnt });
});

export default router;