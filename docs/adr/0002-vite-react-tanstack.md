# ADR-0002: Vite + React + TanStack ecosystem

- **Status:** Accepted
- **Date:** 2025-08-22

## Context

Need a modern, fast, well-supported frontend stack that handles client-side state, routing, tables, and async cache. App must build to static assets.

## Decision

- **Vite** as build tool.
- **React 18+** with TypeScript.
- **TanStack Router** (hash history) for routing.
- **TanStack Table** for task list view.
- **TanStack Query** for UI cache and invalidation after API writes.

## Consequences

- All TanStack libraries share consistent patterns (hooks, type safety).
- Bundle size is reasonable with Vite tree-shaking.
- Hash history means URLs look like `#/tasks` but work without server config.
