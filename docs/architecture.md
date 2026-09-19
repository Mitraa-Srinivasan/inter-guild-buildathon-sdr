# Architecture Overview

## Request flow

Frontend
  -> Backend API
  -> Policy Engine
  -> Agent Orchestrator
  -> DronaHQ Agents / Voice Agent
  -> PostgreSQL data store
  -> real-time notifications

## Key layers

### Frontend
The React dashboard provides campaign management, prospect views, analytics, and action panels.

### Backend API
The Express layer handles validation, auth, campaign state enforcement, and orchestrated workflow execution.

### Agent orchestrator
The orchestrator decides when to call ICP scoring, research, strategy, personalization, conversation, and follow-up agents.

### Policy engine
Campaign status, channel status, duplicate outreach, approvals, and kill switch are enforced centrally before any external action is allowed.

### Database
PostgreSQL stores primary records and can be extended with Prisma migrations and seed scripts.

### DronaHQ layer
DronaHQ is isolated inside the integrations folder so the app can securely communicate with agents and voice calls without exposing keys in the browser.

### Mock mode
Mock mode keeps the app demoable without external credentials while preserving real integration hooks.
