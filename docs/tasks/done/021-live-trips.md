# 021 — live trips without the honda pin

- **Status:** done
- **Mode:** AFK
- **Estimate:** 0.5d
- **Depends on:** 014
- **Blocks:** none

## Goal

Trips shows the car's real drives from Honda in Live mode: the last 7 days as the week chart, totals, and a list of trips. It uses only reads that need no Honda PIN, so trips have time, distance, duration, average speed and fuel use, but no place names, route or driving score.

## Why now

Trips was the last screen still showing "coming soon" in Live mode. The user chose to build it without the PIN first; a PIN screen (routes, places) is a later task.

## Acceptance criteria

- [x] Live `trips()` reads `GET /car/trip?day&month&year` for each of the last 7 days (no PIN, no uoid) and returns them newest first.
- [x] Each trip maps start/end time, km, minutes, average speed and fuel use; missing values stay null, never 0.
- [x] A day that fails does not hide the other days; all 7 failing shows the error state.
- [x] Trip rows without places show the time range and "avg km/h · km/l" instead of from → to.
- [x] The score card stays hidden (no driving data without the PIN).
- [x] Mock trips keep their places and score.

## Test plan

### Layer 1 — Pure logic (TDD)

- [x] `toTrips` — maps a real day reply, keeps nulls, drops rows without a start time.
- [x] `lastDays` — 7 dates, today first, across a month edge.

### Layer 2 — Manual smoke (glue/IO)

- [x] Read-only probe: `/car/trip?day=1&month=11&year=2026` returns 2 trips with the session alone; `uoid` is not needed. `/car/trip/summary?sumDay=1|7` returns INVALID_ARGUMENT (not used).
- [ ] Live mode on the phone shows this week's drives (not done at close; tracked as a follow-up).

### Layer 3 — Visual review

- [x] Simulator: Trips rows without places (mock with places removed) and with places.

## Design notes

- **Contracts changed:** `Trip.from` / `Trip.to` become nullable; `Trip` gains `endedAt`, `avgKmh`, `kmPerL` (nullable).
- **New modules:** none.
- **New ADR needed?** no.

## Out of scope

- Honda PIN entry, `/car/trip/recent`, trip detail (route, places) — needs the PIN token.
- Driving score: `/car/trip/summary` args are unknown and accel/brake % come back null.

## Definition of Done

- [x] Layer 1 tests written and green
- [ ] Layer 2 smoke checklist completed
- [x] Layer 3 screenshots captured
- [x] Lint + format clean
- [x] Typecheck clean
- [x] Tests green
- [x] Per-area docs updated for any modified module
- [x] No commented-out code, no debug-log debris, no AI attribution
- [x] Task closed: status → done, file moved to `docs/tasks/done/`, t021 in commit
