const { supabase, unwrap } = require('../db/supabase');
const { HttpError } = require('../lib/http');

// Pre-send gate shared by orchestrator steps.
// Returns null when the step may proceed, or a block reason string.
async function preSendGate(campaign) {
  const settings = unwrap(await supabase.from('global_settings').select('kill_switch_on').eq('id', true).maybeSingle());
  if (!settings) throw new HttpError(500, 'global_settings row missing; re-run db/schema.sql');
  if (settings.kill_switch_on) return 'kill_switch_on';
  if (campaign.status !== 'live') return 'campaign_not_live';
  return null;
}

module.exports = { preSendGate };
