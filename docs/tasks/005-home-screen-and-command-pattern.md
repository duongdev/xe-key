# 005 — build home screen with the async command pattern

- **Status:** ready
- **Mode:** HITL
- **Estimate:** 1d
- **Depends on:** 003, 004
- **Blocks:** 006, 008, 009

## Goal

Home shows car status and lets the user hold to unlock and tap to lock, using a reusable command state machine (fire → accepted → confirmed, with retrying and failed) driven by a mock car service. Matches [boards/Main.dc.html](../../apps/mobile/design/boards/Main.dc.html) and the four Home state boards.

## Why now

Home is 90% of usage, and the command pattern is reused by engine, find and Siri.

## Acceptance criteria

- [ ] Layout matches [screenshots/Main.png](../../apps/mobile/design/screenshots/Main.png) and [Home-light.png](../../apps/mobile/design/screenshots/Home-light.png).
- [ ] Hold-to-unlock: 600 ms linear fill, release early sends nothing; lock is a tap.
- [ ] Headline changes only on confirmed state; pending shows the step line and ring.
- [ ] Pull-to-refresh wakes the car; freshness chip shows age.
- [ ] Loading, offline, signed-in-elsewhere and package-expired states match their boards.
- [ ] Car picture follows confirmed `doors` and `engine` state.
- [ ] Haptics per [HANDOFF › Motion and haptics](../../apps/mobile/design/HANDOFF.md#motion-and-haptics).

## Test plan

### Layer 1 — Pure logic (TDD)

- [ ] Command state machine — every transition, retry count, cancel, final failure.
- [ ] Freshness label — seconds/minutes/hours formatting.

### Layer 2 — Manual smoke (glue/IO)

- [ ] Mock service delays and failures drive every state.

### Layer 3 — Visual review

- [ ] Screenshots of all Home states in dark and light.

## Design notes

- **Contracts changed:** introduces a `CarService` interface the UI depends on; a mock implements it now, `@xekey/core` later.
- **New modules:** command state machine, Home screen.
- **New ADR needed?** maybe — state management choice.

## Out of scope

- Real API calls; navigation targets beyond stubs.

## Definition of Done

See [TEMPLATE.md](TEMPLATE.md#definition-of-done).
