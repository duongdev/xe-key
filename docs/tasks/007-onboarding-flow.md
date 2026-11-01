# 007 — build onboarding and sign-in flow

- **Status:** ready
- **Mode:** HITL
- **Estimate:** 1d
- **Depends on:** 003, 004
- **Blocks:** none

## Goal

First launch walks through the 8 onboarding steps (welcome, region, sign in, device heads-up, SMS code, car found, car look, quick setup) with a mock auth service, including every sign-in error state. Matches the `Onb-*` boards and [Signin-errors.dc.html](../../apps/mobile/design/boards/Signin-errors.dc.html).

## Acceptance criteria

- [ ] Welcome has 3 swipeable slides with dots and Skip.
- [ ] Region defaults from device locale; Vietnam pre-selected.
- [ ] Sign in uses phone number (+84) and password; errors show inline.
- [ ] Device heads-up appears before the SMS is sent.
- [ ] SMS code supports iOS one-time-code autofill; wrong and expired code states work.
- [ ] Car look: swipe carousel for body shape, slider for style, scrub rail for paint; choice persists.
- [ ] Quick setup toggles request Face ID and Siri only when switched on (no notifications toggle in v1 — see HANDOFF › Out of scope).
- [ ] Each step matches its screenshot.

## Test plan

### Layer 1 — Pure logic (TDD)

- [ ] Onboarding step machine — forward, back, skip, error recovery.
- [ ] Phone number normalisation for VN.

### Layer 2 — Manual smoke (glue/IO)

- [ ] Full flow on Simulator with mock auth; error paths forced.

### Layer 3 — Visual review

- [ ] Screenshots of every step and error state.

## Design notes

- **New ADR needed?** yes if real auth is wired here — session storage in SecureStore and the RN cookie transport.

## Out of scope

- Real Honda login (follow-up task once the transport ADR lands).

## Definition of Done

See [TEMPLATE.md](TEMPLATE.md#definition-of-done).
