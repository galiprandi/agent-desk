import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { initAgentAPI, resetCache } from "@/api/agentAPI";
import {
  SHORTCUTS,
  SHORTCUT_EVENTS,
  dispatchShortcutEvent,
} from "@/lib/shortcuts";

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

describe("SHORTCUTS registry", () => {
  it("defines a non-empty list of shortcuts", () => {
    expect(SHORTCUTS.length).toBeGreaterThan(0);
  });

  it("every shortcut has a unique id", () => {
    const ids = SHORTCUTS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every shortcut has a kind, display, i18nKey, and meta", () => {
    for (const s of SHORTCUTS) {
      expect(s.kind).toMatch(/^(hotkey|sequence)$/);
      expect(s.display).toBeTruthy();
      expect(s.i18nKey).toBeTruthy();
      expect(s.meta).toBeDefined();
      expect(s.meta.name).toBeTruthy();
      expect(s.meta.description).toBeTruthy();
      expect(s.meta.group).toBeTruthy();
    }
  });

  it("hotkey shortcuts have a hotkey string; sequence shortcuts have a sequence array", () => {
    for (const s of SHORTCUTS) {
      if (s.kind === "hotkey") {
        expect(s.hotkey).toBeTruthy();
        expect(s.sequence).toBeUndefined();
      } else {
        expect(s.sequence).toBeInstanceOf(Array);
        expect(s.sequence!.length).toBeGreaterThanOrEqual(2);
        expect(s.hotkey).toBeUndefined();
      }
    }
  });

  it("includes the ? show-shortcuts shortcut", () => {
    const show = SHORTCUTS.find((s) => s.id === "show-shortcuts");
    expect(show).toBeDefined();
    expect(show!.hotkey).toEqual({ key: "/", shift: true });
  });

  it("includes navigation sequences g d, g t, g c, g s", () => {
    const navIds = ["go-dashboard", "go-tasks", "go-calendar", "go-shortcuts"];
    for (const id of navIds) {
      const s = SHORTCUTS.find((x) => x.id === id);
      expect(s).toBeDefined();
      expect(s!.kind).toBe("sequence");
      expect(s!.sequence!.length).toBe(2);
    }
  });

  it("includes action sequences n t, n e", () => {
    const newTask = SHORTCUTS.find((s) => s.id === "new-task");
    expect(newTask).toBeDefined();
    expect(newTask!.sequence).toEqual(["N", "T"]);

    const newEvent = SHORTCUTS.find((s) => s.id === "new-event");
    expect(newEvent).toBeDefined();
    expect(newEvent!.sequence).toEqual(["N", "E"]);
  });

  it("includes session shortcuts s and x", () => {
    const start = SHORTCUTS.find((s) => s.id === "start-session");
    expect(start).toBeDefined();
    expect(start!.hotkey).toBe("S");

    const end = SHORTCUTS.find((s) => s.id === "end-session");
    expect(end).toBeDefined();
    expect(end!.hotkey).toBe("X");
  });

  it("includes data shortcuts Mod+E and Mod+I", () => {
    const exportB = SHORTCUTS.find((s) => s.id === "export-backup");
    expect(exportB).toBeDefined();
    expect(exportB!.hotkey).toBe("Mod+E");

    const importB = SHORTCUTS.find((s) => s.id === "import-backup");
    expect(importB).toBeDefined();
    expect(importB!.hotkey).toBe("Mod+I");
  });

  it("all groups are known", () => {
    const knownGroups = ["navigation", "actions", "session", "ui", "data"];
    for (const s of SHORTCUTS) {
      expect(knownGroups).toContain(s.meta.group);
    }
  });
});

describe("SHORTCUT_EVENTS", () => {
  it("defines all expected event names", () => {
    expect(SHORTCUT_EVENTS.newTask).toBe("agent-desk:new-task");
    expect(SHORTCUT_EVENTS.newEvent).toBe("agent-desk:new-event");
    expect(SHORTCUT_EVENTS.toggleTheme).toBe("agent-desk:toggle-theme");
    expect(SHORTCUT_EVENTS.exportBackup).toBe("agent-desk:export-backup");
    expect(SHORTCUT_EVENTS.importBackup).toBe("agent-desk:import-backup");
  });
});

describe("dispatchShortcutEvent", () => {
  it("dispatches a CustomEvent on window with the given name", () => {
    const handler = vi.fn();
    window.addEventListener(SHORTCUT_EVENTS.newTask, handler);
    try {
      dispatchShortcutEvent(SHORTCUT_EVENTS.newTask);
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0]).toBeInstanceOf(CustomEvent);
      expect((handler.mock.calls[0][0] as CustomEvent).type).toBe(
        SHORTCUT_EVENTS.newTask
      );
    } finally {
      window.removeEventListener(SHORTCUT_EVENTS.newTask, handler);
    }
  });

  it("is a no-op when window is undefined", () => {
    const originalWindow = globalThis.window;
    try {
      delete (globalThis as Record<string, unknown>).window;
      expect(() => dispatchShortcutEvent("test")).not.toThrow();
    } finally {
      (globalThis as Record<string, unknown>).window = originalWindow;
    }
  });
});
