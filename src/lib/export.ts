import { db } from "@/lib/db";
import type {
  TaskRecord,
  EventRecord,
  SessionRecord,
  LinkRecord,
  ConfigRecord,
} from "@/lib/db";
import { nowISO } from "@/lib/utils";
import {
  cache,
  cacheAddTask,
  cacheAddEvent,
  cacheAddSession,
  cacheAddLink,
  cacheSetConfig,
  reindexAll,
  resetCache,
} from "@/api/cache";

/**
 * Snapshot format for export/import. Bump `version` on breaking schema
 * changes and handle migrations in `importSnapshot`.
 */
export interface ExportSnapshot {
  version: 1;
  exportedAt: string;
  app: "agent-desk";
  tasks: TaskRecord[];
  events: EventRecord[];
  sessions: SessionRecord[];
  links: LinkRecord[];
  config: ConfigRecord[];
}

export const EXPORT_VERSION = 1;

/**
 * Build a JSON-serializable snapshot of all IndexedDB data from the
 * in-memory cache. Sync, no I/O.
 */
export function buildSnapshot(): ExportSnapshot {
  return {
    version: EXPORT_VERSION,
    exportedAt: nowISO(),
    app: "agent-desk",
    tasks: Array.from(cache.tasks.values()),
    events: Array.from(cache.events.values()),
    sessions: Array.from(cache.sessions.values()),
    links: Array.from(cache.links.values()),
    config: Array.from(cache.config.entries()).map(([key, value]) => ({
      key,
      value,
    })),
  };
}

/** Serialize the current snapshot to a pretty-printed JSON string. */
export function snapshotToJSON(snapshot: ExportSnapshot = buildSnapshot()): string {
  return JSON.stringify(snapshot, null, 2);
}

export interface ImportResult {
  imported: { tasks: number; events: number; sessions: number; links: number; config: number };
  replaced: boolean;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isRecordArray<T>(v: unknown, check: (item: unknown) => item is T): v is T[] {
  return Array.isArray(v) && v.every(check);
}

function isTaskRecord(v: unknown): v is TaskRecord {
  if (!isObject(v)) return false;
  return (
    typeof v.id === "string" &&
    typeof v.title === "string" &&
    typeof v.status === "string" &&
    typeof v.createdAt === "string" &&
    typeof v.updatedAt === "string"
  );
}

function isEventRecord(v: unknown): v is EventRecord {
  if (!isObject(v)) return false;
  return (
    typeof v.id === "string" &&
    typeof v.title === "string" &&
    typeof v.start === "string" &&
    typeof v.end === "string"
  );
}

function isSessionRecord(v: unknown): v is SessionRecord {
  if (!isObject(v)) return false;
  return (
    typeof v.id === "string" &&
    typeof v.startedAt === "string" &&
    (v.endedAt === null || typeof v.endedAt === "string")
  );
}

function isLinkRecord(v: unknown): v is LinkRecord {
  if (!isObject(v)) return false;
  return (
    typeof v.id === "string" &&
    typeof v.from === "string" &&
    typeof v.to === "string" &&
    typeof v.type === "string"
  );
}

function isConfigRecord(v: unknown): v is ConfigRecord {
  if (!isObject(v)) return false;
  return typeof v.key === "string" && "value" in v;
}

/**
 * Validate and apply a snapshot. Replaces all data in cache and IndexedDB.
 * Throws on invalid shape or unsupported version.
 */
export async function importSnapshot(input: unknown): Promise<ImportResult> {
  if (!isObject(input)) {
    throw new Error("Invalid snapshot: expected an object");
  }
  if (input.version !== EXPORT_VERSION) {
    throw new Error(
      `Unsupported snapshot version: ${String(input.version)} (expected ${EXPORT_VERSION})`
    );
  }
  if (input.app !== "agent-desk") {
    throw new Error(`Invalid snapshot: app mismatch (${String(input.app)})`);
  }

  const tasks = isRecordArray(input.tasks, isTaskRecord)
    ? input.tasks
    : throwInvalid("tasks");
  const events = isRecordArray(input.events, isEventRecord)
    ? input.events
    : throwInvalid("events");
  const sessions = isRecordArray(input.sessions, isSessionRecord)
    ? input.sessions
    : throwInvalid("sessions");
  const links = isRecordArray(input.links, isLinkRecord)
    ? input.links
    : throwInvalid("links");
  const config = isRecordArray(input.config, isConfigRecord)
    ? input.config
    : throwInvalid("config");

  // Wipe cache + DB, then repopulate.
  resetCache();
  await Promise.all([
    db.tasks.clear(),
    db.events.clear(),
    db.sessions.clear(),
    db.links.clear(),
    db.config.clear(),
  ]);

  for (const t of tasks) cacheAddTask(t);
  for (const e of events) cacheAddEvent(e);
  for (const s of sessions) cacheAddSession(s);
  for (const l of links) cacheAddLink(l);
  for (const c of config) cacheSetConfig(c.key, c.value);

  reindexAll();
  cache.loaded = true;

  await Promise.all([
    db.tasks.bulkPut(tasks),
    db.events.bulkPut(events),
    db.sessions.bulkPut(sessions),
    db.links.bulkPut(links),
    db.config.bulkPut(config),
  ]);

  return {
    imported: {
      tasks: tasks.length,
      events: events.length,
      sessions: sessions.length,
      links: links.length,
      config: config.length,
    },
    replaced: true,
  };
}

function throwInvalid(field: string): never {
  throw new Error(`Invalid snapshot: field "${field}" has wrong shape`);
}

/**
 * Trigger a browser download of the snapshot as a JSON file.
 * No-op outside the browser. Returns the filename used.
 */
export function downloadSnapshot(snapshot: ExportSnapshot = buildSnapshot()): string {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return "";
  }
  const json = snapshotToJSON(snapshot);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const stamp = snapshot.exportedAt.replace(/[:.]/g, "-");
  const filename = `agent-desk-backup-${stamp}.json`;
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.setAttribute("data-testid", "export-download-link");
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return filename;
}
