# ADR-0008: No auth — profile isolation is sufficient

- **Status:** Accepted
- **Date:** 2025-08-22

## Context

Data lives in the browser profile which is local and gitignored. Adding auth would complicate agent interaction (managing login via eval) without meaningful security gain.

## Decision

No authentication. Profile-level isolation (each agent has its own browser profile) is the security boundary. No PIN, no password, no passkey.

## Consequences

- Anyone with physical access to the profile can see the data. Acceptable trade-off for simplicity.
- If privacy on shared machines becomes a need, a local PIN could be added as opt-in later.
