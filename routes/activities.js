const router = require('express').Router();
const { supabase, unwrap } = require('../db/supabase');
const { handleError, pick, requireFields, assertOneOf, pageRange } = require('../lib/http');
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
