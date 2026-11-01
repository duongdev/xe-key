# 015 — live remote commands

- **Status:** ready
- **Mode:** HITL
- **Estimate:** 1d
- **Depends on:** 014
- **Blocks:** none

## Goal

Lock, unlock, start, stop and extend reach the real car in Live mode and report Confirmed or Failed.

## Why now

Last step to a usable live app.

## Acceptance criteria

- [ ] Commands send a new `clientUUID` each; engine sends the AC setting.
- [ ] Lifecycle: Sent → Accepted (POST `SUCCESS`) → one pull after `timeOutInterval + 3 s` → Confirmed (`SUCCESS`) or Failed (anything else, or no reply).
- [ ] Face ID is the only gate; no Honda PIN calls.
- [ ] Commands not in the car's Entitlement are hidden.
- [ ] After Confirmed, status is refetched.

## Test plan

### Layer 1 — Pure logic (TDD)

- [ ] Pull delay from `timeOutInterval` (incl. missing data).
- [ ] Pull result → Confirmed / Failed.

### Layer 2 — Manual smoke (glue/IO)

Each command needs the owner's approval first.

- [ ] Lock and unlock confirm on the real car.
- [ ] Start, extend, stop confirm on the real car.

### Layer 3 — Visual review

- [ ] Command states with real timing.

## Design notes

- **Contracts changed:** none beyond the live adapter's command side.
- **New modules:** none.
- **New ADR needed?** no.

## Out of scope

- Horn/light, trips, push confirmation.

## Definition of Done

See [TEMPLATE.md](TEMPLATE.md#definition-of-done).

## Notes
