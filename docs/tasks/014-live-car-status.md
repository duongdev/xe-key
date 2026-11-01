# 014 — live read-only car status

- **Status:** ready
- **Mode:** HITL
- **Estimate:** 1d
- **Depends on:** 013
- **Blocks:** 015

## Goal

Home, doors, climate status, find, status and alerts show real data from the Honda API in Live mode.

## Why now

Commands (015) confirm against real status.

## Acceptance criteria

- [ ] `/car`: default car (else first), Entitlement from the package bitmask, Paint from `color`.
- [ ] topPage, dashboard, door and engine status map to `CarStatus`; unknown fields (plate, odometer, per-door) are nullable and hidden.
- [ ] `startsLeft` from `resStartCounter` only if the probe shows it counts starts; else hidden.
- [ ] Find refreshes with GET `/car/finder/location` only.
- [ ] Alerts: full list in a FlatList; swipe delete → Undo toast → `DELETE /car/alertMessages?oid&warningType` on dismiss; failure restores the row with an error toast.
- [ ] Refresh on foreground, screen focus and pull-to-refresh; `staleTime` 30 s; no interval polling.
- [ ] `wake()` removed from `CarService`; no `access-screen` calls.

## Test plan

### Layer 1 — Pure logic (TDD)

- [ ] Response → `CarStatus` mapping, with null-safe access on missing fields.
- [ ] Entitlement bitmask.
- [ ] `color` → nearest Paint.

### Layer 2 — Manual smoke (glue/IO)

- [ ] Live mode: each screen shows the real car (GETs need no approval; each delete does).

### Layer 3 — Visual review

- [ ] Screens with real data, hidden-null fields, long alert list scroll.

## Design notes

- **Contracts changed:** `CarStatus` fields nullable where unknown; `CarService.wake` removed.
- **New modules:** live `CarService` adapter (read side).
- **New ADR needed?** no.

## Out of scope

- Commands (015), trips.

## Definition of Done

See [TEMPLATE.md](TEMPLATE.md#definition-of-done).

## Notes
