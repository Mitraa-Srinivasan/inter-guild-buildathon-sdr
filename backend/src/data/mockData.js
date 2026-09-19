export const mockData = {
  campaigns: [
    {
      id: 'cmp-1',
      name: 'US SaaS CTO Outreach',
      status: 'LIVE',
      icp: 'B2B SaaS companies in the United States',
      owner: 'Ava Manager',
      prospects: 420,
      qualified: 118,
      contacted: 74,
      meetings: 17,
      conversion: 28,
      channels: ['EMAIL', 'VOICE'],
      agentStatus: 'ACTIVE',
      lastActivity: '2m ago'
    },
    {
      id: 'cmp-2',
      name: 'India BFSI CIO Outreach',
      status: 'LIVE',
      icp: 'Indian banking, financial services and insurance companies',
      owner: 'Rahul Bhatia',
      prospects: 360,
      qualified: 91,
      contacted: 55,
      meetings: 15,
      conversion: 23,
      channels: ['EMAIL', 'SMS'],
      agentStatus: 'ACTIVE',
      lastActivity: '8m ago'
    },
    {
      id: 'cmp-3',
      name: 'Voice AI Founders',
      status: 'PAUSED',
      icp: 'AI/Voice AI startups',
      owner: 'Maya Nord',
      prospects: 180,
      qualified: 44,
      contacted: 22,
      meetings: 7,
      conversion: 19,
      channels: ['VOICE'],
      agentStatus: 'PAUSED',
      lastActivity: '1h ago'
    }
  ],
  prospects: [
    {
      id: 'p-1',
      name: 'John Smith',
      company: 'Northstar Cloud',
      title: 'CTO',
      location: 'San Francisco, CA',
      score: 91,
      status: 'QUALIFIED',
      campaign: 'US SaaS CTO Outreach',
      campaignId: 'cmp-1',
      lastTouch: '2h ago',
      nextAction: 'Book intro call',
      owner: 'Ava',
      channels: ['EMAIL', 'VOICE'],
      hasPhone: true,
      hasEmail: true,
      phone: '+1-415-555-0130'
    },
    {
      id: 'p-2',
      name: 'Ananya Nair',
      company: 'Sutra Finance',
      title: 'CIO',
      location: 'Mumbai, India',
      score: 88,
      status: 'ENGAGED',
      campaign: 'India BFSI CIO Outreach',
      campaignId: 'cmp-2',
      lastTouch: '30m ago',
      nextAction: 'Send pricing context',
      owner: 'Rahul',
      channels: ['EMAIL', 'SMS'],
      hasPhone: true,
      hasEmail: true,
      phone: '+91-98765-43210'
    },
    {
      id: 'p-3',
      name: 'Mara Diaz',
      company: 'Signal Harbor',
      title: 'Founder',
      location: 'Austin, TX',
      score: 83,
      status: 'CONTACTED',
      campaign: 'Voice AI Founders',
      campaignId: 'cmp-3',
      lastTouch: '5h ago',
      nextAction: 'Voice follow-up',
      owner: 'Maya',
      channels: ['VOICE'],
      hasPhone: true,
      hasEmail: true,
      phone: '+1-512-555-0199'
    },
    {
      id: 'p-4',
      name: 'Priya Kannan',
      company: 'BluePeak Capital',
      title: 'Head of Digital Transformation',
      location: 'Bengaluru, India',
      score: 90,
      status: 'MEETING',
      campaign: 'India BFSI CIO Outreach',
      campaignId: 'cmp-2',
      lastTouch: '15m ago',
      nextAction: 'Hold discovery call',
      owner: 'Rahul',
      channels: ['EMAIL', 'VOICE'],
      hasPhone: true,
      hasEmail: true,
      phone: '+91-90000-12345'
    }
  ],
  calls: [
    {
      id: 'call-1',
      prospect: 'John Smith',
      company: 'Northstar Cloud',
      campaign: 'US SaaS CTO Outreach',
      agent: 'Voice SDR',
      started: '2026-09-19T14:32:00Z',
      duration: '03:12',
      outcome: 'INTERESTED',
      qualification: 'Strong fit',
      recording: 'Available',
      transcript: 'Scheduled 20-min intro'
    },
    {
      id: 'call-2',
      prospect: 'Ananya Nair',
      company: 'Sutra Finance',
      campaign: 'India BFSI CIO Outreach',
      agent: 'Voice SDR',
      started: '2026-09-19T12:45:00Z',
      duration: '02:08',
      outcome: 'FOLLOW_UP',
      qualification: 'Good fit',
      recording: 'Pending',
      transcript: 'Needs CIO approval'
    }
  ],
  approvals: [
    {
      id: 'app-1',
      prospect: 'Mara Diaz',
      campaign: 'Voice AI Founders',
      action: 'Voice call',
      reason: 'High-fit founder with strong product match',
      recommendation: 'Proceed with call',
      risk: 'Medium',
      content: 'Discuss AI voice workflow value'
    }
  ],
  escalations: [
    {
      id: 'esc-1',
      category: 'High intent',
      prospect: 'John Smith',
      campaign: 'US SaaS CTO Outreach',
      priority: 'High',
      status: 'OPEN'
    }
  ],
  agents: [
    {
      id: 'agent-1',
      name: 'ICP Fitment Agent',
      status: 'ACTIVE',
      tasksCompleted: 214,
      tasksFailed: 3,
      successRate: 98.6,
      latency: '820ms',
      lastRun: '1m ago',
      campaigns: ['US SaaS CTO Outreach']
    },
    {
      id: 'agent-2',
      name: 'Research Agent',
      status: 'ACTIVE',
      tasksCompleted: 204,
      tasksFailed: 4,
      successRate: 98.0,
      latency: '1.2s',
      lastRun: '2m ago',
      campaigns: ['US SaaS CTO Outreach', 'India BFSI CIO Outreach']
    },
    {
      id: 'agent-3',
      name: 'Voice SDR Agent',
      status: 'PAUSED',
      tasksCompleted: 83,
      tasksFailed: 2,
      successRate: 97.6,
      latency: '1.7s',
      lastRun: '34m ago',
      campaigns: ['Voice AI Founders']
    }
  ],
  conversations: [
    {
      id: 'conv-1',
      prospect: 'John Smith',
      preview: 'We are interested in a short call next week.',
      status: 'Positive'
    },
    {
      id: 'conv-2',
      prospect: 'Ananya Nair',
      preview: 'Please share pricing and a sample workflow.',
      status: 'Needs response'
    }
  ],
  knowledge: [
    { id: 'k-1', title: 'Voice AI positioning', category: 'Product', source: 'internal-docs' },
    { id: 'k-2', title: 'BFSI objection handling', category: 'Objection Handling', source: 'sales playbook' }
  ],
  dashboard: {
    activeCampaigns: 3,
    totalProspects: 2315,
    qualifiedLeads: 428,
    meetingsBooked: 38,
    positiveResponses: 214,
    callsCompleted: 386,
    emailsSent: 842,
    conversionRate: 18.4
  },
  analytics: {
    prospectsDiscovered: 2260,
    prospectsResearched: 1840,
    qualifiedProspects: 428,
    contacted: 270,
    engaged: 164,
    meetings: 38,
    opportunities: 9,
    channelMetrics: {
      email: { sent: 650, delivered: 620, opened: 310, replied: 84, positive: 54, meetings: 19 },
      linkedin: { sent: 220, delivered: 210, opened: 98, replied: 34, positive: 21, meetings: 8 },
      sms: { sent: 140, delivered: 136, opened: 118, replied: 19, positive: 10, meetings: 4 },
      voice: { sent: 86, delivered: 79, opened: 0, replied: 57, positive: 29, meetings: 7 }
    }
  },
  system: {
    autonomy: 'ACTIVE',
    killSwitch: false
  }
};
