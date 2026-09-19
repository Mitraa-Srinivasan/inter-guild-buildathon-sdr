const { supabase } = require('../db/supabase');
const { logActivity } = require('./common');
const { checkCaps, dailyLimitFor, FREQUENCY_CAP, FREQUENCY_WINDOW_DAYS } = require('./conflict');

// Claiming a dispatch slot is the one step where "check the caps" and "record the dispatch" must be a single atomic
// action. Otherwise two simultaneous dispatches at the cap boundary both read "2 of 3", both pass, and both write.
//
// Preferred: the claim_dispatch_slot() Postgres function (db/schema.sql). It runs in one transaction under advisory locks,
// so it is safe across any number of server processes.
// Fallback (function not installed yet): the same recheck-then-insert, serialised by an in-process lock. That fully protects
// a single server process (which is how this app runs) but NOT several processes; installing the function removes that limit.
//
// Returns { allowed: true, activity_id } (a 'success' dispatch activity now exists and counts toward the caps) or
//         { allowed: false, reason, details }.

const RECHECK_RPC_EVERY_MS = 60 * 1000;
let rpcMissingUntil = 0; // when > now, the function is known to be missing; retried after this so installing it needs no restart
let warned = false;

// Keyed in-process mutex: run(keys, fn) runs fn once no other run() holds any of the same keys.
const tails = new Map();
async function acquire(key) {
  const prev = tails.get(key) || Promise.resolve();
  let release;
  const gate = new Promise((r) => (release = r));
  const tail = prev.then(() => gate);
  tails.set(key, tail);
  await prev;
  return () => {
    release();
    if (tails.get(key) === tail) tails.delete(key); // nobody queued behind us
  };
}
async function withLocks(keys, fn) {
  const releases = [];
  try {
    for (const key of [...new Set(keys)].sort()) releases.push(await acquire(key)); // same order everywhere, so no deadlock
    return await fn();
  } finally {
    for (const release of releases.reverse()) release();
  }
}

const isMissingFunction = (error) => error && (error.code === 'PGRST202' || /Could not find the function/i.test(error.message || ''));

async function claimDispatchSlot(cp, channel, { input, output }) {
  const dailyLimit = dailyLimitFor(cp.campaign.daily_limits, channel);

  if (Date.now() >= rpcMissingUntil) {
    const { data, error } = await supabase.rpc('claim_dispatch_slot', {
      p_campaign_id: cp.campaign_id,
      p_prospect_id: cp.prospect_id,
      p_channel: channel,
      p_frequency_cap: FREQUENCY_CAP,
      p_window_seconds: FREQUENCY_WINDOW_DAYS * 86400,
      p_daily_limit: dailyLimit,
      p_input: input,
      p_output: output,
    });
    if (!error) return data;
    if (!isMissingFunction(error)) throw error;
    rpcMissingUntil = Date.now() + RECHECK_RPC_EVERY_MS;
    if (!warned) {
      warned = true;
      console.warn('claim_dispatch_slot() is not installed: dispatch caps are enforced with an in-process lock only. Run db/schema.sql in the Supabase SQL editor to make them transactional.');
    }
  }

  return withLocks([`prospect:${cp.campaign_id}:${cp.prospect_id}`, `day:${cp.campaign_id}:${channel}`], async () => {
    const denial = await checkCaps(cp, channel);
    if (!denial.allowed) return { allowed: false, reason: denial.reason, details: denial.details };
    const activityId = await logActivity(cp, 'dispatch', 'dispatch', input, output, 'success', channel);
    return { allowed: true, activity_id: activityId };
  });
}

module.exports = { claimDispatchSlot, withLocks, _resetForTests: () => { rpcMissingUntil = 0; } };
