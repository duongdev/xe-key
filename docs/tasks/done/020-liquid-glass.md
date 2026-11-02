# 020 — liquid glass on floating controls

- **Status:** done
- **Mode:** AFK
- **Estimate:** 1d
- **Depends on:** 017
- **Blocks:** none

## Goal

Floating controls use one glass surface (native Liquid Glass on iOS 26+, a solid raised fallback before that), per HANDOFF.md › Liquid Glass (iOS 26+). Content and primary actions stay solid. The Alerts filter gets a moving lens, a Warnings-only badge, drag scrub and an empty state per filter.

## Why now

The design is ready, and iOS 26+ users see the app next to system apps that already use Liquid Glass.

## Acceptance criteria

- [x] `Glass` fallback: dark s2 + hairline + shadow; light s1 + soft shadow. iOS 26+ uses `GlassView` regular, no tint.
- [x] Back button and header actions are 44 pt glass circles on every page (PageHeader, Climate, Doors, onboarding steps, Your car style).
- [x] Home settings circle is glass; the Status/Trips/Alerts row stays a plain solid row (user preferred it).
- [x] Find: glass back and a glass recenter button (frames you and the car); icons fg.
- [x] Alerts filter: 48 pt capsule, 30 pt above the home indicator, lens slides to the selected segment, unselected fg2 500 / selected fg 600.
- [x] Badge only on Warnings (unread diagnosis), "9+" over 9.
- [x] Drag across the filter moves the lens; lifting picks; one selection haptic per change.
- [x] Mark-all-read stays in the header; fg2 and disabled when nothing is unread.
- [x] Empty state per filter (All / Warnings / Commands); the filter hides when there are no alerts at all.
- [x] Toast glass is not interactive.
- [x] Glass press on solid buttons (Button, HoldButton, Home Start, Find Update/Go, Climate Cancel/Stop/Extend): lift 1.03 + shadow, rim and a light under the finger while down; drawn by us, same before iOS 26.
- [x] Segmented sliders (AC level, car style): iOS 26+ use the system segmented control, which brings the bubble drag (HANDOFF › Bubble drag) itself; selection is system grey, not acc (SwiftUI ignores `tint` there). Before 26 the solid knob scales 1.08 while held.

- [x] Haptics follow HANDOFF › Haptics: shared components own them, screens only with a `haptics:` comment (guard test); solid buttons tick on touch down; glass and native controls are silent.
- [x] Hold to arm is 1.5 s with selection ticks at start, 0.5 s and 1.0 s, medium when armed.

## Test plan

### Layer 1 — Pure logic (TDD)

- [x] `badgeText` — 0 hides, 1–9 shows the number, over 9 shows "9+".

### Layer 2 — Manual smoke (glue/IO)

n/a.

### Layer 3 — Visual review

- [x] iOS 27 simulator: Alerts (filters, scrub, Commands empty), Home, Find, Settings.
- [x] iOS 18.5 simulator (fallback).

## Design notes

- **Contracts changed:** `GlassTab` badge now only set by the caller for Warnings; `PageHeader` back is glass; new `GlassButton` (44 pt glass circle).
- **New modules:** none.
- **New ADR needed?** no.
- **Native controls (iOS 26+):** `GlassButton` and the filter are SwiftUI via `@expo/ui` (added), not `GlassView` + `Pressable`: the user found the RN press did not feel native. This replaces the research report's "expo-glass-effect only" advice for controls; `GlassView` stays for plain surfaces (toast). The native segmented control can't hold a coloured badge, so Warnings shows its count as "Warnings (2)" there. Buttons use SF Symbols. The native press grows past the button frame, so the Host has 16 pt of transparent room around it.

## Out of scope

- Own Reduce Transparency branch: native glass handles it (research report).
- Fade under the filter (needs a gradient view).
- Badge pop and toast motion changes.

## Definition of Done

- [x] Layer 1 tests written and green
- [x] Layer 3 screenshots captured (simulator, not committed)
- [x] Lint + format clean
- [x] Typecheck clean
- [x] Tests green
- [x] App boots cleanly and the changed surface works end-to-end
- [x] Per-area docs updated for any modified module
- [x] No commented-out code, no debug-log debris, no AI attribution
- [x] Task closed: status → done, file moved to `docs/tasks/done/`, t020 in commit
