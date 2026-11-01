# honda-connect

Unofficial client for the Honda CONNECT One (APAC) API. pnpm monorepo: a shared
TypeScript API client, a CLI, and (soon) an Expo app.

## Working principles

- **Convention before code** — if a rule is missing, write it in `docs/conventions/` first.
- **Atomic delivery** — one task = one file in `docs/tasks/`, sized to a single session;
  closure (status → done, `git mv` to `done/`, `tNNN` in branch+commit) rides the same commit.
- **Surgical changes** — every changed line traces to the task.
- **Test-first for pure logic**; glue/IO gets manual smoke, UI gets visual review.
- **No AI attribution** anywhere. Never auto-commit or auto-push.

## Where to look

| Need | Go to |
|---|---|
| Domain vocabulary | [CONTEXT.md](CONTEXT.md) |
| API client (auth, session, endpoints) | [packages/core](packages/core/CLAUDE.md) |
| CLI (login, commands) | [apps/cli](apps/cli/CLAUDE.md) |
| Expo app | [apps/mobile](apps/mobile/CLAUDE.md) |
| How the API was mapped | [research/FINDINGS.md](research/FINDINGS.md) |
| RE process + sandbox | [research/RESEARCH.md](research/RESEARCH.md) |
| How we work | [docs/conventions/](docs/conventions/) |
| Work spine | [docs/tasks/](docs/tasks/) |
| Decisions | [docs/adr/](docs/adr/) |

## Agent skills

### Issue tracker

Issues tracked as local markdown under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.
(Primary delivery tickets stay in the dustin-stack spine at `docs/tasks/`.)

### Triage labels

Default canonical labels: needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix.
See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — glossary at `CONTEXT.md` + `docs/adr/`. See `docs/agents/domain.md`.

## Toolchain

pnpm · turbo · Biome (lint+format, kebab filenames) · TypeScript · Vitest · husky+commitlint.
`pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build` · `pnpm cli`.
