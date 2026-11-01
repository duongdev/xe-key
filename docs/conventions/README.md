# Convention templates

Generalized, project-agnostic versions of the convention docs the universal
core scaffolds into a target repo's `docs/conventions/`. Copy each only if
absent. After copying, replace `<project>` placeholders and prune examples that
don't apply, then add project-specific examples on-touch.

| File | Scaffold when |
|---|---|
| [dev-lifecycle.md](dev-lifecycle.md) | always |
| [code-quality.md](code-quality.md) | always |
| [git.md](git.md) | always |
| [docs-discipline.md](docs-discipline.md) | always |
| [tdd.md](tdd.md) | always |

UI-only conventions (`product.md`, `ux.md`, `frontend.md`) are not templated
here — author them on first UI work, guided by the product-quality UX bar in
[../universal-core.md](../universal-core.md).
