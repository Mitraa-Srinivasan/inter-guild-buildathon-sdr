const { supabase, unwrap } = require('../db/supabase');
const { enabledChannels } = require('./channels');
const { runResearch } = require('./research');
const { runIcp } = require('./icp');
const { runStrategy } = require('./strategy');
const { runPersonalize } = require('./personalize');
const { runFollowup } = require('./followup');
const { runDispatch } = require('./dispatch');

// The autonomous loop: one pass over every live campaign, doing the next step for each prospect whose next step can be worked
// out from where it is in the funnel. It is OFF unless global_settings.autonomous_mode is true, and it is never scheduled by this
// code: something outside (a person, a cron) has to POST /run-cycle.
//
// What it never does: run-conversation (needs a real reply from a person), run-voice (a call must be asked for), discover-and-qualify
// (spends credits on new prospects, human only), or anything for a prospect that is rejected, engaged, in a meeting, or waiting on a
// pending approval. Those are a human's.
const FOLLOWUP_AFTER_HOURS = 72;   // no reply this long after the last touch -> ask the follow-up agent what next
const MAX_FOLLOWUPS = 2;
const DEFAULT_MAX_ACTIONS = 10;    // per cycle: bounds how many real agent calls one pass can make
const HARD_MAX_ACTIONS = 50;
const MAX_CONSECUTIVE_FAILURES = 3;

const HOUR = 3600 * 1000;
const present = (v) => v !== undefined && v !== null && v !== '';

// Reads the flag. A missing column (schema not updated yet) means OFF, never "on".
async function isAutonomousModeOn() {
  const { data, error } = await supabase.from('global_settings').select('autonomous_mode').eq('id', true).maybeSingle();
  if (error) {
    if (error.code === '42703') return false;
    throw error;
  }
  return Boolean(data && data.autonomous_mode === true);
}

// The channel the strategy agent picked, if it is enabled for the campaign. null = none / not usable.
function chosenChannel(strategy, campaign) {
  const text = String((strategy && strategy.next_channel) || '').toLowerCase();
  return enabledChannels(campaign.channel_config).find((ch) => text.includes(ch)) || null;
}

// PURE: what should happen next for one campaign prospect?
//   cp:  the campaign_prospects row (funnel_state, icp_score, context_json)
//   ctx: { campaign, pendingApproval, dispatches: [ISO of each successful dispatch], followups: [ISO of each follow-up run] }
// -> { step: 'research'|'icp'|'strategy'|'personalize'|'dispatch'|'followup', channel? }  or  { step: null, reason }
function nextStep(cp, ctx, now = Date.now()) {
  const c = cp.context_json || {};
  const state = cp.funnel_state;
  const wait = (reason) => ({ step: null, reason });

  if (state === 'rejected') return wait('rejected');
  if (['engaged', 'meeting', 'opportunity'].includes(state)) return wait('with_a_human');
  if (ctx.pendingApproval) return wait('awaiting_approval');

  if (state === 'discovered' || state === 'researched') {
    if (!present(c.research)) return { step: 'research' };
    if (cp.icp_score === null || cp.icp_score === undefined) return { step: 'icp' };
    return wait('scored_but_state_unchanged');
  }

  if (state === 'qualified') {
    if (!c.strategy) return { step: 'strategy' };
    if (!present(c.email_subject) || !present(c.email_body)) return { step: 'personalize' };
    if (ctx.dispatches.length) return wait('already_dispatched');
    const s = c.strategy;
    if (/^\s*(no|not now|wait|hold|later)\b/i.test(String(s.contact_now || ''))) return wait('strategy_says_wait');
    const channel = chosenChannel(s, ctx.campaign);
    if (!channel) return wait('no_usable_channel');
    return { step: 'dispatch', channel };
  }

  if (state === 'contacted') {
    const lastDispatch = ctx.dispatches.length ? Math.max(...ctx.dispatches.map((t) => Date.parse(t))) : null;
    const lc = c.last_conversation;
    if (lc && lc.classified_at && (lastDispatch === null || Date.parse(lc.classified_at) >= lastDispatch)) return wait('replied_needs_a_person');
    if (lastDispatch === null) return wait('no_dispatch_recorded');
    if (ctx.followups.length >= MAX_FOLLOWUPS) return wait('followups_used_up');
    const lastTouch = Math.max(lastDispatch, ...ctx.followups.map((t) => Date.parse(t)));
    if (now - lastTouch >= FOLLOWUP_AFTER_HOURS * HOUR) return { step: 'followup' };
    return wait('waiting_for_reply');
  }

  return wait('no_rule_for_state');
}

async function loadAll(builder) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const page = unwrap(await builder().range(from, from + 999));
    rows.push(...page);
    if (page.length < 1000) return rows;
  }
}

// The decisions for every live campaign, without doing anything. -> [{ campaign, cp, prospect, decision }]
async function planCycle(now = Date.now()) {
  const campaigns = unwrap(await supabase.from('campaigns').select('*').eq('status', 'live').order('name'));
  const plan = [];
  for (const campaign of campaigns) {
    const cps = await loadAll(() => supabase.from('campaign_prospects').select('*, prospect:prospects(id, name, company)').eq('campaign_id', campaign.id).order('created_at').order('id'));
    if (!cps.length) continue;
    const acts = await loadAll(() => supabase.from('activities').select('prospect_id, agent_type, action_type, status, created_at').eq('campaign_id', campaign.id).eq('status', 'success').in('agent_type', ['dispatch', 'follow']).order('id'));
    const approvals = unwrap(await supabase.from('approvals').select('prospect_id').eq('campaign_id', campaign.id).eq('status', 'pending'));
    const pending = new Set(approvals.map((a) => a.prospect_id));
    for (const cp of cps) {
      const mine = acts.filter((a) => a.prospect_id === cp.prospect_id);
      const ctx = {
        campaign,
        pendingApproval: pending.has(cp.prospect_id),
        dispatches: mine.filter((a) => a.agent_type === 'dispatch').map((a) => a.created_at),
        followups: mine.filter((a) => a.agent_type === 'follow').map((a) => a.created_at),
      };
      plan.push({ campaign, cp, prospect: cp.prospect, decision: nextStep(cp, ctx, now) });
    }
  }
  return plan;
}

const RUNNERS = {
  research: (item) => runResearch(item.cp.id),
  icp: (item) => runIcp(item.cp.id),
  strategy: (item) => runStrategy(item.cp.id),
  personalize: (item) => runPersonalize(item.cp.id),
  followup: (item) => runFollowup(item.cp.id),
  dispatch: (item) => runDispatch(item.cp.id, item.decision.channel),
};

let running = false;

// One pass. -> { ran: false, reason } if it did not start, otherwise { ran: true, ... } with what was done.
async function runCycle({ maxActions, dryRun = false, now = Date.now() } = {}) {
  if (!(await isAutonomousModeOn())) return { ran: false, reason: 'autonomous_mode_off' };
  const settings = unwrap(await supabase.from('global_settings').select('kill_switch_on').eq('id', true).maybeSingle());
  if (settings && settings.kill_switch_on) return { ran: false, reason: 'kill_switch_on' };
  if (running) return { ran: false, reason: 'cycle_already_running' };

  running = true;
  try {
    const budget = Math.min(Math.max(parseInt(maxActions, 10) || DEFAULT_MAX_ACTIONS, 1), HARD_MAX_ACTIONS);
    const plan = await planCycle(now);
    const todo = plan.filter((p) => p.decision.step);
    const waiting = plan.filter((p) => !p.decision.step).map((p) => ({ campaign: p.campaign.name, prospect: p.prospect.name, campaign_prospect_id: p.cp.id, reason: p.decision.reason }));

    const summary = { ran: true, dry_run: dryRun, live_campaigns: new Set(plan.map((p) => p.campaign.id)).size, considered: plan.length, to_do: todo.length, max_actions: budget, actions: [], waiting, deferred: 0, stopped_reason: null };
    if (dryRun) {
      summary.actions = todo.slice(0, budget).map((p) => ({ campaign: p.campaign.name, prospect: p.prospect.name, campaign_prospect_id: p.cp.id, step: p.decision.step, channel: p.decision.channel || null, outcome: 'planned' }));
      summary.deferred = Math.max(todo.length - budget, 0);
      return summary;
    }

    let failures = 0;
    for (const item of todo) {
      if (summary.actions.length >= budget) { summary.deferred += 1; continue; }
      if (summary.stopped_reason) { summary.deferred += 1; continue; }
      const action = { campaign: item.campaign.name, prospect: item.prospect.name, campaign_prospect_id: item.cp.id, step: item.decision.step, channel: item.decision.channel || null };
      try {
        const r = await RUNNERS[item.decision.step](item);
        if (r.blocked) {
          summary.actions.push({ ...action, outcome: 'blocked', reason: r.reason });
          // The kill switch applies to everything; stop. A campaign or agent block only concerns that campaign, keep going.
          if (r.reason === 'kill_switch_on') summary.stopped_reason = 'kill_switch_on';
        } else if (r.denied) {
          summary.actions.push({ ...action, outcome: 'denied', reason: r.reason, details: r.details });
        } else {
          failures = 0;
          const row = r.campaignProspect || {};
          summary.actions.push({ ...action, outcome: 'done', funnel_state: row.funnel_state || null });
        }
      } catch (err) {
        failures += 1;
        summary.actions.push({ ...action, outcome: 'failed', error: err.message });
        if (failures >= MAX_CONSECUTIVE_FAILURES) summary.stopped_reason = `stopped after ${MAX_CONSECUTIVE_FAILURES} failures in a row`;
      }
    }
    return summary;
  } finally {
    running = false;
  }
}

module.exports = { runCycle, planCycle, nextStep, isAutonomousModeOn, FOLLOWUP_AFTER_HOURS, MAX_FOLLOWUPS, DEFAULT_MAX_ACTIONS };
