# Code Quality Reviewer Prompt Template

Use this thin adapter when a review budget calls for one implementation-quality reviewer. The canonical review contract and finding schema live in `hero-reviewing`; do not duplicate or broaden them here.

**Only dispatch after the implementation target is stable enough to identify an explicit base and head.**

```text
Task tool (general-purpose):
  model: [MODEL - explicit, do not omit. See SKILL.md Model Selection.]
  prompt: |
    Invoke `hero-reviewing` with:

      MODE=review
      REVIEWER=direct
      PLAN_PATH=[plan file, or use the exact task/acceptance criteria below]
      TARGET=ref:[HEAD_SHA]
      BASE_REF=[BASE_SHA]

    Exact task / acceptance criteria:
      [TASK N FROM PLAN OR BOUNDED REQUIREMENTS]

    Supplemental review package:
      [DIFF_FILE from `bash scripts/review-package.sh BASE_SHA HEAD_SHA`]

    Follow `hero-reviewing`'s read-only, findings-only boundary. Do not edit files,
    run build/lint/typecheck/tests/coverage, change git state, apply fixes, or
    dispatch another reviewer. Read the actual target code and relevant unchanged
    callers/contracts; the review package and implementer's report are context,
    not substitutes for the repository.
```

**Do Not Trust the Report:** The implementer's self-report and rationale are unverified claims. Verify every returned finding against the diff, resulting code, requirements, and relevant surrounding contracts.

**Reviewer returns:** reviewed target, evidence-backed findings, coverage gaps, verdict, and correction candidates awaiting user approval, using the `hero-reviewing` schema.
