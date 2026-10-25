# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary user is an **AI agent** operating a browser through playwright-cli in an isolated session with its own dedicated browser profile. The agent lands on agent-desk as its homepage/workspace and interacts via `window.agentAPI` (synchronous) through `eval`. A human may also view and curate the same data through the React UI, but the agent is the design target: the API is the primary interface, the UI is a human view on top of the same data.

Each agent runs in its own playwright session with its own profile, so the data one agent produces must never leak into another agent's profile or any external surface.

## Product Purpose

Give AI agents that operate browsers a persistent, agent-first workspace to manage tasks, events, session continuity, and entity relationships. Existing tools (Notion, Linear, Trello) require auth, have fragile DOMs, and are not designed for agent consumption. agent-desk exists so an agent has a stable, scrape-free, sync-API surface to read and write its own working state, with a human-readable view of the same data.

Success means an agent can, through `window.agentAPI` alone, run a full work session: track tasks across custom states, log events, start/end sessions, link entities, search everything, and persist it all locally without any server round-trip.

## Positioning

Agent-first, zero-backend, profile-isolated. The API is the primary interface and is fully synchronous (reads from an in-memory cache, writes update cache and IndexedDB). No neighboring product is built around the premise that the browser itself is the agent's persistence layer and the DOM is an LLM-readable control surface.

## Operating Context

- Agents reach the app as their browser start page during a playwright-cli session.
- All data lives in IndexedDB scoped to the GitHub Pages origin inside the agent's browser profile (`.browser-profile/`, gitignored, local, never uploaded).
- The agent consumes hidden LLM instructions at `[data-testid="llm-instructions"]` and interacts through `eval` of `window.agentAPI`; it does not scrape the DOM.
- A human may open the same profile's UI to inspect or curate what the agent produced.
- Deploy target is GitHub Pages (static, no backend); `vite.config.ts` uses `base: "./"` for the subpath.

## Capabilities and Constraints

- **7 sync API namespaces** on `window.agentAPI`: `tasks`, `events`, `session`, `links`, `config`, `search`, `export`. All methods return values, not Promises. Sole async exception: `agentAPI.export.import()` (writes to Dexie).
- **Views:** Dashboard (`#/`), Tasks (`#/tasks`, kanban + list), Calendar (`#/calendar`), Shortcuts (`#/shortcuts`).
- **Custom task states** are user-configurable via `agentAPI.config` (ADR-0006).
- **Reminders are tasks with a due date** (ADR-0012); **backlinks** relate entities (ADR-0011).
- **Session lifecycle** ties to `beforeunload` (ADR-0010); single instance per profile (ADR-0015).
- **Bilingual UI** ES/EN via react-i18next (ADR-0009).
- **Keyboard shortcuts** via `@tanstack/react-hotkeys`, central registry in `src/lib/shortcuts.ts`, `?` opens `/shortcuts` (ADR-0017).
- **Hard constraints:** no backend, no auth, no server-side code; no document/markdown management (ADR-0007); FlexSearch is vendored at `src/vendor/flexsearch.min.js` (do not reinstall as a dependency); data must never leave the browser profile.
- **Open decision:** auto-export to JSON is planned but not built (ADR-0016, Issue #1).

## Brand Commitments

- Name: **agent-desk** (fixed).
- No logo, voice, or visual identity is committed. The visual world is open for later new-work to decide.

## Evidence on Hand

- README.md (architecture, API table, views, deploy, data safety).
- 17 ADRs in `docs/adr/` documenting every architectural decision.
- 131 unit tests (Vitest + fake-indexeddb) covering the API and cache.
- Working implementation: `src/api/agentAPI.ts`, `src/api/cache.ts`, `src/views/*`, `src/components/*`.
- No testimonials, customers, benchmarks, or marketing claims exist; future work must not fabricate any.

## Product Principles

1. **Agent-first.** The API is the product; the UI is a view on the same data. Every feature must be reachable through `window.agentAPI`, never DOM-only.
2. **Local-only by design.** Data stays in the agent's browser profile. No server, no sync, no upload. Leakage across profiles or to any external surface is a defect.
3. **Sync over async.** The agent reads and writes synchronously against an in-memory cache; persistence to IndexedDB is an implementation detail, not the API contract.
4. **LLM-readable, not scraped.** Interactive elements carry `data-testid`; hidden LLM instructions live in the DOM. Agents use the API and testids, never fragile DOM scraping.
5. **Static and forkable.** Ship as a static SPA on GitHub Pages so any agent/dev can fork, deploy, and run their own isolated workspace.

## Accessibility & Inclusion

ADR-0013 conventions: `data-testid` on all interactive elements, `aria-label` on interactive elements without visible text. No formal accessibility standard is required beyond these agent-consumption conventions; the human view is secondary to the agent API surface.
