# inter-guild-buildathon-sdr

Autonomous SDR system backend: Supabase schema + CRUD API (Phase 1) and DronaHQ-agent orchestrator steps (Phase 2).

## Setup

1. Create a Supabase project, then run [db/schema.sql](db/schema.sql) in the SQL editor (safe to re-run).
2. `cp .env.example .env` and fill in the values (see below). Use the **service_role** Supabase key; RLS is on with no policies.
3. `npm install`
4. `npm run seed` creates the 3 sample campaigns plus a sample rep (Alex Rivera) linked to "US SaaS CTO" (idempotent).
5. `npm start` (or `npm run dev`), default port 3000.

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

List endpoints accept `limit` (default 100, max 500) and `offset`, plus simple filters (e.g. `?status=`, `?campaign_id=`).

## Orchestrator endpoints

All are `POST /campaign-prospects/:id/<step>` and go through the same pre-send gate: **423** with
`{ blocked: true, reason }` if the global kill switch is on (`kill_switch_on`) or the campaign isn't live
(`campaign_not_live`). Every run writes an `activities` row (`failed` on agent/parse errors, with the reason).

| Step | Agent / action | Notes |
| --- | --- | --- |
| `run-icp` | `icp` / `score` | Scores against the campaign's `icp_json`; sets `icp_score`, `icp_reasoning`, `funnel_state` (`qualified` / `rejected`). An `Escalate` decision is recorded as `qualified` and also queues a pending `approvals` row (`proposed_action_json`: `{ type: "icp_escalation", score, reasoning }`, linked to the icp activity). |
| `run-research` | `research` / `enrich` | Raw text stored in `context_json.research`. |
| `run-personalize` | `personalisation` / `draft_email` | Needs `qualified` + research. Prompt names the sender: the prospect's `assigned_rep_id`, else an active rep on the campaign (`campaign_reps`), using `reps.identity_for_outreach`. Stores `email_subject`, `email_body`, `email_snippets_used`. |
| `run-strategy` | `strategy` / `decide` | Needs `qualified`. Prompt includes research, recent activity, enabled channels. Stores `context_json.strategy`. |
| `run-conversation` | `conversation` / `classify_reply` | Body `{ reply_text }` (required). `positive` -> `engaged`; `unsubscribe` -> email added to `suppression_list`. Stores `context_json.last_conversation`. A positive reply whose Next Action is "Book meeting" also inserts a `meetings` row (`scheduled_at` null, status `scheduled`; one pending per campaign prospect), noted in the same activity. |
| `run-followup` | `follow` / `decide` | Prompt from recent activity + enabled channels. Stores `context_json.next_followup`. |
| `run-voice` | `voice` / `call` | Requires the `phone` channel enabled on the campaign (400 otherwise). Stores `context_json.voice_call`. |

**Usage and cost (estimates):** every activity row carries `model`, `tokens` and `cost` (USD), filled in by `logActivity` in
[orchestrator/common.js](orchestrator/common.js). DronaHQ webhooks don't report usage, so these are **estimated**, not measured:
tokens = (input chars + output chars) / 4, priced with a per-agent credits-per-1k-tokens table at 500 credits = $1. They leave out each
agent's own instructions on the DronaHQ side. Rows with no LLM (`dispatch`) and runs where the agent never answered record 0.

## Dispatch and the conflict gate

`POST /campaign-prospects/:id/dispatch` with body `{ channel }` is the step that decides whether an actual outreach action
may happen. **It is simulated: nothing is sent**; it records the dispatch and advances the funnel.

1. `gate.js` runs first (kill switch / campaign live): **423** on failure, unchanged.
2. The channel must be enabled for the campaign, then `checkConflicts` in [orchestrator/conflict.js](orchestrator/conflict.js)
   runs its checks in order (as listed) and stops at the first failure:

   | reason | Meaning |
   | --- | --- |
   | `suppressed` | Prospect's email is in `suppression_list` (scope `global`, compared lowercased). |
   | `prospect_rejected` | The campaign prospect's `funnel_state` is `rejected` (ICP scoring said no). |
   | `pending_approval` | This campaign prospect has a `pending` row in `approvals` (e.g. an ICP escalation). Clears once the approval is approved or rejected. `details` = the approval id and type. |
   | `active_in_other_campaign` | Same prospect is in another **live** campaign with a successful `dispatch` in the last 48h (other activity types, e.g. research/ICP, never count). `details` = that campaign's name. |
   | `frequency_cap_exceeded` | 3 or more successful dispatches to this campaign prospect in the last 7 days. |
   | `daily_limit_reached` | Successful dispatches today (UTC) for the campaign on this channel reached `daily_limits[channel]`. No limit set = unlimited. |

3. A deny returns **409** `{ blocked: true, reason, details }` and logs a `failed` `dispatch` activity with the reason
   (`channel_not_enabled` is reported the same way). An allow logs a `success` `dispatch` activity and moves
   `discovered` / `researched` / `qualified` to `contacted`; later stages and `rejected` are left as they are.

Only `success` dispatches count toward the caps, so denied attempts never lock a prospect out.

**Channel safety net:** for `run-strategy` and `run-followup`, if the agent recommends a channel that isn't enabled in the
campaign's `channel_config` (`enabled: true`), the run returns **422**, logs a `failed` activity noting the mismatch, and
stores nothing.

Errors: `400` validation / precondition, `404` not found, `409` unique violation, `422` bad foreign key or channel mismatch,
`423` blocked by the gate, `500` unexpected or unparseable agent output, `502` DronaHQ call failed.
