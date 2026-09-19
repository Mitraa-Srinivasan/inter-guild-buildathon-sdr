import { validateAction } from '../services/policyEngine.js';
import { mockService } from '../integrations/mock/mockService.js';

export async function orchestrateSdr({ campaign, prospect, agentName, channel, trigger }) {
  const decision = validateAction({
    campaign,
    agent: { status: 'ACTIVE' },
    channel,
    prospect,
    systemStatus: 'ACTIVE',
    dailyCount: 5,
    callsToday: 3,
    isGlobalKillSwitch: false,
    timeWindow: { isOpen: true }
  });

  if (!decision.allowed) {
    return { success: false, decision, message: decision.reason };
  }

  const result = await mockService.runAgent(agentName || 'Research Agent', {
    score: 87,
    campaign,
    prospect,
    trigger
  });

  return { success: true, decision: 'ALLOWED', result };
}
