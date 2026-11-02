# 024 — trips by day (driving behaviour)

- **Status:** in-progress
- **Mode:** AFK
- **Estimate:** 1d
- **Depends on:** 022, 023
- **Blocks:** none

## Goal

The list under the Trips summary card becomes the days of the card's period, like the Honda app's "Thói quen lái xe": one row per driven day (Year: per month) with the trip count, km and time; opening a day shows its trips with Honda's speed bands (max, avg) and a fuel meter coloured against this car's own average. Spec: HANDOFF › Honda PIN and trip detail › Trips by day; boards Trips-days, Trips-days-spec.

## Acceptance criteria

- [x] List = days of the shown period, newest first, days without trips skipped (Week / Month); Year = months (tap → card switches to Month on that month). Header reads the period ("Last week · 6 days", "2026 · by month").
- [x] Day row 60 pt: acc ring 2.5 pt with the trip count, day ("Sat 1 Nov" / "T7, 1/11"), "3 trips", total km + total time (short form), chevron (rotates 90°). Tap opens / closes; several can be open; the newest starts open; no haptic. Settle 240 ms; Reduce Motion: no slide.
- [x] Open day: its trips (from `/car/trip?day=`, no PIN), indented 48 pt. Places saved → time range on top then from / to; no places → start / end times. km pill + minutes level with the first line. One metrics row in 3 equal columns: Max speed bands, Avg speed bands, Fuel meter.
- [x] Speed bands: 3 segments; 1 ≤ 49 km/h, 2 for 50–89, 3 ≥ 90; filled acc for band 1, warn for 2–3; empty `line`.
- [x] Fuel: 24 pt meter (fill 6 → 16 km/l) + value; warn when 10%+ worse than this car's 30-day average km/l, acc when 10%+ better, else fg2; under 5 trips of history → fg2.
- [x] Bar tap on the card opens that day, closes the others and scrolls it into view (no more "Show recent").
- [x] VoiceOver: one sentence per trip with the numbers. Tap a trip → Trip detail (PIN rules unchanged). PIN banner stays for loaded trips without places.

## Test plan

### Layer 1 — Pure logic (TDD)

- [x] `speedBand` — null 0, 49 → 1, 50 → 2, 89 → 2, 90 → 3.
- [x] `fuelFill` — clamps 6 → 16 to 0..1.
- [x] `fuelTone` — warn / fg2 / acc around ±10%, fg2 under 5 trips.
- [x] `fuelAverage` — distance-weighted km/l and trip count over the last 30 days.
- [x] `periodDays` — week / month day rows newest first without empty days; year → month rows.

### Layer 2 — Manual smoke

- [ ] Live on the phone: day totals match the Honda app's Driving behaviour list.

### Layer 3 — Visual review

- [x] iOS 27 and iOS 18.5: week with days open / closed, bar tap, year by month, VI.

## Notes

- Day totals come from the summary Day rows (same numbers as the trips, no extra calls); trips load when a day opens and past days stay cached.
- Refinement 2: all days start open; closed days are kept for the app session; bar tap opens that day only if closed. Accordion animates the measured height (Settle 280 ms) and fades trips (200 ms); Reduce Motion: 150 ms fade. Units on every stat, metric labels (10 pt, new token `fg3`) above each row, time line 10 pt `fg3`.
- Checked: iOS 27 (week open/closed, bar tap opens Fri and closes others, Year → October), iOS 18.5 in VI.

## Out of scope

- A calendar picker (the card's pager covers browsing).
