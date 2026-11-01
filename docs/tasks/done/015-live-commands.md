# 015 — live remote commands

- **Status:** done
- **Mode:** HITL
- **Estimate:** 1d
- **Depends on:** 014
- **Blocks:** none

## Goal

Lock, unlock, start, stop and extend reach the real car in Live mode and report Confirmed or Failed.

## Why now

Last step to a usable live app.

## Acceptance criteria

- [x] Commands send a new `clientUUID` each; engine sends the AC setting.
- [x] Lifecycle: Sent → Accepted (POST `SUCCESS`) → one pull after `timeOutInterval + 3 s` → Confirmed (`SUCCESS`) or Failed (anything else, or no reply).
- [x] Face ID is the only gate; no Honda PIN calls.
- [x] Commands not in the car's Entitlement are hidden.
- [x] After Confirmed, status is refetched.

## Test plan

### Layer 1 — Pure logic (TDD)

- [x] Pull delay from `timeOutInterval` (incl. missing data).
- [x] Pull result → Confirmed / Failed.

### Layer 2 — Manual smoke (glue/IO)

Each command needs the owner's approval first.

- [x] Lock confirms on the real car (unlock not run: leaves the car open).
- [ ] Start, extend, stop confirm on the real car. (Start passed; stop and extend wait for the next drive to re-arm remote starts.)

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

- Done 2026-11-02. Status is checked every 5 s after Accepted and confirms as soon as it shows the change; the single pull after Honda's wait (~150 s) is the fallback.
- Engine countdown comes from the car's report: `lastTimeCall + resTime min − 30 s` (±~1 min). The engine shows on (0:00 at worst) until the car reports off, so Stop stays reachable; status is re-read every 60 s only while the engine runs.
- Cancel only stops waiting; Honda's engine cancel endpoint is not wired.
