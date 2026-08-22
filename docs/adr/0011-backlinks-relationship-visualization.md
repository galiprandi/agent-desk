# ADR-0011: Backlinks for relationship visualization

- **Status:** Accepted
- **Date:** 2025-08-22

## Context

Considered visual graph (Obsidian-style) vs backlinks (list of links per entity). Visual graph adds rendering complexity without proportional value.

## Decision

Relationships (links) are shown as backlink lists within each task and event detail view. No separate graph view. `agentAPI.links` manages relationships; the UI displays them inline.

## Consequences

- Simpler UI, no graph rendering library needed.
- Agents navigate relationships via API.
- Visual graph could be added later if needed.
