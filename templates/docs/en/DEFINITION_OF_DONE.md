# Definition of Done (DoD)

> **Measurable** completion criteria. A change is "done" only when it meets the DoD for its path. The path is decided by [AGENCY_WORKFLOW.md §1](./AGENCY_WORKFLOW.md#1-task-classification--workflow-router).

## ⚙️ Placeholders to fill when the tech stack is chosen
Stack not decided yet — fill these in the first PRD/TDD, then update this file:

| Variable | Value | Example |
|----------|-------|---------|
| `<TEST_CMD>` | test command | `npm test` / `pytest` |
| `<LINT_CMD>` | lint + format check | `npm run lint` / `ruff check .` |
| `<BUILD_CMD>` | build command | `npm run build` / `—` |
| `<COVERAGE_MIN>` | minimum coverage threshold | `80%` |
| `<TYPECHECK_CMD>` | type check (if any) | `tsc --noEmit` / `mypy .` |

---

## Checklist by path

### Read-only (Q&A / Explain)
- [ ] Answers the core of the question.
- [ ] Cites `file:line` for every claim about code.
- [ ] No branch / no commit / no file edits.

### Fast path (Chore / Docs / Config / Small bugfix / Hotfix)
- [ ] Correct branch prefix ([BRANCHING.md](./BRANCHING.md)).
- [ ] `<TEST_CMD>` green · `<LINT_CMD>` green · `<BUILD_CMD>` green.
- [ ] **Bugfix/Hotfix:** a test reproducing the bug went RED → GREEN; regression suite still passes.
- [ ] **Chore/Docs:** no runtime behavior change.
- [ ] Conventional Commits; MR briefly describes *what + why*.
- [ ] Ran `gitnexus_detect_changes` (when code exists) — scope as expected.
- [ ] **Security (light):** no new secret committed (see [SECURITY_STANDARDS.md](./SECURITY_STANDARDS.md) §5). **Performance (light):** no obvious regression / no new N+1 ([PERFORMANCE_STANDARDS.md](./PERFORMANCE_STANDARDS.md) §4).

### Standard path (Change logic / Refactor)
Includes all of Fast path, plus:
- [ ] Passed the **Gate** (Plan Mode) and the user approved the approach.
- [ ] `gitnexus_impact` (upstream) ran & **blast radius + risk level reported**; HIGH/CRITICAL risk accepted by the user.
- [ ] `<TYPECHECK_CMD>` green (if applicable).
- [ ] **Refactor:** the same test suite passes before & after (behavior unchanged); renames use `gitnexus_rename`, not manual find-replace.
- [ ] **Change logic:** old regression tests still green + new tests for new behavior.
- [ ] QA sub-agent reviewed (`code-review`); `security-review` if touching a sensitive surface.
- [ ] **Security (Standard):** input validation for touched code + authz checks if touched ([SECURITY_STANDARDS.md](./SECURITY_STANDARDS.md) §5). **Performance (Standard):** before/after bench for hot paths; (AI) prompt caching preserved ([PERFORMANCE_STANDARDS.md](./PERFORMANCE_STANDARDS.md) §4).

### Full path (New feature)
Includes all of Standard path, plus:
- [ ] **PRD** approved (Gate 1) and linked in ACTIVE_STATE.
- [ ] **TDD** approved (Gate 2): includes a light threat model + API/interface contract.
- [ ] Coverage ≥ `<COVERAGE_MIN>` for new code.
- [ ] Meets all acceptance criteria in the PRD.
- [ ] `security-review` ran, no unresolved new findings.
- [ ] **Security standards (Full):** meets [SECURITY_STANDARDS.md](./SECURITY_STANDARDS.md) §5; AI features checked against OWASP LLM Top 10 (§2) including abuse cases.
- [ ] **Performance standards (Full):** meets the [PERFORMANCE_STANDARDS.md](./PERFORMANCE_STANDARDS.md) §1 budget; AI features meet the token/latency ceiling §2; load measurement exists for the main flow.
- [ ] **Handover:** CLAUDE.md updated with new architectural decisions (if any); 3-line retro recorded; optional Serena notes updated as pointers; task `completed` + ACTIVE_STATE updated.

---

## Invariants (all paths)
1. **Never claim "done/passing" without running a verification command** — evidence before assertions (`verification-before-completion`).
2. **Tests must actually test behavior**, not empty/fully-mocked tests just to pass.
3. **ACTIVE_STATE.md is updated** when work status changes.
