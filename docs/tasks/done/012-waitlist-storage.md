# 012 — store waitlist sign-ups and survey answers

- **Status:** done
- **Mode:** HITL
- **Estimate:** 0.5d
- **Depends on:** 011
- **Blocks:** none

## Goal

The landing page form saves each sign-up (email, platform, language, created time) and the optional survey answers (car model, wanted features) to a store the owner can export. Spec: [HANDOFF › Website](../../../apps/mobile/design/HANDOFF.md#website-landing-page).

## Why now

The waitlist exists to measure demand. Without storage the page collects nothing.

## Acceptance criteria

- [x] ADR picks the store (hosted form/list service vs own endpoint) and notes privacy and spam handling — [0009](../../adr/0009-waitlist-storage.md).
- [x] Same email signs up once; a repeat shows success without a duplicate row.
- [x] Survey answers attach to the sign-up; Skip stores nothing extra.
- [x] Server errors show an inline error; the typed email stays in the field.
- [x] Owner can export sign-ups with platform and survey counts.
- [x] No secrets in the client bundle.
- [x] The route verifies the Turnstile token with Cloudflare siteverify (secret from env, check `success`, `action` = `signup` and `hostname`) before storing; a failed check stores nothing.
- [x] Survey answers are accepted only for a sign-up made in the same session (e.g. a signed id returned by the sign-up route), so a stranger cannot write answers for any email.
- [x] Rate limit per IP on both routes.

## Test plan

### Layer 1 — Pure logic (TDD)

- [x] Payload builder — maps form and survey state to the stored record.

### Layer 2 — Manual smoke (glue/IO)

- [x] Sign up twice with the same email: one record.
- [x] Send the survey: the record has car and features.
- [x] Store down: inline error, nothing lost on screen.

### Layer 3 — Visual review

- [x] Error state on the form at 1440 and 390.

Evidence: unit tests in `apps/landing/src/server/*.test.ts`; curl smoke and the Playwright suite (39 checks) against the Docker image with a real Postgres, including Turnstile pass/fail keys, DB down at start and recovery without restart, 200 MB bodies rejected without buffering, and logs without emails.

## Design notes

- **Contracts changed:** none.
- **New modules:** `apps/landing/src/app/api/*` routes, `src/db/` (Drizzle schema, lazy migrations), `src/server/` (validation, survey token, rate limit, Turnstile verify).
- **New ADR needed?** yes — [0009](../../adr/0009-waitlist-storage.md).

## Out of scope

- Sending launch emails.
- Referral tracking for the copy-link button.
