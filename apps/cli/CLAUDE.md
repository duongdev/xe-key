# @honda/cli

## Purpose
Interactive CLI over `@honda/core`. Login + (later) status/remote commands.

## Layout
- `src/index.ts` — entry, region arg.
- `src/login.ts` — the login + verification-code flow.
- `src/prompt.ts` — visible + hidden (password) prompts, stdlib only.

## Conventions
- IO glue: verified by manual smoke (a real login), not mocks.

## Gotchas
- Runs via `tsx` (`pnpm start`); it imports `@honda/core` through the workspace link.
- Default session file is `honda_session.json` in the cwd (gitignored).
