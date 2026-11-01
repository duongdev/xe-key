# 011 — build the landing page

- **Status:** done
- **Mode:** HITL
- **Estimate:** 1d
- **Depends on:** 004
- **Blocks:** 012

## Goal

A static, bilingual (VI default, EN switch) landing page matches [Landing](../../../apps/mobile/design/boards/Landing.dc.html), [Landing-mobile](../../../apps/mobile/design/boards/Landing-mobile.dc.html) and [Registered](../../../apps/mobile/design/boards/Registered.dc.html). The waitlist form works end to end in the UI, with a stub submit (storage comes in 012). Spec: [HANDOFF › Website](../../../apps/mobile/design/HANDOFF.md#website-landing-page).

## Why now

A waitlist measures demand (iPhone vs Android, car models, wanted features) before launch.

## Acceptance criteria

- [x] ADR picks the web framework and hosting (static-rendered pages; how the car illustration is shared with the app) — [0006](../../adr/0006-landing-next-dokploy.md).
- [x] All sections in order, desktop and mobile, match the screenshots.
- [x] VI/EN switch changes all copy; copy matches the board's `C` dictionary.
- [x] Hero loops locked → unlocked → engine on every 3.4 s; the state pills stop the loop.
- [x] Hold demo: 600 ms hold, early release cancels, the car changes only after the fake confirm.
- [x] Feature tour: tabs, arrows and swipe switch the screen; autoplay every 6 s stops on any input.
- [x] Form: platform pick, email check with inline error, hero success shows the Registered panel (survey, thanks, copy link); the end form shows the one-line success.
- [x] Reduce Motion: no hero loop, no tour autoplay, no floating chips.
- [x] No launch date or platform order in the copy. Footer disclaimer present, no Honda logo.
- [x] Sign-up runs an invisible Cloudflare Turnstile check and sends the token (added by owner; server check in 012).
- [x] Security headers and CSP set in `next.config.ts`.
- [x] English at `/en` with hreflang, self canonicals and the VI/EN switch as links ([ADR 0008](../../adr/0008-landing-locale-urls.md); added by owner).
- [x] SEO P0/P1 from [seo.md](../../../apps/landing/docs/seo.md): metadata per language, share cards, icons, robots, sitemap, JSON-LD, all FAQ and tour text in the HTML, `/privacy` + `/en/privacy`, mailto contact, 404.
- [x] Owner-approved copy changes: SEO title and description; four rewordings that remove platform hints.

## Test plan

### Layer 1 — Pure logic (TDD)

- [x] Email check — valid and invalid inputs.
- [x] Carousel index — next/previous wrap, swipe threshold.

### Layer 2 — Manual smoke (glue/IO)

- [x] Submit runs the stub and shows the success panel with the typed email and platform.
- [x] Turnstile always-fail key: inline error, email kept, button enabled again.
- [x] Docker image builds and serves the page with the security headers.

### Layer 3 — Visual review

- [x] Screenshots at 1440 and 390 in VI and EN, before and after sign-up.
- [x] Hero states, tour slides and the hold demo checked in a browser.

Screenshots: [apps/landing/docs/review/](../../../apps/landing/docs/review/). Interaction checks ran as a Playwright script (31 checks, all pass).

## Design notes

- **Contracts changed:** none in `@xekey/core`.
- **New modules:** `apps/landing` (Next.js); `packages/car` (`@xekey/car`), the car geometry moved out of `apps/mobile/src/car`.
- **New ADR needed?** yes — "Web framework and hosting for the landing page".

## Out of scope

- Storing sign-ups and survey answers (012).
- Domain, analytics, lawyer review of the privacy text.
- "Coming soon" tags on features (owner decides at launch).
