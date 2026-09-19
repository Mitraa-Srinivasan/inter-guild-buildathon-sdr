const router = require('express').Router();
const { supabase, unwrap } = require('../db/supabase');
const { handleError, pick, assertNotEmpty, HttpError } = require('../lib/http');

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

module.exports = router;
