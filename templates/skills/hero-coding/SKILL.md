---
name: hero-coding
description: Use when implementing an approved plan from hero-planning, or making a small change that doesn't need a plan
---

# Hero Coding

## Overview

hero-coding is the implementation stage — it turns an approved plan into working code and produces a written record of what changed and why. It does not replace review or testing; it answers: "What did I build, how do I know it works, and where does it deviate from the plan?"

## When to Use

Use this skill when:
- `hero-planning` has produced an approved plan and it's time to implement it.
- The change is small or obvious enough (Tiny/Fast-sized work) that a full plan artifact would be pure overhead — go straight here.

## Inputs

Read artifact-first:
1. The plan artifact in `docs/plans/` (if one exists).
2. Any existing test plan or acceptance criteria.
3. The current codebase state relevant to the change.

If there's no plan artifact, proceed on the strength of the request itself and note that in the coding report.

## Process

1. Read the plan artifact fully before starting (if one exists). Don't begin editing from a partial read.
2. Implement using the vendored `executing-plans` skill's discipline: work through tasks in bite-sized steps, run the verification each task specifies, and mark tasks complete as you go rather than at the end.
3. For independent or parallel work streams, use the vendored `subagent-driven-development` and `dispatching-parallel-agents` skills to delegate. Keep dependent work sequential; only fan out work that has no shared state or ordering constraint.
4. If unexpected bugs surface mid-implementation, switch to the vendored `systematic-debugging` skill instead of guessing at fixes.
5. Run relevant verification — build, lint, targeted tests — as you go, not only at the end. Catching a break right after the edit that caused it is cheaper than catching it after ten more edits.
6. Write an execution report describing what changed, the evidence collected, and any remaining risks or deviations from the plan.

## Output Artifact

`docs/coding-reports/YYYY-MM-DD-<slug>.md` — use the same slug as the originating plan when one exists, so the two artifacts pair up.

Report should cover:
- What changed (files, symbols, behavior) and why.
- Evidence: commands run and what they showed (build/lint/test output, manual checks).
- Deviations from the plan, if any, and the reasoning behind them.
- Open risks or follow-ups for review/testing to pick up.

Report style:
- Keep the report tight: no narrative scaffolding, no "I did..." filler.
- Preserve all technical evidence verbatim: commands, output summaries, file paths, symbols, errors, numbers.
- Use concise bullets for changed files, evidence, deviations, and risks.
- Use full prose only where brevity could hide a risk, deviation, or irreversible action.

## Definition of Done

- Implementation matches the plan, or deviations are documented and explained.
- Evidence of correctness is recorded — not just "tests pass" but which commands were run and what they showed.
- The coding report is saved at the artifact path above.

## ACTIVE_STATE.md Update

- Update the Active Features row's status/phase in `docs/ACTIVE_STATE.md` to reflect coding is complete.
- Write `.hero-mmt-kit/session.json` with `currentSkill: "hero-coding"`, `resumePath` pointing at the coding report, `nextAction` (typically `"review"` or `"test"`), and `lastCheckpoint`/`updatedAt` set to the current ISO timestamp.

## Related Skills

This skill wraps the vendored `executing-plans`, `subagent-driven-development`, `dispatching-parallel-agents`, and `systematic-debugging` skills rather than duplicating their content.

- Reads its input from `hero-planning`.
- Hands off to `hero-reviewing` and/or `hero-unit-test` next.
- Escalate to `hero-security` if the change touched a sensitive surface (auth, data, secrets, external input, AI/LLM behavior).
