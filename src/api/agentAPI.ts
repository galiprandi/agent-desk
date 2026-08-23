import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/db";
import type {
  TaskRecord,
  EventRecord,
  SessionRecord,
  LinkRecord,
} from "@/lib/db";
import { nowISO } from "@/lib/utils";
import {
  cache,
  cacheAddTask,
  cacheUpdateTask,
  cacheRemoveTask,
  cacheAddEvent,
  cacheUpdateEvent,
  cacheRemoveEvent,
  cacheAddSession,
  cacheUpdateSession,
  cacheAddLink,
  cacheRemoveLink,
  cacheSetConfig,
  cacheGetConfig,
  taskIndex,
  eventIndex,
  sessionIndex,
  searchIds,
  loadCache,
  resetCache,
} from "./cache";
import { notifyApiChange } from "@/hooks/useApiRefresh";
import {
  buildSnapshot,
  snapshotToJSON,
  importSnapshot,
  downloadSnapshot,
  type ExportSnapshot,
  type ImportResult,
} from "@/lib/export";

export const DEFAULT_TASK_STATES = ["backlog", "todo", "in-progress", "done"];

// ----- Types -----

export interface TaskCreateInput {
  title: string;
  description?: string;
  status?: string;
  priority?: TaskRecord["priority"];
  dueDate?: string | null;
  tags?: string[];
  links?: string[];
}

export interface TaskUpdateInput {
  title?: string;
  description?: string;
  status?: string;
  priority?: TaskRecord["priority"];
  dueDate?: string | null;
  tags?: string[];
  links?: string[];
}

export interface TaskListFilter {
  status?: string;
  priority?: TaskRecord["priority"];
  tag?: string;
  dueBefore?: string;
  dueAfter?: string;
}

export interface EventCreateInput {
  title: string;
  description?: string;
  start: string;
  end?: string;
  allDay?: boolean;
  location?: string;
  links?: string[];
}

export interface EventUpdateInput {
  title?: string;
  description?: string;
  start?: string;
  end?: string;
  allDay?: boolean;
  location?: string;
  links?: string[];
}

export interface EventListFilter {
  from?: string;
  to?: string;
}

export interface LinkCreateInput {
  from: string;
  to: string;
  type: string;
}

export interface LinkListFilter {
  from?: string;
  to?: string;
}

// ----- Tasks namespace -----

export const tasksAPI = {
  create(input: TaskCreateInput): TaskRecord {
    const now = nowISO();
    const task: TaskRecord = {
      id: uuidv4(),
      title: input.title,
      description: input.description ?? "",
      status: input.status ?? "backlog",
      priority: input.priority ?? "medium",
      dueDate: input.dueDate ?? null,
      tags: input.tags ?? [],
      links: input.links ?? [],
      createdAt: now,
      updatedAt: now,
    };
    cacheAddTask(task);
    // fire-and-forget persistence
    void db.tasks.put(task);
    notifyApiChange();
    return task;
  },

  update(id: string, patch: TaskUpdateInput): TaskRecord | null {
    const existing = cache.tasks.get(id);
    if (!existing) return null;
    const updated: TaskRecord = {
      ...existing,
      ...patch,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: nowISO(),
    };
    cacheUpdateTask(id, updated);
    void db.tasks.put(updated);
    notifyApiChange();
    return updated;
  },

  delete(id: string): boolean {
    if (!cache.tasks.has(id)) return false;
    cacheRemoveTask(id);
    void db.tasks.delete(id);
    notifyApiChange();
    return true;
  },

  get(id: string): TaskRecord | null {
    return cache.tasks.get(id) ?? null;
  },

  list(filter: TaskListFilter = {}): TaskRecord[] {
    let result = Array.from(cache.tasks.values());
    if (filter.status) result = result.filter((t) => t.status === filter.status);
    if (filter.priority)
      result = result.filter((t) => t.priority === filter.priority);
    if (filter.tag) result = result.filter((t) => t.tags.includes(filter.tag!));
    if (filter.dueBefore)
      result = result.filter(
        (t) => t.dueDate !== null && t.dueDate <= filter.dueBefore!
      );
    if (filter.dueAfter)
      result = result.filter(
        (t) => t.dueDate !== null && t.dueDate >= filter.dueAfter!
      );
    return result;
  },

  search(query: string): TaskRecord[] {
    const ids = searchIds(taskIndex, query);
    return ids
      .map((id) => cache.tasks.get(id))
      .filter((t): t is TaskRecord => Boolean(t));
  },
};

// ----- Events namespace -----

export const eventsAPI = {
  create(input: EventCreateInput): EventRecord {
    const now = nowISO();
    const event: EventRecord = {
      id: uuidv4(),
      title: input.title,
      description: input.description ?? "",
      start: input.start,
      end: input.end ?? input.start,
      allDay: input.allDay ?? false,
      location: input.location ?? "",
      links: input.links ?? [],
      createdAt: now,
      updatedAt: now,
    };
    cacheAddEvent(event);
    void db.events.put(event);
    notifyApiChange();
    return event;
  },

  update(id: string, patch: EventUpdateInput): EventRecord | null {
    const existing = cache.events.get(id);
    if (!existing) return null;
    const updated: EventRecord = {
      ...existing,
      ...patch,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: nowISO(),
    };
    cacheUpdateEvent(id, updated);
    void db.events.put(updated);
    notifyApiChange();
    return updated;
  },

  delete(id: string): boolean {
    if (!cache.events.has(id)) return false;
    cacheRemoveEvent(id);
    void db.events.delete(id);
    notifyApiChange();
    return true;
  },

  get(id: string): EventRecord | null {
    return cache.events.get(id) ?? null;
  },

  list(filter: EventListFilter = {}): EventRecord[] {
    let result = Array.from(cache.events.values());
    if (filter.from) result = result.filter((e) => e.start >= filter.from!);
    if (filter.to) result = result.filter((e) => e.start <= filter.to!);
    result.sort((a, b) => a.start.localeCompare(b.start));
    return result;
  },
};

// ----- Session namespace -----

export const sessionAPI = {
  start(input: { summary?: string } = {}): SessionRecord {
    const session: SessionRecord = {
      id: uuidv4(),
      summary: input.summary ?? "",
      startedAt: nowISO(),
      endedAt: null,
    };
    cacheAddSession(session);
    void db.sessions.put(session);
    notifyApiChange();
    return session;
  },

  end(input: { summary?: string } = {}): SessionRecord | null {
    // find the most recent open session
    const open = Array.from(cache.sessions.values())
      .filter((s) => s.endedAt === null)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
    if (!open) return null;
    const updated: SessionRecord = {
      ...open,
      summary: input.summary ?? open.summary,
      endedAt: nowISO(),
    };
    cacheUpdateSession(open.id, updated);
    void db.sessions.put(updated);
    notifyApiChange();
    return updated;
  },

  get(): SessionRecord | null {
    const all = Array.from(cache.sessions.values()).sort((a, b) => {
      const byStart = b.startedAt.localeCompare(a.startedAt);
      if (byStart !== 0) return byStart;
      // tiebreak: open sessions (endedAt null) first, then latest endedAt
      const aEnd = a.endedAt ?? "\uFFFF";
      const bEnd = b.endedAt ?? "\uFFFF";
      return bEnd.localeCompare(aEnd);
    });
    return all[0] ?? null;
  },
};

// ----- Links namespace -----

export const linksAPI = {
  create(input: LinkCreateInput): LinkRecord {
    const link: LinkRecord = {
      id: uuidv4(),
      from: input.from,
      to: input.to,
      type: input.type,
      createdAt: nowISO(),
    };
    cacheAddLink(link);
    void db.links.put(link);
    notifyApiChange();
    return link;
  },

  delete(id: string): boolean {
    if (!cache.links.has(id)) return false;
    cacheRemoveLink(id);
    void db.links.delete(id);
    notifyApiChange();
    return true;
  },

  list(filter: LinkListFilter = {}): LinkRecord[] {
    let result = Array.from(cache.links.values());
    if (filter.from) result = result.filter((l) => l.from === filter.from);
    if (filter.to) result = result.filter((l) => l.to === filter.to);
    return result;
  },
};

// ----- Config namespace -----

export const configAPI = {
  get(key: string): unknown {
    return cacheGetConfig(key);
  },

  set(key: string, value: unknown): void {
    cacheSetConfig(key, value);
    void db.config.put({ key, value });
    notifyApiChange();
  },
};

// ----- Export namespace -----
//
// Sync snapshot of all data (read from cache). `import` is async because it
// writes to IndexedDB; this is the only async method on agentAPI and is
// documented as such. See ADR-0016.

export const exportAPI = {
  /** Build a JSON-serializable snapshot of all data (sync, from cache). */
  all(): ExportSnapshot {
    return buildSnapshot();
  },

  /** Pretty-printed JSON string of the current snapshot. */
  toJSON(): string {
    return snapshotToJSON();
  },

  /**
   * Restore from a snapshot. Validates schema + version, then replaces all
   * data in cache and IndexedDB. Resolves with per-table counts.
   */
  import(input: unknown): Promise<ImportResult> {
    return importSnapshot(input).then((result) => {
      notifyApiChange();
      return result;
    });
  },

  /**
   * Trigger a browser download of the snapshot as a JSON file. No-op outside
   * the browser. Returns the filename used (or "" if no DOM).
   */
  download(snapshot: ExportSnapshot = buildSnapshot()): string {
    return downloadSnapshot(snapshot);
  },
};

// ----- Global search -----

export interface GlobalSearchResult {
  tasks: TaskRecord[];
  events: EventRecord[];
  sessions: SessionRecord[];
}

export function globalSearch(query: string): GlobalSearchResult {
  if (!query) return { tasks: [], events: [], sessions: [] };
  const taskIds = searchIds(taskIndex, query);
  const eventIds = searchIds(eventIndex, query);
  const sessionIds = searchIds(sessionIndex, query);
  return {
    tasks: taskIds
      .map((id) => cache.tasks.get(id))
      .filter((t): t is TaskRecord => Boolean(t)),
    events: eventIds
      .map((id) => cache.events.get(id))
      .filter((e): e is EventRecord => Boolean(e)),
    sessions: sessionIds
      .map((id) => cache.sessions.get(id))
      .filter((s): s is SessionRecord => Boolean(s)),
  };
}

// ----- Agent API object -----

export interface AgentAPI {
  tasks: typeof tasksAPI;
  events: typeof eventsAPI;
  session: typeof sessionAPI;
  links: typeof linksAPI;
  config: typeof configAPI;
  search: typeof globalSearch;
  export: typeof exportAPI;
}

export const agentAPI: AgentAPI = {
  tasks: tasksAPI,
  events: eventsAPI,
  session: sessionAPI,
  links: linksAPI,
  config: configAPI,
  search: globalSearch,
  export: exportAPI,
};

// ----- Initialization -----

/**
 * Mark any open session (endedAt === null) as interrupted on app start.
 * Sets endedAt to now and appends "[interrupted]" to the summary.
 */
async function markInterruptedSessions(): Promise<void> {
  // Dexie can't index null reliably; scan the in-memory cache after load.
  const openSessions = Array.from(cache.sessions.values()).filter(
    (s) => s.endedAt === null
  );
  for (const s of openSessions) {
    const updated: SessionRecord = {
      ...s,
      summary: s.summary ? `${s.summary} [interrupted]` : "[interrupted]",
      endedAt: nowISO(),
    };
    cacheUpdateSession(s.id, updated);
    void db.sessions.put(updated);
  }
}

/**
 * Initialize the agent API: load cache from IndexedDB, mark interrupted
 * sessions, ensure default config, and expose on window.
 */
export async function initAgentAPI(): Promise<void> {
  await loadCache();

  // ensure default task states config exists
  if (cacheGetConfig("taskStates") === undefined) {
    configAPI.set("taskStates", DEFAULT_TASK_STATES);
  }

  await markInterruptedSessions();

  // expose on window
  if (typeof window !== "undefined") {
    (window as any).agentAPI = agentAPI;
    (window as any).agentAPIReady = true;
  }
}

export { loadCache, resetCache };
