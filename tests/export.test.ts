import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import {
  agentAPI,
  initAgentAPI,
  resetCache,
} from "@/api/agentAPI";
import { cache } from "@/api/cache";
import {
  buildSnapshot,
  snapshotToJSON,
  importSnapshot,
  downloadSnapshot,
  EXPORT_VERSION,
  type ExportSnapshot,
} from "@/lib/export";

async function freshInit() {
  await Promise.all([
    db.tasks.clear(),
    db.events.clear(),
    db.sessions.clear(),
    db.links.clear(),
    db.config.clear(),
  ]);
  resetCache();
  await initAgentAPI();
}

beforeEach(async () => {
  await freshInit();
});

describe("export namespace exposure", () => {
  it("exposes agentAPI.export with all, toJSON, import, download", () => {
    const api = (window as any).agentAPI;
    expect(api.export).toBeDefined();
    expect(typeof api.export.all).toBe("function");
    expect(typeof api.export.toJSON).toBe("function");
    expect(typeof api.export.import).toBe("function");
    expect(typeof api.export.download).toBe("function");
  });
});

describe("buildSnapshot / all()", () => {
  it("returns a snapshot with the current version and app marker", () => {
    const snap = agentAPI.export.all();
    expect(snap.version).toBe(EXPORT_VERSION);
    expect(snap.app).toBe("agent-desk");
    expect(typeof snap.exportedAt).toBe("string");
  });

  it("includes all tasks, events, sessions, links and config from the cache", () => {
    agentAPI.tasks.create({ title: "T1", tags: ["a"] });
    agentAPI.events.create({ title: "E1", start: "2026-08-23T10:00:00Z" });
    agentAPI.session.start({ summary: "S1" });
    agentAPI.links.create({ from: "x", to: "y", type: "rel" });

    const snap = agentAPI.export.all();
    expect(snap.tasks).toHaveLength(1);
    expect(snap.events).toHaveLength(1);
    expect(snap.sessions).toHaveLength(1);
    expect(snap.links).toHaveLength(1);
    // taskStates config is set by initAgentAPI
    expect(snap.config.length).toBeGreaterThan(0);
  });

  it("is synchronous (returns a value, not a Promise)", () => {
    const result = agentAPI.export.all();
    expect(result).not.toHaveProperty("then");
  });
});

describe("toJSON()", () => {
  it("returns a pretty-printed JSON string parseable back to the snapshot", () => {
    agentAPI.tasks.create({ title: "Parse me" });
    const json = agentAPI.export.toJSON();
    expect(typeof json).toBe("string");
    expect(json.includes("\n")).toBe(true);
    const parsed = JSON.parse(json) as ExportSnapshot;
    expect(parsed.version).toBe(EXPORT_VERSION);
    expect(parsed.tasks).toHaveLength(1);
    expect(parsed.tasks[0].title).toBe("Parse me");
  });
});

describe("import()", () => {
  it("replaces all data and returns per-table counts", async () => {
    agentAPI.tasks.create({ title: "Old task" });
    agentAPI.events.create({ title: "Old event", start: "2026-08-23T10:00:00Z" });

    const snap = agentAPI.export.all();
    // mutate the snapshot to a fresh dataset
    const fresh: ExportSnapshot = {
      ...snap,
      tasks: [
        {
          id: "imported-task-1",
          title: "Imported task",
          description: "",
          status: "todo",
          priority: "high",
          dueDate: null,
          tags: ["imported"],
          links: [],
          createdAt: "2026-08-23T00:00:00Z",
          updatedAt: "2026-08-23T00:00:00Z",
        },
      ],
      events: [],
      sessions: [],
      links: [],
      config: snap.config,
    };

    const result = await agentAPI.export.import(fresh);
    expect(result.replaced).toBe(true);
    expect(result.imported.tasks).toBe(1);
    expect(result.imported.events).toBe(0);

    // cache reflects the imported data
    expect(cache.tasks.size).toBe(1);
    expect(cache.tasks.get("imported-task-1")?.title).toBe("Imported task");
    expect(agentAPI.tasks.list()).toHaveLength(1);
    expect(agentAPI.events.list()).toHaveLength(0);

    // DB persisted
    const dbTasks = await db.tasks.toArray();
    expect(dbTasks).toHaveLength(1);
    expect(dbTasks[0].id).toBe("imported-task-1");
  });

  it("rejects an unsupported version", async () => {
    await expect(
      agentAPI.export.import({ version: 999, app: "agent-desk", tasks: [], events: [], sessions: [], links: [], config: [] })
    ).rejects.toThrow(/Unsupported snapshot version/);
  });

  it("rejects a wrong app marker", async () => {
    await expect(
      agentAPI.export.import({ version: EXPORT_VERSION, app: "other", tasks: [], events: [], sessions: [], links: [], config: [] })
    ).rejects.toThrow(/app mismatch/);
  });

  it("rejects a non-object input", async () => {
    await expect(agentAPI.export.import("not a snapshot")).rejects.toThrow(/expected an object/);
    await expect(agentAPI.export.import(null)).rejects.toThrow(/expected an object/);
  });

  it("rejects malformed task entries", async () => {
    const snap = agentAPI.export.all();
    await expect(
      agentAPI.export.import({ ...snap, tasks: [{ not: "a task" }] })
    ).rejects.toThrow(/field "tasks" has wrong shape/);
  });

  it("round-trips export -> import -> export identically (ignoring exportedAt)", async () => {
    agentAPI.tasks.create({ title: "Round trip", tags: ["x", "y"], priority: "urgent" });
    agentAPI.events.create({ title: "Ev", start: "2026-08-23T10:00:00Z", location: "Office" });
    agentAPI.session.start({ summary: "Round trip session" });
    const t = agentAPI.tasks.list()[0];
    agentAPI.links.create({ from: t.id, to: "other", type: "depends-on" });

    const snap1 = agentAPI.export.all();

    // wipe and reimport
    resetCache();
    await Promise.all([
      db.tasks.clear(),
      db.events.clear(),
      db.sessions.clear(),
      db.links.clear(),
      db.config.clear(),
    ]);
    await agentAPI.export.import(snap1);

    const snap2 = agentAPI.export.all();
    const { exportedAt: _1, ...rest1 } = snap1;
    const { exportedAt: _2, ...rest2 } = snap2;
    expect(rest2).toEqual(rest1);
  });
});

describe("importSnapshot (direct module fn)", () => {
  it("reindexes search after import", async () => {
    agentAPI.tasks.create({ title: "Searchable original" });
    const snap = agentAPI.export.all();
    const fresh: ExportSnapshot = {
      ...snap,
      tasks: [
        {
          id: "searchable-1",
          title: "Findable after import",
          description: "",
          status: "todo",
          priority: "medium",
          dueDate: null,
          tags: [],
          links: [],
          createdAt: "2026-08-23T00:00:00Z",
          updatedAt: "2026-08-23T00:00:00Z",
        },
      ],
    };
    await importSnapshot(fresh);
    const found = agentAPI.tasks.search("Findable");
    expect(found).toHaveLength(1);
    expect(found[0].id).toBe("searchable-1");
    // old data not findable
    expect(agentAPI.tasks.search("Searchable original")).toHaveLength(0);
  });
});

describe("downloadSnapshot", () => {
  it("creates an <a> with a download attribute and clicks it", () => {
    const clickSpy = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    const created: HTMLElement[] = [];

    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = originalCreateElement(tag);
      if (tag === "a") {
        el.click = clickSpy;
      }
      created.push(el);
      return el;
    });
    vi.spyOn(document.body, "appendChild").mockImplementation((node: Node) => node);
    vi.spyOn(document.body, "removeChild").mockImplementation((node: Node) => node);
    const revokeSpy = vi.fn();
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:fake"),
      revokeObjectURL: revokeSpy,
    });

    try {
      const filename = downloadSnapshot();
      expect(filename).toMatch(/^agent-desk-backup-.*\.json$/);
      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(revokeSpy).toHaveBeenCalledWith("blob:fake");
    } finally {
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
    }
  });

  it("agentAPI.export.download returns the filename", () => {
    const clickSpy = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = originalCreateElement(tag);
      if (tag === "a") el.click = clickSpy;
      return el;
    });
    vi.spyOn(document.body, "appendChild").mockImplementation((n: Node) => n);
    vi.spyOn(document.body, "removeChild").mockImplementation((n: Node) => n);
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:fake"),
      revokeObjectURL: vi.fn(),
    });
    try {
      const name = agentAPI.export.download();
      expect(name).toMatch(/\.json$/);
      expect(clickSpy).toHaveBeenCalledTimes(1);
    } finally {
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
    }
  });
});

describe("snapshotToJSON", () => {
  it("accepts a custom snapshot", () => {
    const snap: ExportSnapshot = {
      version: EXPORT_VERSION,
      app: "agent-desk",
      exportedAt: "2026-08-23T00:00:00.000Z",
      tasks: [],
      events: [],
      sessions: [],
      links: [],
      config: [],
    };
    const json = snapshotToJSON(snap);
    expect(JSON.parse(json)).toEqual(snap);
  });
});
