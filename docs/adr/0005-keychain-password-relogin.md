# 0005 — Keep the password in the Keychain for silent re-login

- **Status:** Accepted
- **Date:** 2026-11-01

## Context

The Honda session (`JSESSIONID` + `iprmtkn`) expires after an unknown time. Without a way to sign in again, the user would see the sign-in screen at random — the worst moment being next to the car. `BIOMETRIC_REFRESH_TOKEN` login exists but is unverified and depends on a setup step in the official flow.

## Decision

After a successful sign-in, Xe Key stores the phone number and password in the Keychain (Expo SecureStore, `WHEN_UNLOCKED_THIS_DEVICE_ONLY`). When a call fails with an expired session, the app signs in again silently with the stored credentials and the same deviceId (no SMS code), then retries the call once. When the Face ID setting is on, reading the credentials requires Face ID. Sign out deletes them.

## Consequences

- No surprise sign-in prompts; commands survive session expiry.
- The password lives on the device. It never leaves the Keychain except in the login request, never goes to logs, cache or backups (this-device-only).
- A wrong stored password (changed elsewhere) must fall back to the sign-in screen, not loop.

## Alternatives considered

- **Biometric refresh token** — unverified; probe later and switch if it works.
- **Ask the user to sign in again** — simplest and safest, but breaks the "instant" promise.
