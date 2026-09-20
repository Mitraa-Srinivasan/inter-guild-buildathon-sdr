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
-- Autonomous mode: when true, POST /run-cycle decides and runs each prospect's next step. OFF by default.
alter table global_settings add column if not exists autonomous_mode boolean not null default false;
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

-- Atomic dispatch slot -------------------------------------------------------
-- The conflict gate reads counts and dispatch then writes an activity; with no transaction two simultaneous dispatches
-- at the cap boundary could both pass. supabase-js has no client-side transactions, so the check-and-claim runs in this
-- function (one transaction per call). Advisory locks serialise callers per campaign prospect (frequency cap) and per
-- campaign + channel (daily limit); the second caller's counts are taken after the first has committed, so it sees the
-- first one's row. Locks are always taken in the same order, so two callers cannot deadlock.
-- Returns { allowed: true, activity_id } (a 'success' dispatch activity was inserted) or { allowed: false, reason, details }.
create or replace function claim_dispatch_slot(
  p_campaign_id    uuid,
  p_prospect_id    uuid,
  p_channel        text,
  p_frequency_cap  integer,   -- null = no cap
  p_window_seconds integer,   -- frequency window, e.g. 7 days
  p_daily_limit    integer,   -- null = no daily limit for this channel
  p_input          text,
  p_output         text
) returns jsonb
language plpgsql
as $$
declare
  v_recent    integer;
  v_today     integer;
  v_id        uuid;
  v_day_start timestamptz := date_trunc('day', now() at time zone 'utc') at time zone 'utc';
begin
  perform pg_advisory_xact_lock(hashtextextended('dispatch:prospect:' || p_campaign_id::text || ':' || p_prospect_id::text, 0));
  perform pg_advisory_xact_lock(hashtextextended('dispatch:day:' || p_campaign_id::text || ':' || p_channel, 0));

  if p_frequency_cap is not null then
    select count(*) into v_recent from activities
     where action_type = 'dispatch' and status = 'success'
       and campaign_id = p_campaign_id and prospect_id = p_prospect_id
       and created_at >= now() - make_interval(secs => p_window_seconds);
    if v_recent >= p_frequency_cap then
      return jsonb_build_object('allowed', false, 'reason', 'frequency_cap_exceeded',
        'details', v_recent || ' dispatches in the last ' || (p_window_seconds / 86400) || ' days (cap ' || p_frequency_cap || ')');
    end if;
  end if;

  if p_daily_limit is not null then
    select count(*) into v_today from activities
     where action_type = 'dispatch' and status = 'success'
       and campaign_id = p_campaign_id and channel = p_channel
       and created_at >= v_day_start;
    if v_today >= p_daily_limit then
      return jsonb_build_object('allowed', false, 'reason', 'daily_limit_reached',
        'details', v_today || ' of ' || p_daily_limit || ' ' || p_channel || ' dispatches used today');
    end if;
  end if;

  insert into activities (campaign_id, prospect_id, agent_type, action_type, channel, input_summary, output_summary, tokens, cost, status)
  values (p_campaign_id, p_prospect_id, 'dispatch', 'dispatch', p_channel, p_input, p_output, 0, 0, 'success')
  returning id into v_id;

  return jsonb_build_object('allowed', true, 'activity_id', v_id);
end;
$$;
-- Only the backend (service_role) may call it.
revoke all on function claim_dispatch_slot(uuid, uuid, text, integer, integer, integer, text, text) from public, anon, authenticated;
grant execute on function claim_dispatch_slot(uuid, uuid, text, integer, integer, integer, text, text) to service_role;

-- RLS: on for every table. The team policies are at the end of this file; the service_role key (used by this backend) bypasses RLS. -----
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

-- Team login (Supabase Auth) --------------------------------------------------------------
-- One row per Supabase Auth user (auth.users) that belongs to this team. Created only by the backend / db/seed-users.js
-- with the service key, never from the browser: signing up in Supabase Auth alone does NOT make someone a member.
create table if not exists profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  role         text not null default 'Sales Manager',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at before update on profiles for each row execute function set_updated_at();
alter table profiles enable row level security;

-- Is the signed-in user a team member? security definer so the check can read profiles whatever profiles' own policy says
-- (no recursion). Deleting someone's profile row removes their access at once.
create or replace function is_team_member() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid());
$$;
revoke all on function is_team_member() from public, anon;
grant execute on function is_team_member() to authenticated, service_role;

-- RLS policies: a single shared team, no per-user restriction (deliberately not multi-tenant yet). Any signed-in TEAM MEMBER can
-- read and write every table. Anyone else (anon, or a Supabase user with no profile row) gets nothing. This backend uses the
-- service_role key, which bypasses RLS; these policies govern anyone who talks to Supabase directly with a user's session.
do $$
declare t text;
begin
  foreach t in array array['campaigns', 'reps', 'prompt_versions', 'prospects', 'campaign_prospects', 'activities',
                           'campaign_reps', 'suppression_list', 'global_settings', 'approvals', 'meetings'] loop
    execute format('drop policy if exists team_full_access on %I', t);
    execute format('create policy team_full_access on %I for all to authenticated using (is_team_member()) with check (is_team_member())', t);
  end loop;
end $$;

-- Members can see who is on the team; nobody can change profiles through the API (only the service key can).
drop policy if exists profiles_team_read on profiles;
create policy profiles_team_read on profiles for select to authenticated using (is_team_member());
