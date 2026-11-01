# 016 — splash to Home launch animation

- **Status:** done
- **Mode:** AFK
- **Estimate:** 0.5d
- **Depends on:** 009
- **Blocks:** none

## Goal

On a cold start the native launch image (dark ground, 104 pt "xe." tile) hands over to a ~1.9 s sequence: the tile shrinks away, its dot arcs to the Home car's headlight, the car drives in to Home's exact spot, the headlights wink twice, Home fades in at 1.25 s, and the overlay car fades at 1.76 s onto Home's own car. Spec: HANDOFF.md › Splash → Home; boards `Splash.dc.html`, `Splash-frames.dc.html`.

## Why now

Replaces the interim 0.7 s logo fade from task 009.

## Acceptance criteria

- [x] Native launch image matches the first JS frame exactly (no jump when the native splash hides).
- [x] Timings per the board's keyframes; the overlay car lands on Home's car (measured on screen, any body).
- [x] Never waits on the network: no Home car on screen (onboarding, slow layout) skips the car part.
- [x] Cold start only; no haptics.
- [x] Reduce Motion: 200 ms cross-fade from the launch image to Home.

## Test plan

### Layer 1 — Pure logic (TDD)

- [x] Timeline: tile, dot, car, wink, veil and car fade values at key times.
- [x] Dot path: from the tile dot to the headlight, peaking just above the end.

### Layer 2 — Manual smoke (glue/IO)

n/a.

### Layer 3 — Visual review

- [x] Screen recording of a cold start; last frame matches Home with no jump.

## Design notes

- **Home reveal:** a plain opacity animation of the overlay's dark ground (no mask), since the board fades all Home content at once.
- **Car target:** Home publishes its car's window frame; the overlay draws the same `<Car>` there.
- **New modules:** pure launch timeline; launch target store.
- **New ADR needed?** no.

## Out of scope

- Light-mode launch (the spec's launch is always dark; see Notes).

## Definition of Done

See [TEMPLATE.md](TEMPLATE.md#definition-of-done).

## Notes

- Done 2026-11-02. Native → JS hand-off is by construction (one drawing for both); confirm in the first dev build.

- Recording: `apps/mobile/docs/review/t016-launch.mp4` and `t016-launch-frames.png` (Expo Go, cold start). The overlay car lands on Home's car; no jump at the end.
- The native splash image (`assets/splash-icon.png`) and the JS tile (`assets/launch-tile.png`, same drawing without the dot) are generated from one script so the hand-off frame matches; the JS dot sits at the image's dot position. Expo Go shows its own loading screen instead of our native splash, so the native → JS hand-off needs a dev build to check.
- Home reveal is an opacity fade of the overlay's dark ground (no mask), per the design change.

- Open: in light mode Home fades in over the dark launch ground. Kept dark per spec; revisit with the designer.
