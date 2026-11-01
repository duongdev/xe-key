# @honda/mobile

## Purpose
Expo (React Native) client for Honda CONNECT One. Not yet initialized.

## Layout
Run `pnpm create expo apps/mobile`, then add `@honda/core`.

## Conventions
- Design source of truth: [design/HANDOFF.md](design/HANDOFF.md) (tokens, screens, interactions, car illustration).
- All networking/auth lives in `@honda/core` — screens call it, never raw `fetch`.
- UX bar: four states (loading/empty/error/populated), instant feedback, no jiggle.
- Secrets (session tokens) go in Expo SecureStore, never AsyncStorage or source.

## Gotchas
- RN has no cookie jar like Node; `@honda/core`'s `HondaHttp` is Node-oriented — the
  mobile app will need an RN-compatible transport (or expo/fetch + manual cookies).
  Capture that decision as an ADR when you start.
