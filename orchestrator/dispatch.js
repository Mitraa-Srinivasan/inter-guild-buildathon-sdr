const { supabase, unwrap } = require('../db/supabase');
const { preSendGate } = require('./gate');
const { loadCampaignProspect, logActivity } = require('./common');
const { checkConflicts } = require('./conflict');
const { enabledChannels } = require('./channels');

// Stages a dispatch moves forward to 'contacted'. Anything else (contacted, engaged, meeting, opportunity,
// and rejected) stays where it is: a dispatch never moves a prospect backwards or un-rejects them.
const ADVANCE_TO_CONTACTED_FROM = ['discovered', 'researched', 'qualified'];

// Outreach dispatch (SIMULATED: nothing is actually sent).
// Returns one of:
//   { blocked: true, reason }                       kill switch / campaign not live (gate.js) -> 423
//   { denied: true, reason, details }               conflict gate said no; a 'failed' activity was logged -> 409
//   { campaignProspect }                            allowed; a 'success' activity was logged, funnel advanced
async function runDispatch(campaignProspectId, channelInput) {
  const channel = channelInput.trim().toLowerCase();
  const cp = await loadCampaignProspect(campaignProspectId);

  const reason = await preSendGate(cp.campaign);
  if (reason) return { blocked: true, reason };

  const enabled = enabledChannels(cp.campaign.channel_config);
  const verdict = enabled.includes(channel)
    ? await checkConflicts(campaignProspectId, { channel })
    : {
        allowed: false,
        reason: 'channel_not_enabled',
        details: `"${channel}" is not enabled for this campaign (enabled: ${enabled.length ? enabled.join(', ') : 'none'})`,
      };

  const input = `Dispatch requested on channel "${channel}"`;

  // Every deny is recorded. If the log write fails the whole call errors rather than skipping silently.
  if (!verdict.allowed) {
    await logActivity(cp, 'dispatch', 'dispatch', input, `Blocked: ${verdict.reason}${verdict.details ? ` (${verdict.details})` : ''}`, 'failed', channel);
    return { denied: true, reason: verdict.reason, details: verdict.details };
  }

  // Ledger first: the caps are computed from these rows, so they must exist before the state moves.
  await logActivity(cp, 'dispatch', 'dispatch', input, `SIMULATED dispatch on ${channel}: no real message was sent`, 'success', channel);

  const funnelState = ADVANCE_TO_CONTACTED_FROM.includes(cp.funnel_state) ? 'contacted' : cp.funnel_state;
  const updated = unwrap(await supabase.from('campaign_prospects').update({ funnel_state: funnelState }).eq('id', cp.id).select().single());
  return { campaignProspect: updated };
}

module.exports = { runDispatch };
