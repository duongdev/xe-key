# 011 — build the landing page

- **Status:** ready
- **Mode:** HITL
- **Estimate:** 1d
- **Depends on:** 004
- **Blocks:** 012

## Goal

A static, bilingual (VI default, EN switch) landing page matches [Landing](../../apps/mobile/design/boards/Landing.dc.html), [Landing-mobile](../../apps/mobile/design/boards/Landing-mobile.dc.html) and [Registered](../../apps/mobile/design/boards/Registered.dc.html). The waitlist form works end to end in the UI, with a stub submit (storage comes in 012). Spec: [HANDOFF › Website](../../apps/mobile/design/HANDOFF.md#website-landing-page).

## Why now

A waitlist measures demand (iPhone vs Android, car models, wanted features) before launch.

## Acceptance criteria

- [ ] ADR picks the web framework and hosting (static output; how the car illustration is shared with the app).
- [ ] All sections in order, desktop and mobile, match the screenshots.
- [ ] VI/EN switch changes all copy; copy matches the board's `C` dictionary.
- [ ] Hero loops locked → unlocked → engine on every 3.4 s; the state pills stop the loop.
- [ ] Hold demo: 600 ms hold, early release cancels, the car changes only after the fake confirm.
- [ ] Feature tour: tabs, arrows and swipe switch the screen; autoplay every 6 s stops on any input.
- [ ] Form: platform pick, email check with inline error, hero success shows the Registered panel (survey, thanks, copy link); the end form shows the one-line success.
- [ ] Reduce Motion: no hero loop, no tour autoplay, no floating chips.
- [ ] No launch date or platform order in the copy. Footer disclaimer present, no Honda logo.

## Test plan

### Layer 1 — Pure logic (TDD)

- [ ] Email check — valid and invalid inputs.
- [ ] Carousel index — next/previous wrap, swipe threshold.

### Layer 2 — Manual smoke (glue/IO)

- [ ] Submit runs the stub and shows the success panel with the typed email and platform.

### Layer 3 — Visual review

- [ ] Screenshots at 1440 and 390 in VI and EN, before and after sign-up.
- [ ] Hero states, tour slides and the hold demo checked in a browser.

## Design notes

- **Contracts changed:** none in `@xekey/core`.
- **New modules:** a web app in the monorepo; the car illustration geometry stays one pure module shared with the app.
- **New ADR needed?** yes — "Web framework and hosting for the landing page".

## Out of scope

- Storing sign-ups and survey answers (012).
- Domain, privacy page text, analytics.
- "Coming soon" tags on features (owner decides at launch).
