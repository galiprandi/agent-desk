import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  agentAPI,
  initAgentAPI,
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

// ============================================================
// TASKS API — extended
// ============================================================

describe("tasks API — extended", () => {
  it("creates with all fields populated", () => {
    const task = agentAPI.tasks.create({
      title: "Full task",
      description: "Detailed description",
      status: "in-progress",
      priority: "urgent",
      dueDate: "2026-12-01T00:00:00.000Z",
      tags: ["frontend", "bug"],
      links: ["link-1"],
    });
    expect(task.title).toBe("Full task");
    expect(task.description).toBe("Detailed description");
    expect(task.status).toBe("in-progress");
    expect(task.priority).toBe("urgent");
    expect(task.dueDate).toBe("2026-12-01T00:00:00.000Z");
    expect(task.tags).toEqual(["frontend", "bug"]);
    expect(task.links).toEqual(["link-1"]);
  });

  it("creates with empty title", () => {
    const task = agentAPI.tasks.create({ title: "" });
    expect(task.title).toBe("");
    expect(task.id).toBeTruthy();
  });

  it("creates with custom status not in defaults", () => {
    const task = agentAPI.tasks.create({ title: "Custom", status: "triage" });
    expect(task.status).toBe("triage");
  });

  it("creates with null dueDate explicitly", () => {
    const task = agentAPI.tasks.create({ title: "X", dueDate: null });
    expect(task.dueDate).toBeNull();
  });

  it("updates multiple fields at once", async () => {
    const task = agentAPI.tasks.create({ title: "Original", priority: "low" });
    await new Promise((r) => setTimeout(r, 5));
    const updated = agentAPI.tasks.update(task.id, {
      title: "Renamed",
      status: "done",
      priority: "high",
      description: "Updated desc",
      tags: ["new-tag"],
    });
    expect(updated!.title).toBe("Renamed");
    expect(updated!.status).toBe("done");
    expect(updated!.priority).toBe("high");
    expect(updated!.description).toBe("Updated desc");
    expect(updated!.tags).toEqual(["new-tag"]);
  });

  it("update preserves createdAt and id", async () => {
    const task = agentAPI.tasks.create({ title: "X" });
    await new Promise((r) => setTimeout(r, 5));
    const updated = agentAPI.tasks.update(task.id, { title: "Y" });
    expect(updated!.id).toBe(task.id);
    expect(updated!.createdAt).toBe(task.createdAt);
  });

  it("update does not mutate the original cache entry", async () => {
    const task = agentAPI.tasks.create({ title: "X" });
    const original = agentAPI.tasks.get(task.id);
    await new Promise((r) => setTimeout(r, 5));
    agentAPI.tasks.update(task.id, { title: "Y" });
    // original reference should be unchanged (spread creates new object)
    expect(original!.title).toBe("X");
  });

  it("list returns empty array when no tasks", () => {
    expect(agentAPI.tasks.list()).toEqual([]);
  });

  it("list with combined filters (status + priority + tag)", () => {
    agentAPI.tasks.create({ title: "A", status: "todo", priority: "high", tags: ["x"] });
    agentAPI.tasks.create({ title: "B", status: "todo", priority: "high", tags: ["y"] });
    agentAPI.tasks.create({ title: "C", status: "todo", priority: "low", tags: ["x"] });
    agentAPI.tasks.create({ title: "D", status: "done", priority: "high", tags: ["x"] });

    const result = agentAPI.tasks.list({ status: "todo", priority: "high", tag: "x" });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("A");
  });

  it("list with dueBefore and dueAfter combined", () => {
    agentAPI.tasks.create({ title: "A", dueDate: "2025-06-01T00:00:00.000Z" });
    agentAPI.tasks.create({ title: "B", dueDate: "2025-07-01T00:00:00.000Z" });
    agentAPI.tasks.create({ title: "C", dueDate: "2025-08-01T00:00:00.000Z" });
    const result = agentAPI.tasks.list({
      dueAfter: "2025-06-15T00:00:00.000Z",
      dueBefore: "2025-07-15T00:00:00.000Z",
    });
    expect(result.map((t) => t.title)).toEqual(["B"]);
  });

  it("list excludes tasks with null dueDate when filtering by date", () => {
    agentAPI.tasks.create({ title: "NoDate" });
    agentAPI.tasks.create({ title: "HasDate", dueDate: "2025-01-01T00:00:00.000Z" });
    const before = agentAPI.tasks.list({ dueBefore: "2026-01-01T00:00:00.000Z" });
    expect(before.map((t) => t.title)).toEqual(["HasDate"]);
    const after = agentAPI.tasks.list({ dueAfter: "2024-01-01T00:00:00.000Z" });
    expect(after.map((t) => t.title)).toEqual(["HasDate"]);
  });

  it("search by description", () => {
    agentAPI.tasks.create({ title: "Task A", description: "fix the login bug" });
    agentAPI.tasks.create({ title: "Task B", description: "update docs" });
    const results = agentAPI.tasks.search("login");
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe("Task A");
  });

  it("search returns empty for no match", () => {
    agentAPI.tasks.create({ title: "Task A" });
    expect(agentAPI.tasks.search("nonexistent")).toEqual([]);
  });

  it("search returns empty for empty query", () => {
    agentAPI.tasks.create({ title: "Task A" });
    expect(agentAPI.tasks.search("")).toEqual([]);
  });

  it("persists update to IndexedDB", async () => {
    const task = agentAPI.tasks.create({ title: "Persist" });
    await new Promise((r) => setTimeout(r, 10));
    agentAPI.tasks.update(task.id, { status: "done" });
    await new Promise((r) => setTimeout(r, 10));
    const fromDb = await db.tasks.get(task.id);
    expect(fromDb!.status).toBe("done");
  });

  it("persists delete to IndexedDB", async () => {
    const task = agentAPI.tasks.create({ title: "Delete" });
    await new Promise((r) => setTimeout(r, 10));
    agentAPI.tasks.delete(task.id);
    await new Promise((r) => setTimeout(r, 10));
    const fromDb = await db.tasks.get(task.id);
    expect(fromDb).toBeUndefined();
  });

  it("handles all 4 priority levels", () => {
    const low = agentAPI.tasks.create({ title: "L", priority: "low" });
    const med = agentAPI.tasks.create({ title: "M", priority: "medium" });
    const high = agentAPI.tasks.create({ title: "H", priority: "high" });
    const urgent = agentAPI.tasks.create({ title: "U", priority: "urgent" });
    expect(low.priority).toBe("low");
    expect(med.priority).toBe("medium");
    expect(high.priority).toBe("high");
    expect(urgent.priority).toBe("urgent");
  });
});

// ============================================================
// EVENTS API — extended
// ============================================================

describe("events API — extended", () => {
  it("creates with all fields", () => {
    const event = agentAPI.events.create({
      title: "Conference",
      description: "Annual tech conference",
      start: "2026-03-15T09:00:00.000Z",
      end: "2026-03-15T17:00:00.000Z",
      allDay: false,
      location: "Convention Center",
      links: ["task-1"],
    });
    expect(event.title).toBe("Conference");
    expect(event.description).toBe("Annual tech conference");
    expect(event.start).toBe("2026-03-15T09:00:00.000Z");
    expect(event.end).toBe("2026-03-15T17:00:00.000Z");
    expect(event.allDay).toBe(false);
    expect(event.location).toBe("Convention Center");
    expect(event.links).toEqual(["task-1"]);
  });

  it("defaults end to start when not provided", () => {
    const event = agentAPI.events.create({ title: "X", start: "2026-01-01T10:00:00.000Z" });
    expect(event.end).toBe(event.start);
  });

  it("creates all-day event", () => {
    const event = agentAPI.events.create({
      title: "Holiday",
      start: "2026-01-01T00:00:00.000Z",
      allDay: true,
    });
    expect(event.allDay).toBe(true);
  });

  it("get returns null for unknown id", () => {
    expect(agentAPI.events.get("nope")).toBeNull();
  });

  it("update returns null for unknown id", () => {
    expect(agentAPI.events.update("nope", { title: "x" })).toBeNull();
  });

  it("delete returns false for unknown id", () => {
    expect(agentAPI.events.delete("nope")).toBe(false);
  });

  it("update preserves createdAt and id", async () => {
    const event = agentAPI.events.create({ title: "X", start: "2026-01-01T10:00:00.000Z" });
    await new Promise((r) => setTimeout(r, 5));
    const updated = agentAPI.events.update(event.id, { title: "Y" });
    expect(updated!.id).toBe(event.id);
    expect(updated!.createdAt).toBe(event.createdAt);
  });

  it("list returns empty when no events", () => {
    expect(agentAPI.events.list()).toEqual([]);
  });

  it("list returns all events sorted by start when no filter", () => {
    agentAPI.events.create({ title: "B", start: "2026-06-01T10:00:00.000Z" });
    agentAPI.events.create({ title: "A", start: "2026-01-01T10:00:00.000Z" });
    agentAPI.events.create({ title: "C", start: "2026-12-01T10:00:00.000Z" });
    const all = agentAPI.events.list();
    expect(all.map((e) => e.title)).toEqual(["A", "B", "C"]);
  });

  it("list with only from filter", () => {
    agentAPI.events.create({ title: "A", start: "2025-01-01T10:00:00.000Z" });
    agentAPI.events.create({ title: "B", start: "2026-06-01T10:00:00.000Z" });
    const result = agentAPI.events.list({ from: "2026-01-01T00:00:00.000Z" });
    expect(result.map((e) => e.title)).toEqual(["B"]);
  });

  it("list with only to filter", () => {
    agentAPI.events.create({ title: "A", start: "2025-01-01T10:00:00.000Z" });
    agentAPI.events.create({ title: "B", start: "2026-06-01T10:00:00.000Z" });
    const result = agentAPI.events.list({ to: "2025-12-31T00:00:00.000Z" });
    expect(result.map((e) => e.title)).toEqual(["A"]);
  });

  it("persists event to IndexedDB", async () => {
    const event = agentAPI.events.create({ title: "Persist", start: "2026-01-01T10:00:00.000Z" });
    await new Promise((r) => setTimeout(r, 10));
    const fromDb = await db.events.get(event.id);
    expect(fromDb).toBeDefined();
    expect(fromDb!.title).toBe("Persist");
  });

  it("persists delete to IndexedDB", async () => {
    const event = agentAPI.events.create({ title: "Delete", start: "2026-01-01T10:00:00.000Z" });
    await new Promise((r) => setTimeout(r, 10));
    agentAPI.events.delete(event.id);
    await new Promise((r) => setTimeout(r, 10));
    const fromDb = await db.events.get(event.id);
    expect(fromDb).toBeUndefined();
  });
});

// ============================================================
// SESSION API — extended
// ============================================================

describe("session API — extended", () => {
  it("start without summary defaults to empty string", () => {
    const session = agentAPI.session.start();
    expect(session.summary).toBe("");
    expect(session.endedAt).toBeNull();
    expect(session.startedAt).toBeTruthy();
  });

  it("end without summary preserves original summary", () => {
    const session = agentAPI.session.start({ summary: "Working on X" });
    const ended = agentAPI.session.end();
    expect(ended!.summary).toBe("Working on X");
  });

  it("end updates the most recent open session", async () => {
    const s1 = agentAPI.session.start({ summary: "first" });
    agentAPI.session.end();
    await new Promise((r) => setTimeout(r, 10));
    const s2 = agentAPI.session.start({ summary: "second" });
    const ended = agentAPI.session.end();
    expect(ended!.id).toBe(s2.id);
    expect(ended!.id).not.toBe(s1.id);
  });

  it("get returns null when no sessions exist", () => {
    expect(agentAPI.session.get()).toBeNull();
  });

  it("get returns open session as last when it's most recent", () => {
    agentAPI.session.start({ summary: "first" });
    agentAPI.session.end();
    const open = agentAPI.session.start({ summary: "open" });
    const last = agentAPI.session.get();
    expect(last!.id).toBe(open.id);
  });

  it("persists session to IndexedDB", async () => {
    const session = agentAPI.session.start({ summary: "Persist" });
    await new Promise((r) => setTimeout(r, 10));
    const fromDb = await db.sessions.get(session.id);
    expect(fromDb).toBeDefined();
    expect(fromDb!.summary).toBe("Persist");
  });

  it("marks interrupted session with empty summary", async () => {
    const session = agentAPI.session.start();
    resetCache();
    await initAgentAPI();
    const restored = cache.sessions.get(session.id);
    expect(restored!.summary).toBe("[interrupted]");
    expect(restored!.endedAt).not.toBeNull();
  });

  it("marks interrupted session with existing summary", async () => {
    const session = agentAPI.session.start({ summary: "Working" });
    resetCache();
    await initAgentAPI();
    const restored = cache.sessions.get(session.id);
    expect(restored!.summary).toBe("Working [interrupted]");
  });

  it("does not mark already-ended sessions as interrupted on init", async () => {
    const session = agentAPI.session.start({ summary: "Done" });
    agentAPI.session.end();
    resetCache();
    await initAgentAPI();
    const restored = cache.sessions.get(session.id);
    expect(restored!.summary).toBe("Done");
    expect(restored!.summary).not.toContain("[interrupted]");
  });
});

// ============================================================
// LINKS API — extended
// ============================================================

describe("links API — extended", () => {
  it("creates link between task and event", () => {
    const task = agentAPI.tasks.create({ title: "T" });
    const event = agentAPI.events.create({ title: "E", start: "2026-01-01T10:00:00.000Z" });
    const link = agentAPI.links.create({ from: task.id, to: event.id, type: "scheduled-for" });
    expect(link.from).toBe(task.id);
    expect(link.to).toBe(event.id);
    expect(link.type).toBe("scheduled-for");
  });

  it("list returns all links when no filter", () => {
    const t1 = agentAPI.tasks.create({ title: "T1" });
    const t2 = agentAPI.tasks.create({ title: "T2" });
    agentAPI.links.create({ from: t1.id, to: t2.id, type: "depends-on" });
    agentAPI.links.create({ from: t2.id, to: t1.id, type: "blocks" });
    expect(agentAPI.links.list()).toHaveLength(2);
  });

  it("list returns empty when no links", () => {
    expect(agentAPI.links.list()).toEqual([]);
  });

  it("delete returns false for unknown id", () => {
    expect(agentAPI.links.delete("nope")).toBe(false);
  });

  it("persists link to IndexedDB", async () => {
    const t1 = agentAPI.tasks.create({ title: "T1" });
    const t2 = agentAPI.tasks.create({ title: "T2" });
    const link = agentAPI.links.create({ from: t1.id, to: t2.id, type: "related" });
    await new Promise((r) => setTimeout(r, 10));
    const fromDb = await db.links.get(link.id);
    expect(fromDb).toBeDefined();
    expect(fromDb!.type).toBe("related");
  });

  it("supports custom link types", () => {
    const t1 = agentAPI.tasks.create({ title: "T1" });
    const t2 = agentAPI.tasks.create({ title: "T2" });
    const link = agentAPI.links.create({ from: t1.id, to: t2.id, type: "parent-of" });
    expect(link.type).toBe("parent-of");
  });

  it("filters by from and to simultaneously", () => {
    const t1 = agentAPI.tasks.create({ title: "T1" });
    const t2 = agentAPI.tasks.create({ title: "T2" });
    const t3 = agentAPI.tasks.create({ title: "T3" });
    agentAPI.links.create({ from: t1.id, to: t2.id, type: "a" });
    agentAPI.links.create({ from: t1.id, to: t3.id, type: "b" });
    agentAPI.links.create({ from: t2.id, to: t3.id, type: "c" });
    expect(agentAPI.links.list({ from: t1.id, to: t2.id })).toHaveLength(1);
  });
});

// ============================================================
// CONFIG API — extended
// ============================================================

describe("config API — extended", () => {
  it("get returns undefined for non-existent key", () => {
    expect(agentAPI.config.get("nonexistent")).toBeUndefined();
  });

  it("set overwrites existing value", () => {
    agentAPI.config.set("key", "value1");
    agentAPI.config.set("key", "value2");
    expect(agentAPI.config.get("key")).toBe("value2");
  });

  it("supports complex object values", () => {
    agentAPI.config.set("complex", { nested: { deep: [1, 2, 3] } });
    expect(agentAPI.config.get("complex")).toEqual({ nested: { deep: [1, 2, 3] } });
  });

  it("supports array values", () => {
    agentAPI.config.set("arr", ["a", "b", "c"]);
    expect(agentAPI.config.get("arr")).toEqual(["a", "b", "c"]);
  });

  it("supports null values", () => {
    agentAPI.config.set("nullKey", null);
    expect(agentAPI.config.get("nullKey")).toBeNull();
  });

  it("supports boolean values", () => {
    agentAPI.config.set("bool", true);
    expect(agentAPI.config.get("bool")).toBe(true);
  });

  it("supports number values", () => {
    agentAPI.config.set("num", 42);
    expect(agentAPI.config.get("num")).toBe(42);
  });

  it("can update taskStates", () => {
    const newStates = ["backlog", "triage", "doing", "review", "done"];
    agentAPI.config.set("taskStates", newStates);
    expect(agentAPI.config.get("taskStates")).toEqual(newStates);
  });

  it("persists overwrite to IndexedDB", async () => {
    agentAPI.config.set("key", "v1");
    await new Promise((r) => setTimeout(r, 10));
    agentAPI.config.set("key", "v2");
    await new Promise((r) => setTimeout(r, 10));
    const fromDb = await db.config.get("key");
    expect(fromDb?.value).toBe("v2");
  });
});

// ============================================================
// GLOBAL SEARCH — extended
// ============================================================

describe("global search — extended", () => {
  it("searches by description in tasks", () => {
    agentAPI.tasks.create({ title: "Task", description: "important bug fix" });
    const results = agentAPI.search("important");
    expect(results.tasks).toHaveLength(1);
  });

  it("searches by location in events", () => {
    agentAPI.events.create({
      title: "Event",
      start: "2026-01-01T10:00:00.000Z",
      location: "Conference Room B",
    });
    const results = agentAPI.search("Conference");
    expect(results.events).toHaveLength(1);
  });

  it("searches by summary in sessions", () => {
    agentAPI.session.start({ summary: "debugging session" });
    agentAPI.session.end();
    const results = agentAPI.search("debugging");
    expect(results.sessions).toHaveLength(1);
  });

  it("returns empty for query with no matches", () => {
    agentAPI.tasks.create({ title: "Task A" });
    agentAPI.events.create({ title: "Event A", start: "2026-01-01T10:00:00.000Z" });
    const results = agentAPI.search("zzz");
    expect(results.tasks).toEqual([]);
    expect(results.events).toEqual([]);
    expect(results.sessions).toEqual([]);
  });

  it("returns all categories for a common term", () => {
    agentAPI.tasks.create({ title: "project alpha" });
    agentAPI.events.create({ title: "project alpha kickoff", start: "2026-01-01T10:00:00.000Z" });
    agentAPI.session.start({ summary: "project alpha planning" });
    agentAPI.session.end();
    const results = agentAPI.search("project");
    expect(results.tasks.length).toBeGreaterThanOrEqual(1);
    expect(results.events.length).toBeGreaterThanOrEqual(1);
    expect(results.sessions.length).toBeGreaterThanOrEqual(1);
  });

  it("returns empty object for empty query", () => {
    agentAPI.tasks.create({ title: "Task A" });
    const results = agentAPI.search("");
    expect(results).toEqual({ tasks: [], events: [], sessions: [] });
  });
});

// ============================================================
// SYNC GUARANTEES — extended
// ============================================================

describe("sync guarantees — extended", () => {
  it("tasks.create returns object, not Promise", () => {
    const result = agentAPI.tasks.create({ title: "X" });
    expect(result instanceof Promise).toBe(false);
    expect(typeof result).toBe("object");
  });

  it("events.create returns object, not Promise", () => {
    const result = agentAPI.events.create({ title: "X", start: "2026-01-01T00:00:00.000Z" });
    expect(result instanceof Promise).toBe(false);
    expect(typeof result).toBe("object");
  });

  it("session.start returns object, not Promise", () => {
    const result = agentAPI.session.start();
    expect(result instanceof Promise).toBe(false);
    expect(typeof result).toBe("object");
  });

  it("session.end returns object or null, not Promise", () => {
    const result = agentAPI.session.end();
    expect(result instanceof Promise).toBe(false);
  });

  it("links.create returns object, not Promise", () => {
    const result = agentAPI.links.create({ from: "a", to: "b", type: "x" });
    expect(result instanceof Promise).toBe(false);
    expect(typeof result).toBe("object");
  });

  it("config.set returns void, not Promise", () => {
    const result = agentAPI.config.set("key", "value");
    expect(result).toBeUndefined();
  });

  it("search returns object, not Promise", () => {
    agentAPI.tasks.create({ title: "test" });
    const result = agentAPI.search("test");
    expect(result instanceof Promise).toBe(false);
    expect(typeof result).toBe("object");
  });

  it("tasks.list returns array, not Promise", () => {
    const result = agentAPI.tasks.list();
    expect(result instanceof Promise).toBe(false);
    expect(Array.isArray(result)).toBe(true);
  });

  it("events.list returns array, not Promise", () => {
    const result = agentAPI.events.list();
    expect(result instanceof Promise).toBe(false);
    expect(Array.isArray(result)).toBe(true);
  });

  it("links.list returns array, not Promise", () => {
    const result = agentAPI.links.list();
    expect(result instanceof Promise).toBe(false);
    expect(Array.isArray(result)).toBe(true);
  });
});

// ============================================================
// INTEGRATION — multi-entity workflows
// ============================================================

describe("integration — multi-entity workflows", () => {
  it("CRM-like workflow: contact as task, linked to follow-up event", () => {
    const contact = agentAPI.tasks.create({
      title: "Contact: John Doe",
      description: "Potential client",
      status: "lead",
      tags: ["crm", "client"],
    });
    const followUp = agentAPI.events.create({
      title: "Call John Doe",
      start: "2026-02-01T14:00:00.000Z",
      description: "Follow up on proposal",
    });
    const link = agentAPI.links.create({
      from: contact.id,
      to: followUp.id,
      type: "scheduled-followup",
    });
    // verify
    expect(agentAPI.links.list({ from: contact.id })).toHaveLength(1);
    expect(agentAPI.tasks.get(contact.id)!.status).toBe("lead");
    expect(agentAPI.events.list({ from: "2026-01-01T00:00:00.000Z" })).toHaveLength(1);
    // move contact to next stage
    agentAPI.tasks.update(contact.id, { status: "contacted" });
    expect(agentAPI.tasks.get(contact.id)!.status).toBe("contacted");
  });

  it("project workflow: tasks with dependencies and deadlines", () => {
    const research = agentAPI.tasks.create({
      title: "Research competitors",
      status: "todo",
      priority: "high",
      dueDate: "2026-02-01T00:00:00.000Z",
    });
    const design = agentAPI.tasks.create({
      title: "Design mockups",
      status: "backlog",
      priority: "medium",
    });
    const develop = agentAPI.tasks.create({
      title: "Develop feature",
      status: "backlog",
      priority: "high",
    });
    // design depends on research
    agentAPI.links.create({ from: design.id, to: research.id, type: "depends-on" });
    // develop depends on design
    agentAPI.links.create({ from: develop.id, to: design.id, type: "depends-on" });
    // verify dependencies
    expect(agentAPI.links.list({ from: develop.id })).toHaveLength(1);
    expect(agentAPI.links.list({ from: design.id })).toHaveLength(1);
    // complete research
    agentAPI.tasks.update(research.id, { status: "done" });
    // start design
    agentAPI.tasks.update(design.id, { status: "in-progress" });
    expect(agentAPI.tasks.list({ status: "done" })).toHaveLength(1);
    expect(agentAPI.tasks.list({ status: "in-progress" })).toHaveLength(1);
  });

  it("session continuity: start, work, end, resume next session", () => {
    // session 1
    const s1 = agentAPI.session.start({ summary: "Working on feature X" });
    const task = agentAPI.tasks.create({ title: "Implement X", status: "in-progress" });
    agentAPI.session.end({ summary: "Implemented half of X" });
    // session 2
    const s2 = agentAPI.session.start({ summary: "Continue feature X" });
    const last = agentAPI.session.get();
    // the most recent session should be s2 (open)
    expect(last!.id).toBe(s2.id);
    // task from previous session still exists
    expect(agentAPI.tasks.get(task.id)).not.toBeNull();
    expect(agentAPI.tasks.get(task.id)!.status).toBe("in-progress");
    agentAPI.session.end({ summary: "Completed X" });
  });
});
