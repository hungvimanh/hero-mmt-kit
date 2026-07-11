---
name: hero-unit-test
description: Use to verify implementation correctness — either TDD-first before coding, or as a post-implementation test pass
---

# Hero Unit Test

## Overview

hero-unit-test is the dedicated testing stage of the hero-mmt-kit workflow. It supports two distinct modes:

- **TDD-first** — tests are written before any implementation exists; the implementation is then written to satisfy them.
- **Post-implementation** — tests are written against a completed implementation to pin down and verify its behavior.

The mode is chosen explicitly and stated up front — never implied or left ambiguous.

## When to Use

Use this skill for any change to behavior that needs automated verification:
- Bugfixes: a failing (red) reproduction test should exist before the fix, per the vendored `test-driven-development` skill's discipline.
- New features: choose TDD-first if the design is well understood up front, or post-implementation if the shape of the solution is still emerging during `hero-coding`.
- Refactors: post-implementation tests (or pre-existing tests) confirm behavior didn't change.

Skip this skill only for changes with no runtime behavior to verify (docs, comments, pure config).

## Inputs

Read artifact-first:
1. The planning artifact (`docs/plans/YYYY-MM-DD-slug.md`) — required reading **before** any implementation exists, for TDD-first work.
2. The coding report (`docs/coding-reports/YYYY-MM-DD-slug.md`) and the changed code — for post-implementation work.
3. Existing test suite and conventions for the affected area.

If an input is missing, continue with what is available and note the gap in the test report.

## Process

1. **Decide the mode** — TDD-first or post-implementation — and state the choice explicitly at the top of the test report.
2. **Apply the vendored `test-driven-development` skill's discipline:**
   - TDD-first: red (write a failing test) → green (minimal implementation to pass) → refactor.
   - Post-implementation: write tests that pin down the behavior the implementation already exhibits, including edge cases the implementation should handle.
3. **Run the test suite.** Capture pass/fail results and note how the changed behavior is covered.
4. **Verify before claiming.** Use the vendored `verification-before-completion` skill: actually run the test command and read its output — never assume or infer that tests pass.
5. **Document gaps.** Record any known gaps or deliberately-skipped cases and why they're acceptable.

## Output Artifact

`docs/test-reports/YYYY-MM-DD-<slug>.md` containing:
- Mode: TDD-first or post-implementation.
- Commands run and their actual output (pass/fail counts).
- Coverage of the changed behavior, in plain terms.
- Known gaps or skipped cases, with reasons.

Test report style:
- Use concise bullets; avoid test-run storytelling.
- Keep exact commands and observed results verbatim.
- Include only meaningful coverage notes and known gaps.
- Do not compress failure messages, test names, file paths, numbers, or command output summaries.

## Definition of Done

- Tests are green, or failures are explicitly documented with a reason they're acceptable.
- The changed behavior has meaningful test coverage.
- The test report records the exact commands run and their results — not a claim without evidence.

## ACTIVE_STATE.md Update

- Update the relevant row in `docs/ACTIVE_STATE.md`'s Active Features table with current status.
- Write `.hero-mmt-kit/session.json`:
  - `currentSkill: "hero-unit-test"`
  - `resumePath`: path to the test report
  - `nextAction`: what to do next (e.g., proceed to `hero-reviewing`, or fix a documented failure)
  - `updatedAt`: ISO timestamp

## Related Skills

- Wraps the vendored `test-driven-development` and `verification-before-completion` skills — this skill does not duplicate their content.
- Reads output from `hero-planning` (for TDD-first) and/or `hero-coding` (for post-implementation).
- Complements `hero-reviewing`, which is a parallel/independent fresh-eyes check rather than a test pass.
- `hero-strict` may require re-running this skill's checks under a stricter bar before a "done" claim.
