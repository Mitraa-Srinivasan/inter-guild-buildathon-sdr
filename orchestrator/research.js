const { HttpError } = require('../lib/http');
const { preSendGate } = require('./gate');
const { callDronaHQPrompt } = require('../agents/dronaHQ');
const { loadActiveGuidance, appendGuidance } = require('./guidance');
const { loadCampaignProspect, logActivity, logFailedActivity, mergeContext } = require('./common');

const present = (v) => v !== undefined && v !== null && v !== '';
const show = (v) => (typeof v === 'object' ? JSON.stringify(v) : String(v));

// Single prompt string from the prospect's raw data.
function buildResearchPrompt(prospect) {
  const lines = [
    `Name: ${prospect.name}`,
    `Title: ${present(prospect.title) ? prospect.title : 'not provided'}`,
    `Company: ${present(prospect.company) ? prospect.company : 'not provided'}`,
  ];
  const company = Object.entries(prospect.company_data_json || {}).filter(([, v]) => present(v));
  if (company.length) {
    lines.push('', 'Known company data:');
    for (const [k, v] of company) lines.push(`- ${k}: ${show(v)}`);
  }
  return lines.join('\n');
}

// Returns { blocked: true, reason } if the gate stops the run, otherwise { blocked: false, campaignProspect }.
async function runResearch(campaignProspectId) {
  const cp = await loadCampaignProspect(campaignProspectId);

  const reason = await preSendGate(cp.campaign, 'research');
  if (reason) return { blocked: true, reason };

  const guidance = await loadActiveGuidance(cp.campaign_id, 'research');
  const promptVersionId = guidance ? guidance.id : null;
  const prompt = appendGuidance(buildResearchPrompt(cp.prospect), guidance);
  let raw;
  try {
    raw = await callDronaHQPrompt('research', prompt);
    if (!raw.trim()) throw new HttpError(502, 'DronaHQ research agent returned an empty response');
  } catch (err) {
    await logFailedActivity(cp, 'research', 'enrich', prompt, '', err.message, promptVersionId);
    throw err;
  }

  const updated = await mergeContext(cp, { research: raw });
  await logActivity(cp, 'research', 'enrich', prompt, raw, 'success', null, { promptVersionId });
  return { blocked: false, campaignProspect: updated };
}

module.exports = { runResearch, buildResearchPrompt };
