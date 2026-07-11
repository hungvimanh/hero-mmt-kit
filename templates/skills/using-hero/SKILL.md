---
name: using-hero
description: Use when starting any coding-assistant task in this project — routes to the right hero-* skill for the current stage of work and explains how workflow state carries across sessions
---

# Using Hero

## Overview

hero-mmt-kit is a human-led workflow: the developer decides what to work on and which skill to invoke next. There is no router doc and no automatic phase gate — this skill is the map, not a controller. Invoke `using-hero` whenever it's unclear which skill applies next.

## The core skills

| Skill | Use when | Report (on request via `hero-report`) |
|---|---|---|
| `hero-planning` | Starting new work — a feature, bugfix, or refactor that needs a plan before code changes. | `docs/plans/YYYY-MM-DD-slug.md` — always written (it's the deliverable, not a report) |
| `hero-coding` | Implementing an approved plan (or a small change that doesn't need one). | `docs/coding-reports/YYYY-MM-DD-slug.md` |
| `hero-reviewing` | Fresh-eyes check of an implementation against its plan, before merge. | `docs/reviews/YYYY-MM-DD-slug.md` |
| `hero-unit-test` | Verifying implementation correctness — TDD-first or post-implementation. | `docs/test-reports/YYYY-MM-DD-slug.md` |
| `hero-security` | The change touches a sensitive surface (auth, data, secrets, external input, AI/LLM behavior). | Findings appended to the invoking report, if one exists/was requested. |
| `hero-strict` | Extra rigor is wanted before a "done" claim — a full verification pass. | Appends to the current report, if one exists/was requested. |
| `hero-report` | A written report is actually wanted for a finished `hero-coding`/`hero-reviewing`/`hero-unit-test` phase. | Writes the report at the path the source skill defines. |

A typical flow is `hero-planning` → `hero-coding` → `hero-unit-test` and/or `hero-reviewing` → done. Invoke `hero-security` separately when you want a dedicated security pass. Skip stages that don't fit the size of the change — a one-line typo fix doesn't need a plan artifact.

`hero-planning`, `hero-coding`, `hero-reviewing`, and `hero-unit-test` are done per-phase, not gated into an automatic full pipeline — finishing one doesn't trigger the next; the developer decides what to invoke next.

## Report writing

`hero-coding`, `hero-reviewing`, and `hero-unit-test` end each phase with a concise chat summary, not a report file by default. If a written report is wanted, invoke `hero-report` — it writes to the path convention documented in the source skill's own SKILL.md. `hero-planning`'s plan file is the exception: it's the phase's actual deliverable (read by `hero-coding` and needed for approval), so it's always written, not on-demand.

## Session state

`docs/ACTIVE_STATE.md`'s Active Features table is the single source of durable workflow state — there is no separate session pointer file. It's injected into context automatically at the start of a session. Each hero-* skill's Definition of Done includes updating it.

Resuming work in a fresh session:
1. Check the injected Active Features context (or read `docs/ACTIVE_STATE.md` directly if it wasn't injected).
2. If a row names an artifact (plan/report), open it for concrete next steps.

## Related vendored skills

The hero-* skills wrap general-purpose technique skills rather than duplicate them: `brainstorming`, `writing-plans`, `executing-plans`, `test-driven-development`, `systematic-debugging`, `verification-before-completion`, `requesting-code-review`, `receiving-code-review`, `dispatching-parallel-agents`, `subagent-driven-development`, `using-git-worktrees`. `hero-security` is the standalone security review skill rather than a wrapper. Each hero-* skill names the vendored skill(s) it invokes.

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
