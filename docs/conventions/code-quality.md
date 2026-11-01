# Code quality

The standards every change must meet: SOLID, atomicity, back-compatibility, refactor-on-touch.

## SOLID

- **S — Single Responsibility.** One reason to change. Smell: a file imports from three unrelated subsystems, or its name has "and" in it. A 200-line file doing one thing beats a 50-line file doing three. Keep effects out of pure modules.
- **O — Open/Closed.** New behavior by composition, not by editing existing code. Adding a variant means a new union member + one `case`, not a new interface.
- **L — Liskov Substitution.** Anything implementing an interface honors its contract. The production implementation and the test fake both satisfy it; consumers don't know which is active.
- **I — Interface Segregation.** Many small focused interfaces over one large one. Expose only what the consumer needs.
- **D — Dependency Inversion.** High-level modules depend on abstractions; the caller wires the concrete implementation. This is what lets tests run without live IO.

## Atomicity

Every commit is a complete, shippable change. Every PR does one thing.

**Atomic ✓** — `fix(tabs): handle duplicate ids in reconcile` (one bug, one test, one fix).
**Not atomic ✗** — `feat: add X + refactor Y + update Z`; `wip: stuff`.

A large feature splits into atomic commits that each leave the system green:

```
feat(area): add state machine
feat(area): wire state machine into the app
feat(area): apply override on connect
```

## Back-compatibility

**Default: additive over breaking.** Persisted config (settings on disk) must survive upgrades: add new fields with defaults that preserve old behavior, migrate on load, remove old fields only after the migration has shipped one version. Renaming a public function? Add the new name, deprecate the old with a comment, remove next iteration.

## Fresh, not patched

When a function, file, or doc accumulates scar tissue, **rewrite it** rather than appending another conditional or "note: as of…" sentence. Symptoms: `legacyFoo` names, comments about what *used to be true*, geological `if` strata, dead "just in case" branches. Fix in the same commit if scope allows; else capture a follow-up.

## Seamless version upgrades

Lockfile committed, always. One package per PR (unless a coupled set must move together). Read the CHANGELOG of every skipped version. Major bumps are architectural → require an ADR. Run tests + boot the app after any upgrade.

## Refactor-on-touch, bounded

Leave code cleaner than you found it — **within the blast radius of your change**. Renaming a confusing local while adding a param: OK, same commit. Refactoring unrelated state management while patching a math bug: not OK — capture a separate task.

## Things to avoid

- **No dead code, ever.** No commented-out code (git remembers), no unused imports/vars/functions, no "might need later" stubs. Delete orphans in the same commit. TODOs without an owning task are wishes — convert or delete.
- **No premature abstraction.** Three repetitions before you abstract; two is coincidence. A single-use helper is fine; a single-use abstraction is overhead. No `helpers.ts`/`misc.ts` dumping grounds.
- **Native first, then a library.** Reach for native ES (`structuredClone`, `Object.groupBy`, `Map`/`Set`) before adding a dep. Justify any utility lib in the task file.
- **No defensive code at internal boundaries.** Validate at *system boundaries* (config from disk, network responses, IPC). Inside, trust your types. Exception: correctness-critical invariants — assert even internally.
- **No magic strings/numbers.** Named constants for anything used twice; named discriminants for closed unions.
- **No silent failures.** Errors propagate. A `try/catch` that does nothing is a bug. If you catch, do something — log with context, transform, or recover.
- **No comments that say *what*.** Comments explain *why*; identifiers do the *what*.
- **No AI attribution.** Never in commits, code, comments, PRs, READMEs, or ADRs.

## Error handling

- **IO/glue layer:** log with context, never swallow; return a typed `{ error }` for recoverable failures and let the UI surface it.
- **UI layer:** typed discriminated returns or `try/catch` that renders a state. Never propagate raw `Error` to the view. Wrap render boundaries in an ErrorBoundary.
- **Pure modules:** throw on invariant violations; return `null`/typed result for expected misses. Document which is which.

## TypeScript

- `strict: true` always. No `any` — use `unknown` and narrow. `@ts-ignore` needs a why-comment + follow-up.
- Discriminated unions over flag fields. `readonly` for immutable shapes.
- Exhaustiveness checks (`assertNever`/`satisfies`) on union dispatch — new variants force a compile error in every consumer.

## Quality gates (mechanical)

Run on every commit (pre-commit hook) and before every merge: lint + format (errors fail), typecheck (clean), unit tests (green), no new deps without justification, app boots cleanly for changes touching entry/build config.

---

_Code quality is built one commit at a time. There's no "fix it later" pass that ever happens._
