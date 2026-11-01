# Xe Key — design handoff

> Build spec for the Expo app. The files in this folder are the source of truth; the canvas is a visual reference.

- **Canvas (live, private):** https://claude.ai/artifact/QYvpAwBhqaL3tze6KrRWNL — readable by any Claude session on the owner's account (Artifact tool, `read` action).
- **[boards/](boards/)** — exact source of every artboard (`*.dc.html`) plus the layout index (`canvas.json`).
- **[screenshots/](screenshots/)** — each board rendered at its real size. Phone boards are 390×844 pt.
- **Original brief:** [../design-brief.md](../design-brief.md).

## How to read a board

Each `.dc.html` is one screen: HTML with inline styles (px = iOS points) and a `class Component extends DCLogic` block. `renderVals()` holds the sample data and the interaction logic (hold timers, sliders, carousel, command steps). Read the logic as behaviour spec, not as code to port line by line. `<dc-import name="Car">` mounts the shared car illustration ([boards/Car.dc.html](boards/Car.dc.html)).

## Brand

- **Name:** Xe Key (App Store name). Home Screen label: `Xe Key`. Never use "Honda" in the name or icon; subtitle may say "for Honda CONNECT".
- **Logo:** "xe." wordmark, weight 800, letter-spacing −0.06em, the dot is the only color. Light tile `#F2F2F3` with `#0A6FC2` dot (app icon); dark tile `#0B0B0C` with `#7CC7FF` dot (alternate icon). See [Logo.dc.html](boards/Logo.dc.html).
- **Tone:** quiet, few words, icon-led. Labels ≤ 3 words; body ≤ 1 line.

## Tokens

### Color

| Token | Dark | Light | Use |
|---|---|---|---|
| `bg` | `#0B0B0C` | `#F4F4F6` | Screen ground |
| `s1` | `#17171A` | `#FFFFFF` | Cards, pills |
| `s2` | `#232327` | `#E6E6EB` | Pressed, selected, skeleton |
| `line` | `#2E2E33` | `#D6D6DC` | Hairlines |
| `fg` | `#F2F2F3` | `#0B0B0C` | Text |
| `fg2` | `#A1A1A8` | `#5C5C63` | Secondary text |
| `acc` | `#7CC7FF` | `#0A6FC2` | Live, engine, climate, primary action |
| `onacc` | `#06121C` | `#FFFFFF` | Text on `acc` |
| `warn` | `#FFB547` | `#9A5200` | Unlocked, attention |
| `onwarn` | `#1A1000` | `#FFFFFF` | Text on `warn` |
| `error` | `#FF8A80` | `#C42B22` | Form errors only |
| `danger` | `#D93A3F` | `#D93A3F` | Delete swipe action |

Grays carry the UI. Blue = live/engine/climate. Amber = unlocked/attention. Red = delete and form errors only. All text pairs pass 4.5:1.

### Type

Font: **Be Vietnam Pro** 400/500/600/700/800 (`@expo-google-fonts/be-vietnam-pro`). Tabular figures (`fontVariant: ['tabular-nums']`) for every number. Support Dynamic Type; Vietnamese line-height ≥ 1.3 for body.

| Style | Size/weight | Tracking |
|---|---|---|
| Hero (timer) | 64/600 | −0.03em |
| Title (Home state) | 40/600 | −0.03em |
| Large title | 34/600 | −0.02em |
| Stat | 24/600 | −0.02em |
| Body | 17/400 | 0 |
| Label | 15/500–600 | 0 |
| Caption | 13/400 | 0 |

### Space, shape, targets

4-pt grid. Screen gutter 20. Card padding 16–20. Section gap 20. Radii: chip 12, card 20–24, pill = height/2. Primary actions are 64–68 pt tall and live in the bottom 40% of the screen. Hit targets ≥ 44 pt.

### Icons

**Phosphor Regular** through the owner's fork `phosphor-react-native` (github.com/duongdev/phosphor-react-native). Sizes 16 / 18 / 22 / 28. Fill weight only for a confirmed state. Names used across boards:

`lock` `lock-open` `power` `snowflake` `fan` `thermometer-simple` `gas-pump` `road-horizon` `clock` `timer` `map-pin` `navigation-arrow` `crosshair` `arrows-clockwise` `warning` `warning-circle` `info` `check` `check-circle` `x-circle` `bell` `trash` `wifi-slash` `cloud-slash` `shield-check` `seal-check` `key` `steering-wheel` `engine` `car-profile` `car-battery` `gauge` `path` `wrench` `calendar` `crown` `device-mobile` `chat-text` `password` `eye` `globe` `scan-smiley` `sliders-horizontal` `caret-left` `caret-right` `caret-down` `arrow-right` `plus` `hand-swipe-right` `hard-drives` `sparkle` `user` `share-network` `devices`.

### Motion and haptics

Two curves only: **Settle** `cubic-bezier(.22,1,.36,1)` and **Pop** `cubic-bezier(.34,1.56,.64,1)`. Live reference: [Motion.dc.html](boards/Motion.dc.html).

| Moment | Motion | Haptic |
|---|---|---|
| Press | scale 0.97, 90 ms | light impact |
| Hold to arm | linear fill 600 ms, release springs back 150 ms | selection tick at start, medium impact when armed |
| State change | spring (response 0.35, damping 0.85), headline cross-fade | — |
| Command pending | ring 1.4 s/turn; amber dashed at half speed when retrying | none |
| Confirmed | check 0.8 → 1 (Pop) | success notification |
| Final failure | ring amber, no shake | warning notification |
| Slider / scrub stop | knob springs to stop (Pop, 320 ms) | selection tick per stop |

Reduce Motion: springs → 150 ms fades, spinners → pulsing dot. The hold fill stays (it is feedback).

## Interaction rules

- **Tap** = safe and reversible (lock, open a screen). **Hold 0.6 s** = physical or risky (unlock, start engine); releasing early sends nothing.
- **Choose by swipe or scrub, never tap-tap:** swipe the car to change body shape; slide a knob for AC level and car style; scrub along the paint rail. Value changes live under the finger. Taps and VoiceOver adjustable (`accessibilityRole="adjustable"`) still work.
- **Pull down on Home** = wake the car and refresh live data.
- **Swipe left** on an alert = delete with Undo toast. Edge swipe = back.
- **Commands are async:** fire → accepted → confirmed. The button becomes its own progress ring; no modal, no blocking spinner. The headline changes only when the car confirms. Car asleep → amber "Retrying (n/3)", command stays queued. After all retries → "Couldn't reach car · Try again", nothing changed. Spec: [Engine-states.dc.html](boards/Engine-states.dc.html).
- **Engine:** 2 remote starts before the car must be driven; extend uses a start; when none are left, offer a reminder instead of a disabled button. Auto-off after 10 min.

## Screen map

| Board | Screen | States on canvas | Notes |
|---|---|---|---|
| [Main](boards/Main.dc.html), [Home-light](boards/Home-light.dc.html) | Home | populated, waking, unlocking/locking, unlocked, engine on (tweak) | Hold-to-unlock, tap-to-lock, freshness chip wakes |
| [Home-loading](boards/Home-loading.dc.html) | Home | first load (skeleton) | Cached data shows instantly when present |
| [Home-offline](boards/Home-offline.dc.html) | Home | no internet | Controls disabled with icon reason |
| [Home-signedout](boards/Home-signedout.dc.html) | Home | signed in on another phone | Honda allows one device |
| [Home-expired](boards/Home-expired.dc.html) | Home | package expired | Read-only status, Renew link |
| [Engine](boards/Engine.dc.html) | Climate / remote engine | idle, sending, accepted, retrying, running, no starts left | `simulate` tweak shows the asleep path |
| [Lock](boards/Lock.dc.html) | Doors | locked, holding | |
| [Find](boards/Find.dc.html) | Find my car | populated | Empty → [Empty-states](boards/Empty-states.dc.html) |
| [Status](boards/Status.dc.html) | Status detail | populated, open window warning | Top-down car diagram |
| [Trips](boards/Trips.dc.html) | Trips | populated | Empty → Empty-states |
| [Notifications](boards/Notifications.dc.html) | Alerts | populated, swipe-delete | Empty → Empty-states |
| [Settings](boards/Settings.dc.html) | Settings | populated | |
| [Onb-welcome](boards/Onb-welcome.dc.html) … [Onb-setup](boards/Onb-setup.dc.html) | Onboarding 1–8 | see each | Welcome, Region, Sign in, Device heads-up, SMS code, Car found, Car look, Quick setup |
| [Signin-errors](boards/Signin-errors.dc.html) | Sign-in errors | wrong password, wrong/expired code, server down, app blocked | Inline errors, not toasts |
| [Toasts](boards/Toasts.dc.html) | Toasts & banners | 6 toasts, 3 banners | Toast = result; banner = ongoing condition |
| [Siri](boards/Siri.dc.html) | Siri, widgets, quick actions | — | App Intents + WidgetKit |
| [System](boards/System.dc.html) | Visual language | — | Mirrors this file |
| [Cars](boards/Cars.dc.html), [Share](boards/Share.dc.html), [Invite](boards/Invite.dc.html) | Later | — | Out of scope for v1 (see below) |

Every screen ships four states: loading, empty, error, populated.

## Website (landing page)

A separate deliverable from the Expo app (tasks [011](../../../docs/tasks/011-landing-page.md), [012](../../../docs/tasks/012-waitlist-storage.md)). Same tokens, font, icons and motion curves as the app.

| Board | What | Notes |
|---|---|---|
| [Landing](boards/Landing.dc.html) | Desktop, 1440 wide | Live: language switch, hero states, hold demo, feature tour, form, FAQ |
| [Landing-mobile](boards/Landing-mobile.dc.html) | Mobile, 390 wide | Same page, stacked layout |
| [Registered](boards/Registered.dc.html) | Waitlist success panel | Desktop and mobile, starts signed up |

- **Goal:** waitlist. The copy never gives a launch date or says which platform comes first.
- **Language:** Vietnamese by default, EN switch in the nav. All copy is in the board's `C` dictionary (`vi`, `en`); port it as is. Words match the app dictionary: khóa, điều hòa, nổ máy, nhấn giữ. No speed promise (Honda can take ~20 s to answer).
- **Sections, in order:** nav · hero · three steps + hold demo · feature tour · all features · car shapes · straight talk + FAQ · final sign-up · footer.
- **Hero:** red Civic RS (`sedan`, `#9E1B22`) loops locked → unlocked → engine on every 3.4 s. Four chips follow the state (state, cabin 34° → 26°, fuel, location). The pills under the car pick a state and stop the loop.
- **Hold demo:** same rule as the app: 600 ms fill, release early cancels, fake send 1.4 s, the car blinks only after the fake confirm. White City.
- **Feature tour:** 6 tabs and a phone showing the real screen boards (Main, Engine, Find, Status, Trips, Notifications). Autoplay every 6 s with a progress bar; any tap, swipe (50 px) or arrow stops it.
- **All features:** 12 cards, including Siri, widgets, sharing and multiple cars (not in app v1). A `.soon` tag style exists for launch-later items; the owner decides which ones get it.
- **Waitlist form:** platform pick (iPhone / Android, default iPhone) + email. Inline error under the field. Success in the hero shows the Registered panel: check draws in, email and platform echoed, optional survey (car model: one pick; most-wanted features: many picks; Send disabled until a pick; Skip), thank-you line, copy-link button. The end-of-page form shows a one-line success instead.
- **Data per sign-up:** email, platform, language, car (optional), features (optional), created time.
- **Reduce Motion:** no hero loop, no tour autoplay, no floating chips. The hold fill stays.
- **Legal:** footer says Xe Key is independent and not affiliated with Honda. No Honda logo anywhere.

## Car illustration

Spec: [Car.dc.html](boards/Car.dc.html); overviews: [Car-gallery](boards/Car-gallery.dc.html), [Car-contrast](boards/Car-contrast.dc.html), [Car-states](boards/Car-states.dc.html). Port to `react-native-svg`; viewBox `0 0 720 280`.

- **Props:** `body` (`crossover` HR-V · `sedan` Civic RS · `city` City · `suv` CR-V · `mpv` BR-V), `look` (`shaded` | `line`; a third user option "Honda photo" uses `/car/image` instead of the drawing), `paint` (hex), `ground` (`dark` | `light`), `assist` (bool), `doors` (`locked` | `unlocked`), `engine` (bool).
- **Geometry:** the `S` map in `renderVals()` holds per-model profile paths and wheel data (`w`, `wy`, `wr`, `yb`, optional `gap`, `sport`). Wheel arches are generated, not drawn: arch radius = `wr + (gap ?? 8)`, endpoints where the arch circle meets the rocker line `yb`, large-arc flag 1. Keep that function and unit-test it.
- **Contrast assist:** relative luminance of `paint` (Rec. 709 weights). On dark ground with lum < 0.18 → backlight glow + light rim; on light ground with lum > 0.7 → dark rim + firmer shadow. Pure function, unit-test it.
- **States:** unlocked → indicators blink twice (1.6 s), then mirror lamps and handles stay amber. Engine on → head/tail light glow, exhaust puffs every 0.9 s from the tailpipe (puffs rise, grow 4 → 22, fade). The board uses SVG SMIL; in RN use Reanimated.
- **Only confirmed car state changes the picture**, never a pending command.

## API mapping (`@xekey/core`)

Grounded in [research/FINDINGS.md](../../../research/FINDINGS.md). Endpoints marked "?" are unverified.

| UI | Source |
|---|---|
| Region picker | per-country base URL (Vietnam default) |
| Sign in | `POST /auth/login` (VN username = phone number) |
| SMS code | `POST /auth/otp/verify` — device-change OTP |
| Face ID re-open | `BIOMETRIC_REFRESH_TOKEN` login |
| Car found / photo look | `/car/image`, `/car/dashboard` ? |
| Home, Status | `/car/dashboard`, `/car/status/door`, `/car/status/engine` ? |
| Alerts | `/car/alertMessages` |
| Geofence | `/car/geoFence` |
| Remote commands | `/remote/*` — PIN requirement unknown |

## Open questions

- SMS code length (designed as 6) and expiry; whether Honda returns tries-left on wrong password.
- Paint list per model (sample uses six common Honda colours).
- Does `/remote/*` need `/auth/pin/verify` first? If yes, add a PIN or Face ID step.
- RN transport for cookies (see [../CLAUDE.md](../CLAUDE.md) gotcha) — needs an ADR.
- Website: domain, waitlist storage, privacy page, web framework and hosting (ADR in task 011).

## Out of scope for v1

Multi-car switcher and shared access (needs our own backend holding the owner's token — security decision first). Boards kept under "Later" for reference.

Push notifications: Honda pushes only to the official app's token, so v1 has none. Alerts are fetched in-app on open and pull-to-refresh; the Quick setup "notifications" toggle is dropped.
