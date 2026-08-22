# ADR-0010: Session lifecycle with beforeunload safety

- **Status:** Accepted
- **Date:** 2025-08-22

## Context

Agents need continuity between sessions. If an agent crashes or the browser closes unexpectedly, the session record is left incomplete.

## Decision

- `agentAPI.session.start()` creates a session with `startedAt`.
- `agentAPI.session.end()` sets `endedAt` and `summary`.
- `beforeunload` event auto-saves session end.
- On app start, if a session has `endedAt=null`, mark it as interrupted (set `endedAt` to now, append `"[interrupted]"` to summary).
- Dashboard shows last session summary.

## Consequences

- Sessions are always closed (either explicitly or auto).
- Interrupted sessions are visible.
- Agent can see what was in progress last time.
