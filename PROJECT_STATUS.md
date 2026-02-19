# Model Intake Portal - Project Status and Build Plan

Last Updated: February 17, 2026  
Repository: `achyuthrachur/model-intake-agent`  
Production URL: `https://model-intake-portal.vercel.app`  
Latest Deployment Commit: `c73a1dc`

## 1) What This Project Is Aiming To Do

The Model Intake Portal is designed to give banks a single workflow to:

1. Run an AI-guided model intake interview that fills a structured MRM form.
2. Upload vendor/model documentation and map coverage to required template sections.
3. Generate a consolidated model documentation report with export options.

The target outcome is a faster, more consistent, regulator-ready model documentation process with clear traceability from user inputs and uploaded evidence.

## 2) Current Architecture (Implemented)

The app is now fully Next.js-native (no n8n dependency).

- Frontend: Next.js App Router + TypeScript + Zustand + Tailwind + shadcn/ui
- Backend orchestration: Next.js API routes
  - `POST /api/intake-chat`
  - `POST /api/process-docs`
  - `POST /api/generate-report`
- AI runtime: OpenAI SDK via server-side `OPENAI_API_KEY`
- Document extraction:
  - PDF: `pdf-parse`
  - DOCX/DOC: basic byte-decode fallback (needs upgrade for robust extraction)
- Exports: DOCX (`docx`) and PDF (`jspdf`)
- Deployment: Vercel

## 3) What Has Been Built Out So Far

### 3.1 Core Product Workflow

Status: Completed

- Step 1 Intake:
  - AI chat interface
  - Structured field update parsing (`<<<FIELD_UPDATE>>> ... <<<END_FIELD_UPDATE>>>`)
  - Real-time form synchronization
- Step 2 Document Upload:
  - File upload and status tracking
  - Coverage classification by template section
  - Gap detection and coverage summary
- Step 3 Report Generation:
  - Full section-by-section report generation
  - Model summary table generation
  - Fallback placeholders for missing information

### 3.2 UX, Design, and Motion System

Status: Completed

- Global Crowe-aligned visual token system in `src/app/globals.css`
- Full shadcn restyle (buttons, inputs, selects, badges, cards, progress, accordion)
- Light/dark theme support with shared theme toggle
- `anime.js` integration for:
  - landing page staged reveal
  - wizard transitions
  - settings panel animation
  - chat message enter motion
  - step content staggered reveals

### 3.3 Platform Migration

Status: Completed

- Removed n8n workflow dependency
- Migrated client calls to internal API routes
- Archived old n8n workflow artifacts under `archive/`
- Updated environment model to server-side keys

### 3.4 Quality and Delivery

Status: Completed

- Test suite in place (`vitest`)
- CI workflow configured (`.github/workflows/ci.yml`) for PR checks
- Local verification currently green:
  - `npm run lint` passed
  - `npm run typecheck` passed
  - `npm run test` passed
  - `npm run build` passed
- Production deployment is live and `Ready` on Vercel

## 4) What Is Partially Complete or Pending

### 4.1 Document Extraction Depth

Status: Partial

- PDF extraction works.
- DOCX/DOC extraction currently uses a fallback decode path and should be replaced with a robust parser pipeline.

### 4.2 Data Persistence and Multi-Session Operation

Status: Pending

- Session state is primarily in-memory through Zustand.
- No durable multi-session workflow for saved drafts/recovery/collaboration yet.

### 4.3 Security and Enterprise Controls

Status: Pending

- No formal auth/authorization layer yet.
- No role-based controls, audit trail views, or approval routing yet.
- Rate limiting/request guardrails and abuse controls should be added to API routes.

### 4.4 Production Hardening and Observability

Status: Pending

- Add structured API logging and error telemetry.
- Add monitoring dashboards/alerts for OpenAI/API route failures.
- Add retry/backoff policy where appropriate.

### 4.5 Test Coverage Expansion

Status: Partial

- Unit/integration coverage exists for core store/client/parser flow.
- End-to-end browser tests and visual regression checks are not yet implemented.

## 5) Recommended Next Implementation Plan

### Phase 1 - Reliability Hardening

1. Replace DOCX/DOC fallback with proper text extraction path.
2. Add API route safeguards (timeouts, retries, request size limits, rate limiting).
3. Add structured logging and error tracing.

### Phase 2 - Persistence and Workflow

1. Persist intake sessions and generated artifacts.
2. Add draft recovery and resume flows.
3. Add document/version history for report regeneration.

### Phase 3 - Enterprise Controls

1. Add authentication and role-based access controls.
2. Add audit log of key events and field changes.
3. Add review/approval checkpoints before final export.

### Phase 4 - UX and QA Maturity

1. Mobile/tablet refinement pass for all steps.
2. Add E2E tests for full happy path and failure paths.
3. Add visual regression checks for themed UI and animations.

## 6) Current Definition of Done (Met)

The current release satisfies the target MVP scope:

- End-to-end intake -> upload -> generate -> export workflow works.
- No external n8n dependency remains in runtime architecture.
- Production deployment is active.
- The UI has an intentional branded visual system with elegant transitions and non-default shadcn styling.

