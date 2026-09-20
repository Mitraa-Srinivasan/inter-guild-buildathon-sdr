const router = require('express').Router();
const { supabase } = require('../db/supabase');
const auth = require('../lib/auth');

// Login, logout and "who am I". These are the only API routes reachable without a session (and /me still needs one).

router.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });

// POST /auth/login { email, password }
//   200 { user: { id, email, display_name, role, member_since } } and the session cookies (HttpOnly; tokens never appear in JSON)
//   400 missing fields · 401 wrong email or password (the same answer for both, so it can't be used to find accounts)
//   403 correct password but not a member of the team · 429 too many failed attempts · 503 auth service unreachable
router.post('/login', async (req, res) => {
  try {
    const body = req.body || {};
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    if (email.length > 254 || password.length > 256) return res.status(400).json({ error: 'Email or password is too long' });

    const wait = auth.loginBlockedFor(req.ip, email);
    if (wait) {
      res.set('Retry-After', String(wait));
      return res.status(429).json({ error: `Too many failed sign-in attempts. Try again in ${Math.ceil(wait / 60)} minute(s).` });
    }

    let result;
    try { result = await auth.authClient().auth.signInWithPassword({ email, password }); } catch (err) { throw new auth.AuthUnavailable(err.message); }
    const { data, error } = result;
    if (error || !data || !data.session) {
      if (error && error.status === 429) return res.status(429).json({ error: 'Too many sign-in attempts. Try again in a minute.' });
      if (error && auth.isUnavailable(error)) throw new auth.AuthUnavailable(error.message);
      auth.recordLoginFailure(req.ip, email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const { session } = data;
    const member = await auth.loadMember(session.user);
    if (!member) {
      // Right password, but Supabase Auth alone doesn't make someone a team member. Don't leave the session lying around.
      try { await supabase.auth.admin.signOut(session.access_token, 'local'); } catch { /* best effort */ }
      return res.status(403).json({ error: 'This account is not a member of the team' });
    }

    auth.clearLoginFailures(req.ip, email);
    auth.setSessionCookies(req, res, session);
    res.json({ user: auth.publicUser(session.user, member) });
  } catch (err) {
    if (err instanceof auth.AuthUnavailable) {
      console.error('Auth service unavailable:', err.message);
      return res.status(503).json({ error: 'Authentication service unavailable, try again shortly' });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/logout: ends this session at Supabase (the access token stops working straight away, even if someone copied it)
// and clears the cookies. Always 200, also when nobody was signed in.
router.post('/logout', async (req, res) => {
  try {
    const cookies = auth.parseCookies(req.headers.cookie);
    const tokens = [auth.bearerToken(req), cookies[auth.AT_COOKIE]].filter(Boolean);
    let revoked = false;
    for (const t of tokens) {
      auth.evict(t);
      try {
        const { error } = await supabase.auth.admin.signOut(t, 'local');
        if (!error) revoked = true;
      } catch { /* an expired or already-revoked token has nothing to revoke */ }
    }
    // The access cookie may have expired while the refresh cookie is still good: renew it just to revoke the session properly.
    if (!revoked && cookies[auth.RT_COOKIE]) {
      try {
        const session = await auth.refreshSession(cookies[auth.RT_COOKIE]);
        if (session) { auth.evict(session.access_token); await supabase.auth.admin.signOut(session.access_token, 'local'); }
      } catch { /* best effort */ }
    }
    auth.clearSessionCookies(req, res);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    auth.clearSessionCookies(req, res);
    res.json({ ok: true });
  }
});

// GET /auth/me -> { id, email, display_name, role, member_since, source, session_expires_at }. 401 with no session.
router.get('/me', auth.requireAuth, (req, res) => {
  const { user, member, token } = req.auth;
  const exp = auth.jwtExpiryMs(token);
  res.json({ ...auth.publicUser(user, member), source: member.source, session_expires_at: exp ? new Date(exp).toISOString() : null });
});

module.exports = router;
