# 0004 — Xe Key uses its own deviceId kept in the Keychain

- **Status:** Accepted
- **Date:** 2026-11-01

## Context

Honda binds an account to one deviceId. A new deviceId forces a device-change SMS code and signs out the other app. The official iOS app uses `identifierForVendor`, which resets when every app from the vendor is removed.

## Decision

On first launch Xe Key generates a random UUID and stores it in the Keychain (Expo SecureStore). Every auth call sends that id. It is never regenerated unless the user signs out and chooses to reset.

## Consequences

- Reinstalling Xe Key keeps the same deviceId, so no new SMS code.
- Signing in on Xe Key still signs the official app out (and the reverse); the "signed in on another phone" Home state covers that.
- Changing this scheme later forces every user through the SMS code again — hence an ADR.

## Alternatives considered

- **`identifierForVendor`** — matches the official app but resets on reinstall, costing an SMS code each time.
