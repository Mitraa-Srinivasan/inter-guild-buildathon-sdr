const { supabase, unwrap } = require('../db/supabase');
const { loadCampaignProspect } = require('./common');

// Deterministic conflict gate: decides whether an actual outreach action (a dispatch) may happen.
// Separate from gate.js, which only checks the kill switch and campaign status.

const HOUR = 3600 * 1000;
const CROSS_CAMPAIGN_WINDOW_MS = 48 * HOUR;
const FREQUENCY_WINDOW_MS = 7 * 24 * HOUR;
const FREQUENCY_CAP = 3;

const allow = () => ({ allowed: true, reason: null, details: '' });
const deny = (reason, details = '') => ({ allowed: false, reason, details });

const isoAgo = (ms) => new Date(Date.now() - ms).toISOString();
const startOfUtcDay = () => new Date(new Date().setUTCHours(0, 0, 0, 0)).toISOString();

// Pulls a number out of whatever is stored: 50, "50", "50 per day", { daily: 50 }, ...  null if there isn't one.
function toNumber(v) {
  if (typeof v === 'number') return Number.isFinite(v) && v >= 0 ? v : null;
  if (typeof v === 'string') {
    const m = /\d+(?:\.\d+)?/.exec(v);
    return m ? Number(m[0]) : null;
  }
  if (v && typeof v === 'object') {
    for (const k of ['daily', 'per_day', 'limit', 'max']) {
      if (k in v) {
        const n = toNumber(v[k]);
        if (n !== null) return n;
      }
    }
    for (const inner of Object.values(v)) {
      const n = toNumber(inner);
      if (n !== null) return n;
    }
  }
  return null;
}

// Daily limit for a channel from campaigns.daily_limits; null = no limit set (unlimited).
function dailyLimitFor(dailyLimits, channel) {
  if (!dailyLimits || !channel) return null;
  const key = Object.keys(dailyLimits).find((k) => k.toLowerCase() === String(channel).toLowerCase());
  return key === undefined ? null : toNumber(dailyLimits[key]);
}

// Successful dispatch activities matching `narrow`. Denied dispatches are logged as 'failed' and never count.
async function countDispatches(narrow) {
  const { count, error } = await narrow(
    supabase.from('activities').select('id', { count: 'exact', head: true }).eq('action_type', 'dispatch').eq('status', 'success')
  );
  if (error) throw error;
  return count || 0;
}

// Returns { allowed, reason, details }. Checks run in order and stop at the first failure:
//   1. suppressed                 2. prospect_rejected
//   3. pending_approval           4. active_in_other_campaign
//   5. frequency_cap_exceeded     6. daily_limit_reached
// options.channel selects which channel's daily limit applies (no channel -> no daily limit).
async function checkConflicts(campaignProspectId, { channel } = {}) {
  const cp = await loadCampaignProspect(campaignProspectId);

  // 1. Global suppression list (values are stored trimmed + lowercased).
  const email = typeof cp.prospect.email === 'string' ? cp.prospect.email.trim().toLowerCase() : '';
  if (email) {
    const hit = unwrap(await supabase.from('suppression_list').select('id').eq('scope', 'global').eq('value', email).limit(1));
    if (hit.length) return deny('suppressed', 'prospect email is on the global suppression list');
  }

  // 2. A prospect that ICP scoring rejected is never contacted.
  if (cp.funnel_state === 'rejected') return deny('prospect_rejected', "prospect is in funnel_state 'rejected'");

  // 3. A pending approval (e.g. an ICP escalation) means a human hasn't signed off yet: hold the outreach.
  //    Scoped to this campaign prospect; once the approval is approved/rejected it no longer blocks.
  const pendingApprovals = unwrap(
    await supabase
      .from('approvals')
      .select('id, proposed_action_json')
      .eq('campaign_id', cp.campaign_id)
      .eq('prospect_id', cp.prospect_id)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1)
  );
  if (pendingApprovals.length) {
    const type = pendingApprovals[0].proposed_action_json && pendingApprovals[0].proposed_action_json.type;
    return deny('pending_approval', `approval ${pendingApprovals[0].id} is pending${type ? ` (${type})` : ''}`);
  }

  // 4. Same prospect in another live campaign with a (non-failed) dispatch in the last 48h.
  //    Only dispatches count: research/ICP/etc. running on the prospect in two campaigns must not block outreach.
  //    Failed dispatches are ignored so that a denied dispatch in one campaign can't itself block the other.
  const links = unwrap(
    await supabase
      .from('campaign_prospects')
      .select('campaign_id, campaign:campaigns(id, name, status)')
      .eq('prospect_id', cp.prospect_id)
      .neq('campaign_id', cp.campaign_id)
  );
  const liveOthers = links.filter((l) => l.campaign && l.campaign.status === 'live');
  if (liveOthers.length) {
    const recent = unwrap(
      await supabase
        .from('activities')
        .select('campaign_id')
        .eq('prospect_id', cp.prospect_id)
        .in('campaign_id', liveOthers.map((l) => l.campaign_id))
        .eq('action_type', 'dispatch')
        .neq('status', 'failed')
        .gte('created_at', isoAgo(CROSS_CAMPAIGN_WINDOW_MS))
        .order('created_at', { ascending: false })
        .limit(1)
    );
    if (recent.length) {
      return deny('active_in_other_campaign', liveOthers.find((l) => l.campaign_id === recent[0].campaign_id).campaign.name);
    }
  }

  // 5. Frequency cap: successful dispatches to this campaign_prospect in the last 7 days.
  const recentDispatches = await countDispatches((q) =>
    q.eq('campaign_id', cp.campaign_id).eq('prospect_id', cp.prospect_id).gte('created_at', isoAgo(FREQUENCY_WINDOW_MS))
  );
  if (recentDispatches >= FREQUENCY_CAP) {
    return deny('frequency_cap_exceeded', `${recentDispatches} dispatches in the last 7 days (cap ${FREQUENCY_CAP})`);
  }

  // 6. Daily limit: successful dispatches today (UTC) across the whole campaign, on this channel.
  const limit = dailyLimitFor(cp.campaign.daily_limits, channel);
  if (limit !== null) {
    const today = await countDispatches((q) => q.eq('campaign_id', cp.campaign_id).eq('channel', channel).gte('created_at', startOfUtcDay()));
    if (today >= limit) return deny('daily_limit_reached', `${today} of ${limit} ${channel} dispatches used today`);
  }

  return allow();
}

module.exports = { checkConflicts, dailyLimitFor, toNumber, FREQUENCY_CAP };
