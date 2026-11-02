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
| `sep` | `#1F1F23` | `#E3E3E8` | Row dividers in lists on `bg` (Trips, Alerts) |
| `fg` | `#F2F2F3` | `#0B0B0C` | Text |
| `fg2` | `#A1A1A8` | `#5C5C63` | Secondary text |
| `acc` | `#7CC7FF` | `#0A6FC2` | Live, engine, climate, primary action |
| `onacc` | `#06121C` | `#FFFFFF` | Text on `acc` |
| `warn` | `#FFB547` | `#9A5200` | Unlocked, attention |
| `onwarn` | `#1A1000` | `#FFFFFF` | Text on `warn` |
| `error` | `#FF8A80` | `#C42B22` | Form errors only |
| `danger` | `#D93A3F` | `#D93A3F` | Delete swipe action |

**Dividers:** 1 pt. Lists on `bg` use `sep`; rows inside an `s1` card use `s2`. Inset to the text start, none above the first row. Never `s1` as a divider: in light mode it is white on light grey.

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
| Press | solid buttons: scale 1.03 + glass rim and finger light while down (see Liquid Glass › Glass press) | light impact |
| Hold to arm | linear fill 1.5 s, release springs back 150 ms | selection tick at start and at 0.5 s and 1.0 s, medium impact when armed |
| State change | spring (response 0.35, damping 0.85), headline cross-fade | — |
| Command pending | ring 1.4 s/turn; amber dashed at half speed when retrying | none |
| Confirmed | check 0.8 → 1 (Pop) | success notification |
| Final failure | ring amber, no shake | warning notification |
| Slider / scrub stop | knob springs to stop (Pop, 320 ms) | selection tick per stop |

Reduce Motion: springs → 150 ms fades, spinners → pulsing dot. The hold fill stays (it is feedback).

### Haptics

Haptics confirm what the finger just did or what the car just did. Use few kinds and always the same kind for the same meaning. The haptic and the visual change happen at the same moment.

| Kind | Means | Fire when | Examples |
|---|---|---|---|
| `selection` | A value moved one step | The step changes under the finger: scrub or drag crosses a stop, tab or page changes, a swipe passes its action threshold, a hold starts, each 0.5 s of a hold | AC level, car style, paint, body carousel, Alerts filter, region list, delete swipe, hold start and progress |
| `light` | You pressed a solid button | Touch down on a solid button (pairs with the glass press); pull-to-refresh passes its threshold | Lock, Stop, Extend, Update, Go, Cancel, Continue, Wake chip |
| `medium` | The hold is armed; the command goes now | The hold fill completes | Hold to unlock, Hold to start |
| `success` | The car or Honda confirmed the action you asked for | The final good result arrives | Locked, Engine on, code verified |
| `warning` | Your action failed for good | Final failure, or a submit that is rejected | Couldn't reach car, wrong password, wrong code |
| none | | Everything else | See below |

**No haptic for:** navigation (back, opening a screen, rows, links); glass controls (header circles, recenter, Mark all read; native iOS 26 controls bring their own); native controls (Switch, keyboard, menus, pickers, swipe-back); toasts and banners appearing; background refresh, retries and "Retrying (n/3)"; data that changes on its own (new alerts, car status); Undo; the bubble grab on a slider (only stop changes tick); anything while the app is in the background.

**Rules**
1. One haptic per moment. A hold command: `selection` at start, 0.5 s and 1.0 s (progress) → `medium` (armed, 1.5 s) → `success` or `warning` (car result). A tap command: `light` → `success` or `warning`.
2. Fire at the change: touch down for buttons, the threshold crossing for swipes and pulls, each new stop for drags. Never on lift, never late.
3. Only on change. Dragging back and forth over the same stop ticks once per change; selecting the item that is already selected does nothing.
4. Never two haptics within 150 ms; the later one wins.
5. Never use `error` or `heavy`. No shake animations with `warning`.
6. Shared components own haptics, screens do not call them: `Button` / `SolidPressable` (`light`), `HoldButton` (`selection`, `medium`), `ScrubRail` / `SegmentedSlider` / carousels / `GlassTabs` fallback (`selection`), swipe rows (`selection`), `usePullRefresh` (`light`), `useCommand` (`success`, `warning`), form submit helper (`warning`, `success`). A screen may call `haptics` only for a flow no component covers, with a comment.
7. iOS System Haptics off mutes all of it; no in-app setting. Reduce Motion does not change haptics.

## Interaction rules

- **Tap** = safe and reversible (lock, open a screen). **Hold 1.5 s** = physical or risky (unlock, start engine); releasing early sends nothing.
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
| [Find](boards/Find.dc.html) | Find my car | populated (bottom panel is fixed, no grabber, not draggable) | Empty → [Empty-states](boards/Empty-states.dc.html). Map is satellite with labels (MapKit `hybrid`, `mapType="hybrid"`), so car parks, rooftops and gates are visible; controls over it use map glass (`.gm`). Car dot acc with white ring, you = system blue dot. No line between you and the car (distance shows in the panel; Go hands off to Apple Maps). **Horn and lights** (`/remote/hornLight`, result via `/remote/pullHornLightResult`; FINDINGS: `command=lights | horn | horn-lights`, no off, lights stop on a timeout): a row of two s2 buttons (52 pt) above Update / Go. "Flash lights" (headlights icon) = tap, `lights`, quiet and safe. "Hold to honk" (bell-ringing icon) = HoldButton 1.5 s, `horn-lights`, because it is loud (Interaction rules: hold = disturbing). Same async command lifecycle as lock (`useCommand`): the button becomes its own spinner ("Flashing…" / "Honking…"), car asleep → amber Retrying (n/3), result toast "Lights flashed" / "Horn and lights · car found you" or "Couldn't reach car". Never auto-resent. Haptics: Flash = light (Button) → success / warning; Honk = HoldButton selection + medium → success / warning. VI: "Nháy đèn", "Giữ để bấm còi", "Đã nháy đèn". Screenshot: screenshots/Find-horn.png. |
| [Status](boards/Status.dc.html) | Status detail | populated, open window warning | Top-down car diagram |
| [Service](boards/Service.dc.html) | Service reminder | OK, soon, overdue, Home banner, detail sheet | No PIN; FINDINGS Round 11. Level / target km / date: `/car/topPage` vehicleInfo (`maintenanceReminderLevel`, `nextMaintenanceMileage` = odometer target, `nextMaintenanceDate`). Km + days left and plan price: `/car/nextMaintenance` (`nextMaintenanceMileage.value`, `timeToMaintenance.value`, 0 when overdue; `nextMaintenancePlan.grandTotal`). History: `/maintenance?uoid` (+ `/maintenance/detail` for price). Overdue = `OVER_DUE`; soon = ≤ 1,000 km or ≤ 30 days left; else OK; missing → hide. Status: wide Service tile last in the grid ("in 4,800 km" / "or 40 days · 12 Dec · whichever first"); soon / overdue add the amber wrench banner on top. **Odometer tile returns as an estimate:** newest history `endMileage` + trip km since that date, shown "≈ 34,120 km" + "estimated"; tap explains the source; hide with no history. Home: soon / overdue only, 44 pt amber banner under the location card, below door / window banners; tap → Status with the sheet open. Sheet (native form sheet, large with history): title (amber when overdue), help line, rows Due at / Due date / Left / Plan estimate, Service history (3 newest: type, date, km, price; "All n" pushes the full list), "Already serviced? Hide until Honda updates" (hides banners, tile stays, until the target changes; Honda has no API to mark a service done). warn token, never red; VND with dot thousands; no haptics. VI: "Bảo dưỡng sau 800 km", "Quá hạn bảo dưỡng", "Lịch sử bảo dưỡng", "Ước tính". Replaces the old "Service in 1,200 km" banner. |
| [Trips](boards/Trips.dc.html), [Trips-pin](boards/Trips-pin.dc.html), [Trips-summary](boards/Trips-summary.dc.html) | Trips | no PIN (times), PIN sheet, places shown | Empty → Empty-states. PIN: see Honda PIN and trip detail |
| [Trips-days](boards/Trips-days.dc.html), [Trips-days-spec](boards/Trips-days-spec.dc.html) | Trips by day | days open / closed, bar tap, year by month | Driving behaviour list |
| [Trip-detail](boards/Trip-detail.dc.html) | Trip detail | populated | Needs the PIN token |
| [Notifications](boards/Notifications.dc.html), [Glass-alerts](boards/Glass-alerts.dc.html) | Alerts | populated, swipe-delete, filter All / Warnings / Commands | Filter and glass: see Liquid Glass. Empty per filter on [Glass](boards/Glass.dc.html) |
| [Settings](boards/Settings.dc.html) | Settings | populated | Vehicle row opens Your car. App › **Fuel use** (gas pump icon): `km/l` (default, Honda's unit) or `L/100 km`, chosen in a select sheet like Language / Time format; VI "Mức tiêu hao", options "km/l" / "L/100 km". Converts every fuel number (summary card, trip rows, Trip detail, widgets): L/100 km = 100 / km/l, 1 decimal ("10.3 km/l" ↔ "9.7 L/100 km"). Stored in prefs. The fuel meter fill and colour stay the same in both units (fuller / blue = thriftier). |
| [Select-sheets](boards/Select-sheets.dc.html) | Select sheets | Fuel use, Time format, Language | Every single-choice setting opens a native form sheet (Expo Router formSheet, fitToContents, grabber, radius 24, s1), not an action sheet or menu. Title 17 pt; rows 56 pt in one s2 card: label 16 pt (selected 600) + optional 13 pt fg2 sample with the user's own value ("9.7 L/100 km", "2:05 PM"); acc check on the selected row. Tap: check moves, `selection` haptic, saves, sheet closes after 200 ms; tapping the selected row just closes. Drag down / tap outside cancels; no Cancel button. VI titles: Ngôn ngữ, Định dạng giờ, Mức tiêu hao; System = "Theo iPhone". |
| [Car-edit](boards/Car-edit.dc.html), [Car-edit-flow](boards/Car-edit-flow.dc.html) | Your car (edit) | populated, saved toast | Entry: tap the car name on Home, or Settings → Vehicle. Swipe body, scrub style and paint, rename (24 chars; empty falls back to Honda's model name). Autosave on finger lift or name blur, one "Saved" toast. Plate, model, VIN read-only "From Honda". Reset to Honda's details. Photo style without `/car/image`: drawing + "No photo from Honda". |
| [Onb-welcome](boards/Onb-welcome.dc.html) … [Onb-setup](boards/Onb-setup.dc.html) | Onboarding 1–8 | see each | Welcome, Region, Sign in, Device heads-up, SMS code, Car found, Car look, Quick setup |
| [Signin-errors](boards/Signin-errors.dc.html) | Sign-in errors | wrong password, wrong/expired code, server down, app blocked | Inline errors, not toasts |
| [Toasts](boards/Toasts.dc.html) | Toasts & banners | 6 toasts, 3 banners | Toast = result; banner = ongoing condition |
| [Siri](boards/Siri.dc.html) | Siri, widgets, quick actions | — | App Intents + WidgetKit |
| [System](boards/System.dc.html) | Visual language | — | Mirrors this file |
| [Cars](boards/Cars.dc.html), [Share](boards/Share.dc.html), [Invite](boards/Invite.dc.html) | Later | — | Out of scope for v1 (see below) |

Every screen ships four states: loading, empty, error, populated.

## Liquid Glass (iOS 26+)

Boards: [Glass](boards/Glass.dc.html) (system), [Glass-alerts](boards/Glass-alerts.dc.html) (live: tap or drag the filter, tap ✓ to mark read).

- **Rule:** glass = controls that float over content. Content and primary actions stay solid.
- **Surface:** one shared glass view (`expo-glass-effect` `GlassView`, style `regular`, `isInteractive`). Shapes: capsule (height/2) and 44 pt circle. No custom tint; the system adapts to dark, light and map.

| Glass | Solid |
|---|---|
| Alerts filter (bottom capsule) | Hold to unlock, Start (the hold fill needs a solid ground) |
| Page header back and action circles, all pages (44 pt) | Climate hold button (`acc`) |
| Home settings circle | Find sheet (`s1`) and its Update (`acc`) / Go (`s2`) |
| Toasts (top capsule, icon chip `rgba(255,255,255,.10)`) | Home Status / Trips / Alerts row: no surface, plain icon + label (as before) |
| Find back and recenter buttons over the map | Banners, cards, list rows |
| | Badges (solid `warn`, colour carries meaning) |

**Alerts filter**
- Bottom, centred, 30 pt above the home indicator. The list pads 120 pt at the end and fades to 70% `bg` under the filter.
- Capsule 48 pt, 4 pt inset. Segments 40 pt, Label 15: unselected `fg2` 500, selected `fg` 600.
- Selected = a lens capsule inside the glass: `rgba(255,255,255,.14)` dark, `rgba(0,0,0,.07)` light. No solid `fg` pill.
- Badge only on **Warnings** = unread diagnosis alerts (warning lights). Commands are never unread: no badge on Commands or All. 18 pt pill, `warn` / `onwarn`, 11/700, "9+" over 9. Mark all read (header ✓, `acc`; `fg2` when nothing unread) clears it.
- Drag across the filter moves the lens and picks on lift (scrub rule). Taps work too; selection haptic on each change. VoiceOver: `tablist` / `tab`, badge read as "2 unread".
- Empty per filter: All "No alerts · Warning lights and command results show here." (`bell`, `fg2`); Warnings "No warning lights · Honda reports all clear." (`shield-check`, `acc`); Commands "No commands yet · Lock, unlock and engine results show here." (`lock`, `fg2`). Hide the filter when there are no alerts at all.

**Grounds**
- Light: same view; lens black 7%; badge uses light `warn` `#9A5200` with white text.
- Map (Find): only the floating circles are glass; icons `fg`, never `acc`.
- **Fallback (iOS < 26, or Reduce Transparency):** no blur. Dark `s2` `#232327` + 0.75 pt hairline `rgba(255,255,255,.06)` + shadow `0 8 24 rgba(0,0,0,.45)`; light `s1` `#FFFFFF` + shadow `0 6 20 rgba(0,0,0,.10)`. Lens `#34343A` dark / `s2` light. Same sizes and motion.

**Bubble drag (segmented sliders)** · [Glass-slider](boards/Glass-slider.dc.html), live
- Used by every `SegmentedSlider`: AC level (Climate), car style (onboarding, Your car). The track stays solid `s1`; only the knob turns to glass.
- **Rest:** solid `acc` knob with icon + value (as now).
- **Press (touch down, no drag needed):** knob scales 1 → 1.15 and solid → glass in 160 ms Settle; no haptic on grab. Touch away from the knob: the bubble jumps under the finger, Pop 220 ms.
- **Drag:** the bubble follows the finger 1:1, no snapping. Labels under it show magnified 1.15 in `fg` (render the label row inside the knob, offset by −knob x, clipped). Selection haptic when the nearest stop changes; value text updates live.
- **Lift:** snap to the nearest stop, Pop 320 ms; glass → solid `acc` and scale → 1 in 180 ms.
- **Glass look:** `GlassView` (`regular`), 1 pt `acc` 45% inner edge, top highlight, shadow `0 10 28 rgba(0,0,0,.5)` while held.
- **iOS < 26:** no glass; knob stays solid `acc` and scales 1.08 while held.
- **Reduce Motion:** no scale; glass ↔ solid is a 150 ms fade; snap without spring.

**Glass press (solid buttons)** · [Glass-press](boards/Glass-press.dc.html), live
- Applies to every solid button: Hold to unlock, Start, Climate hold, Update, Go, sheet and form buttons. At rest they stay solid; glass shows only while the finger is down.
- **Touch down:** scale 1 → 1.03 (160 ms Settle) and shadow `0 10 26 rgba(0,0,0,.45)`. A glass layer fades in over the fill in 120 ms: rim (top highlight white 50%, 1 pt edge white 22%) and a soft white light (radial, white 34% → 0) centred on the touch point. Haptic per Haptics: `light` on tap buttons, `selection` at hold start.
- **Finger moves:** the light follows the finger inside the button.
- **Hold:** the hold fill runs 1.5 s linear under the glass layer; selection tick every 0.5 s; medium haptic when armed.
- **Lift:** Pop back to 1 in 220 ms; glass fades out in 180 ms. Early lift on a hold: fill springs back 150 ms, nothing sent.
- Drawn by us (not `GlassView`), so iOS < 26 looks the same.
- **Reduce Motion:** no scale; rim and light fade in and out (150 ms); the light stays centred.

**Motion**

| Moment | Motion |
|---|---|
| Press | Glass controls: native interactive glass; fallback scale 0.96, 90 ms Settle, release Pop 220 ms. Solid buttons: Glass press above |
| Lens morph | Slide + resize to the new segment, Pop 320 ms; label colour 150 ms |
| Scrub | Filter scales 1.04 while held, lens brightens to 22% |
| Badge | Count change 1 → 1.2 → 1 Pop; cleared: scale to 0 in 200 ms, segment narrows with the lens |
| Appear | Filter rises 12 pt + fade, 280 ms Settle, 120 ms after the screen |
| Toast | In: drop 16 pt + 0.96 → 1, Pop 360 ms. Out: up + fade 200 ms |
| Reduce Motion | All → 150 ms fade, no scale or slide |

## Honda PIN and trip detail

Boards: [Trips-pin](boards/Trips-pin.dc.html) (live), [Trips-loading](boards/Trips-loading.dc.html) (skeletons, pull to refresh), [Pin-states](boards/Pin-states.dc.html) (10 states, rules, EN/VI copy), [Trip-detail](boards/Trip-detail.dc.html), [Trips-summary](boards/Trips-summary.dc.html).

Honda's 4-digit PIN (`POST /auth/pin/verify`) gives a `pinToken` that unlocks `/car/trip/detail` (route, places) and `/car/trip/recent`. Without it Trips shows times and stats only.

- **Saved places (cache):** place names and trip detail (route, stats) are saved per trip once loaded; past trips never change. Saved places always show in the list, no PIN. Opening a trip's detail always needs PIN or Face ID this session, then opens from the cache at once. App storage, no iCloud backup; deleted on sign-out and Forget PIN. New trips without places show times; the banner then says "2 new trips without places · Enter your Honda PIN to load them" ("Places are hidden" when nothing is saved yet) and hides when every listed trip has places.
- **PIN sheet only on intent:** "Show places" (full-width button under "Places are hidden · Enter your Honda PIN to see them" in a card above the list), or tapping a trip row. Never on opening Trips or at sign-in. A row tap that opened the sheet goes on to that trip's detail after success.
- **Token:** in memory for the app session, like the Honda app. App killed → saved places still show; new places and details wait for the next PIN or Face ID.
- **Sheet:** title, one line of text, 4 secure dots, status line (live region), "Remember with Face ID" switch, "Forgot PIN?", system number pad. The 4th digit sends; no Submit button. Paste works.
- **Wrong:** dots turn amber, status "Wrong PIN. Too many tries can lock it.", pad stays, next digit starts over. No shake, no attempt counter (Honda doesn't give one).
- **Locked (Honda lock error) and Forgot:** pad replaced by text + "Open Honda CONNECT" + "Not now". Xe Key can't reset the PIN.
- **Success:** sheet closes (Settle 320 ms), places cross-fade over the times (200 ms, 30 ms stagger), toast "Places shown".
- **Face ID (optional, off by default):** on → PIN in Keychain, biometry-only (ADR 0005 pattern). Opening Trips with no token runs Face ID by itself only when some listed trips have no saved places, once per app session (not every visit, not from the background); success → places fade in, no toast. Fails or cancelled → times stay, banner says "Face ID didn't work. Use your PIN", no sheet pops up and no auto-retry this session; Show places opens the sheet. New face enrolled → Keychain item gone, same as off. Honda rejects the stored PIN → delete it, sheet titled "Your Honda PIN changed". Off → the PIN is never stored. Settings › Security › Honda PIN: Face ID switch + Forget PIN.
- **Haptics:** digits none (keyboard), success `success`, wrong and locked `warning`, Face ID system, Show places `light` (Button).
- **Driving summary (no PIN):** replaces the score ring (Honda has no score). Card with a solid Week / Month / Year switch (`selection` haptic), period title with trip count, distance bars (7 days / days of month / 12 months, current one acc), then Distance, Time, Avg speed, Max speed, Fuel, Day / night bar with percent. Data: `/car/trip/summary?summaryType=Day|Month|Year` (FINDINGS Round 9). Hard accel / braking bars only when Honda sends a value above 0. Header trip/km pills removed. The trip list stays recent trips whatever the period.
- **Browse periods:** paged chart. Drag the card body (title, bars, stats) sideways: it follows the finger with the earlier / later period beside it; release past 25% or a flick snaps (Settle 300 ms), else springs back; ends rubber-band. ‹ › do the same slide. Title shows the range (This week, Last week, 19–25 Oct; This month, October 2026). Back ~6 months. `selection` haptic when a new period lands. Only the left-edge swipe goes back (full-screen swipe-back off on Trips); the pager sits 20 pt in from the edge and uses activeOffsetX ±12 / failOffsetY ±10, so vertical scroll wins on vertical drags. Prefetch both neighbours when a period lands; past periods are cached for good, only the current one refetches.
- **Stats format:** number 16 pt semibold + unit 12 pt fg2; time short (4h12, or 24 min under an hour); day/night as two percents with colour dots. VI labels: Quãng đường, Thời gian, Tốc độ TB, Nhanh nhất, Tiêu hao, Ngày / đêm; segment Tuần / Tháng / Năm; weekday axis T2…CN, year axis 1–12; comma decimals (10,4), dot thousands (2.298).
- **Bar tap:** selects that day (a month in Year): bar acc, others dim, list header "Sat 31 Oct · 2 trips" + "Show recent". Tap again or Show recent → recent trips. Future days faint, not tappable. No haptic. Day list from `/car/trip?day=&month=&year=` (no PIN).
- **No drift:** period, range or bar changes never move anything. Card height fixed, title centred between fixed arrows, tabular digits, bars area fixed. Accel / brake rows decided per car, not per period. A range with no data yet shows skeleton bars and stat blocks in the same boxes (no size change); a range being refreshed keeps its values. The list header is always there ("Recent trips" ↔ "Sat 31 Oct · 2 trips"), so a bar tap doesn't push the rows.
- **Pull to refresh:** on the Trips list (`usePullRefresh`, `light` haptic at the threshold): refetches the summary, the shown range and recent trips; with a token, loads places for new trips. Content stays in place while it refreshes. Not on Trip detail (see below).
- **Loading = skeleton, not spinner:** first load of the card, list rows, trip detail tiles and map use skeletons (`Shimmer`) shaped like the real content, so nothing jumps when data arrives. Spinners only for pull to refresh (system), the PIN sheet ("Checking…") and a button's own progress. Skeleton → content is a 150 ms fade; Reduce Motion: flat blocks, no sweep. The PIN banner fades in with the first list (it can't be known before) and afterwards only leaves. Refresh fails → values stay, toast "Couldn't refresh".
- **Trips by day (driving behaviour, like Honda's "Thói quen lái xe"):** boards [Trips-days](boards/Trips-days.dc.html) (live) and [Trips-days-spec](boards/Trips-days-spec.dc.html). No second tab: the list under the summary card becomes the days of the card's period (Week / Month: days, newest first, days without trips skipped; Year: months, tap → card switches to Month on that month). Day row 60 pt: acc ring (2.5 pt) with the trip count, "Sat 1 Nov" / "T7, 1/11", "3 trips", total km + total time (short form), chevron; all days start open; tap a header to close / reopen (kept for the session, no haptic). Open / close animates the height (Reanimated measured height or layout transition, Settle 280 ms) with the trips fading 200 ms and the chevron turning 90°; rows below move with it, never jump. Reduce Motion: 150 ms fade. Open day: its trips indented 48 pt. Places saved: small time range on top (10 pt, same grey as the stat labels), then from / to; no places: start / end times are the two lines. km pill + minutes on the right, level with the from line. Under it one metrics row in 3 equal columns so the visuals line up row to row: Max speed bands, Avg speed bands, Fuel meter; every value carries its unit ("85 km/h", "10.3 km/l"). Each metrics row has its own labels right above it (Max speed · Avg speed · Fuel, 10 pt, 2 pt gap, aligned to the same columns). Speed bands = Honda's bars: 3 segments, 1 ≤ 49 km/h, 2 for 50–89, 3 ≥ 90; filled acc for band 1, warn for 2–3, empty `line`. Fuel is a different shape on purpose: 24 pt continuous meter (fill 6→16 km/l) + "10.3 km/l", coloured against this car's own 30-day average km/l: 10%+ worse = warn (thirsty), within ±10% = fg2, 10%+ better = acc (thrifty). Relative because a fair km/l differs per car; under 5 trips of history → always fg2. VoiceOver reads one sentence per trip with the numbers. Bar tap on the card scrolls that day under the card and opens it if closed (replaces "Show recent"); list header reads the period ("Last week · 6 days"). Data: `/car/trip?day=` per driven day (no PIN), Year from `summaryType=Month`. VI: "3 chuyến", columns "Tối đa · Trung bình · Nhiên liệu", "Tuần trước · 6 ngày", "Tháng 10/2026".
- **Trip row layout:** from / to lines 20 pt each; the hollow start dot and filled end dot sit on those lines' centres, joined by a dotted line; day label, km pill and minutes align to the same lines. Long place names: one line, ellipsis in the list; up to 2 lines in Trip detail.
- **Trip row, unlocked:** from (fg2) / to (fg) / `07:42–08:06 · 21 km/h · 9.5 km/l`; km pill and minutes on the right. No PIN: start time / end time / stats.
- **Trip detail = page sheet** (`presentation: "modal"`, iOS page sheet): Trips zooms out behind it (system effect). Grabber, glass ✕ top-right, drag down outside the map closes it. Top 380 pt: real Apple map (MapKit, dark), Honda's `tripRoute` encoded polyline decoded and drawn as a polyline (acc 5 pt over a 9 pt bg casing), start ring + end dot, camera fits the route with padding; map pans/zooms, glass "fit route" button bottom-right brings it back. Below: day + time range, from → to (up to 2 lines each, dotted line joins the dots), 6 tiles (Distance, Time, Fuel, Avg speed, Max speed, Idle; number + small unit; drop a tile Honda doesn't send), day/night bar. No pull to refresh in the sheet (it would fight drag-to-close); it refetches once on open if the saved copy is incomplete. Loading: map, places and missing tiles skeleton.
- **PIN and locked sheets = native form sheet** (Expo Router `presentation: "formSheet"`, `sheetAllowedDetents: "fitToContents"`, `sheetGrabberVisible: true`, `sheetCornerRadius: 24`, background s1; no zoom-out). System dim, grabber, drag to close and keyboard avoidance come from iOS. The PIN view sits on the system number pad (`keyboardType="number-pad"`, iOS 26 floating keyboard whose corners follow the screen), so never draw a flat full-width pad. Locked / Forgot replace the pad inside the same sheet; the sheet resizes to fit.

## Splash → Home

Boards: [Splash](boards/Splash.dc.html) (live, tap to replay) and [Splash-frames](boards/Splash-frames.dc.html) (storyboard). About 1.9 s from start to finish. It never waits on the network.

- **Launch image (native, static):** `#0B0B0C` ground, a centered 104 pt "xe." tile (`#F2F2F3`, dot `#0A6FC2`, radius 26). JS takes over on the identical frame, then hides the native splash.
- **0.25 s:** the tile shrinks to 0.72 and fades (320 ms, Settle). Its dot stays.
- **0.23–1.05 s:** the dot arcs up and over to the Home car's headlight (820 ms, ease in-out). On the way it turns `#7CC7FF`, then a white glow.
- **0.40–1.08 s:** the car drives in from the left (−470 → 0 pt, 680 ms, Settle) and stops exactly where Home draws it (x 4, y 230, width 382). A soft blue floor glow fades in under it.
- **1.04–1.90 s:** headlight wink. Two blinks like the real car, then it fades.
- **1.25–1.70 s:** all Home content fades in at once (opacity 0 → 1, 450 ms, Settle). No slide, no wipe, no stagger. The overlay car fades at 1.76 s; Home's own car is underneath in the same place.
- **Data:** if the car status is not ready, Home shows its skeleton ([Home-loading](boards/Home-loading.dc.html)) under the reveal. Cached data shows at once.
- **Haptics:** none.
- **Reduce Motion:** 200 ms cross-fade from the launch image to Home.
- **When it plays:** cold start only. Return from background and deep links (Siri, widgets) go straight to their screen.

## Website (landing page)

A separate deliverable from the Expo app (tasks [011](../../../docs/tasks/done/011-landing-page.md), [012](../../../docs/tasks/done/012-waitlist-storage.md)). Same tokens, font, icons and motion curves as the app.

| Board | What | Notes |
|---|---|---|
| [Landing](boards/Landing.dc.html) | Desktop, 1440 wide | Live: language switch, hero states, hold demo, feature tour, form, FAQ |
| [Landing-mobile](boards/Landing-mobile.dc.html) | Mobile, 390 wide | Same page, stacked layout |
| [Registered](boards/Registered.dc.html) | Waitlist success panel | Desktop and mobile, starts signed up |

- **Goal:** waitlist. The copy never gives a launch date or says which platform comes first.
- **Language:** Vietnamese by default, EN switch in the nav. All copy is in the board's `C` dictionary (`vi`, `en`); port it as is. Words match the app dictionary: khóa, điều hòa, nổ máy, nhấn giữ. No speed promise (Honda can take ~20 s to answer).
- **Sections, in order:** nav · hero · three steps + hold demo · feature tour · all features · car shapes · straight talk + FAQ · final sign-up · footer.
- **Hero:** red Civic RS (`sedan`, `#9E1B22`) loops locked → unlocked → engine on every 3.4 s. Four chips follow the state (state, cabin 34° → 26°, fuel, location). The pills under the car pick a state and stop the loop.
- **Hold demo:** same rule as the app: 1.5 s fill, release early cancels, fake send 1.4 s, the car blinks only after the fake confirm. White City.
- **Feature tour:** 6 tabs and a phone showing the real screen boards (Main, Engine, Find, Status, Trips, Notifications). Autoplay every 6 s with a progress bar; any tap, swipe (50 px) or arrow stops it.
- **All features:** 12 cards, including Siri, widgets, sharing and multiple cars (not in app v1). A `.soon` tag style exists for launch-later items; the owner decides which ones get it.
- **Waitlist form:** platform pick (iPhone / Android, default iPhone) + email. Inline error under the field. Success in the hero shows the Registered panel: check draws in, email and platform echoed, optional survey (car model: one pick; most-wanted features: many picks; Send disabled until a pick; Skip), thank-you line, copy-link button. The end-of-page form shows a one-line success instead.
- **Data per sign-up:** email, platform, language, car (optional), features (optional), created time.
- **Reduce Motion:** no hero loop, no tour autoplay, no floating chips. The hold fill stays.
- **Legal:** footer says Xe Key is independent and not affiliated with Honda. No Honda logo anywhere.

## Car illustration

Spec: [Car.dc.html](boards/Car.dc.html); overviews: [Car-gallery](boards/Car-gallery.dc.html), [Car-contrast](boards/Car-contrast.dc.html), [Car-states](boards/Car-states.dc.html). Port to `react-native-svg`; frame 720 × 280, centered on the body: viewBox x = (min x + max x of the profile `top` path) / 2 − 360, so every model sits in the middle of a symmetric wrapper.

- **Props:** `body` (`crossover` HR-V · `sedan` Civic RS · `city` City · `suv` CR-V · `mpv` BR-V), `look` (`shaded` | `line`; a third user option "Honda photo" uses `/car/image` instead of the drawing), `paint` (hex), `ground` (`dark` | `light`), `assist` (bool), `doors` (`locked` | `unlocked`), `engine` (bool).
- **Geometry:** the `S` map in `renderVals()` holds per-model profile paths and wheel data (`w`, `wy`, `wr`, `yb`, optional `gap`, `sport`). Wheel arches are generated, not drawn: arch radius = `wr + (gap ?? 8)`, endpoints where the arch circle meets the rocker line `yb`, large-arc flag 1. Keep that function and unit-test it.
- **Contrast assist:** relative luminance of `paint` (Rec. 709 weights). On dark ground with lum < 0.18 → backlight glow + light rim; on light ground with lum > 0.7 → dark rim + firmer shadow. Pure function, unit-test it.
- **States:** unlocked → indicators blink twice (1.6 s), then mirror lamps and handles stay amber. Engine on → head/tail light glow and soft exhaust vapor: 6 puffs, one every 0.45 s, each 2.8–3.5 s; from the tailpipe they drift back ~60 and rise ~65, grow r 4 → 34, fade in fast (0.85) and out slowly. Each puff is a radial gradient (soft edge), the group is blurred (~3.6) and lightly distorted by noise so the plume looks wispy, not like circles. The board uses SVG SMIL and an SVG filter; in RN use Reanimated, and a blur (Skia or a pre-blurred sprite) where SVG filters are not available.
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
- Website: domain and contact alias; lawyer review of the privacy text (framework, hosting and storage: ADRs 0006, 0008, 0009).

## Out of scope for v1

Multi-car switcher and shared access (needs our own backend holding the owner's token — security decision first). Boards kept under "Later" for reference.

Push notifications: Honda pushes only to the official app's token, so v1 has none. Alerts are fetched in-app on open and pull-to-refresh; the Quick setup "notifications" toggle is dropped.
