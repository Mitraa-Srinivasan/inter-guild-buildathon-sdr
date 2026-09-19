import { callDronaHQ } from './dronahqClient.js';

export async function createVoiceCallRequest({ prospect, campaign, objective }) {
  const payload = {
    prospect,
    campaign,
    objective,
    preWebhook: '/api/integrations/dronahq/voice/pre-webhook',
    postWebhook: '/api/integrations/dronahq/voice/post-webhook'
  };

  const response = await callDronaHQ('/voice/calls', payload, 'POST');
  return {
    ok: true,
    externalCallId: `dronahq-call-${Date.now()}`,
    providerResponse: response
  };
}
