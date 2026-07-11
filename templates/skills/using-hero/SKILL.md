---
name: using-hero
description: Use when starting any coding-assistant task in this project — routes to the right hero-* skill for the current stage of work and explains how session state carries across sessions
---

# Using Hero

## Overview

hero-mmt-kit is a human-led workflow: the developer decides what to work on and which skill to invoke next. There is no router doc and no automatic phase gate — this skill is the map, not a controller. Invoke `using-hero` whenever it's unclear which skill applies next.

## The core skills

| Skill | Use when | Output artifact |
|---|---|---|
| `hero-planning` | Starting new work — a feature, bugfix, or refactor that needs a plan before code changes. | `docs/plans/YYYY-MM-DD-slug.md` |
| `hero-coding` | Implementing an approved plan (or a small change that doesn't need one). | `docs/coding-reports/YYYY-MM-DD-slug.md` |
| `hero-reviewing` | Fresh-eyes check of an implementation against its plan, before merge. | `docs/reviews/YYYY-MM-DD-slug.md` |
| `hero-unit-test` | Verifying implementation correctness — TDD-first or post-implementation. | `docs/test-reports/YYYY-MM-DD-slug.md` |
| `hero-security` | The change touches a sensitive surface (auth, data, secrets, external input, AI/LLM behavior). | Findings recorded in the invoking report. |
| `hero-strict` | Extra rigor is wanted before a "done" claim — a full verification pass. | n/a — appends to the current report. |

A typical flow is `hero-planning` → `hero-coding` → `hero-unit-test` and/or `hero-reviewing` → (`hero-security` if a sensitive surface was touched) → done. Skip stages that don't fit the size of the change — a one-line typo fix doesn't need a plan artifact.

## Session state

`.hero-mmt-kit/session.json` is a small resume pointer: `currentSkill`, `lastCheckpoint`, `resumePath`, `nextAction`, `updatedAt`. Each hero-* skill's Definition of Done includes writing this file plus updating `docs/ACTIVE_STATE.md`.

Resuming work in a fresh session:
1. Read `.hero-mmt-kit/session.json` (~100 tokens) → `currentSkill`, `resumePath`, `nextAction`.
2. Read the artifact at `resumePath` for concrete next steps.
3. If session.json is blank/stale, read `docs/ACTIVE_STATE.md`'s Active Features table instead.

## Related vendored skills

The hero-* skills wrap general-purpose technique skills rather than duplicate them: `brainstorming`, `writing-plans`, `executing-plans`, `test-driven-development`, `systematic-debugging`, `verification-before-completion`, `requesting-code-review`, `receiving-code-review`, `dispatching-parallel-agents`, `subagent-driven-development`, `using-git-worktrees`, `finishing-a-development-branch`, `security-review`. Each hero-* skill names the vendored skill(s) it invokes.

## Output Style

Hero workflow artifacts should be concise by default: compress prose scaffolding, keep every technical fact.

Use this rule for chat summaries and generated artifacts:
- Drop filler, pleasantries, and self-reference.
- Prefer tight bullets over long explanation.
- Keep code, commands, API names, error strings, file paths, and numbers verbatim.
- Preserve the user's language.
- Do not compress safety-critical content: security warnings, irreversible/destructive actions, production changes, or ambiguous multi-step instructions need full clarity.

## Rules

- Don't run heavy ceremony for small tasks — a Tiny fix (typo, trivial config) can go straight to `hero-coding` with no plan artifact.
- Don't claim work is done without the relevant skill's Definition of Done being met.
- Keep `docs/ACTIVE_STATE.md` as the durable index — link to artifacts, don't duplicate their content there.
- Write artifact updates in concise-output style: short prose, full evidence, no lost technical detail.
