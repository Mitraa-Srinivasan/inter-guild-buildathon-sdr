const { supabase, unwrap } = require('../db/supabase');
const { HttpError, notFound } = require('../lib/http');
const { formatIcpCriteria } = require('./icp');
const { discoveryConfig, tavilySearch, groqJson } = require('../agents/discovery');

// Prospect discovery: turn a campaign's ICP into web searches (Tavily), have an LLM (Groq) pull out the people the results
// actually name, and add them as 'discovered' prospects. It only READS the web and WRITES prospects: nothing is contacted,
// no DronaHQ agent is called. Qualifying them (research, ICP scoring) is a separate, human-triggered step.

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 10;
const MAX_QUERIES = 3;
const RESULTS_PER_QUERY = 6;
const SNIPPET_CHARS = 1000;

// Estimated cost in USD (list prices, not measured): Groq llama-3.3-70b at $0.59 / $0.79 per million input / output tokens,
// Tavily basic search at $0.008 per search credit.
const GROQ_IN_PER_TOKEN = 0.59 / 1e6;
const GROQ_OUT_PER_TOKEN = 0.79 / 1e6;
const TAVILY_PER_SEARCH = 0.008;

const arr = (v) => (Array.isArray(v) ? v : v === undefined || v === null || v === '' ? [] : [v]);
const str = (v) => (typeof v === 'string' ? v.trim() : '');

// Up to three search queries from the campaign's ICP (roles, industries, geography, size, funding stage).
function buildQueries(campaign) {
  const icp = campaign.icp_json || {};
  const cc = icp.company_criteria || {};
  const roles = arr(icp.roles).map(str).filter(Boolean);
  const industries = arr(cc.industries || icp.industries).map(str).filter(Boolean);
  const geo = arr(icp.geo).map(str).filter(Boolean).slice(0, 2).join(' or ');
  const stage = arr(cc.funding_stage).map(str).filter(Boolean).join(' ');
  const ec = cc.employee_count;
  const size = ec && typeof ec === 'object' ? [ec.min, ec.max].filter((x) => x !== undefined && x !== null).join('-') + ' employees' : '';

  const queries = [];
  if (roles.length || industries.length) {
    queries.push([roles[0], 'at', industries[0], 'company', geo, 'linkedin'].filter(Boolean).join(' '));
    queries.push([industries.slice(0, 2).join(' '), 'companies', geo, size, 'leadership team', roles.slice(0, 2).join(' ')].filter(Boolean).join(' '));
    if (stage || roles.length) queries.push([industries[0], geo, stage, 'raised funding hiring', roles[0]].filter(Boolean).join(' '));
  } else {
    queries.push([campaign.name, campaign.description].filter(Boolean).join(' '));
  }
  return [...new Set(queries.map((q) => q.replace(/\s+/g, ' ').trim()).filter(Boolean))].slice(0, MAX_QUERIES);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isHttp = (u) => /^https?:\/\//i.test(u);

// One extracted candidate, cleaned. Returns null if it isn't usable. Emails and LinkedIn URLs are kept only if they look
// real, and are never guessed.
function cleanCandidate(c) {
  if (!c || typeof c !== 'object') return null;
  const name = str(c.name), company = str(c.company);
  if (name.length < 2 || !company) return null;
  const email = str(c.email).toLowerCase();
  const li = str(c.linkedin_url);
  const cd = c.company_data && typeof c.company_data === 'object' ? c.company_data : {};
  const emp = Number(cd.employee_count);
  return {
    name, company,
    title: str(c.title) || null,
    email: EMAIL_RE.test(email) ? email : null,
    linkedin_url: isHttp(li) && /linkedin\.com\//i.test(li) ? li : null,
    company_data: {
      ...(Number.isFinite(emp) && emp > 0 ? { employee_count: emp } : {}),
      ...(str(cd.industry) ? { industry: str(cd.industry) } : {}),
      ...(str(cd.location) ? { location: str(cd.location) } : {}),
      ...(str(cd.funding_stage) ? { funding_stage: str(cd.funding_stage) } : {}),
      ...(str(cd.about) ? { about: str(cd.about).slice(0, 600) } : {}),
    },
    source_url: isHttp(str(c.source_url)) ? str(c.source_url) : null,
    fit_reason: str(c.fit_reason).slice(0, 300) || null,
  };
}

const SYSTEM_PROMPT = `You extract sales prospects from web search results for an outbound campaign.
Rules:
- Use ONLY facts that appear in the search results. Never invent a person, a job title, a company, an email address or a LinkedIn URL.
- Include a person only if the results name them AND say what their role is at a specific company that plausibly matches the ideal customer profile.
- Set email and linkedin_url to null unless the results explicitly contain them.
- Prefer decision makers whose title matches the target roles.
Answer with a JSON object: {"prospects":[{"name":string,"title":string,"company":string,"linkedin_url":string|null,"email":string|null,"company_data":{"employee_count":number|null,"industry":string|null,"location":string|null,"funding_stage":string|null,"about":string},"source_url":string,"fit_reason":string}]}
If the results name nobody suitable, answer {"prospects":[]}.`;

function buildUserPrompt(campaign, results, limit) {
  const lines = [`Campaign: ${campaign.name}`, '', 'Ideal customer profile:', formatIcpCriteria(campaign.icp_json), '', `Return at most ${limit} prospects.`, '', 'Search results:'];
  results.forEach((r, i) => lines.push(`[${i + 1}] ${r.title}`, `URL: ${r.url}`, r.content.slice(0, SNIPPET_CHARS), ''));
  return lines.join('\n');
}

const escapeLike = (s) => s.replace(/[\\%_]/g, (m) => '\\' + m);

// An existing prospect the candidate would duplicate: same email, same LinkedIn URL, or same name at the same company.
async function findExisting(c) {
  if (c.email) {
    const hit = unwrap(await supabase.from('prospects').select('*').eq('email', c.email).limit(1));
    if (hit.length) return hit[0];
  }
  if (c.linkedin_url) {
    const hit = unwrap(await supabase.from('prospects').select('*').eq('linkedin_url', c.linkedin_url).limit(1));
    if (hit.length) return hit[0];
  }
  const same = unwrap(await supabase.from('prospects').select('*').ilike('name', escapeLike(c.name)).limit(20));
  return same.find((p) => str(p.company).toLowerCase() === c.company.toLowerCase()) || null;
}

async function logDiscoveryActivity(campaignId, { input, output, status, model, tokens, cost }) {
  try {
    unwrap(await supabase.from('activities').insert({
      campaign_id: campaignId, prospect_id: null, agent_type: 'discovery', action_type: 'discover', channel: null,
      model, input_summary: input, output_summary: output, tokens, cost, status,
    }));
  } catch (err) {
    console.error('Failed to record the discovery activity:', err);
  }
}

// -> { blocked: true, reason }   kill switch on (423)
//    { campaign, queries, found, created: [{ campaign_prospect, prospect, reused_prospect }], skipped: [{ name, company, reason }], usage }
// Throws HttpError: 404 no such campaign, 503 not configured, 502 search / LLM failure.
async function runDiscovery(campaignId, { limit } = {}) {
  const campaign = unwrap(await supabase.from('campaigns').select('*').eq('id', campaignId).maybeSingle());
  if (!campaign) throw notFound('Campaign');

  const cfg = discoveryConfig();
  if (!cfg.configured) throw new HttpError(503, `Prospect discovery is not configured: set ${cfg.missing.join(' and ')} in .env`);

  const settings = unwrap(await supabase.from('global_settings').select('kill_switch_on').eq('id', true).maybeSingle());
  if (settings && settings.kill_switch_on) return { blocked: true, reason: 'kill_switch_on' };

  const want = Math.min(Math.max(parseInt(limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const queries = buildQueries(campaign);
  const inputSummary = `Discovery for "${campaign.name}" (up to ${want} prospects). Searches:\n${queries.map((q) => `- ${q}`).join('\n')}`;

  let results = [];
  let usage = { prompt: 0, completion: 0, total: 0 };
  let model = null;
  let searches = 0;
  let candidates = [];
  try {
    const seen = new Set();
    for (const q of queries) {
      searches += 1;
      for (const r of await tavilySearch(q, { maxResults: RESULTS_PER_QUERY })) {
        if (r.url && !seen.has(r.url)) { seen.add(r.url); results.push(r); }
      }
    }
    if (!results.length) {
      const cost = searches * TAVILY_PER_SEARCH;
      await logDiscoveryActivity(campaignId, { input: inputSummary, output: 'The searches returned no results.', status: 'success', model: null, tokens: 0, cost });
      return { campaign, queries, found: 0, created: [], skipped: [], usage: { ...usage, searches, estimated_cost: cost } };
    }
    const ai = await groqJson({ system: SYSTEM_PROMPT, user: buildUserPrompt(campaign, results, want) });
    usage = ai.usage; model = ai.model;
    candidates = arr(ai.data && ai.data.prospects).map(cleanCandidate).filter(Boolean);
  } catch (err) {
    const cost = searches * TAVILY_PER_SEARCH + usage.prompt * GROQ_IN_PER_TOKEN + usage.completion * GROQ_OUT_PER_TOKEN;
    await logDiscoveryActivity(campaignId, { input: inputSummary, output: err.message, status: 'failed', model, tokens: usage.total, cost });
    throw err;
  }
  const estimatedCost = Number((searches * TAVILY_PER_SEARCH + usage.prompt * GROQ_IN_PER_TOKEN + usage.completion * GROQ_OUT_PER_TOKEN).toFixed(6));

  const created = [];
  const skipped = [];
  const inRun = new Set();
  for (const c of candidates) {
    if (created.length >= want) break;
    const key = `${c.name.toLowerCase()}|${c.company.toLowerCase()}`;
    if (inRun.has(key)) { skipped.push({ name: c.name, company: c.company, reason: 'duplicate in this batch' }); continue; }
    inRun.add(key);

    let prospect = await findExisting(c);
    const reused = Boolean(prospect);
    if (prospect) {
      const linked = unwrap(await supabase.from('campaign_prospects').select('id').eq('campaign_id', campaignId).eq('prospect_id', prospect.id).limit(1));
      if (linked.length) { skipped.push({ name: c.name, company: c.company, reason: 'already in this campaign' }); continue; }
    } else {
      prospect = unwrap(await supabase.from('prospects').insert({
        name: c.name, title: c.title, company: c.company, email: c.email, linkedin_url: c.linkedin_url, source: 'discovery',
        company_data_json: { ...c.company_data, ...(c.source_url ? { source_url: c.source_url } : {}), ...(c.fit_reason ? { fit_reason: c.fit_reason } : {}) },
      }).select().single());
    }
    const cp = unwrap(await supabase.from('campaign_prospects').insert({ campaign_id: campaignId, prospect_id: prospect.id, funnel_state: 'discovered' }).select().single());
    created.push({ campaign_prospect: cp, prospect, reused_prospect: reused });
  }

  const output = [
    `Searched ${searches} queries, read ${results.length} results, the model named ${candidates.length} candidate(s).`,
    `Added ${created.length} prospect(s): ${created.map((x) => `${x.prospect.name} (${x.prospect.company})`).join('; ') || 'none'}.`,
    skipped.length ? `Skipped ${skipped.length}: ${skipped.map((s) => `${s.name} (${s.reason})`).join('; ')}.` : '',
  ].filter(Boolean).join('\n');
  await logDiscoveryActivity(campaignId, { input: inputSummary, output, status: 'success', model, tokens: usage.total, cost: estimatedCost });

  return { campaign, queries, found: candidates.length, created, skipped, usage: { ...usage, searches, estimated_cost: estimatedCost } };
}

module.exports = { runDiscovery, buildQueries, cleanCandidate, DEFAULT_LIMIT, MAX_LIMIT };
