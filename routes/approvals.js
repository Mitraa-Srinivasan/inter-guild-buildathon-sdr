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
} = require('../lib/http');
const { APPROVAL_STATUS } = require('../lib/enums');

const CREATE_FIELDS = ['campaign_id', 'prospect_id', 'activity_id', 'proposed_action_json'];
const UPDATE_FIELDS = ['status', 'resolved_by', 'proposed_action_json'];

router.post('/', async (req, res) => {
  try {
    const body = pick(req.body, CREATE_FIELDS);
    requireFields(body, ['campaign_id', 'prospect_id', 'proposed_action_json']);
    const data = unwrap(await supabase.from('approvals').insert(body).select().single());
    res.status(201).json(data);
  } catch (err) {
    handleError(res, err);
  }
});

// Filters: ?status=&campaign_id=&prospect_id=. Oldest first so the queue reads in FIFO order.
router.get('/', async (req, res) => {
  try {
    assertOneOf('status', req.query.status, APPROVAL_STATUS);
    const { from, to } = pageRange(req.query);
    let q = supabase.from('approvals').select('*').order('created_at', { ascending: true }).range(from, to);
    for (const f of ['status', 'campaign_id', 'prospect_id']) {
      if (req.query[f]) q = q.eq(f, req.query[f]);
    }
    res.json(unwrap(await q));
  } catch (err) {
    handleError(res, err);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const data = unwrap(await supabase.from('approvals').select('*').eq('id', req.params.id).maybeSingle());
    if (!data) throw notFound('Approval');
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
});

// Approve/reject: PATCH { status: "approved" | "rejected", resolved_by }.
// resolved_at is stamped automatically when the status leaves 'pending'.
router.patch('/:id', async (req, res) => {
  try {
    const body = pick(req.body, UPDATE_FIELDS);
    assertNotEmpty(body);
    assertOneOf('status', body.status, APPROVAL_STATUS);
    if (body.status === 'pending') {
      body.resolved_at = null;
      body.resolved_by = null;
    } else if (body.status) {
      body.resolved_at = new Date().toISOString();
    }
    const data = unwrap(
      await supabase.from('approvals').update(body).eq('id', req.params.id).select().maybeSingle()
    );
    if (!data) throw notFound('Approval');
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
});

module.exports = router;
