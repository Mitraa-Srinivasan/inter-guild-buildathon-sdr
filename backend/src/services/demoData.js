export const demoData = {
  campaigns: [
    { id: 'cmp-1', name: 'US SaaS CTO Outreach', status: 'LIVE', icp: 'B2B SaaS companies in the United States', channels: ['EMAIL', 'VOICE'], owner: 'Ava Manager' },
    { id: 'cmp-2', name: 'India BFSI CIO Outreach', status: 'LIVE', icp: 'Indian banking, financial services and insurance companies', channels: ['EMAIL', 'SMS'], owner: 'Rahul Bhatia' },
    { id: 'cmp-3', name: 'Voice AI Founders', status: 'PAUSED', icp: 'AI/Voice AI startups', channels: ['VOICE'], owner: 'Maya Nord' }
  ],
  prospects: [
    { id: 'p-1', name: 'John Smith', company: 'Northstar Cloud', title: 'CTO', status: 'QUALIFIED', score: 91, campaign: 'cmp-1' },
    { id: 'p-2', name: 'Ananya Nair', company: 'Sutra Finance', title: 'CIO', status: 'ENGAGED', score: 88, campaign: 'cmp-2' },
    { id: 'p-3', name: 'Mara Diaz', company: 'Signal Harbor', title: 'Founder', status: 'CONTACTED', score: 83, campaign: 'cmp-3' },
    { id: 'p-4', name: 'Priya Kannan', company: 'BluePeak Capital', title: 'Head of Digital Transformation', status: 'MEETING', score: 90, campaign: 'cmp-2' }
  ]
};
