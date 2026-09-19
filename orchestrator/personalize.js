const { supabase, unwrap } = require('../db/supabase');
const { HttpError } = require('../lib/http');
const { preSendGate } = require('./gate');
const { callDronaHQPrompt } = require('../agents/dronaHQ');
const { loadCampaignProspect, logActivity, logFailedActivity, mergeContext } = require('./common');

const present = (v) => v !== undefined && v !== null && v !== '';
const show = (v) => (typeof v === 'object' ? JSON.stringify(v) : String(v));

// context_json keys written by this step; excluded from the prompt so an old draft isn't fed back in.
const DRAFT_KEYS = ['email_subject', 'email_body', 'email_snippets_used'];

// Who the email should be signed by: the prospect's assigned rep if set, otherwise a rep on this campaign
// (campaign_reps). Only active reps with an identity_for_outreach count. Returns the identity text, or null.
async function loadSenderIdentity(cp) {
  const usable = (rep) => rep && rep.active && present(rep.identity_for_outreach);

  if (cp.assigned_rep_id) {
    const assigned = unwrap(
      await supabase.from('reps').select('name, identity_for_outreach, active').eq('id', cp.assigned_rep_id).maybeSingle()
    );
    if (usable(assigned)) return assigned.identity_for_outreach.trim();
  }

  const rows = unwrap(
    await supabase.from('campaign_reps').select('rep:reps(name, identity_for_outreach, active)').eq('campaign_id', cp.campaign_id)
  );
  const reps = rows.map((r) => r.rep).filter(usable).sort((a, b) => a.name.localeCompare(b.name)); // name order keeps the pick stable
  return reps.length ? reps[0].identity_for_outreach.trim() : null;
}

// Single prompt string: basic prospect info + the research / context gathered so far (+ who signs the email).
function buildPersonalizePrompt(prospect, context, senderIdentity = null) {
  const lines = [
    `Name: ${prospect.name}`,
    `Title: ${present(prospect.title) ? prospect.title : 'not provided'}`,
    `Company: ${present(prospect.company) ? prospect.company : 'not provided'}`,
  ];
  if (present(senderIdentity)) lines.push('', `Sender (sign off the email as this person): ${senderIdentity}`);
  if (present(context.research)) lines.push('', 'Research:', String(context.research).trim());
  const other = Object.entries(context).filter(([k, v]) => k !== 'research' && !DRAFT_KEYS.includes(k) && present(v));
  if (other.length) {
    lines.push('', 'Additional context:');
    for (const [k, v] of other) lines.push(`- ${k}: ${show(v)}`);
  }
  return lines.join('\n');
}

// Tolerant of markdown around labels: "Subject: x", "**Subject**: x", "**Subject:** x".
const LEAD = '^[\\s*#>_-]*';
const SUBJECT_RE = new RegExp(`${LEAD}Subject\\**\\s*:\\**[ \\t]*(.+)$`, 'im');
const BODY_RE = new RegExp(`${LEAD}Body\\**\\s*:\\**\\s*([\\s\\S]*?)(?=${LEAD}Snippets used\\**\\s*:|(?![\\s\\S]))`, 'im');
const SNIPPETS_RE = new RegExp(`${LEAD}Snippets used\\**\\s*:\\**\\s*([\\s\\S]*)$`, 'im');

const stripStars = (s) => s.replace(/^\**\s*|\s*\**$/g, '').trim();

// Throws HttpError(500) if subject or body can't be found. Snippets are optional.
function parseEmailDraft(raw) {
  const subject = SUBJECT_RE.exec(raw);
  const body = BODY_RE.exec(raw);
  const snippets = SNIPPETS_RE.exec(raw);
  const subjectText = subject && stripStars(subject[1]);
  const bodyText = body && body[1].trim();
  if (!subjectText) throw new HttpError(500, 'Personalisation agent response could not be parsed: no "Subject" found');
  if (!bodyText) throw new HttpError(500, 'Personalisation agent response could not be parsed: no "Body" found');
  return { subject: subjectText, body: bodyText, snippetsUsed: snippets ? snippets[1].trim() : null };
}

// Returns { blocked: true, reason } if the gate stops the run, otherwise { blocked: false, campaignProspect }.
// Throws HttpError(400) unless the prospect is 'qualified' and has research/context to personalise from.
async function runPersonalize(campaignProspectId) {
  const cp = await loadCampaignProspect(campaignProspectId);

  const reason = await preSendGate(cp.campaign);
  if (reason) return { blocked: true, reason };

  if (cp.funnel_state !== 'qualified') {
    throw new HttpError(400, `Prospect must be in funnel_state 'qualified' to personalize (currently '${cp.funnel_state}')`);
  }
  const context = cp.context_json || {};
  if (!Object.keys(context).some((k) => !DRAFT_KEYS.includes(k) && present(context[k]))) {
    throw new HttpError(400, 'No research or context on this prospect yet; run run-research first');
  }

  const prompt = buildPersonalizePrompt(cp.prospect, context, await loadSenderIdentity(cp));
  let raw;
  try {
    raw = await callDronaHQPrompt('personalisation', prompt);
  } catch (err) {
    await logFailedActivity(cp, 'personalisation', 'draft_email', prompt, '', err.message);
    throw err;
  }

  let draft;
  try {
    draft = parseEmailDraft(raw);
  } catch (err) {
    await logFailedActivity(cp, 'personalisation', 'draft_email', prompt, raw, err.message);
    throw err;
  }

  const updated = await mergeContext(cp, {
    email_subject: draft.subject,
    email_body: draft.body,
    email_snippets_used: draft.snippetsUsed,
  });
  await logActivity(cp, 'personalisation', 'draft_email', prompt, raw, 'success');
  return { blocked: false, campaignProspect: updated };
}

module.exports = { runPersonalize, buildPersonalizePrompt, parseEmailDraft, loadSenderIdentity };
