# ADR-0003: Tailwind CSS + shadcn/ui

- **Status:** Accepted
- **Date:** 2025-08-22

## Context

Need accessible, composable UI components (dialogs, dropdowns, popovers) for kanban, calendar, and forms. Need dark/light theme support.

## Decision

- **Tailwind CSS** for utility-first styling.
- **shadcn/ui** for accessible component primitives (copy-paste components, not a dependency).
- Dark + light theme with toggle, stored in `localStorage`.

## Consequences

- Components are owned (copied into repo), not a dependency. Full control to customize.
- Accessibility built-in via Radix primitives.
- Theme toggle is simple with Tailwind's dark mode.
