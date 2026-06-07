# Definition of Done (DoD)

> **Measurable** completion criteria. A change is "done" only when it meets the DoD for its path. The path is decided by [AGENCY_WORKFLOW.md §1](./AGENCY_WORKFLOW.md#1-task-classification--workflow-router).

## Verification level overlay

Active verification level: **{{VERIFICATION_LEVEL}}**. Full definitions live in [ASSISTANCE_PROFILES.md](./ASSISTANCE_PROFILES.md).

| Level | Completion evidence |
|---|---|
| `strict` | Relevant tests, lint/typecheck/build where configured, and required review/QA; explain any not-run command. |
| `pragmatic` | Targeted checks for the changed surface, broader checks when risk or behavior change warrants it; state skipped checks. |
| `minimal` | Smallest credible check for low-risk work; if no command applies, state manual rationale and unverified areas. |

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
- [ ] Applicable light security/performance checks pass: no new secrets, no obvious regression / N+1 ([SECURITY_STANDARDS.md](./SECURITY_STANDARDS.md), [PERFORMANCE_STANDARDS.md](./PERFORMANCE_STANDARDS.md)).

### Standard path (Change logic / Refactor)
Includes all of Fast path, plus:
- [ ] Passed the **Gate** (Plan Mode) and the user approved the approach.
- [ ] `gitnexus_impact` (upstream) ran & **blast radius + risk level reported**; HIGH/CRITICAL risk accepted by the user.
- [ ] `<TYPECHECK_CMD>` green (if applicable).
- [ ] **Refactor:** the same test suite passes before & after (behavior unchanged); renames use `gitnexus_rename`, not manual find-replace.
- [ ] **Change logic:** old regression tests still green + new tests for new behavior.
- [ ] Review/QA evidence follows the active profile's adaptive review budget: low-risk work may use self-review + targeted verification; medium-risk work may use one combined reviewer; sensitive/high-impact work requires targeted specialist review. Coding Assistant normal work includes verified/unverified scope plus explicit developer review handoff.
- [ ] `security-review` if touching a sensitive surface.
- [ ] Standard security/performance checks pass: input validation for touched boundaries, authz checks if touched, hot-path before/after bench, AI prompt caching preserved when relevant ([SECURITY_STANDARDS.md](./SECURITY_STANDARDS.md), [PERFORMANCE_STANDARDS.md](./PERFORMANCE_STANDARDS.md)).
- [ ] **If the change includes UI:** meets the "Design / UI work" checklist below.

### Full path (New feature)
Includes all of Standard path, plus:
- [ ] **PRD** approved (Gate 1) and linked in ACTIVE_STATE.
- [ ] **TDD** approved (Gate 2): includes a light threat model + API/interface contract.
- [ ] Coverage ≥ `<COVERAGE_MIN>` for new code.
- [ ] Meets all acceptance criteria in the PRD.
- [ ] Full review/QA evidence follows the active profile's adaptive review budget; final integration review is required only when multiple independent streams, high-risk/core changes, or narrow prior reviews leave integration seams unchecked.
- [ ] `security-review` ran, no unresolved new findings.
- [ ] Full security standards pass; AI features include OWASP LLM Top 10 abuse cases ([SECURITY_STANDARDS.md](./SECURITY_STANDARDS.md)).
- [ ] Full performance standards pass; AI features meet token/latency ceilings and main-flow measurements exist ([PERFORMANCE_STANDARDS.md](./PERFORMANCE_STANDARDS.md)).
- [ ] **Handover:** CLAUDE.md updated with new architectural decisions (if any); 3-line retro recorded; optional Serena notes updated as pointers; task `completed` + ACTIVE_STATE updated.
- [ ] **If the change includes UI:** meets the "Design / UI work" checklist below.

### Design / UI work (applies whenever the change includes UI — Standard/Full)
- [ ] Design profile + one visual direction are locked and followed ([DESIGN_STANDARDS.md](./DESIGN_STANDARDS.md)).
- [ ] Visual QA checklist passes: responsive, a11y AA, no hardcoded design values, all states, shared token source for web+mobile, media asset DoD/budget when relevant.
- [ ] In-product help/guide entry exists and is accurate when the change affects users.
- [ ] Visual QA evidence recorded (`reports/.../design-qa.md`).

---

## Invariants (all paths)
1. **Never claim "done/passing" without running a verification command** — evidence before assertions (`verification-before-completion`).
2. **Tests must actually test behavior**, not empty/fully-mocked tests just to pass.
3. **ACTIVE_STATE.md is updated** when work status changes.
