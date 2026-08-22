# ADR-0006: Custom task states (user-defined)

- **Status:** Accepted
- **Date:** 2025-08-22

## Context

agent-desk is a template for any type of agent. Fixed states (todo/doing/done) don't cover CRM, research, project management, or other workflows.

## Decision

Task states are user-defined via `agentAPI.config`. Default states: `backlog`, `todo`, `in-progress`, `done`. Users can add, remove, reorder states. Kanban columns are generated from configured states.

## Consequences

- Kanban adapts to any workflow.
- Onboarding (in `AGENTS.md` of the agent repo) can ask the user to define their flow.
- API accepts any string as status.
