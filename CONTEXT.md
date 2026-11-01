# CONTEXT — domain glossary

The single authority for vocabulary in this repo.

- **Honda CONNECT One** — Honda's APAC connected-car app (`ao.co.honda.hconnect`), one
  build serving 8 countries incl. Vietnam. The product we interoperate with.
- **Region** — a country whose API lives at `<country>-mob.aohondaconnect.com`. Selected
  at runtime; Vietnam is the default here.
- **iPLAss** — the Java backend framework behind the API. Replies are wrapped in an
  **envelope**: `{ status, results: { data, error } }`.
- **deviceId** — the identifier the server binds a session/registration to. Android uses
  `ANDROID_ID`; iOS uses an `identifierForVendor` UUID. A new deviceId triggers a
  **device-change OTP**; reusing a registered device's id avoids it.
- **Session** — cookie-based: `JSESSIONID` + `iprmtkn` (remember-me), plus `oid` (user
  id) and an `accessToken`. No payload encryption; TLS only.
- **TCU** — the car's telematics unit. Enforces hardware limits (e.g. max 2 consecutive
  remote engine starts) that no client can bypass.
- **`app: OneApp`** — the request header that marks the current app; without it the
  server returns `OLD_APP_BLOCK_LOGIN`.
- **research/** — the reverse-engineering record: static analysis sandbox, findings, and
  the original Python reference scripts.
