# 007 — build onboarding and sign-in flow

- **Status:** done
- **Mode:** HITL
- **Estimate:** 1d
- **Depends on:** 003, 004
- **Blocks:** none

## Goal

First launch walks through the 8 onboarding steps (welcome, region, sign in, device heads-up, SMS code, car found, car look, quick setup) with a mock auth service, including every sign-in error state. Matches the `Onb-*` boards and [Signin-errors.dc.html](../../../apps/mobile/design/boards/Signin-errors.dc.html).

## Acceptance criteria

- [x] Welcome has 3 swipeable slides with dots and Skip.
- [x] Region defaults from device locale; Vietnam pre-selected.
- [x] Sign in uses phone number (+84) and password; errors show inline.
- [x] Device heads-up appears before the SMS is sent.
- [x] SMS code supports iOS one-time-code autofill; wrong and expired code states work.
- [x] Car look: swipe carousel for body shape, slider for style, scrub rail for paint; choice persists.
- [x] Quick setup toggles request Face ID and Siri only when switched on (no notifications toggle in v1 — see HANDOFF › Out of scope).
- [x] Each step matches its screenshot.

## Test plan

### Layer 1 — Pure logic (TDD)

- [x] Onboarding step machine — forward, back, skip, error recovery.
- [x] Phone number normalisation for VN.

### Layer 2 — Manual smoke (glue/IO)

- [x] Full flow on Simulator with mock auth; error paths forced.

### Layer 3 — Visual review

- [x] Screenshots of every step and error state.

## Design notes

- **New ADR needed?** yes if real auth is wired here — session storage in SecureStore and the RN cookie transport.

## Out of scope

- Real Honda login (follow-up task once the transport ADR lands).

## Definition of Done

See [TEMPLATE.md](../TEMPLATE.md#definition-of-done).

## Notes

- Done 2026-11-01. Expo Router added; onboarding under `/onboarding/*`, Home is a placeholder for 005.
- Mock auth magic inputs are listed in `apps/mobile/CLAUDE.md`.
- SMS code: transparent full-size `oneTimeCode` input over the boxes so iOS offers "From Messages"; a 6-digit insert verifies at once. The real SMS suggestion bar needs a device (the simulator gets no SMS).
- Wrong code: red boxes + shake + warning haptic, then boxes clear (board note), message stays until typing.
- Quick setup defaults are off (Face ID off by default per the grill); the Alerts toggle is dropped (no push in v1). Face ID turns on only after a successful check.
- Keyboard on: sign-in note scrolls with the form, Sign in stays pinned, "No account?" hides.
- Not verified on screen: Vietnamese copy (strings exist, no language switch until 008), Reduce Motion, VoiceOver pass.
- Visual review: [apps/mobile/docs/review/](../../../apps/mobile/docs/review/) (`t007-*`).
