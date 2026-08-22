# ADR-0012: Reminders are tasks with dueDate

- **Status:** Accepted
- **Date:** 2025-08-22

## Context

Considered a separate reminders entity. Reminders are functionally tasks with a due date and time.

## Decision

No separate reminders entity. Tasks with `dueDate` are surfaced in the dashboard "Requiere atención" section when overdue or due today, sorted by priority. `agentAPI.tasks.list({dueBefore, dueAfter})` handles date-based queries.

## Consequences

- One entity less to manage.
- Dashboard logic determines what's urgent.
- API stays simpler.
