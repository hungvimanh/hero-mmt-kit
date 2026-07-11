---
name: hero-reviewing
description: Use for a fresh-eyes check of an implementation against its plan, before merge
---

# Hero Reviewing

## Overview

hero-reviewing is a separate, fresh-eyes read of the planning artifact, the coding report, and the actual changed code — checking that the implementation really does what was agreed, before the work is considered mergeable. It is a review pass, not a testing pass: it does not write or run unit tests. That belongs to `hero-unit-test`, which is a parallel, independent stage.

**Core principle:** don't trust the chat transcript or the "done" claim — read the artifacts and the diff, and verify the plan and the code actually agree.

## When to Use

Use this skill after `hero-coding` completes, before merge or handover.

- Optional for trivial, single-file, low-risk changes (typo fixes, copy tweaks, config values).
- Expected for Standard-or-larger changes: behavior changes to existing code, refactors, new features, anything with more than one plausible way to implement it.
- Also reach for it whenever the coding report is thin, the diff is larger than expected, or something about the change feels rushed.

## Inputs

Read artifact-first, not the whole conversation history:
1. The planning artifact (`docs/plans/YYYY-MM-DD-slug.md`), if one exists.
2. The coding report (`docs/coding-reports/YYYY-MM-DD-slug.md`).
3. The actual changed code / diff — the source of truth, not the report's description of it.
4. Existing project conventions and any prior review notes on the same area.

If the plan artifact doesn't exist (small change that skipped planning), review the diff against the stated intent in the coding report instead, and note that no plan was reviewed against.

## Process

1. Read the planning artifact, the execution report, and the changed code. Do not rely on the chat transcript for what happened — the artifacts are the record.
2. Check build success, syntax, and adherence to project conventions (naming, structure, existing patterns in the touched files).
3. Check whether the implementation actually matches the plan: every planned step done, no silent scope cuts, no undocumented deviations. Flag anything the plan promised that the code doesn't deliver, and anything the code does that the plan didn't mention.
4. If delegating the review to a sub-agent, use the vendored `requesting-code-review` skill's prompt structure so the sub-agent has the right context and scope. If you are the one receiving findings back, follow `receiving-code-review` discipline: fix Critical/Important findings before proceeding, re-review only the fix or the disputed finding (don't re-review the whole diff) unless scope expanded, and push back on findings you believe are incorrect with evidence rather than accepting them by default.
5. Do not write or run unit tests in this phase — that's `hero-unit-test`'s job, not this skill's.
6. State findings and a clear verdict in chat: pass, pass with follow-ups, or blocked. Don't write a report file by default — see Report Convention below.

## Report Convention (on request)

hero-reviewing does not write a report file automatically. If the user asks for a written report, invoke the `hero-report` skill — it writes to `docs/reviews/YYYY-MM-DD-<slug>.md` using the contract below.

Report should cover: findings plus a verdict.

Review style:
- Keep it concise: what was reviewed, what was found, what remains open.
- Use finding bullets with severity, file/path, issue, evidence, and required action.
- Do not compress code names, paths, commands, exact errors, or line references.
- Use full clarity for security issues, destructive fixes, or blocking findings.

## Definition of Done

- Findings are stated with a clear verdict (pass / pass with follow-ups / blocked), at minimum in chat.
- Blocking issues are either resolved, or explicitly deferred with an owner and a stated reason — never silently dropped.
- If a report was requested, it was written via `hero-report` at the path above.

## ACTIVE_STATE.md Update

- Update the Active Features row's status in `docs/ACTIVE_STATE.md` to reflect the review verdict. Link the review report only if `hero-report` wrote one.

## Related Skills

- Wraps the vendored `requesting-code-review` and `receiving-code-review` skills — this skill is the hero-shaped wrapper around their discipline, not a replacement for it.
- Reads output from `hero-planning` (the plan) and `hero-coding` (the report and diff).
- May recommend a separate `hero-security` pass if the review surfaces a sensitive-surface concern (auth, data, secrets, external input, AI/LLM behavior).
- Complements `hero-unit-test`: the two are a parallel, independent stage — neither is a prerequisite for the other.
- Use `hero-report` on request to write the review report.
