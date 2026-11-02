# 026 — add horn and lights to Find my car

- **Status:** done
- **Mode:** HITL
- **Estimate:** 0.5d
- **Depends on:** 015
- **Blocks:** none

## Goal

On Find my car, the user can flash the car's lights (tap) or sound the horn with the lights (hold 1.5 s) to spot the car in a car park. Both run the same command lifecycle as lock. Matches [Find](../../apps/mobile/design/boards/Find.dc.html) and `screenshots/Find-horn.png`; spec row in [HANDOFF › Screen map](../../apps/mobile/design/HANDOFF.md#screen-map).

## Why now

Find shows where the car is, but in a big car park the user still has to spot it. Honda's `/remote/hornLight` (FINDINGS Round 4) does that with no PIN.

## Acceptance criteria

- [x] Core: `sendRemote` / `pullRemote` support `lights` and `horn` (`POST /remote/hornLight` form `command=lights | horn-lights`, result `GET /remote/pullHornLightResult`); pure parts tested; core rebuilt.
- [x] App: confirm on the first command message in `/car/alertMessages` after the send (every 5 s); otherwise one pull after Honda's wait (`timeOutInterval`, at least 30 s, + 3 s), as the official app does.
- [x] Find panel: a row of two `s2` buttons (52 pt) above Update / Go. "Flash lights" (headlights) = tap → `lights`. "Hold to honk" (bell ringing) = HoldButton 1.5 s → `horn-lights`.
- [x] Lifecycle via `useCommand`: the button becomes its own spinner ("Flashing…" / "Honking…"); car asleep → amber Retrying (n/3); toast "Lights flashed" / "Horn and lights · car found you" or "Couldn't reach car". Never auto-resent; only Flash offers a Retry tap.
- [x] Haptics: Flash = light → success / warning; Honk = HoldButton selection ticks + medium → success / warning.
- [x] Bottom panel: no grabber, not draggable.
- [x] Mock car supports both; EN + VI copy.

## Test plan

### Layer 1 — Pure logic (TDD)

- [x] Core: hornLight POST and pull paths, form fields and command values.
- [x] App: horn/lights pull delay (Honda's wait, 30 s floor, + 3 s).

### Layer 2 — Manual smoke (glue/IO)

- [x] Mock: flash and honk (spinner + toast). Asleep / unreachable not captured on screen (sim taps flaky); same reducer as lock.
- [x] Live (user said yes): first Flash → "Đã nháy đèn" (~9 s). Later Flash and Honk were refused by Honda because the engine was running ("thất bại … xe đang nổ máy"); after fixing failure detection the app shows "Couldn't reach car · Retry" (~6 s). A successful honk is not yet seen.

### Layer 3 — Visual review

- [x] iOS 27 EN (flash, honk, toasts) and iOS 18.5 VI (layout), vs `screenshots/Find-horn.png`.

## Design notes

- **Contracts changed:** core `RemoteKind` and app `CommandKind` gain `lights` and `horn` (= Honda `horn-lights`). `HoldButton` gains an optional `height`.
- **New modules:** none.
- **New ADR needed?** no.

## Out of scope

- Horn only (`command=horn`): the design pairs the horn with the lights.
- Stopping the lights early (Honda has no "off").
