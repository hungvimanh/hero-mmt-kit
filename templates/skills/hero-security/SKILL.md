---
name: hero-security
description: Use when the change touches a sensitive surface — auth, data handling, secrets, external input, or AI/LLM behavior — to run a focused security review
---

# Hero Security

## Overview

hero-security is a thin dispatcher. It decides whether a security pass is needed and when to run it in the workflow, then hands off to the `security-review` skill for the actual OWASP checklist and process. It does not duplicate that checklist here — read `security-review`'s SKILL.md for the review content itself.

## When to Use

Use when the change touches:
- Authentication, authorization, sessions, or permissions.
- Secrets, payments, or personal data.
- Tenant isolation, uploads, or file paths.
- Network calls, webhooks, or deployment/infra.
- AI/LLM behavior — prompt construction, tool use, retrieval, or generated code.

Typically triggered from `hero-coding` or `hero-reviewing` once a sensitive surface is identified in the work, or explicitly requested by the user. If none of the above applies, say so and skip the full review.

## Inputs

- The plan and/or coding report for the current work.
- The changed code / diff.
- `docs/SECURITY_STANDARDS.md` for project-level security policy and standards.

## Process

1. Confirm the surface is actually sensitive (see When to Use). If not, state that and skip the full review — don't run it as ceremony.
2. Read `docs/SECURITY_STANDARDS.md` for any project-specific policy that applies to this surface.
3. Invoke the `security-review` skill to run its OWASP Web Top 10 + AI/LLM checklist against the changed code and artifacts.
4. Record findings and a verdict (pass / pass with follow-ups / blocked) back into the invoking report — the coding report or review report currently in progress.
5. If any Critical/High findings exist, they must be fixed or explicitly accepted with a documented reason before the work is considered done.

## Output

Findings are appended to the invoking report (`docs/coding-reports/...` or `docs/reviews/...`). hero-security has no artifact convention of its own — it never creates a standalone security report file.

Security finding style:
- Do not over-compress risk explanations.
- Keep severity, affected surface, exploit path, evidence, and required fix explicit.
- Preserve exact endpoints, paths, auth scopes, secret names, headers, API names, and error strings.
- Concision never outranks safety clarity.

## Definition of Done

- No unresolved Critical/High findings remain: each is either fixed or explicitly accepted with a documented reason.
- Findings and verdict are recorded in the invoking report.

## ACTIVE_STATE.md Update

- If a finding blocks the work, add it to the Blockers/Pending Actions section of `docs/ACTIVE_STATE.md`.
- `.hero-mmt-kit/session.json`'s `currentSkill`/`nextAction` follow whichever skill invoked hero-security — this skill does not own its own session state.

## Related Skills

- Wraps `security-review` for the actual checklist and review process.
- Points at `docs/SECURITY_STANDARDS.md` for project-level policy and standards.
- Typically invoked from `hero-coding` or `hero-reviewing`.
