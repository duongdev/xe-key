# 009 — build toasts, banners and motion polish

- **Status:** done
- **Mode:** HITL
- **Estimate:** 0.5d
- **Depends on:** 005
- **Blocks:** none

## Goal

A toast and banner system and the eight signature animations match [Toasts.dc.html](../../../apps/mobile/design/boards/Toasts.dc.html) and [Motion.dc.html](../../../apps/mobile/design/boards/Motion.dc.html).

## Acceptance criteria

- [x] Toast: top, under the Dynamic Island, 3 s (5 s with action), swipe up, never stacks, announced to VoiceOver.
- [x] Banners stay until the condition clears (offline, window open, car asleep).
- [x] Launch, lock confirmed, hold to arm, engine running, car answers, toast, car asleep, live data arrive animations implemented with Settle/Pop.
- [x] Reduce Motion disables all of them except the hold fill.

## Test plan

### Layer 1 — Pure logic (TDD)

- [x] Toast queue — replace not stack, timing with and without action.

### Layer 2 — Manual smoke (glue/IO)

n/a.

### Layer 3 — Visual review

- [x] Screen recordings of each animation; Reduce Motion on and off.

## Out of scope

- Siri, widgets and Control Center ([Siri.dc.html](../../../apps/mobile/design/boards/Siri.dc.html)) — separate native-extension task.

## Definition of Done

See [TEMPLATE.md](../TEMPLATE.md#definition-of-done).

## Notes

- Done 2026-11-02.
- Toasts: success/info/warn/error/undo kinds; drop from under the island with a 4 pt overshoot (Settle 400 ms); 3 s / 5 s with action; swipe up; a new toast replaces the old one (the replaced toast's dismiss side effect still runs, so an Undo delete is committed); VoiceOver announce. Command results moved from screen status lines to toasts; Retry only for lock/stop/find.
- Banners: offline (top), window open → Status, car asleep (no report for 30 min) → Wake; orange car banners sit under the location card (owner request).
- Motion: Launch (tile settle + dot drop, <700 ms, over the first screen), Doors busy ring + shackle pop, Climate ring sweep 1.2 s then drain, snowflake turn every 8 s, digits rise, Home car settles in from the left on each report, values rise staggered 40 ms, skeleton shimmer, Climate retry ring (from 006).
- Hold to arm: unchanged from 005 (no extra flash at full).
- Verified on simulator: launch (video frames `t009-1-launch-frames.png`), toasts, banners, exhaust puffs (`t009-5-exhaust-frames.png`), Reduce Motion (set via `defaults write com.apple.Accessibility ReduceMotionEnabled`; Reanimated reads it once at app start, so restart the app after changing it — puffs were hidden while it was on). Not verified: swipe-up dismiss (toast timed out before the swipe landed).
- Countdowns use `Digits` (fixed cell per digit): Be Vietnam Pro ignores `tabular-nums` on iOS, so the timer width drifted.
- Exhaust puffs are animated Views over the car SVG (sized from the car's width), not SVG animated props. In Expo Go the launch follows Expo's own light loading screen; a dev build shows the dark native splash first.
- Visual review: [apps/mobile/docs/review/](../../../apps/mobile/docs/review/) (`t009-*`).
