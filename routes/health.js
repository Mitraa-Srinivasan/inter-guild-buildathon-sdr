const router = require('express').Router();
const { supabase } = require('../db/supabase');
const { gmailStatus } = require('../lib/mailer');
const { discoveryConfig } = require('../agents/discovery');

// The env vars each DronaHQ agent trigger needs (see agents/dronaHQ.js and .env.example).
const DRONAHQ_ENV = ['ICP', 'RESEARCH', 'PERSONALIZE', 'STRATEGY', 'CONVERSATION', 'FOLLOWUP', 'VOICE'].flatMap((a) => [
  `DRONAHQ_${a}_WEBHOOK_URL`,
  `DRONAHQ_${a}_WEBHOOK_KEY`,
]);

// Health of the services the app depends on, for the sidebar status panel. Never throws: a failure is reported as
// an unhealthy service.
//   api        this process answered
//   supabase   a trivial query succeeds
//   dronahq    every agent's webhook URL and key are configured. It deliberately does NOT call the agents: they are
//              billed per run, so a health check must not spend credits.
router.get('/services', async (req, res) => {
  const services = [{ name: 'Backend API', ok: true, detail: 'responding' }];

  try {
    const { error } = await supabase.from('global_settings').select('id').eq('id', true).maybeSingle();
    services.push({ name: 'Supabase', ok: !error, detail: error ? error.message : 'reachable' });
  } catch (err) {
    services.push({ name: 'Supabase', ok: false, detail: err.message });
  }

  const missing = DRONAHQ_ENV.filter((k) => !process.env[k]);
  services.push({
    name: 'DronaHQ agents',
    ok: missing.length === 0,
    detail: missing.length ? `${missing.length} webhook setting(s) missing` : 'all 7 agent webhooks configured (not pinged: runs cost credits)',
  });

  // Optional integrations, shown on the Integrations page. They do NOT count toward healthy/total above: an unconfigured one is
  // simply not connected, not an outage. Gmail is checked with a login handshake (no email is sent), cached for 10 minutes.
  const disc = discoveryConfig();
  const gmail = await gmailStatus();
  const integrations = {
    gmail: { connected: gmail.configured && gmail.verified !== false, ...gmail },
    groq: { connected: disc.groq, detail: disc.groq ? 'GROQ_API_KEY is set' : 'GROQ_API_KEY not set' },
    tavily: { connected: disc.tavily, detail: disc.tavily ? 'TAVILY_API_KEY is set' : 'TAVILY_API_KEY not set' },
  };

  res.json({ ok: services.every((s) => s.ok), healthy: services.filter((s) => s.ok).length, total: services.length, services, integrations });
});

module.exports = router;
