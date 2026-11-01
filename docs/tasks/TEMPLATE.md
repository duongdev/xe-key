# NNN — <Short imperative title, lowercase>

- **Status:** draft | ready | in-progress | done
- **Mode:** AFK | HITL
- **Estimate:** 0.5d | 1d
- **Depends on:** <task IDs or "none">
- **Blocks:** <task IDs or "none">

## Goal

One paragraph. The change in plain language. What will be true after this task ships that isn't true now.

## Why now

What this unlocks. Which downstream tasks are waiting on it. Why it can't wait.

## Acceptance criteria

Testable bullets. Each one checkable as true/false at completion.

- [ ] …
- [ ] …

## Test plan

Which testing layers apply (see [../conventions/tdd.md](../conventions/tdd.md)) and what specifically is tested.

### Layer 1 — Pure logic (TDD)

- [ ] `<module/function>` — covers <behavior>
- [ ] `<module/function>` — covers <edge case>

If no pure logic is touched: "n/a — this task only touches glue/IO or UI layout."

### Layer 2 — Manual smoke (glue/IO)

- [ ] <concrete step and expected outcome>
- [ ] <concrete step and expected outcome>

If no glue/IO code is touched: "n/a."

### Layer 3 — Visual review

- [ ] Screenshots captured against the running app
- [ ] All four states visible: loading, empty, error, populated
- [ ] <specific interaction or layout to verify>

If no UI is touched: "n/a."

## Design notes

Describe the behavioral change, not the implementation path. Reference types, interfaces, and module contracts — not file paths or line numbers. File paths go stale; interfaces don't.

- **Contracts changed:** `<TypeOrInterfaceName>` — <old → new>
- **New modules:** <list with one-line justification each, or "none">
- **New ADR needed?** <yes/no — if yes, draft title>

## Out of scope

What this task explicitly does NOT do. Capture related work as separate tasks.

- …

## Definition of Done

- [ ] Layer 1 tests written and green (if pure logic touched)
- [ ] Layer 2 smoke checklist completed (if glue/IO touched)
- [ ] Layer 3 screenshots captured and committed (if UI touched)
- [ ] Lint + format clean
- [ ] Typecheck clean
- [ ] Tests green
- [ ] App boots cleanly and the changed surface works end-to-end
- [ ] Per-area docs updated for any modified module
- [ ] ADR written if an architectural decision was made
- [ ] No commented-out code, no debug-log debris, no AI attribution
- [ ] Task closed: status → done, file moved to `docs/tasks/done/`, tNNN in commit

## Notes

Free-form scratchpad. Open questions, decisions made, links.

---

_When task status flips to `done`, move this file to `done/`._
