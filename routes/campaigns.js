const router = require('express').Router();
const { supabase, unwrap } = require('../db/supabase');
const {
  handleError,
  pick,
  requireFields,
  assertOneOf,
  assertNotEmpty,
  pageRange,
  notFound,
  HttpError,
} = require('../lib/http');
const { CAMPAIGN_STATUS, FUNNEL_STATE, AGENT_TYPES, ACTIVITY_STATUS } = require('../lib/enums');
const { buildCostReport } = require('../lib/costReport');
const { runDiscovery } = require('../orchestrator/discovery');
const { runDiscoverAndQualify } = require('../orchestrator/discoverAndQualify');

const FIELDS = [
  'name', 'description', 'owner', 'status', 'icp_json', 'channel_config', 'daily_limits', 'enabled_agents', 'sample_profiles',
];

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

// enabled_agents: { <agent_type>: boolean }. Agents not listed (or not false) are enabled. Unknown agent names are
// rejected so a typo can't silently leave an agent running.
function validateEnabledAgents(v) {
  if (!isPlainObject(v)) throw new HttpError(400, 'enabled_agents must be an object like { "voice": false }');
  for (const [agent, enabled] of Object.entries(v)) {
    if (!AGENT_TYPES.includes(agent)) throw new HttpError(400, `enabled_agents: unknown agent "${agent}" (valid: ${AGENT_TYPES.join(', ')})`);
    if (typeof enabled !== 'boolean') throw new HttpError(400, `enabled_agents.${agent} must be true or false`);
  }
}

function validateSampleProfiles(v) {
  if (!Array.isArray(v) || !v.every(isPlainObject)) throw new HttpError(400, 'sample_profiles must be an array of objects');
}

function validateCampaignBody(body) {
  assertOneOf('status', body.status, CAMPAIGN_STATUS);
  if (body.enabled_agents !== undefined) validateEnabledAgents(body.enabled_agents);
  if (body.sample_profiles !== undefined) validateSampleProfiles(body.sample_profiles);
}

router.post('/', async (req, res) => {
  try {
    const body = pick(req.body, FIELDS);
    requireFields(body, ['name']);
    validateCampaignBody(body);
    const data = unwrap(await supabase.from('campaigns').insert(body).select().single());
    res.status(201).json(data);
  } catch (err) {
    handleError(res, err);
  }
});

router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    assertOneOf('status', status, CAMPAIGN_STATUS);
    const { from, to } = pageRange(req.query);
    let q = supabase.from('campaigns').select('*').order('created_at', { ascending: false }).range(from, to);
    if (status) q = q.eq('status', status);
    res.json(unwrap(await q));
  } catch (err) {
    handleError(res, err);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const data = unwrap(await supabase.from('campaigns').select('*').eq('id', req.params.id).maybeSingle());
    if (!data) throw notFound('Campaign');
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const body = pick(req.body, FIELDS);
    assertNotEmpty(body);
    validateCampaignBody(body);
    // enabled_agents is MERGED into what's stored, so pausing one agent never re-enables another that was paused earlier.
    // Send { "voice": true } to re-enable an agent.
    if (body.enabled_agents !== undefined) {
      const current = unwrap(await supabase.from('campaigns').select('enabled_agents').eq('id', req.params.id).maybeSingle());
      if (!current) throw notFound('Campaign');
      body.enabled_agents = { ...(current.enabled_agents || {}), ...body.enabled_agents };
    }
    const data = unwrap(
      await supabase.from('campaigns').update(body).eq('id', req.params.id).select().maybeSingle()
    );
    if (!data) throw notFound('Campaign');
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
});

// Find new prospects for this campaign from its ICP (Tavily search + Groq extraction). Adds them as 'discovered' and logs one
// 'discovery' activity. Body: { limit? } (default 5, max 10). Contacts nobody and calls no DronaHQ agent, so it is safe and cheap.
// 423 { blocked, reason } if the kill switch is on, 503 if GROQ_API_KEY / TAVILY_API_KEY are not set, 502 if Tavily or Groq fails.
router.post('/:id/discover', async (req, res) => {
  try {
    const result = await runDiscovery(req.params.id, { limit: req.body && req.body.limit });
    if (result.blocked) return res.status(423).json({ blocked: true, reason: result.reason });
    res.json({
      campaign_id: req.params.id,
      queries: result.queries,
      found: result.found,
      created: result.created.map((c) => ({ campaign_prospect_id: c.campaign_prospect.id, reused_prospect: c.reused_prospect, prospect: c.prospect })),
      skipped: result.skipped,
      usage: result.usage,
    });
  } catch (err) {
    handleError(res, err);
  }
});

// Discover, then run research and ICP scoring on every NEW prospect. THIS CALLS THE REAL DronaHQ AGENTS AND SPENDS CREDITS, so it
// only runs on an explicit human action: the body must carry { confirm_spend: true } (the UI sends it only after a confirmation
// dialog), and nothing else in the system calls it. Body: { confirm_spend: true, limit? }.
// Per-prospect failures are reported in the 200 response; a gate block (kill switch / campaign not live / agent paused) stops the rest.
router.post('/:id/discover-and-qualify', async (req, res) => {
  try {
    if (!req.body || req.body.confirm_spend !== true) {
      throw new HttpError(400, 'discover-and-qualify calls the real DronaHQ agents and spends credits. Send { "confirm_spend": true } to confirm you want that.');
    }
    const result = await runDiscoverAndQualify(req.params.id, { limit: req.body.limit });
    if (result.blocked) return res.status(423).json({ blocked: true, reason: result.reason });
    res.json({ campaign_id: req.params.id, ...result });
  } catch (err) {
    handleError(res, err);
  }
});

// Everything that hangs off a campaign through campaign_id. db/schema.sql declares all of them ON DELETE CASCADE, so deleting the
// campaign row removes them in the same statement (all or nothing). Listed here only to report what was removed.
const CAMPAIGN_CHILD_TABLES = ['campaign_prospects', 'activities', 'prompt_versions', 'campaign_reps', 'approvals', 'meetings'];

// Permanently delete a campaign and its own data: its prospect links, activities, prompt versions, rep assignments, approvals and
// meetings. The prospects themselves are NOT deleted (a prospect can be in other campaigns); only this campaign's link to them goes.
// Body: { confirm_name } must equal the campaign's name exactly, or 400 and nothing is touched. No agent is ever called.
router.delete('/:id', async (req, res) => {
  try {
    const campaign = unwrap(await supabase.from('campaigns').select('id, name').eq('id', req.params.id).maybeSingle());
    if (!campaign) throw notFound('Campaign');
    const confirm = req.body && req.body.confirm_name;
    if (typeof confirm !== 'string' || confirm !== campaign.name) {
      throw new HttpError(400, 'confirm_name must match the campaign name exactly. Nothing was deleted.');
    }
    const removed = {};
    for (const table of CAMPAIGN_CHILD_TABLES) {
      const { count, error } = await supabase.from(table).select('campaign_id', { count: 'exact', head: true }).eq('campaign_id', campaign.id); // campaign_reps has no id column
      if (error) throw error;
      removed[table] = count || 0;
    }
    unwrap(await supabase.from('campaigns').delete().eq('id', campaign.id));
    const by = req.auth && req.auth.user ? req.auth.user.email : 'unknown';
    console.log(`Campaign deleted: "${campaign.name}" (${campaign.id}) by ${by}; removed ${JSON.stringify(removed)}`);
    res.json({ deleted: true, campaign: { id: campaign.id, name: campaign.name }, removed });
  } catch (err) {
    handleError(res, err);
  }
});

// Change only the campaign's lifecycle status (Launch / Pause / Resume in the UI). Body: { status }.
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body || {};
    requireFields({ status }, ['status']);
    assertOneOf('status', status, CAMPAIGN_STATUS);
    const data = unwrap(await supabase.from('campaigns').update({ status }).eq('id', req.params.id).select().maybeSingle());
    if (!data) throw notFound('Campaign');
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
});

// Activity log for one campaign, newest first, with the prospect embedded. Filters: ?agent_type=&status=&limit=&offset=
router.get('/:id/activities', async (req, res) => {
  try {
    assertOneOf('status', req.query.status, ACTIVITY_STATUS);
    assertOneOf('agent_type', req.query.agent_type, AGENT_TYPES.concat('dispatch', 'discovery'));
    const campaign = unwrap(await supabase.from('campaigns').select('id').eq('id', req.params.id).maybeSingle());
    if (!campaign) throw notFound('Campaign');
    const { from, to } = pageRange(req.query);
    let q = supabase
      .from('activities')
      .select('*, prospect:prospects(id, name, title, company)')
      .eq('campaign_id', req.params.id)
      .order('created_at', { ascending: false })
      .range(from, to);
    for (const f of ['agent_type', 'status']) {
      if (req.query[f]) q = q.eq(f, req.query[f]);
    }
    res.json(unwrap(await q));
  } catch (err) {
    handleError(res, err);
  }
});

// Cost report from this campaign's activities (costs are estimates). Ratios are null when the divisor is 0.
router.get('/:id/cost-report', async (req, res) => {
  try {
    const campaign = unwrap(await supabase.from('campaigns').select('id, name').eq('id', req.params.id).maybeSingle());
    if (!campaign) throw notFound('Campaign');
    res.json(await buildCostReport(campaign));
  } catch (err) {
    handleError(res, err);
  }
});

// Prospects linked to a campaign, with the prospect record embedded.
router.get('/:id/campaign-prospects', async (req, res) => {
  try {
    const { funnel_state } = req.query;
    assertOneOf('funnel_state', funnel_state, FUNNEL_STATE);
    const campaign = unwrap(
      await supabase.from('campaigns').select('id').eq('id', req.params.id).maybeSingle()
    );
    if (!campaign) throw notFound('Campaign');

    const { from, to } = pageRange(req.query);
    let q = supabase
      .from('campaign_prospects')
      .select('*, prospect:prospects(*)')
      .eq('campaign_id', req.params.id)
      .order('created_at', { ascending: false })
      .range(from, to);
    if (funnel_state) q = q.eq('funnel_state', funnel_state);
    res.json(unwrap(await q));
  } catch (err) {
    handleError(res, err);
  }
});

module.exports = router;
