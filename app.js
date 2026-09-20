const path = require('path');
const express = require('express');
const { requireAuth } = require('./lib/auth');

const app = express();
app.disable('x-powered-by');
// Behind a hosting platform's reverse proxy every request arrives from the proxy's address, so req.ip (which the login throttle keys on)
// would be the same for everybody. Set TRUST_PROXY to the number of proxies in front (usually 1) so req.ip is the real client. Off by
// default: trusting it when the server is exposed directly would let a client spoof its address with a header.
if (process.env.TRUST_PROXY) {
  const v = process.env.TRUST_PROXY.trim();
  app.set('trust proxy', /^\d+$/.test(v) ? Number(v) : v === 'true' ? true : v);
}

// ---- reachable without a session --------------------------------------------------------------------------------------
// Bare liveness for uptime monitors: returns { ok: true } and nothing else.
app.get('/health', (req, res) => res.json({ ok: true }));
// Sign in / out (GET /auth/me inside still needs a session).
app.use('/auth', express.json({ limit: '10kb' }), require('./routes/auth'));
// The control-plane UI is served from the same origin as the API, so it needs no CORS. It holds no data: the login page is
// part of it, and everything it shows arrives through the protected API below.
app.use(express.static(path.join(__dirname, 'frontend')));

// ---- everything below needs a valid session ---------------------------------------------------------------------------
// No session -> 401, before any body is parsed or any route (or even a 404) is looked at, so nothing about the API leaks.
app.use(requireAuth);
app.use(express.json({ limit: '1mb' }));

app.use('/health', require('./routes/health')); // /health/services: integration status, so it is protected
app.use('/campaigns/:id/prompt-versions', require('./routes/promptVersions'));
app.use('/campaigns', require('./routes/campaigns'));
app.use('/prospects', require('./routes/prospects'));
app.use('/campaign-prospects', require('./routes/campaignProspects'));
app.use('/activities', require('./routes/activities'));
app.use('/agents', require('./routes/agents'));
app.use('/reps', require('./routes/reps'));
app.use('/campaign-reps', require('./routes/campaignReps'));
app.use('/suppression-list', require('./routes/suppressionList'));
app.use('/global-settings', require('./routes/globalSettings'));
app.use('/approvals', require('./routes/approvals'));
app.use('/meetings', require('./routes/meetings'));
app.use('/run-cycle', require('./routes/runCycle'));

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Catches errors thrown outside route handlers, e.g. malformed JSON bodies.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 ? 'Internal server error' : err.message });
});

module.exports = app;
