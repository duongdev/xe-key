# 003 — scaffold expo app with design tokens, font and icons

- **Status:** ready
- **Mode:** HITL
- **Estimate:** 1d
- **Depends on:** 001
- **Blocks:** 004, 005, 006, 007, 008, 009

## Goal

`apps/mobile` is a running Expo (iOS-first) app inside the pnpm workspace, with the Xe Key theme (dark + light tokens), Be Vietnam Pro, Phosphor icons from the owner's `phosphor-react-native` fork, haptics, and the two motion curves available as shared primitives.

## Why now

Every screen task builds on the theme, font, icon and motion primitives. Doing them once avoids drift.

## Acceptance criteria

- [ ] `pnpm --filter @honda/mobile start` boots the app in the iOS Simulator.
- [ ] Theme exposes every token in [HANDOFF › Tokens](../../apps/mobile/design/HANDOFF.md#tokens) for dark and light, switching with the system appearance.
- [ ] Be Vietnam Pro 400–800 loads before first render; numbers use tabular figures.
- [ ] Icons render from `phosphor-react-native` (github.com/duongdev/phosphor-react-native), Regular weight.
- [ ] Haptic helpers exist for: light impact, selection, medium impact, success, warning.
- [ ] Settle and Pop curves exist as shared Reanimated easings; Reduce Motion falls back to 150 ms fades.
- [ ] A dev-only "Kitchen sink" screen shows colors, type scale, icons and buttons in both themes.
- [ ] Biome, typecheck and tests pass at the workspace root.

## Test plan

### Layer 1 — Pure logic (TDD)

- [ ] Theme token lookup — dark/light return the documented hex values.

### Layer 2 — Manual smoke (glue/IO)

- [ ] App boots on iOS Simulator; font and icons visible.

### Layer 3 — Visual review

- [ ] Kitchen sink screenshots in dark and light match [screenshots/System.png](../../apps/mobile/design/screenshots/System.png).

## Design notes

- **Contracts changed:** none (new app).
- **New modules:** theme, typography, icons, haptics, motion.
- **New ADR needed?** yes — "RN transport for @honda/core cookies" may start here or in 005; at minimum record the Expo + Reanimated + phosphor fork choice.

## Out of scope

- Any real screen, navigation beyond the kitchen sink, API calls.

## Definition of Done

See [TEMPLATE.md](TEMPLATE.md#definition-of-done).

## Notes

Design: [apps/mobile/design/HANDOFF.md](../../apps/mobile/design/HANDOFF.md).
