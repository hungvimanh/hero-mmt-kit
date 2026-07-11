---
name: requesting-code-review
description: Use when completing tasks, implementing major features, or before merging to verify work meets requirements
---

# Requesting Code Review

Dispatch a code reviewer subagent to catch issues before they cascade. The reviewer gets precisely crafted context for evaluation — never your session's history. This keeps the reviewer focused on the work product, not your thought process, and preserves your own context for continued work.

**Core principle:** Review when it changes the risk picture. Review is evidence, not ceremony.

## When to Request Review

**Mandatory:**
- HIGH/CRITICAL risk changes before completion
- Security-sensitive work when the touched surface can affect auth, data exposure, secrets, deployment, or AI safety
- Before merge to main when project policy requires it

**Optional but valuable:**
- Medium-risk behavior changes where one combined review can catch requirement or quality gaps
- When stuck (fresh perspective)
- Before risky refactoring (baseline check)
- After fixing a complex bug

**Usually skip:**
- Low-risk docs/config/localized changes with credible targeted checks
- A final review over the same scope already covered by a reviewer

## How to Request

**1. Get git SHAs:**
```bash
BASE_SHA=$(git rev-parse HEAD~1)  # or origin/main
HEAD_SHA=$(git rev-parse HEAD)
```

**2. Dispatch code reviewer subagent:**

Use Task tool with `general-purpose` type, fill template at `code-reviewer.md`

**Placeholders:**
- `{DESCRIPTION}` - Brief summary of what you built
- `{PLAN_OR_REQUIREMENTS}` - What it should do
- `{BASE_SHA}` - Starting commit
- `{HEAD_SHA}` - Ending commit

**3. Act on feedback:**
- Fix Critical issues immediately
- Fix Important issues before proceeding
- Note Minor issues for later
- Push back if reviewer is wrong (with reasoning)

## Example

```
[Just completed Task 2: Add verification function]

You: Let me request code review before proceeding.

BASE_SHA=$(git log --oneline | grep "Task 1" | head -1 | awk '{print $1}')
HEAD_SHA=$(git rev-parse HEAD)

[Dispatch code reviewer subagent]
  DESCRIPTION: Added verifyIndex() and repairIndex() with 4 issue types
  PLAN_OR_REQUIREMENTS: Task 2 from docs/superpowers/plans/deployment-plan.md
  BASE_SHA: a7981ec
  HEAD_SHA: 3df7661

[Subagent returns]:
  Strengths: Clean architecture, real tests
  Issues:
    Important: Missing progress indicators
    Minor: Magic number (100) for reporting interval
  Assessment: Ready to proceed

You: [Fix progress indicators]
[Continue to Task 3]
```

## Integration with Workflows

**Subagent-Driven Development:**
- Use the review budget selected by the workflow
- Prefer one combined or targeted reviewer unless risk justifies multi-stage review
- Re-review only fixes/findings unless scope expanded

**Executing Plans:**
- Review at natural checkpoints when risk or uncertainty warrants it
- Get feedback, apply, continue

**Ad-Hoc Development:**
- Review when risk, uncertainty, or merge policy warrants it
- Skip duplicate review for low-risk work already verified

## Red Flags

**Never:**
- Skip review for HIGH/CRITICAL or sensitive work because it is inconvenient
- Ignore Critical issues
- Proceed with unfixed Important issues
- Argue with valid technical feedback

**If reviewer wrong:**
- Push back with technical reasoning
- Show code/tests that prove it works
- Request clarification

See template at: requesting-code-review/code-reviewer.md
