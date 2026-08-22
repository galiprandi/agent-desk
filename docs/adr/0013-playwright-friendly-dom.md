# ADR-0013: Playwright-friendly DOM

- **Status:** Accepted
- **Date:** 2025-08-22

## Context

The primary user of this app is an AI agent operating via playwright-cli. The DOM must be easy to automate: predictable selectors, semantic HTML, no obfuscation.

## Decision

- All interactive elements use `data-testid` attributes.
- Semantic HTML (native `button`, `input`, `textarea`).
- No shadow DOM, no iframes.
- `aria-label` on interactive elements.
- Avoid `contenteditable`.
- The API (`window.agentAPI`) is the primary interaction method; DOM automation is fallback for UI-only actions.

## Consequences

- Agents can reliably find elements by `data-testid`.
- UI is accessible by default.
- No trade-off between human and agent usability.
