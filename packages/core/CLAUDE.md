# @xekey/core

## Purpose
The API client for Honda CONNECT One (APAC). Auth, session, endpoints, HTTP. No UI.
The package root is runtime-agnostic (bundles in React Native); Node-only helpers live at
`@xekey/core/node` ([ADR 0003](../../docs/adr/0003-portable-core.md)).

## Layout
- `region.ts` — per-country base URLs.
- `endpoints.ts` — API path constants.
- `envelope.ts` — iPLAss `{status, results:{data,error}}` parsing. Pure.
- `http.ts` — `HondaHttp({ base, fetch?, cookies? })` + `app: OneApp` header.
- `cookies.ts` — `CookieStore`, in-memory jar, Set-Cookie parsing (also React Native's comma-joined header). Pure.
- `auth.ts` — `login` / `verifyCode` / `resendCode`.
- `session.ts` — session type, `buildSession`, `parseSession` (snake_case tolerant). Pure.
- `node/` — `@xekey/core/node`: session file save (chmod 600) / load, `fileCookies`, `resolveDeviceId` (env > file > generated).

## Conventions
- Pure modules (`envelope`, `region`, `cookies`, `session`) are unit-tested first.
- Root files must not import `node:*` or read `process.env` — `portable.test.ts` enforces it.
- `http`/`auth` are IO glue — covered by manual smoke via the CLI, not mocks.

## Gotchas
- Auth is cookie-based; always reuse one `HondaHttp` across login -> verify -> calls.
- A new `deviceId` triggers a device-change OTP. Reuse the registered device's id
  (`HONDA_DEVICE_ID`) to avoid it.
- The server needs `app: OneApp` or it returns `OLD_APP_BLOCK_LOGIN`.
