---
name: hero-strict
description: Use when extra rigor is wanted before a "done" claim — runs a full verification pass across tests, build, impact analysis, and review
---

# Hero Strict

## Overview

hero-strict is an opt-in escalation, not a config setting. An earlier version of this workflow had a configured "verification level" (minimal/pragmatic/strict); hero-mmt-kit replaces that with an explicit skill invocation instead — the developer, or the agent when risk warrants it, decides per task whether to run the fuller checklist. hero-strict does not replace the other hero-* skills; it raises the bar on whichever ones already ran, re-checking their work with more evidence rather than doing new work from scratch.

## When to Use

Use this skill when:
- The change is high-risk or high-regression-cost: architecture changes, shared/core modules, API or data-model changes, security-sensitive surfaces.
- CI-like pre-merge verification is wanted before accepting a "done" claim.
- The user explicitly asks for a stricter check before merging or closing out work.

Skip it for small, low-risk changes. Running hero-strict on every task defeats its purpose as a deliberate escalation — a typo fix or a one-line config change does not need a full verification pass.

## Inputs

Whatever artifacts already exist for the current work:
- Planning artifact (`docs/plans/...`), if one was written.
- Coding report (`docs/coding-reports/...`).
- Review report (`docs/reviews/...`), if `hero-reviewing` ran.
- Test report (`docs/test-reports/...`), if `hero-unit-test` ran.

Missing artifacts are not a blocker — they're a gap to flag in step 4 of the process.

## Process

1. **Confirm what already ran.** Check which hero-* stages (planning, coding, review, test) touched this work and which artifacts exist. Don't assume — read them.
2. **Re-run or extend each stage's checks with a fuller bar:**
   - Full test suite, not just targeted/changed tests.
   - Lint, build, and typecheck, if the project has them.
   - `gitnexus_detect_changes` and `gitnexus_impact` on changed symbols, for code changes.
   - `doctor --strict` for hero-mmt-kit's own install health, when the change touches the kit itself.
3. **Use `verification-before-completion`'s discipline throughout**: don't claim a check passed unless you actually ran it and read the output. No inferring success from "it should work."
4. **Flag stages that should have run but didn't** — e.g. a risky change with no review. Either run the corresponding hero-* skill (`hero-reviewing`, `hero-unit-test`, `hero-security`) or note the gap explicitly; don't silently skip it.
5. **Summarize the strict pass** — what was checked, what passed, what didn't — and append it to whichever existing report is most relevant. Don't create a new report file for this.

## Output

A "Strict verification" section appended to the most relevant existing report (coding report, review report, or test report). hero-strict has no artifact convention of its own — it never produces a standalone file.

```markdown
## Strict verification

- Stages confirmed: planning / coding / review / test (present or missing)
- Full test suite: command + result
- Build / lint / typecheck: command + result
- gitnexus_detect_changes: result summary
- gitnexus_impact: risk level per changed symbol
- Gaps flagged: ...
- Verdict: Pass / Pass with follow-ups / Blocked
```

Strict verification style:
- Keep the section compact, evidence-first, and verdict-focused.
- Preserve exact commands, tool names, risk levels, counts, file paths, and failed checks.
- Do not shorten ambiguous gaps or blockers; write those in full clarity.

## Definition of Done

- Every check listed is backed by actual evidence — a command and its result — not an assumption.
- Any stage that should have run but didn't is explicitly called out, not silently skipped.
- Nothing is claimed "done" without evidence.
- The strict verification section is appended to the relevant report.

## ACTIVE_STATE.md Update

hero-strict doesn't own `currentSkill`/`nextAction` in `session.json` — those follow whichever skill invoked or preceded it (typically `hero-coding`, `hero-reviewing`, or `hero-unit-test`). If the strict pass surfaces new blockers, add them to the Blockers/Pending Actions section of `docs/ACTIVE_STATE.md`.

## Related Skills

Wraps `verification-before-completion` for its evidence discipline. Can trigger a re-run of `hero-unit-test`, `hero-reviewing`, or `hero-security` if a gap is found. Typically invoked after `hero-coding`, `hero-reviewing`, or `hero-unit-test` have already run once — see `using-hero` for the full skill map.
