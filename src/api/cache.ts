import FlexSearch from "@/vendor/flexsearch.min.js";
import { db } from "@/lib/db";
import type {
  TaskRecord,
  EventRecord,
  SessionRecord,
  LinkRecord,
  ConfigRecord,
} from "@/lib/db";

export interface CacheState {
  tasks: Map<string, TaskRecord>;
  events: Map<string, EventRecord>;
  sessions: Map<string, SessionRecord>;
  links: Map<string, LinkRecord>;
  config: Map<string, unknown>;
  loaded: boolean;
}

export const cache: CacheState = {
  tasks: new Map(),
  events: new Map(),
  sessions: new Map(),
  links: new Map(),
  config: new Map(),
  loaded: false,
};

// FlexSearch Document indexes (full-text over multiple fields)
const { Document } = FlexSearch as any;
export const taskIndex: any = new Document({
  doc: { id: "id", field: ["title", "description"] },
});

export const eventIndex: any = new Document({
  doc: { id: "id", field: ["title", "description", "location"] },
});

export const sessionIndex: any = new Document({
  doc: { id: "id", field: ["summary"] },
});

function indexTask(task: TaskRecord) {
  (taskIndex as any).add(task);
}
function indexEvent(event: EventRecord) {
  (eventIndex as any).add(event);
}
function indexSession(session: SessionRecord) {
  (sessionIndex as any).add(session);
}

/**
 * Run a FlexSearch Document query and return deduplicated ids.
 * Document.search returns [{ field, result: [ids] }, ...] grouped by field.
 */
export function searchIds(index: any, query: string): string[] {
  if (!query) return [];
  const groups = index.search(query) as Array<{ field: string; result: string[] }>;
  const ids = new Set<string>();
  for (const g of groups) {
    for (const id of g.result) ids.add(id);
  }
  return Array.from(ids);
}

function clearIndex(index: any, ids: Iterable<string>) {
  for (const id of ids) {
    try {
      index.remove(id);
    } catch {
      // ignore missing
    }
  }
}

export function reindexAll() {
  clearIndex(taskIndex, cache.tasks.keys());
  clearIndex(eventIndex, cache.events.keys());
  clearIndex(sessionIndex, cache.sessions.keys());
  cache.tasks.forEach(indexTask);
  cache.events.forEach(indexEvent);
  cache.sessions.forEach(indexSession);
}

export async function loadCache(): Promise<void> {
  const [tasks, events, sessions, links, config] = await Promise.all([
    db.tasks.toArray(),
    db.events.toArray(),
    db.sessions.toArray(),
    db.links.toArray(),
    db.config.toArray(),
  ]);

  cache.tasks = new Map(tasks.map((t) => [t.id, t]));
  cache.events = new Map(events.map((e) => [e.id, e]));
  cache.sessions = new Map(sessions.map((s) => [s.id, s]));
  cache.links = new Map(links.map((l) => [l.id, l]));
  cache.config = new Map(config.map((c) => [c.key, c.value]));

  reindexAll();
  cache.loaded = true;
}

// --- Task cache ops ---
export function cacheAddTask(task: TaskRecord) {
  cache.tasks.set(task.id, task);
  indexTask(task);
}
export function cacheUpdateTask(id: string, patch: Partial<TaskRecord>) {
  const existing = cache.tasks.get(id);
  if (!existing) return;
  const updated = { ...existing, ...patch, id: existing.id };
  cache.tasks.set(id, updated);
  (taskIndex as any).update(updated);
}
export function cacheRemoveTask(id: string) {
  cache.tasks.delete(id);
  (taskIndex as any).remove(id);
}

// --- Event cache ops ---
export function cacheAddEvent(event: EventRecord) {
  cache.events.set(event.id, event);
  indexEvent(event);
}
export function cacheUpdateEvent(id: string, patch: Partial<EventRecord>) {
  const existing = cache.events.get(id);
  if (!existing) return;
  const updated = { ...existing, ...patch, id: existing.id };
  cache.events.set(id, updated);
  (eventIndex as any).update(updated);
}
export function cacheRemoveEvent(id: string) {
  cache.events.delete(id);
  (eventIndex as any).remove(id);
}

// --- Session cache ops ---
export function cacheAddSession(session: SessionRecord) {
  cache.sessions.set(session.id, session);
  indexSession(session);
}
export function cacheUpdateSession(id: string, patch: Partial<SessionRecord>) {
  const existing = cache.sessions.get(id);
  if (!existing) return;
  const updated = { ...existing, ...patch, id: existing.id };
  cache.sessions.set(id, updated);
  (sessionIndex as any).update(updated);
}

// --- Link cache ops ---
export function cacheAddLink(link: LinkRecord) {
  cache.links.set(link.id, link);
}
export function cacheRemoveLink(id: string) {
  cache.links.delete(id);
}

// --- Config cache ops ---
export function cacheSetConfig(key: string, value: unknown) {
  cache.config.set(key, value);
}
export function cacheGetConfig(key: string): unknown {
  return cache.config.get(key);
}

export function resetCache() {
  clearIndex(taskIndex, cache.tasks.keys());
  clearIndex(eventIndex, cache.events.keys());
  clearIndex(sessionIndex, cache.sessions.keys());
  cache.tasks.clear();
  cache.events.clear();
  cache.sessions.clear();
  cache.links.clear();
  cache.config.clear();
  cache.loaded = false;
}
