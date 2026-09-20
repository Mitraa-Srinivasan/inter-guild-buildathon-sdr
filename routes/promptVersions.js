// Campaign-specific guidance, versioned. DronaHQ's own agent Instructions stay global; the active version for a
// campaign + agent type is appended to the prompt we send (see orchestrator/guidance.js) and its id is recorded on
// every activity it influenced (activities.prompt_version_id).
const router = require('express').Router({ mergeParams: true }); // mounted at /campaigns/:id/prompt-versions
const { supabase, unwrap } = require('../db/supabase');
const { handleError, pick, requireFields, assertOneOf, HttpError, notFound } = require('../lib/http');
const { AGENT_TYPES } = require('../lib/enums');

const MAX_CONTENT_CHARS = 10000;

async function assertCampaignExists(id) {
  const campaign = unwrap(await supabase.from('campaigns').select('id').eq('id', id).maybeSingle());
  if (!campaign) throw notFound('Campaign');
}

// Body: { agent_type, content, changed_by }. Creates the next version for this campaign + agent_type, inactive.
router.post('/', async (req, res) => {
  try {
    const body = pick(req.body, ['agent_type', 'content', 'changed_by']);
    requireFields(body, ['agent_type', 'content', 'changed_by']);
    assertOneOf('agent_type', body.agent_type, AGENT_TYPES);
    if (typeof body.content !== 'string' || !body.content.trim()) throw new HttpError(400, 'content must be a non-empty string');
    if (body.content.length > MAX_CONTENT_CHARS) throw new HttpError(400, `content must be at most ${MAX_CONTENT_CHARS} characters`);
    if (typeof body.changed_by !== 'string' || !body.changed_by.trim()) throw new HttpError(400, 'changed_by must be a non-empty string');
    await assertCampaignExists(req.params.id);

    // version = max + 1 per campaign + agent_type. Two simultaneous creates can pick the same number; the unique
    // (campaign_id, agent_type, version) constraint rejects the loser, which simply retries.
    for (let attempt = 0; attempt < 3; attempt++) {
      const latest = unwrap(
        await supabase
          .from('prompt_versions')
          .select('version')
          .eq('campaign_id', req.params.id)
          .eq('agent_type', body.agent_type)
          .order('version', { ascending: false })
          .limit(1)
      );
      const { data, error } = await supabase
        .from('prompt_versions')
        .insert({
          campaign_id: req.params.id,
          agent_type: body.agent_type,
          version: (latest.length ? latest[0].version : 0) + 1,
          content: body.content.trim(),
          changed_by: body.changed_by.trim(),
          is_active: false,
        })
        .select()
        .single();
      if (!error) return res.status(201).json(data);
      if (error.code !== '23505') throw error;
    }
    throw new HttpError(409, 'Could not allocate a version number; please retry');
  } catch (err) {
    handleError(res, err);
  }
});

// Filter: ?agent_type=icp. Newest version first within each agent type.
router.get('/', async (req, res) => {
  try {
    assertOneOf('agent_type', req.query.agent_type, AGENT_TYPES);
    await assertCampaignExists(req.params.id);
    let q = supabase
      .from('prompt_versions')
      .select('*')
      .eq('campaign_id', req.params.id)
      .order('agent_type', { ascending: true })
      .order('version', { ascending: false });
    if (req.query.agent_type) q = q.eq('agent_type', req.query.agent_type);
    res.json(unwrap(await q));
  } catch (err) {
    handleError(res, err);
  }
});

// Makes this version the active one for its campaign + agent_type (and deactivates the previous active one).
// Activating an older version is how you roll back. Not atomic (no transactions in supabase-js): the current
// version is deactivated first, and if activating the new one fails the previous one is put back.
router.patch('/:versionId/activate', async (req, res) => {
  try {
    const target = unwrap(
      await supabase.from('prompt_versions').select('*').eq('id', req.params.versionId).eq('campaign_id', req.params.id).maybeSingle()
    );
    if (!target) throw notFound('Prompt version');
    if (target.is_active) return res.json(target); // already active

    const current = unwrap(
      await supabase.from('prompt_versions').select('id').eq('campaign_id', target.campaign_id).eq('agent_type', target.agent_type).eq('is_active', true)
    );
    if (current.length) {
      unwrap(
        await supabase.from('prompt_versions').update({ is_active: false }).eq('campaign_id', target.campaign_id).eq('agent_type', target.agent_type).eq('is_active', true)
      );
    }
    try {
      res.json(unwrap(await supabase.from('prompt_versions').update({ is_active: true }).eq('id', target.id).select().single()));
    } catch (err) {
      if (current.length) await supabase.from('prompt_versions').update({ is_active: true }).eq('id', current[0].id); // best-effort restore
      throw err;
    }
  } catch (err) {
    handleError(res, err);
  }
});

module.exports = router;
