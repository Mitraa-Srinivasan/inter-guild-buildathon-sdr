const { supabase, unwrap } = require('../db/supabase');

const present = (v) => v !== undefined && v !== null && v !== '';

// Who outreach for this campaign prospect is sent as (emails are signed by them, calls are made as them):
// the prospect's assigned rep if set, otherwise a rep on this campaign (campaign_reps).
// Only active reps with an identity_for_outreach count. Returns the identity text, or null.
async function loadSenderIdentity(cp) {
  const usable = (rep) => rep && rep.active && present(rep.identity_for_outreach);

  if (cp.assigned_rep_id) {
    const assigned = unwrap(
      await supabase.from('reps').select('name, identity_for_outreach, active').eq('id', cp.assigned_rep_id).maybeSingle()
    );
    if (usable(assigned)) return assigned.identity_for_outreach.trim();
  }

  const rows = unwrap(
    await supabase.from('campaign_reps').select('rep:reps(name, identity_for_outreach, active)').eq('campaign_id', cp.campaign_id)
  );
  const reps = rows.map((r) => r.rep).filter(usable).sort((a, b) => a.name.localeCompare(b.name)); // name order keeps the pick stable
  return reps.length ? reps[0].identity_for_outreach.trim() : null;
}

module.exports = { loadSenderIdentity };
