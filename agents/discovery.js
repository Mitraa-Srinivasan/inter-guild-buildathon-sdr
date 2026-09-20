const { HttpError } = require('../lib/http');

// Clients for the two services prospect discovery uses. Neither is a DronaHQ agent, so calling them spends no DronaHQ credits.
//   Tavily  web search      https://docs.tavily.com
//   Groq    LLM reasoning   OpenAI-compatible chat completions API
const TIMEOUT_MS = 30000;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const TAVILY_URL = 'https://api.tavily.com/search';
const DEFAULT_GROQ_MODEL = 'openai/gpt-oss-120b';

const groqModel = () => process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL;

// Which keys are set. Discovery refuses to start (503) unless both are.
function discoveryConfig() {
  const missing = ['GROQ_API_KEY', 'TAVILY_API_KEY'].filter((k) => !process.env[k]);
  return { configured: missing.length === 0, missing, groq: Boolean(process.env.GROQ_API_KEY), tavily: Boolean(process.env.TAVILY_API_KEY) };
}

async function postJson(url, headers, body, label) {
  let res;
  try {
    res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body), signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (err) {
    throw new HttpError(502, err.name === 'TimeoutError' ? `${label} timed out after ${TIMEOUT_MS / 1000}s` : `${label} request failed: ${err.message}`);
  }
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* handled below */ }
  if (!res.ok) {
    const detail = (json && ((json.error && (json.error.message || json.error)) || json.detail || json.message)) || text.slice(0, 200);
    throw new HttpError(502, `${label} returned HTTP ${res.status}: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
  }
  if (!json) throw new HttpError(502, `${label} returned a non-JSON response`);
  return json;
}

// -> [{ title, url, content }]
async function tavilySearch(query, { maxResults = 6 } = {}) {
  const json = await postJson(TAVILY_URL, { Authorization: `Bearer ${process.env.TAVILY_API_KEY}` },
    { query, search_depth: 'basic', max_results: maxResults, include_answer: false }, 'Tavily search');
  return (json.results || []).map((r) => ({ title: r.title || '', url: r.url || '', content: r.content || '' }));
}

// Chat completion that must answer with a JSON object. -> { data, usage: { prompt, completion, total }, model }
async function groqJson({ system, user }) {
  const model = groqModel();
  const json = await postJson(GROQ_URL, { Authorization: `Bearer ${process.env.GROQ_API_KEY}` }, {
    model, temperature: 0.1, response_format: { type: 'json_object' },
    messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
  }, 'Groq');
  const content = json.choices && json.choices[0] && json.choices[0].message && json.choices[0].message.content;
  let data;
  try { data = JSON.parse(content); } catch { throw new HttpError(502, 'Groq did not return valid JSON for the discovery request'); }
  const u = json.usage || {};
  return { data, model, usage: { prompt: u.prompt_tokens || 0, completion: u.completion_tokens || 0, total: u.total_tokens || (u.prompt_tokens || 0) + (u.completion_tokens || 0) } };
}

module.exports = { discoveryConfig, tavilySearch, groqJson, groqModel };
