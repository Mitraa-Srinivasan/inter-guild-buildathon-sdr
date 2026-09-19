const { supabase, unwrap } = require('../db/supabase');
const { loadCampaignProspect } = require('./common');
const { globallyPausedChannels, globalChannelName } = require('./channels');

// Deterministic conflict gate: decides whether an actual outreach action (a dispatch) may happen.
// Separate from gate.js, which only checks the kill switch and campaign status.

const HOUR = 3600 * 1000;
const CROSS_CAMPAIGN_WINDOW_MS = 48 * HOUR;
const FREQUENCY_WINDOW_MS = 7 * 24 * HOUR; // keep in step with FREQUENCY_WINDOW_DAYS
const FREQUENCY_CAP = 3;
const FREQUENCY_WINDOW_DAYS = 7;

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

// The two count-based checks, on their own so a dispatch can repeat them atomically when it claims its slot.
//   frequency_cap_exceeded: successful dispatches to this campaign prospect in the last 7 days
//   daily_limit_reached:    successful dispatches today (UTC) across the campaign on this channel
async function checkCaps(cp, channel) {
  const recentDispatches = await countDispatches((q) =>
    q.eq('campaign_id', cp.campaign_id).eq('prospect_id', cp.prospect_id).gte('created_at', isoAgo(FREQUENCY_WINDOW_MS))
  );
  if (recentDispatches >= FREQUENCY_CAP) {
    return deny('frequency_cap_exceeded', `${recentDispatches} dispatches in the last ${FREQUENCY_WINDOW_DAYS} days (cap ${FREQUENCY_CAP})`);
  }
  const limit = dailyLimitFor(cp.campaign.daily_limits, channel);
  if (limit !== null) {
    const today = await countDispatches((q) => q.eq('campaign_id', cp.campaign_id).eq('channel', channel).gte('created_at', startOfUtcDay()));
    if (today >= limit) return deny('daily_limit_reached', `${today} of ${limit} ${channel} dispatches used today`);
  }
  return allow();
}

// Returns { allowed, reason, details }. Checks run in order and stop at the first failure:
//   0. channel_paused (global)
//   1. suppressed                 2. prospect_rejected
//   3. approval_rejected / pending_approval   4. active_in_other_campaign
//   5. frequency_cap_exceeded     6. daily_limit_reached
// options.channel selects which channel's daily limit applies (no channel -> no daily limit).
async function checkConflicts(campaignProspectId, { channel } = {}) {
  const cp = await loadCampaignProspect(campaignProspectId);

  // 0. Channel paused for the whole platform (Settings > Channel pause). This is on top of the campaign's own
  //    channel_config, which the callers check separately.
  if (channel && (await globallyPausedChannels()).has(globalChannelName(channel))) {
    return deny('channel_paused', `"${globalChannelName(channel)}" is paused globally for every campaign`);
  }

  // 1. Global suppression list (values are stored trimmed + lowercased).
  const email = typeof cp.prospect.email === 'string' ? cp.prospect.email.trim().toLowerCase() : '';
  if (email) {
    const hit = unwrap(await supabase.from('suppression_list').select('id').eq('scope', 'global').eq('value', email).limit(1));
    if (hit.length) return deny('suppressed', 'prospect email is on the global suppression list');
  }

  // 2. A prospect that ICP scoring rejected is never contacted.
  if (cp.funnel_state === 'rejected') return deny('prospect_rejected', "prospect is in funnel_state 'rejected'");

  // 3. Approvals for this campaign prospect (e.g. an ICP escalation), scoped to this campaign.
  //    A REJECTED approval is a permanent no: a human said not to contact this prospect. It is checked before pending
  //    ones, so a rejection can't be undone by a later approval being queued or approved.
  //    A PENDING approval holds the outreach until a human decides; once approved it no longer blocks.
  const approvals = unwrap(
    await supabase
      .from('approvals')
      .select('id, status, proposed_action_json')
      .eq('campaign_id', cp.campaign_id)
      .eq('prospect_id', cp.prospect_id)
      .in('status', ['rejected', 'pending'])
      .order('created_at', { ascending: true })
  );
  const describe = (a) => {
    const type = a.proposed_action_json && a.proposed_action_json.type;
    return `approval ${a.id}${type ? ` (${type})` : ''}`;
  };
  const rejected = approvals.find((a) => a.status === 'rejected');
  if (rejected) return deny('approval_rejected', `${describe(rejected)} was rejected by a reviewer`);
  const pending = approvals.find((a) => a.status === 'pending');
  if (pending) return deny('pending_approval', `${describe(pending)} is pending`);

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

  // 5 + 6. Frequency cap and daily limit. These are also re-checked, under a lock, at the moment a dispatch claims its slot
  //         (see dispatchSlot.js); this earlier pass is what gives the caller a clear reason before anything is written.
  const caps = await checkCaps(cp, channel);
  if (!caps.allowed) return caps;

  return allow();
}

module.exports = { checkConflicts, checkCaps, dailyLimitFor, toNumber, FREQUENCY_CAP, FREQUENCY_WINDOW_DAYS, FREQUENCY_WINDOW_MS };
