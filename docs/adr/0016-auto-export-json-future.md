# ADR-0016: Auto-export to JSON as nice-to-have (future)

- **Status:** Accepted (implemented 2026-08-23)
- **Date:** 2025-08-22

## Context

IndexedDB data is tied to the browser profile. If the profile is corrupted or deleted, all data is lost. User accepts data loss risk over leak risk.

## Decision

Auto-export of IndexedDB to a JSON backup is implemented as a local-only feature (no upload, no leak risk). It has three layers:

1. **Sync API** — `agentAPI.export.all()` returns a JSON-serializable snapshot of all data from the in-memory cache; `agentAPI.export.toJSON()` returns the pretty-printed string. These are sync, like the rest of the API, so agents can read a backup via `eval` without awaiting.
2. **Async import** — `agentAPI.export.import(snapshot)` validates the schema and version, then replaces all data in cache and IndexedDB. This is the **only async method** on `agentAPI` because it must write to Dexie; the exception is documented on the namespace and in this ADR.
3. **Silent periodic backup** — `useAutoExport` writes a snapshot to `localStorage` (`agent-desk-autosave`) on a configurable interval (`agentAPI.config.set("autoExportIntervalMs", ms)`, default 60s, 0 disables) and on `beforeunload`. This is a best-effort backup; quota errors are swallowed.

Manual UI controls live in the header `Data` dropdown: **Export backup** (browser download) and **Import backup** (file picker).

## Snapshot format

```ts
interface ExportSnapshot {
  version: 1;            // bump on breaking schema changes; handle in importSnapshot
  app: "agent-desk";
  exportedAt: string;    // ISO timestamp
  tasks: TaskRecord[];
  events: EventRecord[];
  sessions: SessionRecord[];
  links: LinkRecord[];
  config: ConfigRecord[];
}
```

`config` is serialized as `{ key, value }[]` (the Dexie shape), not as a map, so it round-trips through `JSON.stringify` without key coercion.

## Consequences

- Data loss risk is mitigated (not eliminated): the user can download a backup at any time, and a recent snapshot is kept in `localStorage`. `localStorage` is per-profile and shares the same loss risk as IndexedDB, so the download is the durable backup.
- `agentAPI.export.import` is the only async method on the otherwise-sync API. Agents that call it must `await` the result. This is a documented exception, not a precedent.
- No file-system writes happen automatically (browser sandbox). Agents with file tools can call `agentAPI.export.toJSON()` and write the string to disk themselves; humans use the download button.
- Import replaces all data — there is no merge. A future iteration could add merge semantics.
