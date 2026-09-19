export const mockService = {
  async runAgent(agentName, payload = {}) {
    return {
      success: true,
      agent: agentName,
      score: payload.score ?? 86,
      decision: 'QUALIFIED',
      reasons: ['Strong ICP fit', 'Clear buying intent'],
      risks: [],
      missingInformation: [],
      companySummary: 'Strong B2B SaaS spend profile and clear product relevance.',
      personSummary: 'Senior technical buyer with platform decision-making context.',
      painPoints: ['Scaling outbound motion', 'Need clear buyer signals'],
      signals: ['High product fit', 'Recent AI investment'],
      technology: ['React', 'Node.js', 'PostgreSQL'],
      evidence: ['Website and role fit', 'Funding signals'],
      recommendedChannel: 'EMAIL',
      recommendedTiming: 'Within 2 hours',
      objective: 'Book a discovery meeting',
      reason: 'Strong ICP alignment and product relevance',
      requiresApproval: false,
      subject: 'Re: product fit for your team',
      body: 'Hi {{firstName}}, I noticed your team is expanding AI tooling and wanted to explore whether...',
      personalizationEvidence: ['ICP match', 'Role context'],
      confidence: 0.91,
      intent: 'INTERESTED',
      sentiment: 'POSITIVE',
      qualification: { budget: 'Medium', authority: 'Yes', need: 'High', timeline: 'Quarterly' },
      recommendedAction: 'Book intro call',
      requiresHuman: false,
      outcome: 'INTERESTED',
      objections: [],
      nextAction: 'Schedule follow-up meeting',
      shouldFollowUp: true,
      channel: 'EMAIL',
      delayHours: 24,
      stopReason: null,
      context: {
        mock: true,
        generator: 'autonomous-sdr-mock'
      }
    };
  },

  async simulateVoiceCall() {
    return {
      outcome: 'INTERESTED',
      intent: 'MEETING',
      qualification: { budget: 'Medium', authority: 'Yes', need: 'High', timeline: 'Next 30 days' },
      objections: [],
      nextAction: 'Book discovery meeting',
      requiresHuman: false,
      transcript: 'Prospect: We are evaluating options. Manager: Great, let us schedule a 20-minute intro.',
      recordingUrl: 'https://example.com/recording.mp3',
      durationSeconds: 233,
      structuredData: { decision: 'INTERESTED', source: 'mock_voice' }
    };
  }
};
