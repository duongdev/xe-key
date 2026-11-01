# 006 — build remote engine and lock screens

- **Status:** ready
- **Mode:** HITL
- **Estimate:** 1d
- **Depends on:** 005
- **Blocks:** none

## Goal

The Climate screen starts and stops the engine with an AC slider, a 10-minute countdown ring, extend, and the 2-start limit; the Doors screen shows lock state with hold-to-unlock. Matches [boards/Engine.dc.html](../../apps/mobile/design/boards/Engine.dc.html), [Lock.dc.html](../../apps/mobile/design/boards/Lock.dc.html) and [Engine-states.dc.html](../../apps/mobile/design/boards/Engine-states.dc.html).

## Acceptance criteria

- [ ] AC level is a drag slider (Low/Mid/High) with detent haptics and adjustable accessibility.
- [ ] Hold to start; countdown ring drains in real time; auto-off returns to idle.
- [ ] Extend uses a start; with no starts left the action becomes a reminder, never a disabled button.
- [ ] Retrying (car asleep) and failed paths match the command states board.
- [ ] Screens match their screenshots.

## Test plan

### Layer 1 — Pure logic (TDD)

- [ ] Engine session — countdown, extend, start budget, auto-off.
- [ ] Slider value from drag position — clamping and nearest stop.

### Layer 2 — Manual smoke (glue/IO)

- [ ] Mock service drives start, retry and fail.

### Layer 3 — Visual review

- [ ] Screenshots of idle, pending, running, retrying, no starts left.

## Out of scope

- Real `/remote/*` calls.

## Definition of Done

See [TEMPLATE.md](TEMPLATE.md#definition-of-done).
