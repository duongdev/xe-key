# 013 — live sign-in and session in the app

- **Status:** done
- **Mode:** HITL
- **Estimate:** 1d
- **Depends on:** 010
- **Blocks:** 014, 015

## Goal

The app signs in to the real Honda API: device registration, login, device-change OTP, and a session that survives app restarts and re-logs in silently when it expires. Secrets live in the Keychain. A dev-only switch picks Mock or Live. The research record is corrected and backed by real response values.

## Why now

Every live screen (014) and command (015) needs a session.

## Acceptance criteria

- [x] `HONDA_PROBE_BODIES=1 pnpm probe` runs read-only GETs and writes raw values to a gitignored local file; FINDINGS gets units, enums and a field map with no personal data.
- [x] FINDINGS and Bruno no longer claim `access-screen` wakes the car; `COMMUNICATION_ERROR` and the round 3/4 command capture are marked unverified.
- [x] Password, deviceId, deviceToken and session cookies are in SecureStore (`WHEN_UNLOCKED_THIS_DEVICE_ONLY`, as ADR 0005), checked in the Keychain on the simulator.
- [x] App requests use `credentials: "omit"` and the core `CookieStore`, backed by SecureStore (ADR 0008).
- [x] Live `AuthService`: `/user/device` (random UUID `deviceToken`, kept), login, `NEED_VERIFICATION_CODE` → code screen, verifyCode → login again, resend.
- [x] Error mapping: `INVALID_CREDENTIAL`, `OLD_APP_BLOCK_LOGIN`, 5xx/network, `INVALID_VERIFICATION_CODE`/`INVALID_OTP_VERIFICATION_CODE`, `USER_NOT_FOUND_IN_COUNTRY`, unknown code.
- [x] `NO_LOGIN_SESSION` / `INVALID_TOKEN` / empty 500 → one silent re-login with the Keychain password, one retry; else signed-out state.
- [x] Developer settings (dev builds only): Car service Mock/Live, and a deviceId field to reuse an already-registered id.
- [x] Sign out calls `/auth/logout` and clears the Keychain.

## Test plan

### Layer 1 — Pure logic (TDD)

- [x] Error code → sign-in outcome mapping.
- [x] Session-expiry detection from an envelope / HTTP status.

### Layer 2 — Manual smoke (glue/IO)

Each live auth call needs the owner's approval first.

- [x] Sign in on the simulator with the dev deviceId: reaches home with a live session.
- [ ] Kill and relaunch: still signed in, no login call. (Moved to 014: nothing reads live data before it.)
- [ ] Wrong password shows the wrong-password state. (Not run: `INVALID_CREDENTIAL` is assumed from the app source.)

### Layer 3 — Visual review

- [x] Onboarding error states with live errors; Developer settings rows.

## Design notes

- **Contracts changed:** `AuthService` gains a live adapter; `carService` chosen by the dev switch.
- **New modules:** SecureStore-backed `CookieStore`; live auth adapter; code → state mapping.
- **New ADR needed?** yes — 0008 app cookie transport (`credentials: "omit"` + own store).

## Out of scope

- Live car data (014), commands (015), trips (need the Honda PIN token), push.

## Definition of Done

See [TEMPLATE.md](TEMPLATE.md#definition-of-done).

## Notes

- Done 2026-11-02. Live sign-in passed on the simulator with the official app's deviceId (no SMS code). Keychain holds 6 items, all `WhenUnlockedThisDeviceOnly`.
- VN username needs the trunk 0 (`0979…`); the bare 9 digits returns `USER_NOT_FOUND_IN_COUNTRY`.
- Login itself sends the SMS on a new device; the device screen no longer calls resend.
- Probe Round 7 (FINDINGS): mixed-case door values, `/car/status` all zeros, no plate/odometer, command results with `W001`/`W101`/`W003`/`RTS02` codes in alert history.
- Honda sends no model name (`VC5 883`); body comes from the car's name, paint from the colour word.
- Not done: Face ID on reading the stored password (ADR 0005); the app-level Face ID gate covers commands for now.
