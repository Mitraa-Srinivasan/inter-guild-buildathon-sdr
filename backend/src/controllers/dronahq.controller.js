import { createVoiceCallRequest } from '../integrations/dronahq/voiceAgentService.js';
import { processVoiceWebhook } from '../integrations/dronahq/dronahqWebhookService.js';
import { mockService } from '../integrations/mock/mockService.js';

export async function preWebhookHandler(req, res) {
  const { prospectId, campaignId } = req.body || {};

  const payload = {
    prospect: {
      id: prospectId || 'p-1',
      name: 'John Smith',
      title: 'CTO',
      company: 'Northstar Cloud',
      phone: '+1-415-555-0130'
    },
    campaign: {
      id: campaignId || 'cmp-1',
      name: 'US SaaS CTO Outreach',
      objective: 'Book a meeting'
    },
    research: { summary: 'Strong fit for AI workflow automation' },
    previousInteractions: [{ type: 'EMAIL', summary: 'Initial outreach sent' }],
    qualificationCriteria: { budget: 'Medium', authority: 'Yes', need: 'High', timeline: 'Quarterly' },
    voiceInstructions: { objective: 'Qualify buyer interest and book a discovery call' }
  };

  res.json({ success: true, data: payload });
}

export async function postWebhookHandler(req, res) {
  const result = processVoiceWebhook(req.body || {});
  const mock = await mockService.simulateVoiceCall();

  res.json({
    success: true,
    data: {
      ...result,
      transcript: mock.transcript,
      recordingUrl: mock.recordingUrl,
      outcome: mock.outcome,
      qualification: mock.qualification,
      objections: mock.objections,
      nextAction: mock.nextAction,
      structuredData: mock.structuredData
    }
  });
}

export async function callProspectHandler(req, res) {
  const { prospectId, campaignId } = req.body || {};
  const prospect = {
    id: prospectId || 'p-1',
    name: 'John Smith',
    company: 'Northstar Cloud',
    phone: '+1-415-555-0130'
  };
  const campaign = {
    id: campaignId || 'cmp-1',
    name: 'US SaaS CTO Outreach',
    status: 'LIVE',
    channels: ['VOICE']
  };

  const call = await createVoiceCallRequest({ prospect, campaign, objective: 'Book intro meeting' });

  res.json({
    success: true,
    data: {
      status: 'CALL_INITIATED',
      callId: call.externalCallId,
      provider: 'DronaHQ Voice Agent',
      message: 'Call initiated — waiting for provider result.'
    }
  });
}
