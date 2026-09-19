---
name: hero-reviewing
description: Use for a read-only review of an implementation target, technical assessment of supplied review feedback, or both, against an approved plan or explicit acceptance criteria
---

# Hero Reviewing

## Overview

hero-reviewing is the single entry point for implementation review. It can conduct an independent findings pass, assess review feedback supplied by a human or external reviewer, or explicitly do both. It compares claims with the actual target code and approved requirements, then returns evidence-backed findings and dispositions.

A delegated reviewer is an internal implementation detail, not another workflow the user must invoke. The implementation, target diff, and surrounding contracts are the source of truth; plans, summaries, reports, and reviewer comments are context to verify rather than facts to trust blindly.

<HARD-BOUNDARY>
This stage is read-only and findings-only. It does not modify code or tests, apply fixes, run tests or other verification commands, update workflow files, invoke implementation automatically, or perform git delivery actions.
</HARD-BOUNDARY>

## When to Use

Use this skill when the user wants to:
- Review current local work, one exact commit, or a ref delta against a Hero plan or explicit acceptance criteria.
- Check whether supplied review comments are technically correct for this codebase.
- Run an independent review and assess existing feedback in one explicit combined pass.
- Turn confirmed, user-approved findings into a bounded correction handoff for a later `hero-coding` session.

It is expected for Standard-or-larger behavior changes and useful whenever completeness against requirements matters. Tiny copy or configuration edits may skip it when the user accepts the risk.

Use `hero-mr-review` instead for a teammate's committed MR/ref when MR intent and repository conventions, rather than a Hero plan or acceptance contract, are the source of truth.

## Intent Resolution

Normal conversation is sufficient; users do not need to know mode syntax. Infer the narrowest matching mode:

- `review`: the user asks for a fresh review and does not supply feedback to assess.
- `assess-feedback`: the user supplies review comments and asks whether they are valid.
- `both`: only when the user explicitly asks for both an independent review and assessment of supplied feedback.

An explicit override is also accepted:

```text
MODE=review
MODE=assess-feedback
MODE=both
```

Do not infer `both` merely because feedback happens to be available. In `both`, complete the independent pass before reading or assessing the supplied feedback so it cannot bias the fresh review.

## Inputs

Common inputs:

```text
PLAN_PATH=<approved-plan-path>
TARGET=local
```

Supported target forms:

```text
TARGET=local
TARGET=commit:<revision>
TARGET=ref:<head-revision> BASE_REF=<base-revision>
```

Feedback assessment may also use:

```text
FEEDBACK_PATH=<review-feedback-path>
```

or feedback supplied directly in chat.

Optional review execution hint:

```text
REVIEWER=direct
REVIEWER=delegated
```

- `PLAN_PATH` is the normal source of expected requirements, business rules, edge cases, interfaces, tasks, and coverage.
- A deliberately planless small change must have explicit requirements or acceptance criteria from the user. State that no plan was available.
- `CODING_REPORT_PATH`, when supplied, is supplementary context only. Never substitute it for reading the target code.
- If `TARGET` is omitted, use `local` only when the user's request clearly concerns the current working tree.
- For supplied feedback, record its source, original wording, and the target revision or snapshot it referred to when known.

## Resolve the Reviewed Target

Resolve and record the target before judging code or feedback. Never check out, reset, switch, or otherwise mutate the workspace to obtain a target.

### Local working tree

Capture the working state over `HEAD`:

```bash
git rev-parse HEAD
git status --short
git diff --cached --find-renames
git diff --find-renames
git diff HEAD --find-renames
git ls-files --others --exclude-standard
```

Review staged and unstaged tracked changes. Read every untracked file directly because ordinary diffs omit it. Record the resolved `HEAD` SHA, staged/unstaged state, and untracked file list as "local working tree observed at review start."

Re-read status before the verdict. If the workspace changed during the review, report snapshot drift and stop rather than combining two states.

### Exact commit

For `TARGET=commit:<revision>`, resolve an immutable commit SHA and review exactly that commit's patch and resulting code. Do not reinterpret it as "everything since main."

A merge commit is ambiguous without a parent/baseline. Ask which parent should define the reviewed change.

### Ref delta

For `TARGET=ref:<head-revision> BASE_REF=<base-revision>`, resolve both names to immutable SHAs and review the merge-base delta (`<base>...<head>`). Report both supplied names and resolved SHAs.

A bare branch, tag, symbolic ref, or revision without stated intent is ambiguous. Ask whether the user means:
1. One exact commit; or
2. The accumulated delta from a named base.

Never silently assume `main`, `master`, `origin/HEAD`, or `HEAD~1`.

### Feedback target mismatch

Compare the feedback's original target, when known, with the resolved target being assessed.

- If they match, assess normally.
- If the code moved but the relevant behavior is still traceable, state the drift and evaluate against both the original claim and current code.
- If the feedback cannot be attributed safely to the resolved target, classify it `unclear` rather than pretending it is current.

## Optional Fresh Reviewer

Use at most one fresh delegated reviewer when independence materially improves the result or the user requests it. Direct review remains valid when delegation adds no value.

The delegated prompt must include only:
- The approved plan or explicit acceptance criteria.
- The resolved target identity and the exact diff/code context needed.
- Relevant unchanged callers, contracts, or tests that must be inspected.
- This skill's read-only, no-verification, findings-only boundary.
- The required finding schema and severity calibration.

Rules:
- The delegated reviewer must read actual code and must not trust implementation summaries.
- It must not edit files, run tests/build/lint/typecheck/coverage, change git state, or dispatch another reviewer.
- In `both`, do not expose supplied feedback to the fresh reviewer before the independent pass is complete.
- Treat delegated output as candidate findings. The parent pass must verify the location, requirement, evidence, and impact before returning any item.
- Do not run duplicate review passes over the same scope without a distinct reason.

## Fresh Review Process

1. Read the complete plan or explicit acceptance criteria.
2. Extract requirements, tasks, business rules, edge cases, interfaces, dependencies, and the requirement-to-task coverage matrix.
3. Resolve and record the immutable reviewed target or local snapshot.
4. Inventory changed files and relevant unchanged callers, contracts, tests, schemas, migrations, and configuration needed to understand their effect.
5. Review directly or dispatch one fresh reviewer using the constraints above.
6. Compare every requirement and planned task with the actual implementation.
7. Check specifically for:
   - Missing or incomplete requirements.
   - Incorrect business logic or state transitions.
   - Unhandled edge cases and error paths.
   - Interface, schema, API, event, migration, or configuration mismatches.
   - Compatibility regressions across supported platforms or versions.
   - Scope growth, speculative features, and YAGNI violations.
   - Unsound architecture, ownership, coupling, performance, or maintainability introduced by the change.
   - Undocumented deviations and extra behavior outside the approved scope.
   - Tests or documentation that contradict the intended behavior.
8. Evidence-check every candidate finding and discard vague concerns, style preferences, duplicates, and claims unsupported by the target.
9. Return findings, coverage gaps, and the verdict. Do not fix anything.

Inspect existing test code and previously supplied results when they are relevant evidence. Do not run build, lint, typecheck, tests, coverage, smoke tests, or other verification commands. Missing executable evidence is a coverage gap, not permission to generate it during review.

## Feedback Assessment Process

Review feedback is a claim to evaluate, not an order to follow.

For each item:
1. Preserve an ID and restate the requested behavior faithfully.
2. Ask for clarification before deciding if the item is materially ambiguous.
3. Locate the referenced code and inspect surrounding contracts, callers, supported versions, tests, and prior approved decisions.
4. Check whether the suggestion:
   - Is factually correct for this codebase and target.
   - Fixes an observable defect or requirement mismatch.
   - Breaks existing behavior, compatibility, or an approved architectural constraint.
   - Adds unused or speculative behavior outside the approved scope.
   - Depends on evidence that is unavailable without a separate verification session.
5. Classify the item:
   - `confirmed`: evidence establishes a real defect, omission, or required correction.
   - `rejected`: evidence establishes that the claim is incorrect or harmful for this target.
   - `unclear`: the claim, target, requirement, or necessary evidence is insufficient for a technical decision.
   - `out-of-scope`: the suggestion may be reasonable work, but it is not required by the approved contract and is not a defect in this target.
6. Give concise technical reasoning. Push back on incorrect feedback with code/contract evidence; do not use performative agreement or disagreement.

A `confirmed` classification is a technical conclusion, not permission to modify code. Keep every confirmed item `awaiting user approval` until the user approves its exact ID.

## Combined Process

For `MODE=both`:
1. Resolve one target and requirement contract shared by both activities.
2. Complete and freeze the independent findings pass without consulting supplied feedback.
3. Assess each supplied feedback item separately.
4. Deduplicate only in the final synthesis. Preserve provenance: an independently discovered finding and an external comment remain distinguishable even when they describe the same defect.
5. Return one target record, separate findings/feedback sections, shared coverage gaps, and one verdict.

## Independent Finding Format

```markdown
### [Critical | High | Medium | Low] RV-<N>: Concise defect title

- Location: `path/to/file:line`
- Requirement / behavior: `R3`, Task 2, or exact stated behavior
- Evidence: exact code or diff behavior establishing the mismatch
- Impact: observable failure, regression, or risk
- Required correction: what must become true; do not apply the fix
- Approval: awaiting user approval
```

A finding is not a vague concern or optional style preference. It must identify a location, violated requirement or behavior, evidence, impact, and required correction.

## Feedback Assessment Format

```markdown
### FB-<N>: Concise feedback title

- Source / original target: reviewer or path; revision/snapshot when known
- Feedback: faithful technical restatement
- Classification: confirmed / rejected / unclear / out-of-scope
- Location: `path/to/file:line`, or unavailable
- Requirement / constraint: applicable requirement, contract, compatibility rule, or scope boundary
- Evidence: code and target evidence supporting the classification
- Impact: observable consequence if applicable
- Disposition: required correction, reasoned rejection, clarification needed, or separate future work
- Approval: awaiting user approval / not eligible for correction handoff
```

## Output Structure

```markdown
## Reviewed target

- Plan / criteria: ...
- Mode: review / assess-feedback / both
- Target mode: local / commit / ref
- Base: <name and resolved SHA, when applicable>
- Head: <name and resolved SHA>
- Local state: staged ..., unstaged ..., untracked ...
- Feedback provenance: absent / source and original target
- Coding report: absent / supplementary context only
- Reviewer: direct / one delegated reviewer, evidence-checked by parent

## Independent findings

[Independent findings, or "No material independent findings."]

## Feedback assessment

[Classified feedback items, or "No supplied feedback assessed."]

## Coverage gaps

- Requirement, area, or claim that could not be assessed, with the reason.

## Verdict

- No material findings / Changes required / Feedback rejected / Clarification required / Blocked

## Correction candidates

- Confirmed IDs awaiting explicit user approval; no fixes were applied.
```

## Review Style

Lead with findings ordered by severity. Preserve exact file paths, line numbers, symbols, API names, configuration keys, target identities, and relevant error text. Keep evidence and observable impact concrete. If there are no material findings, say so explicitly and still list coverage gaps.

## Correction Handoff

After the user explicitly approves exact `RV-*` or confirmed `FB-*` IDs, return a bounded handoff for a later `hero-coding` session:

```markdown
## Approved correction handoff

- Review source: chat result or `docs/reviews/...`
- Reviewed target: exact SHA(s) or recorded local snapshot
- Approved corrections: RV-2, FB-1
- Required outcomes: one concise outcome per approved ID
- Constraints: compatibility, interfaces, and scope that must remain true
- Excluded items: rejected, unclear, out-of-scope, and unapproved IDs
- Later assurance: independent re-review and/or unit testing still required
```

Do not include an item merely because it was confirmed. Do not automatically invoke `hero-coding`, edit a plan, or turn rejected/unclear/out-of-scope feedback into implementation work.

## Report Convention (on request)

hero-reviewing returns its result in chat and does not write a file automatically. If the user separately asks for a durable report, invoke `hero-report`; it writes `docs/reviews/YYYY-MM-DD-<slug>.md` from the already captured target identity and result without rerunning or reconstructing the review.

The report should preserve:
- Reviewed plan or acceptance criteria.
- Mode, feedback provenance, and exact target identity.
- Independent findings and feedback classifications using the schemas above.
- Coverage gaps, verdict, and correction candidates.
- Any exact correction IDs the user approved after the review.

## Definition of Done

- The intent, plan/criteria, and exact implementation target are identified.
- Every planned requirement/task in a fresh review is assessed or listed as a coverage gap.
- Every returned independent finding is evidence-backed and follows the finding schema.
- Every supplied feedback item is classified or explicitly blocked on clarification.
- Delegated candidate findings, if any, were checked against the actual target before being returned.
- The verdict and correction candidates are stated in chat.
- No code, tests, plan, report, `docs/ACTIVE_STATE.md`, verification evidence, or git state was modified by this review.
- No correction was treated as approved without the user's explicit approval of its exact ID.
- If a report was requested, it is a separate `hero-report` action using the captured result.

## Related Skills

- Reads the approved contract from `hero-planning` and the implementation produced by `hero-coding`.
- Hands only user-approved, confirmed correction IDs to a later `hero-coding` session; it never applies them itself.
- Complements `hero-unit-test`, which writes and runs tests in a separate session.
- Differs from `hero-mr-review`: this skill is plan/criteria-backed and can inspect local or committed implementation targets; `hero-mr-review` assesses a teammate's committed MR/ref against MR intent and repository conventions and always writes a standalone report.
- May recommend separate `hero-security` or `hero-strict` work, but does not perform it.
