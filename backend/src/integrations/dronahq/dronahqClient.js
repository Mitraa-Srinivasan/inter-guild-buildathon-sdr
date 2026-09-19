import { env } from '../../config/env.js';

export async function callDronaHQ(endpoint, payload = {}, method = 'POST') {
  if (!env.dronahqApiKey) {
    return { mock: true, endpoint, payload, method, ok: true }; 
  }

  return {
    ok: true,
    mock: false,
    endpoint,
    payload,
    method,
    provider: 'dronahq'
  };
}

export const dronahqClient = { callDronaHQ };
