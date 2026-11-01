# 004 — build the car illustration component

- **Status:** done
- **Mode:** HITL
- **Estimate:** 1d
- **Depends on:** 003
- **Blocks:** 005, 007

## Goal

A `<Car>` component draws the five Honda body shapes in shaded and line looks with any paint, a contrast assist, and the unlocked and engine-on states, matching [boards/Car.dc.html](../../../apps/mobile/design/boards/Car.dc.html).

## Why now

Home, onboarding (car found, car look) and the state screens all show the car.

## Acceptance criteria

- [x] Props: `body`, `look`, `paint`, `ground`, `assist`, `doors`, `engine` as in [HANDOFF › Car illustration](../../../apps/mobile/design/HANDOFF.md#car-illustration) (`model` renamed to `body`, see `CONTEXT.md`).
- [x] All 10 body × look combinations match [screenshots/Car-gallery.png](../../../apps/mobile/design/screenshots/Car-gallery.png).
- [x] Contrast assist matches [screenshots/Car-contrast.png](../../../apps/mobile/design/screenshots/Car-contrast.png).
- [x] Unlocked blink and engine exhaust run on the UI thread and stop under Reduce Motion.
- [x] Scales to any width with the 720×280 aspect ratio.
- [x] `apps/mobile` tests run on `jest-expo` + React Native Testing Library (003 token tests moved over); Vitest removed from this package.

## Test plan

### Layer 1 — Pure logic (TDD)

- [x] Wheel-arch path builder — arch meets the rocker line at both sides; large-arc flag set.
- [x] Contrast assist — black on dark and white on light trigger it; gray on either does not.
- [x] Luminance — known hex values return expected values.

### Layer 2 — Manual smoke (glue/IO)

n/a.

### Layer 3 — Visual review

- [x] Gallery screen of all models, looks and states, dark and light, screenshotted.

## Design notes

- **Contracts changed:** board prop `model` → `body`.
- **New modules:** car geometry (pure), car SVG component.
- **New ADR needed?** no.

## Out of scope

- The "Honda photo" look (needs `/car/image`; part of 007).

## Definition of Done

See [TEMPLATE.md](../TEMPLATE.md#definition-of-done).

## Notes

- Done 2026-11-01. Geometry ported verbatim from the board into a pure module; `luminance` keeps the board's formula (Rec. 709 weights on gamma-encoded channels), since the assist thresholds were tuned on it.
- Line look ink follows `ground` (board hard-codes light ink).
- Jest + Reanimated 4: the official setup needs a DOM (web build), so `jest.setup.ts` hand-mocks the Reanimated API we use; animations jump to their target.
- Reduce Motion path (no blink, no puffs, mirror lamp lit) is coded but not checked on the simulator.
- Visual review: [apps/mobile/docs/review/](../../../apps/mobile/docs/review/) (`t004-*`).
