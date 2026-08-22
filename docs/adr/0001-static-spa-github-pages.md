# ADR-0001: Static SPA on GitHub Pages

- **Status:** Accepted
- **Date:** 2025-08-22

## Context

agent-desk needs to be deployable by anyone who clones the repo, with zero backend setup. The app serves as a dashboard/homepage for AI agents that interact via browser eval.

## Decision

Deploy as a static SPA on GitHub Pages. No backend, no server, no database external to the browser. GitHub Actions auto-deploys on push to `main`.

## Consequences

- All data lives in browser IndexedDB (profile-scoped, gitignored).
- No server-side features (no OAuth, no sync with external services).
- App must work offline after first load.
- Hash router required for SPA routing without 404 fallback.
