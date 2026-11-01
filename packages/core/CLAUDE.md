# @honda/core

## Purpose
The API client for Honda CONNECT One (APAC). Auth, session, endpoints, HTTP. No UI,
no IO beyond `fetch` and session file read/write.

## Layout
- `region.ts` — per-country base URLs.
- `endpoints.ts` — API path constants.
- `envelope.ts` — iPLAss `{status, results:{data,error}}` parsing. Pure.
- `http.ts` — `fetch` + cookie jar + `app: OneApp` header.
- `auth.ts` — `login` / `verifyCode` / `resendCode`.
- `session.ts` — session type + save (chmod 600) / load.
- `device.ts` — deviceId resolution (env > file > generated).

## Conventions
- Pure modules (`envelope`, `region`, `device`) are unit-tested first.
- `http`/`auth` are IO glue — covered by manual smoke via the CLI, not mocks.

## Gotchas
- Auth is cookie-based; always reuse one `HondaHttp` across login -> verify -> calls.
- A new `deviceId` triggers a device-change OTP. Reuse the registered device's id
  (`HONDA_DEVICE_ID`) to avoid it.
- The server needs `app: OneApp` or it returns `OLD_APP_BLOCK_LOGIN`.
