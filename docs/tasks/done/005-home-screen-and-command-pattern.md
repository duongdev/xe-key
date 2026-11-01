# 005 — build home screen with the async command pattern

- **Status:** done
- **Mode:** HITL
- **Estimate:** 1d
- **Depends on:** 003, 004
- **Blocks:** 006, 008, 009

## Goal

Home shows car status and lets the user hold to unlock and tap to lock, using a reusable command state machine (fire → accepted → confirmed, with retrying and failed) driven by a mock car service. Matches [boards/Main.dc.html](../../../apps/mobile/design/boards/Main.dc.html) and the four Home state boards.

## Why now

Home is 90% of usage, and the command pattern is reused by engine, find and Siri.

## Acceptance criteria

- [x] Layout matches [screenshots/Main.png](../../../apps/mobile/design/screenshots/Main.png) and [Home-light.png](../../../apps/mobile/design/screenshots/Home-light.png).
- [x] Hold-to-unlock: 600 ms linear fill, release early sends nothing; lock is a tap.
- [x] Headline changes only on confirmed state; pending shows the step line and ring.
- [x] Pull-to-refresh wakes the car; freshness chip shows age.
- [x] Loading, offline, signed-in-elsewhere and package-expired states match their boards.
- [x] Car picture follows confirmed `doors` and `engine` state.
- [x] Haptics per [HANDOFF › Motion and haptics](../../../apps/mobile/design/HANDOFF.md#motion-and-haptics).

## Test plan

### Layer 1 — Pure logic (TDD)

- [x] Command state machine — every transition, retry count, cancel, final failure.
- [x] Freshness label — seconds/minutes/hours formatting.

### Layer 2 — Manual smoke (glue/IO)

- [x] Mock service delays and failures drive every state.

### Layer 3 — Visual review

- [x] Screenshots of all Home states in dark and light.

## Design notes

- **Contracts changed:** introduces a `CarService` interface the UI depends on; a mock implements it now, `@xekey/core` later.
- **New modules:** command state machine, Home screen.
- **New ADR needed?** maybe — state management choice.

## Out of scope

- Real API calls; navigation targets beyond stubs.

## Definition of Done

See [TEMPLATE.md](../TEMPLATE.md#definition-of-done).

## Notes

- Done 2026-11-01. `CarService` + mock (dev scenarios in the kitchen sink), TanStack Query cache persisted to AsyncStorage, NetInfo for offline. No new ADR: the stack choice is recorded in `apps/mobile/CLAUDE.md` from the grill (Q4).
- Command flow: hold 0.6 s → Sent → Accepted → Confirmed (✓ line, success haptic, cleared after 2.6 s); asleep → amber "retrying (n/3)"; after 3 → "Couldn't reach car", warning haptic, nothing changed. "Try again" shows for lock only — unlock needs a new hold.
- Headline, car picture and lock button follow the confirmed snapshot only.
- Offline: banner + muted car + controls disabled with a Wi-Fi-slash icon, on the normal layout (the board's compact tile layout was not copied). Not checked on the simulator (its network follows the Mac).
- Line look shows no unlocked/engine cues (Car draws states in the shaded look only, as the board does).
- Start, Settings, Find, Status, Trips, Alerts open a stub route until 006/008.
- Not checked: Vietnamese copy on screen, VoiceOver pass, haptics on a device.
- Visual review: [apps/mobile/docs/review/](../../../apps/mobile/docs/review/) (`t005-*`).
