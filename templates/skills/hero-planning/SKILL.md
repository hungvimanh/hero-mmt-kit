---
name: hero-planning
description: Use when starting new work — a feature, bugfix, or refactor that needs a plan before code changes
---

# Hero Planning

## Overview

hero-planning turns a request into an agreed, written plan before any code changes. It is the entry point for anything bigger than a trivial fix — the moment where scope, approach, and risk get worked out with the human instead of guessed at mid-implementation.

## When to Use

Use this skill when:
- Starting a new feature.
- Fixing a bug that needs more than a one-line change.
- Planning a refactor.
- The approach isn't obvious and is worth agreeing on before touching code.

Skip it for typo fixes, trivial config edits, or an obvious one-file change — those can go straight to `hero-coding` with no plan artifact.

## Inputs

- The user's request or brief.
- Existing codebase context — use GitNexus (`gitnexus_query`, `gitnexus_context`, `gitnexus_impact`) or Serena when available to understand what's already there; don't block on them if they aren't.
- Any existing state to resume from: `docs/ACTIVE_STATE.md`'s Active Features table.

## Process

1. **Brainstorm with the human first.** Invoke the vendored `brainstorming` skill to clarify goals, requirements, constraints, edge cases, and open questions before writing anything down. Don't skip this by guessing at intent — surface ambiguity and resolve it in conversation.
2. **Assess blast radius for existing-behavior changes.** For refactors or changes to existing behavior, run `gitnexus_impact` (upstream) if GitNexus is available, and report the blast radius — direct callers, affected processes, risk level — before proceeding.
3. **Write the plan.** Use the vendored `writing-plans` skill's structure to produce: scope, approach, files/areas touched, risks, and a step-by-step breakdown. Save it to the artifact path below (this matches `writing-plans`' own default save path). Skip its "Execution Handoff" step-choice prompt entirely — that prompt does not apply inside hero-planning.
4. **Exit plan mode and stop — do not ask to implement.** Once the plan file is written and self-reviewed, exit plan mode (e.g. via `ExitPlanMode`) purely so the human can read the saved file in a normal turn. Report the saved path and stop. Do not ask "should I proceed to implement?", do not treat exiting plan mode as approval to start coding, and do not invoke `hero-coding` automatically. The human reviews the file on their own and comes back with edits, or their own explicit go-ahead, when ready.

## Output Artifact

`docs/plans/YYYY-MM-DD-<slug>.md` — lowercase kebab-case slug matching the work item.

Plan writing style:
- Be concise but complete: scope, approach, touched files, risks, and steps must remain explicit.
- Use bullets and checklists over prose where possible.
- Preserve exact file paths, commands, APIs, config keys, and risk labels.
- Use full clarity for ambiguous sequencing, destructive actions, or security-sensitive steps.

## Definition of Done

- The plan covers scope, approach, touched files, risks, and a step-by-step breakdown.
- The plan is saved at the artifact path above (not `writing-plans`' default location).
- Plan mode has been exited without asking the human to approve implementation — the plan is left for the human to review and request changes to on their own terms.

## ACTIVE_STATE.md Update

- Add or update this work item's row in the Active Features table in `docs/ACTIVE_STATE.md`: path, current phase, status, and a link to the plan file.

## Related Skills

- Wraps the vendored `brainstorming` skill (requirements/edge-case discovery with the human) and `writing-plans` skill (plan structure).
- Hands off to `hero-coding` only when the human explicitly asks to implement — never automatically right after the plan is saved.
- For refactors, lean on `gitnexus_impact` and `gitnexus_rename` during planning and later execution.
