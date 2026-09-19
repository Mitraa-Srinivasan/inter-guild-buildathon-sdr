const router = require('express').Router();
const { supabase, unwrap } = require('../db/supabase');
const { handleError, pick, requireFields, pageRange } = require('../lib/http');

const FIELDS = ['campaign_id', 'rep_id'];

// Assign a rep to a campaign (409 if already assigned).
router.post('/', async (req, res) => {
  try {
    const body = pick(req.body, FIELDS);
    requireFields(body, FIELDS);
    const data = unwrap(await supabase.from('campaign_reps').insert(body).select().single());
    res.status(201).json(data);
  } catch (err) {
    handleError(res, err);
  }
});

// Filters: ?campaign_id=&rep_id=. Each row embeds its rep.
router.get('/', async (req, res) => {
  try {
    const { from, to } = pageRange(req.query);
    let q = supabase.from('campaign_reps').select('*, rep:reps(*)').range(from, to);
    for (const f of FIELDS) {
      if (req.query[f]) q = q.eq(f, req.query[f]);
    }
    res.json(unwrap(await q));
  } catch (err) {
    handleError(res, err);
  }
});

module.exports = router;
