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
    // A call is a phone action; don't run it for a campaign that hasn't enabled phone.
    precheck(cp) {
      if (!enabledChannels(cp.campaign.channel_config).includes('phone')) {
        throw new HttpError(400, 'The phone channel is not enabled for this campaign; cannot run a voice call');
      }
    },
    buildPrompt: (cp) => buildVoicePrompt(cp.prospect, cp.context_json || {}, enabledChannels(cp.campaign.channel_config)),
    // The transcript is kept verbatim (no markdown clean-up).
    parse: (raw) => parseFields(raw, LABELS, 'Voice agent', { keepFormatting: ['Transcript'] }),
    apply: (cp, f) =>
      mergeContext(cp, {
        voice_call: { transcript: f['Transcript'], outcome: f['Outcome'], reasoning: f['Reasoning'] },
      }),
  });
}

module.exports = { runVoice, buildVoicePrompt };
