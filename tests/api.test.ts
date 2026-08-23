import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  agentAPI,
  initAgentAPI,
  DEFAULT_TASK_STATES,
  resetCache,
} from "@/api/agentAPI";
import { cache } from "@/api/cache";

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

describe("agentAPI exposure", () => {
  it("exposes window.agentAPI and sets agentAPIReady", async () => {
    expect((window as any).agentAPI).toBeDefined();
    expect((window as any).agentAPIReady).toBe(true);
  });

  it("has all 7 namespaces", () => {
    const api = (window as any).agentAPI;
    expect(api.tasks).toBeDefined();
    expect(api.events).toBeDefined();
    expect(api.session).toBeDefined();
    expect(api.links).toBeDefined();
    expect(api.config).toBeDefined();
    expect(api.search).toBeDefined();
    expect(api.export).toBeDefined();
  });
});

describe("tasks API", () => {
  it("creates a task with defaults and sync return", () => {
    const task = agentAPI.tasks.create({ title: "Write tests" });
    expect(task.id).toBeTruthy();
    expect(task.title).toBe("Write tests");
    expect(task.status).toBe("backlog");
    expect(task.priority).toBe("medium");
    expect(task.dueDate).toBeNull();
    expect(task.tags).toEqual([]);
    expect(task.createdAt).toBe(task.updatedAt);
  });

  it("get returns the created task", () => {
    const task = agentAPI.tasks.create({ title: "Get me" });
    expect(agentAPI.tasks.get(task.id)).toEqual(task);
  });

  it("get returns null for unknown id", () => {
    expect(agentAPI.tasks.get("nope")).toBeNull();
  });

  it("updates a task and bumps updatedAt", async () => {
    const task = agentAPI.tasks.create({ title: "Update me" });
    await new Promise((r) => setTimeout(r, 5));
    const updated = agentAPI.tasks.update(task.id, { status: "done" });
    expect(updated).not.toBeNull();
    expect(updated!.status).toBe("done");
    expect(updated!.updatedAt).not.toBe(task.updatedAt);
  });

  it("update returns null for unknown id", () => {
    expect(agentAPI.tasks.update("nope", { title: "x" })).toBeNull();
  });

  it("deletes a task", () => {
    const task = agentAPI.tasks.create({ title: "Delete me" });
    expect(agentAPI.tasks.delete(task.id)).toBe(true);
    expect(agentAPI.tasks.get(task.id)).toBeNull();
  });

  it("delete returns false for unknown id", () => {
    expect(agentAPI.tasks.delete("nope")).toBe(false);
  });

  it("lists with filters", () => {
    agentAPI.tasks.create({ title: "A", status: "todo", priority: "high", tags: ["x"] });
    agentAPI.tasks.create({ title: "B", status: "done", priority: "low", tags: ["y"] });
    agentAPI.tasks.create({ title: "C", status: "todo", priority: "low", tags: ["x"] });

    expect(agentAPI.tasks.list({ status: "todo" })).toHaveLength(2);
    expect(agentAPI.tasks.list({ priority: "high" })).toHaveLength(1);
    expect(agentAPI.tasks.list({ tag: "x" })).toHaveLength(2);
  });

  it("lists by dueDate range", () => {
    agentAPI.tasks.create({ title: "Past", dueDate: "2020-01-01T00:00:00.000Z" });
    agentAPI.tasks.create({ title: "Future", dueDate: "2030-01-01T00:00:00.000Z" });
    expect(
      agentAPI.tasks.list({ dueBefore: "2025-01-01T00:00:00.000Z" }).map((t) => t.title)
    ).toEqual(["Past"]);
    expect(
      agentAPI.tasks.list({ dueAfter: "2025-01-01T00:00:00.000Z" }).map((t) => t.title)
    ).toEqual(["Future"]);
  });

  it("searches tasks by title", () => {
    agentAPI.tasks.create({ title: "Buy groceries", description: "milk and eggs" });
    agentAPI.tasks.create({ title: "Write report", description: "quarterly" });
    const results = agentAPI.tasks.search("groceries");
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe("Buy groceries");
  });

  it("persists to IndexedDB", async () => {
    const task = agentAPI.tasks.create({ title: "Persisted" });
    // wait for fire-and-forget put
    await new Promise((r) => setTimeout(r, 10));
    const fromDb = await db.tasks.get(task.id);
    expect(fromDb).toBeDefined();
    expect(fromDb!.title).toBe("Persisted");
  });
});

describe("events API", () => {
  it("creates an event with defaults", () => {
    const event = agentAPI.events.create({ title: "Meeting", start: "2025-01-01T10:00:00.000Z" });
    expect(event.id).toBeTruthy();
    expect(event.end).toBe(event.start);
    expect(event.allDay).toBe(false);
    expect(event.location).toBe("");
  });

  it("updates an event", () => {
    const event = agentAPI.events.create({ title: "Meeting", start: "2025-01-01T10:00:00.000Z" });
    const updated = agentAPI.events.update(event.id, { location: "Room 1" });
    expect(updated!.location).toBe("Room 1");
  });

  it("deletes an event", () => {
    const event = agentAPI.events.create({ title: "Meeting", start: "2025-01-01T10:00:00.000Z" });
    expect(agentAPI.events.delete(event.id)).toBe(true);
    expect(agentAPI.events.get(event.id)).toBeNull();
  });

  it("lists events within a range", () => {
    agentAPI.events.create({ title: "A", start: "2025-01-01T10:00:00.000Z" });
    agentAPI.events.create({ title: "B", start: "2025-06-01T10:00:00.000Z" });
    agentAPI.events.create({ title: "C", start: "2025-12-01T10:00:00.000Z" });
    const range = agentAPI.events.list({
      from: "2025-03-01T00:00:00.000Z",
      to: "2025-09-01T00:00:00.000Z",
    });
    expect(range.map((e) => e.title)).toEqual(["B"]);
  });
});

describe("session API", () => {
  it("starts and ends a session", () => {
    const session = agentAPI.session.start({ summary: "Work session" });
    expect(session.endedAt).toBeNull();
    const ended = agentAPI.session.end({ summary: "Work session done" });
    expect(ended).not.toBeNull();
    expect(ended!.id).toBe(session.id);
    expect(ended!.endedAt).not.toBeNull();
    expect(ended!.summary).toBe("Work session done");
  });

  it("get returns the last session", async () => {
    agentAPI.session.start({ summary: "first" });
    agentAPI.session.end();
    await new Promise((r) => setTimeout(r, 10));
    const second = agentAPI.session.start({ summary: "second" });
    agentAPI.session.end();
    const last = agentAPI.session.get();
    expect(last).not.toBeNull();
    expect(last!.id).toBe(second.id);
  });

  it("end returns null when no open session", () => {
    expect(agentAPI.session.end()).toBeNull();
  });

  it("marks interrupted sessions on init", async () => {
    const session = agentAPI.session.start({ summary: "interrupted test" });
    // simulate a crash: leave it open, re-init
    resetCache();
    await initAgentAPI();
    const restored = cache.sessions.get(session.id);
    expect(restored).toBeDefined();
    expect(restored!.endedAt).not.toBeNull();
    expect(restored!.summary).toContain("[interrupted]");
  });
});

describe("links API", () => {
  it("creates, lists, and deletes links", () => {
    const t1 = agentAPI.tasks.create({ title: "T1" });
    const t2 = agentAPI.tasks.create({ title: "T2" });
    const link = agentAPI.links.create({ from: t1.id, to: t2.id, type: "depends-on" });
    expect(link.id).toBeTruthy();

    expect(agentAPI.links.list({ from: t1.id })).toHaveLength(1);
    expect(agentAPI.links.list({ to: t2.id })).toHaveLength(1);
    expect(agentAPI.links.list({ from: t2.id })).toHaveLength(0);

    expect(agentAPI.links.delete(link.id)).toBe(true);
    expect(agentAPI.links.list({ from: t1.id })).toHaveLength(0);
  });
});

describe("config API", () => {
  it("sets and gets config", () => {
    agentAPI.config.set("customKey", { foo: "bar" });
    expect(agentAPI.config.get("customKey")).toEqual({ foo: "bar" });
  });

  it("defaults taskStates config on init", () => {
    expect(agentAPI.config.get("taskStates")).toEqual(DEFAULT_TASK_STATES);
  });

  it("persists config to IndexedDB", async () => {
    agentAPI.config.set("theme", "dark");
    await new Promise((r) => setTimeout(r, 10));
    const fromDb = await db.config.get("theme");
    expect(fromDb?.value).toBe("dark");
  });
});

describe("global search", () => {
  it("searches across tasks, events, sessions", () => {
    agentAPI.tasks.create({ title: "alpha task" });
    agentAPI.events.create({ title: "alpha event", start: "2025-01-01T10:00:00.000Z" });
    agentAPI.session.start({ summary: "alpha session" });
    agentAPI.session.end();

    const results = agentAPI.search("alpha");
    expect(results.tasks.length).toBeGreaterThanOrEqual(1);
    expect(results.events.length).toBeGreaterThanOrEqual(1);
    expect(results.sessions.length).toBeGreaterThanOrEqual(1);
  });

  it("returns empty for empty query", () => {
    expect(agentAPI.search("")).toEqual({ tasks: [], events: [], sessions: [] });
  });
});

describe("race condition guard", () => {
  it("API methods are sync and return values immediately", () => {
    // The whole point: create returns the object synchronously, not a Promise
    const result = agentAPI.tasks.create({ title: "sync" });
    expect(typeof result).toBe("object");
    expect(result).not.toHaveProperty("then");
  });

  it("cache is loaded before API is ready", () => {
    expect(cache.loaded).toBe(true);
  });
});
