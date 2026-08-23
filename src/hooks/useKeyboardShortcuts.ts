import { useHotkeys, useHotkeySequences } from "@tanstack/react-hotkeys";
import type { RegisterableHotkey, HotkeySequence } from "@tanstack/react-hotkeys";
import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { agentAPI } from "@/api/agentAPI";
import { SHORTCUTS, SHORTCUT_EVENTS, dispatchShortcutEvent, type ShortcutDef } from "@/lib/shortcuts";

/**
 * Register all keyboard shortcuts globally. Call once in the root layout
 * (rootRoute component) so they're active on every view.
 *
 * Uses TanStack Hotkeys:
 * - `useHotkeys` for single-chord shortcuts (e.g. ?, s, Esc, Mod+E)
 * - `useHotkeySequences` for vim-style sequences (e.g. g d, n t)
 *
 * Navigation is handled directly via `useNavigate`. Cross-component actions
 * (new task/event, toggle theme, export/import) dispatch CustomEvents that
 * the relevant components listen for.
 *
 * Per ADR-0013, all single-key shortcuts use `ignoreInputs: true` so they
 * don't fire while the user (or agent) is typing in a form field.
 */
export function useKeyboardShortcuts(): void {
  const navigate = useNavigate();

  const goDashboard = useCallback(() => navigate({ to: "/" }), [navigate]);
  const goTasks = useCallback(() => navigate({ to: "/tasks" }), [navigate]);
  const goCalendar = useCallback(() => navigate({ to: "/calendar" }), [navigate]);
  const goShortcuts = useCallback(() => navigate({ to: "/shortcuts" }), [navigate]);

  const startSession = useCallback(() => {
    agentAPI.session.start({ summary: "Started via keyboard shortcut" });
  }, []);
  const endSession = useCallback(() => {
    agentAPI.session.end({ summary: "Ended via keyboard shortcut" });
  }, []);

  // --- Single-key hotkeys ---
  const hotkeyDefs = SHORTCUTS.filter((s) => s.kind === "hotkey").map((s) => ({
    hotkey: s.hotkey as RegisterableHotkey,
    callback: getHotkeyCallback(s, { goShortcuts, startSession, endSession, goDashboard }),
    options: {
      meta: s.meta,
      // Single keys (s, x, t, ?) must not fire while typing in inputs.
      // Mod+E and Mod+I have smart default (fire in inputs) which is fine.
      ignoreInputs: typeof s.hotkey === "string" && s.hotkey.startsWith("Mod") ? undefined : true,
    },
  }));

  useHotkeys(hotkeyDefs);

  // --- Vim-style sequences ---
  const sequenceDefs = SHORTCUTS.filter((s) => s.kind === "sequence").map((s) => ({
    sequence: s.sequence as HotkeySequence,
    callback: getSequenceCallback(s, { goDashboard, goTasks, goCalendar, goShortcuts }),
    options: {
      meta: s.meta,
      ignoreInputs: true,
    },
  }));

  useHotkeySequences(sequenceDefs);
}

function getHotkeyCallback(
  s: ShortcutDef,
  handlers: {
    goShortcuts: () => void;
    startSession: () => void;
    endSession: () => void;
    goDashboard: () => void;
  }
): () => void {
  switch (s.id) {
    case "show-shortcuts":
      return handlers.goShortcuts;
    case "start-session":
      return handlers.startSession;
    case "end-session":
      return handlers.endSession;
    case "toggle-theme":
      return () => dispatchShortcutEvent(SHORTCUT_EVENTS.toggleTheme);
    case "back-dashboard":
      return handlers.goDashboard;
    case "export-backup":
      return () => dispatchShortcutEvent(SHORTCUT_EVENTS.exportBackup);
    case "import-backup":
      return () => dispatchShortcutEvent(SHORTCUT_EVENTS.importBackup);
    default:
      return () => {};
  }
}

function getSequenceCallback(
  s: ShortcutDef,
  handlers: {
    goDashboard: () => void;
    goTasks: () => void;
    goCalendar: () => void;
    goShortcuts: () => void;
  }
): () => void {
  switch (s.id) {
    case "go-dashboard":
      return handlers.goDashboard;
    case "go-tasks":
      return handlers.goTasks;
    case "go-calendar":
      return handlers.goCalendar;
    case "go-shortcuts":
      return handlers.goShortcuts;
    case "new-task":
      return () => {
        void handlers.goTasks();
        dispatchShortcutEvent(SHORTCUT_EVENTS.newTask);
      };
    case "new-event":
      return () => {
        void handlers.goCalendar();
        dispatchShortcutEvent(SHORTCUT_EVENTS.newEvent);
      };
    default:
      return () => {};
  }
}
