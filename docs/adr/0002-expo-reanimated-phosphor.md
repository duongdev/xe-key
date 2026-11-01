# 0002 — Expo SDK 58, Reanimated 4 and phosphor-react-native for the mobile app

- **Status:** Accepted
- **Date:** 2026-11-01

## Context

`apps/mobile` needs a React Native base that runs on the iOS Simulator with no native setup, matches the design's motion spec (two bezier curves, springs, Reduce Motion fallback), and uses the Phosphor icon set named in the design handoff.

## Decision

- **Expo SDK 58** (React Native 0.88, React 19.3), blank TypeScript template, run in Expo Go during development. Native folders stay generated (CNG); config lives in `app.json`.
- **Reanimated 4 + react-native-worklets** for all motion. Settle and Pop are `Easing.bezier` curves; `useReducedMotion` turns moves into 150 ms fades.
- **phosphor-react-native** from npm. It is published from the owner's repo (github.com/duongdev/phosphor-react-native), so no git dependency is needed. Use the `*Icon` export names (`Path` clashes with the SVG primitive).
- **Be Vietnam Pro** via `@expo-google-fonts/be-vietnam-pro`, loaded with `useFonts` behind the splash screen.
- The mobile package keeps its own `typescript ~6.0` (Expo's supported range) while the rest of the repo uses TypeScript 7.

The RN cookie transport for `@xekey/core` is not decided here; it gets its own ADR when the first real API call lands (task 005).

## Consequences

- No Xcode project to maintain until a native module outside Expo Go is needed; then switch to a dev build (`expo run:ios`).
- Two TypeScript versions in the workspace; revisit when Expo supports 7.

## Alternatives considered

- **Bare React Native** — more native setup for no gain at this stage.
- **Moti / RN Animated** — Reanimated is what Expo ships and covers worklet-driven gestures needed for hold-to-arm and scrub.
- **Git dependency on the phosphor fork** — runs `bob build` on install; npm already has the same code.
