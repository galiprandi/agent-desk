# ADR-0014: LLM instructions in DOM (hidden from humans)

- **Status:** Accepted
- **Date:** 2025-08-22

## Context

Agents load the app and need to know how to use each view's API without reading external docs. The skill teaches the API, but contextual hints in the DOM help the agent discover view-specific usage.

## Decision

Each view includes a hidden section at the bottom with small, transparent text containing API usage examples and use cases for that view. Text is in the DOM (readable via snapshot/eval) but visually invisible to humans (tiny font, near-transparent color, or visually hidden but not `display:none`). Content is bilingual based on i18n setting.

## Consequences

- Agents get contextual API hints without external lookups.
- Humans don't see clutter.
- Content must be kept in sync with API changes.
- Uses visually-hidden CSS pattern (not `display:none`, which some agents skip).
