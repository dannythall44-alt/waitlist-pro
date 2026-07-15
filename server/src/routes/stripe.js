import { Router } from 'express';
import { getDb } from '../db.js';
import { reqAuth } from '../middleware/auth.js';
const router = Router();
router.post('/create-checkout-session', reqAuth, async (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY) return res.status(501).json({ error: 'Stripe not configured' });
  const { default: Stripe } = await import('stripe');
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const db = getDb(); const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.userId);
  let cid = user.stripe_customer_id;
  if (!cid) { const c = await stripe.customers.create({ email: user.email, name: user.name }); cid = c.id; db.prepare('UPDATE users SET stripe_customer_id=? WHERE id=?').run(cid, req.userId); }
  const session = await stripe.checkout.sessions.create({ customer: cid, payment_method_types: ['card'], line_items: [{ price_data: { currency: 'usd', product_data: { name: 'Waitlist Pro' }, unit_amount: 2500, recurring: { interval: 'month' } }, quantity: 1 }], mode: 'subscription', success_url: `${process.env.APP_URL||'http://localhost:3004'}/dashboard?success=1`, cancel_url: `${process.env.APP_URL||'http://localhost:3004'}/pricing` });
  res.json({ url: session.url });
});
router.post('/webhook', async (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY) return res.status(200).json({ received: true });
  const { default: Stripe } = await import('stripe');
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
  const db = getDb();
  if (event.type === 'checkout.session.completed') {
    const s = event.data.object; const u = db.prepare('SELECT * FROM users WHERE stripe_customer_id=?').get(s.customer);
    if (u) db.prepare("UPDATE users SET subscription_status='active',subscription_id=?,updated_at=datetime('now') WHERE id=?").run(s.subscription, u.id);
  }
  res.json({ received: true });
});
router.get('/status', reqAuth, (req, res) => {
  const db = getDb(); const u = db.prepare('SELECT subscription_status FROM users WHERE id=?').get(req.userId);
  res.json({ subscription_status: process.env.STRIPE_SECRET_KEY ? (u?.subscription_status||'inactive') : 'active', requires_payment: !!process.env.STRIPE_SECRET_KEY });
});
export default router;