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

- **Mock Mode (default ON):** deterministic local responses, no external API requests.
- **Live Mode:** mock mode OFF, requests hit internal `/api/*` routes and call OpenAI from server.

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
