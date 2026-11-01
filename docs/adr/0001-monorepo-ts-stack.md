# 0001 — pnpm monorepo with a shared TypeScript core

- **Status:** Accepted
- **Date:** 2026-11-01

## Context

The project started as Python reverse-engineering scripts. It now needs two consumers
of the same Honda API — a CLI and an Expo (React Native) app — plus the RE sandbox.
Duplicating the auth/session/endpoint logic across a CLI and a mobile app would drift.

## Decision

Adopt a pnpm workspace monorepo. The API client lives once in `packages/core`
(TypeScript, native `fetch`, no heavy deps) and is consumed by `apps/cli` and
`apps/mobile`. The Python scripts are kept under `research/` as the RE record and a
reference implementation; the mitmproxy addon stays Python by necessity. Tooling is
pnpm + turbo + Biome + Vitest, matching the house stack.

## Consequences

- One source of truth for auth/endpoints; CLI and Expo share it.
- Mobile needs an RN-compatible transport — Node's cookie handling in `HondaHttp`
  won't port directly; that's a follow-up decision (own ADR).
- Slightly more structure than a single script, justified by two real consumers.

## Alternatives considered

- **Single TS package, no workspace** — would force the Expo app to vendor or copy the
  client; drifts the moment either side changes.
- **Keep Python, call it from RN via a service** — needs a server; overkill for a
  personal tool.

---

_ADRs are append-only. To change this decision, write a new ADR that supersedes it._
