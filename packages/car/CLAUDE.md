# @xekey/car

## Purpose
Pure car illustration geometry shared by the app and the landing page ([ADR 0006](../../docs/adr/0006-landing-next-dokploy.md)). No renderer.

## Layout
- `src/geometry.ts` — body profiles (720×280 frame), wheel arches, `bodyGeometry`, contrast assist, `viewBoxX` (centers the body in the frame). Export `.`.
- `src/paints.ts` — common Honda paints. Export `./paints`.

## Conventions
- Pure TS, no RN or DOM imports; consumers ship the source (Metro, Next `transpilePackages`).
- Test-first with Vitest.

## Gotchas
- No build step: `exports` point at `.ts` files.
