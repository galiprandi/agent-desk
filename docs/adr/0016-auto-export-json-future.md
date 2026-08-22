# ADR-0016: Auto-export to JSON as nice-to-have (future)

- **Status:** Deferred
- **Date:** 2025-08-22

## Context

IndexedDB data is tied to the browser profile. If the profile is corrupted or deleted, all data is lost. User accepts data loss risk over leak risk.

## Decision

Auto-export of IndexedDB to a gitignored JSON file is a nice-to-have for a future iteration. Not in initial scope. The export would be local-only (no upload, no leak risk).

## Consequences

- Initial version has data loss risk if profile is lost. Accepted trade-off.
- Future issue to implement automatic periodic export.
