import express from 'express';
import dronahqRoutes from './dronahq.routes.js';
import { mockData } from '../data/mockData.js';

const router = express.Router();

router.use('/integrations/dronahq', dronahqRoutes);

router.get('/auth/me', (req, res) => {
  res.json({
    success: true,
    data: {
      id: 'user-1',
      email: 'manager@autonomous-sdr.dev',
      name: 'Ava Manager',
      role: 'ADMIN'
    }
  });
});

router.post('/auth/login', (req, res) => {
  const { email } = req.body || {};
  res.json({
    success: true,
    data: {
      token: 'demo-token',
      user: {
        id: 'user-1',
        email: email || 'manager@autonomous-sdr.dev',
        name: 'Ava Manager',
        role: 'ADMIN'
      }
    }
  });
});

router.post('/auth/register', (req, res) => {
  res.json({ success: true, data: { message: 'User created' } });
});

router.post('/campaigns', (req, res) => {
  const { name, icp } = req.body || {};
  const campaign = {
    id: `cmp-${Date.now()}`,
    name: name || 'New campaign',
    status: 'LIVE',
    icp: icp || 'Targeted outbound campaign',
    owner: 'Ava Manager',
    prospects: 0,
    qualified: 0,
    contacted: 0,
    meetings: 0,
    conversion: 0,
    channels: ['EMAIL'],
    agentStatus: 'ACTIVE',
    lastActivity: 'just now'
  };

  mockData.campaigns.unshift(campaign);
  res.json({ success: true, data: { message: 'Campaign created', id: campaign.id } });
});

router.get('/campaigns', (req, res) => {
  res.json({ success: true, data: mockData.campaigns });
});

router.get('/dashboard/overview', (req, res) => {
  res.json({ success: true, data: mockData.dashboard });
});

router.get('/prospects', (req, res) => {
  const { status } = req.query;
  const items = status
    ? mockData.prospects.filter((prospect) => prospect.status === status.toUpperCase())
    : mockData.prospects;

  res.json({ success: true, data: items });
});

router.post('/prospects/:id/call', (req, res) => {
  const prospect = mockData.prospects.find((item) => item.id === req.params.id);

  if (!prospect) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Prospect not found' } });
  }

  prospect.status = 'ENGAGED';
  prospect.lastTouch = 'just now';
  prospect.nextAction = 'Follow up with meeting recap';

  const result = {
    status: 'CALL_INITIATED',
    id: prospect.id,
    script: `Connected with ${prospect.name} at ${prospect.company}. Intent score updated by 4 points.`,
    confidence: 'high'
  };

  res.json({ success: true, data: result });
});

router.get('/analytics/overview', (req, res) => {
  res.json({ success: true, data: mockData.analytics });
});

router.get('/calls', (req, res) => {
  res.json({ success: true, data: mockData.calls });
});

router.get('/approvals', (req, res) => {
  res.json({ success: true, data: mockData.approvals });
});

router.get('/escalations', (req, res) => {
  res.json({ success: true, data: mockData.escalations });
});

router.get('/agents', (req, res) => {
  res.json({ success: true, data: mockData.agents });
});

router.get('/knowledge', (req, res) => {
  res.json({ success: true, data: mockData.knowledge });
});

router.get('/conversations', (req, res) => {
  res.json({ success: true, data: mockData.conversations });
});

router.get('/system/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', autonomy: mockData.system.autonomy, mockMode: true } });
});

router.post('/system/kill-switch', (req, res) => {
  mockData.system.killSwitch = true;
  mockData.system.autonomy = 'PAUSED';
  res.json({ success: true, data: { status: 'STOPPED', message: 'Global autonomy stopped' } });
});

router.post('/system/resume-autonomy', (req, res) => {
  mockData.system.killSwitch = false;
  mockData.system.autonomy = 'ACTIVE';
  res.json({ success: true, data: { status: 'ACTIVE', message: 'Autonomy resumed' } });
});

export { router as apiRouter };
