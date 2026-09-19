const { HttpError } = require('../lib/http');
const { runAgentStep, parseFields, mergeContext } = require('./common');
const { enabledChannels, availableChannelsLine } = require('./channels');

const present = (v) => v !== undefined && v !== null && v !== '';

const LABELS = ['Transcript', 'Outcome', 'Reasoning'];

// Prospect info, the research (if any), and the campaign's enabled channels.
function buildVoicePrompt(prospect, context, channels) {
  const lines = [
    `Name: ${prospect.name}`,
    `Title: ${present(prospect.title) ? prospect.title : 'not provided'}`,
    `Company: ${present(prospect.company) ? prospect.company : 'not provided'}`,
  ];
  if (present(context.research)) lines.push('', 'Research:', String(context.research).trim());
  lines.push('', availableChannelsLine(channels));
  return lines.join('\n');
}

function runVoice(campaignProspectId) {
  return runAgentStep(campaignProspectId, {
    agentType: 'voice',
    actionType: 'call',
    // A call needs the campaign to have switched on either the 'voice' or the 'phone' channel.
    precheck(cp) {
      const enabled = enabledChannels(cp.campaign.channel_config);
      if (!enabled.includes('voice') && !enabled.includes('phone')) {
        throw new HttpError(400, "Neither the 'voice' nor the 'phone' channel is enabled for this campaign; cannot run a voice call");
      }
    },
    buildPrompt: (cp) => buildVoicePrompt(cp.prospect, cp.context_json || {}, enabledChannels(cp.campaign.channel_config)),
    // The transcript is kept verbatim (no markdown clean-up).
    parse: (raw) => parseFields(raw, LABELS, 'Voice agent', { keepFormatting: ['Transcript'] }),
    apply: (cp, f) =>
      mergeContext(cp, {
        // simulated: the agent writes the whole conversation; no real call takes place.
        voice_call: { transcript: f['Transcript'], outcome: f['Outcome'], reasoning: f['Reasoning'], simulated: true },
      }),
  });
}

module.exports = { runVoice, buildVoicePrompt };
