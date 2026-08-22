# ADR-0005: Sync window.agentAPI with 6 namespaces

- **Status:** Accepted
- **Date:** 2025-08-22

## Context

Agents need a stable, predictable API to manage tasks, events, sessions, search, links, and config. API names should be self-documenting to reduce LLM hallucination.

## Decision

`window.agentAPI` exposes 6 sync namespaces:

- **tasks** — CRUD + filters
- **events** — CRUD + date ranges
- **session** — start/end/get
- **search** — global via FlexSearch
- **links** — create/delete/list relationships
- **config** — get/set custom states and preferences

All methods return values directly, not Promises.

## Consequences

- Agents can call `agentAPI.tasks.list({status:'todo'})` and get results immediately.
- API is the contract between agent and app — breaking changes require versioning.
- FlexSearch provides full-text search over in-memory cache.
