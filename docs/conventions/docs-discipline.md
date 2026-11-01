# Docs discipline

The project survives on docs that are accurate. The discipline below keeps them from rotting.

## What lives where

| Doc type | Audience | Cadence | Format |
|---|---|---|---|
| Root `CLAUDE.md` | Future-you, AI agents | When architecture changes | Short, link-heavy |
| `CONTEXT.md` | Anyone reading the code | When domain language changes | Glossary — definitions + relationships |
| `docs/conventions/*` | Contributors | Stable | Prose + examples |
| `docs/adr/*` | Anyone reading code | Append-only | ADR template |
| `docs/memories/*` | Future-you | As-discovered | Free-form |
| `docs/guides/*` | Operators and setup | When procedure changes | Step-by-step |
| `docs/tasks/*` | The task's executor | Per task | Task template |
| `<area>/CLAUDE.md` | AI / future-you reading that area | When internals change | 4-section template |

Single app → no per-area `README.md`; the root `CLAUDE.md` + area `CLAUDE.md` files serve the full audience. (Monorepo → per-package `README.md` is fine; see adaptations.)

## Small docs, linked, DRY

Prefer **many short docs, well-linked** over **few long docs**.

- **Cap ~400 lines** per `.md`; longer → split. Long docs are skimmed, not read.
- **Link, don't duplicate.** One canonical home per concept; others link to it.
- **Cross-reference instead of summarize.** Just link; don't re-summarize.
- **Index files point outward** — they list what's available, not what it contains.

A well-organized doc tree feels like a graph: dense links, small nodes. A poorly-organized one feels like an encyclopedia.

## Per-area CLAUDE.md template

Every module area complex enough to document ships a `CLAUDE.md` with this fixed structure:

```markdown
# <area-name>

> One-sentence purpose.

## Purpose
What this area exists to do, why it's separate from its neighbors, what it
owns and what it deliberately doesn't.

## Contract
The public API in shape, not prose. Type signatures + one paragraph each.

## Where this fits
How it relates to neighbors — what depends on it, what it depends on, why the
boundary is drawn here.

## Watch out for
Non-obvious quirks, gotchas, ordering constraints, things that have bitten us.
The "brief a new contributor in 5 minutes" section.
```

The four sections are fixed. Don't add a fifth without an ADR; don't drop one because it feels empty — write "N/A".

## CONTEXT.md as the domain glossary

`CONTEXT.md` at the repo root is the single authority for domain vocabulary. **The rule:** use the term from `CONTEXT.md` in code, tests, commits, and docs — no synonyms. When a new concept emerges with a clear boundary, add it to `CONTEXT.md` *before* writing code for it. Meaning-changing edits → open an ADR; additive new terms → commit directly.

## Architecture Decision Records

Any non-trivial decision gets an ADR: picking a library over an alternative, a constraint overriding the obvious approach, test/build pipeline shape, an explicit "we won't do X".

ADRs are **append-only**. When a decision changes, write a new ADR that supersedes the old one. Update the old ADR's *Status* line to reference the superseder, but never edit its body. The history is the documentation.

## Keeping docs alive

1. **Same-commit doc updates.** Behavior visible to a doc reader changes → the doc updates in that same commit.
2. **The "5-minute briefing" test.** Could someone who's never seen the code orient from this `CLAUDE.md` in 5 minutes? If no, fix it.
3. **Date-stamp staleness.** Footer `_Last revisited: YYYY-MM-DD_`; bump on re-read if still right, fix-then-bump if wrong.
4. **Fresh, not patched.** Rewrite the affected section rather than appending corrections. Docs read as current truth, not sediment. The only place layered amendments belong is ADRs.
5. **Stale-doc bankruptcy is OK.** A doc rotted beyond repair → delete and rewrite. A wrong doc confidently misleads; that's worse than none.

## Anti-patterns

- "I'll write docs at the end of the task." Docs shipped with code stay accurate; later docs are already stale.
- "Too small to update docs." If it changes reader-visible behavior, it isn't.
- "The code is self-documenting." Code documents *what*; CLAUDE.md/ADRs document *why* — different audiences.
- "There's an ADR but I changed the decision in code." The ADR is now a lie — update the code or supersede the ADR.
- Bolting "Note:" on top of "Note:". Stop and rewrite the section.

---

_Docs you don't maintain are a liability. Docs you maintain are a force multiplier._
