// Pure text helpers for describing a campaign's ICP. No agent, database or network access, so anything (e.g. prospect
// discovery) can use them without loading the DronaHQ client.

const present = (v) => v !== undefined && v !== null && v !== '';
const show = (v) => (present(v) ? (typeof v === 'object' ? JSON.stringify(v) : String(v)) : 'not provided');

const list = (v) => (Array.isArray(v) ? v.join(', ') : String(v));

function formatRange(r) {
  if (r === null || typeof r !== 'object') return String(r);
  if (present(r.min) && present(r.max)) return `${r.min}-${r.max} employees`;
  if (present(r.min)) return `${r.min}+ employees`;
  if (present(r.max)) return `up to ${r.max} employees`;
  return JSON.stringify(r);
}

// Human-readable ICP criteria from campaigns.icp_json; passed to the agent as the icp_criteria variable.
function formatIcpCriteria(icp) {
  icp = icp || {};
  const company = icp.company_criteria || {};
  const excl = icp.exclusions;
  const lines = [];

  if (present(icp.roles) && icp.roles.length) lines.push(`Target roles: ${list(icp.roles)}`);
  if (present(company.employee_count)) lines.push(`Company size: ${formatRange(company.employee_count)}`);
  if (present(company.industries) && company.industries.length) lines.push(`Industries: ${list(company.industries)}`);
  if (present(company.funding_stage) && company.funding_stage.length) lines.push(`Funding stage: ${list(company.funding_stage)}`);
  if (present(icp.geo) && icp.geo.length) lines.push(`Geography: ${list(icp.geo)}`);

  // Any company criteria we don't have a label for still reach the agent.
  const known = new Set(['employee_count', 'industries', 'funding_stage']);
  for (const [k, v] of Object.entries(company)) {
    if (!known.has(k) && present(v)) lines.push(`${k.replace(/_/g, ' ')}: ${show(v)}`);
  }

  if (excl && typeof excl === 'object') {
    const parts = [];
    if (excl.industries && excl.industries.length) parts.push(`industries: ${list(excl.industries)}`);
    if (excl.competitors) parts.push('competitors');
    for (const [k, v] of Object.entries(excl)) {
      if (!['industries', 'competitors'].includes(k) && present(v) && v !== false) parts.push(`${k.replace(/_/g, ' ')}: ${show(v)}`);
    }
    if (parts.length) lines.push(`Exclusions: ${parts.join('; ')}`);
  } else if (present(excl)) {
    lines.push(`Exclusions: ${show(excl)}`);
  }

  return lines.length ? lines.join('\n') : 'No ICP criteria defined for this campaign.';
}

module.exports = { formatIcpCriteria, present, show };
