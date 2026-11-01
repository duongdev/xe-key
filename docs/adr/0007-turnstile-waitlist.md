# 0007 — Cloudflare Turnstile guards the waitlist sign-up

- **Status:** Accepted
- **Date:** 2026-11-02

## Context

The waitlist form is public and writes to our own Postgres ([ADR 0006](0006-landing-next-dokploy.md)). Bots can fill it with fake emails and break the demand numbers. The owner wants a bot check that the visitor does not see.

## Decision

The sign-up runs a Cloudflare Turnstile check on submit (explicit render, `action: signup`, `appearance: interaction-only`). The site key is an invisible-type key, given at build as `NEXT_PUBLIC_TURNSTILE_SITE_KEY`; without it the page uses Cloudflare's always-pass invisible test key. The token goes with the sign-up data. The server route (task 012) verifies it with siteverify and the secret key before it stores anything. The script loads only on submit, not on page load.

## Consequences

- No visible captcha for normal visitors; a failed check shows an inline error and keeps the email.
- The CSP allows `https://challenges.cloudflare.com` for scripts, frames and connections.
- Cloudflare sees the visitor's IP and browser signals at submit time; the privacy page must say so.
- The check means nothing until 012 verifies the token on the server.

## Alternatives considered

- **hCaptcha / reCAPTCHA** — visible challenges more often; reCAPTCHA sends more data to Google.
- **Honeypot field + rate limit only** — free and private, but weak against targeted bots. Rate limiting is still added in 012.
- **`@marsidev/react-turnstile`** — a dependency for about 60 lines of glue.

---

_ADRs are append-only. To change this decision, write a new ADR that supersedes it and update the Status line above — never edit a decided body._
