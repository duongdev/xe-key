# @xekey/mobile

## Purpose
Xe Key — Expo (React Native) client for Honda CONNECT One. iOS-first, dark-first.

## Layout
- `index.ts` — registers `src/app.tsx` (font loading, splash, root).
- `src/theme/` — tokens (colors, type scale, space, radii), `useTheme`, motion curves, haptics.
- `src/ui/` — shared primitives (`Text`, `Button`).
- `src/car/` — `<Car>` illustration: `geometry.ts` (pure: body paths, wheel arches, contrast assist) + `car.tsx` (SVG, unlocked/engine effects).
- `src/kitchen-sink.tsx` — dev screen showing every token, icon and button.
- `docs/review/` — visual review screenshots per task.

## Conventions
- Design source of truth: [design/HANDOFF.md](design/HANDOFF.md) (tokens, screens, interactions, car illustration).
- Colors and type come from `src/theme/tokens.ts` only — no raw hex or font names in screens.
- Icons: `phosphor-react-native`, `*Icon` export names, Regular weight; Fill only for a confirmed state.
- Motion: `settle`/`pop` from `src/theme/motion.ts`, timings through `useTiming()` so Reduce Motion works.
- All networking/auth lives in `@xekey/core` — screens call it, never raw `fetch`.
- UX bar: four states (loading/empty/error/populated), instant feedback, no jiggle.
- Secrets (session tokens) go in Expo SecureStore, never AsyncStorage or source.
- Platform: iOS only for phase 1 (tasks 003–009); Android comes after. Expo Go until a task needs native code (Siri, widgets), then a dev build.
- Stack: Expo Router; TanStack Query for car data; command lifecycle as a pure reducer (states per `CONTEXT.md › Commands`); `react-native-gesture-handler` + Reanimated for gestures; own typed EN/VI dictionary + `expo-localization`. Settings: Language (System/EN/VI) and Format (System/24h/12h); units fixed metric.
- Device installs: free Apple ID, dev build over cable (`expo run:ios --device`), re-sign every 7 days. Siri/widgets need App Groups, so they wait for the paid account.
- Testing: one runner in this package — `jest-expo` for pure logic and React Native Testing Library component tests (see `docs/conventions/tdd.md`). Core and CLI stay on Vitest.
- Add deps with `npx expo install` (SDK-matched versions). Decisions: [ADR 0002](../../docs/adr/0002-expo-reanimated-phosphor.md).

## Gotchas
- `@xekey/core` root must stay free of Node built-ins; `HondaHttp` takes an injected fetch + cookie store ([ADR 0003](../../docs/adr/0003-portable-core.md)). How RN reads `Set-Cookie` is settled by a spike in 005.
- deviceId and stored credentials live in the Keychain ([ADR 0004](../../docs/adr/0004-keychain-device-id.md), [ADR 0005](../../docs/adr/0005-keychain-password-relogin.md)).
- This package pins `typescript ~6.0` (Expo range); the repo root uses 7.
- `jest.setup.ts` hand-mocks Reanimated (its own Jest setup needs a DOM); add to it when a test uses more of the API.
- `Path` from phosphor clashes with the SVG primitive — use `PathIcon`.
