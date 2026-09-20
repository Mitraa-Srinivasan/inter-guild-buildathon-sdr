const router = require('express').Router();
const { supabase, unwrap } = require('../db/supabase');
const { handleError, HttpError } = require('../lib/http');
const { AGENT_TYPES } = require('../lib/enums');

// Per-agent numbers for the Agents page, computed from the activities table (nothing is stored or estimated here).
// Rows are read in 1000-row pages and summed in whole micro-dollars (activities.cost is numeric(12,6)), like /activities/spend.
const PAGE = 1000;
// Every agent that writes activities gets an entry even with zero rows (so a page can say "no activity yet" instead of
// guessing): the 7 DronaHQ agents, plus 'dispatch' (simulated sending) and 'discovery' (Groq + Tavily, not DronaHQ).
const KNOWN = [...AGENT_TYPES, 'dispatch', 'discovery'];

const blank = (agent_type) => ({ agent_type, processed: 0, success: 0, failed: 0, pending_approval: 0, cost_total_micro: 0, cost_today_micro: 0, last_ms: null });

// GET /agents/stats?since=<ISO datetime>   ("today" for cost_today starts at `since`; default the start of the current UTC day,
// the same convention as GET /activities/spend, and the UI sends its local midnight)
//   -> { since, generated_at, total_activities, agents: { <agent_type>: {
//        agent_type, processed, success, failed, errors, pending_approval,
//        success_rate (success / processed, 0..1, null when there are no activities),
//        cost_today, cost_total (USD, estimated), last_activity (ISO or null) } } }
// processed = every activity row for that agent_type; errors = rows with status 'failed'.
router.get('/stats', async (req, res) => {
  try {
    const since = req.query.since ? new Date(req.query.since) : new Date(new Date().setUTCHours(0, 0, 0, 0));
    if (Number.isNaN(since.getTime())) throw new HttpError(400, 'since must be an ISO date-time');

    const acc = Object.fromEntries(KNOWN.map((t) => [t, blank(t)]));
    let total = 0;
    for (let from = 0; ; from += PAGE) {
      const page = unwrap(
        await supabase.from('activities').select('agent_type, status, cost, created_at').order('id').range(from, from + PAGE - 1)
      );
      for (const a of page) {
        const s = acc[a.agent_type] || (acc[a.agent_type] = blank(a.agent_type));
        s.processed += 1;
        if (a.status === 'success') s.success += 1;
        else if (a.status === 'failed') s.failed += 1;
        else if (a.status === 'pending_approval') s.pending_approval += 1;
        const micro = Math.round(Number(a.cost || 0) * 1e6);
        s.cost_total_micro += micro;
        const at = Date.parse(a.created_at);
        if (at >= since.getTime()) s.cost_today_micro += micro;
        if (s.last_ms === null || at > s.last_ms) s.last_ms = at;
      }
      total += page.length;
      if (page.length < PAGE) break;
    }

    const agents = {};
    for (const [type, s] of Object.entries(acc)) {
      agents[type] = {
        agent_type: type,
        processed: s.processed,
        success: s.success,
        failed: s.failed,
        errors: s.failed,
        pending_approval: s.pending_approval,
        success_rate: s.processed ? s.success / s.processed : null,
        cost_today: s.cost_today_micro / 1e6,
        cost_total: s.cost_total_micro / 1e6,
        last_activity: s.last_ms === null ? null : new Date(s.last_ms).toISOString(),
      };
    }
    res.json({ since: since.toISOString(), generated_at: new Date().toISOString(), total_activities: total, agents });
  } catch (err) {
    handleError(res, err);
  }
});

module.exports = router;
