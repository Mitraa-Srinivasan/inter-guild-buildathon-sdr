const { supabase, unwrap } = require('../db/supabase');
const { HttpError } = require('../lib/http');

// Pre-send gate shared by orchestrator steps.
// Returns null when the step may proceed, or a block reason string (callers turn it into 423 { blocked, reason }):
//   'kill_switch_on'    the global kill switch is on
//   'campaign_not_live' the campaign is draft / paused / completed / archived
//   'agent_paused'      this agent type is switched off for the campaign (campaigns.enabled_agents[agentType] === false)
// agentType is optional: steps that aren't an agent (dispatch) omit it and skip the agent check. Any agent not
// explicitly set to false is enabled, so campaigns with the default '{}' behave exactly as before.
async function preSendGate(campaign, agentType) {
  const settings = unwrap(await supabase.from('global_settings').select('kill_switch_on').eq('id', true).maybeSingle());
  if (!settings) throw new HttpError(500, 'global_settings row missing; re-run db/schema.sql');
  if (settings.kill_switch_on) return 'kill_switch_on';
  if (campaign.status !== 'live') return 'campaign_not_live';
  if (agentType && campaign.enabled_agents && campaign.enabled_agents[agentType] === false) return 'agent_paused';
  return null;
}

module.exports = { preSendGate };
