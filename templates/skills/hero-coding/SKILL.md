---
name: hero-coding
description: Use to implement an approved hero-planning plan, a small bounded change, or exact user-approved corrections from a prior hero-reviewing pass
---

# Hero Coding

## Overview

hero-coding is the implementation-only stage. It turns an approved plan, a small bounded request, or exact user-approved corrections from a prior independent review into production changes while accounting for every requirement, business rule, edge case, interface, and implementation step. It answers: "What was implemented, what remains blocked, and where did the implementation deviate from the approved scope?"

<HARD-BOUNDARY>
This stage implements only. It does not author or run tests, run verification commands, review its own output, evaluate or select review feedback, deploy, release, or perform git delivery actions. It may implement exact correction IDs only after `hero-reviewing` confirmed them and the user explicitly approved them. All assurance and delivery activities remain independent later sessions.
</HARD-BOUNDARY>

## When to Use

Use this skill when:
- `hero-planning` produced an approved plan and the user explicitly started implementation.
- A Tiny/Fast change is sufficiently bounded that a plan artifact would add no useful clarity.
- `hero-reviewing` produced confirmed correction IDs and the user explicitly approved the exact IDs to implement.

Do not silently choose a plan or correction set. Prefer `PLAN_PATH=<approved-plan-path>` for non-trivial planned work. For review remediation, require a review handoff/report plus `APPROVED_CORRECTIONS=<exact IDs>`. If multiple plausible sources exist, or approval is not explicit, ask which contract is approved.

## Inputs

Read implementation context before editing:

1. `PLAN_PATH`, when supplied. Read the complete plan, not selected excerpts.
2. Otherwise, the user's explicit bounded request and acceptance criteria.
3. For review remediation, the captured `hero-reviewing` result or report and `APPROVED_CORRECTIONS=<exact IDs>`.
4. The current codebase state relevant to the requested implementation.

A review correction is eligible only when:
- A prior independent `hero-reviewing` pass classified the item `confirmed`.
- The user explicitly approved that exact `RV-*` or `FB-*` ID.
- The handoff identifies the reviewed target, required outcome, constraints, and excluded items.
- The current implementation has not drifted so far that the correction is unsafe or ambiguous.

Do not reassess findings, choose additional items, infer approval from severity, or implement rejected, unclear, out-of-scope, or unapproved feedback. If target drift changes the meaning of a correction, stop and request clarification or another review.

For a current `hero-planning` plan, extract and reconcile:
- Requirement IDs from the requirement ledger.
- `## Change Map` entries.
- `## Task Dependencies`.
- Every `### Task N:` section.
- Each task's `Requirements`, `Depends on`, `Outcome`, `Files / areas`, `Implementation steps`, `Business rules and edge cases`, `Interfaces produced or changed`, and `Completion state`.
- The `## Requirements Coverage` mapping.

For a legacy plan without requirement IDs, derive a session-only checklist from its tasks and acceptance criteria. Do not rewrite or upgrade the approved plan automatically.

For a review correction handoff, map each approved correction ID to one bounded task and requirement entry. Preserve its required outcome and constraints verbatim; do not merge in unapproved reviewer suggestions or reinterpret the finding as broader refactoring work.

## Implementation Ledger

Maintain two linked views throughout the session:

### Task state

Use `pending`, `in progress`, `implemented`, or `blocked` for every planned task.

A task becomes `implemented` only when:
- Every listed implementation step has a corresponding change.
- Its business rules and edge cases are represented in the implementation.
- Its interfaces and completion state now exist as specified.
- Any approved deviation is recorded explicitly.

Respect `Depends on`. Do not start a dependent task before its prerequisite implementation state exists.

### Requirement state

For every requirement, record:
- Owning task or tasks.
- `pending`, `in progress`, `implemented`, or `blocked`.
- Changed files, symbols, interfaces, or configuration areas.
- Any approved deviation or unresolved blocker.

A touched file is not proof that a requirement is implemented. A requirement is implemented only when all of its owning tasks and business rules are accounted for.

Use the session task list for execution progress. Keep the approved plan immutable; its checkboxes describe scope and are not a mutable execution log.

## Process

1. Read and inventory the complete plan, bounded request, or approved correction handoff.
2. For correction work, validate the prior assessment, exact approved IDs, reviewed target identity, required outcomes, and constraints without re-reviewing their technical merit.
3. Build the task and requirement ledgers before editing.
4. Confirm dependencies and start the first unblocked implementation task or correction ID.
5. Implement one coherent task at a time. Keep only one writing agent active in a shared worktree; parallel agents may perform read-only exploration when useful.
6. After each task, reconcile every implementation step, business rule, edge case, interface, requirement, or approved correction it owns. Mark incomplete items `blocked` or `pending`, never optimistically complete.
7. Stop and ask the user when:
   - A requirement, correction outcome, or business rule is ambiguous.
   - Safe implementation requires behavior outside the approved scope.
   - The plan or correction handoff conflicts with the current codebase.
   - Target drift changes the meaning of an approved correction.
   - An external dependency or prerequisite is missing.
8. Finish with a concise implementation summary and an explicit handoff to independent testing/review sessions.

This reconciliation checks whether the requested implementation work was performed. It is not a correctness review and must not be presented as one.

## Implementation-Only Boundary

During this stage, do not:
- Create, edit, or run unit, integration, snapshot, end-to-end, or reproduction tests.
- Run build, lint, typecheck, test, coverage, smoke-test, or other verification commands.
- Perform self-review, dispatch a code reviewer, evaluate feedback, or implement any review item that lacks both a prior `confirmed` classification and explicit user approval of its exact ID.
- Deploy, release, merge, commit, push, or open a pull/merge request.
- Invoke a generic skill whose mandatory lifecycle performs any excluded activity above.

If an unexpected defect cannot be resolved safely from the approved requirements and code context, record it as a blocker and stop. Do not create a temporary test or broaden the session into debugging/verification work.

## Report Convention (on request)

hero-coding does not write a report file automatically. If the user asks for a written report, invoke `hero-report`; it writes `docs/coding-reports/YYYY-MM-DD-<slug>.md` using this contract.

Report should cover:
- Plan path, bounded request, or review correction source used.
- Exact approved correction IDs, when applicable.
- Requirement states and their owning tasks.
- Task states, including blockers and explicit deferrals.
- Changed files, symbols, interfaces, schemas, configuration keys, and behavior.
- Approved deviations and why they were necessary.
- Confirmation that testing, verification, and independent review were not performed in this stage; for correction work, this means no independent re-review occurred after the fix.

Report style:
- Keep it tight: no narrative scaffolding or self-congratulatory claims.
- Preserve exact file paths, symbol names, API names, configuration keys, errors, and requirement/task IDs.
- Use concise bullets for task state, requirement coverage, changes, deviations, and blockers.
- Do not add commands or test evidence that this stage did not collect.

## Definition of Done

- Every planned task, requirement, or approved correction ID is `implemented`, `blocked`, or explicitly deferred with the user's approval.
- Dependencies, business rules, edge cases, interfaces, correction constraints, and completion states are accounted for.
- No unapproved scope expansion or review item is hidden inside the implementation.
- The chat summary states what changed and what later testing or independent re-review still needs to establish.
- If a report was requested, it was written separately via `hero-report`.

## ACTIVE_STATE.md Update

Use `docs/ACTIVE_STATE.md` only as a durable index when a tracked work item needs a current implementation task, status, or blocker recorded for handoff. Do not copy the implementation ledger into it, and do not treat an ACTIVE_STATE update as correctness evidence.

## Related Skills

- Reads the approved implementation contract from `hero-planning`, or exact user-approved correction IDs from a prior `hero-reviewing` handoff.
- Never decides whether review feedback is valid; `hero-reviewing` owns that assessment.
- Hands the resulting implementation to separately invoked `hero-unit-test`, `hero-reviewing`, and, when appropriate, `hero-security` or `hero-strict` sessions.
- Uses `hero-report` only when the user asks for a durable coding report.
