import { callDronaHQ } from './dronahqClient.js';

export async function runAgent({ agentName, context }) {
  return callDronaHQ(`/agents/${agentName}/run`, { context }, 'POST');
}
