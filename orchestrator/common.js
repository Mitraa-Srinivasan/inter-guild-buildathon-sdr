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

// ---- Usage and cost: ESTIMATES, not measured -------------------------------------------------------------
// DronaHQ's webhook responses don't report token usage, so activities.tokens / activities.cost are estimated:
//   tokens = (input chars + output chars) / 4          (rough chars-per-token rule of thumb)
//   cost   = tokens at the per-agent credit rates below, converted at 500 credits = $1
// They only see the text we send and store (input_summary / output_summary), so they leave out each agent's
// own instructions and knowledge-base context on the DronaHQ side. Treat them as ballpark figures.
// Rates are credits per 1k tokens. Agent types with no LLM (e.g. 'dispatch') record 0 tokens and $0.
const CHARS_PER_TOKEN = 4;
const CREDITS_PER_USD = 500;
const RATES = {
  icp: { model: 'gpt-4o-mini', in: 0.15, out: 0.6 },
  research: { model: 'gemini-2.5-flash-lite', in: 0.1, out: 0.4 },
  strategy: { model: 'gemini-2.5-flash', in: 0.3, out: 2.5 },
  personalisation: { model: 'claude-sonnet-4-6', in: 3, out: 15 },
  conversation: { model: 'gemini-2.5-flash', in: 0.3, out: 2.5 },
  voice: { model: 'gpt-4o-mini', in: 0.15, out: 0.6 },
  follow: { model: 'gpt-4o-mini', in: 0.15, out: 0.6 },
};

// Returns { model, tokens, cost } (cost in USD, 6 decimals). responded=false means the agent never answered
// (call failed or timed out): no usage is assumed, so tokens and cost are 0.
function estimateUsage(agentType, input, output, responded = true) {
  const rate = RATES[agentType];
  if (!rate) return { model: null, tokens: 0, cost: 0 };
  if (!responded) return { model: rate.model, tokens: 0, cost: 0 };
  const inTokens = String(input || '').length / CHARS_PER_TOKEN;
  const outTokens = String(output || '').length / CHARS_PER_TOKEN;
  const credits = (inTokens / 1000) * rate.in + (outTokens / 1000) * rate.out;
  return { model: rate.model, tokens: Math.ceil(inTokens + outTokens), cost: Number((credits / CREDITS_PER_USD).toFixed(6)) };
}

// The one place activities are written by the orchestrator: inserts the row with model / tokens / cost
// estimates filled in, and returns its id. options.responded=false marks a run where the agent never answered.
async function logActivity(cp, agentType, actionType, inputSummary, outputSummary, status, channel = null, { responded = true } = {}) {
  const usage = estimateUsage(agentType, inputSummary, outputSummary, responded);
  const row = unwrap(
    await supabase
      .from('activities')
      .insert({
        campaign_id: cp.campaign_id,
        prospect_id: cp.prospect_id,
        agent_type: agentType,
        action_type: actionType,
        channel,
        prompt_version_id: null,
        model: usage.model,
        input_summary: inputSummary,
        output_summary: outputSummary,
        tokens: usage.tokens,
        cost: usage.cost,
        status,
      })
      .select('id')
      .single()
  );
  return row.id;
}

// Best effort: a failed run should leave a trace, but logging must never mask the original error.
// An empty `raw` means the agent never answered, so no usage is estimated.
async function logFailedActivity(cp, agentType, actionType, prompt, raw, reason) {
  try {
    await logActivity(cp, agentType, actionType, prompt, raw ? `${reason}\n\n${raw}` : reason, 'failed', null, { responded: Boolean(raw) });
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

// Creates a 'scheduled' meeting (time to be set) for this campaign prospect, unless one is already pending.
// Returns the meeting id and pushes a note about what happened onto `notes` (stored with the step's activity).
async function ensureMeeting(cp, notes) {
  const pending = unwrap(
    await supabase
      .from('meetings')
      .select('id')
      .eq('campaign_id', cp.campaign_id)
      .eq('prospect_id', cp.prospect_id)
      .eq('status', 'scheduled')
      .limit(1)
  );
  if (pending.length) {
    notes.push(`Meeting already pending (${pending[0].id}); no new meeting created.`);
    return pending[0].id;
  }
  const meeting = unwrap(
    await supabase
      .from('meetings')
      .insert({ campaign_id: cp.campaign_id, prospect_id: cp.prospect_id, scheduled_at: null, status: 'scheduled' })
      .select('id')
      .single()
  );
  notes.push(`Meeting created: ${meeting.id} (status scheduled, time to be set).`);
  return meeting.id;
}

// Shared pipeline for single-{prompt} agent steps:
//   load -> pre-send gate -> precheck -> conflict check -> build prompt -> call agent -> parse -> apply writes
//   -> log activity -> afterSuccess.
// Agent-call and parse failures are logged as 'failed' activities and rethrown; nothing is written to the prospect.
// step: { agentType, actionType, channel?(cp), precheck?(cp), conflictCheck?(cp) -> { allowed, reason, details },
//         buildPrompt(cp), parse(raw, cp), apply(cp, parsed, notes) -> updated row, afterSuccess?(cp, parsed) }
// parse() may also validate against the campaign (cp.campaign); throwing there is logged like any parse failure.
// conflictCheck() runs before the agent is called; a deny is logged as a 'failed' activity and the agent is never called.
// Returns { blocked: true, reason }      if the gate stops the run (kill switch / campaign not live),
//         { denied: true, reason, details } if the conflict check says no,
//         otherwise { blocked: false, campaignProspect }.
async function runAgentStep(campaignProspectId, step) {
  const { agentType, actionType } = step;
  const cp = await loadCampaignProspect(campaignProspectId);
  const channel = step.channel ? step.channel(cp) : null;

  const reason = await preSendGate(cp.campaign);
  if (reason) return { blocked: true, reason };

  if (step.precheck) step.precheck(cp);

  if (step.conflictCheck) {
    const verdict = await step.conflictCheck(cp);
    if (!verdict.allowed) {
      // Every deny is recorded; if the log write fails the call errors rather than skipping silently.
      await logActivity(cp, agentType, actionType, `${actionType} requested`, `Blocked: ${verdict.reason}${verdict.details ? ` (${verdict.details})` : ''}`, 'failed', channel, { responded: false });
      return { denied: true, reason: verdict.reason, details: verdict.details };
    }
  }

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

  // apply() may push short notes about side effects it performed (e.g. "Meeting created"); they are stored
  // with this step's activity instead of creating a separate activity.
  const notes = [];
  const updated = await step.apply(cp, parsed, notes);
  await logActivity(cp, agentType, actionType, prompt, notes.length ? `${raw}\n\n${notes.join('\n')}` : raw, 'success', channel);
  if (step.afterSuccess) await step.afterSuccess(cp, parsed);
  return { blocked: false, campaignProspect: updated };
}

module.exports = {
  loadCampaignProspect,
  logActivity,
  logFailedActivity,
  mergeContext,
  ensureMeeting,
  parseFields,
  runAgentStep,
  estimateUsage,
  RATES,
};
