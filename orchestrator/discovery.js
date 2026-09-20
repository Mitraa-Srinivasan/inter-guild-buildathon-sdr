const { supabase, unwrap } = require('../db/supabase');
const { HttpError, notFound } = require('../lib/http');
const { formatIcpCriteria } = require('./icpFormat');
const { discoveryConfig, tavilySearch, groqJson } = require('../agents/discovery');

// Prospect discovery: turn a campaign's ICP into web searches (Tavily), have an LLM (Groq) pull out the people the results
// actually name, and add them as 'discovered' prospects. It only READS the web and WRITES prospects: nothing is contacted,
// no DronaHQ agent is called. Qualifying them (research, ICP scoring) is a separate, human-triggered step.

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 10;
const MAX_QUERIES = 3;
const RESULTS_PER_QUERY = 8;
const SNIPPET_CHARS = 1000;

// Estimated cost in USD (list prices, not measured): Groq gpt-oss-120b at about $0.15 / $0.60 per million input / output tokens,
// Tavily basic search at $0.008 per search credit.
const GROQ_IN_PER_TOKEN = 0.15 / 1e6;
const GROQ_OUT_PER_TOKEN = 0.60 / 1e6;
const TAVILY_PER_SEARCH = 0.008;

const arr = (v) => (Array.isArray(v) ? v : v === undefined || v === null || v === '' ? [] : [v]);
const str = (v) => (typeof v === 'string' ? v.trim() : '');

// How a role reads in a news headline: "CTO" -> "Chief Technology Officer", "VP Engineering" -> "VP of Engineering".
const spell = (role) => {
  const r = role.trim();
  const full = { CTO: 'Chief Technology Officer', CIO: 'Chief Information Officer', CISO: 'Chief Information Security Officer', CPO: 'Chief Product Officer', CDO: 'Chief Digital Officer' }[r.toUpperCase()];
  return full || r.replace(/^(VP|Head|Director) (?!of\b)/i, (m, t) => `${t} of `);
};

// Up to three searches from the campaign's ICP, each { query, topic, time_range }. They aim at moments when a company is
// visibly growing and its leaders are named in print: an appointment or hire, and a funding round that comes with one. All use
// Tavily's news topic with a one-year window, the only mode that returns a publication date on every result, so the model can
// see how old each source is and stale ones are ruled out.
function buildSearches(campaign) {
  const icp = campaign.icp_json || {};
  const cc = icp.company_criteria || {};
  const roles = arr(icp.roles).map(str).filter(Boolean);
  const industries = arr(cc.industries || icp.industries).map(str).filter(Boolean);
  const geo = arr(icp.geo).map(str).filter(Boolean)[0] || ''; // one region keeps the query short; the model checks the rest of the ICP
  const industry = industries[0] || '';

  const searches = [];
  if (roles.length || industries.length) {
    const role0 = spell(roles[0] || ''), role1 = spell(roles[1] || roles[0] || '');
    // Short, natural announcement phrasing on purpose. Tried live against Tavily: one long chain of OR terms starves the search
    // (1 result) and funding-round headlines name founders rather than the engineering leader, whereas "appoints <role> <industry>"
    // returns dated announcements that name the person and the company.
    // 1. An announced appointment for the first target role.
    searches.push({ query: ['appoints', role0, industry, 'company', geo], topic: 'news', time_range: 'year' });
    // 2. The same for the second role (or a "hires" phrasing of the first when there is only one), a different slice of the news.
    searches.push({ query: [roles[1] ? 'appoints' : 'hires', role1, industry, 'company', geo], topic: 'news', time_range: 'year' });
    // 3. Leadership-moves roundups: one article lists many appointments (3 of the 5 prospects in the first live run came from
    // these). A funding-flavoured version ("raises Series B and appoints new CTO") was tried and returned nothing usable.
    searches.push({ query: ['leadership moves executive appointments new', roles[0], roles[1] ? spell(roles[1]) : '', industry], topic: 'news', time_range: 'year' });
  } else {
    searches.push({ query: [campaign.name, campaign.description], topic: 'general', time_range: 'year' });
  }
  const seen = new Set();
  return searches
    .map((s) => ({ ...s, query: s.query.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim() }))
    .filter((s) => s.query && !seen.has(s.query) && seen.add(s.query))
    .slice(0, MAX_QUERIES);
}

// The query text of each search (kept for callers and tests that only care about the words).
const buildQueries = (campaign) => buildSearches(campaign).map((s) => s.query);
const describeSearch = (s) => `${s.query} [${s.topic}${s.time_range ? `, past ${s.time_range}` : ''}]`;

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
- In fit_reason, and in company_data, state only what the results say. If company size or funding stage is not stated, say "size not stated" or "funding not stated" (and use null in company_data); never guess or write "likely".
- Each result shows when it was published, when known. Prefer people named in recent sources (the last 12 months). Skip anyone whose only mention is more than 2 years old, or whose role the source describes as past or ended. If the date is unknown, include the person only if the text presents the role as current.
Answer with a JSON object: {"prospects":[{"name":string,"title":string,"company":string,"linkedin_url":string|null,"email":string|null,"company_data":{"employee_count":number|null,"industry":string|null,"location":string|null,"funding_stage":string|null,"about":string},"source_url":string,"fit_reason":string}]}
If the results name nobody suitable, answer {"prospects":[]}.`;

function buildUserPrompt(campaign, results, limit, today = new Date()) {
  const lines = [`Today's date: ${today.toISOString().slice(0, 10)}`, `Campaign: ${campaign.name}`, '', 'Ideal customer profile:', formatIcpCriteria(campaign.icp_json), '', `Return at most ${limit} prospects.`, '', 'Search results:'];
  results.forEach((r, i) => lines.push(`[${i + 1}] ${r.title}`, `URL: ${r.url}`, `Published: ${r.published || 'unknown'}`, r.content.slice(0, SNIPPET_CHARS), ''));
  return lines.join('\n');
}

// Dated results first, newest first, then undated ones (their order is kept).
function byRecency(results) {
  return results.map((r, i) => ({ r, i })).sort((a, b) => (b.r.published || '').localeCompare(a.r.published || '') || a.i - b.i).map((x) => x.r);
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
  const plan = buildSearches(campaign);
  const queries = plan.map((s) => s.query);
  const inputSummary = `Discovery for "${campaign.name}" (up to ${want} prospects). Searches:\n${plan.map((s) => `- ${describeSearch(s)}`).join('\n')}`;

  let results = [];
  let usage = { prompt: 0, completion: 0, total: 0 };
  let model = null;
  let searches = 0;
  let candidates = [];
  try {
    const seen = new Set();
    for (const s of plan) {
      searches += 1;
      for (const r of await tavilySearch(s.query, { maxResults: RESULTS_PER_QUERY, topic: s.topic, timeRange: s.time_range })) {
        if (r.url && !seen.has(r.url)) { seen.add(r.url); results.push(r); }
      }
    }
    results = byRecency(results);
    if (!results.length) {
      const cost = searches * TAVILY_PER_SEARCH;
      await logDiscoveryActivity(campaignId, { input: inputSummary, output: 'The searches returned no results.', status: 'success', model: null, tokens: 0, cost });
      return { campaign, queries, found: 0, created: [], skipped: [], usage: { ...usage, searches, estimated_cost: cost } };
    }
    const ai = await groqJson({ system: SYSTEM_PROMPT, user: buildUserPrompt(campaign, results, want) });
    usage = ai.usage; model = ai.model;
    candidates = arr(ai.data && ai.data.prospects).map(cleanCandidate).filter(Boolean);
    // The source's real publication date comes from Tavily (matched by URL), never from what the model says.
    const dateByUrl = new Map(results.map((r) => [r.url, r.published]));
    for (const c of candidates) { const d = c.source_url && dateByUrl.get(c.source_url); if (d) c.source_date = d; }
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
        company_data_json: { ...c.company_data, ...(c.source_url ? { source_url: c.source_url } : {}), ...(c.source_date ? { source_date: c.source_date } : {}), ...(c.fit_reason ? { fit_reason: c.fit_reason } : {}) },
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

module.exports = { runDiscovery, buildQueries, buildSearches, buildUserPrompt, byRecency, SYSTEM_PROMPT, cleanCandidate, DEFAULT_LIMIT, MAX_LIMIT };
