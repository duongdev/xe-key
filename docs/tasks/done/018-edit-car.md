# 018 — build the edit car screen

- **Status:** done
- **Mode:** HITL
- **Estimate:** 0.5d
- **Depends on:** 007, 014
- **Blocks:** none

## Goal

After onboarding, the user can change the car's name, body shape, style and paint from one "Your car" screen. Changes save at once and show everywhere (Home, widgets, Siri). Plate, model and VIN show read-only from Honda. Matches [Car-edit](../../apps/mobile/design/boards/Car-edit.dc.html) and [Car-edit-flow](../../apps/mobile/design/boards/Car-edit-flow.dc.html); spec row in [HANDOFF › Screen map](../../apps/mobile/design/HANDOFF.md#screen-map).

## Why now

Onboarding is the only place to set the car look today. Users who picked the wrong body or paint, or want a nickname, have no way back.

## Acceptance criteria

- [x] Entry: tap the car name on Home, and Settings → Vehicle row; both open "Your car".
- [x] Body by swipe, style and paint by scrub, reusing the onboarding controls; the preview changes live.
- [x] Name field: max 24 characters, counter; empty falls back to Honda's model name.
- [x] Autosave on finger lift or name blur; one "Saved" toast, a new change replaces it; no Save button.
- [x] Plate, model + year, VIN (last 4) in a "From Honda · read-only" card.
- [x] "Reset to Honda's details" restores body, style, paint and name; toast says so.
- [x] Photo style with no `/car/image`: drawing plus "No photo from Honda".
- [x] Home, widgets and Siri use the new name and look at once. (Home checked; widgets and Siri are not built yet, they read the same prefs.)

## Test plan

### Layer 1 — Pure logic (TDD)

- [x] Name rule — trim, 24-char limit, empty falls back to the model name.
- [x] Reset — returns the Honda-derived defaults for body, style, paint, name.

### Layer 2 — Manual smoke (glue/IO)

- [x] Change each field, kill and reopen the app: values persist.
- [x] Rename, then check Home header and a Siri/widget snapshot use the new name. (Home only; no widget or Siri yet.)

### Layer 3 — Visual review

- [x] Screenshot vs `screenshots/Car-edit.png`; saved toast; Photo with and without a Honda photo.

## Design notes

- **Contracts changed:** car look prefs gain a user `name` (non-secret, AsyncStorage with the other look prefs).
- **New modules:** none beyond the screen; reuse the onboarding body carousel and segmented sliders.
- **New ADR needed?** no.

## Out of scope

- Multi-car (the Home car name becomes a switcher later).
- Editing plate, model or VIN.
