# 0010 — A repeat sign-up looks the same as a new one

- **Status:** Accepted
- **Date:** 2026-11-02

## Context

[ADR 0009](0009-waitlist-storage.md) gave a survey token only to a new sign-up and `null` to a repeat email. A security review flagged that this lets anyone who passes Turnstile learn whether an email is on the waitlist (account enumeration): the response, and the UI (survey shown or not), differ.

## Decision

`POST /api/signup` always answers `{ ok: true, surveyToken }`. For a repeat email the token is signed for a fresh random id that matches no row, so a survey sent with it updates nothing and still answers 200. The UI shows the same panel, survey and thank-you in both cases. This supersedes the "repeat sign-up gets no token and sees no survey" part of ADR 0009.

## Consequences

- The response and the UI no longer tell a new email from a known one.
- A repeat visitor who answers the survey sees "thank you", but their answers are not stored; the first answers stay. Accepted: the survey is optional and the first sign-up already had the chance.
- Response time can still differ slightly between an insert and a conflict; not worth hiding for a waitlist.

## Alternatives considered

- **Token for the existing row** — a stranger with your email could then write your survey answers.
- **Send the survey link by email** — no enumeration, but needs outbound email, which the waitlist does not have yet.

---

_ADRs are append-only. To change this decision, write a new ADR that supersedes it and update the Status line above — never edit a decided body._
