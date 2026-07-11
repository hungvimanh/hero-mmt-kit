# Code Quality Reviewer Prompt Template

Use this template when dispatching a code quality reviewer subagent.

**Purpose:** Verify implementation is well-built (clean, tested, maintainable)

**Only dispatch after spec compliance review passes.**

```
Task tool (general-purpose):
  Use template at requesting-code-review/code-reviewer.md
  model: [MODEL - explicit, do not omit. See SKILL.md Model Selection.]

  DESCRIPTION: [task summary, from implementer's report]
  PLAN_OR_REQUIREMENTS: Task N from [plan-file]
  BASE_SHA: [commit before task]
  HEAD_SHA: [current commit]
  DIFF_FILE: [PATH from `bash scripts/review-package.sh BASE_SHA HEAD_SHA` - read
    this instead of re-deriving the diff]
```

**Do Not Trust the Report:** The implementer's self-report and any rationale they give
for a decision are unverified claims, not facts. Verify against `DIFF_FILE` and the
actual code — don't accept "I did it this way because..." at face value.

**In addition to standard code quality concerns, the reviewer should check:**
- Does each file have one clear responsibility with a well-defined interface?
- Are units decomposed so they can be understood and tested independently?
- Is the implementation following the file structure from the plan?
- Did this implementation create new files that are already large, or significantly grow existing files? (Don't flag pre-existing file sizes — focus on what this change contributed.)

**Code reviewer returns:** Strengths, Issues (Critical/Important/Minor), ⚠️ Cannot
verify from diff (requirement + why — the controller resolves these, not the
reviewer), Assessment
