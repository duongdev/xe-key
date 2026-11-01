# @xekey/landing

## Purpose
Pre-launch waitlist site for Xe Key. Next.js, prerendered pages served by a standalone Node server on Dokploy ([ADR 0006](../../docs/adr/0006-landing-next-dokploy.md)). Vietnamese at `/`, English at `/en` ([ADR 0008](../../docs/adr/0008-landing-locale-urls.md)). Sign-ups go to Postgres through its own routes ([ADR 0009](../../docs/adr/0009-waitlist-storage.md)). SEO plan and decisions: [docs/seo.md](docs/seo.md).

## Layout
- `src/app/(vi)/` and `src/app/(en)/en/` — one root layout per language (`<html lang>`), home and `privacy/` pages. `document.tsx` is the shared `<html>` shell (Be Vietnam Pro via `next/font`, `globals.css`, `viewport`).
- `src/app/global-not-found.tsx` — the 404 (needed with two root layouts; `experimental.globalNotFound`).
- `src/app/api/` — `signup` (Turnstile check, dedupe, survey token), `survey` (token-gated, first answers win), `admin/export` (Basic auth, CSV or `?summary`).
- `src/db/` — Drizzle `schema.ts` and `client.ts` (`database()` migrates once, lazily); SQL migrations in `drizzle/` (`pnpm --filter @xekey/landing db:generate` after a schema change). `src/instrumentation.ts` tries them at start.
- `src/server/` — server-only: `payload.ts` (validation, CSV, summary), `survey-token.ts`, `rate-limit.ts` (pure, tested); `turnstile.ts` (siteverify), `env.ts`, `http.ts`.
- `src/app/robots.ts`, `sitemap.ts` — both from `SITE_URL`; the sitemap lists each URL with its hreflang pair.
- `src/app/icon.png`, `apple-icon.png`, `favicon.ico`; `public/og-vi.jpg`, `og-en.jpg` (share cards), `logo.png` (JSON-LD), `tour/` (app screenshots for the feature tour). Sources: `apps/mobile/design/web-assets/`.
- `src/copy.ts` — all copy, `vi` and `en`: the board's `C` dictionary plus `meta` (title, description, OG), privacy and 404 text.
- `src/components/` — `home.tsx` (server: JSON-LD + build config around the client page), `landing.tsx` (client page shell, sign-up state, final form), `chrome.tsx` (nav with VI/EN links, footer), `privacy.tsx`; sections: `hero`, `hold-demo`, `tour`, `features`, `car-shapes`, `straight-talk`, `signup-form`, `registered`, `car` (DOM port of the app's `<Car>`). One CSS Module each.
- `src/lib/` — pure and tested: `email.ts`, `carousel.ts`, `locale.ts` (`localePath`, `languageAlternates`), `seo.ts` (server only: `SITE_URL`, `CONTACT_EMAIL`, `pageMetadata`, JSON-LD). `survey-options.ts` (survey choices shared with the server). Glue: `signup.ts` (fetch to the API), `turnstile.ts` (widget), `use-reduced-motion.ts`.
- `docs/review/` — visual review screenshots per task. `docs/seo.md` — SEO research and plan.
- `Dockerfile` — build from the repo root (see Conventions for the build args).

## Conventions
- Design source of truth: `apps/mobile/design/boards/Landing*.dc.html`, `Registered.dc.html` and [HANDOFF › Website](../mobile/design/HANDOFF.md#website-landing-page). Desktop = board at 1440, mobile = board at 390; the mobile layout starts below 900 px.
- Copy changes go in `copy.ts` for both languages, and visible copy changes need the owner's OK. No launch date, no platform order, no Honda logo.
- Every page gets its metadata from `pageMetadata(lang, path)`: self canonical, hreflang `vi`/`en`/`x-default`, OG with the language's share card.
- Links between languages are plain `<a href>` from `localePath`. Never redirect by `Accept-Language`; never store the language in the browser.
- Car geometry comes from `@xekey/car`; never copy paths into this app.
- Every loop or float stops under Reduce Motion (CSS `prefers-reduced-motion` + `useReducedMotion`). The hold fill stays.
- Sign-up runs a Turnstile check first and sends the token with the data. The page never holds a secret.
- Env: see `.env.example`. Build args (Docker `--build-arg`, or env for `pnpm build`): `SITE_URL` (origin, e.g. `https://xekey.app`) and `CONTACT_EMAIL` are required — a production build fails without them. `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is optional; unset = Cloudflare's always-pass invisible test key. Runtime secrets on Dokploy: `DATABASE_URL`, `TURNSTILE_SECRET_KEY`, `SIGNING_SECRET`, `ADMIN_TOKEN` (unset disables the export). Dev falls back to Cloudflare's test secret and a dev signing secret.
- Export from a phone: open `/api/admin/export` (CSV) or `/api/admin/export?summary`; the browser asks for a password = `ADMIN_TOKEN` (any user name).
- Deleting a person's data on request: `delete from signups where email = lower(trim('…'));` on the Postgres service.

## Gotchas
- All DB access goes through `database()`, which waits for the migrations. A throw in `instrumentation.ts` makes every page 500, so it only logs.
- Rate limits are in memory per container (5 sign-ups, 10 surveys, 20 exports per IP per 10 min, keyed by `X-Real-IP` from Traefik); they reset on restart.
- `SITE_URL` and `CONTACT_EMAIL` are inlined at build (`next.config.ts` › `env`), so dynamic routes see the same values as the prerendered pages.
- `seo.ts` reads env at module load and throws in production: import it only from server files (`app/*`, `home.tsx`, `privacy.tsx`), never from a `"use client"` tree. Client code uses `locale.ts`.
- Page `openGraph` replaces the parent's, so file-based `opengraph-image` does not reach every route; the share cards are set explicitly in `pageMetadata`.
- Switching language is a full page load (different root layout).
- Security headers and the CSP live in `next.config.ts`. A new third-party script or frame needs a CSP entry. `'unsafe-inline'` scripts are needed: prerendered pages cannot carry a nonce.
- The standalone output does not include `public/` or `.next/static`; the Dockerfile copies them. Turbo passes the build args through (`turbo.json` › `@xekey/landing#build`).
- Next allows one `next dev` per app folder; stop the running one before starting another.
- The browser turns an IDN email (`a@ví.vn`) into punycode before the page sees it.
