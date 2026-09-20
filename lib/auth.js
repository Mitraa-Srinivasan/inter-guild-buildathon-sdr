const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const { supabase } = require('../db/supabase');

// Authentication for the API, built on Supabase Auth (email + password).
//
//  - The browser signs in through POST /auth/login. The backend gets a session from Supabase and hands it to the browser as two
//    HttpOnly, SameSite=Lax cookies (JavaScript on the page can never read the tokens). API clients may instead send
//    `Authorization: Bearer <Supabase access token>`.
//  - requireAuth() guards every API route: no valid session -> 401 and no data.
//  - A valid Supabase user is not enough: they must also be a MEMBER of the team (a row in `profiles`, or, until that table exists,
//    an admin-set app_metadata.role). Supabase lets anyone with the project's public key sign up, so "is a Supabase user" would
//    otherwise mean "anyone". Only the backend (service role) can create members.

const AT_COOKIE = 'sdr_at'; // access token (JWT, 1 hour)
const RT_COOKIE = 'sdr_rt'; // refresh token
const RT_MAX_AGE = 14 * 24 * 3600; // seconds the browser keeps the refresh cookie

// A token that Supabase has validated is trusted for this long before it is checked again, so a page load's dozens of parallel
// requests cost one Auth call, not dozens. Logging out evicts the token at once; on another device a revoked session can live
// at most this long.
const TOKEN_TTL_MS = 30 * 1000;
const CACHE_MAX = 500;

// ---- small helpers ------------------------------------------------------------------------------------------------------

// A throwaway Supabase client for sign-in / refresh. The shared `supabase` client must stay service-role, so sessions never go on it.
const authClient = () =>
  createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');

function parseCookies(header) {
  const out = {};
  for (const part of String(header || '').split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    if (!k) continue;
    try { out[k] = decodeURIComponent(part.slice(i + 1).trim()); } catch { /* ignore a malformed cookie */ }
  }
  return out;
}

const isHttps = (req) => req.secure || String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https';
const cookieStr = (name, value, maxAge, secure) => `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;

function setSessionCookies(req, res, session) {
  const secure = isHttps(req);
  res.append('Set-Cookie', cookieStr(AT_COOKIE, session.access_token, Math.max(60, Number(session.expires_in) || 3600), secure));
  res.append('Set-Cookie', cookieStr(RT_COOKIE, session.refresh_token, RT_MAX_AGE, secure));
}
function clearSessionCookies(req, res) {
  const secure = isHttps(req);
  res.append('Set-Cookie', cookieStr(AT_COOKIE, '', 0, secure));
  res.append('Set-Cookie', cookieStr(RT_COOKIE, '', 0, secure));
}

function bearerToken(req) {
  const m = /^Bearer\s+(\S+)$/i.exec(req.headers.authorization || '');
  return m ? m[1] : null;
}

function jwtExpiryMs(token) {
  try { return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8')).exp * 1000; } catch { return 0; }
}

// Supabase Auth answering "no" (4xx) is different from Supabase Auth being unreachable (network / 5xx): the second must not
// look like a bad login.
const isUnavailable = (error) => !error || !error.status || error.status >= 500;

class AuthUnavailable extends Error {}

// ---- team membership ----------------------------------------------------------------------------------------------------

const PROFILES_MISSING = new Set(['PGRST205', '42P01']); // "table not found in the schema cache" / "relation does not exist"

// -> { display_name, role, member_since, source } for a team member, or null. When the profiles table exists it is authoritative
// (deleting the row removes access); until it is created (db/schema.sql) an admin-set app_metadata.role marks a member.
async function loadMember(user) {
  const { data, error } = await supabase.from('profiles').select('display_name, role, created_at').eq('id', user.id).maybeSingle();
  if (error) {
    if (!PROFILES_MISSING.has(error.code)) throw new AuthUnavailable(`profiles lookup failed: ${error.message}`);
    const meta = user.app_metadata || {}; // app_metadata can only be written with the service key; user_metadata can be edited by the user
    if (!meta.role) return null;
    return { display_name: meta.display_name || String(user.email || '').split('@')[0], role: meta.role, member_since: user.created_at, source: 'app_metadata' };
  }
  return data ? { display_name: data.display_name, role: data.role, member_since: data.created_at, source: 'profiles' } : null;
}

// ---- token verification -------------------------------------------------------------------------------------------------

const cache = new Map(); // sha256(token) -> { result, until }

function remember(token, result) {
  if (cache.size >= CACHE_MAX) {
    const now = Date.now();
    for (const [k, v] of cache) if (v.until <= now) cache.delete(k);
    if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
  }
  cache.set(sha(token), { result, until: Math.min(Date.now() + TOKEN_TTL_MS, jwtExpiryMs(token) || 0) });
}
const evict = (token) => { if (token) cache.delete(sha(token)); };

// -> { ok: true, user, member } | { ok: false, reason: 'invalid' | 'not_member' }.  Throws AuthUnavailable if Supabase can't be reached.
async function verifyToken(token) {
  const hit = cache.get(sha(token));
  if (hit && Date.now() < hit.until) return hit.result;

  let res;
  try { res = await supabase.auth.getUser(token); } catch (err) { throw new AuthUnavailable(err.message); }
  const { data, error } = res;
  if (error || !data || !data.user) {
    if (error && isUnavailable(error)) throw new AuthUnavailable(error.message);
    evict(token);
    return { ok: false, reason: 'invalid' };
  }
  const member = await loadMember(data.user);
  const result = member ? { ok: true, user: data.user, member } : { ok: false, reason: 'not_member', user: data.user };
  remember(token, result);
  return result;
}

// One refresh per refresh token even when a page fires many requests at once (Supabase rotates refresh tokens, so racing
// refreshes would fight). The outcome is kept for a few seconds so late siblings share it.
const refreshing = new Map();
function refreshSession(refreshToken) {
  if (refreshing.has(refreshToken)) return refreshing.get(refreshToken);
  const p = (async () => {
    let res;
    try { res = await authClient().auth.refreshSession({ refresh_token: refreshToken }); } catch (err) { throw new AuthUnavailable(err.message); }
    if (res.error || !res.data || !res.data.session) {
      if (res.error && isUnavailable(res.error)) throw new AuthUnavailable(res.error.message);
      return null;
    }
    return res.data.session;
  })();
  refreshing.set(refreshToken, p);
  p.then(() => setTimeout(() => refreshing.delete(refreshToken), 15000), () => refreshing.delete(refreshToken));
  return p;
}

// ---- the middleware -----------------------------------------------------------------------------------------------------

const publicUser = (user, member) => ({ id: user.id, email: user.email, display_name: member.display_name, role: member.role, member_since: member.member_since });

// No valid session -> 401 and nothing else. Attaches req.auth = { user, member, token } on success.
async function requireAuth(req, res, next) {
  res.set('Cache-Control', 'no-store'); // API responses hold private data: never cache them, so "Back" after logout shows nothing
  try {
    const bearer = bearerToken(req);
    const cookies = parseCookies(req.headers.cookie);
    let token = bearer || cookies[AT_COOKIE] || null;

    let result = token ? await verifyToken(token) : { ok: false, reason: 'invalid' };

    // A browser whose access token expired but which still holds a refresh token is renewed here, invisibly.
    if (!result.ok && result.reason === 'invalid' && !bearer && cookies[RT_COOKIE]) {
      const session = await refreshSession(cookies[RT_COOKIE]);
      if (session) {
        token = session.access_token;
        result = await verifyToken(token);
        if (result.ok || result.reason === 'not_member') setSessionCookies(req, res, session);
      }
    }

    if (result.ok) {
      req.auth = { user: result.user, member: result.member, token };
      return next();
    }
    if (result.reason === 'not_member') return res.status(403).json({ error: 'This account is not a member of the team' });

    if (!bearer && (cookies[AT_COOKIE] || cookies[RT_COOKIE])) clearSessionCookies(req, res); // stale cookies: drop them
    return res.status(401).json({ error: 'Authentication required' });
  } catch (err) {
    if (err instanceof AuthUnavailable) {
      console.error('Auth service unavailable:', err.message);
      return res.status(503).json({ error: 'Authentication service unavailable, try again shortly' });
    }
    return next(err);
  }
}

// ---- login throttling ---------------------------------------------------------------------------------------------------

// Failed sign-ins are counted per (ip, email) and per ip over 15 minutes, so a password can't be guessed by hammering the endpoint
// (Supabase has its own limits too). In memory: fine for one server process, and it resets on restart.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_ACCOUNT = 8;
const MAX_PER_IP = 40;
const failures = new Map(); // key -> { count, first }
function prune(now) { for (const [k, v] of failures) if (now - v.first > WINDOW_MS) failures.delete(k); }
function loginBlockedFor(ip, email, now = Date.now()) {
  prune(now);
  for (const [key, max] of [[`${ip}|${email}`, MAX_PER_ACCOUNT], [ip, MAX_PER_IP]]) {
    const f = failures.get(key);
    if (f && f.count >= max) return Math.ceil((f.first + WINDOW_MS - now) / 1000);
  }
  return 0;
}
function recordLoginFailure(ip, email, now = Date.now()) {
  for (const key of [`${ip}|${email}`, ip]) {
    const f = failures.get(key);
    if (f && now - f.first <= WINDOW_MS) f.count += 1; else failures.set(key, { count: 1, first: now });
  }
}
const clearLoginFailures = (ip, email) => failures.delete(`${ip}|${email}`);

module.exports = {
  requireAuth, verifyToken, loadMember, publicUser, authClient, refreshSession, evict, AuthUnavailable,
  parseCookies, setSessionCookies, clearSessionCookies, bearerToken, jwtExpiryMs, isUnavailable,
  loginBlockedFor, recordLoginFailure, clearLoginFailures,
  AT_COOKIE, RT_COOKIE, MAX_PER_ACCOUNT,
  _resetForTests: () => { cache.clear(); refreshing.clear(); failures.clear(); },
};
