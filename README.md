# agent-desk

A static SPA that serves as a dashboard / homepage for AI agents. Agents
interact with it through `window.agentAPI` (a synchronous API) using browser
`eval`. Humans use the same UI to view and curate data. All data lives in
IndexedDB (browser profile) and is never committed to the repo.

## Stack

- Vite + React + TypeScript
- TanStack Router (hash history), TanStack Table, TanStack Query
- Tailwind CSS + shadcn/ui (dark + light theme)
- Dexie.js (IndexedDB) with an in-memory cache
- @dnd-kit (kanban drag-and-drop)
- FlexSearch (full-text search)
- react-i18next (ES / EN)
- Vitest + Testing Library

## API

The agent API is exposed on `window.agentAPI` once `window.agentAPIReady` is
`true`. It is fully synchronous (reads from the in-memory cache, writes update
both cache and IndexedDB). Namespaces: `tasks`, `events`, `session`, `links`,
`config`, and `search`.

> The full API reference lives in a separate skill repo.

## Local development

```bash
pnpm install
pnpm dev      # start dev server
pnpm test     # run tests
pnpm build    # production build
```

## Deploy to GitHub Pages

1. Create the `agent-desk` repo on GitHub and push this code to `main`.
2. In the repo settings: **Settings → Pages → Build and deployment → Source**,
   choose **GitHub Actions**.
3. Push to `main`. The workflow in `.github/workflows/deploy.yml` runs tests,
   builds, and deploys to GitHub Pages automatically.
4. The site will be published at
   `https://<username>.github.io/agent-desk/`.

`vite.config.ts` uses `base: "./"` so assets resolve correctly under the
GitHub Pages subpath.

## Set as browser homepage (for agent usage)

Configure your browser's homepage / new-tab page to the deployed URL:

```
https://<username>.github.io/agent-desk/
```

Agents can then drive the dashboard via `window.agentAPI` through `eval`.
