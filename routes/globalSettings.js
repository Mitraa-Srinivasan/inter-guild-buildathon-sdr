const router = require('express').Router();
const { supabase, unwrap } = require('../db/supabase');
const { handleError, pick, assertNotEmpty, HttpError } = require('../lib/http');
const { GLOBAL_CHANNELS } = require('../lib/enums');
const { FREQUENCY_CAP, FREQUENCY_WINDOW_DAYS } = require('../orchestrator/conflict');

// global_settings holds exactly one row (id = true, enforced in schema.sql).
router.get('/', async (req, res) => {
  try {
    const data = unwrap(await supabase.from('global_settings').select('*').eq('id', true).maybeSingle());
    if (!data) throw new HttpError(500, 'global_settings row missing; re-run db/schema.sql');
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
});

router.patch('/', async (req, res) => {
  try {
    const body = pick(req.body, ['kill_switch_on']);
    assertNotEmpty(body);
    if (typeof body.kill_switch_on !== 'boolean') {
      throw new HttpError(400, 'kill_switch_on must be a boolean');
    }
    const data = unwrap(await supabase.from('global_settings').update(body).eq('id', true).select().maybeSingle());
    if (!data) throw new HttpError(500, 'global_settings row missing; re-run db/schema.sql');
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
});

const MISSING_COLUMN = 'global_settings.channels does not exist yet: run db/schema.sql in the Supabase SQL editor (it is safe to re-run)';
const isMissingColumn = (err) => err && err.code === '42703';

// Global channel pause. { "<channel>": { "enabled": false } } pauses that channel for every campaign; a channel not
// listed (or not disabled) is running. The dispatch/voice conflict gate checks this on top of each campaign's channel_config.
router.get('/channels', async (req, res) => {
  try {
    const { data, error } = await supabase.from('global_settings').select('channels').eq('id', true).maybeSingle();
    if (isMissingColumn(error)) throw new HttpError(503, MISSING_COLUMN);
    if (error) throw error;
    res.json({ channels: (data && data.channels) || {} });
  } catch (err) {
    handleError(res, err);
  }
});

// Body: { "email": false } pauses email, { "email": true } resumes it. Like enabled_agents, this MERGES into what is stored,
// so pausing one channel never resumes another.
router.patch('/channels', async (req, res) => {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length === 0) {
      throw new HttpError(400, 'Send an object like { "email": false }');
    }
    for (const [ch, on] of Object.entries(body)) {
      if (!GLOBAL_CHANNELS.includes(ch)) throw new HttpError(400, `Unknown channel "${ch}" (valid: ${GLOBAL_CHANNELS.join(', ')})`);
      if (typeof on !== 'boolean') throw new HttpError(400, `${ch} must be true (running) or false (paused)`);
    }
    const cur = await supabase.from('global_settings').select('channels').eq('id', true).maybeSingle();
    if (isMissingColumn(cur.error)) throw new HttpError(503, MISSING_COLUMN);
    if (cur.error) throw cur.error;
    const merged = { ...((cur.data && cur.data.channels) || {}) };
    for (const [ch, on] of Object.entries(body)) merged[ch] = { enabled: on };
    const data = unwrap(await supabase.from('global_settings').update({ channels: merged }).eq('id', true).select('channels').maybeSingle());
    res.json({ channels: data.channels });
  } catch (err) {
    handleError(res, err);
  }
});

// Read-only view of the platform-wide send guardrails, for the Settings page.
router.get('/guardrails', async (req, res) => {
  try {
    const { count, error } = await supabase.from('suppression_list').select('id', { count: 'exact', head: true });
    if (error) throw error;
    res.json({ suppression_count: count || 0, max_touches_per_prospect: FREQUENCY_CAP, window_days: FREQUENCY_WINDOW_DAYS });
  } catch (err) {
    handleError(res, err);
  }
});

// Just the kill switch (the UI's topbar and Settings button). Body: { kill_switch_on: boolean }.
router.get('/kill-switch', async (req, res) => {
  try {
    const data = unwrap(await supabase.from('global_settings').select('kill_switch_on, updated_at').eq('id', true).maybeSingle());
    if (!data) throw new HttpError(500, 'global_settings row missing; re-run db/schema.sql');
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
});

router.patch('/kill-switch', async (req, res) => {
  try {
    const on = req.body && req.body.kill_switch_on;
    if (typeof on !== 'boolean') throw new HttpError(400, 'kill_switch_on must be a boolean');
    const data = unwrap(
      await supabase.from('global_settings').update({ kill_switch_on: on }).eq('id', true).select('kill_switch_on, updated_at').maybeSingle()
    );
    if (!data) throw new HttpError(500, 'global_settings row missing; re-run db/schema.sql');
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
});

module.exports = router;
