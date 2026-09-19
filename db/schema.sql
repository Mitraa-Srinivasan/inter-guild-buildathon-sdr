-- SDR system schema (Phase 1). Run once in the Supabase SQL editor; safe to re-run.

create extension if not exists pgcrypto;

-- updated_at maintenance -----------------------------------------------------
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- campaigns ------------------------------------------------------------------
create table if not exists campaigns (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  description    text,
  owner          text,
  status         text not null default 'draft'
                 check (status in ('draft','live','paused','completed','archived')),
  icp_json       jsonb not null default '{}'::jsonb,  -- roles, geo, company criteria, exclusions
  channel_config jsonb not null default '{}'::jsonb,
  daily_limits   jsonb not null default '{}'::jsonb,
  enabled_agents jsonb not null default '{}'::jsonb,  -- { "<agent_type>": false } pauses that agent; anything not false is enabled
  sample_profiles jsonb not null default '[]'::jsonb, -- example ideal-prospect profiles for this campaign
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
-- For databases created before these columns existed (create table if not exists won't add them):
alter table campaigns add column if not exists enabled_agents  jsonb not null default '{}'::jsonb;
alter table campaigns add column if not exists sample_profiles jsonb not null default '[]'::jsonb;

-- reps -----------------------------------------------------------------------
create table if not exists reps (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  email                 text not null unique,
  identity_for_outreach text,
  daily_limit           integer check (daily_limit is null or daily_limit >= 0),
  working_hours         jsonb not null default '{}'::jsonb,
  channels              jsonb not null default '[]'::jsonb,
  active                boolean not null default true
);

-- prompt_versions ------------------------------------------------------------
create table if not exists prompt_versions (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  agent_type  text not null,
  version     integer not null check (version > 0),
  content     text not null,
  changed_by  text,
  changed_at  timestamptz not null default now(),
  is_active   boolean not null default false,
  unique (campaign_id, agent_type, version)
);
-- at most one active prompt per campaign + agent
create unique index if not exists prompt_versions_one_active
  on prompt_versions (campaign_id, agent_type) where is_active;

-- prospects ------------------------------------------------------------------
create table if not exists prospects (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  title             text,
  company           text,
  linkedin_url      text,
  email             text,
  phone             text,
  company_data_json jsonb not null default '{}'::jsonb,
  source            text,
  created_at        timestamptz not null default now()
);

-- campaign_prospects ---------------------------------------------------------
create table if not exists campaign_prospects (
  id              uuid primary key default gen_random_uuid(),
  campaign_id     uuid not null references campaigns(id) on delete cascade,
  prospect_id     uuid not null references prospects(id) on delete cascade,
  funnel_state    text not null default 'discovered'
                  check (funnel_state in ('discovered','researched','qualified','rejected',
                                          'contacted','engaged','meeting','opportunity')),
  icp_score       numeric,
  icp_reasoning   text,
  context_json    jsonb not null default '{}'::jsonb,
  assigned_rep_id uuid references reps(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (campaign_id, prospect_id)
);
create index if not exists campaign_prospects_campaign_state_idx
  on campaign_prospects (campaign_id, funnel_state);
create index if not exists campaign_prospects_prospect_idx on campaign_prospects (prospect_id);

-- activities -----------------------------------------------------------------
create table if not exists activities (
  id                uuid primary key default gen_random_uuid(),
  campaign_id       uuid not null references campaigns(id) on delete cascade,
  prospect_id       uuid references prospects(id) on delete set null,
  agent_type        text not null,
  action_type       text not null,
  channel           text,
  prompt_version_id uuid references prompt_versions(id) on delete set null,
  model             text,
  input_summary     text,
  output_summary    text,
  tokens            integer check (tokens is null or tokens >= 0),
  cost              numeric(12,6) check (cost is null or cost >= 0),
  status            text not null default 'success'
                    check (status in ('success','failed','pending_approval')),
  created_at        timestamptz not null default now()
);
create index if not exists activities_campaign_created_idx on activities (campaign_id, created_at desc);
create index if not exists activities_prospect_idx on activities (prospect_id);

-- campaign_reps --------------------------------------------------------------
create table if not exists campaign_reps (
  campaign_id uuid not null references campaigns(id) on delete cascade,
  rep_id      uuid not null references reps(id) on delete cascade,
  primary key (campaign_id, rep_id)
);
create index if not exists campaign_reps_rep_idx on campaign_reps (rep_id);

-- suppression_list -----------------------------------------------------------
create table if not exists suppression_list (
  id     uuid primary key default gen_random_uuid(),
  value  text not null,
  reason text,
  scope  text not null default 'global',
  unique (scope, value)
);

-- global_settings (exactly one row: id is pinned to true) --------------------
create table if not exists global_settings (
  id             boolean primary key default true check (id),
  kill_switch_on boolean not null default false,
  updated_at     timestamptz not null default now()
);
-- Global channel pause: { "<channel>": { "enabled": false } } pauses that channel for every campaign (default {} = none paused).
-- For databases created before this column existed:
alter table global_settings add column if not exists channels jsonb not null default '{}'::jsonb;
insert into global_settings (id) values (true) on conflict do nothing;

-- approvals ------------------------------------------------------------------
create table if not exists approvals (
  id                   uuid primary key default gen_random_uuid(),
  campaign_id          uuid not null references campaigns(id) on delete cascade,
  prospect_id          uuid not null references prospects(id) on delete cascade,
  activity_id          uuid references activities(id) on delete set null,
  proposed_action_json jsonb not null,
  status               text not null default 'pending'
                       check (status in ('pending','approved','rejected')),
  created_at           timestamptz not null default now(),
  resolved_by          text,
  resolved_at          timestamptz
);
create index if not exists approvals_status_idx on approvals (status, created_at);
create index if not exists approvals_campaign_idx on approvals (campaign_id);

-- meetings -------------------------------------------------------------------
create table if not exists meetings (
  id           uuid primary key default gen_random_uuid(),
  campaign_id  uuid not null references campaigns(id) on delete cascade,
  prospect_id  uuid not null references prospects(id) on delete cascade,
  scheduled_at timestamptz,
  status       text not null default 'scheduled'
);
create index if not exists meetings_campaign_idx on meetings (campaign_id);

-- triggers -------------------------------------------------------------------
drop trigger if exists campaigns_updated_at on campaigns;
create trigger campaigns_updated_at before update on campaigns
  for each row execute function set_updated_at();

drop trigger if exists campaign_prospects_updated_at on campaign_prospects;
create trigger campaign_prospects_updated_at before update on campaign_prospects
  for each row execute function set_updated_at();

drop trigger if exists global_settings_updated_at on global_settings;
create trigger global_settings_updated_at before update on global_settings
  for each row execute function set_updated_at();

-- RLS: on, with no policies. Only the service_role key (used by this backend) can access. -----
alter table campaigns          enable row level security;
alter table reps               enable row level security;
alter table prompt_versions    enable row level security;
alter table prospects          enable row level security;
alter table campaign_prospects enable row level security;
alter table activities         enable row level security;
alter table campaign_reps      enable row level security;
alter table suppression_list   enable row level security;
alter table global_settings    enable row level security;
alter table approvals          enable row level security;
alter table meetings           enable row level security;
