const { runDiscovery } = require('./discovery');
const { runResearch } = require('./research');
const { runIcp } = require('./icp');

// Discovery, then research + ICP scoring for each NEW prospect. Unlike plain discovery this calls the real DronaHQ agents
// (run-research and run-icp per prospect), so it spends credits: it must only ever run because a human asked for it. The route
// refuses to run without an explicit confirm_spend flag, and nothing in the codebase calls this function except that route.
//
// Failure handling: one prospect failing never stops the others. Gate blocks (kill switch, campaign not live, agent paused)
// apply to every prospect alike, so the first one stops the rest. Three failures in a row (DronaHQ down, guardrail storm) stop the
// batch instead of burning more calls.
const MAX_CONSECUTIVE_FAILURES = 3;

// -> { blocked: true, reason }                       kill switch on, before anything ran
//    { discovery, results: [...], summary: {...} }
async function runDiscoverAndQualify(campaignId, { limit } = {}, deps = {}) {
  const discover = deps.runDiscovery || runDiscovery;
  const research = deps.runResearch || runResearch;
  const icp = deps.runIcp || runIcp;

  const discovery = await discover(campaignId, { limit });
  if (discovery.blocked) return discovery;

  const results = [];
  let stopReason = null;
  let consecutiveFailures = 0;

  for (const { campaign_prospect: cp, prospect } of discovery.created) {
    const item = { campaign_prospect_id: cp.id, name: prospect.name, company: prospect.company, steps_done: [] };
    if (stopReason) {
      results.push({ ...item, status: 'skipped', reason: stopReason });
      continue;
    }
    try {
      const r = await research(cp.id);
      if (r.blocked) {
        stopReason = r.reason;
        results.push({ ...item, status: 'blocked', failed_step: 'research', reason: r.reason });
        continue;
      }
      item.steps_done.push('research');

      const s = await icp(cp.id);
      if (s.blocked) {
        stopReason = s.reason;
        results.push({ ...item, status: 'blocked', failed_step: 'icp', reason: s.reason });
        continue;
      }
      item.steps_done.push('icp');

      const row = s.campaignProspect;
      consecutiveFailures = 0;
      results.push({ ...item, status: row.funnel_state, funnel_state: row.funnel_state, icp_score: row.icp_score });
    } catch (err) {
      consecutiveFailures += 1;
      results.push({ ...item, status: 'failed', failed_step: item.steps_done.length ? 'icp' : 'research', error: err.message });
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) stopReason = `stopped after ${MAX_CONSECUTIVE_FAILURES} failures in a row`;
    }
  }

  const count = (s) => results.filter((r) => r.status === s).length;
  return {
    discovery: {
      queries: discovery.queries,
      found: discovery.found,
      created: discovery.created.length,
      skipped: discovery.skipped,
      usage: discovery.usage,
    },
    results,
    summary: {
      discovered: discovery.created.length,
      qualified: count('qualified'),
      rejected: count('rejected'),
      failed: count('failed'),
      blocked: count('blocked'),
      skipped: count('skipped'),
      stopped_reason: stopReason,
    },
  };
}

module.exports = { runDiscoverAndQualify, MAX_CONSECUTIVE_FAILURES };
