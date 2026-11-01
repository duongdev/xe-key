# 008 — build find, status, trips, alerts and settings screens

- **Status:** done
- **Mode:** HITL
- **Estimate:** 1d
- **Depends on:** 005
- **Blocks:** none

## Goal

The five secondary screens exist with mock data and all four states, matching [Find](../../../apps/mobile/design/boards/Find.dc.html), [Status](../../../apps/mobile/design/boards/Status.dc.html), [Trips](../../../apps/mobile/design/boards/Trips.dc.html), [Notifications](../../../apps/mobile/design/boards/Notifications.dc.html), [Settings](../../../apps/mobile/design/boards/Settings.dc.html) and [Empty-states](../../../apps/mobile/design/boards/Empty-states.dc.html).

## Acceptance criteria

- [x] Find: map with car pin, distance/age/accuracy chips, Update uses the command pattern.
- [x] Status: top-down car diagram highlights open or warning parts in amber.
- [x] Trips: 7-day bar chart, score ring, behaviour bars, route rows.
- [x] Alerts: swipe-to-delete with Undo toast.
- [x] Empty and error states for each screen.
- [x] Settings has "Face ID for unlock & start" (off by default; local gate via `expo-local-authentication`).
- [x] Settings has a dev-build-only (`__DEV__`) switch between mock and live car service.
- [x] Each screen matches its screenshot.

## Test plan

### Layer 1 — Pure logic (TDD)

- [x] Door/window status → diagram highlight mapping.
- [x] Trip aggregation for the 7-day chart.

### Layer 2 — Manual smoke (glue/IO)

n/a — mock data only.

### Layer 3 — Visual review

- [x] Screenshots of populated, empty and error for each screen.

## Out of scope

- Real map SDK choice beyond a placeholder (decide in an ADR if needed).

## Definition of Done

See [TEMPLATE.md](../TEMPLATE.md#definition-of-done).

## Notes

- Done 2026-11-02. Find (Apple Maps via `react-native-maps`, dark/light), Status, Trips, Alerts, Settings; the `[screen]` stub is gone.
- Find: map runs under the sheet (no corner gaps); `mapPadding` keeps the car centred above it; the legal label is tucked with a fixed `LEGAL_TUCK` offset tuned on iPhone 16 Pro. Update uses the `find` command; Go opens Apple Maps walking directions.
- Status: diagram strips amber for an open window, dashed amber for an open door; service banner shows under 2,000 km.
- Alerts: swipe-left Delete (and a VoiceOver delete action); the row disappears at once, the server delete runs only after the 5 s Undo window. Mark-all-read in the header.
- Settings: Face ID (off by default, turns on only after a successful check), Siri, Language, Time format (pickers), Sign out (clears local state; Keychain wipe comes with the live adapter), Developer group in `__DEV__` (service shows Mock; Live waits for task 010).
- Board items left out: Sharing group (out of scope v1), Home zone / Speed alert / VIN / Renews rows (no API mapped yet), Theme row (follows system).
- New mock scenarios: `empty` (no trips/alerts/GPS) and `error` (trips/alerts fail).
- Toast here is minimal (top, single, 3/5 s); task 009 adds motion, swipe-up and kinds.
- Visual review: [apps/mobile/docs/review/](../../../apps/mobile/docs/review/) (`t008-*`), incl. Vietnamese.
