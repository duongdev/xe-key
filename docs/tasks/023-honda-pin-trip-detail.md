# 023 — honda pin, trip places and trip detail

- **Status:** in-progress
- **Mode:** HITL (the user types the real PIN; no wrong-PIN tests on the real account)
- **Estimate:** 1.5d
- **Depends on:** 022
- **Blocks:** none

## Goal

With the Honda PIN, Trips shows place names and opens a trip detail screen with the route. PIN sheet on intent only ("Show places" or a trip tap), token in memory per app session, optional Face ID, places and detail cached per trip. Spec: HANDOFF › Honda PIN and trip detail; boards Trips-pin, Pin-states (10 states, copy), Trip-detail.

## API (from the Android app; reply shapes not yet seen live)

- `POST /auth/pin/verify` form `pin` → `data.pinToken`. Failure → `data.pinFailureCount` (n of 5); error `PIN_IS_LOCKED` at 5. (The design says Honda gives no count; it does. Kept out of the UI as designed; tell design.)
- `GET /car/trip/detail?oid=&pinToken=` → trip with `tripRoute` (Google encoded polyline, 1e5), `tripStartTime`, `tripEndTime`, `duration`, `mileage`, `subject`, `caption`. No speeds, fuel or idle: those come from the `/car/trip` day row. Idle tile dropped (Honda doesn't send it).
- Places: Apple geocoder on the first and last route points.

## Acceptance criteria

- [x] Banner card above the list while some listed trips lack places ("Places are hidden…" / "2 new trips without places…", Face ID failed text); hides when all have places.
- [x] PIN sheet: 4 secure dots, system number pad, 4th digit sends (Honda PINs are 4 digits), paste works; Checking; Wrong (amber dots, warning haptic, next digit restarts); Locked and Forgot (Open Honda CONNECT / Not now); success closes, places appear (no cross-fade yet, see Notes), toast "Places shown". A row tap that opened it continues to that trip's detail.
- [x] pinToken in memory only, per app session.
- [ ] Face ID switch (off by default): on stores the PIN in Keychain (biometry-only, ADR 0005). Opening Trips runs Face ID once per app session only if some listed trips lack places; fail/cancel → banner text, no sheet, no retry. Stored PIN rejected → delete it, sheet "Your Honda PIN changed".
- [x] Cache: places + detail per trip in app storage (no iCloud backup); saved places always show; detail always needs PIN/Face ID this session, then opens from cache. Wiped on sign-out and Forget PIN.
- [x] Trip detail screen: map ~55% with route (acc 5 pt over 9 pt casing), start ring, end dot, glass back; sheet with day + time range, from → to, tiles Honda sends, day/night bar.
- [x] Settings › Security › Honda PIN: Face ID switch + Forget PIN.

## Test plan

### Layer 1 — Pure logic (TDD)

- [x] `decodePolyline` — known Google sample.
- [x] `pinResult` — success token, wrong with count, locked, other errors.
- [x] Trip cache merge — saved places applied to listed trips; which trips lack places.

### Layer 2 — Manual smoke (glue/IO)

- [ ] The user enters the real PIN once on the phone: places load, detail opens, reply shapes recorded in FINDINGS.

### Layer 3 — Visual review

- [x] Simulator (mock): banner, sheet, wrong, success → places, row tap → PIN → detail from cache, locked, Settings group, Forget PIN. Not captured: Forgot view, "PIN changed" sheet, Face ID paths (need Face ID enrolment on the simulator), toast.

## Notes

- Design update 2: trip detail is an iOS page sheet (`presentation: "modal"`), drawn grabber, glass ✕, map 380 pt with a glass fit-route button, place names up to 2 lines joined by a dotted line, number + unit tiles. No pull to refresh there (it fights drag-to-close); it re-reads once on open when the saved copy has no route or places. Live place names add the district ("Thảo Điền, Thủ Đức"). Checked on the simulator: trip tap → PIN → detail sheet.

- Added (HANDOFF update): pull to refresh on Trip detail (re-reads that trip's route when this session has a token); map and place names load as shimmer, tiles from the list row show at once. Detail pull not run on the simulator.

- Face ID switch (off by default) is in the sheet and Settings; the Face ID paths (auto once per session, failed banner, PIN changed) are built but not run: the simulator needs Face ID enrolled, and simulator taps don't flip a native Switch inside an `accessible` settings row (the old Siri / Face ID rows too).
- The PIN sheet is a native iOS form sheet (Expo Router `formSheet` route `/pin`), not a JS bottom-sheet library: system dim, grabber, drag to close, keyboard handling. Places cross-fade (200 ms, 30 ms stagger) is not built; places swap in at once.
- "Open Honda CONNECT" opens an App Store search (the Honda app's link scheme is unknown).
- Honda sends `pinFailureCount` (of 5) on a wrong PIN; the UI shows no count, as designed.
- Places cache lives in `Library/Caches` (not in iCloud or device backups); iOS may purge it, then the next PIN reloads it.
- Live smoke still needed: the user enters the real PIN once on the phone; record the real `/auth/pin/verify` and `/car/trip/detail` reply shapes in FINDINGS.

## Out of scope

- PIN set/reset/change in Xe Key (Honda app only).

## Definition of Done

- [x] Layer 1 tests written and green
- [ ] Layer 2 smoke checklist completed
- [ ] Layer 3 screenshots captured
- [x] Lint + format clean
- [x] Typecheck clean
- [x] Tests green
- [x] Per-area docs updated; ADR if PIN storage differs from ADR 0005
- [x] No commented-out code, no debug-log debris, no AI attribution
- [ ] Task closed: status → done, file moved to `docs/tasks/done/`, t023 in commit
