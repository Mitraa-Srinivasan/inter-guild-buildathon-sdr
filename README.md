# Autonomous SDR Platform

A production-style SDR control plane built with a React frontend, Express backend, and mock-friendly integration layer for DronaHQ and voice-driven outbound sales workflows.

## Overview

This application is designed to demonstrate a real autonomous SDR product with:

- campaign management
- prospect qualification
- AI research and personalization
- DronaHQ agent communication layer
- voice call orchestration and webhook handling
- analytics and activity timeline
- kill switch and campaign isolation
- mock mode for local demos without external credentials

## Tech stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: PostgreSQL + Prisma (ready for migration)
- AI abstractions: OpenAI-ready backend layer
- Agentic integration: DronaHQ integration module
- Real-time updates: Socket.IO
- Validation: Zod
- Auth: JWT + bcrypt

## Folder structure

- backend/
  - src/
  - .env.example
- frontend/
  - src/
- database/
- docs/
- package.json

## Local setup

1. Install dependencies:
   npm install
2. Copy environment file:
   copy backend\.env.example backend\.env
3. Start backend:
   npm run dev --workspace backend
4. Start frontend:
   npm run dev --workspace frontend
5. Open frontend at http://localhost:5173

## Environment variables

The backend expects values like:

- DATABASE_URL
- DIRECT_URL
- JWT_SECRET
- OPENAI_API_KEY
- DRONAHQ_API_KEY
- DRONAHQ_VOICE_AGENT_ID
- DRONAHQ_WORKSPACE_ID
- MOCK_MODE=true

## DronaHQ integration

The integration layer exists under:

- backend/src/integrations/dronahq/

It includes the client and voice/webhook abstractions while keeping API keys on the server.

## Mock mode

When MOCK_MODE is enabled, the system uses the mock service to simulate agent output and call outcomes so the product can run without third-party credentials.

## Deployment and testing

- backend: node src/server.js
- frontend: npm run build
- tests: npm run test --workspace backend -- --runInBand

## Notes

This codebase intentionally keeps the core product flow working in a demo-ready state while preserving real integration boundaries for a production upgrade.
