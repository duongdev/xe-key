# 010 — make @xekey/core runtime-agnostic

- **Status:** ready
- **Mode:** AFK
- **Estimate:** 0.5d
- **Depends on:** none
- **Blocks:** live `CarService` adapter (after 005)

## Goal

`@xekey/core` can be bundled by Metro: its root exports no Node built-ins, and `HondaHttp` takes an injected `fetch` and cookie store. Node-only helpers (session file, deviceId file) live at `@xekey/core/node`, which the CLI uses. See [ADR 0003](../adr/0003-portable-core.md).

## Why now

The Expo app cannot import core today. The live car service needs it.

## Acceptance criteria

- [ ] `@xekey/core` root imports no `node:*` module (checked by a test that scans the built root entry, or a Biome restricted-import rule).
- [ ] `HondaHttp` constructor takes `{ base, fetch?, cookies? }`; the default cookie store is in-memory.
- [ ] `@xekey/core/node` exports the session file and deviceId file helpers plus a file-backed cookie store.
- [ ] CLI works unchanged from the user's view (`pnpm cli login`, probe).
- [ ] Lint, typecheck, tests green.

## Test plan

### Layer 1 — Pure logic (TDD)

- [ ] Cookie parsing from `Set-Cookie` lines into the store (name/value, ignore attributes).
- [ ] Cookie header serialisation from the store.

### Layer 2 — Manual smoke (glue/IO)

- [ ] `pnpm cli` login against the real VN API still reaches the dashboard with a saved session.

### Layer 3 — Visual review

n/a.

## Design notes

- **Contracts changed:** `HondaHttp(base)` → `HondaHttp({ base, fetch, cookies })`; session/device helpers move to `@xekey/core/node`.
- **New modules:** `CookieStore` interface (in-memory default, file-backed in `/node`).
- **New ADR needed?** no — ADR 0003.

## Out of scope

- The RN cookie transport itself (spike in 005, own ADR).

## Definition of Done

See [TEMPLATE.md](TEMPLATE.md#definition-of-done).
