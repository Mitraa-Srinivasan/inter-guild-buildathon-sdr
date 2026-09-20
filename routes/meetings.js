const router = require('express').Router();
const { supabase, unwrap } = require('../db/supabase');
const { handleError, pick, requireFields, pageRange } = require('../lib/http');

const FIELDS = ['campaign_id', 'prospect_id', 'scheduled_at', 'status'];

router.post('/', async (req, res) => {
  try {
    const body = pick(req.body, FIELDS);
    requireFields(body, ['campaign_id', 'prospect_id']);
    const data = unwrap(await supabase.from('meetings').insert(body).select().single());
    res.status(201).json(data);
  } catch (err) {
    handleError(res, err);
  }
});

// Filters: ?campaign_id=&prospect_id=&status=
router.get('/', async (req, res) => {
  try {
    const { from, to } = pageRange(req.query);
    let q = supabase.from('meetings').select('*').order('scheduled_at', { ascending: true }).range(from, to);
    for (const f of ['campaign_id', 'prospect_id', 'status']) {
      if (req.query[f]) q = q.eq(f, req.query[f]);
    }
    res.json(unwrap(await q));
  } catch (err) {
    handleError(res, err);
  }
});

module.exports = router;
