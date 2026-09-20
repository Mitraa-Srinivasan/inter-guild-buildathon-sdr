const { HttpError } = require('../lib/http');
const { preSendGate } = require('./gate');
const { checkConflicts } = require('./conflict');
const { loadCampaignProspect } = require('./common');
const { runResearch } = require('./research');
const { runIcp } = require('./icp');
const { runStrategy } = require('./strategy');
const { runPersonalize } = require('./personalize');

// "Qualify & draft outreach" for one campaign prospect: research -> ICP -> strategy -> personalisation, running ONLY the steps
// this prospect does not already have (each step spends DronaHQ credits). It calls the very same run* functions as the individual
// endpoints, so every step that runs logs its own activity exactly as before; a step that is skipped logs nothing.
//
// What counts as "already done" is read straight from the stored row, never guessed:
//   research         context_json.research is present
//   icp              icp_score is set
//   strategy         context_json.strategy is present
//   personalisation  context_json.email_subject and email_body are both present
const present = (v) => v !== undefined && v !== null && v !== '';
const STEPS = ['research', 'icp', 'strategy', 'personalisation'];
const LABEL = { research: 'Research', icp: 'ICP scoring', strategy: 'Strategy', personalisation: 'Personalisation' };
const BEFORE_OUTREACH = ['discovered', 'researched', 'qualified'];

function doneSteps(cp) {
  const ctx = cp.context_json || {};
  return {
    research: present(ctx.research),
    icp: cp.icp_score !== null && cp.icp_score !== undefined,
    strategy: present(ctx.strategy),
    personalisation: present(ctx.email_subject) && present(ctx.email_body),
  };
}

// What this prospect currently has, in the shape the API and the UI use.
function currentState(cp) {
  const ctx = cp.context_json || {};
  const done = doneSteps(cp);
  return {
    funnel_state: cp.funnel_state,
    research: done.research ? ctx.research : null,
    icp: done.icp ? { score: Number(cp.icp_score), outcome: cp.funnel_state, reasoning: cp.icp_reasoning || null } : null,
    strategy: done.strategy ? ctx.strategy : null,
    email: done.personalisation ? { subject: ctx.email_subject, body: ctx.email_body, snippets_used: ctx.email_snippets_used || null } : null,
  };
}

// Pure. What a call would do right now: which steps would run, which are already done, and whether it stops at once.
//   stopped: 'rejected'      the prospect was rejected by ICP: nothing more is ever run
//            'in_outreach'   already contacted / engaged / ...: this flow is for the stage before outreach
//            'not_qualified' scored but not qualified (nothing to draft for)
//            null            steps[] is what will run. A step after ICP is `conditional` when ICP has yet to run: it only
//                            happens if the prospect turns out qualified.
function planSteps(cp) {
  const done = doneSteps(cp);
  const doneList = STEPS.filter((s) => done[s]);
  const stop = (stopped) => ({ funnel_state: cp.funnel_state, steps: [], done: doneList, stopped });
  if (cp.funnel_state === 'rejected') return stop('rejected');
  if (!BEFORE_OUTREACH.includes(cp.funnel_state)) return stop('in_outreach');
  const icpWillRun = !done.icp;
  if (!icpWillRun && cp.funnel_state !== 'qualified') return stop('not_qualified');
  const steps = STEPS.filter((s) => !done[s]).map((s) => ({ step: s, label: LABEL[s], conditional: icpWillRun && (s === 'strategy' || s === 'personalisation') }));
  return { funnel_state: cp.funnel_state, steps, done: doneList, stopped: null };
}

// One run at a time per prospect (a double click, or two people at once, must not pay for the same steps twice).
const inFlight = new Set();

// -> { blocked: true, reason, ... }          pre-send gate says no (kill switch / campaign not live / that agent paused)
//    { denied: true, reason, details, ... }  conflict gate says no (suppressed, approval pending or rejected, active elsewhere)
//    { stopped, ... }                        ran what it could and stopped because of the ICP outcome (or nothing to do)
// Every result also carries { campaign_prospect_id, steps_run, steps_skipped, ...currentState }. A step that throws (agent down,
// unparseable answer) rethrows with err.partial = { failed_step, steps_run, ... } so the caller still knows what was completed.
async function runQualifyAndDraft(campaignProspectId, deps = {}) {
  const runners = { research: deps.runResearch || runResearch, icp: deps.runIcp || runIcp, strategy: deps.runStrategy || runStrategy, personalisation: deps.runPersonalize || runPersonalize };
  const conflicts = deps.checkConflicts || checkConflicts;
  const gate = deps.preSendGate || preSendGate;

  if (inFlight.has(campaignProspectId)) throw new HttpError(409, 'Qualify & draft is already running for this prospect');
  inFlight.add(campaignProspectId);
  try {
    let cp = await loadCampaignProspect(campaignProspectId);
    const done = doneSteps(cp);
    const steps_skipped = STEPS.filter((s) => done[s]);
    const steps_run = [];
    const view = (extra = {}) => ({ campaign_prospect_id: cp.id, steps_run: [...steps_run], steps_skipped, stopped: null, ...currentState(cp), ...extra });

    const plan = planSteps(cp);
    if (plan.stopped === 'in_outreach') {
      throw new HttpError(400, `This prospect is already in outreach (funnel_state '${cp.funnel_state}'); Qualify & draft is for prospects before outreach starts`);
    }
    // Nothing to run (rejected, or everything already exists): return what there is. No agent is called, so no gate is needed.
    if (!plan.steps.length) return view({ stopped: plan.stopped });

    // Campaign-level gate up front, so a blocked campaign costs nothing. (The per-agent pause is checked by each step itself.)
    const reason = await gate(cp.campaign);
    if (reason) return view({ blocked: true, reason });

    // Before every step that would spend credits: the conflict gate, then the step (which applies the pre-send gate again).
    // Re-checked between steps because a step can change the answer: an ICP "Escalate" queues an approval that holds the prospect.
    const attempt = async (step) => {
      const verdict = await conflicts(cp.id);
      if (!verdict.allowed) return view({ denied: true, reason: verdict.reason, details: verdict.details });
      let r;
      try {
        r = await runners[step](cp.id);
      } catch (err) {
        err.partial = { failed_step: step, ...view() };
        throw err;
      }
      if (r.blocked) return view({ blocked: true, reason: r.reason });
      steps_run.push(step);
      cp = await loadCampaignProspect(cp.id);
      return null;
    };

    let stop = null;
    if (!done.research) stop = await attempt('research');
    if (!stop && !done.icp) stop = await attempt('icp');
    if (stop) return stop;

    if (cp.funnel_state === 'rejected') return view({ stopped: 'rejected' });
    if (cp.funnel_state !== 'qualified') return view({ stopped: 'not_qualified' });

    if (!done.strategy) stop = await attempt('strategy');
    if (!stop && !done.personalisation) stop = await attempt('personalisation');
    return stop || view();
  } finally {
    inFlight.delete(campaignProspectId);
  }
}

// Read-only: what a call would run for this prospect right now. Calls no agent.
async function planQualifyAndDraft(campaignProspectId) {
  const cp = await loadCampaignProspect(campaignProspectId);
  return { campaign_prospect_id: cp.id, ...planSteps(cp) };
}

module.exports = { runQualifyAndDraft, planQualifyAndDraft, planSteps, doneSteps, currentState, STEPS, LABEL };
