# 004 — build the car illustration component

- **Status:** ready
- **Mode:** HITL
- **Estimate:** 1d
- **Depends on:** 003
- **Blocks:** 005, 007

## Goal

A `<Car>` component draws the five Honda body shapes in shaded and line looks with any paint, a contrast assist, and the unlocked and engine-on states, matching [boards/Car.dc.html](../../apps/mobile/design/boards/Car.dc.html).

## Why now

Home, onboarding (car found, car look) and the state screens all show the car.

## Acceptance criteria

- [ ] Props: `model`, `look`, `paint`, `ground`, `assist`, `doors`, `engine` as in [HANDOFF › Car illustration](../../apps/mobile/design/HANDOFF.md#car-illustration).
- [ ] All 10 model × look combinations match [screenshots/Car-gallery.png](../../apps/mobile/design/screenshots/Car-gallery.png).
- [ ] Contrast assist matches [screenshots/Car-contrast.png](../../apps/mobile/design/screenshots/Car-contrast.png).
- [ ] Unlocked blink and engine exhaust run on the UI thread and stop under Reduce Motion.
- [ ] Scales to any width with the 720×280 aspect ratio.

## Test plan

### Layer 1 — Pure logic (TDD)

- [ ] Wheel-arch path builder — arch meets the rocker line at both sides; large-arc flag set.
- [ ] Contrast assist — black on dark and white on light trigger it; gray on either does not.
- [ ] Luminance — known hex values return expected values.

### Layer 2 — Manual smoke (glue/IO)

n/a.

### Layer 3 — Visual review

- [ ] Gallery screen of all models, looks and states, dark and light, screenshotted.

## Design notes

- **Contracts changed:** none.
- **New modules:** car geometry (pure), car SVG component.
- **New ADR needed?** no.

## Out of scope

- The "Honda photo" look (needs `/car/image`; part of 007).

## Definition of Done

See [TEMPLATE.md](TEMPLATE.md#definition-of-done).
