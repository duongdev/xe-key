# 014 — live read-only car status

- **Status:** done
- **Mode:** HITL
- **Estimate:** 1d
- **Depends on:** 013
- **Blocks:** 015

## Goal

Home, doors, climate status, find, status and alerts show real data from the Honda API in Live mode.

## Why now

Commands (015) confirm against real status.

## Acceptance criteria

- [x] `/car`: default car (else first), Entitlement from the package bitmask, Paint from `color`.
- [x] topPage, dashboard, door and engine status map to `CarStatus`; unknown fields (plate, odometer, per-door) are nullable and hidden.
- [x] `startsLeft` from `resStartCounter` only if the probe shows it counts starts; else hidden.
- [x] Find refreshes with GET `/car/finder/location` only.
- [x] Alerts: full list in a virtualized SectionList; swipe delete → Undo toast → `DELETE /car/alertMessages?oid&warningType` on dismiss; failure restores the row. (Delete not run live yet: needs the owner's approval per alert.)
- [x] Refresh on foreground, screen focus and pull-to-refresh; `staleTime` 30 s; no interval polling.
- [x] `wake()` removed from `CarService`; no `access-screen` calls.

## Test plan

### Layer 1 — Pure logic (TDD)

- [x] Response → `CarStatus` mapping, with null-safe access on missing fields.
- [x] Entitlement bitmask.
- [x] `color` → nearest Paint.

### Layer 2 — Manual smoke (glue/IO)

- [x] Live mode: each screen shows the real car (GETs need no approval; each delete does).

### Layer 3 — Visual review

- [x] Screens with real data, hidden-null fields, long alert list scroll.

## Design notes

- **Contracts changed:** `CarStatus` fields nullable where unknown; `CarService.wake` removed.
- **New modules:** live `CarService` adapter (read side).
- **New ADR needed?** no.

## Out of scope

- Commands (015), trips.

## Definition of Done

See [TEMPLATE.md](TEMPLATE.md#definition-of-done).

## Notes

- Done 2026-11-02. Live Home, Status, Find, Alerts and Trips ("coming soon") checked on the simulator; relaunch keeps the session (013 carry-over).
- Place names come from Apple's on-device geocoder (`expo-location`), cached per ~100 m; distance needs the phone's location (asked on Find only).
- Commands other than Find show "Not available yet" in Live mode until 015.
- `startsLeft = 2 − resStartCounter` is unverified (FINDINGS); cabin 0 °C = no reading.
- Geocoded names follow the phone's system language, not the app's.
