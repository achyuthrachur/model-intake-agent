# Model Intake Portal

AI-enabled Model Risk Management (MRM) intake portal for banking model documentation.

## What This App Does

- Step 1: AI intake chat + synchronized structured intake form
- Step 2: Document upload and section coverage analysis
- Step 3: Report generation with preview + DOCX/PDF/clipboard export

All orchestration now runs inside the Next.js app via internal API routes:

- `POST /api/intake-chat`
- `POST /api/process-docs`
- `POST /api/generate-report`
- `GET /api/demo-docs` (demo document manifest + file streaming)

## Tech Stack

- Next.js App Router + TypeScript
- Zustand state management
- Tailwind + shadcn/ui
- OpenAI SDK (`openai`) for backend model calls
- `pdf-parse` for PDF extraction
- `docx` and `jspdf` for client-side exports

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables in `.env.local`:

```env
# Required (server-side only)
OPENAI_API_KEY=

# Optional
DEFAULT_AI_MODEL=gpt-4o
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

3. Run dev server:

```bash
npm run dev
```

4. Open:

`http://localhost:3000`

## Security Notes

- OpenAI key is server-side only (`OPENAI_API_KEY`), not exposed in frontend config.
- If a key was previously stored in any `NEXT_PUBLIC_*` variable, rotate it.

## Modes

- **Demo Mode (default):** real AI routes + prefilled intake responses + one-click load from `Demo Documents/`.
- **Live Mode:** real AI routes without scripted prefill behavior.
- **Offline Mock Mode:** deterministic local responses, no external API requests.

## Demo Document Source

- Demo preload uses files from the repo-root folder: `Demo Documents/`.
- Step 2 "Load Demo Documents" fetches these files through `GET /api/demo-docs`.

## Commands

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Current Limitations

- PDF parsing is implemented; DOCX/DOC extraction currently uses a byte-decode fallback and should be upgraded if rich extraction is required.
- Frontend is optimized for desktop workflow.
- Session state is in-memory by default.
