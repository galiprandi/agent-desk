# ADR-0017: Keyboard shortcuts via TanStack Hotkeys

- **Status:** Accepted
- **Date:** 2026-08-23

## Context

Agents and humans navigate the dashboard frequently. Mouse-only navigation is slow for keyboard-first users and impossible for agents that drive the browser via keyboard events. A documented set of keyboard shortcuts improves navigation speed and discoverability.

## Decision

Implement keyboard shortcuts using **`@tanstack/react-hotkeys`** (v0.10.0), the TanStack library for typed keyboard shortcut management with scopes, sequences, held keys, conflict detection, and platform-aware display.

### Architecture

1. **Central registry** (`src/lib/shortcuts.ts`) — a single `SHORTCUTS` array is the source of truth for all shortcut definitions (id, kind, display, hotkey/sequence, i18nKey, meta with name/description/group). Both the registration hook and the ShortcutsView read from this registry.

2. **`useKeyboardShortcuts` hook** (`src/hooks/useKeyboardShortcuts.ts`) — called once in the rootRoute layout component so shortcuts are active on every view. Uses:
   - `useHotkeys` (plural) for single-chord shortcuts (`?`, `s`, `x`, `t`, `Esc`, `Mod+E`, `Mod+I`)
   - `useHotkeySequences` for vim-style multi-key sequences (`g d`, `g t`, `g c`, `g s`, `n t`, `n e`)
   - `useNavigate` from TanStack Router for navigation

3. **`ShortcutsView`** (`src/views/ShortcutsView.tsx`) — accessible at `/shortcuts`, displays the full shortcut list grouped by category. Uses `useHotkeyRegistrations` from TanStack Hotkeys to show a live count of registered shortcuts. Pressing `?` navigates here.

4. **Cross-component communication** — shortcuts that trigger actions in other components (new task, new event, toggle theme, export, import) dispatch `CustomEvent`s on `window`. The relevant components (`TasksView`, `CalendarView`, `Header`) listen for these events. This avoids prop drilling and keeps the shortcut hook decoupled from the UI components.

### Shortcut set

| Group | Key | Action |
|---|---|---|
| Navigation | `g d` | Go to Dashboard |
| Navigation | `g t` | Go to Tasks |
| Navigation | `g c` | Go to Calendar |
| Navigation | `g s` | Go to Shortcuts |
| Navigation | `Esc` | Back to Dashboard |
| Actions | `?` | Show shortcuts |
| Actions | `n t` | New task |
| Actions | `n e` | New event |
| Session | `s` | Start session |
| Session | `x` | End session |
| UI | `t` | Toggle theme |
| Data | `Mod+E` | Export backup |
| Data | `Mod+I` | Import backup |

### Conventions

- **Single keys** use `ignoreInputs: true` so they don't fire while typing in form fields (per ADR-0013 accessibility). `Mod+` combos use the smart default (fire in inputs).
- **Sequences** are vim-style: press the first key, then the second within 1 second. Also `ignoreInputs: true`.
- **`Mod`** is cross-platform: `Cmd` on Mac, `Ctrl` elsewhere.
- All shortcuts carry `meta: { name, description, group }` for introspection via `useHotkeyRegistrations` and devtools.
- `HotkeyMeta` is extended via TypeScript declaration merging with a `group` field.

### CustomEvent names

| Event | Dispatched by | Listened by |
|---|---|---|
| `agent-desk:new-task` | `useKeyboardShortcuts` (n t) | `TasksView` |
| `agent-desk:new-event` | `useKeyboardShortcuts` (n e) | `CalendarView` |
| `agent-desk:toggle-theme` | `useKeyboardShortcuts` (t) | `Header` |
| `agent-desk:export-backup` | `useKeyboardShortcuts` (Mod+E) | `Header` |
| `agent-desk:import-backup` | `useKeyboardShortcuts` (Mod+I) | `Header` |

Agents can also dispatch these events directly via `eval` to trigger the same actions without pressing keys.

## Consequences

- Shortcuts are active on all views (registered in rootRoute), so there's no per-view registration needed.
- The shortcut set is documented in-app at `/shortcuts` and in the agent skill, so agents and humans can discover them.
- Adding a new shortcut requires only one entry in `SHORTCUTS` + one case in `useKeyboardShortcuts` + i18n strings. The ShortcutsView picks it up automatically.
- `@tanstack/react-hotkeys` is a new dependency (~5KB gzipped). It's a TanStack library, consistent with the existing stack (Router, Table, Query).
- Sequences have a 1-second timeout; slow typists may miss them. This is acceptable for a vim-style scheme.
