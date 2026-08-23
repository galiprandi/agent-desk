import type { HotkeyMeta, Hotkey, HotkeySequence, RegisterableHotkey } from "@tanstack/react-hotkeys";

/**
 * Extend HotkeyMeta with a group field for categorizing shortcuts in the
 * shortcuts view. Uses TypeScript declaration merging as documented in
 * TanStack Hotkeys.
 */
declare module "@tanstack/react-hotkeys" {
  interface HotkeyMeta {
    group?: string;
  }
}

export type ShortcutKind = "hotkey" | "sequence";

export interface ShortcutDef {
  /** Unique id for testid and event matching */
  id: string;
  /** "hotkey" for single chord, "sequence" for vim-style multi-key */
  kind: ShortcutKind;
  /** For kind="hotkey": the hotkey string (e.g. "?", "Mod+E"). For kind="sequence": joined display (e.g. "g d") */
  display: string;
  /** For kind="sequence": the array of keys (e.g. ["G", "D"]). Undefined for hotkeys. */
  sequence?: HotkeySequence;
  /** For kind="hotkey": the hotkey (string or RawHotkey object). Undefined for sequences. */
  hotkey?: RegisterableHotkey;
  /** i18n key suffix under shortcuts.* — e.g. "goDashboard" → t("shortcuts.goDashboard.name") */
  i18nKey: string;
  meta: HotkeyMeta;
}

/**
 * Central registry of all keyboard shortcuts. Single source of truth used by
 * useKeyboardShortcuts (registration) and ShortcutsView (display).
 *
 * Conventions:
 * - Sequences are vim-style: `g d` means press g then d within 1s.
 * - Single keys use ignoreInputs: true so they don't fire while typing.
 * - Mod+E means Cmd+E on Mac, Ctrl+E elsewhere.
 */
export const SHORTCUTS: ShortcutDef[] = [
  // --- Navigation (sequences) ---
  {
    id: "go-dashboard",
    kind: "sequence",
    display: "g d",
    sequence: ["G", "D"],
    i18nKey: "goDashboard",
    meta: { name: "Go to Dashboard", description: "Navigate to the dashboard view", group: "navigation" },
  },
  {
    id: "go-tasks",
    kind: "sequence",
    display: "g t",
    sequence: ["G", "T"],
    i18nKey: "goTasks",
    meta: { name: "Go to Tasks", description: "Navigate to the tasks view", group: "navigation" },
  },
  {
    id: "go-calendar",
    kind: "sequence",
    display: "g c",
    sequence: ["G", "C"],
    i18nKey: "goCalendar",
    meta: { name: "Go to Calendar", description: "Navigate to the calendar view", group: "navigation" },
  },
  {
    id: "go-shortcuts",
    kind: "sequence",
    display: "g s",
    sequence: ["G", "S"],
    i18nKey: "goShortcuts",
    meta: { name: "Go to Shortcuts", description: "Navigate to the shortcuts reference", group: "navigation" },
  },

  // --- Actions (single keys) ---
  {
    id: "show-shortcuts",
    kind: "hotkey",
    display: "?",
    hotkey: { key: "/", shift: true },
    i18nKey: "showShortcuts",
    meta: { name: "Show shortcuts", description: "Open the shortcuts reference page", group: "actions" },
  },
  {
    id: "new-task",
    kind: "sequence",
    display: "n t",
    sequence: ["N", "T"],
    i18nKey: "newTask",
    meta: { name: "New task", description: "Open the new task dialog on the tasks view", group: "actions" },
  },
  {
    id: "new-event",
    kind: "sequence",
    display: "n e",
    sequence: ["N", "E"],
    i18nKey: "newEvent",
    meta: { name: "New event", description: "Open the new event dialog on the calendar view", group: "actions" },
  },
  {
    id: "start-session",
    kind: "hotkey",
    display: "s",
    hotkey: "S",
    i18nKey: "startSession",
    meta: { name: "Start session", description: "Start a new work session", group: "session" },
  },
  {
    id: "end-session",
    kind: "hotkey",
    display: "x",
    hotkey: "X",
    i18nKey: "endSession",
    meta: { name: "End session", description: "End the current work session", group: "session" },
  },

  // --- UI (single keys) ---
  {
    id: "toggle-theme",
    kind: "hotkey",
    display: "t",
    hotkey: "T",
    i18nKey: "toggleTheme",
    meta: { name: "Toggle theme", description: "Switch between light and dark theme", group: "ui" },
  },
  {
    id: "back-dashboard",
    kind: "hotkey",
    display: "Esc",
    hotkey: "Escape",
    i18nKey: "backDashboard",
    meta: { name: "Back to dashboard", description: "Return to the dashboard from any view", group: "navigation" },
  },

  // --- Data (mod combos) ---
  {
    id: "export-backup",
    kind: "hotkey",
    display: "Mod+E",
    hotkey: "Mod+E",
    i18nKey: "exportBackup",
    meta: { name: "Export backup", description: "Download a JSON backup of all data", group: "data" },
  },
  {
    id: "import-backup",
    kind: "hotkey",
    display: "Mod+I",
    hotkey: "Mod+I",
    i18nKey: "importBackup",
    meta: { name: "Import backup", description: "Restore data from a JSON backup file", group: "data" },
  },
];

/** Custom event names dispatched by keyboard shortcuts */
export const SHORTCUT_EVENTS = {
  newTask: "agent-desk:new-task",
  newEvent: "agent-desk:new-event",
  toggleTheme: "agent-desk:toggle-theme",
  exportBackup: "agent-desk:export-backup",
  importBackup: "agent-desk:import-backup",
} as const;

/** Dispatch a shortcut CustomEvent on window. */
export function dispatchShortcutEvent(name: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(name));
}
