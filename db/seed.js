// Usage: npm run seed   (idempotent: campaigns are matched by name, the rep by email; existing rows are skipped)
const { supabase, unwrap } = require('./supabase');

const campaigns = [
  {
    name: 'US SaaS CTO',
    description: 'Outbound to CTOs and VPs of Engineering at US-based B2B SaaS companies.',
    owner: 'growth-team',
    status: 'live',
    icp_json: {
      roles: ['CTO', 'VP Engineering', 'Head of Engineering'],
      geo: ['United States'],
      company_criteria: {
        industries: ['B2B SaaS'],
        employee_count: { min: 50, max: 500 },
        funding_stage: ['Series A', 'Series B', 'Series C'],
      },
      exclusions: { industries: ['Government', 'Education'], competitors: true },
    },
    channel_config: { email: { enabled: true }, linkedin: { enabled: true }, phone: { enabled: false } },
    daily_limits: { email: 50, linkedin: 20 },
  },
  {
    name: 'India BFSI CIO',
    description: 'Outreach to CIOs and CTOs at banks, financial services and insurance firms in India.',
    owner: 'apac-team',
    status: 'paused',
    icp_json: {
      roles: ['CIO', 'CTO', 'Head of Digital', 'Chief Digital Officer'],
      geo: ['India'],
      company_criteria: {
        industries: ['Banking', 'Financial Services', 'Insurance'],
        employee_count: { min: 500 },
      },
      exclusions: { industries: ['Fintech startups under 50 employees'], competitors: true },
    },
    channel_config: { email: { enabled: true }, linkedin: { enabled: true }, phone: { enabled: true } },
    daily_limits: { email: 30, linkedin: 15, phone: 10 },
  },
  {
    name: 'Voice AI Founders',
    description: 'Founders and co-founders of early-stage voice AI companies.',
    owner: 'growth-team',
    status: 'live',
    icp_json: {
      roles: ['Founder', 'Co-founder', 'CEO'],
      geo: ['United States', 'United Kingdom', 'India', 'Canada'],
      company_criteria: {
        industries: ['Voice AI', 'Conversational AI', 'Speech Technology'],
        employee_count: { min: 2, max: 50 },
        funding_stage: ['Pre-seed', 'Seed', 'Series A'],
      },
      exclusions: { industries: [], competitors: true },
    },
    channel_config: { email: { enabled: true }, linkedin: { enabled: true }, phone: { enabled: false }, voice: { enabled: true } },
    daily_limits: { email: 40, linkedin: 25 },
  },
];

// One sample rep, linked to "US SaaS CTO" and "Voice AI Founders" (a rep can serve several campaigns).
// "India BFSI CIO" is left without a rep on purpose.
// identity_for_outreach is what personalised emails are signed with and what the voice agent introduces itself as.
const rep = {
  name: 'Alex Rivera',
  email: 'alex.rivera@meridian.example',
  identity_for_outreach: 'Alex Rivera, Account Executive at Meridian',
  active: true,
};
const REP_CAMPAIGNS = ['US SaaS CTO', 'Voice AI Founders'];

async function seedRep() {
  let row = unwrap(await supabase.from('reps').select('id').eq('email', rep.email).maybeSingle());
  if (row) {
    console.log(`Skipping rep "${rep.name}" (already exists)`);
  } else {
    row = unwrap(await supabase.from('reps').insert(rep).select('id').single());
    console.log(`Created rep "${rep.name}" ${row.id}`);
  }

  for (const campaignName of REP_CAMPAIGNS) {
    const campaign = unwrap(await supabase.from('campaigns').select('id').eq('name', campaignName).maybeSingle());
    if (!campaign) throw new Error(`Campaign "${campaignName}" not found; cannot link rep`);
    const linked = unwrap(
      await supabase
        .from('campaign_reps')
        .upsert({ campaign_id: campaign.id, rep_id: row.id }, { onConflict: 'campaign_id,rep_id', ignoreDuplicates: true })
        .select()
    );
    console.log(linked.length ? `Linked "${rep.name}" to "${campaignName}"` : `Skipping link "${rep.name}" -> "${campaignName}" (already linked)`);
  }
}

async function seed() {
  const existing = unwrap(
    await supabase.from('campaigns').select('name').in('name', campaigns.map((c) => c.name))
  );
  const have = new Set(existing.map((c) => c.name));

  const toInsert = campaigns.filter((c) => !have.has(c.name));
  for (const name of have) console.log(`Skipping "${name}" (already exists)`);

  if (toInsert.length) {
    const inserted = unwrap(await supabase.from('campaigns').insert(toInsert).select('id, name, status'));
    for (const c of inserted) console.log(`Created "${c.name}" [${c.status}] ${c.id}`);
  }
  await seedRep();
  console.log('Seed complete.');
}

seed().catch((err) => {
  console.error('Seed failed:', err.message || err);
  process.exit(1);
});
