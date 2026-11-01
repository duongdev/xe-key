# 003 — scaffold expo app with design tokens, font and icons

- **Status:** done
- **Mode:** HITL
- **Estimate:** 1d
- **Depends on:** 001
- **Blocks:** 004, 005, 006, 007, 008, 009

## Goal

`apps/mobile` is a running Expo (iOS-first) app inside the pnpm workspace, with the Xe Key theme (dark + light tokens), Be Vietnam Pro, Phosphor icons from the owner's `phosphor-react-native` fork, haptics, and the two motion curves available as shared primitives.

## Why now

Every screen task builds on the theme, font, icon and motion primitives. Doing them once avoids drift.

## Acceptance criteria

- [x] `pnpm --filter @xekey/mobile start` boots the app in the iOS Simulator.
- [x] Theme exposes every token in [HANDOFF › Tokens](../../../apps/mobile/design/HANDOFF.md#tokens) for dark and light, switching with the system appearance.
- [x] Be Vietnam Pro 400–800 loads before first render; numbers use tabular figures.
- [x] Icons render from `phosphor-react-native` (github.com/duongdev/phosphor-react-native), Regular weight.
- [x] Haptic helpers exist for: light impact, selection, medium impact, success, warning.
- [x] Settle and Pop curves exist as shared Reanimated easings; Reduce Motion falls back to 150 ms fades.
- [x] A dev-only "Kitchen sink" screen shows colors, type scale, icons and buttons in both themes.
- [x] Biome, typecheck and tests pass at the workspace root.

## Test plan

### Layer 1 — Pure logic (TDD)

- [x] Theme token lookup — dark/light return the documented hex values.

### Layer 2 — Manual smoke (glue/IO)

- [x] App boots on iOS Simulator; font and icons visible.

### Layer 3 — Visual review

- [x] Kitchen sink screenshots in dark and light match [screenshots/System.png](../../../apps/mobile/design/screenshots/System.png).

## Design notes

- **Contracts changed:** none (new app).
- **New modules:** theme, typography, icons, haptics, motion.
- **New ADR needed?** yes — "RN transport for @xekey/core cookies" may start here or in 005; at minimum record the Expo + Reanimated + phosphor fork choice.

## Out of scope

- Any real screen, navigation beyond the kitchen sink, API calls.

## Definition of Done

See [TEMPLATE.md](../TEMPLATE.md#definition-of-done).

## Notes

Design: [apps/mobile/design/HANDOFF.md](../../../apps/mobile/design/HANDOFF.md).

- Done 2026-11-01. Expo SDK 58 / RN 0.88 / Reanimated 4, run in Expo Go. See [ADR 0002](../../adr/0002-expo-reanimated-phosphor.md).
- Package prefix renamed `@honda/` → `@xekey/` across the repo in the same change.
- Kitchen sink is the root screen for now; task 005 replaces the root and keeps the sink behind `__DEV__`.
- Visual review: [apps/mobile/docs/review/](../../../apps/mobile/docs/review/) (`t003-*`), dark and light.
