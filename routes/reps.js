const router = require('express').Router();
const { supabase, unwrap } = require('../db/supabase');
const { handleError, pick, requireFields, pageRange } = require('../lib/http');

const FIELDS = ['name', 'email', 'identity_for_outreach', 'daily_limit', 'working_hours', 'channels', 'active'];

router.post('/', async (req, res) => {
  try {
    const body = pick(req.body, FIELDS);
    requireFields(body, ['name', 'email']);
    const data = unwrap(await supabase.from('reps').insert(body).select().single());
    res.status(201).json(data);
  } catch (err) {
    handleError(res, err);
  }
});

// Filter: ?active=true|false
router.get('/', async (req, res) => {
  try {
    const { from, to } = pageRange(req.query);
    let q = supabase.from('reps').select('*').order('name').range(from, to);
    if (req.query.active !== undefined) q = q.eq('active', req.query.active === 'true');
    res.json(unwrap(await q));
  } catch (err) {
    handleError(res, err);
  }
});

module.exports = router;
