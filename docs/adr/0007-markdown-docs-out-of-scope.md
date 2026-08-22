# ADR-0007: Markdown docs out of scope — agents use file tools

- **Status:** Accepted
- **Date:** 2025-08-22

## Context

Originally considered managing documents/knowledge (Notion-style) within the app. Agents already have native file tools (read, write, edit, grep) that are more efficient for text.

## Decision

No document management in agent-desk. Agents manage knowledge as markdown files on disk using their native file tools. agent-desk focuses on tasks, events, sessions, and relationships.

## Consequences

- Smaller scope, faster delivery.
- Knowledge stays greppable and editable with any tool.
- If needed later, File System Access API could bridge disk markdown into the app UI.
