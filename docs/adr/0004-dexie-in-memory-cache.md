# ADR-0004: Dexie.js with in-memory cache for sync API

- **Status:** Accepted
- **Date:** 2025-08-22

## Context

The agent interacts via `window.agentAPI` which must be sync (agents struggle with Promises in eval). IndexedDB is inherently async. Need a bridge.

## Decision

Dexie.js manages IndexedDB (stores: `tasks`, `events`, `sessions`, `links`, `config`). On app start, load all data into an in-memory cache. API methods read sync from cache; writes update both cache and IndexedDB. `window.agentAPIReady` boolean signals when cache is loaded.

## Consequences

- API is sync and simple for agents.
- Memory usage scales with data volume (acceptable for personal agent use).
- Race condition on startup handled by `agentAPIReady` flag.
- If app crashes, in-memory cache is lost but IndexedDB persists.
