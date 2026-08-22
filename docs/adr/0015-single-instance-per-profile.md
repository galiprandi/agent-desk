# ADR-0015: Single instance per profile

- **Status:** Accepted
- **Date:** 2025-08-22

## Context

Considered multiple workspaces within one app instance. Each agent has its own browser profile, already isolated.

## Decision

One instance per browser profile. No workspace switching. If an agent needs to separate projects, use tags or links on tasks.

## Consequences

- Simpler UI and API.
- No namespace collision risk.
- Each agent/profile pair is fully isolated.
