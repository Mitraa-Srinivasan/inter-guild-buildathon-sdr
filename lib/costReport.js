const { supabase, unwrap } = require('../db/supabase');

const PAGE_SIZE = 1000; // Supabase returns at most 1000 rows per request, so read in pages instead of truncating silently
const QUALIFIED_STATES = ['qualified', 'contacted', 'engaged', 'meeting', 'opportunity']; // i.e. passed ICP scoring
const MICRO = 1e6; // activities.cost is numeric(12,6): sum as whole micro-dollars to avoid floating-point drift

async function fetchAll(buildQuery) {
  const rows = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const page = unwrap(await buildQuery().range(from, from + PAGE_SIZE - 1));
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

const toMicro = (cost) => Math.round(Number(cost || 0) * MICRO);
const fromMicro = (micro) => micro / MICRO;
// micro-dollars / count -> USD rounded to 6 decimals, or null when there is nothing to divide by
const perUnit = (micro, count) => (count > 0 ? Math.round(micro / count) / MICRO : null);

// Cost report for one campaign. Costs are the estimates stored on activities (see orchestrator/common.js), in USD.
async function buildCostReport(campaign) {
  const activities = await fetchAll(() =>
    supabase.from('activities').select('agent_type, cost').eq('campaign_id', campaign.id).order('id')
  );
  const links = await fetchAll(() =>
    supabase.from('campaign_prospects').select('prospect_id, funnel_state').eq('campaign_id', campaign.id).order('id')
  );

  const totalMicro = activities.reduce((sum, a) => sum + toMicro(a.cost), 0);
  const conversations = activities.filter((a) => a.agent_type === 'conversation');
  const conversationMicro = conversations.reduce((sum, a) => sum + toMicro(a.cost), 0);

  const totalProspects = new Set(links.map((l) => l.prospect_id)).size;
  const qualifiedCount = new Set(links.filter((l) => QUALIFIED_STATES.includes(l.funnel_state)).map((l) => l.prospect_id)).size;

  return {
    campaign_id: campaign.id,
    campaign_name: campaign.name,
    currency: 'USD',
    cost_basis: 'estimated', // token counts and costs are estimates, not measured
    total_cost: fromMicro(totalMicro),
    total_prospects: totalProspects,
    qualified_count: qualifiedCount,
    cost_per_prospect: perUnit(totalMicro, totalProspects),
    cost_per_qualified_lead: perUnit(totalMicro, qualifiedCount),
    conversation_count: conversations.length,
    cost_per_conversation: perUnit(conversationMicro, conversations.length),
  };
}

module.exports = { buildCostReport, QUALIFIED_STATES };
