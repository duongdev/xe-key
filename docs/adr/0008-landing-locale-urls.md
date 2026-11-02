# 0008 — Landing page: one URL per language (`/` and `/en`)

- **Status:** Accepted
- **Date:** 2026-11-02

## Context

[ADR 0006](0006-landing-next-dokploy.md) chose a client-side VI/EN toggle on one URL. Google indexes one language per URL and does not run a localStorage toggle, so the English copy can never be found or shared as English. The SEO research ([apps/landing/docs/seo.md](../../apps/landing/docs/seo.md)) and the owner want English indexable.

## Decision

- Vietnamese stays at `/`; English moves to `/en`. Both are prerendered. The privacy page follows the same rule: `/privacy` and `/en/privacy`.
- Two root layouts in route groups, `app/(vi)` and `app/(en)`, so each renders its own `<html lang>`. A shared `Document` component holds the font and global CSS. `app/global-not-found.tsx` (behind `experimental.globalNotFound`) serves the 404, because no single root layout exists.
- Each page has a self canonical and reciprocal hreflang: `vi` → `/`, `en` → `/en`, `x-default` → `/`. The site origin comes from `SITE_URL` at build; a production build without it fails.
- The VI/EN switch is a plain link to the other URL. No localStorage, and no redirect by `Accept-Language`.
- The sign-up `language` comes from the route, not from client state.

## Consequences

- Both languages can rank and get their own share card (og:locale `vi_VN` / `en_US`).
- Switching language is a full page load (different root layout), so typed form input is lost on switch. Accepted: the switch is rare.
- The page no longer writes to browser storage.
- `global-not-found` is experimental in Next 16; recheck on upgrade.

## Alternatives considered

- **`app/[lang]` dynamic root segment with `generateStaticParams`** — gives `/vi` and `/en`, not a bare `/` for the default language, unless a middleware rewrite is added.
- **`?lang=en`** — Google advises against parameters for locale; harder to keep canonicals clean.
- **Keep the toggle** — English stays invisible to search.

---

_ADRs are append-only. To change this decision, write a new ADR that supersedes it and update the Status line above — never edit a decided body._
