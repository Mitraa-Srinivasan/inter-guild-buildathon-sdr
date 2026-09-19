export function validateAction({ campaign, agent, channel, prospect, systemStatus, dailyCount, callsToday, isGlobalKillSwitch, timeWindow }) {
  if (systemStatus === 'STOPPED') {
    return { allowed: false, reason: 'Global autonomy is stopped.' };
  }

  if (campaign?.status === 'PAUSED' || campaign?.status === 'DRAFT' || campaign?.status === 'ARCHIVED') {
    return { allowed: false, reason: `Campaign is currently ${campaign?.status || 'inactive'}.` };
  }

  if (agent?.status === 'PAUSED') {
    return { allowed: false, reason: 'Agent is paused.' };
  }

  if (channel === 'VOICE' && !campaign?.channels?.includes('VOICE')) {
    return { allowed: false, reason: 'Voice channel is not enabled.' };
  }

  if (dailyCount >= 20) {
    return { allowed: false, reason: 'Daily activity limit reached.' };
  }

  if (prospect?.optedOut) {
    return { allowed: false, reason: 'Prospect has opted out.' };
  }

  if (isGlobalKillSwitch) {
    return { allowed: false, reason: 'Kill switch is active.' };
  }

  if (timeWindow && !timeWindow.isOpen) {
    return { allowed: false, reason: 'Outside working hours.' };
  }

  return { allowed: true, reason: 'Allowed' };
}
