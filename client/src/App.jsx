import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext.jsx';
import { api } from './api.js';
import './App.css';

function Protected({ children }) { const { user, loading } = useAuth(); if (loading) return <div className="loading"><div className="spinner"></div></div>; if (!user) return <Navigate to="/login" />; return children; }

function RoutesComp() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading"><div className="spinner"></div></div>;
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <SignupPage />} />
      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
      <Route path="/campaigns/new" element={<Protected><CampaignEditor /></Protected>} />
      <Route path="/campaigns/:id" element={<Protected><CampaignEditor /></Protected>} />
      <Route path="/w/:slug" element={<PublicWaitlist />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function Landing() {
  return <div className="landing"><nav className="nav"><div className="nb"><span className="nl">🚀</span><span className="nt">Waitlist Pro</span></div><div className="nav-links"><a href="/login" className="btn btn-ghost">Sign In</a><a href="/signup" className="btn btn-primary">Get Started</a></div></nav><main className="lm"><div className="hero"><div className="hb">🚀 Launch with confidence</div><h1 className="ht">Beautiful waitlists <span className="tg">for your launch</span></h1><p className="hs">Capture emails, build hype, and reward referrals before you launch.</p><div className="ha"><a href="/signup" className="btn btn-primary btn-lg">Start Free Trial</a></div></div><div className="features"><div className="fc"><div className="fi">🎨</div><h3>Custom Branding</h3><p>Colors, logo, headline — make it yours.</p></div><div className="fc"><div className="fi">📧</div><h3>Email Capture</h3><p>Beautiful signup form to collect emails.</p></div><div className="fc"><div className="fi">🔗</div><h3>Referral Incentives</h3><p>Share links to move up the waitlist.</p></div><div className="fc"><div className="fi">📊</div><h3>Dashboard</h3><p>Track signups, referrals, and conversions.</p></div></div><div className="ps"><div className="pc"><div className="ph"><h3>Pro</h3><div className="pa"><span className="pr">$25</span><span className="pe">/month</span></div></div><ul className="pf"><li>✅ Unlimited waitlists</li><li>✅ Custom branding</li><li>✅ Referral system</li><li>✅ Email capture</li><li>✅ Analytics dashboard</li></ul><a href="/signup" className="btn btn-primary btn-block">Start Free Trial</a></div></div><footer className="footer"><p>© 2025 Waitlist Pro. Built by MicroSprint Studio.</p></footer></main></div>;
}

function LoginPage() {
  const [e, sE] = useState(''); const [p, sP] = useState(''); const [er, sEr] = useState(''); const [ld, sL] = useState(false);
  const { login } = useAuth(); const n = useNavigate();
  const h = async (ev) => { ev.preventDefault(); sEr(''); sL(true); try { await login(e, p); n('/dashboard'); } catch (err) { sEr(err.message); } finally { sL(false); } };
  return <div className="auth-page"><div className="auth-card"><h2>Welcome back</h2><p>Sign in to Waitlist Pro</p>{er&&<div style={{color:'var(--red)',marginBottom:16,fontSize:14}}>{er}</div>}<form onSubmit={h}><div className="fg"><label>Email</label><input className="input" type="email" value={e} onChange={e=>sE(e.target.value)} required /></div><div className="fg"><label>Password</label><input className="input" type="password" value={p} onChange={e=>sP(e.target.value)} required /></div><button className="btn btn-primary btn-block btn-lg" disabled={ld}>{ld?'...':'Sign In'}</button></form><div className="af">No account? <a href="/signup">Sign up</a></div></div></div>;
}

function SignupPage() {
  const [n, sN] = useState(''); const [e, sE] = useState(''); const [p, sP] = useState(''); const [er, sEr] = useState(''); const [ld, sL] = useState(false);
  const { signup } = useAuth(); const nav = useNavigate();
  const h = async (ev) => { ev.preventDefault(); sEr(''); sL(true); try { await signup(e, n, p); nav('/dashboard'); } catch (err) { sEr(err.message); } finally { sL(false); } };
  return <div className="auth-page"><div className="auth-card"><h2>Get started</h2><p>Create your account</p>{er&&<div style={{color:'var(--red)',marginBottom:16,fontSize:14}}>{er}</div>}<form onSubmit={h}><div className="fg"><label>Name</label><input className="input" value={n} onChange={e=>sN(e.target.value)} required /></div><div className="fg"><label>Email</label><input className="input" type="email" value={e} onChange={e=>sE(e.target.value)} required /></div><div className="fg"><label>Password</label><input className="input" type="password" value={p} onChange={e=>sP(e.target.value)} minLength={6} required /></div><button className="btn btn-primary btn-block btn-lg" disabled={ld}>{ld?'...':'Create Account'}</button></form><div className="af">Have an account? <a href="/login">Sign in</a></div></div></div>;
}

function Dashboard() {
  const { user, logout } = useAuth(); const nav = useNavigate();
  const [cs, sCs] = useState([]); const [ld, sL] = useState(true);
  useEffect(() => { api.campaigns.list().then(d => sCs(d.campaigns)).catch(console.error).finally(() => sL(false)); }, []);
  return <div><nav className="nav"><div className="nb"><span className="nl">🚀</span><span className="nt">Waitlist Pro</span></div><div className="nav-links"><span className="nu">{user?.name}</span><button className="btn btn-ghost btn-sm" onClick={logout}>Sign Out</button></div></nav><main className="mc"><div className="hr"><div><h1>Your Waitlists</h1><p className="sub">{cs.length} campaigns</p></div><button className="btn btn-primary" onClick={() => nav('/campaigns/new')}>+ New Campaign</button></div>{ld ? <div className="loader"><div className="spinner" style={{margin:'0 auto'}}></div></div> : cs.length === 0 ? <div className="empty"><div style={{fontSize:48,marginBottom:16}}>🚀</div><h3>No campaigns yet</h3><p style={{marginBottom:24}}>Create your first waitlist campaign.</p><button className="btn btn-primary" onClick={() => nav('/campaigns/new')}>Create Campaign</button></div> : <div className="cg">{cs.map(c => <div key={c.id} className="card" onClick={() => nav('/campaigns/'+c.id)}><div><h3>{c.name}</h3><p style={{fontSize:13,color:'var(--text-muted)'}}>{c.signup_count} signups · /w/{c.slug}</p></div><span className="badge" style={{background:'var(--primary-glow)',color:'var(--primary)',fontSize:13}}>{c.signup_count} signups</span></div>)}</div>}</main></div>;
}

function CampaignEditor() {
  const { id } = useParams(); const nav = useNavigate(); const { user } = useAuth();
  const [name, sN] = useState(''); const [headline, sH] = useState(''); const [desc, sD] = useState(''); const [goal, sG] = useState(100);
  const [ld, sL] = useState(false); const [saving, sS] = useState(false); const [signups, sSu] = useState([]);
  useEffect(() => { if (id) { sL(true); api.campaigns.get(id).then(d => { sN(d.campaign.name); sH(d.campaign.headline||''); sD(d.campaign.description||''); sG(d.campaign.goal||100); sSu(d.campaign.signups||[]); }).catch(()=>nav('/dashboard')).finally(()=>sL(false)); } }, [id]);
  const save = async () => { if (!name.trim()) return; sS(true); try { if (id) await api.campaigns.update(id, { name, headline, description, goal }); else await api.campaigns.create({ name, headline, description, goal }); nav('/dashboard'); } catch (err) { alert(err.message); } finally { sS(false); } };
  if (ld) return <div className="loading"><div className="spinner"></div></div>;
  return <div><nav className="nav"><div className="nb"><span className="nl">🚀</span><span className="nt">Waitlist Pro</span></div><div className="nav-links"><button className="btn btn-ghost btn-sm" onClick={()=>nav('/dashboard')}>← Dashboard</button><span className="nu">{user?.name}</span></div></nav><main className="mc" style={{maxWidth:700}}><h1 style={{marginBottom:24}}>{id?'Edit Campaign':'New Campaign'}</h1><div className="ec"><div className="fg"><label>Name</label><input className="input" value={name} onChange={e=>sN(e.target.value)} placeholder="e.g. Product Launch" /></div><div className="fg"><label>Headline</label><input className="input" value={headline} onChange={e=>sH(e.target.value)} placeholder="e.g. Join the waitlist for..." /></div><div className="fg"><label>Description</label><textarea className="input" value={desc} onChange={e=>sD(e.target.value)} placeholder="Describe what you're building" /></div><div className="fg"><label>Goal (signups)</label><input className="input" type="number" value={goal} onChange={e=>sG(parseInt(e.target.value)||100)} /></div><button className="btn btn-primary" onClick={save} disabled={saving}>{saving?'Saving...':'Save Campaign'}</button></div>{id && <div style={{marginTop:24}}><h2>Signups ({signups.length})</h2><div className="cg">{signups.map(s => <div key={s.id} className="card" style={{cursor:'default'}}><div><strong>{s.email}</strong> {s.name && <span>· {s.name}</span>}</div><div><span className="badge" style={{background:'var(--bg-input)',color:'var(--text-muted)',marginRight:8}}>#{s.position}</span><span style={{fontSize:12,color:'var(--text-muted)',fontFamily:'monospace'}}>ref: {s.referral_code}</span></div></div>)}</div></div>}</main></div>;
}

function PublicWaitlist() {
  const { slug } = useParams();
  const [c, sC] = useState(null); const [ld, sL] = useState(true); const [er, sE] = useState(null);
  const [email, sEm] = useState(''); const [name, sN] = useState(''); const [signed, sS] = useState(false); const [signing, sSi] = useState(false); const [ref, sR] = useState('');
  useEffect(() => { const params = new URLSearchParams(window.location.search); if (params.get('ref')) sR(params.get('ref')); api.public.get(slug).then(d => sC(d.campaign)).catch(e => sE(e.message)).finally(() => sL(false)); }, [slug]);
  const signup = async (e) => { e.preventDefault(); sSi(true); try { const d = await api.public.signup(slug, { email, name, referral_code: ref }); sS(true); sC({...c, signup_count: d.signup_count}); } catch (err) { alert(err.message); } finally { sSi(false); } };
  if (ld) return <div className="loading"><div className="spinner"></div></div>;
  if (er || !c) return <div className="wp"><div className="we"><h2>Not found</h2><p>This waitlist doesn't exist.</p></div></div>;
  const pct = Math.min(100, Math.round((c.signup_count / c.goal) * 100));
  return <div className="wp" style={{background:c.bg_color||'#0a0a0f',color:c.text_color||'#e8e8f0'}}><div className="wc"><div className="wh"><h1 style={{color:c.accent_color||'#6366f1'}}>{c.headline||c.name}</h1><p>{c.description}</p></div><div className="wb"><div className="wp-bar"><div className="wp-fill" style={{width:pct+'%',background:c.accent_color||'#6366f1'}}></div></div><p className="ws">{c.signup_count} / {c.goal} signed up</p></div>{!signed ? <form className="wf" onSubmit={signup}><input className="input" type="email" value={email} onChange={e=>sEm(e.target.value)} placeholder="Your email" required style={{marginBottom:8}}/><input className="input" value={name} onChange={e=>sN(e.target.value)} placeholder="Your name (optional)" style={{marginBottom:8}}/><button className="btn btn-primary btn-block btn-lg" disabled={signing||!email}>{signing?'Joining...':'Join the Waitlist'}</button></form> : <div className="ws-success"><h3>🎉 You're on the list!</h3><p style={{marginTop:12}}>Your position: <strong>#{c.signup_count}</strong></p><p style={{marginTop:8,fontSize:14,color:'var(--text-muted)'}}>Share this link to move up: <br/><code style={{background:'var(--bg-input)',padding:'4px 8px',borderRadius:4,fontSize:13}}>{window.location.origin}/w/{slug}?ref=SHARE</code></p></div>}</div></div>;
}

export default function App() { return <AuthProvider><RoutesComp /></AuthProvider>; }