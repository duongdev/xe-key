# Testing strategy

Three layers, each matched to a kind of code. Don't apply the heavy layer to glue, or the light layer to logic.

## The three layers

### Layer 1 — Pure logic (strict TDD)

For pure modules — no IO, no framework, deterministic in → out (`src/lib/`, `core/`, and equivalents).

```
write failing test → minimum code to pass → refactor with tests green → commit
```

Non-negotiable: **the test goes first.** If a test feels impossible to write, the design is wrong — pause and rethink. This is the layer where coverage is expected to be thorough; pure functions are cheap to test and the tests are the spec.

### Layer 2 — Glue / IO (manual smoke + HITL)

For code that crosses a system boundary — network clients, IPC, DB calls, process orchestration — where a faithful fake costs more than it's worth.

- No synthetic-integration harness unless a real test DB exists (see project nature).
- Verify with a **manual smoke checklist** in the task file: concrete steps against a live dependency, each with an expected outcome.
- Human-in-the-loop confirms before close.

### Layer 3 — UI (mock-first + visual review)

For renderer components.

- Mock the data layer; test behavior/reducers as pure logic where possible (lift logic out of components into Layer 1 modules).
- **Component tests** (React Native Testing Library) cover behavior, not layout: interactive primitives (hold-to-arm fires once and never on early release; sliders step via accessibility actions; swipe-to-delete offers Undo) and each screen rendering its four states from a mocked service.
- **Visual review** against the running app: capture all **four states** — loading, empty, error, populated — plus the specific interaction/layout changed.
- Commit screenshots when useful.

## Choosing the layer

| Code kind | Layer | Test-first? |
|---|---|---|
| Pure function / reducer / state machine | 1 | Yes, always |
| Network/IPC/DB glue | 2 | No — manual smoke checklist |
| React/UI component | 3 | Behavior via RNTL + visual |

When a task touches more than one, the task's Test plan lists each applicable layer and writes "n/a" for the rest.

## Lift logic out of glue

The strongest move: extract decision logic *out* of IO/UI code into a pure module, so it drops from Layer 2/3 into Layer 1 where it's cheaply and exhaustively testable. A thin glue shell around a well-tested pure core is the target shape.

## Gates

Pure-logic tests run in CI and must be green to merge. Manual-smoke and visual-review evidence lives in the task file / PR, not CI — but the Definition of Done requires it before close.

---

_Test-first for logic. Smoke for glue. Eyes for pixels._
