# 022 — driving summary card on trips

- **Status:** in-progress
- **Mode:** AFK
- **Estimate:** 1d
- **Depends on:** 021
- **Blocks:** 023

## Goal

Trips shows a driving summary card instead of the score ring (Honda has no score): a Week / Month / Year switch, ‹ › and swipe to earlier periods (as far back as Honda keeps Day rows, ~6 months), distance bars, and Distance, Time, Avg speed, Max speed, Fuel and a day/night bar. Tapping a bar lists that day's trips under a fixed list header with "Show recent". Nothing moves when the period, range or bar changes. Spec: HANDOFF › Honda PIN and trip detail › Driving summary / Browse periods / Bar tap / No drift; board Trips-summary.

## Why now

The user approved the Trips design; the summary needs no PIN and is the base the PIN work (023) builds on.

## Acceptance criteria

- [x] Data from `GET /car/trip/summary?summaryType=Day|Month|Year` (no PIN). Week = the 7 calendar days (Mon–Sun) summed from Day rows; Month = that month's Day rows; Year = Month rows of that year.
- [x] Stats: distance (sum), time (sum), avg speed (distance / time), max speed (max), fuel (distance-weighted km/l), day/night split as percent. Empty period: flat bars, stats "–", title "No trips this week/month/year".
- [x] Title: This week · Last week · 19–25 Oct; This month · October 2026; 2026. With trip count. ‹ › and swipe step periods; arrows faint and inert at the ends (oldest Day row, current period). `selection` haptic per step and on switch change.
- [x] Bars: 7 days / days of month / 12 months; current one acc; future faint and not tappable. Bar tap selects (acc, others dim), list header "Sat 31 Oct · 2 trips" + "Show recent"; tap again or Show recent → recent trips. Day trips from `/car/trip?day&month&year`. No haptic.
- [x] Hard accel / braking rows only when Honda ever sent a value above 0 for this car (decided per car, not per period).
- [x] No drift: fixed card height, fixed arrows and bar area, values shrink to fit instead of wrapping, list header always present; a loading day list keeps the last rows at 50% opacity.
- [x] Header trip/km pills removed. Mock service gives summary rows too.

## Test plan

### Layer 1 — Pure logic (TDD)

- [x] `toSummaryRows` — maps a real summary reply; nulls stay null.
- [x] `periodOf` / `stepPeriod` — week (Mon start), month, year; step back and forward; ends.
- [x] `periodStats` — sums, distance-weighted fuel, avg speed, day/night percent, empty.
- [x] `periodBars` — 7 / days-in-month / 12 slots, today flag, future flag.
- [ ] `periodTitle` — This week, Last week, ranges across months, This month, month name, year (EN/VI).

### Layer 2 — Manual smoke (glue/IO)

- [ ] Live on the phone: week/month/year numbers match the Honda app's Driving behaviour screen.

### Layer 3 — Visual review

- [x] Simulator (mock): Week, Month, Year, an earlier week, a selected bar. (Empty period not captured.)

## Design notes

- **Contracts changed:** `CarService.trips()` now returns `Trip[]`; new `CarService.summary()` (Day, Month, Year rows) and `CarService.dayTrips(day)`. `Driving` (score) and the score ring are removed. New colour token `night`.
- **New modules:** `src/car/summary.ts` (pure period math and stats).
- **New ADR needed?** no.

## Notes

- Design update 2: the card is a pager (`src/ui/summary-card.tsx`): drag the body sideways with the neighbour period visible, snap past 25% or a flick (Settle 300 ms), else spring back; ends rubber-band; ‹ › slide the same way; selection haptic when a period lands. Pan `activeOffsetX ±12`, `failOffsetY ±10`. Stats are number 16 semibold + unit 12, time "3h54" / "24 min", day/night as two percents with dots; VI labels per HANDOFF. Card height fixed at 362 pt (the board's 321 pt doesn't fit the app's 40 pt switch and text line heights). Prefetch of neighbours is not needed: all periods come from one summary read. Trip rows moved to `src/ui/trip-row.tsx` with the 20 pt line layout. Checked on the simulator: week, drag to last week (snap), stats format.

- Added (HANDOFF update): pull to refresh on the Trips list (summary, the shown day, recent trips, new places when a token exists; values stay in place) and skeletons shaped like the card and rows instead of a spinner. Checked on the simulator: loading skeleton, pull with values kept.

- Not done: bars growing from 0 (Settle 240 ms) on period change; `periodTitle` is in the screen, not a pure tested function. Year bars are not tappable (a month's trips would need a call per day).
- A loading range keeping old values at 50%: the summary loads all periods at once, so only the day list does this.

## Out of scope

- PIN, places, trip detail (023).

## Definition of Done

- [x] Layer 1 tests written and green
- [ ] Layer 2 smoke checklist completed
- [x] Layer 3 screenshots captured
- [x] Lint + format clean
- [x] Typecheck clean
- [x] Tests green
- [x] Per-area docs updated for any modified module
- [x] No commented-out code, no debug-log debris, no AI attribution
- [ ] Task closed: status → done, file moved to `docs/tasks/done/`, t022 in commit
