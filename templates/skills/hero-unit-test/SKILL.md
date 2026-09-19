---
name: hero-unit-test
description: Use after implementation to write focused unit tests from the approved requirements, run them, and report the actual results
---

# Hero Unit Test

## Overview

hero-unit-test is the post-implementation unit-testing stage. It derives expected behavior from the approved plan or explicit acceptance criteria, writes focused unit tests around the implemented code, runs them, and reports the observed results. It does not implement or repair production code.

<HARD-BOUNDARY>
This stage may change tests and test-only support files only. It must not edit or refactor production code, perform code review, deploy or release, or perform git delivery actions.
</HARD-BOUNDARY>

## When to Use

Use this skill after implementation for behavior that needs executable unit-level coverage:
- Bug fixes that need a durable regression case.
- New business rules, edge cases, error paths, or interfaces.
- Refactors whose approved behavior must remain stable.

Skip it only when there is no runtime behavior to exercise, such as prose-only documentation or comments.

## Inputs

Normal inputs:

```text
PLAN_PATH=<approved-plan-path>
TARGET=local
SCOPE=<requirements, tasks, modules, or files>
```

- `PLAN_PATH` supplies requirements, business rules, edge cases, interfaces, and requirement-to-task coverage.
- A deliberately planless small change must have explicit acceptance criteria. If neither a plan nor clear criteria defines expected behavior, stop; do not infer the test oracle from the current implementation.
- `TARGET` defaults to the current local implementation. A commit/ref may be named for identity, but the runnable workspace must already contain that target.
- `SCOPE` narrows the requested unit-test work when only part of the implementation should be covered.
- Read existing unit-test conventions, helpers, fixtures, and commands for the affected area.

For a commit/ref target, resolve and record the intended SHA, then confirm the current workspace represents it. Do not check out, reset, or switch automatically. For a local target, record the initial production-code status before creating tests so test-stage changes can be distinguished from pre-existing implementation changes.

## Expected-Behavior Oracle

Derive expected results in this order:

1. Approved plan requirements and business rules.
2. Explicit acceptance criteria or external contracts.
3. Approved compatibility behavior.
4. Existing implementation only for API shape, dependencies, and available test seams — never as the expected result merely because the code currently behaves that way.

A failing test is valid when it accurately demonstrates that the implementation violates an approved requirement.

## Allowed Changes

This stage may:
- Create or edit unit-test files.
- Create or edit test-only fixtures, mocks, factories, snapshots, and helpers.
- Correct defective test setup or assertions and rerun the affected tests.
- Run relevant unit-test and coverage commands.

This stage must not:
- Edit or refactor production code to create a test seam or make a failure pass.
- Implement missing business behavior.
- Perform code review, deployment, or release work.
- Commit, push, merge, or open a pull/merge request.
- Invoke a generic workflow that implements production code as part of testing.

If production changes are required, preserve the accurate failing test where appropriate and hand the remediation back to `hero-coding`.

## Process

1. Read the complete plan/criteria and resolve the implementation target and requested scope.
2. Build a requirement-to-test matrix covering normal behavior, boundaries, error paths, and named edge cases.
3. Identify existing test conventions and the narrowest relevant unit-test command.
4. Write focused tests and test-only support code. Do not change production files.
5. Run the relevant unit tests and read the actual output.
6. Fix only test defects, then rerun the affected command.
7. Classify every remaining failure and report the exact result.
8. Finish with coverage, gaps, and production-remediation items; do not make the production fix.

## Failure Classification

Classify failures as:

- **Expected production mismatch:** the test represents an approved requirement and the implementation does not satisfy it. Preserve/report it and hand remediation to `hero-coding`.
- **Test defect:** setup, fixture, mock, timing, or assertion is wrong. Fix only the test and rerun it.
- **Environment/tooling failure:** the command cannot execute reliably. Report the command, error, and affected coverage.
- **Pre-existing unrelated failure:** evidence shows the failure is outside the requested implementation. List it separately; do not fix it here.

Green tests are not required for an honest test-stage result. The required outcome is accurate tests, executed commands, observed results, and a clear handoff for production mismatches.

## Report Convention (on request)

hero-unit-test ends with a concise chat report and does not write a file automatically. If the user asks for a durable report, invoke `hero-report`; it writes `docs/test-reports/YYYY-MM-DD-<slug>.md` from the results already collected.

Report should cover:
- Plan/criteria, resolved implementation target, and requested scope.
- Requirement-to-test mapping.
- Test files and test-only support files changed.
- Exact commands run and actual pass/fail/skip counts and failure output.
- Behavioral coverage by requirement and edge case.
- Numeric coverage only when a coverage command was actually run.
- Known gaps, untestable requirements, and failure classifications.
- Production remediation items handed to `hero-coding`.
- Confirmation that no production code was changed.

Test report style:
- Use concise, evidence-first bullets; avoid test-run storytelling.
- Preserve exact commands, test names, file paths, API names, errors, counts, and output summaries.
- Separate production mismatches from test defects and environment failures.
- Never claim coverage or success that the executed output did not establish.

## Definition of Done

- Planned unit tests for the requested scope were written or a concrete blocker explains why they could not be.
- Relevant commands were executed and their actual output was reported.
- Requirements and edge cases map to tests or explicit gaps.
- Every failure is classified and production remediation is handed to `hero-coding` without changing production code.
- Only test and test-only support files were modified by this stage.
- If a report was requested, it was written separately via `hero-report`.

## Related Skills

- Reads expected behavior from `hero-planning` and the implementation from `hero-coding`.
- Complements the independent, read-only findings pass in `hero-reviewing`.
- `hero-strict` may later run broader suites and non-unit verification in its own session.
- Uses `hero-report` only when the user asks for a durable test report.
