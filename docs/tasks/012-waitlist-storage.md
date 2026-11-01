# 012 — store waitlist sign-ups and survey answers

- **Status:** draft
- **Mode:** HITL
- **Estimate:** 0.5d
- **Depends on:** 011
- **Blocks:** none

## Goal

The landing page form saves each sign-up (email, platform, language, created time) and the optional survey answers (car model, wanted features) to a store the owner can export. Spec: [HANDOFF › Website](../../apps/mobile/design/HANDOFF.md#website-landing-page).

## Why now

The waitlist exists to measure demand. Without storage the page collects nothing.

## Acceptance criteria

- [ ] ADR picks the store (hosted form/list service vs own endpoint) and notes privacy and spam handling.
- [ ] Same email signs up once; a repeat shows success without a duplicate row.
- [ ] Survey answers attach to the sign-up; Skip stores nothing extra.
- [ ] Server errors show an inline error; the typed email stays in the field.
- [ ] Owner can export sign-ups with platform and survey counts.
- [ ] No secrets in the client bundle.

## Test plan

### Layer 1 — Pure logic (TDD)

- [ ] Payload builder — maps form and survey state to the stored record.

### Layer 2 — Manual smoke (glue/IO)

- [ ] Sign up twice with the same email: one record.
- [ ] Send the survey: the record has car and features.
- [ ] Store down: inline error, nothing lost on screen.

### Layer 3 — Visual review

- [ ] Error state on the form at 1440 and 390.

## Design notes

- **Contracts changed:** none.
- **New modules:** waitlist client (submit, survey).
- **New ADR needed?** yes — "Waitlist storage".

## Out of scope

- Sending launch emails.
- Referral tracking for the copy-link button.
