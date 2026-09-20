const { HttpError } = require('../lib/http');
const { runAgentStep, parseFields, mergeContext } = require('./common');
const { loadRecentActivities, formatActivityHistory } = require('./history');
const { enabledChannels, availableChannelsLine, assertChannelAllowed } = require('./channels');

const present = (v) => v !== undefined && v !== null && v !== '';

const LABELS = ['Next Channel', 'Contact Now', 'Timing', 'Reasoning'];

// Basic prospect info, the research (if any), the prospect's recent activity history, and the campaign's enabled channels.
function buildStrategyPrompt(prospect, context, activities, channels, now = Date.now()) {
  const lines = [
    `Name: ${prospect.name}`,
    `Title: ${present(prospect.title) ? prospect.title : 'not provided'}`,
    `Company: ${present(prospect.company) ? prospect.company : 'not provided'}`,
  ];
  if (present(context.research)) lines.push('', 'Research:', String(context.research).trim());
  lines.push('', ...formatActivityHistory(activities, now), '', availableChannelsLine(channels));
  return lines.join('\n');
}

function runStrategy(campaignProspectId) {
  return runAgentStep(campaignProspectId, {
    agentType: 'strategy',
    actionType: 'decide',
    precheck(cp) {
      if (cp.funnel_state !== 'qualified') {
        throw new HttpError(400, `Prospect must be in funnel_state 'qualified' to run strategy (currently '${cp.funnel_state}')`);
      }
    },
    async buildPrompt(cp) {
      const activities = await loadRecentActivities(cp, 'strategy');
      return buildStrategyPrompt(cp.prospect, cp.context_json || {}, activities, enabledChannels(cp.campaign.channel_config));
    },
    parse(raw, cp) {
      const f = parseFields(raw, LABELS, 'Strategy agent');
      assertChannelAllowed(f['Next Channel'], enabledChannels(cp.campaign.channel_config), 'Strategy agent');
      return f;
    },
    apply: (cp, f) =>
      mergeContext(cp, {
        strategy: { next_channel: f['Next Channel'], contact_now: f['Contact Now'], timing: f['Timing'], reasoning: f['Reasoning'] },
      }),
  });
}

module.exports = { runStrategy, buildStrategyPrompt };
