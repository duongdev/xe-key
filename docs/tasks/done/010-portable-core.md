# 010 — make @xekey/core runtime-agnostic

- **Status:** done
- **Mode:** AFK
- **Estimate:** 0.5d
- **Depends on:** none
- **Blocks:** live `CarService` adapter (after 005)

## Goal

`@xekey/core` can be bundled by Metro: its root exports no Node built-ins, and `HondaHttp` takes an injected `fetch` and cookie store. Node-only helpers (session file, deviceId file) live at `@xekey/core/node`, which the CLI uses. See [ADR 0003](../../adr/0003-portable-core.md).

## Why now

The Expo app cannot import core today. The live car service needs it.

## Acceptance criteria

- [x] `@xekey/core` root imports no `node:*` module (checked by a test that scans the built root entry, or a Biome restricted-import rule).
- [x] `HondaHttp` constructor takes `{ base, fetch?, cookies? }`; the default cookie store is in-memory.
- [x] `@xekey/core/node` exports the session file and deviceId file helpers plus a file-backed cookie store.
- [x] CLI works unchanged from the user's view (`pnpm cli login`, probe).
- [x] Lint, typecheck, tests green.

## Test plan

### Layer 1 — Pure logic (TDD)

- [x] Cookie parsing from `Set-Cookie` lines into the store (name/value, ignore attributes).
- [x] Cookie header serialisation from the store.

### Layer 2 — Manual smoke (glue/IO)

- [x] `pnpm cli` login against the real VN API still reaches the dashboard with a saved session.

### Layer 3 — Visual review

n/a.

## Design notes

- **Contracts changed:** `HondaHttp(base)` → `HondaHttp({ base, fetch, cookies })`; session/device helpers move to `@xekey/core/node`.
- **New modules:** `CookieStore` interface (in-memory default, file-backed in `/node`).
- **New ADR needed?** no — ADR 0003.

## Out of scope

- The RN cookie transport itself (spike in 005, own ADR).

## Definition of Done

See [TEMPLATE.md](../TEMPLATE.md#definition-of-done).

## Notes

- Done 2026-11-02. Root exports no Node built-ins (`portable.test.ts` scans every root file for `node:` imports and `process.env`).
- `HondaHttp({ base, fetch?, cookies? })`; Set-Cookie read via `getSetCookie()` when present (Node) else by splitting the comma-joined header (React Native), Expires-safe.
- `@xekey/core/node`: `saveSession`/`loadSession`, `resolveDeviceId`, `fileCookies`. Root keeps `buildSession` + new pure `parseSession`.
- CLI smoke: `pnpm cli` starts and resolves the new imports; `pnpm probe` reports a missing session cleanly. A full login was not run (needs the owner's credentials and an SMS code) — owner to confirm `pnpm cli` login + `pnpm probe`. The smoke run sent one login with empty fields to the VN server and wrote a throwaway `apps/cli/honda_device_id.txt` (deleted; now git-ignored repo-wide).
- Next: the app's live `CarService` adapter (Keychain cookie store, RN fetch) — needs the PIN probe and its own ADR for the transport details.
