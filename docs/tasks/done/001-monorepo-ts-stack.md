# 001 — set up monorepo + port login to typescript

- **Status:** done
- **Mode:** HITL
- **Estimate:** 1d
- **Depends on:** none
- **Blocks:** 002 (api client commands), 003 (expo app)

## Goal

Turn the Honda RE workspace into a pnpm monorepo and port the Python login flow to a
shared TypeScript package, so the CLI and a future Expo app share one API client.

## Why now

The reverse-engineering is done and the API is mapped; the product work (CLI + Expo
client) needs a real toolchain and a shared `@honda/core` to build on.

## Acceptance criteria

- [x] pnpm workspace with `packages/*` + `apps/*`, turbo, Biome, tsconfig base.
- [x] `@honda/core` ports the login/verify/session logic from `research/honda_login.py`.
- [x] `@honda/cli` reproduces the interactive login against `@honda/core`.
- [x] Pure logic (envelope, region, device) unit-tested; typecheck + lint green.
- [x] Secrets gitignored; RE artifacts moved to `research/`.

## Test plan

### Layer 1 — Pure logic (TDD)
- [x] `parseEnvelope` / `isSuccess` — success, null-safety, error code.
- [x] `region` — host map, shape, count.
- [x] `resolveDeviceId` — env override, generated shape.

### Layer 2 — Manual smoke (glue/IO)
- [x] `pnpm cli` logs in with `HONDA_DEVICE_ID` set and saves a session.

### Layer 3 — Visual review
n/a — no UI in this task.

## Out of scope

- Expo app implementation (slot scaffolded only).
- Status / remote-command endpoints (task 002).

## Definition of Done

- [x] Layer 1 green, Layer 2 smoked, lint/typecheck/tests green, no AI attribution.

## Notes

`mit_honda.py` stays Python (mitmproxy addons must be). Mobile transport needs an
RN-compatible cookie layer — flagged in `apps/mobile/CLAUDE.md`, decide via ADR.
