# Development lifecycle

How a piece of work moves from idea to merged code. The discipline is small but every step exists for a reason.

## The loop

```
CAPTURE  →  SPEC  →  BUILD  →  PROVE  →  SHIP
 idea →     task     TDD       all       merged,
 memory     file     loop      gates     docs
            + plan    + refac   pass      alive
```

## 1. Capture

An idea, a risk, a question, a "huh, that's weird." Write it down before you forget.

- A risk → append to `docs/memories/risks.md`.
- A learning, surprise, or insight → `docs/memories/learnings.md`.
- A future capability idea → `docs/memories/ideas.md`.
- A discrete unit of work → new file in `docs/tasks/` using the TEMPLATE.
- A non-trivial design decision → new ADR in `docs/adr/`.

## 2. Spec

Before writing code, the task file must answer:

- **What problem are we solving?** One paragraph, plain language.
- **Acceptance criteria.** Testable bullets.
- **Test plan.** Which testing layers apply and the explicit cases. See [tdd.md](tdd.md).
- **Design notes.** Contracts changed, modules touched, deps added. Sketch the diff before writing it.
- **Out of scope.** What this task explicitly is *not* doing.
- **Definition of Done.** A checklist mirroring the project's quality bar.

A task must be sized to **fit in one session without compaction** — roughly half a day of focused work. **Test of "too big":** if you can't list every file you'll touch and every test you'll write in under 60 seconds, split it.

**Why the strict cap:** compaction loses fidelity — design intent, early test failures that shaped the code, and already-incorporated feedback all get summarized away. Splitting is cheaper than redoing.

### Ask, don't assume

When the spec has ambiguity: surface it (add an "Open questions" bullet), stop and ask when it affects design (not after coding down one path), and document the answer in the task file when it lands. Assumptions become bugs faster than mistakes do.

## 3. Build (TDD loop)

```
write failing test → minimum code to pass → refactor with tests green → commit
```

See [tdd.md](tdd.md) for which layer applies. Two non-negotiables for pure-logic work:

1. **Test before implementation.** If a test feels impossible to write, the design is wrong — pause and rethink.
2. **Refactor with tests green.** Tests are the safety net for changing structure without changing behavior.

While building: refactor on touch (bounded to your change's blast radius), rewrite scar tissue instead of patching, update docs in the same commit, don't batch unrelated changes.

### Scope guard mid-task

Each new request mid-task is a fork. Default: check it against the task's *Out of scope*; classify (in scope → proceed; out-of-scope trivial → fix and mention; out-of-scope non-trivial or unplanned → stop and ask); name it explicitly ("this belongs to another task / no plan yet — do now, defer, or capture?"); then do-now (note it), defer (link), or capture-only (`ideas.md`/`risks.md`). Scope creep saturates context and forces compaction — the #1 failure mode that breaks task atomicity.

## 4. Prove

Before merging, the Definition of Done must be true:

- [ ] All relevant testing layers green (see [tdd.md](tdd.md))
- [ ] Lint + format clean (matches CI)
- [ ] Typecheck clean (no `any`, no `@ts-ignore` without justification)
- [ ] No new dependencies without an ADR or task-file justification
- [ ] Per-area docs reflect reality
- [ ] ADR written if an architectural decision was made
- [ ] App boots cleanly and the changed surface works end-to-end — "tests pass" ≠ "the app runs"
- [ ] No commented-out code, no debug logging debris, no AI attribution
- [ ] **Task closed** — status → `done`, file moved to `docs/tasks/done/`, task ID stamped in the commit

## 5. Ship

- Branch per [git.md](git.md): `<type>/t<NNN>-<short-kebab>`.
- Commit: semantic title only, lowercase, no body, ` (tNNN)` suffix.

### Closing the task (the step that gets forgotten)

Closure rides in the **same commit** as the code. Code merged with the task still open is a defect. The mutations: task header → `Status: done`; `git mv` to `docs/tasks/done/`; mid-task deferrals captured as their own tasks/ideas/risks; task ID stamped in branch + commit + PR.

## Anti-patterns

- **"I'll write tests after."** No — test goes first for pure logic.
- **"Small change, no need to update docs."** If it's big enough to commit, it's big enough to update docs.
- **"I'll fix this unrelated thing while I'm here."** Capture it as a task. Don't bundle.
- **"This task got bigger but I'm almost done."** Stop. Ship the small part + follow-up, or split.

## When to break the rules

- **Spike code** — throwaway to learn an unknown shape, then deleted and redone TDD-first. Never merges.
- **Emergency hotfix** — minimum code + minimum test to stop the bleed, then a proper follow-up task.

Both require an explicit "this is a spike / hotfix" acknowledgement, not silent rule-bending.

---

_Conventions are stable. Open an ADR to change one._
