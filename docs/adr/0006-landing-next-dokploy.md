# 0006 — Landing page: Next.js standalone on Dokploy, car geometry in `@xekey/car`

- **Status:** Accepted; the language decision is superseded by [0008](0008-landing-locale-urls.md)
- **Date:** 2026-11-02

## Context

Task 011 builds the pre-launch waitlist page from the Landing, Landing-mobile and Registered boards. It is one bilingual page (VI default, EN switch) with heavy client interaction (hero loop, hold demo, feature tour, form). Task 012 must store sign-ups in a database, so the page needs a server-side write path, not only static files. The owner runs a Dokploy server and wants hosting and the database there. The hero and the hold demo draw the same car as the app; its geometry lives in `apps/mobile/src/car/geometry.ts` (pure TS, no imports), and the app renders it with `react-native-svg`. The feature tour shows six app screens (Main, Engine, Find, Status, Trips, Notifications); the app has no web target.

## Decision

- **Framework:** Next.js (App Router) in `apps/landing` (`@xekey/landing`), `output: 'standalone'`. Pages are static-rendered at build; the Node server only serves them now and gets one route handler for sign-ups in 012.
- **Hosting:** one container on the owner's Dokploy, built by Dokploy from git with a multi-stage Dockerfile in `apps/landing` that uses `turbo prune @xekey/landing --docker`.
- **Database:** Postgres as a Dokploy service. The DB client, schema and spam checks are decided in 012. In 011 the form calls a stub `submitSignup(data)`; 012 replaces only its body.
- **Car illustration:** `geometry.ts`, `geometry.test.ts` and `paints.ts` move to a new pure package `packages/car` (`@xekey/car`). The old mobile files become one-line re-exports, so app imports do not change. Each side keeps its own thin renderer: `react-native-svg` in the app, DOM `<svg>` in the landing page.
- **Feature tour:** static screenshots of the six app screens (2x WebP) in a phone frame. Refresh by hand when the app UI changes.
- **Styling:** plain CSS ported from the boards — one global file with tokens as CSS variables, plus CSS Modules per section.
- **Language:** client-side toggle on one page; default VI, choice kept in `localStorage`, `<html lang>` follows it. Copy is the boards' `C` dictionary as is.
- **Icons and font:** `@phosphor-icons/react`; Be Vietnam Pro self-hosted through `next/font/google`.

## Consequences

- One service to deploy; 012 adds a route handler without a new service, CORS or proxy.
- Not a pure static export: the page needs a running Node container. Accepted for the single write path.
- One geometry source for app and web. `@xekey/car` must stay free of RN and DOM imports.
- Tour screenshots drift when the app UI changes; that is a manual refresh.
- No `/en` URL; an English link cannot be shared until a route is added.
- The mobile session must know about the moved files to avoid merge conflicts.

## Alternatives considered

- **Next.js static export + separate API** — two services and cross-origin calls for one insert.
- **Astro + React islands** — smallest JS, but a new tool for a page that is mostly client islands.
- **Vite + React SPA** — no prerendered HTML for first paint and link previews.
- **Supabase / Cloudflare Pages / Vercel** — owner prefers self-hosting on Dokploy.
- **Nixpacks/Railpack build on Dokploy** — weaker pnpm-workspace support than an explicit Dockerfile.
- **Import geometry from the mobile app path, or copy it** — app-to-app coupling, or drift.
- **Live app screens via `react-native-web`** — large web-compat effort (Reanimated, maps, Expo modules) for six images.
- **Tailwind** — a rewrite of board CSS that already exists.
- **Prerendered `/` and `/en` routes** — no current need to share an English link.

---

_ADRs are append-only. To change this decision, write a new ADR that supersedes it and update the Status line above — never edit a decided body._
