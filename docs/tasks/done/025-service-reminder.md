# 025 — build the service reminder, estimated odometer and service history

- **Status:** done
- **Mode:** HITL
- **Estimate:** 1d
- **Depends on:** 014, 022
- **Blocks:** none

## Goal

Status shows when the next periodic service is due (km and date, whichever first) and an estimated odometer. When service is soon or overdue, Status and Home show an amber banner. A sheet shows the target, Honda's plan estimate and the dealer service history. Matches [Service](../../apps/mobile/design/boards/Service.dc.html); spec row in [HANDOFF › Screen map](../../apps/mobile/design/HANDOFF.md#screen-map); data in [FINDINGS Round 11](../../research/FINDINGS.md).

## Why now

Honda has no live odometer, and the old "Service in 1,200 km" banner was always empty on a live car. Round 11 found the target, the reminder window and the dealer history, so both can come back without the PIN.

## Acceptance criteria

- [x] Data, no PIN: level, target km and date from `/car/topPage` vehicleInfo; km and days left and plan price from `/car/nextMaintenance`; history from `/maintenance?uoid` (+ `/maintenance/detail` for price).
- [x] Level: overdue = `OVER_DUE`; soon = ≤ 1,000 km or ≤ 30 days left; else OK; missing fields hide the tile and banners.
- [x] Status: wide Service tile last in the grid ("in 4,800 km" / "or 40 days · 12 Dec · whichever first"; overdue "Overdue" / "Was due at 30,000 km · 20 Oct"); soon / overdue add the amber wrench banner on top. The old serviceInKm banner is gone.
- [x] Odometer tile: newest history `endMileage` + trip km after that day (Day summaries) as "≈ 34,120 km" + "estimated"; tap explains the source in one line; hidden with no history.
- [x] Home: soon / overdue only, 44 pt amber banner under the location card, below door / window banners; tap opens Status with the sheet open.
- [x] Sheet: native form sheet; title (amber when overdue), help line, rows Due at / Due date / Left / Plan estimate; Service history (3 newest: Honda's type name, date, km, price); "All n" shows the full list; "Already serviced? Hide until Honda updates" hides the banners (tile stays) until the target changes.
- [x] warn token, never red; VND with dot thousands; no haptics; EN + VI copy.

## Test plan

### Layer 1 — Pure logic (TDD)

- [x] Level: overdue, soon by km, soon by days, OK, missing.
- [x] Odometer estimate: newest visit + trip km after its day; none without history.
- [x] Hidden: hide key matches only the same target.

### Layer 2 — Manual smoke (glue/IO)

- [x] Live car (OVER_DUE): tile, banners, sheet, history and estimate match Honda's replies.
- [x] Hide, then reopen: banners stay hidden, tile stays.

### Layer 3 — Visual review

- [x] iOS 18.5 VI (mock + live OVER_DUE car) and iOS 27 EN (mock), vs `screenshots/Service.png`. Not run: iOS 27 on the live car (sim is signed out).

## Design notes

- **Contracts changed:** `CarService.service()` returns the reminder and history; `CarStatus.serviceInKm` and `odometerKm` go away (always null live). Prefs gain `serviceHidden` (target key).
- **New modules:** `src/car/service.ts` (pure), `app/service.tsx` (form sheet), `app/service-history.tsx` (full list).
- **New ADR needed?** no.

## Out of scope

- Booking a service (Honda hands off to the My Honda+ app).
- Telling Honda a service is done (no API; FINDINGS Round 11).
- `/car/maintenanceMode` (turns Honda's alerts off; a write).
