# AGENTS.md — agent-desk

## What is this repo?

A static SPA that serves as a dashboard/homepage for AI agents. Agents interact via `window.agentAPI` (sync API) through browser `eval`. Humans use the same UI. All data lives in IndexedDB (browser profile, never committed).

## Key facts

- **Deploy:** GitHub Pages (static, no backend)
- **Stack:** Vite 8 + React 19 + TypeScript + TanStack Router (hash) + Dexie.js + Tailwind 4
- **API:** `window.agentAPI` with 7 namespaces: `tasks`, `events`, `session`, `links`, `config`, `search`, `export`
- **Tests:** 118 unit tests (Vitest + fake-indexeddb)
- **ADRs:** 16 architecture decisions in `docs/adr/`

## Commands

```bash
pnpm install
pnpm dev       # dev server on :5174
pnpm test      # 103 tests
pnpm build     # production build to dist/
```

## Conventions

- **Code in English**, communication in Spanish (per user preference)
- **No emojis** in code or commits
- **data-testid** on all interactive elements (ADR-0013)
- **aria-label** on all interactive elements without visible text (ADR-0013)
- **LLM instructions** hidden in DOM at `[data-testid="llm-instructions"]` (ADR-0014)
- **Sync API** — all `window.agentAPI` methods return values, not Promises (ADR-0005). Exception: `agentAPI.export.import()` is async because it writes to Dexie (ADR-0016).
- **FlexSearch is vendored** at `src/vendor/flexsearch.min.js` — do not reinstall as a dependency (breaks Vite 8/Rolldown dep optimizer)
- **Lazy-loaded routes** — Dashboard, TasksView, CalendarView are dynamic imports (code-splitting)

## Architecture

```
window.agentAPI (sync) → in-memory cache → Dexie.js → IndexedDB
                     ↓
              React UI (human view)
```

The API is the primary interface. The UI is a human view on top of the same data.

## What NOT to do

- Do not add a backend, auth, or server-side code
- Do not add flexsearch as a npm dependency (use the vendored copy)
- Do not scrape the DOM — use `window.agentAPI`
- Do not commit `.browser-profile/`, `memory.db`, or any session/auth files
- Do not add document/markdown management (ADR-0007 — out of scope)

## Related repos

- **skills repo** (`../skills/agent-desk/`) — skill that teaches agents how to use this API
- **browser-automation skill** (`../skills/browser-automation/`) — skill for browser control via playwright-cli
