const { HttpError } = require('../lib/http');
const { loadSenderIdentity } = require('./sender');
const { loadActiveGuidance, appendGuidance } = require('./guidance');
const { preSendGate } = require('./gate');
const { callDronaHQPrompt } = require('../agents/dronaHQ');
const { loadCampaignProspect, logActivity, logFailedActivity, mergeContext } = require('./common');

const present = (v) => v !== undefined && v !== null && v !== '';
const show = (v) => (typeof v === 'object' ? JSON.stringify(v) : String(v));

// context_json keys written by this step; excluded from the prompt so an old draft isn't fed back in.
const DRAFT_KEYS = ['email_subject', 'email_body', 'email_snippets_used'];

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

  const guidance = await loadActiveGuidance(cp.campaign_id, 'personalisation');
  const promptVersionId = guidance ? guidance.id : null;
  const prompt = appendGuidance(buildPersonalizePrompt(cp.prospect, context, await loadSenderIdentity(cp)), guidance);
  let raw;
  try {
    raw = await callDronaHQPrompt('personalisation', prompt);
  } catch (err) {
    await logFailedActivity(cp, 'personalisation', 'draft_email', prompt, '', err.message, promptVersionId);
    throw err;
  }

  let draft;
  try {
    draft = parseEmailDraft(raw);
  } catch (err) {
    await logFailedActivity(cp, 'personalisation', 'draft_email', prompt, raw, err.message, promptVersionId);
    throw err;
  }

  const updated = await mergeContext(cp, {
    email_subject: draft.subject,
    email_body: draft.body,
    email_snippets_used: draft.snippetsUsed,
  });
  await logActivity(cp, 'personalisation', 'draft_email', prompt, raw, 'success', null, { promptVersionId });
  return { blocked: false, campaignProspect: updated };
}

module.exports = { runPersonalize, buildPersonalizePrompt, parseEmailDraft, loadSenderIdentity };
