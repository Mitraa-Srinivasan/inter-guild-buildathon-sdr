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
const { CAMPAIGN_STATUS, FUNNEL_STATE, AGENT_TYPES } = require('../lib/enums');
const { buildCostReport } = require('../lib/costReport');

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
