# Liquid Glass in Expo — research

Date: 2026-11-02. Scope: Xe Key (`apps/mobile`), Expo SDK 58, RN 0.88, iOS-first. Built with Xcode 27.2 (iOS 27 SDK).

Labels: **[verified]** = read in installed source or official doc. **[uncertain]** = secondary source or inference; test before you rely on it.

## TL;DR

- Keep `expo-glass-effect` as the one glass engine. It is the official, maintained, cheapest option, and it is already installed.
- Keep the solid fill as the iOS 18 / Android fallback. Do not add `expo-blur`.
- Because we build with the iOS 27 SDK, `UIDesignRequiresCompatibility` is ignored. Liquid Glass is always on for iOS 26+. There is no opt-out any more.
- Do not move Home to NativeTabs. Home has no tab navigation; the bottom row is actions (lock, engine), which are content-layer controls.
- Small fixes worth doing: stop animating `opacity` on the toast's glass parent (use `glassEffectStyle` animate), drop `isInteractive` on the toast, and do one Reduce Transparency check on device.

## 1. Options for native glass in Expo today

### 1.1 `expo-glass-effect` (installed, 58.0.5)

What it gives **[verified: `node_modules/expo-glass-effect/build/*.d.ts`, `ios/*.swift`]**

- `GlassView`: a `UIVisualEffectView` with `UIGlassEffect`. Props: `glassEffectStyle` (`'regular' | 'clear' | 'none'` or `{ style, animate, animationDuration }`), `tintColor` (`ColorValue`, so `PlatformColor` / `DynamicColorIOS` work since 58.0.0), `isInteractive`, `colorScheme` (`'auto' | 'light' | 'dark'`, added 55.0.0), plus `ViewProps`.
- `GlassContainer`: `UIGlassContainerEffect`. Prop `spacing` = distance at which child glass shapes start to merge.
- `isLiquidGlassAvailable()`: a native constant. Logic in `GlassEffectModule.swift`:
  - not compiled with Xcode 26+ (`#if compiler(>=6.2)`) → `false`
  - OS < 26 → `false`
  - OS ≥ 27 **and** app built with SDK ≥ 27 (reads `DTPlatformVersion`) → `true`
  - else → `!UIDesignRequiresCompatibility`
- `isGlassEffectAPIAvailable()`: checks that `UIGlassEffect` responds to `effectWithStyle:`. Added in 55.0.0 because some iOS 26 betas crashed ([expo#40911](https://github.com/expo/expo/issues/40911)). Only matters on beta OS builds. `GlassView` already runs this check inside, so it will not crash; it just draws nothing.

Platform support **[verified]**

- iOS 26+ real glass. iOS < 26, Android and web: `GlassView` renders as a plain `View` (no fill). Our wrapper must keep its own fallback fill — it does.
- Included in Expo Go ([docs](https://docs.expo.dev/versions/latest/sdk/glass-effect/)). We use dev builds anyway.
- Min iOS 16.4 (SDK 56 changelog).

Known bugs and limits

- **Opacity.** UIKit skips the glass effect when the view (or any parent) is at very low opacity and never adds it again. The module now waits with a `CADisplayLink` until opacity > 0.02 before it installs the effect (58.0.2, [#48994](https://github.com/expo/expo/pull/48994)), and 58.0.5 fixes a recycled-parent case ([#52000](https://github.com/expo/expo/pull/52000)). Fade **in** now works; fading **out** glass with `opacity` still looks wrong (glass drops out before the content). Expo docs: animate the wrapper and toggle `glassEffectStyle` to `'none'` with `animate: true` — "the recommended way to fade in/out the glass effect without modifying `opacity`" ([docs](https://docs.expo.dev/versions/latest/sdk/glass-effect/)). **[verified]**
- **Not laid out yet.** Effect is installed in `layoutSubviews` on first layout only; earlier versions failed on not-first tabs (fixed 55.0.7) and after appearance change off-screen (fixed 55.0.8). **[verified: changelog]**
- **borderRadius.** Passed natively to `cornerConfiguration` (all four corners, start/end, RTL aware, `borderCurve`). You do not need `overflow: 'hidden'` for the glass shape. `overflow: 'hidden'` on the GlassView may clip the interactive press "grow" and edge light. **[uncertain — test]**
- **ScrollView / FlatList.** No documented bug for a GlassView that floats over a list (our case). Glass **inside** list cells is against Apple guidance anyway (content layer) and costs GPU per cell. **[uncertain: no issue found]**
- **isInteractive.** Can change after mount since 55.0.8. Adds the system press response (scale, shimmer). Use only on real controls.
- **colorScheme.** Default `'auto'` follows the system trait, not our in-app theme toggle. We pass our `scheme` — correct.

Maintenance: active. Part of the Expo SDK, released with every SDK; last patch 58.0.5 (Oct 2026).

### 1.2 `@expo/ui` SwiftUI (not installed)

- `Host` mounts SwiftUI views in RN through `UIHostingController`. Modifiers come from `@expo/ui/swift-ui/modifiers`, including `glassEffect` (needs Xcode 26+ and iOS 26+). `Namespace` + `GlassEffectContainer` + `glassEffectId` give SwiftUI matched morph transitions ([namespace docs](https://docs.expo.dev/versions/latest/sdk/ui/swift-ui/namespace/), [swift-ui docs](https://docs.expo.dev/versions/latest/sdk/ui/swift-ui/)). In Expo Go.
- Gives: real SwiftUI `Button(.glass)`, `.glassProminent`, morphing groups. Best quality for morph.
- Cost: a new dependency, a second layout system (SwiftUI inside `Host` needs sizing care), no iOS < 26 glass (you still write a fallback). **[uncertain: exact props of `GlassEffectContainer` per SDK 58 — check docs before use]**
- Use it only if we need a morph that `GlassContainer` cannot do.

### 1.3 Expo Router NativeTabs (in expo-router 58.0.29)

- Import `expo-router/native-tabs` (SDK 58+). `expo-router/unstable-native-tabs` was the SDK 54–57 path and still exists in the package ([docs](https://docs.expo.dev/router/advanced/native-tabs/)). **[verified: package exports]**
- Real `UITabBarController`. On iOS 26+ the system draws the Liquid Glass tab bar; `backgroundColor`, `blurEffect`, `shadowColor`, `disableTransparentOnScrollEdge` work only on iOS ≤ 18. Extras: `minimizeBehavior` (iOS 26+), bottom accessory (renders two copies; keep state outside), `role="search"`, `sidebarAdaptable`, `preferredPlacement` (iOS 27+). **[verified: `build/native-tabs/types.d.ts`]**
- Limits: no custom tab bar UI, no nested native tabs, no add/remove tabs at runtime, FlatList scroll-to-top and minimize do not work, height cannot be measured, `Appearance.setColorScheme` does not change the iOS 26 bar background.
- Needs a `ThemeProvider` with our bg to avoid white flashes — we already have it.

### 1.4 react-native-screens native stack (4.30.1)

- With a native header on iOS 26, bar buttons get glass from UIKit for free. Item props `hidesSharedBackground` / `sharesBackground` control grouping; `scrollEdgeEffects` (iOS 26+) replaces header blur — do not use both with `blurEffect` (may overlap). **[verified: `react-native-screens/lib/typescript/types.d.ts`]**
- Expo Router exposes `Stack.Toolbar` (`Button`, `Menu`, `Spacer`, `SearchBarSlot`, `Badge` …) and `Stack.SearchBar`. **[verified: `build/layouts/StackClient.d.ts`]**
- We use `headerShown: false` everywhere, so none of this applies now. If a screen gets a native header later, prefer it over a custom glass header.

### 1.5 `expo-blur` (not installed)

- `BlurView` with `tint` incl. `systemUltraThinMaterial`, `systemThinMaterial`, `systemMaterial`, `systemThickMaterial`, `systemChromeMaterial` (+ `Light` / `Dark` suffix). In Expo Go. ([docs](https://docs.expo.dev/versions/latest/sdk/blur-view/))
- Limits: `borderRadius` on BlurView is ignored — wrap with `overflow: 'hidden'`; may not update if rendered before dynamic content; Android needs `BlurTargetView` and `blurMethod`.
- Role: pre-26 fallback only. See §2 for why we skip it.

### 1.6 Community

- `@callstack/liquid-glass` (`LiquidGlassView`, `LiquidGlassContainerView`, `isLiquidGlassSupported`). Same UIKit API underneath as expo-glass-effect. No reason to switch. **[uncertain: current version and maintenance; not checked in Context7]**
- Skip all "fake glass" JS/Skia shader libs: they do not follow system accessibility settings.

## 2. Fallback for iOS 18 and older

### 2.1 BlurView vs solid fill

| | Solid fill (now) | BlurView `systemChromeMaterial` / `systemThinMaterial` |
|---|---|---|
| Looks like iOS 18 system bars | close enough | yes |
| Contrast on any ground | predictable | changes with what is behind (map) |
| Reduce Transparency | nothing to do | UIKit makes it near-opaque by itself **[uncertain — test]** |
| Android | works | needs `BlurTargetView` setup |
| Cost | none | new dep, extra GPU, clipping workaround |

Recommendation: keep the solid fill (`c.s2` + soft shadow). It is dark-first, it reads the same over the map and over lists, and it needs no Reduce Transparency branch. If later we want a blur on iOS 18, use `systemChromeMaterial` (the material iOS 18 bars use) only for the map back button, with an `overflow: 'hidden'` wrapper.

Contrast rule for the fallback: text on `c.s2` uses `c.fg` / `c.fg2` — the same tokens as cards, so existing contrast checks still hold. Keep a 1 px `c.line` hairline in light mode if the pill gets lost on `c.bg` (`#E6E6EB` on `#F4F4F6` is low contrast). **[opinion]**

### 2.2 Runtime check

Use `isLiquidGlassAvailable()`, not `Platform.Version`.

- `Platform.Version >= 26` says the OS **can** draw glass. It does not know how the app was built:
  - built with Xcode 16 (iOS 18 SDK) → no glass on iOS 26 (the app runs in compatibility mode), but `Platform.Version` says 26.
  - built with Xcode 26 SDK and `UIDesignRequiresCompatibility = YES` → no glass.
- `isLiquidGlassAvailable()` checks compiler, OS, SDK and the plist key (see §1.1). It is a constant, so read it once at module scope (we do).
- `isGlassEffectAPIAvailable()`: add only if we ship to iOS 26 beta users. `GlassView` already guards itself.

### 2.3 `UIDesignRequiresCompatibility`

- Info.plist key from iOS 26: `YES` = keep the old design on iOS 26.
- Apple said at WWDC25 it would go away in the next major release. With the Xcode 27 SDK the system ignores the key, even with a lower deployment target; builds with the Xcode 26 SDK still honor it on iOS 26 and 27 ([Apple forum, engineer reply](https://developer.apple.com/forums/thread/838637), [planned removal thread](https://origin-devforums.apple.com/forums/thread/832543)). expo-glass-effect 58.0.0 added the SDK-27 branch ([#49850](https://github.com/expo/expo/pull/49850)). **[verified in source; Apple wording from forum, not from the doc page]**
- For us (Xcode 27.2): the key does nothing. Do not add it.

## 3. Apple guidance

Sources: HIG Materials (updated 2025-09-09) <https://developer.apple.com/design/human-interface-guidelines/materials>; WWDC25 219 "Meet Liquid Glass"; WWDC25 356 "Get to know the new design system"; WWDC25 284 "Build a UIKit app with the new design"; Apple doc "Applying Liquid Glass to custom views".

### 3.1 Where to use glass

- Glass is the **navigation / controls layer** that floats over content: tab bars, toolbars, floating buttons, sheets, toasts.
- HIG: "Don't use Liquid Glass in the content layer." Lists, cards, app backgrounds use standard materials or solid fills. Exception: transient controls (slider, toggle) take on glass while you touch them.
- HIG: "Use Liquid Glass effects sparingly" — only the most important functional elements.
- Do not stack glass on glass. Inside a glass bar, the selected item uses a fill, not another glass layer. **[WWDC25 219, via secondary notes]**

Our usage check:

| Surface | Layer | Verdict |
|---|---|---|
| Find back button over map | controls over content | correct |
| Alerts floating filter (`GlassTabs`) | controls over list | correct; solid selected pill inside is correct |
| Toast | floating, transient | correct; use `regular` (has text) |
| Home lock / engine buttons | content-layer actions | keep solid; do not glass |
| Cards, sheet on Find | content | keep solid |

### 3.2 Regular vs clear

- **Regular**: blurs and adjusts luminosity; most system parts use it. Use when background can hurt legibility or the part has a lot of text (alerts, popovers). → All our surfaces.
- **Clear**: very translucent; only over visually rich media (photos, video). Over bright content add a dark dim layer of about 35% opacity (HIG).
- Do not mix the two variants in one group. **[WWDC25 219 notes]**
- Map is "busy" but is not media: use **regular** on Find.

### 3.3 Tint

- Tint is for meaning (primary action, state), not decoration. One tinted control per view at most — like `.glassProminent`. **[WWDC25 219/356, uncertain wording]**
- Use `tintColor` with `PlatformColor` / `DynamicColorIOS` so it adapts to light/dark under the glass. Possible use: the selected engine state or a warn toast. Not needed now.

### 3.4 Legibility over a map

- Regular glass + `c.fg` icon/label at full weight. Glass flips light/dark from what is behind it when `colorScheme='auto'`; we force our `scheme`, so on a bright map tile in dark mode the button stays dark. That is what we want (consistent with our dark UI). Check on a light satellite tile.
- Keep icons ≥ 22 pt and labels ≥ 15 pt semibold on glass.

### 3.5 Grouping, merging, morph

- Put glass shapes that sit close together in one `GlassContainer`; `spacing` sets when they blend. Glass cannot sample other glass, so separate siblings near each other look wrong — that is why containers exist. **[WWDC25 284/323 notes]**
- Morph: in SwiftUI, `glassEffectID` in a namespace inside a `GlassEffectContainer` morphs shapes on insert/remove. In UIKit (= expo-glass-effect), shapes inside a `UIGlassContainerEffect` merge and split when you animate their frames. expo-glass-effect has no `glassEffectId` equivalent. **[uncertain: how well RN-driven frame changes morph]**
- Our app has no group of adjacent glass parts yet. YAGNI until we add, for example, a second floating button on Find.

### 3.6 Accessibility

System settings change glass by themselves — you get this for free with real `UIGlassEffect`, not with a fake:

| Setting | Liquid Glass (system / GlassView) | Our solid fallback | Our action |
|---|---|---|---|
| Reduce Transparency | glass gets frostier / more opaque | already opaque | none; `isLiquidGlassAvailable()` still returns `true` (doc) |
| Increase Contrast | higher-contrast glass with a border | same as cards | check `c.fg2` text on glass |
| Reduce Motion | less elastic/bounce effects | — | our own motion already via Reanimated `useReducedMotion` |
| Settings → Liquid Glass "Tinted" look (iOS 26.1+) | more opaque glass | — | none |

Sources: Expo docs (`isLiquidGlassAvailable` may be `true` with limiting a11y settings; use `AccessibilityInfo.isReduceTransparencyEnabled()`); HIG Materials (variants change with Reduce Transparency / Increase Contrast). The exact look per setting: **[uncertain — check on 26.5 / 27.2 sim]**.

Library behavior:

- expo-glass-effect / NativeTabs / native header: follow the system automatically.
- expo-blur: UIKit blur follows Reduce Transparency itself. **[uncertain]**
- Our solid fallback: not affected.
- So: we likely need **no** Reduce Transparency branch. Add `AccessibilityInfo.isReduceTransparencyEnabled()` only if the device test shows bad contrast.

## 4. Architecture for Xe Key

### 4.1 Primitives

Keep one file, one fallback path. Today we have `Glass` + `GlassTabs`, used by toast and Find. That set is enough.

| Primitive | Status | Note |
|---|---|---|
| `Glass` (surface) | exists | one branch: `liquid ? GlassView : solid View` |
| `GlassTabs` (floating segmented) | exists | keep custom; NativeTabs cannot do a filter control |
| Glass round button | inline in `find.tsx` | extract `GlassButton` only when a 2nd user appears |
| Glass toast | inline in `toast.tsx` | fine as is |

Suggested changes to `Glass` (small):

```tsx
const liquid = isLiquidGlassAvailable();

export function Glass({ children, style, interactive, hidden, accessibilityRole }: Props) {
  const { c, scheme } = useTheme();
  if (liquid)
    return (
      <GlassView
        accessibilityRole={accessibilityRole}
        // Fade glass by style, never by opacity: UIKit drops the effect at low alpha.
        glassEffectStyle={{ style: hidden ? "none" : "regular", animate: true }}
        colorScheme={scheme}
        isInteractive={interactive}
        style={style}
      >
        {children}
      </GlassView>
    );
  return <View accessibilityRole={accessibilityRole} style={[fallback(c), style]}>{children}</View>;
}
```

- Remove `overflow: 'hidden'` from the GlassView branch only if a test shows it clips the press effect. **[uncertain]**
- `hidden` is only needed if the toast keeps its Reduce Motion fade. Alternative: Reduce Motion path = no fade, just show / hide. Pick the simpler one at implement time.

Toast:

- Drop `interactive` on the toast's `Glass`. It is a message, not a control; its action button is the control. **[opinion based on HIG "sparingly"]**
- Reduce Motion path animates `o` (opacity) on the parent of the glass. On iOS 26 that will show the content fading while glass pops. Use `glassEffectStyle` animate (above) or skip the fade.

### 4.2 Theming light / dark

- Keep `colorScheme={scheme}` so glass follows our in-app theme, not only the system.
- Text and icons on glass: `c.fg` / `c.fg2`, same tokens as everywhere. No glass-only tokens.
- If we add tint: pass `DynamicColorIOS({ light: …, dark: … })` or the token for the current scheme.
- Fallback fill: `c.s2` (dark `#232327`, light `#E6E6EB`). Light mode may want the `c.line` hairline (§2.1).
- Keep the ThemeProvider bg fix: native containers (stack, tabs) show their bg under glass at the edges.

### 4.3 Reduce Transparency

No code now. Real glass and the solid fill both handle it. Re-check after the device test (§5).

### 4.4 Home bottom row → NativeTabs?

No. Reasons:

- The bottom row is two actions (hold-to-lock, engine) — content-layer controls, not navigation. NativeTabs is for switching top-level sections.
- The app is one stack (Home → Find / Alerts / Engine / Settings …). Adding tabs changes the IA, not just the look.
- NativeTabs has no custom UI (hold button, timer digits), cannot be measured, and changes per OS (iOS 18 vs 26 bar).
- Keep the Home buttons solid (Apple: no glass in the content layer). Revisit NativeTabs only if the app gets 2–5 real top-level sections.

## 5. Test checklist

Run on simulators iOS 18.5, 26.5, 27.2 and on the device. Screens: Home, Find (map), Alerts (list + `GlassTabs`), any toast (lock / unlock result, undo delete).

Build / detection

- [ ] 18.5: solid fallback on Find button, Alerts filter, toast. No blank (transparent) pills.
- [ ] 26.5 and 27.2: real glass on all three. `isLiquidGlassAvailable()` = `true` (log once in dev).
- [ ] No white edge on iOS 26+ during push / swipe-back (ThemeProvider fix).

Appearance

- [ ] Dark and light theme from the in-app toggle and from system: glass follows our scheme, not the system, when they differ.
- [ ] Switch theme while Alerts is open, then go back to Home and return: glass still draws (off-screen appearance-change case).
- [ ] Find over a bright map area and over dark / satellite map: back icon readable.
- [ ] Alerts filter over a long list while scrolling: labels readable, badge visible.

Motion / lifecycle

- [ ] Toast drops in, swipe-up dismisses, replace-toast: glass present on every show (no "empty" toast).
- [ ] Reduce Motion ON: toast fade in/out — glass and text fade together (no pop).
- [ ] Interactive press on Find button and filter: press effect not clipped at the edge.

Accessibility (Settings → Accessibility → Display & Text Size)

- [ ] Reduce Transparency ON: glass becomes frosted / opaque; text contrast ok; fallback unchanged on 18.5.
- [ ] Increase Contrast ON: borders visible; `c.fg2` text still readable.
- [ ] Both ON at once.
- [ ] Settings → Display & Brightness → Liquid Glass → Tinted (26.1+): still readable.
- [ ] VoiceOver: filter reads as tab list with selected state; toast is announced; back button has a label.
- [ ] Largest Dynamic Type: filter and toast do not clip (glass height grows or text wraps).

## Recommendation

1. Stay on `expo-glass-effect` + the existing `Glass` wrapper. Do not add `@expo/ui`, `expo-blur` or community libs.
2. Keep the solid `c.s2` fallback for iOS ≤ 18 and Android. Gate with `isLiquidGlassAvailable()` only, never `Platform.Version`.
3. Do not set `UIDesignRequiresCompatibility`; with the Xcode 27 SDK it is ignored.
4. Small follow-ups: drop `interactive` on the toast; stop fading the toast's glass with `opacity` (use `glassEffectStyle` animate or no fade); test whether `overflow: 'hidden'` clips the press effect.
5. Keep Home's bottom row custom and solid. No NativeTabs now.
6. Run §5 once on 18.5 / 26.5 / 27.2; add a Reduce Transparency branch only if that test fails.

## Sources

- Installed source, read 2026-11-02: `apps/mobile/node_modules/expo-glass-effect` 58.0.5 (`ios/GlassEffectModule.swift`, `ios/GlassView.swift`, `CHANGELOG.md`), `expo-router` 58.0.29 (`build/native-tabs/types.d.ts`, `build/layouts/StackClient.d.ts`), `react-native-screens` 4.30.1 (`lib/typescript/types.d.ts`).
- Expo GlassEffect docs: <https://docs.expo.dev/versions/latest/sdk/glass-effect/>
- Expo BlurView docs: <https://docs.expo.dev/versions/latest/sdk/blur-view/>
- Expo UI SwiftUI: <https://docs.expo.dev/versions/latest/sdk/ui/swift-ui/>, Namespace: <https://docs.expo.dev/versions/latest/sdk/ui/swift-ui/namespace/>
- Expo Router native tabs: <https://docs.expo.dev/router/advanced/native-tabs/>
- expo issues / PRs: [#40911](https://github.com/expo/expo/issues/40911) (beta crash), [#41024](https://github.com/expo/expo/issues/41024) (not laid out), [#43732](https://github.com/expo/expo/issues/43732) (stale effect), [#48994](https://github.com/expo/expo/pull/48994) (fade-in), [#49850](https://github.com/expo/expo/pull/49850) (SDK 27), [#52000](https://github.com/expo/expo/pull/52000) (recycled parent)
- Apple HIG Materials (2025-09-09): <https://developer.apple.com/design/human-interface-guidelines/materials>
- Apple Liquid Glass overview: <https://developer.apple.com/documentation/technologyoverviews/liquid-glass>
- WWDC25 219 Meet Liquid Glass: <https://developer.apple.com/videos/play/wwdc2025/219/>; 356 Get to know the new design system: <https://developer.apple.com/videos/play/wwdc2025/356/>; 284 Build a UIKit app with the new design: <https://developer.apple.com/videos/play/wwdc2025/284/>
- Apple forums on `UIDesignRequiresCompatibility` and the iOS 27 SDK: <https://developer.apple.com/forums/thread/838637>, <https://origin-devforums.apple.com/forums/thread/832543>, <https://developer.apple.com/forums/thread/820475>
