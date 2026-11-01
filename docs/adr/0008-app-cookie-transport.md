# 0008 — The app keeps Honda cookies in its own Keychain jar

- **Status:** Accepted
- **Date:** 2026-11-02

## Context

The Honda session lives in cookies (`JSESSIONID`, `iprmtkn`, `AWSALB`). On iOS, React Native's `fetch` stores cookies in the shared `NSHTTPCookieStorage` by itself, which survives in app storage outside the Keychain and cannot be cleared per account from JS. `@xekey/core` already manages cookies with its own `CookieStore` (ADR 0003), and the CLI relies on it.

## Decision

Every app request goes through `HondaHttp` with `credentials: "omit"`, so iOS neither sends nor stores cookies. Core reads `Set-Cookie` itself and writes the jar to the Keychain (SecureStore, `WHEN_UNLOCKED_THIS_DEVICE_ONLY`). Sign out deletes the jar.

## Consequences

- One cookie path for CLI and app, covered by core's tests.
- The session lives only in the Keychain, never in backups.
- If a React Native version stops exposing `Set-Cookie` to JS, sign-in breaks loudly (no session cookie) rather than silently using the shared jar.

## Alternatives considered

- **Native cookie jar** (`credentials: "include"`) — less code, but the session sits outside the Keychain and core's cookie logic forks between CLI and app.
- **`@react-native-cookies/cookies`** — a native module to read the shared jar; extra dependency for the same result.
