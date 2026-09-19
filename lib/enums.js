// Keep in sync with the CHECK constraints in db/schema.sql
module.exports = {
  CAMPAIGN_STATUS: ['draft', 'live', 'paused', 'completed', 'archived'],
  FUNNEL_STATE: [
    'discovered',
    'researched',
    'qualified',
    'rejected',
    'contacted',
    'engaged',
    'meeting',
    'opportunity',
  ],
  ACTIVITY_STATUS: ['success', 'failed', 'pending_approval'],
  APPROVAL_STATUS: ['pending', 'approved', 'rejected'],
};
