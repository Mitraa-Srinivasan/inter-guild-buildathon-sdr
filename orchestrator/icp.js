const { supabase, unwrap } = require('../db/supabase');
const { HttpError, notFound } = require('../lib/http');
const { preSendGate } = require('./gate');
const { callDronaHQAgent } = require('../agents/dronaHQ');
const { logActivity, logFailedActivity } = require('./common');

const DECISION_TO_STATE = { qualified: 'qualified', rejected: 'rejected', escalate: 'qualified' };

const present = (v) => v !== undefined && v !== null && v !== '';
const first = (...vals) => vals.find(present);
const show = (v) => (present(v) ? (typeof v === 'object' ? JSON.stringify(v) : String(v)) : 'not provided');

// Plain-text summary of the prospect for the ICP agent.
function buildProspectSummary(prospect, campaignProspect) {
  const company = prospect.company_data_json || {};
  const context = campaignProspect.context_json || {};

  const size = first(company.employee_count, company.employees, company.company_size, company.size);
  const industry = first(company.industry, context.industry);
  const location = first(company.location, company.headquarters, company.hq, context.location);

  const lines = [
    `Name: ${show(prospect.name)}`,
    `Title: ${show(prospect.title)}`,
    `Company: ${show(prospect.company)}`,
    `Company size: ${typeof size === 'number' ? `${size} employees` : show(size)}`,
    `Industry: ${show(industry)}`,
    `Location: ${show(location)}`,
  ];

  // Everything else we know about the prospect or company is passed along as enrichment.
  const used = new Set(['employee_count', 'employees', 'company_size', 'size', 'industry', 'location', 'headquarters', 'hq']);
  const enrichment = [
    ...Object.entries(company).filter(([k]) => !used.has(k)),
    ...Object.entries(context).filter(([k]) => !used.has(k)),
  ].filter(([, v]) => present(v));
  if (enrichment.length) {
    lines.push('', 'Enrichment data:');
    for (const [k, v] of enrichment) lines.push(`- ${k}: ${show(v)}`);
  }
  return lines.join('\n');
}

const list = (v) => (Array.isArray(v) ? v.join(', ') : String(v));

function formatRange(r) {
  if (r === null || typeof r !== 'object') return String(r);
  if (present(r.min) && present(r.max)) return `${r.min}-${r.max} employees`;
  if (present(r.min)) return `${r.min}+ employees`;
  if (present(r.max)) return `up to ${r.max} employees`;
  return JSON.stringify(r);
}

// Human-readable ICP criteria from campaigns.icp_json; passed to the agent as the icp_criteria variable.
function formatIcpCriteria(icp) {
  icp = icp || {};
  const company = icp.company_criteria || {};
  const excl = icp.exclusions;
  const lines = [];

  if (present(icp.roles) && icp.roles.length) lines.push(`Target roles: ${list(icp.roles)}`);
  if (present(company.employee_count)) lines.push(`Company size: ${formatRange(company.employee_count)}`);
  if (present(company.industries) && company.industries.length) lines.push(`Industries: ${list(company.industries)}`);
  if (present(company.funding_stage) && company.funding_stage.length) lines.push(`Funding stage: ${list(company.funding_stage)}`);
  if (present(icp.geo) && icp.geo.length) lines.push(`Geography: ${list(icp.geo)}`);

  // Any company criteria we don't have a label for still reach the agent.
  const known = new Set(['employee_count', 'industries', 'funding_stage']);
  for (const [k, v] of Object.entries(company)) {
    if (!known.has(k) && present(v)) lines.push(`${k.replace(/_/g, ' ')}: ${show(v)}`);
  }

  if (excl && typeof excl === 'object') {
    const parts = [];
    if (excl.industries && excl.industries.length) parts.push(`industries: ${list(excl.industries)}`);
    if (excl.competitors) parts.push('competitors');
    for (const [k, v] of Object.entries(excl)) {
      if (!['industries', 'competitors'].includes(k) && present(v) && v !== false) parts.push(`${k.replace(/_/g, ' ')}: ${show(v)}`);
    }
    if (parts.length) lines.push(`Exclusions: ${parts.join('; ')}`);
  } else if (present(excl)) {
    lines.push(`Exclusions: ${show(excl)}`);
  }

  return lines.length ? lines.join('\n') : 'No ICP criteria defined for this campaign.';
}

// Extracts score + funnel_state from the agent's text. Throws HttpError(500) if either is missing.
function parseIcpResponse(raw) {
  // The real agent formats its answer as markdown ("**Total Score**: 75 points"), so allow
  // optional asterisks around the label and the colon.
  const scoreMatch = /Total Score\**:?\**\s*(\d+)/i.exec(raw);
  const decisionMatch = /Decision\**:?\**\s*(Qualified|Rejected|Escalate)/i.exec(raw);
  if (!scoreMatch) throw new HttpError(500, 'ICP agent response could not be parsed: no "Total Score" found');
  if (!decisionMatch) {
    throw new HttpError(500, 'ICP agent response could not be parsed: no "Decision" of Qualified/Rejected/Escalate found');
  }
  const decision = decisionMatch[1].toLowerCase();
  return { score: parseInt(scoreMatch[1], 10), decision, funnelState: DECISION_TO_STATE[decision] };
}

// Returns { blocked: true, reason } if the gate stops the run, otherwise { blocked: false, campaignProspect }.
async function runIcp(campaignProspectId) {
  const cp = unwrap(
    await supabase
      .from('campaign_prospects')
      .select('*, prospect:prospects(*), campaign:campaigns(*)')
      .eq('id', campaignProspectId)
      .maybeSingle()
  );
  if (!cp) throw notFound('Campaign prospect');

  const reason = await preSendGate(cp.campaign);
  if (reason) return { blocked: true, reason };

  const prospectSummary = buildProspectSummary(cp.prospect, cp);
  const icpCriteria = formatIcpCriteria(cp.campaign.icp_json);
  // Logged as input_summary so the record shows everything the agent was given.
  const prompt = `${prospectSummary}\n\n[icp_criteria]\n${icpCriteria}`;
  let raw;
  try {
    raw = await callDronaHQAgent('icp', prospectSummary, { icp_criteria: icpCriteria });
  } catch (err) {
    await logFailedActivity(cp, 'icp', 'score', prompt, '', err.message);
    throw err;
  }

  let parsed;
  try {
    parsed = parseIcpResponse(raw);
  } catch (err) {
    await logFailedActivity(cp, 'icp', 'score', prompt, raw, err.message);
    throw err;
  }

  const reasoning =
    parsed.decision === 'escalate'
      ? `${raw}\n\n[Note: agent decision was "Escalate"; recorded as 'qualified' because no escalate state exists yet. Needs human review.]`
      : raw;

  const updated = unwrap(
    await supabase
      .from('campaign_prospects')
      .update({ icp_score: parsed.score, icp_reasoning: reasoning, funnel_state: parsed.funnelState })
      .eq('id', cp.id)
      .select()
      .single()
  );

  const activityId = await logActivity(cp, 'icp', 'score', prompt, raw, 'success');

  // An "Escalate" decision goes to a human: queue a pending approval pointing at this activity.
  if (parsed.decision === 'escalate') await queueEscalationApproval(cp, activityId, parsed.score, reasoning);

  return { blocked: false, campaignProspect: updated };
}

// One pending ICP-escalation approval per campaign prospect: re-scoring to "Escalate" again doesn't add a duplicate.
async function queueEscalationApproval(cp, activityId, score, reasoning) {
  const pending = unwrap(
    await supabase
      .from('approvals')
      .select('id')
      .eq('campaign_id', cp.campaign_id)
      .eq('prospect_id', cp.prospect_id)
      .eq('status', 'pending')
      .contains('proposed_action_json', { type: 'icp_escalation' })
      .limit(1)
  );
  if (pending.length) return;
  unwrap(
    await supabase.from('approvals').insert({
      campaign_id: cp.campaign_id,
      prospect_id: cp.prospect_id,
      activity_id: activityId,
      proposed_action_json: { type: 'icp_escalation', score, reasoning },
      status: 'pending',
    })
  );
}

module.exports = { runIcp, buildProspectSummary, formatIcpCriteria, parseIcpResponse };
