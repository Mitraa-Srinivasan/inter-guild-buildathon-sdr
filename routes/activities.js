const router = require('express').Router();
const { supabase, unwrap } = require('../db/supabase');
const { handleError, pick, requireFields, assertOneOf, pageRange, HttpError } = require('../lib/http');
const { ACTIVITY_STATUS } = require('../lib/enums');

const FIELDS = [
  'campaign_id',
  'prospect_id',
  'agent_type',
  'action_type',
  'channel',
  'prompt_version_id',
  'model',
  'input_summary',
  'output_summary',
  'tokens',
  'cost',
  'status',
];

router.post('/', async (req, res) => {
  try {
    const body = pick(req.body, FIELDS);
    requireFields(body, ['campaign_id', 'agent_type', 'action_type']);
    assertOneOf('status', body.status, ACTIVITY_STATUS);
    const data = unwrap(await supabase.from('activities').insert(body).select().single());
    res.status(201).json(data);
  } catch (err) {
    handleError(res, err);
  }
});

// Total estimated cost (USD) of the activities since a moment, for "AI spend today". ?since=<ISO datetime>, default the
// start of the current UTC day. Sums whole micro-dollars (activities.cost is numeric(12,6)) reading in 1000-row pages.
router.get('/spend', async (req, res) => {
  try {
    const since = req.query.since ? new Date(req.query.since) : new Date(new Date().setUTCHours(0, 0, 0, 0));
    if (Number.isNaN(since.getTime())) throw new HttpError(400, 'since must be an ISO date-time');
    let micro = 0;
    let count = 0;
    for (let from = 0; ; from += 1000) {
      const page = unwrap(
        await supabase.from('activities').select('cost').gte('created_at', since.toISOString()).order('id').range(from, from + 999)
      );
      for (const a of page) micro += Math.round(Number(a.cost || 0) * 1e6);
      count += page.length;
      if (page.length < 1000) break;
    }
    res.json({ since: since.toISOString(), total_cost: micro / 1e6, activity_count: count, currency: 'USD', cost_basis: 'estimated' });
  } catch (err) {
    handleError(res, err);
  }
});

// Filters: ?campaign_id=&prospect_id=&agent_type=&status=&limit=&offset=
router.get('/', async (req, res) => {
  try {
    assertOneOf('status', req.query.status, ACTIVITY_STATUS);
    const { from, to } = pageRange(req.query);
    let q = supabase.from('activities').select('*').order('created_at', { ascending: false }).range(from, to);
    for (const f of ['campaign_id', 'prospect_id', 'agent_type', 'status']) {
      if (req.query[f]) q = q.eq(f, req.query[f]);
    }
    res.json(unwrap(await q));
  } catch (err) {
    handleError(res, err);
  }
});

module.exports = router;
