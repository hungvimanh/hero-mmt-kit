---
name: hero-mr-review
description: Use when reviewing a teammate's merge request or commit before it merges — given a git ref (commit, tag, or branch), checks coding convention, the change's stated purpose, its impact on related code, and potential bugs, then writes a standalone review report
---

# Hero MR Review

## Overview

hero-mr-review is a standalone review skill for code someone else wrote. It is not part of the `hero-planning → hero-coding → hero-reviewing/hero-unit-test` pipeline, and it does not wrap `hero-reviewing` — that skill checks the *invoking developer's own* work against *their own* plan; this skill checks a *colleague's* merge request against the codebase's conventions, the change's own stated intent, and its blast radius. Invoke it directly, on demand, whenever a teammate's MR needs a second pair of eyes before merge.

**Core principle:** review the diff, not the description. Every finding needs file:line evidence from the actual change — not a restatement of the commit message or an assumption about what the code "probably" does.

## When to Use

Use this skill when:
- A teammate has pushed commits and opened (or is about to open) a merge/pull request, and you need to review it before it merges.
- The user gives a commit SHA, tag, or branch name and asks for a review of "that MR" or "that commit."

Not for reviewing your own in-progress work — use `hero-reviewing` for that (it reads your plan and coding report as the source of truth; this skill has neither).

## Inputs

1. **The MR ref** — a commit SHA, tag, or branch name identifying the tip of the MR. Required; ask for it if not given.
2. **The base ref** — what the MR merges into. Default to the repo's detected primary branch (`git symbolic-ref refs/remotes/origin/HEAD`, falling back to `main` or `master`) unless the user names a different base.
3. Any MR/PR description or linked issue the user provides — useful for cross-checking stated intent against actual diff, but not required; the commit messages and diff are the primary source of truth if no description exists.
4. Existing project conventions — naming, structure, and patterns already established in the files the MR touches.

## Process

1. **Resolve the diff.** Confirm both refs resolve (`git rev-parse`), then get the merge-base diff (`git diff <base>...<mr-ref>`) and the commit log (`git log <base>..<mr-ref>`) for the touched range. Do not review uncommitted/working-tree state — this skill reviews what was actually committed.
2. **Establish the stated purpose.** Read the commit messages and any MR description given. Summarize in one or two sentences what the change claims to do.
3. **Check coding convention.** Compare the diff against the existing patterns in the touched files and directories: naming, structure, error handling style, import/module conventions, formatting. Flag deviations with the file:line and what convention it breaks.
4. **Check purpose-fit.** Does the diff actually do what the commit messages/description claim — no more, no less? Flag scope creep (unrelated changes bundled in) and silent gaps (claimed behavior the diff doesn't deliver).
5. **Run impact analysis.** For each non-trivial changed symbol, if GitNexus MCP tools are connected, run `gitnexus_detect_changes` (or `gitnexus_impact` per symbol) to find callers, affected execution flows, and risk level; report HIGH/CRITICAL risk explicitly. If GitNexus isn't available, search for call sites/usages manually (grep/references) and note what was and wasn't checked.
6. **Scan for potential bugs.** Read the actual diff hunks for logic errors, missed edge cases, unhandled error paths, off-by-one issues, resource leaks, race conditions, and anything that would only surface at runtime. This is a correctness pass, not a security audit — if the MR touches a sensitive surface (auth, secrets, external input, payments, AI/LLM behavior), say so and recommend a separate `hero-security` pass instead of trying to cover it here.
7. **Compose findings.** Every finding gets: severity, file:line, what's wrong, the evidence (the actual line(s) from the diff), and a concrete suggested fix or improvement — not just "this looks off."
8. **Assign a verdict:** `Approve`, `Approve with suggestions`, or `Request changes`. `Request changes` for any correctness bug, convention violation with real consequences, or unexplained purpose/diff mismatch; `Approve with suggestions` for optional improvements that don't block merge; `Approve` when nothing material was found.
9. **Write the report** (see Output Artifact) and state the verdict and report path in chat.

## Output Artifact

`docs/mr-reviews/YYYY-MM-DD-<slug>.md` — always written; this is the deliverable, not an on-request extra. Slug is the reviewed branch name (sanitized to kebab-case) if known, otherwise the short commit SHA of the MR ref.

```markdown
# MR Review: <mr-ref> → <base-ref>

**Date:** YYYY-MM-DD
**Author:** <from git log, if available>
**Verdict:** Approve / Approve with suggestions / Request changes

## Purpose
<one to two sentences: what the MR claims to do>

## Findings

### Coding Convention
- [Severity] file:line — issue. Evidence: `<diff line>`. Suggested fix: ...

### Purpose Fit
- [Severity] file:line — issue. Evidence: `<diff line>`. Suggested fix: ...

### Impact
- Affected callers/flows (via gitnexus_impact/gitnexus_detect_changes, or manual search if GitNexus unavailable). Risk level per changed symbol.

### Potential Bugs
- [Severity] file:line — issue. Evidence: `<diff line>`. Suggested fix: ...

## Recommendation
<verdict restated with the one or two things that would flip it, if not a clean Approve>
```

If a section has no findings, say so explicitly ("no convention deviations found") rather than omitting the heading — an omitted section reads as "not reviewed."

Report style:
- Keep it concise and easy to scan: short bullets, not paragraphs.
- Every finding needs evidence — the actual code/diff line, not a paraphrase.
- Preserve exact file paths, line numbers, symbol names, commands, and error strings verbatim.
- Use full clarity (no compression) for anything that could break production or that you're recommending block the merge.

## Definition of Done

- The diff was actually read — findings cite real file:line evidence, not the commit message or MR description alone.
- All four criteria (convention, purpose-fit, impact, potential bugs) were checked, or explicitly marked "not reviewed" with a reason (e.g., GitNexus unavailable and manual search was out of scope).
- Every finding has a suggested fix or improvement, not just a description of the problem.
- The verdict is stated with the reasoning that drives it.
- Report is saved at `docs/mr-reviews/YYYY-MM-DD-<slug>.md`, and the verdict + path are stated in chat.

## ACTIVE_STATE.md Update

Only if the MR corresponds to a row already tracked in `docs/ACTIVE_STATE.md`'s Active Features table — link the review report there. Most MR reviews are for someone else's work and won't have a matching row; skip this step when there isn't one.

## Related Skills

- Independent of the `hero-planning`/`hero-coding`/`hero-reviewing`/`hero-unit-test` pipeline — never invoked as part of it, and doesn't read their artifacts.
- Recommend a separate `hero-security` pass if the MR touches a sensitive surface (auth, secrets, external input, payments, AI/LLM behavior) instead of trying to cover security depth here.
- Recommend `hero-strict` if the MR is high-risk (architecture, shared/core modules, data model) and needs a fuller verification pass beyond this review.
