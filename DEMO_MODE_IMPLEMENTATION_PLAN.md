# Demo Mode (AI + Prefill) — Implementation Plan

This document captures the full implementation plan to make **Demo mode** behave like a guided walkthrough while still using real AI for extraction/consolidation/generation.

## Goal

- Keep the workflow **AI intake → document upload → coherent model documentation output**.
- Make **Demo** mode behave like a guided walkthrough:
  - Uses the real internal API routes (`/api/intake-chat`, `/api/process-docs`, `/api/generate-report`) and therefore **still uses AI**.
  - Preloads scripted user responses into the chat input so the presenter can **just hit Enter**.
  - Provides a **Load demo documents** action that injects synthetic docs into Step 2 without drag/drop.
- Preserve the existing deterministic no-AI path as **Offline Mock** for development/testing.

## High-level design (Mode semantics)

Implement a single `sessionMode` state with 3 values:

- `live`: AI on, no scripted prefills
- `demo`: AI on, scripted prefills + demo document loader
- `mock`: AI off, uses `src/lib/mock-client.ts`

Map this to the existing API client behavior by passing:

- `useMockData = (sessionMode === 'mock')`

into `src/lib/api-client.ts` calls.

## Todo checklist (implementation)

- [ ] **Add a shared Mode type** (`src/types/index.ts`)
- [ ] **Update Zustand store to use `sessionMode`** (`src/stores/intake-store.ts`)
- [ ] **Replace “Mock” UI with a single Mode selector** (`src/app/page.tsx`, `src/components/wizard/SettingsPanel.tsx`)
- [ ] **Prefill chat answers in Demo mode** (`src/components/chat/ChatInput.tsx`, `src/components/wizard/StepIntake.tsx`, plus demo answers source)
- [ ] **One-click loading of demo documents in Step 2** (`Demo Documents/*`, `src/app/api/demo-docs/route.ts`, `src/lib/demo-docs.ts`, `src/components/wizard/StepUpload.tsx`)
- [ ] **Verify all modes** (Live/Demo call real APIs; Mock stays deterministic; run lint/typecheck/test/build)

## Implementation steps (code changes)

### 1) Add a shared Mode type

- Update `src/types/index.ts`
  - Add:
    - `export type SessionMode = 'live' | 'demo' | 'mock';`
  - Update `PortalConfig` to include `sessionMode: SessionMode` (or add a new config type used by the store).

### 2) Update Zustand store to use `sessionMode`

- Update `src/stores/intake-store.ts`
  - Replace `useMockData` / `setUseMockData` with:
    - `sessionMode: SessionMode`
    - `setSessionMode: (mode: SessionMode) => void`
  - Set a safe default (recommended: `mock` so the app doesn’t unexpectedly call OpenAI).
  - Ensure `resetSession()` also resets `sessionMode` to the default.

### 3) Replace the “Mock” UI with a single Mode selector

- Update landing page `src/app/page.tsx`
  - Replace the current “Mock” toggle with a shadcn `Select` for:
    - `Live (AI)`
    - `Demo (AI + Prefill)`
    - `Offline Mock (No AI)`
  - Update helper text:
    - Live/Demo: calls internal API routes and requires `OPENAI_API_KEY`.
    - Offline Mock: deterministic, no external calls.
  - Keep the AI model selector disabled only in Offline Mock if desired.

- Update settings panel `src/components/wizard/SettingsPanel.tsx`
  - Add the same Mode selector.
  - If switching into Offline Mock, optionally keep the existing “deterministic data” note.

### 4) Prefill chat answers in Demo mode

**Demo answers source (choose one):**

- Option A (recommended for easy edits without rebuild): `public/demo/demo-answers.json`
  - Format: a JSON array of strings, one per user turn.
- Option B: `src/data/demo/demo-answers.ts`
  - Export `DEMO_ANSWERS: string[]`.

**Wire it into chat input:**

- Update `src/components/chat/ChatInput.tsx`
  - Add a prop like `suggestedMessage?: string`.
  - When `suggestedMessage` changes:
    - If the user hasn’t typed anything (input is empty), set the textarea value to `suggestedMessage`.
    - Do **not** overwrite if the user is editing.

- Update `src/components/wizard/StepIntake.tsx`
  - Compute `demoTurnIndex` as: `count(messages where role === 'user')`.
  - If `sessionMode === 'demo'`, pass `DEMO_ANSWERS[demoTurnIndex]` to `ChatInput` as `suggestedMessage`.
  - Keep sending behavior unchanged (Enter already sends).

### 5) One-click loading of demo documents in Step 2

**Filesystem-backed demo dataset (selected approach):**

- Use a real folder in the repo root: `Demo Documents/`
- Add an API route `src/app/api/demo-docs/route.ts` that:
  - Lists files in `Demo Documents/` as a manifest payload
  - Streams file bytes for `GET /api/demo-docs?filename=...`

**Loader helper:**

- Add `src/lib/demo-docs.ts`
  - Fetch the manifest
  - Download each `url` as a `Blob`
  - Convert to `File[]` with the provided `filename`/`mimeType`
  - Return `File[]`

**Hook into Step 2:**

- Update `src/components/wizard/StepUpload.tsx`
  - When `sessionMode === 'demo'`, render a `Load demo documents` button.
  - On click:
    - `const demoFiles = await loadDemoFiles();`
    - Call the existing `handleFilesAdded(demoFiles)` so it flows through the same UX and processing path.
    - Let the existing auto-process timer run (or call `handleProcessDocuments()` directly after adding).

**Note on file formats:**

- Prefer `.txt` and `.pdf` initially.
- `.docx/.doc` extraction is currently a fallback decode in `src/app/api/process-docs/route.ts` and should be improved later if needed.

### 6) Ensure Demo mode still uses AI

- Update `StepIntake`, `StepUpload`, and `StepGenerate` to build `ClientConfig` like:
  - `useMockData: sessionMode === 'mock'`
- No changes needed to API routes (`src/app/api/*/route.ts`) beyond optional improved error messaging.

## Verification plan

- **Demo mode**:
  - Step 1: input is prefilled; pressing Enter sends; after assistant reply, next answer is prefilled.
  - Step 2: clicking “Load demo documents” populates file list and processes them; coverage grid renders.
  - Step 3: “Generate Document” calls `/api/generate-report`; exports still work.
- **Live mode**:
  - Behaves like current live path (no prefills, manual upload), uses API routes.
- **Offline Mock**:
  - Behaves like current mock behavior (`src/lib/mock-client.ts`).
- Run:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test`
  - `npm run build`

## Notes / constraints

- Live/Demo require `OPENAI_API_KEY` set server-side (see `README.md`).
- This plan is designed so Demo is **presentable** (pre-filled user answers + one-click demo docs) but still **truthfully AI-powered** for the extraction/classification/generation steps.

