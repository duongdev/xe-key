# 006 — build remote engine and lock screens

- **Status:** done
- **Mode:** HITL
- **Estimate:** 1d
- **Depends on:** 005, CLI probe of `/remote/doorLock` on the real car to learn whether `/auth/pin/verify` is required
- **Blocks:** none

## Goal

The Climate screen starts and stops the engine with an AC slider, a 10-minute countdown ring, extend, and the 2-start limit; the Doors screen shows lock state with hold-to-unlock. Matches [boards/Engine.dc.html](../../../apps/mobile/design/boards/Engine.dc.html), [Lock.dc.html](../../../apps/mobile/design/boards/Lock.dc.html) and [Engine-states.dc.html](../../../apps/mobile/design/boards/Engine-states.dc.html).

## Acceptance criteria

- [x] AC level is a drag slider (Low/Mid/High) with detent haptics and adjustable accessibility.
- [x] Hold to start; countdown ring drains in real time; auto-off returns to idle.
- [x] Extend uses a start; with no starts left the action becomes a reminder, never a disabled button.
- [x] Retrying (car asleep) and failed paths match the command states board.
- [x] Screens match their screenshots.

## Test plan

### Layer 1 — Pure logic (TDD)

- [x] Engine session — countdown, extend, start budget, auto-off.
- [x] Slider value from drag position — clamping and nearest stop.

### Layer 2 — Manual smoke (glue/IO)

- [x] Mock service drives start, retry and fail.

### Layer 3 — Visual review

- [x] Screenshots of idle, pending, running, retrying, no starts left.

## Out of scope

- Real `/remote/*` calls.

## Definition of Done

See [TEMPLATE.md](../TEMPLATE.md#definition-of-done).

## Notes

- Done 2026-11-02. Climate (`/engine`) and Doors (`/doors`); Home's Start button and headline open them.
- Starts left and the countdown come from the confirmed car snapshot (`startsLeft`, `engine.endsAt`); a pending start uses no start. Cancel shows only for a pending start and drops the command ("No start used"); the live adapter must also call `/remote/engineCancel`.
- No starts left: Extend becomes "At 1:00" (local notification 1 min before auto-off, permission asked on tap); idle shows "Drive to reset starts". Stop cancels the reminder.
- Auto-off: the countdown ends the session locally even before the car reports it.
- AC level maps to a target temperature (Low 28°, Mid 26°, High 22°) — a guess until `acSetting` values are probed.
- Mock: retries every 4 s while asleep; kitchen sink has "drive (reset starts)".
- Component test (`src/climate.test.tsx`) covers cancel and confirmed start.
- PIN probe (Depends on) still open: the mock assumes no PIN. Must run before the live adapter.
- Not checked on screen: "Keep holding" hint mid-hold (tool latency), Reduce Motion pulse, light mode for these two screens, the reminder firing.
- Visual review: [apps/mobile/docs/review/](../../../apps/mobile/docs/review/) (`t006-*`).
