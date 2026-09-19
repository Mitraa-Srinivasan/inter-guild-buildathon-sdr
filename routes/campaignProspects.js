const router = require('express').Router();
const { supabase, unwrap } = require('../db/supabase');
const { handleError, pick, requireFields, assertOneOf, HttpError } = require('../lib/http');
const { FUNNEL_STATE } = require('../lib/enums');
const { runIcp } = require('../orchestrator/icp');
const { runResearch } = require('../orchestrator/research');
const { runPersonalize } = require('../orchestrator/personalize');
const { runStrategy } = require('../orchestrator/strategy');
const { runConversation } = require('../orchestrator/conversation');
const { runFollowup } = require('../orchestrator/followup');
const { runVoice } = require('../orchestrator/voice');

const FIELDS = [
  'campaign_id',
  'prospect_id',
  'funnel_state',
  'icp_score',
  'icp_reasoning',
  'context_json',
  'assigned_rep_id',
];

// Link a prospect to a campaign. A prospect can be linked to a given campaign only once (409 otherwise).
router.post('/', async (req, res) => {
  try {
    const body = pick(req.body, FIELDS);
    requireFields(body, ['campaign_id', 'prospect_id']);
    assertOneOf('funnel_state', body.funnel_state, FUNNEL_STATE);
    const data = unwrap(await supabase.from('campaign_prospects').insert(body).select().single());
    res.status(201).json(data);
  } catch (err) {
    handleError(res, err);
  }
});

// Orchestrator step: score the prospect against the campaign ICP.
// 423 { blocked, reason } if the pre-send gate stops it (kill switch / campaign not live).
router.post('/:id/run-icp', async (req, res) => {
  try {
    const result = await runIcp(req.params.id);
    if (result.blocked) return res.status(423).json({ blocked: true, reason: result.reason });
    res.json(result.campaignProspect);
  } catch (err) {
    handleError(res, err);
  }
});

// Orchestrator step: research the prospect; raw output stored in context_json.research.
router.post('/:id/run-research', async (req, res) => {
  try {
    const result = await runResearch(req.params.id);
    if (result.blocked) return res.status(423).json({ blocked: true, reason: result.reason });
    res.json(result.campaignProspect);
  } catch (err) {
    handleError(res, err);
  }
});

// Orchestrator step: draft a personalised email from the research. Only for 'qualified' prospects (400 otherwise).
router.post('/:id/run-personalize', async (req, res) => {
  try {
    const result = await runPersonalize(req.params.id);
    if (result.blocked) return res.status(423).json({ blocked: true, reason: result.reason });
    res.json(result.campaignProspect);
  } catch (err) {
    handleError(res, err);
  }
});

// Orchestrator step: decide channel/timing. Only for 'qualified' prospects (400 otherwise).
router.post('/:id/run-strategy', async (req, res) => {
  try {
    const result = await runStrategy(req.params.id);
    if (result.blocked) return res.status(423).json({ blocked: true, reason: result.reason });
    res.json(result.campaignProspect);
  } catch (err) {
    handleError(res, err);
  }
});

// Orchestrator step: classify an inbound reply. Body: { reply_text } (required).
// 'positive' -> funnel_state 'engaged'; 'unsubscribe' -> prospect's email added to suppression_list.
router.post('/:id/run-conversation', async (req, res) => {
  try {
    const replyText = req.body && req.body.reply_text;
    if (typeof replyText !== 'string' || !replyText.trim()) {
      throw new HttpError(400, 'Missing required field(s): reply_text');
    }
    const result = await runConversation(req.params.id, replyText);
    if (result.blocked) return res.status(423).json({ blocked: true, reason: result.reason });
    res.json(result.campaignProspect);
  } catch (err) {
    handleError(res, err);
  }
});

// Orchestrator step: decide the next follow-up from this prospect's recent activity.
router.post('/:id/run-followup', async (req, res) => {
  try {
    const result = await runFollowup(req.params.id);
    if (result.blocked) return res.status(423).json({ blocked: true, reason: result.reason });
    res.json(result.campaignProspect);
  } catch (err) {
    handleError(res, err);
  }
});

// Orchestrator step: run a voice call. Requires the phone channel to be enabled for the campaign (400 otherwise).
router.post('/:id/run-voice', async (req, res) => {
  try {
    const result = await runVoice(req.params.id);
    if (result.blocked) return res.status(423).json({ blocked: true, reason: result.reason });
    res.json(result.campaignProspect);
  } catch (err) {
    handleError(res, err);
  }
});

module.exports = router;
