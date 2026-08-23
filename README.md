# agent-desk

A static SPA that serves as a **dashboard and homepage for AI agents**. Agents interact with it through `window.agentAPI` (a synchronous API) using browser `eval` via playwright-cli. Humans use the same UI to view and curate data. All data lives in IndexedDB (browser profile) and is never committed to the repo.

## Why

AI agents that operate browsers (via playwright-cli, browser-automation skills, etc.) need a persistent workspace to manage tasks, events, and session continuity. Existing tools (Notion, Linear, Trello) require auth, have fragile DOMs, and aren't designed for agent consumption.

agent-desk solves this by being:
- **Agent-first**: the API is the primary interface, the UI is a human view on top
- **Zero-backend**: static SPA on GitHub Pages, no server, no auth, no database
- **Profile-isolated**: data lives in the browser profile (gitignored, local, never uploaded)
- **LLM-friendly**: sync API, data-testid on all elements, hidden API instructions in the DOM

## How it works

```
┌─────────────────────────────────────────────────────┐
│  Browser (playwright-cli)                           │
│                                                     │
│  ┌─────────────┐    ┌──────────────────────────┐   │
│  │  AI Agent   │───▶│  window.agentAPI (sync)  │   │
│  │  (LLM)      │    │  tasks, events, session, │   │
│  │             │    │  links, config, search   │   │
│  └─────────────┘    └──────────┬───────────────┘   │
│                                │                    │
│                     ┌──────────▼───────────────┐   │
│                     │  In-memory cache         │   │
│                     │  (sync reads)            │   │
│                     └──────────┬───────────────┘   │
│                                │                    │
│                     ┌──────────▼───────────────┐   │
│                     │  Dexie.js / IndexedDB    │   │
│                     │  (persistent storage)    │   │
│                     └──────────────────────────┘   │
│                                                     │
│  ┌─────────────┐    ┌──────────────────────────┐   │
│  │  Human      │───▶│  React UI (Dashboard,    │   │
│  │             │    │  Tasks, Calendar)        │   │
│  └─────────────┘    └──────────────────────────┘   │
│                                                     │
│  Profile: .browser-profile/ (gitignored, local)    │
└─────────────────────────────────────────────────────┘
```

The agent and the human share the same data. The agent writes via `eval` calls to `window.agentAPI`. The human sees the results in the UI. Both operate on the same browser profile.

## Stack

- **Vite 8** + **React 19** + **TypeScript** — build tooling and UI
- **TanStack Router** (hash history) — SPA routing for GitHub Pages
- **TanStack Table** — task list view
- **TanStack Query** — UI cache and invalidation
- **Tailwind CSS 4** + **shadcn/ui** — styling and accessible components
- **Dexie.js** — IndexedDB wrapper with in-memory cache for sync API
- **@dnd-kit** — kanban drag-and-drop
- **FlexSearch** — full-text search (vendored, see ADR-0004)
- **react-i18next** — bilingual UI (ES/EN)
- **Vitest** + **Testing Library** — unit tests (103 tests)

## API

The agent API is exposed on `window.agentAPI` once `window.agentAPIReady` is `true`. It is fully synchronous — reads from the in-memory cache, writes update both cache and IndexedDB.

| Namespace | Purpose | Example |
|-----------|---------|---------|
| `tasks` | CRUD + filters + search | `agentAPI.tasks.create({title: "Write docs"})` |
| `events` | CRUD + date range queries | `agentAPI.events.create({title: "Meeting", start: "2026-01-01T10:00:00Z"})` |
| `session` | Start/end/get work sessions | `agentAPI.session.start({summary: "Working on X"})` |
| `links` | Relationships between entities | `agentAPI.links.create({from: taskId, to: eventId, type: "scheduled-for"})` |
| `config` | Custom states and preferences | `agentAPI.config.set("taskStates", ["backlog", "triage", "done"])` |
| `search` | Global full-text search | `agentAPI.search("project alpha")` |

> The full API reference lives in the [agent-desk skill](https://github.com/galiprandi/skills/tree/main/agent-desk).

## Views

| View | Route | What it shows |
|------|-------|---------------|
| Dashboard | `#/` | Tasks requiring attention, upcoming events, last session summary, active tasks |
| Tasks | `#/tasks` | Kanban board (custom states, drag-and-drop) + list view (TanStack Table) |
| Calendar | `#/calendar` | Month/week/day views with events |

Each view includes hidden LLM instructions at the bottom (`data-testid="llm-instructions"`) with API examples and use cases. These are invisible to humans but readable by agents via snapshot/eval.

## Local development

```bash
pnpm install
pnpm dev      # start dev server (http://localhost:5174)
pnpm test     # run 103 tests
pnpm build    # production build to dist/
```

## Deploy to GitHub Pages

1. Fork or clone this repo to your GitHub account.
2. In repo settings: **Settings → Pages → Build and deployment → Source**, choose **GitHub Actions**.
3. Push to `main`. The workflow in `.github/workflows/deploy.yml` runs tests, builds, and deploys automatically.
4. The site publishes at `https://<username>.github.io/agent-desk/`.

`vite.config.ts` uses `base: "./"` so assets resolve correctly under the GitHub Pages subpath.

## Set as browser homepage (for agent usage)

Configure your browser's homepage to the deployed URL:

```
https://<username>.github.io/agent-desk/
```

When using with the [browser-automation skill](https://github.com/galiprandi/skills/tree/main/browser-automation), set this URL as the browser's start page. The agent opens the browser, the dashboard loads, and `window.agentAPI` is ready for interaction.

## Architecture decisions

All design decisions are documented as ADRs in [`docs/adr/`](docs/adr/). Key decisions:

- [ADR-0001](docs/adr/0001-static-spa-github-pages.md) — Static SPA, no backend
- [ADR-0004](docs/adr/0004-dexie-in-memory-cache.md) — Dexie + in-memory cache for sync API
- [ADR-0005](docs/adr/0005-sync-agent-api-namespaces.md) — 6 sync namespaces
- [ADR-0013](docs/adr/0013-playwright-friendly-dom.md) — Playwright-friendly DOM
- [ADR-0014](docs/adr/0014-llm-instructions-in-dom.md) — Hidden LLM instructions in DOM

## Project structure

```
agent-desk/
├── src/
│   ├── api/           # agentAPI implementation (namespaces, cache, Dexie)
│   ├── components/    # shadcn/ui + custom (Header, KanbanBoard, dialogs)
│   ├── views/         # Dashboard, TasksView, CalendarView
│   ├── hooks/         # useTheme, useLanguage, useApiRefresh, useTaskStates
│   ├── i18n/          # ES/EN translations
│   ├── lib/           # db.ts (Dexie schema), utils
│   ├── vendor/        # vendored flexsearch (avoids Rolldown dep issue)
│   └── router.tsx     # TanStack Router with lazy-loaded routes
├── tests/             # Vitest API tests (103 tests)
├── docs/adr/          # Architecture Decision Records (16 ADRs)
├── .github/workflows/ # GH Actions: test → build → deploy
└── public/            # favicon
```

## Data safety

- All data lives in the browser's IndexedDB, scoped to the GitHub Pages origin
- The browser profile (`.browser-profile/`) is gitignored and never committed
- No data is sent to any server — the app is 100% client-side
- If the browser profile is deleted, data is lost (accepted trade-off, see ADR-0008)
- Auto-export to JSON is planned as a future enhancement (ADR-0016, [Issue #1](https://github.com/galiprandi/agent-desk/issues/1))

## License

MIT
