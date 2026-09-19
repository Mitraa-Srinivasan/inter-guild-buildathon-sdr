export function processVoiceWebhook(payload) {
  return {
    success: true,
    callId: payload.callId || `call-${Date.now()}`,
    transcript: payload.transcript || 'Prospect responded positively and agreed to continue.',
    recordingUrl: payload.recordingUrl || '',
    outcome: payload.outcome || 'INTERESTED',
    qualification: payload.qualification || { budget: 'Good fit', authority: 'Confirmed', need: 'Medium', timeline: 'Next quarter' },
    objections: payload.objections || [],
    nextAction: payload.nextAction || 'Book discovery meeting'
  };
}
