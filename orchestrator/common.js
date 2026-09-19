const { supabase, unwrap } = require('../db/supabase');
const { HttpError, notFound } = require('../lib/http');
const { preSendGate } = require('./gate');
const { callDronaHQPrompt } = require('../agents/dronaHQ');

// Campaign prospect with its prospect and campaign embedded.
async function loadCampaignProspect(id) {
  const cp = unwrap(
    await supabase
      .from('campaign_prospects')
      .select('*, prospect:prospects(*), campaign:campaigns(*)')
      .eq('id', id)
      .maybeSingle()
  );
  if (!cp) throw notFound('Campaign prospect');
  return cp;
}

async function logActivity(cp, agentType, actionType, inputSummary, outputSummary, status) {
  unwrap(
    await supabase.from('activities').insert({
      campaign_id: cp.campaign_id,
      prospect_id: cp.prospect_id,
      agent_type: agentType,
      action_type: actionType,
      input_summary: inputSummary,
      output_summary: outputSummary,
      status,
    })
  );
}

// Best effort: a failed run should leave a trace, but logging must never mask the original error.
async function logFailedActivity(cp, agentType, actionType, prompt, raw, reason) {
  try {
    await logActivity(cp, agentType, actionType, prompt, raw ? `${reason}\n\n${raw}` : reason, 'failed');
  } catch (logErr) {
    console.error(`Failed to record failed ${agentType} activity:`, logErr);
  }
}

// Merge new keys into campaign_prospects.context_json, keeping what's already there.
// `columns` lets the same UPDATE set other columns (e.g. funnel_state).
async function mergeContext(cp, additions, columns = {}) {
  return unwrap(
    await supabase
      .from('campaign_prospects')
      .update({ ...columns, context_json: { ...(cp.context_json || {}), ...additions } })
      .eq('id', cp.id)
      .select()
      .single()
  );
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');

// Drop markdown bold that wraps the whole value ("**Yes**") or is left unbalanced by the label split ("Yes**" / "**Yes").
function cleanValue(v) {
  v = v.trim();
  const wrapped = /^\*\*([^*][\s\S]*?)\*\*$/.exec(v);
  if (wrapped && !wrapped[1].includes('**')) return wrapped[1].trim();
  if (((v.match(/\*\*/g) || []).length) % 2 === 1) v = v.startsWith('**') ? v.slice(2) : v.replace(/\*\*$/, '');
  return v.trim();
}

// Parses "Label: value" fields out of free text. Tolerant of markdown around labels
// ("Label: x", "**Label**: x", "**Label:** x", "- Label: x"). A value runs until the next label, so it
// may span several lines. Throws HttpError(500) if any label is missing or empty.
// keepFormatting: labels whose value is kept verbatim (only trimmed), e.g. a transcript.
function parseFields(raw, labels, agentName, { keepFormatting = [] } = {}) {
  const hits = [];
  for (const label of labels) {
    const m = new RegExp(`^[\\s*#>_-]*${escapeRe(label)}\\**\\s*:\\**[ \\t]*`, 'im').exec(raw);
    if (m) hits.push({ label, start: m.index, valueStart: m.index + m[0].length });
  }
  hits.sort((a, b) => a.start - b.start);
  const out = {};
  hits.forEach((h, i) => {
    const end = i + 1 < hits.length ? hits[i + 1].start : raw.length;
    const value = raw.slice(h.valueStart, end);
    out[h.label] = keepFormatting.includes(h.label) ? value.trim() : cleanValue(value);
  });
  const missing = labels.filter((l) => !out[l]);
  if (missing.length) {
    throw new HttpError(500, `${agentName} response could not be parsed: missing ${missing.map((l) => `"${l}"`).join(', ')}`);
  }
  return out;
}

// Shared pipeline for single-{prompt} agent steps:
//   load -> pre-send gate -> precheck -> build prompt -> call agent -> parse -> apply writes -> log activity.
// Agent-call and parse failures are logged as 'failed' activities and rethrown; nothing is written to the prospect.
// step: { agentType, actionType, precheck?(cp), buildPrompt(cp), parse(raw, cp), apply(cp, parsed) -> updated row }
// parse() may also validate against the campaign (cp.campaign); throwing there is logged like any parse failure.
// Returns { blocked: true, reason } if the gate stops the run, otherwise { blocked: false, campaignProspect }.
async function runAgentStep(campaignProspectId, step) {
  const { agentType, actionType } = step;
  const cp = await loadCampaignProspect(campaignProspectId);

  const reason = await preSendGate(cp.campaign);
  if (reason) return { blocked: true, reason };

  if (step.precheck) step.precheck(cp);

  const prompt = await step.buildPrompt(cp);
  let raw;
  try {
    raw = await callDronaHQPrompt(agentType, prompt);
    if (!raw.trim()) throw new HttpError(502, `DronaHQ ${agentType} agent returned an empty response`);
  } catch (err) {
    await logFailedActivity(cp, agentType, actionType, prompt, '', err.message);
    throw err;
  }

  let parsed;
  try {
    parsed = step.parse(raw, cp);
  } catch (err) {
    await logFailedActivity(cp, agentType, actionType, prompt, raw, err.message);
    throw err;
  }

  const updated = await step.apply(cp, parsed);
  await logActivity(cp, agentType, actionType, prompt, raw, 'success');
  return { blocked: false, campaignProspect: updated };
}

module.exports = { loadCampaignProspect, logActivity, logFailedActivity, mergeContext, parseFields, runAgentStep };
