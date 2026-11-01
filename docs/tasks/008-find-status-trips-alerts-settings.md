# 008 — build find, status, trips, alerts and settings screens

- **Status:** ready
- **Mode:** HITL
- **Estimate:** 1d
- **Depends on:** 005
- **Blocks:** none

## Goal

The five secondary screens exist with mock data and all four states, matching [Find](../../apps/mobile/design/boards/Find.dc.html), [Status](../../apps/mobile/design/boards/Status.dc.html), [Trips](../../apps/mobile/design/boards/Trips.dc.html), [Notifications](../../apps/mobile/design/boards/Notifications.dc.html), [Settings](../../apps/mobile/design/boards/Settings.dc.html) and [Empty-states](../../apps/mobile/design/boards/Empty-states.dc.html).

## Acceptance criteria

- [ ] Find: map with car pin, distance/age/accuracy chips, Update uses the command pattern.
- [ ] Status: top-down car diagram highlights open or warning parts in amber.
- [ ] Trips: 7-day bar chart, score ring, behaviour bars, route rows.
- [ ] Alerts: swipe-to-delete with Undo toast.
- [ ] Empty and error states for each screen.
- [ ] Settings has "Face ID for unlock & start" (off by default; local gate via `expo-local-authentication`).
- [ ] Settings has a dev-build-only (`__DEV__`) switch between mock and live car service.
- [ ] Each screen matches its screenshot.

## Test plan

### Layer 1 — Pure logic (TDD)

- [ ] Door/window status → diagram highlight mapping.
- [ ] Trip aggregation for the 7-day chart.

### Layer 2 — Manual smoke (glue/IO)

n/a — mock data only.

### Layer 3 — Visual review

- [ ] Screenshots of populated, empty and error for each screen.

## Out of scope

- Real map SDK choice beyond a placeholder (decide in an ADR if needed).

## Definition of Done

See [TEMPLATE.md](TEMPLATE.md#definition-of-done).
