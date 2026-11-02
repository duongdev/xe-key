# @xekey/mobile

## Purpose
Xe Key — Expo (React Native) client for Honda CONNECT One. iOS-first, dark-first.

## Layout
- `src/app/` — Expo Router routes. `_layout.tsx` loads fonts, prefs, gesture root. `onboarding/*` = 8 steps; `home.tsx` = Home; `engine.tsx` = Climate; `doors.tsx` = Doors; `find.tsx`, `status.tsx`, `trips.tsx`, `alerts.tsx`, `settings.tsx`; `dev.tsx` = kitchen sink (with mock-car scenario switch).
- `src/onboarding/` — flow steps (pure), VN phone format (pure), regions, step header, in-memory session.
- `src/i18n/` — typed EN/VI dictionaries; `useT()` follows the Language pref or the device.
- `src/prefs.tsx` — non-secret settings in AsyncStorage (onboarded, region, car look, toggles).
- `src/services/car.ts` — `CarService` (status, wake, command with progress events); `mock-car.ts` implements it with dev scenarios (asleep, unreachable, slow, signed-out, expired); `query.tsx` = TanStack Query client persisted to AsyncStorage, NetInfo-driven online state, `useCar()`.
- `src/car/status.ts` (pure: body → top-down diagram tones + rows), `trips.ts` (pure: 7-day bars, totals).
- `src/i18n/format.ts` — `formatTime` (pure, tested) + `useFormatTime()` following the Format setting or the device.
- `src/ui/` also has `page-header.tsx` (back + large title + pill), `empty-state.tsx`, `toast.tsx` (result toasts; queue logic in `toast-queue.ts`), `banner.tsx` (ongoing conditions), `appear.tsx` (`Appear` rise/pop/settle-left, `Shimmer`, `Spin`), `busy-ring.tsx`, `launch.tsx` (cold-start Splash → Home; pure timeline in `launch-timeline.ts`, Home reports its car via `launch-target.ts`), `pick.ios.ts`/`pick.ts` (option picker).
- `src/car/engine.ts` — pure engine session (countdown, ring fraction, auto-off, extend vs reminder); `reminder.ts` = local notification 1 min before auto-off (asks permission only when used).
- `src/ui/glass.tsx` — `Glass` (native Liquid Glass surface on iOS 26+, solid raised fallback) and `GlassButton` (44 pt circle); `glass-tabs.tsx` = Alerts floating filter. On iOS 26+ both controls are real SwiftUI (`@expo/ui`: `buttonStyle("glass")` button, segmented `Picker` on a glass capsule) so press, lens and drag are the system's; below 26 they are RN fallbacks. Native glass buttons use SF Symbols, not phosphor. Glass only for floating controls; content and primary actions stay solid ([HANDOFF › Liquid Glass](design/HANDOFF.md), [research](../../docs/research/liquid-glass-expo.md)).
- `src/ui/press-glass.tsx` — glass press for solid buttons (`usePressGlass`, `SolidPressable`); `Button` and `HoldButton` use it. Solid raw buttons use `SolidPressable`, not a `pressed` opacity.
- `src/ui/segmented-slider.tsx` — named stops on a `ScrubRail` (style, AC level).
- `src/car/command.ts` — pure command reducer (CONTEXT.md › Commands); `use-command.ts` runs one command at a time and writes the confirmed snapshot to the cache.
- `src/services/honda.ts` — live `AuthService` + `call()` (one silent re-login on a lost session); `secret.ts` = Keychain store + cookie jar ([ADR 0008](../../docs/adr/0008-app-cookie-transport.md)); `honda-map.ts` (pure: error codes, VN username, paint/body from Honda's car); `use-auth.ts` picks mock or live (Settings › Developer, dev builds only).
- `src/services/live-car.ts` — live `CarService` (reads, commands with 5 s status checks then one result pull, trips from 7 no-PIN day reads) + Apple geocoder; `honda-command.ts` (pure: pull delay, done-check); `honda-car.ts` (pure: Honda replies → `CarStatus`, alerts, trips); `use-distance.ts` (phone → car km; asks permission only on Find). `query.tsx` swaps mock/live before children fetch and refetches stale data on foreground/screen focus and every 60 s while open; every read goes through `snapshot.ts` (pure: no older reports, confirmed commands hold).
- `src/services/auth.ts` — `AuthService` + `mockAuth`. Force errors: password `wrong`; phone ending `0000` (Honda down) / `1111` (app blocked); code `000000` (wrong) / `111111` (expired).
- `src/theme/` — tokens (colors, type scale, space, radii), `useTheme`, motion curves, haptics.
- `src/ui/` — shared primitives (`Text`, `Button`).
- `src/car/` — `<Car>` illustration: `geometry.ts` (pure: body paths, wheel arches, contrast assist), `frame.ts` (pure: viewBox that centres the body) + `car.tsx` (SVG, unlocked/engine effects, vapor puffs as gradient sprites).
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
- Toast = result of the user's action (confirmed/failed command, undo); banner = ongoing condition (offline at top; car conditions under the location card). `useCommand` shows the result toast; screens show only pending steps.
- Every animation goes through `Appear`/`useTiming`/`useReducedMotion` so Reduce Motion becomes a 150 ms fade; the hold fill is the only exception.
- Haptics: follow [HANDOFF › Haptics](design/HANDOFF.md) (kinds, no-haptic list, rules). Shared components own them (`Button`/`SolidPressable` light, `HoldButton` selection + medium, scrub/tabs selection, `usePullRefresh`, `useCommand`); screens call `haptics` only with a `haptics:` comment — `src/haptics-owner.test.ts` checks it. Holds arm at 1.5 s.
- Text inputs stay mounted on error (overlay error views): removing a password field makes iOS offer "Save Password".
- Add deps with `npx expo install` (SDK-matched versions). Decisions: [ADR 0002](../../docs/adr/0002-expo-reanimated-phosphor.md).

## Gotchas
- `@xekey/core` root must stay free of Node built-ins; `HondaHttp` takes an injected fetch + cookie store ([ADR 0003](../../docs/adr/0003-portable-core.md)). App requests use `credentials: "omit"` so only our Keychain jar holds cookies (ADR 0008).
- `@xekey/core` resolves to its `dist/`: run `pnpm --filter @xekey/core build` after changing core, before Metro.
- Honda VN usernames are the local number with its leading 0.
- Car place names come from Apple's on-device geocoder and follow the phone's system language, not the app's. Kept on purpose: an online geocoder (e.g. Nominatim) would send the car's position to a third party.
- deviceId and stored credentials live in the Keychain ([ADR 0004](../../docs/adr/0004-keychain-device-id.md), [ADR 0005](../../docs/adr/0005-keychain-password-relogin.md)).
- This package pins `typescript ~6.0` (Expo range); the repo root uses 7.
- Be Vietnam Pro ignores `fontVariant: tabular-nums` on iOS: use `Digits` for any changing number (timers).
- Reanimated reads Reduce Motion once at app start; restart the app after toggling it.
- Native `Switch` draws at the top of its box in a centred row; wrap it in a `height: 31` view.
- Never put tests (or any non-route file) under `src/app/`: Expo Router bundles every file there. Screen tests live in `src/*.test.tsx`.
- RNTL 14: `render` and `fireEvent` are async — always `await` them, or later tests render nothing (overlapping `act`).
- Physical commands (unlock, start) are never resent by a tap (e.g. "Try again"); the user holds again.
- `jest.setup.ts` hand-mocks Reanimated (its own Jest setup needs a DOM); add to it when a test uses more of the API.
- `Path` from phosphor clashes with the SVG primitive — use `PathIcon`.
