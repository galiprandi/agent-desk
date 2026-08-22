# ADR-0009: Bilingual UI (ES/EN) with react-i18next

- **Status:** Accepted
- **Date:** 2025-08-22

## Context

Template should be usable by Spanish and English speakers. App code should always be in English for maintainability.

## Decision

- **react-i18next** for i18n with ES and EN translations.
- Language toggle in header, preference stored in `localStorage`.
- All UI strings translated.
- Code, comments, variable names always in English.

## Consequences

- Two translation files to maintain.
- Adding more languages later is straightforward.
- App code stays consistent in English.
