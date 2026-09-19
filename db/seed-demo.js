// Usage: npm run seed:demo
// Builds the permanent demo pipeline by running real prospects through the real orchestrator (real DronaHQ agents):
// per campaign, one "hero" prospect (the campaign's sample profile) taken all the way to a positive reply and a
// follow-up, plus three more at different depths so the funnel looks like a real pipeline:
//   icp_only    research + ICP only (stops there, whatever the score says)
//   contacted   dispatched, no reply yet
//   escalation  a reply that needs a human, which queues a pending approval
// Nothing is sent anywhere (dispatch and voice are simulated). The prospects are fictional (*.example emails).
//
// It is resumable and safe to re-run: every step that has already happened for a prospect is skipped, so a run that
// stopped halfway just continues. India BFSI CIO is paused in the seed, so it is switched to live for the run and put
// back to whatever it was afterwards. Needs the DronaHQ webhook env vars and takes several minutes (about 40 agent calls).
const app = require('../app');
const { supabase, unwrap } = require('./supabase');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const STARTED = Date.now();
const log = (tag, msg) => console.log(`[${String(Math.round((Date.now() - STARTED) / 1000)).padStart(4)}s] ${tag.padEnd(4)} ${msg}`);

// ---------------------------------------------------------------- the demo cast
const PLAN = [
  {
    tag: 'US', campaign: 'US SaaS CTO',
    hero: {
      email: 'maya.okonkwo@relaywise.example',
      about: 'Relaywise builds workflow automation software for finance operations teams at mid-market companies. It announced a $28M Series B in August and is hiring 8 platform and infrastructure engineers. Its product runs on AWS with a Kubernetes-based microservices stack; leadership says service provisioning and security reviews are slowing releases.',
      reply: "Hi Alex, thanks for reaching out. The timing is interesting: since the Series B, provisioning and security reviews have been slowing our releases. Could you send a couple of times for a 30-minute call next week? I'd like to bring in Dev, our head of platform.",
    },
    others: [
      {
        kind: 'icp_only', expect: 'rejected',
        name: 'Tobias Lindgren', title: 'VP Engineering', company: 'Brightpath Learning', email: 'tobias.lindgren@brightpathlearning.example',
        data: { employee_count: 3400, industry: 'K-12 education technology (curriculum and student-information software for school districts)', location: 'Columbus, OH, United States', funding_stage: 'Private, bootstrapped',
          about: 'Brightpath Learning sells curriculum and student-information software to public school districts across the Midwest. It is privately held, sells through district procurement cycles, and runs a mostly on-premise Windows and .NET stack.' },
      },
      {
        kind: 'contacted',
        name: 'Dana Whitfield', title: 'VP Engineering', company: 'Stackharbor', email: 'dana.whitfield@stackharbor.example',
        data: { employee_count: 180, industry: 'B2B SaaS (observability and incident management)', location: 'Denver, CO, United States', funding_stage: 'Series B',
          about: 'Stackharbor sells incident-management and observability software to platform teams. It closed a $24M Series B in June, is hiring a Director of SRE and three staff engineers, and is migrating its ingestion pipeline from a monolith to services on GCP. Engineering leadership has talked publicly about on-call fatigue and slow environment setup.' },
      },
      {
        kind: 'escalation',
        name: 'Elliot Brandt', title: 'CTO', company: 'Loomstack', email: 'elliot.brandt@loomstack.example',
        data: { employee_count: 95, industry: 'B2B SaaS (workforce planning for HR and finance teams)', location: 'Seattle, WA, United States', funding_stage: 'Series A',
          about: 'Loomstack builds workforce-planning software for mid-size employers. It raised a $12M Series A in March and has 95 employees. It sells to HR and finance leaders in regulated industries, so security questionnaires and customer audits show up in almost every deal. Stack: TypeScript and Postgres on AWS.' },
        reply: "Thanks for the note, Alex. Two things before I'd spend time on this: we're under contract with another platform vendor through next December, and every new vendor here goes through a security review and a DPA with our counsel first. I'm not the right person to negotiate that. Could someone senior from your side speak with our CISO, Marta Ionescu, and send over your SOC 2 report and data-residency details?",
      },
    ],
  },
  {
    tag: 'IN', campaign: 'India BFSI CIO',
    hero: {
      email: 'priya.menon@bharatmutual.example',
      about: 'Bharat Mutual Insurance is a Mumbai-headquartered life and general insurer with about 4,200 employees. It has announced a multi-year core-systems modernisation, moving policy administration off a legacy mainframe, and is hiring cloud and integration architects. Regulatory pressure from IRDAI on digital claims turnaround is a stated priority.',
      reply: 'Hello, and thank you for the note. We are in the middle of a core-systems modernisation and I would be open to a short call. Please share two or three slots on Thursday or Friday next week, along with a brief overview I can forward to my architecture team.',
    },
    others: [
      {
        kind: 'icp_only', expect: 'qualified',
        name: 'Arvind Krishnamurthy', title: 'Chief Digital Officer', company: 'Madhuvan Cooperative Bank', email: 'arvind.krishnamurthy@madhuvanbank.example',
        data: { employee_count: 2800, industry: 'Banking (scheduled cooperative bank)', location: 'Pune, India', funding_stage: 'Not applicable (cooperative)',
          about: 'Madhuvan Cooperative Bank runs about 190 branches across Maharashtra and Karnataka with roughly 2,800 employees. It is part-way through moving its core banking system to a cloud-hosted platform and launching a mobile-first retail app, and has named API integration and month-end uptime as its main delivery risks.' },
      },
      {
        kind: 'contacted',
        name: 'Neha Bhatt', title: 'Head of Digital', company: 'Tarang Finserv', email: 'neha.bhatt@tarangfinserv.example',
        data: { employee_count: 1600, industry: 'Financial services (NBFC focused on small-business and two-wheeler loans)', location: 'Bengaluru, India', funding_stage: 'Private, growth-stage',
          about: 'Tarang Finserv is an NBFC focused on small-business and two-wheeler loans, with about 1,600 employees. It has been moving underwriting and collections to a digital-first flow and has said it plans to double loan-origination volume next year, which is straining its integration layer.' },
      },
      {
        kind: 'escalation',
        name: 'Suresh Venkataraman', title: 'CTO', company: 'Aureole General Insurance', email: 'suresh.venkataraman@aureolegeneral.example',
        data: { employee_count: 6000, industry: 'Insurance (general insurance)', location: 'Chennai, India', funding_stage: 'Private',
          about: 'Aureole General Insurance is a Chennai-based general insurer with about 6,000 employees and a large network of agents. It is consolidating three legacy claims platforms and preparing for tougher IRDAI data-localisation and cyber-resilience audits.' },
        reply: "Thank you for reaching out. This is relevant to what we are planning, but I can't take it forward alone. Any new vendor needs approval from our IT steering committee, and given IRDAI's data-localisation rules our compliance head, Mr. Rao, will want to see where data is hosted and how audit logs are retained. Please send your commercial terms and a compliance note to our procurement desk, and I'll ask Mr. Rao to join a call once that has been reviewed.",
      },
    ],
  },
  {
    tag: 'VOI', campaign: 'Voice AI Founders',
    hero: {
      email: 'vera.lindqvist@echolabs.example',
      about: 'Echo Labs builds low-latency speech models and real-time voice agents for customer-support teams. It raised a $4.5M seed round in the spring, has 12 people in London, and is hiring two audio ML engineers. Its founders have said publicly that end-to-end latency and interruption handling are their hardest problems as call volumes grow.',
      reply: "Hey, this landed at a good moment: we're scaling our real-time agents and latency is our biggest headache right now. Happy to jump on a quick call this week if you can do Thursday.",
    },
    others: [
      {
        kind: 'icp_only', expect: 'rejected',
        name: 'Grant Holloway', title: 'CEO', company: 'Holloway Freight Lines', email: 'grant.holloway@hollowayfreight.example',
        data: { employee_count: 650, industry: 'Freight and trucking', location: 'Dallas, TX, United States', funding_stage: 'Private, family-owned',
          about: 'Holloway Freight Lines is a family-owned regional trucking company with about 650 employees and 400 tractors. It runs dispatch through a traditional transport-management system and has no software or AI product.' },
      },
      {
        kind: 'contacted',
        name: 'Sofia Alvarez-Reid', title: 'Co-founder & CEO', company: 'Tessellate Speech', email: 'sofia.alvarezreid@tessellatespeech.example',
        data: { employee_count: 18, industry: 'Speech analytics (conversational AI)', location: 'Toronto, Canada', funding_stage: 'Seed',
          about: 'Tessellate Speech builds speech analytics that turns sales and support calls into coaching insights. It closed a $5M seed round in May and has 18 employees. It is adding real-time transcription, and the founders have talked about needing lower latency and better speaker separation on noisy calls.' },
      },
      {
        kind: 'escalation',
        name: 'Kaveh Rahimi', title: 'Co-founder', company: 'Parleyworks', email: 'kaveh.rahimi@parleyworks.example',
        data: { employee_count: 30, industry: 'Conversational AI (voice agents for healthcare patient intake)', location: 'Bengaluru, India', funding_stage: 'Seed',
          about: 'Parleyworks builds voice agents that handle patient intake and appointment scheduling for clinics. It raised a $6M seed round and has about 30 employees. Because it handles patient data, every customer asks about HIPAA compliance and how call recordings are stored.' },
        reply: "Interesting timing. Before anything else: we handle patient data, so anything touching our call audio needs a signed BAA and a clear answer on where recordings are stored. Also, honestly, I'd rather speak with a person than keep going back and forth with an assistant. Can someone on your team get in touch directly and cover pricing and compliance?",
      },
    ],
  },
];

// ---------------------------------------------------------------- plumbing
let base;
async function post(path, body, label) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    const json = await res.json().catch(() => null);
    if (res.ok) return json;
    // The DronaHQ guardrail refuses at random and agents occasionally answer off-format; both usually pass on a retry.
    const transient = res.status === 502 || (res.status === 500 && /could not be parsed/.test((json && json.error) || ''));
    if (!transient || attempt >= 4) throw new Error(`${label}: HTTP ${res.status} ${JSON.stringify(json)}`);
    log('', `${label}: HTTP ${res.status} ${(json.error || '').slice(0, 90)} -> retrying (${attempt}/3)`);
    await sleep(4000);
  }
}
const loadCp = async (id) => unwrap(await supabase.from('campaign_prospects').select('*, prospect:prospects(*)').eq('id', id).single());
const hasDispatch = async (cp) =>
  (unwrap(await supabase.from('activities').select('id').eq('campaign_id', cp.campaign_id).eq('prospect_id', cp.prospect_id).eq('action_type', 'dispatch').eq('status', 'success').limit(1))).length > 0;

// The channel the strategy agent picked, if it is one of the campaign's enabled channels; email otherwise.
function pickChannel(cp, campaign) {
  const enabled = Object.entries(campaign.channel_config || {}).filter(([, v]) => v && v.enabled === true).map(([k]) => k);
  const text = String(((cp.context_json || {}).strategy || {}).next_channel || '').toLowerCase();
  return enabled.find((ch) => text.includes(ch)) || 'email';
}

async function ensureProspect(campaign, spec, extra = {}) {
  let p = unwrap(await supabase.from('prospects').select('*').eq('email', spec.email).maybeSingle());
  if (!p) {
    p = unwrap(await supabase.from('prospects').insert({
      name: spec.name, title: spec.title, company: spec.company, email: spec.email, source: 'demo-seed',
      company_data_json: spec.data,
    }).select().single());
  }
  let cp = unwrap(await supabase.from('campaign_prospects').select('id').eq('campaign_id', campaign.id).eq('prospect_id', p.id).maybeSingle());
  if (!cp) cp = unwrap(await supabase.from('campaign_prospects').insert({ campaign_id: campaign.id, prospect_id: p.id, ...extra }).select('id').single());
  return { prospect: p, cpId: cp.id };
}

// One prospect through as much of the pipeline as its `kind` calls for. Returns a one-line outcome.
async function runProspect(tag, campaign, spec, kind) {
  const { cpId } = await ensureProspect(campaign, spec);
  const who = `${spec.name} (${kind})`;
  const step = async (path, body, label) => { const t0 = Date.now(); const r = await post(`/campaign-prospects/${cpId}/${path}`, body, `${who} ${label}`); log(tag, `${who}: ${label} ok (${Math.round((Date.now() - t0) / 1000)}s)`); return r; };

  let cp = await loadCp(cpId);
  if (!(cp.context_json || {}).research) { await step('run-research', undefined, 'research'); cp = await loadCp(cpId); }
  if (cp.icp_score === null) { await step('run-icp', undefined, 'icp'); cp = await loadCp(cpId); }
  log(tag, `${who}: ICP score ${cp.icp_score} -> ${cp.funnel_state}`);
  if (spec.expect && cp.funnel_state !== spec.expect) log(tag, `${who}: NOTE expected '${spec.expect}' but the agent decided '${cp.funnel_state}'`);
  if (kind === 'icp_only') return `${cp.funnel_state} (${cp.icp_score})`;

  if (cp.funnel_state === 'rejected') return `unexpectedly rejected (${cp.icp_score}); stopped`;
  const pending = unwrap(await supabase.from('approvals').select('id').eq('campaign_id', campaign.id).eq('prospect_id', cp.prospect_id).eq('status', 'pending').contains('proposed_action_json', { type: 'icp_escalation' }));
  if (pending.length) return `held: ICP escalated to a human (score ${cp.icp_score}); stopped`;

  if (!(cp.context_json || {}).strategy) { await step('run-strategy', undefined, 'strategy'); cp = await loadCp(cpId); }
  if (!(cp.context_json || {}).email_subject) { await step('run-personalize', undefined, 'personalize'); cp = await loadCp(cpId); }
  if (!(await hasDispatch(cp))) {
    const channel = pickChannel(cp, campaign);
    await step('dispatch', { channel }, `dispatch on ${channel}`);
    cp = await loadCp(cpId);
  }
  if (kind === 'contacted') return `${cp.funnel_state}, no reply yet`;

  if (!(cp.context_json || {}).last_conversation) { await step('run-conversation', { reply_text: spec.reply }, 'conversation'); cp = await loadCp(cpId); }
  const lc = (cp.context_json || {}).last_conversation || {};
  log(tag, `${who}: reply classified "${lc.intent}", next action "${lc.next_action}"`);

  if (kind === 'hero') {
    if (!(cp.context_json || {}).next_followup) { await step('run-followup', undefined, 'follow-up'); cp = await loadCp(cpId); }
    return `${cp.funnel_state}; reply "${lc.intent}"; follow-up planned`;
  }

  // kind === 'escalation': the reply needs a human, so queue a pending approval for it.
  const existing = unwrap(await supabase.from('approvals').select('id').eq('campaign_id', campaign.id).eq('prospect_id', cp.prospect_id).contains('proposed_action_json', { type: 'reply_escalation' }));
  if (!existing.length) {
    const act = unwrap(await supabase.from('activities').select('id').eq('campaign_id', campaign.id).eq('prospect_id', cp.prospect_id).eq('agent_type', 'conversation').eq('status', 'success').order('created_at', { ascending: false }).limit(1))[0];
    unwrap(await supabase.from('approvals').insert({
      campaign_id: campaign.id, prospect_id: cp.prospect_id, activity_id: act ? act.id : null, status: 'pending',
      proposed_action_json: { type: 'reply_escalation', intent: lc.intent, next_action: lc.next_action, reasoning: lc.reasoning, reply_text: spec.reply },
    }));
    log(tag, `${who}: queued a pending approval (reply_escalation)`);
  }
  return `${cp.funnel_state}; reply "${lc.intent}"; pending approval`;
}

async function runCampaign(entry, campaign) {
  const results = [];
  const attempt = async (spec, kind) => {
    try { results.push([spec.name, kind, await runProspect(entry.tag, campaign, spec, kind)]); }
    catch (err) { log(entry.tag, `${spec.name} (${kind}) FAILED: ${err.message}`); results.push([spec.name, kind, `FAILED: ${err.message}`]); }
  };
  const sp = (campaign.sample_profiles || [])[0];
  if (!sp) throw new Error(`${campaign.name} has no sample profile to use as the hero`);
  await attempt({
    name: sp.name, title: sp.title, company: sp.company, email: entry.hero.email, reply: entry.hero.reply,
    data: { employee_count: sp.company_size, industry: sp.industry, location: sp.location, funding_stage: sp.funding_stage, about: entry.hero.about },
  }, 'hero');
  for (const o of entry.others) await attempt(o, o.kind);
  return results;
}

// A failed attempt that was later retried successfully is noise in the log: drop those, keep everything else.
async function dropSupersededFailures(prospectIds) {
  let dropped = 0;
  for (const pid of prospectIds) {
    const acts = unwrap(await supabase.from('activities').select('id, agent_type, action_type, status, created_at').eq('prospect_id', pid));
    for (const f of acts.filter((a) => a.status === 'failed' && a.agent_type !== 'dispatch')) {
      if (acts.some((a) => a.status === 'success' && a.agent_type === f.agent_type && a.action_type === f.action_type && a.created_at > f.created_at)) {
        unwrap(await supabase.from('activities').delete().eq('id', f.id));
        dropped++;
      }
    }
  }
  return dropped;
}

async function main() {
  const settings = unwrap(await supabase.from('global_settings').select('kill_switch_on').eq('id', true).single());
  if (settings.kill_switch_on) throw new Error('The kill switch is on. Turn it off before seeding the demo.');

  const campaigns = unwrap(await supabase.from('campaigns').select('*').in('name', PLAN.map((p) => p.campaign)));
  for (const p of PLAN) if (!campaigns.some((c) => c.name === p.campaign)) throw new Error(`Campaign "${p.campaign}" not found; run npm run seed first`);

  const server = app.listen(0);
  base = `http://localhost:${server.address().port}`;
  // Campaigns must be live for the orchestrator to run. Remember what each was so it can be put back.
  const original = new Map(campaigns.map((c) => [c.id, c.status]));
  const summary = [];
  try {
    for (const c of campaigns) {
      if (c.status !== 'live') {
        unwrap(await supabase.from('campaigns').update({ status: 'live' }).eq('id', c.id));
        log('', `${c.name}: ${c.status} -> live for the run`);
      }
    }
    const perCampaign = await Promise.all(PLAN.map((entry) => runCampaign(entry, campaigns.find((c) => c.name === entry.campaign))));
    PLAN.forEach((entry, i) => summary.push([entry.campaign, perCampaign[i]]));
  } finally {
    for (const c of campaigns) {
      if (original.get(c.id) !== 'live') {
        unwrap(await supabase.from('campaigns').update({ status: original.get(c.id) }).eq('id', c.id));
        log('', `${c.name}: restored to '${original.get(c.id)}'`);
      }
    }
    server.close();
  }

  const ids = unwrap(await supabase.from('prospects').select('id').eq('source', 'demo-seed')).map((p) => p.id);
  const dropped = await dropSupersededFailures(ids);
  if (dropped) log('', `removed ${dropped} failed attempt(s) that a retry later succeeded`);

  console.log('\n===== Demo pipeline');
  for (const [name, rows] of summary) {
    console.log(name);
    for (const [who, kind, outcome] of rows) console.log(`  ${kind.padEnd(10)} ${who.padEnd(22)} ${outcome}`);
  }
  if (summary.some(([, rows]) => rows.some((r) => /^FAILED/.test(r[2])))) process.exitCode = 1;
}

main().catch((err) => { console.error(err); process.exit(1); });
