const router = require('express').Router();
const { supabase, unwrap } = require('../db/supabase');
const { handleError, pick, requireFields, assertNotEmpty, pageRange, notFound, HttpError } = require('../lib/http');

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

// What offboarding a rep would touch: the campaigns they are linked to (and whether each would be left with no other
// active rep), how many prospects are assigned to them, and which active reps could take over.
async function loadOffboardImpact(repId) {
  const rep = unwrap(await supabase.from('reps').select('*').eq('id', repId).maybeSingle());
  if (!rep) throw notFound('Rep');

  const links = unwrap(
    await supabase.from('campaign_reps').select('campaign_id, campaign:campaigns(id, name, status)').eq('rep_id', repId)
  ).filter((l) => l.campaign);

  const covered = new Set(); // campaigns that have some OTHER active rep
  if (links.length) {
    const others = unwrap(
      await supabase.from('campaign_reps').select('campaign_id, rep:reps(active)').in('campaign_id', links.map((l) => l.campaign_id)).neq('rep_id', repId)
    );
    for (const o of others) if (o.rep && o.rep.active) covered.add(o.campaign_id);
  }

  const { count, error } = await supabase.from('campaign_prospects').select('id', { count: 'exact', head: true }).eq('assigned_rep_id', repId);
  if (error) throw error;

  const candidates = unwrap(
    await supabase.from('reps').select('id, name, identity_for_outreach').eq('active', true).neq('id', repId).order('name')
  );

  return {
    rep,
    campaigns: links
      .map((l) => ({ id: l.campaign.id, name: l.campaign.name, status: l.campaign.status, left_without_rep: !covered.has(l.campaign_id) }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    assigned_prospect_count: count || 0,
    replacement_candidates: candidates,
  };
}

// Preview for the Offboard dialog. Read-only.
router.get('/:id/impact', async (req, res) => {
  try {
    const { rep, ...impact } = await loadOffboardImpact(req.params.id);
    res.json({ rep: { id: rep.id, name: rep.name, active: rep.active }, ...impact });
  } catch (err) {
    handleError(res, err);
  }
});

// Offboard a rep. Body: { replacement_rep_id? }.
//   - Always returns the campaigns the rep was linked to, and which of them are left with no active rep.
//   - With a replacement: the replacement is linked to each of those campaigns, the prospects assigned to the
//     offboarded rep are handed to the replacement, and the offboarded rep's campaign links are removed.
//   - Without one: the rep is only deactivated. Their campaign links stay (so reactivating restores them), but a campaign
//     with no other active rep then sends without a sender identity, which is why it is flagged.
// There are no transactions, so the rep is deactivated only after the reassignment succeeded: a failure part-way leaves
// them active rather than leaving campaigns orphaned.
router.post('/:id/offboard', async (req, res) => {
  try {
    const impact = await loadOffboardImpact(req.params.id);
    if (!impact.rep.active) throw new HttpError(409, 'Rep is already offboarded');

    const replacementId = req.body && req.body.replacement_rep_id;
    let replacement = null;
    if (replacementId) {
      if (replacementId === impact.rep.id) throw new HttpError(400, 'The replacement must be a different rep');
      replacement = unwrap(await supabase.from('reps').select('id, name, active').eq('id', replacementId).maybeSingle());
      if (!replacement) throw notFound('Replacement rep');
      if (!replacement.active) throw new HttpError(400, 'The replacement rep is not active');

      for (const c of impact.campaigns) {
        unwrap(
          await supabase
            .from('campaign_reps')
            .upsert({ campaign_id: c.id, rep_id: replacement.id }, { onConflict: 'campaign_id,rep_id', ignoreDuplicates: true })
            .select()
        );
      }
      unwrap(await supabase.from('campaign_prospects').update({ assigned_rep_id: replacement.id }).eq('assigned_rep_id', impact.rep.id).select('id'));
    }

    const rep = unwrap(await supabase.from('reps').update({ active: false }).eq('id', impact.rep.id).select().single());
    if (replacement) unwrap(await supabase.from('campaign_reps').delete().eq('rep_id', impact.rep.id).select());

    res.json({
      rep,
      affected_campaigns: impact.campaigns.map((c) => ({ ...c, left_without_rep: replacement ? false : c.left_without_rep })),
      prospects_reassigned: replacement ? impact.assigned_prospect_count : 0,
      prospects_still_assigned: replacement ? 0 : impact.assigned_prospect_count,
      replacement: replacement ? { id: replacement.id, name: replacement.name } : null,
    });
  } catch (err) {
    handleError(res, err);
  }
});

// Plain update of a rep's fields, e.g. { active: true } to reactivate. To OFFBOARD, use POST /:id/offboard: setting
// { active: false } here changes nothing else and doesn't report which campaigns are affected.
router.patch('/:id', async (req, res) => {
  try {
    const body = pick(req.body, FIELDS);
    assertNotEmpty(body);
    if (body.active !== undefined && typeof body.active !== 'boolean') throw new HttpError(400, 'active must be a boolean');
    const data = unwrap(await supabase.from('reps').update(body).eq('id', req.params.id).select().maybeSingle());
    if (!data) throw notFound('Rep');
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
});

module.exports = router;
