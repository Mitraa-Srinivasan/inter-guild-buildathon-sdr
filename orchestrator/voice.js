const { HttpError } = require('../lib/http');
const { runAgentStep, parseFields, mergeContext, ensureMeeting, logActivity } = require('./common');
const { enabledChannels, availableChannelsLine } = require('./channels');
const { loadSenderIdentity } = require('./sender');
const { checkConflicts } = require('./conflict');

const present = (v) => v !== undefined && v !== null && v !== '';

const LABELS = ['Transcript', 'Outcome', 'Reasoning'];

// The channel a call goes out on: 'voice' if the campaign has it enabled, otherwise 'phone'.
// It is the channel used for the conflict check's daily limit and recorded on the call's dispatch activity.
const callChannel = (cp) => (enabledChannels(cp.campaign.channel_config).includes('voice') ? 'voice' : 'phone');

// "Meeting booked" / "meeting-booked" / "meeting_booked" -> "meeting_booked"
const normalizeOutcome = (v) => String(v).toLowerCase().trim().replace(/[\s-]+/g, '_');

// Prospect info, who is calling, the research (if any), and the campaign's enabled channels.
function buildVoicePrompt(prospect, context, channels, senderIdentity = null) {
  const lines = [
    `Name: ${prospect.name}`,
    `Title: ${present(prospect.title) ? prospect.title : 'not provided'}`,
    `Company: ${present(prospect.company) ? prospect.company : 'not provided'}`,
  ];
  if (present(senderIdentity)) lines.push('', `Sender (introduce yourself on the call as this person): ${senderIdentity}`);
  if (present(context.research)) lines.push('', 'Research:', String(context.research).trim());
  lines.push('', availableChannelsLine(channels));
  return lines.join('\n');
}

// Returns { blocked: true, reason } (gate: kill switch / campaign not live),
//         { denied: true, reason, details } (conflict gate: suppressed, frequency cap, ... ; the agent is not called),
//         or { blocked: false, campaignProspect }.
function runVoice(campaignProspectId) {
  return runAgentStep(campaignProspectId, {
    agentType: 'voice',
    actionType: 'call',
    channel: callChannel,
    // A call needs the campaign to have switched on either the 'voice' or the 'phone' channel.
    precheck(cp) {
      const enabled = enabledChannels(cp.campaign.channel_config);
      if (!enabled.includes('voice') && !enabled.includes('phone')) {
        throw new HttpError(400, "Neither the 'voice' nor the 'phone' channel is enabled for this campaign; cannot run a voice call");
      }
    },
    // Same conflict gate as dispatch: suppression, rejected, pending approval, cross-campaign, frequency cap, daily limit.
    conflictCheck: (cp) => checkConflicts(cp.id, { channel: callChannel(cp) }),
    async buildPrompt(cp) {
      const sender = await loadSenderIdentity(cp);
      return buildVoicePrompt(cp.prospect, cp.context_json || {}, enabledChannels(cp.campaign.channel_config), sender);
    },
    // The transcript is kept verbatim (no markdown clean-up).
    parse: (raw) => parseFields(raw, LABELS, 'Voice agent', { keepFormatting: ['Transcript'] }),
    async apply(cp, f, notes) {
      // simulated: the agent writes the whole conversation; no real call takes place.
      const voiceCall = { transcript: f['Transcript'], outcome: f['Outcome'], reasoning: f['Reasoning'], simulated: true };
      const columns = {};
      // Only a booked meeting changes the funnel (same as a positive reply in run-conversation). Every other outcome
      // (callback_requested, not_interested, escalated_to_human, voicemail, ...) is just recorded.
      if (normalizeOutcome(f['Outcome']).startsWith('meeting_booked')) {
        columns.funnel_state = 'engaged';
        await ensureMeeting(cp, notes);
      }
      return mergeContext(cp, { voice_call: voiceCall }, columns);
    },
    // A call is an outreach action: record it as a 'dispatch' on the call channel (in addition to the voice/call
    // activity) so it counts toward the frequency cap, the daily limit and the cross-campaign check like any dispatch.
    // It does not advance funnel_state; only the outcome rules above do.
    async afterSuccess(cp, f) {
      const channel = callChannel(cp);
      await logActivity(
        cp,
        'dispatch',
        'dispatch',
        `Voice call placed on channel "${channel}"`,
        `SIMULATED voice call on ${channel} (outcome: ${f['Outcome']}): no real call was placed`,
        'success',
        channel
      );
    },
  });
}

module.exports = { runVoice, buildVoicePrompt };
