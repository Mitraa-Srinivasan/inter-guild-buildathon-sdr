const { supabase, unwrap } = require('../db/supabase');

const present = (v) => v !== undefined && v !== null && v !== '';
const RECENT_LIMIT = 20;

function timeAgo(iso, now = Date.now()) {
  const mins = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

const oneLine = (s, max = 120) => {
  const t = String(s).replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
};

// Recent activity for this prospect within this campaign, newest first.
// excludeAgentType drops the calling agent's own earlier decisions; they aren't interactions with the prospect.
async function loadRecentActivities(cp, excludeAgentType) {
  return unwrap(
    await supabase
      .from('activities')
      .select('agent_type, action_type, channel, status, output_summary, created_at')
      .eq('campaign_id', cp.campaign_id)
      .eq('prospect_id', cp.prospect_id)
      .neq('agent_type', excludeAgentType)
      .order('created_at', { ascending: false })
      .limit(RECENT_LIMIT)
  );
}

// Lines like: "- 3 days ago | channel: linkedin | outcome: connect_request success - <summary>"
function formatActivityHistory(activities, now = Date.now()) {
  const lines = ['Recent activity (newest first):'];
  if (!activities.length) lines.push('- No recorded activity yet.');
  for (const a of activities) {
    const outcome = `${a.action_type} ${a.status}${present(a.output_summary) ? ` - ${oneLine(a.output_summary)}` : ''}`;
    lines.push(`- ${timeAgo(a.created_at, now)} | channel: ${present(a.channel) ? a.channel : 'n/a'} | outcome: ${outcome}`);
  }
  return lines;
}

module.exports = { loadRecentActivities, formatActivityHistory, timeAgo };
