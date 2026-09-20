const { supabase, unwrap } = require('../db/supabase');

// Campaign-specific guidance: the active prompt_versions row for this campaign + agent type, if any.
// DronaHQ's own agent Instructions stay global; this text is appended to the prompt we send, and the version's id
// is recorded on the activity (activities.prompt_version_id) so an outcome can be traced to the guidance behind it.
async function loadActiveGuidance(campaignId, agentType) {
  const rows = unwrap(
    await supabase
      .from('prompt_versions')
      .select('id, version, content')
      .eq('campaign_id', campaignId)
      .eq('agent_type', agentType)
      .eq('is_active', true)
      .limit(1)
  );
  return rows[0] || null;
}

const appendGuidance = (prompt, version) => (version ? `${prompt}\n\nCampaign-specific guidance: ${version.content.trim()}` : prompt);

module.exports = { loadActiveGuidance, appendGuidance };
