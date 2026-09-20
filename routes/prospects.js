const router = require('express').Router();
const { supabase, unwrap } = require('../db/supabase');
const { handleError, pick, requireFields, notFound } = require('../lib/http');

const FIELDS = ['name', 'title', 'company', 'linkedin_url', 'email', 'phone', 'company_data_json', 'source'];

router.post('/', async (req, res) => {
  try {
    const body = pick(req.body, FIELDS);
    requireFields(body, ['name']);
    const data = unwrap(await supabase.from('prospects').insert(body).select().single());
    res.status(201).json(data);
  } catch (err) {
    handleError(res, err);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const data = unwrap(await supabase.from('prospects').select('*').eq('id', req.params.id).maybeSingle());
    if (!data) throw notFound('Prospect');
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
});

module.exports = router;
