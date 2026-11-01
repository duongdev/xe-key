# 0003 — @xekey/core is runtime-agnostic; Node-only code moves to a subpath

- **Status:** Accepted
- **Date:** 2026-11-01

## Context

`@xekey/core` imports `node:fs` and `node:crypto` (session file, deviceId file), and `HondaHttp` owns an in-memory cookie jar fed by `Headers.getSetCookie()`. The Expo app cannot bundle Node built-ins, and React Native's fetch does not reliably expose `Set-Cookie`. Both the CLI and the app need the same auth, envelope and endpoint logic.

## Decision

The package root exports only portable code. Node-only modules (session file, deviceId file) move to `@xekey/core/node`, used by the CLI. `HondaHttp` takes an injected `fetch` and a cookie store; the CLI passes a file-backed store, the app a SecureStore-backed one. How the app reads cookies from responses (expo/fetch vs RN fetch vs native cookie storage) is settled by a spike in task 005 and recorded in its own ADR.

## Consequences

- One API client for both apps; no duplicated auth logic.
- Core must stay free of Node and RN imports at its root — a lint rule or a bundle check should guard it.
- CLI imports change from `@xekey/core` to `@xekey/core/node` for session and device helpers.

## Alternatives considered

- **Separate mobile client** — duplicates auth/envelope logic that already drifts-prone across two consumers.
- **Polyfill `node:fs` in Metro** — hides the problem; session storage on a phone must be SecureStore anyway.
