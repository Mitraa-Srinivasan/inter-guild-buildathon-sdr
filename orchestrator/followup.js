const { runAgentStep, parseFields, mergeContext } = require('./common');
const { loadRecentActivities, formatActivityHistory, timeAgo } = require('./history');
const { enabledChannels, availableChannelsLine, assertChannelAllowed } = require('./channels');

const present = (v) => v !== undefined && v !== null && v !== '';

const LABELS = ['Next Follow-up', 'Channel', 'Reasoning'];

function buildFollowupPrompt(prospect, activities, channels, now = Date.now()) {
  return [
    `Prospect: ${prospect.name}${present(prospect.title) ? `, ${prospect.title}` : ''}${present(prospect.company) ? ` at ${prospect.company}` : ''}`,
    '',
    ...formatActivityHistory(activities, now),
    '',
    availableChannelsLine(channels),
  ].join('\n');
}

function runFollowup(campaignProspectId) {
  return runAgentStep(campaignProspectId, {
    agentType: 'follow',
    actionType: 'decide',
    async buildPrompt(cp) {
      const activities = await loadRecentActivities(cp, 'follow');
      return buildFollowupPrompt(cp.prospect, activities, enabledChannels(cp.campaign.channel_config));
    },
    parse(raw, cp) {
      const f = parseFields(raw, LABELS, 'Follow-up agent');
      assertChannelAllowed(f['Channel'], enabledChannels(cp.campaign.channel_config), 'Follow-up agent');
      return f;
    },
    apply: (cp, f) =>
      mergeContext(cp, {
        next_followup: { next_followup: f['Next Follow-up'], channel: f['Channel'], reasoning: f['Reasoning'] },
      }),
  });
}

module.exports = { runFollowup, buildFollowupPrompt, timeAgo };
