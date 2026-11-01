# Design prompt — Honda CONNECT One client (mobile)

Paste the block below into Claude to kick off the app design.

---

You are designing the UI/UX for a fast, minimalist mobile app that remote-controls a Honda
car — an unofficial, much nicer replacement for the official "Honda CONNECT One" app (APAC /
Vietnam). It is built with **Expo / React Native (iOS-first)** and talks to a ready-made
TypeScript API client, so you focus entirely on experience, interaction, and visual design.

## Product & user
- One user, their own car. They open the app for seconds at a time: check status, lock/unlock,
  start the engine to pre-cool, find the car. Speed and one-handed use beat everything.
- The official app is slow, cluttered, and ugly. We win on: instant feel, clarity, fewer taps.

## Design principles
- **Minimalist & modern** — generous whitespace, one primary action per screen, strong type
  hierarchy, no chrome for chrome's sake. Think Apple-grade restraint, not a dashboard of gauges.
- **Fast & responsive** — optimistic UI, skeletons over spinners, 60fps, instant tap feedback,
  haptics on every command. The app must *feel* faster than the car can respond.
- **Gesture-first, one-handed** — reachable primary actions (bottom third), swipes, long-press
  to confirm anything physical, pull-to-refresh to wake the car. No hunting in menus.
- **Four states always** — every data surface designs loading / empty / error / populated.
- **Light + dark**, Dynamic Type, full VN + EN localization, safe-area correct, reduced-motion aware.

## Core screens (ground the design in these)
1. **Home / car** — the hero: car image, lock state, engine state, fuel/range, last-known
   location snippet, and the primary remote actions. This is 90% of usage.
2. **Remote engine** — start/stop with an **AC level** picker (high / mid / low) and the running
   **countdown timer** (engine auto-offs after ~10 min). Show an **extend** action to add time.
3. **Lock / unlock** — a single prominent control with clear current state.
4. **Find my car** — map with the car's position; a "ping / update location" action.
5. **Status detail** — doors, engine, windows, alerts.
6. **Trips** — recent drives + a "driving behaviour" summary (simple, glanceable, not a spreadsheet).
7. **Notifications** — list with swipe-to-delete.
8. **Settings / subscription** — account, vehicle, service package, geofence.

## Interaction model (important — commands are async)
- Remote commands are **fire → poll → confirm**: a command returns "accepted", then the car
  executes a few seconds later. Design a calm, confident pending state (progress ring on the
  button, haptic on success), never a modal spinner that blocks the app.
- The car **sleeps**: when unreachable a command fails with a "connection unstable, retrying"
  state — design a graceful retry, not a hard error. Status reads can be **stale**; a pull-to-
  refresh "wakes" the car for live data.
- The engine has a **2-start safety cap** (TCU-enforced) and an auto-off timer — surface the
  remaining starts / timer honestly; offer **extend** instead of a disabled button.

## Gestures (best-practice)
- Pull-to-refresh = wake + refresh. Swipe-to-delete notifications. Long-press (with haptic) to
  arm destructive/physical actions (unlock, engine). Swipe between car tabs if multi-vehicle.
  Edge-swipe back. Large hit targets, thumb-zone layout. Subtle spring animations, no jank.

## Siri Shortcuts / App Intents (design for voice + Home Screen)
Design the shortcut surface and the in-app "Add to Siri" affordances for these intents, each
with a spoken confirmation and a compact result snippet:
- "Lock my car" / "Unlock my car"
- "Start my car" (optionally with AC level: "Start my car and cool it down")
- "Where's my car?" (returns location / opens map)
- "Is my car locked?" / "Car status"
Include Lock Screen / Control Center widget and Home Screen quick actions for lock, unlock, start.

## Deliverables
- A cohesive visual language (color, type scale, spacing, iconography, motion), light + dark.
- The home screen + remote-engine flow (with AC + countdown + extend + pending/success/retry
  states) in highest fidelity; the rest as clean frames.
- A short rationale for the interaction choices (gesture map, async-command pattern, Siri flows).

Keep it tasteful and quiet. The best version of this app looks like it does almost nothing — and
makes controlling a car feel instant.
