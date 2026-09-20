const router = require('express').Router();
const { supabase, unwrap } = require('../db/supabase');
const { handleError, pick, requireFields, HttpError, pageRange } = require('../lib/http');

const FIELDS = ['value', 'reason', 'scope'];

// Values (emails, domains, LinkedIn URLs) are trimmed and lowercased so lookups are case-insensitive.
router.post('/', async (req, res) => {
  try {
    const body = pick(req.body, FIELDS);
    requireFields(body, ['value']);
    if (typeof body.value !== 'string') throw new HttpError(400, 'value must be a string');
    body.value = body.value.trim().toLowerCase();
    requireFields(body, ['value']);
    const data = unwrap(await supabase.from('suppression_list').insert(body).select().single());
    res.status(201).json(data);
  } catch (err) {
    handleError(res, err);
  }
});

// Filters: ?scope=&value=
router.get('/', async (req, res) => {
  try {
    const { from, to } = pageRange(req.query);
    let q = supabase.from('suppression_list').select('*').order('value').range(from, to);
    if (req.query.scope) q = q.eq('scope', req.query.scope);
    if (req.query.value) q = q.eq('value', String(req.query.value).trim().toLowerCase());
    res.json(unwrap(await q));
  } catch (err) {
    handleError(res, err);
  }
});

module.exports = router;
