const { HttpError } = require('../lib/http');

const TIMEOUT_MS = 60000;

// One DronaHQ webhook trigger per agent type. Each trigger has its own URL and api-key.
const AGENTS = {
  icp: { urlEnv: 'DRONAHQ_ICP_WEBHOOK_URL', keyEnv: 'DRONAHQ_ICP_WEBHOOK_KEY' },
  research: { urlEnv: 'DRONAHQ_RESEARCH_WEBHOOK_URL', keyEnv: 'DRONAHQ_RESEARCH_WEBHOOK_KEY' },
  personalisation: { urlEnv: 'DRONAHQ_PERSONALIZE_WEBHOOK_URL', keyEnv: 'DRONAHQ_PERSONALIZE_WEBHOOK_KEY' },
  strategy: { urlEnv: 'DRONAHQ_STRATEGY_WEBHOOK_URL', keyEnv: 'DRONAHQ_STRATEGY_WEBHOOK_KEY' },
  conversation: { urlEnv: 'DRONAHQ_CONVERSATION_WEBHOOK_URL', keyEnv: 'DRONAHQ_CONVERSATION_WEBHOOK_KEY' },
  follow: { urlEnv: 'DRONAHQ_FOLLOWUP_WEBHOOK_URL', keyEnv: 'DRONAHQ_FOLLOWUP_WEBHOOK_KEY' },
  voice: { urlEnv: 'DRONAHQ_VOICE_WEBHOOK_URL', keyEnv: 'DRONAHQ_VOICE_WEBHOOK_KEY' },
};

// POSTs a JSON payload to the agent's webhook trigger and returns the text in the envelope's `response` field.
async function postWebhook(agentType, payload) {
  const cfg = AGENTS[agentType];
  if (!cfg) throw new HttpError(500, `No DronaHQ webhook configured for agent type "${agentType}"`);
  const url = process.env[cfg.urlEnv];
  const key = process.env[cfg.keyEnv];
  if (!url || !key) throw new HttpError(500, `${cfg.urlEnv} and ${cfg.keyEnv} must be set (see .env.example)`);

  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': key },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    const timedOut = err.name === 'TimeoutError';
    throw new HttpError(502, timedOut ? `DronaHQ agent timed out after ${TIMEOUT_MS / 1000}s` : `DronaHQ agent request failed: ${err.message}`);
  }

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  if (!res.ok) {
    throw new HttpError(502, `DronaHQ agent returned HTTP ${res.status}: ${(json && (json.message || json.error)) || text.slice(0, 200)}`);
  }
  if (!json || json.success === false || typeof json.response !== 'string') {
    throw new HttpError(502, `DronaHQ agent returned an unexpected payload: ${text.slice(0, 200)}`);
  }
  // A guardrail block comes back as a normal 200 whose "response" is the refusal text. Without this it would flow on
  // to the parser and surface as a misleading 500 ("could not parse Subject").
  if (isGuardrailBlock(json.response)) {
    throw new HttpError(502, `Agent blocked by guardrail: the DronaHQ ${agentType} agent refused the request ("${json.response.trim()}")`);
  }
  return json.response;
}

// The refusal messages DronaHQ's guardrails return, e.g. "Response blocked by guardrail policies." and
// "Your message was blocked because it violates our policy". They are short, single-line replies. Every real agent
// answer is multi-line ("Label: value" lines), so requiring a single short line means a genuine answer that merely
// mentions a policy is never mistaken for a block.
const GUARDRAIL_RE = /blocked by (?:the )?guardrail|guardrail polic|blocked because it violates|violates (?:our|the|this) (?:content )?polic/i;
const GUARDRAIL_MAX_CHARS = 300;
function isGuardrailBlock(text) {
  const t = String(text).trim();
  return t.length > 0 && t.length <= GUARDRAIL_MAX_CHARS && !t.includes('\n') && GUARDRAIL_RE.test(t);
}

// ICP agent: body is { prospect_summary, ...variables }, e.g. variables = { icp_criteria: "..." }.
async function callDronaHQAgent(agentType, promptText, variables = {}) {
  return postWebhook(agentType, { prospect_summary: promptText, ...variables });
}

// Research / personalisation agents: body is { prompt }.
async function callDronaHQPrompt(agentType, promptText) {
  return postWebhook(agentType, { prompt: promptText });
}

module.exports = { callDronaHQAgent, callDronaHQPrompt, isGuardrailBlock };
