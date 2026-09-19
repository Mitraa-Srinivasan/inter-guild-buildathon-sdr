# inter-guild-buildathon-sdr

Autonomous SDR system backend: Supabase schema + CRUD API (Phase 1) and DronaHQ-agent orchestrator steps (Phase 2).

## Setup

1. Create a Supabase project, then run [db/schema.sql](db/schema.sql) in the SQL editor (safe to re-run).
2. `cp .env.example .env` and fill in the values (see below). Use the **service_role** Supabase key; RLS is on with no policies.
3. `npm install`
4. `npm run seed` creates the 3 sample campaigns plus a sample rep (Alex Rivera) linked to "US SaaS CTO" and "Voice AI Founders" (idempotent; re-running also adds missing rep links).
5. `npm start` (or `npm run dev`), default port 3000.
6. Optional: `npm run seed:demo` builds the demo pipeline by running fictional prospects through the **real** agents (about 40 DronaHQ calls, several minutes; nothing is sent anywhere). Per campaign, the sample profile is the "hero" taken through research, ICP, strategy, personalisation, dispatch, a positive reply and a follow-up, plus three more at other depths: one that stops after ICP, one dispatched with no reply (`contacted`), and one whose reply needs a human (a pending `reply_escalation` approval). It is resumable and skips any step already done, and it switches paused campaigns to live for the run and puts them back afterwards. The kill switch must be off.

Environment: `SUPABASE_URL`, `SUPABASE_KEY`, `PORT`, and a `DRONAHQ_<AGENT>_WEBHOOK_URL` / `_KEY` pair for each of
`ICP`, `RESEARCH`, `PERSONALIZE`, `STRATEGY`, `CONVERSATION`, `FOLLOWUP`, `VOICE`.

## Layout

```
app.js / server.js   Express app (exported for reuse) / listener
db/                  schema.sql, supabase.js client, seed.js
routes/              one router per resource
orchestrator/        gate.js (pre-send gate), one module per agent step, common.js (step runner + parser),
                     history.js (recent-activity prompt section), channels.js (enabled channels + safety net)
agents/dronaHQ.js    DronaHQ webhook client
lib/                 http.js (validation + error mapping), enums.js
```

## CRUD endpoints

| Resource | Endpoints |
| --- | --- |
| campaigns | `POST /campaigns`, `GET /campaigns`, `GET /campaigns/:id`, `PATCH /campaigns/:id` |
| campaign prospects | `POST /campaign-prospects`, `GET /campaigns/:id/campaign-prospects` |
| prospects | `POST /prospects`, `GET /prospects/:id` |
| activities | `POST /activities`, `GET /activities` |
| reps | `POST /reps`, `GET /reps` |
| campaign reps | `POST /campaign-reps`, `GET /campaign-reps` |
| suppression list | `POST /suppression-list`, `GET /suppression-list` |
| global settings | `GET /global-settings`, `PATCH /global-settings` |
| approvals | `POST /approvals`, `GET /approvals`, `GET /approvals/:id`, `PATCH /approvals/:id` |
| meetings | `POST /meetings`, `GET /meetings` |

**Campaign settings.** Besides `channel_config` and `daily_limits`, a campaign has:
- `enabled_agents`, e.g. `{ "voice": false }`, which pauses that agent for the campaign: its run-* endpoint then returns 423 `{ blocked: true, reason: "agent_paused" }`. Any agent not set to `false` is enabled (default `{}`). Keys are the agent types `icp`, `research`, `personalisation`, `strategy`, `conversation`, `follow`, `voice`; unknown names are a 400. `PATCH /campaigns/:id` **merges** `enabled_agents` into the stored object, so pausing one agent never re-enables another; send `{ "voice": true }` to re-enable. `dispatch` is not an agent and is not affected.
- `sample_profiles`, an array of example ideal-prospect profiles (default `[]`). The seed adds one per campaign, matching its ICP.

**Cost report:** `GET /campaigns/:id/cost-report` returns, from that campaign's activities and prospects: `total_cost`, `total_prospects`, `qualified_count` (funnel state qualified, contacted, engaged, meeting or opportunity), `cost_per_prospect`, `cost_per_qualified_lead`, `conversation_count` and `cost_per_conversation`. Costs are USD **estimates** (see below); a ratio is `null` when its divisor is 0.

**Added for the UI:**
- `PATCH /campaigns/:id/status` `{ status }` changes only the lifecycle status (Launch / Pause / Resume).
- `GET /campaigns/:id/activities` is the campaign's activity log, newest first, with the prospect embedded. Filters: `?agent_type=`, `?status=`, `limit`, `offset`.
- `GET` / `PATCH /global-settings/kill-switch` (`{ kill_switch_on }`).
- `PATCH /reps/:id` updates a rep's fields (e.g. `{ active: true }` to reactivate). To **offboard**, use the two endpoints below: setting `active: false` here alone reports and reassigns nothing.
- `GET /reps/:id/impact` previews an offboarding: the rep's campaigns (each flagged `left_without_rep` if no other active rep is on it), how many prospects are assigned to them, and the active reps that could take over.
- `POST /reps/:id/offboard` with `{ replacement_rep_id? }` deactivates the rep and returns `affected_campaigns`. With a replacement, that rep is linked to each campaign, the prospects assigned to the offboarded rep are handed to them, and the offboarded rep's campaign links are removed. Without one, the links stay (reactivating restores them) and campaigns with no other active rep send without a sender identity. 409 if already offboarded; 400 for a replacement that is the same rep or inactive.
- `GET /health/services` reports the backend, Supabase and DronaHQ. DronaHQ is only checked as *configured* (all 7 webhook URLs and keys set), never called, because agent runs cost credits.
- `GET /activities/spend?since=<ISO>` is the total estimated cost since a moment (default the start of the UTC day), for the sidebar's "AI spend today".
- `GET /global-settings/guardrails` is a read-only summary: suppression count and the max-touches cap (3 successful dispatches per prospect per campaign in 7 days, set in `orchestrator/conflict.js`).
- `GET` / `PATCH /global-settings/channels` is the **global channel pause**. Body `{ "email": false }` pauses email for every campaign and `{ "email": true }` resumes it; the PATCH merges, so other channels are untouched. Channels: `email`, `linkedin`, `sms`, `voice` (`phone` counts as `voice`). It needs the `global_settings.channels` column: run [db/schema.sql](db/schema.sql) again (safe to re-run). Until then these endpoints return 503 and nothing is treated as paused.
- `GET /approvals` embeds `prospect` and `campaign` on each row.

List endpoints accept `limit` (default 100, max 500) and `offset`, plus simple filters (e.g. `?status=`, `?campaign_id=`).

## Control-plane UI

`npm start`, then open http://localhost:3000/. [frontend/index.html](frontend/index.html) is a single file served by the same Express app, so it talks to the API on the same origin (no CORS). Wired to live data: campaigns (list, Launch/Pause/Resume, create, duplicate, channel switches), the kill switch, prospects (per campaign and merged across campaigns), activity feed, analytics (from `cost-report`), prompt versions, per-campaign agent pause, approvals, reps, the suppression list and conversations (from each prospect's last classified reply). The Agents page stats, Integrations and Knowledge pages are still static placeholders. The feed re-polls every 15s.

## Orchestrator endpoints

All are `POST /campaign-prospects/:id/<step>` and go through the same pre-send gate: **423** with
`{ blocked: true, reason }` if the global kill switch is on (`kill_switch_on`) or the campaign isn't live
(`campaign_not_live`). Every run writes an `activities` row (`failed` on agent/parse errors, with the reason).

| Step | Agent / action | Notes |
| --- | --- | --- |
| `run-icp` | `icp` / `score` | Scores against the campaign's `icp_json` (sent as `icp_criteria`); if `run-research` has run, its output is included in the prompt under "Enrichment findings:"; sets `icp_score`, `icp_reasoning`, `funnel_state` (`qualified` / `rejected`). An `Escalate` decision is recorded as `qualified` and also queues a pending `approvals` row (`proposed_action_json`: `{ type: "icp_escalation", score, reasoning }`, linked to the icp activity). |
| `run-research` | `research` / `enrich` | Raw text stored in `context_json.research`. |
| `run-personalize` | `personalisation` / `draft_email` | Needs `qualified` + research. Prompt names the sender: the prospect's `assigned_rep_id`, else an active rep on the campaign (`campaign_reps`), using `reps.identity_for_outreach`. Stores `email_subject`, `email_body`, `email_snippets_used`. |
| `run-strategy` | `strategy` / `decide` | Needs `qualified`. Prompt includes research, recent activity, enabled channels. Stores `context_json.strategy`. |
| `run-conversation` | `conversation` / `classify_reply` | Body `{ reply_text }` (required). `positive` -> `engaged`; `unsubscribe` -> email added to `suppression_list`. Stores `context_json.last_conversation`. A positive reply whose Next Action is "Book meeting" also inserts a `meetings` row (`scheduled_at` null, status `scheduled`; one pending per campaign prospect), noted in the same activity. |
| `run-followup` | `follow` / `decide` | Prompt from recent activity + enabled channels. Stores `context_json.next_followup`. |
| `run-voice` | `voice` / `call` | Requires the `voice` or `phone` channel enabled on the campaign (400 otherwise). Runs the same conflict gate as `dispatch` before calling the agent (409 `{ blocked, reason, details }` and a failed `voice/call` activity; the agent is not called). The prompt names the caller (same rep lookup as `run-personalize`). Stores `context_json.voice_call` (`transcript`, `outcome`, `reasoning`, `simulated: true`: the agent writes the whole conversation; no real call happens). A successful call also logs a `dispatch` activity on channel `voice`/`phone` so it counts toward the frequency cap, daily limit and cross-campaign check. Outcome `meeting_booked` sets `engaged` and inserts a `meetings` row; other outcomes are only recorded. The seeded "Voice AI Founders" campaign has `voice` enabled. |

**Usage and cost (estimates):** every activity row carries `model`, `tokens` and `cost` (USD), filled in by `logActivity` in
[orchestrator/common.js](orchestrator/common.js). DronaHQ webhooks don't report usage, so these are **estimated**, not measured:
tokens = (input chars + output chars) / 4, priced with a per-agent credits-per-1k-tokens table at 500 credits = $1. They leave out each
agent's own instructions on the DronaHQ side. Rows with no LLM (`dispatch`) and runs where the agent never answered record 0.

## Campaign-specific guidance (prompt versions)

DronaHQ's own agent Instructions stay global. What a campaign *can* have is supplementary guidance, versioned and tracked:

| Endpoint | What it does |
| --- | --- |
| `POST /campaigns/:id/prompt-versions` | Body `{ agent_type, content, changed_by }`. Creates the next version for that campaign + agent (numbered per campaign and agent), inactive. `agent_type` is one of `icp`, `research`, `personalisation`, `strategy`, `conversation`, `follow`, `voice`. |
| `PATCH /campaigns/:id/prompt-versions/:versionId/activate` | Makes it the active version and deactivates the previous one. Activating an older version is the rollback. |
| `GET /campaigns/:id/prompt-versions?agent_type=icp` | Lists versions, newest first. |

Every run-* step appends the active version to the prompt as `Campaign-specific guidance: <content>` (for `run-icp` it goes on the `prospect_summary` the agent receives) and records the version's id in `activities.prompt_version_id`, so an outcome can be traced to the guidance behind it. Versions are immutable: to change guidance, create a new version and activate it. Activation is not atomic (no transactions in supabase-js): the old version is deactivated first and restored if the new one fails to activate.

## Dispatch and the conflict gate

`POST /campaign-prospects/:id/dispatch` with body `{ channel }` is the step that decides whether an actual outreach action
may happen. **It is simulated: nothing is sent**; it records the dispatch and advances the funnel.

1. `gate.js` runs first (kill switch / campaign live): **423** on failure, unchanged.
2. The channel must be enabled for the campaign, then `checkConflicts` in [orchestrator/conflict.js](orchestrator/conflict.js)
   runs its checks in order (as listed) and stops at the first failure:

   | reason | Meaning |
   | --- | --- |
   | `channel_paused` | Checked first. The channel is paused globally (Settings > Channel pause), on top of the campaign's own `channel_config`. `phone` counts as `voice`. |
   | `suppressed` | Prospect's email is in `suppression_list` (scope `global`, compared lowercased). |
   | `prospect_rejected` | The campaign prospect's `funnel_state` is `rejected` (ICP scoring said no). |
   | `approval_rejected` | This campaign prospect has a `rejected` row in `approvals`: a reviewer said no, so it is a **permanent** deny (checked before pending ones). `details` = the approval id and type. |
   | `pending_approval` | This campaign prospect has a `pending` row in `approvals` (e.g. an ICP escalation). Holds outreach until the approval is **approved**. `details` = the approval id and type. |
   | `active_in_other_campaign` | Same prospect is in another **live** campaign with a successful `dispatch` in the last 48h (other activity types, e.g. research/ICP, never count). `details` = that campaign's name. |
   | `frequency_cap_exceeded` | 3 or more successful dispatches to this campaign prospect in the last 7 days. |
   | `daily_limit_reached` | Successful dispatches today (UTC) for the campaign on this channel reached `daily_limits[channel]`. No limit set = unlimited. |

3. A deny returns **409** `{ blocked: true, reason, details }` and logs a `failed` `dispatch` activity with the reason
   (`channel_not_enabled` is reported the same way). An allow logs a `success` `dispatch` activity and moves
   `discovered` / `researched` / `qualified` to `contacted`; later stages and `rejected` are left as they are.

Only `success` dispatches count toward the caps, so denied attempts never lock a prospect out.

**No race at the cap boundary.** `checkConflicts` is only the early pass that produces a clear reason. The frequency cap and the daily limit are then re-checked and the `success` activity is written as **one atomic step** (`claim_dispatch_slot()`, [db/schema.sql](db/schema.sql)): a Postgres function, so one transaction, under advisory locks per campaign prospect and per campaign + channel. Three simultaneous dispatches at a prospect already at 2 of 3 give exactly one 200 and two 409 `frequency_cap_exceeded`; without this all three went through. supabase-js has no client-side transactions, hence the function. Until it is installed (re-run `db/schema.sql`), the same recheck-then-write runs under an in-process lock, which protects a single server process but not several. The voice path (`run-voice` logs its dispatch after the call) and the cross-campaign check are not covered by this.

**Channel safety net:** for `run-strategy` and `run-followup`, if the agent recommends a channel that isn't enabled in the
campaign's `channel_config` (`enabled: true`), the run returns **422**, logs a `failed` activity noting the mismatch, and
stores nothing.

Errors: `400` validation / precondition, `404` not found, `409` unique violation, `422` bad foreign key or channel mismatch,
`423` blocked by the gate (`kill_switch_on`, `campaign_not_live` or `agent_paused`), `500` unexpected or unparseable agent output, `502` DronaHQ call failed or the agent's guardrail refused the request ("Agent blocked by guardrail: ..."; logged as a failed activity, nothing is written to the prospect). Guardrail refusals are intermittent, so the client waits 1.5s and re-sends the identical request **once** before giving up; only a guardrail refusal is retried (timeouts, HTTP errors and unparseable replies fail immediately).
