# v3rtex

v3rtex is a LeetCode-style practice space for working through a NeetCode-inspired roadmap without losing the joy of learning. It includes a 500-problem catalog, a real multi-language solution editor, safe local submission analysis, progressive hints, local progress tracking, daily practice, and a Gemini-powered study assistant.

## Run locally

From the repository root:

```bash
pnpm install
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/dsa-study-companion run dev
```

The Replit workflows provide `PORT` and `BASE_PATH` automatically. For a direct production build, use the same values explicitly:

```bash
PORT=4173 BASE_PATH=/ pnpm --filter @workspace/dsa-study-companion run build
```

## Gemini assistant

The API server reads `GEMINI_API_KEY` only on the server. Add it as a Replit Secret or deployment environment variable when you are ready:

```bash
GEMINI_API_KEY=your_key_here
```

Without a key, the assistant remains usable in guided local mode with progressive DSA nudges. No API key is stored in the frontend or committed to the repository.

## Notes

- Problem progress and submission history are persisted in browser `localStorage` for the initial release.
- Code execution is intentionally safe: the first release uses a replaceable analysis runner rather than evaluating arbitrary code in the browser.
- The catalog uses stable numeric IDs and structured problem objects so a richer external problem source or sandboxed judge can be added later.