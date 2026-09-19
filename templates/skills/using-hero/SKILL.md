---
name: using-hero
description: Use when starting any coding-assistant task in this project — routes to the right hero-* skill for the current stage of work and explains how workflow state carries across sessions
---

# Using Hero

## Overview

hero-mmt-kit is a human-led workflow: the developer decides what to work on and which skill to invoke next. There is no router doc and no automatic phase gate — this skill is the map, not a controller. Invoke `using-hero` whenever it's unclear which skill applies next.

## The core skills

| Skill | Use when | Artifact / report |
|---|---|---|
| `hero-planning` | Clarifying non-trivial work through analysis and brainstorming, then writing an implementation-only plan. | `docs/plans/YYYY-MM-DD-slug.md` — always written (it's the deliverable, not a report) |
| `hero-coding` | Implementing every task and requirement in an approved plan, or a small bounded request. No testing or self-review. | `docs/coding-reports/YYYY-MM-DD-slug.md` — on request |
| `hero-reviewing` | Single read-only entry point for a fresh implementation review, assessment of supplied review feedback, or an explicit combination of both. | `docs/reviews/YYYY-MM-DD-slug.md` — on request |
| `hero-unit-test` | Writing and running post-implementation unit tests from the approved requirements; no production-code fixes. | `docs/test-reports/YYYY-MM-DD-slug.md` — on request |
| `hero-security` | You want an independent OWASP + AI/LLM security review of a sensitive surface. | `docs/security-reports/YYYY-MM-DD-slug.md` — always written for the security pass. |
| `hero-mr-review` | Reviewing a teammate's committed merge request/ref against MR intent and repository conventions. | `docs/mr-reviews/YYYY-MM-DD-slug.md` — always written. |
| `hero-strict` | Extra rigor is wanted in a separate full verification session before a "done" claim. | Appends to the current report, if one exists/was requested. |
| `hero-report` | A written report is actually wanted for a finished `hero-coding`/`hero-reviewing`/`hero-unit-test` phase. | Writes the report at the path the source skill defines. |

A typical flow is `hero-planning` → `hero-coding` → `hero-unit-test` and/or `hero-reviewing` → done. Start each stage explicitly, preferably in a fresh session. The plan contains implementation work only; coding implements it only; unit testing writes/runs tests only; reviewing conducts a fresh review and/or assesses supplied feedback without fixing code or running tests. Confirmed review items require explicit user approval before a later `hero-coding` correction session. Invoke `hero-security` or `hero-strict` separately when their assurance depth is wanted. Skip stages that do not fit the size of the change.

Choose review by source of truth, not merely by whether a git ref exists:
- Use `hero-reviewing` when an implementation should be assessed against a Hero plan or explicit acceptance criteria, or when supplied review feedback needs technical validation. It can inspect local, exact-commit, or explicit-base ref targets and may use one internal fresh reviewer without requiring another user-facing skill.
- Use `hero-mr-review` for a teammate's committed MR/ref assessed against MR intent, repository conventions, impact, and potential bugs. It always writes its standalone report.

`hero-planning`, `hero-coding`, `hero-reviewing`, and `hero-unit-test` are independent stages, not an automatic pipeline. Finishing one never triggers the next. Generic vendored skills and delegated agents must inherit the active Hero stage's exclusions; they must not broaden its responsibility.

## Report writing

`hero-coding`, `hero-reviewing`, and `hero-unit-test` end each phase with a concise chat summary, not a report file by default. If a written report is wanted for those phases, invoke `hero-report` — it writes to the path convention documented in the source skill's own SKILL.md. `hero-planning`'s plan file is always written because it's the phase's deliverable. `hero-security` is also independent and always writes its own `docs/security-reports/...` artifact; do not replace that with an appended section in another report.

## Session state

`docs/ACTIVE_STATE.md`'s Active Features table is the single source of durable workflow state — there is no separate session pointer file. It's injected into context automatically at the start of a session. Update it only when a skill's contract calls for durable workflow metadata; read-only reviewing and test-only work must not create unrelated implementation changes merely to record progress.

Resuming work in a fresh session:
1. Check the injected Active Features context (or read `docs/ACTIVE_STATE.md` directly if it wasn't injected).
2. If a row names an artifact (plan/report), open it for concrete next steps.

## Related vendored skills

The kit also ships general-purpose technique skills: `brainstorming`, `executing-plans`, `test-driven-development`, `systematic-debugging`, `verification-before-completion`, `dispatching-parallel-agents`, `subagent-driven-development`, and `using-git-worktrees`. They remain available for direct use, but a Hero stage must not invoke a generic lifecycle whose mandatory actions cross that stage's hard boundary. `hero-planning`, `hero-coding`, `hero-reviewing`, `hero-unit-test`, and `hero-security` define their own stage contracts.

## Output Style

Hero workflow outputs inherit the project-wide `Response Style` in `CLAUDE.md`. Apply it to chat summaries, progress updates, plans, and reports.

Workflow-specific emphasis:
- Lead with the result or current status, then the evidence, then the next action or decision.
- Use plain wording in the user's language for prose and avoid unnecessary English code-switching.
- Keep code identifiers, commands, file paths, API names, configuration keys, exact errors, numbers, and necessary established technical terms verbatim. Do not translate technical tokens or invent awkward equivalents.
- Briefly explain a necessary specialized term in the user's language on first use.
- Make plans and reports actionable for their audience: use concrete labels and actions, identify targets or conditions where relevant, and explain unfamiliar acronyms.
- Be concise when the work is simple, but expand risks, blockers, uncertainty, destructive actions, production changes, and ambiguous multi-step instructions until the user can act safely.

## Rules

- Don't run heavy ceremony for small tasks — a Tiny fix (typo, trivial config) can go straight to `hero-coding` with no plan artifact.
- Don't claim work is done without the relevant skill's Definition of Done being met.
- Keep `docs/ACTIVE_STATE.md` as the durable index — link to artifacts, don't duplicate their content there.
- Write artifact updates using the Output Style above: concise where safe, complete where clarity requires it, with all evidence and technical facts preserved.
