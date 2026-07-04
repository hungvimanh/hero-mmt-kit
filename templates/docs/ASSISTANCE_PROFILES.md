# Assistance Profiles

This document defines the active operating profile for this project. It is the canonical reference for profile, surface, verification, and per-task override rules.

## Active config

| Setting | Active value |
|---|---|
| Assistance profile | {{ASSISTANCE_PROFILE_LABEL}} (`{{ASSISTANCE_PROFILE}}`) |
| Project surface | {{PROJECT_SURFACE_LABEL}} (`{{PROJECT_SURFACE}}`) |
| Verification level | {{VERIFICATION_LEVEL}} |

## Assistance profile

| Profile | Meaning | Default posture |
|---|---|---|
| Vibecode (`vibecode`) | High-agency AI development where the agent owns routing, gates, implementation, review, and evidence unless the user overrides. | More autonomous; uses sub-agents and delegated review when risk, scope, or parallel work justifies them. |
| Coding Assistant (`coding-assistant`) | Human-led development where the agent assists, proposes, implements bounded edits, and keeps the developer in the final review loop. | Pragmatic by default; normal tasks use direct implementation, targeted checks, and explicit developer-review handoff. |

## Project surface

| Surface | Use when | Routing emphasis |
|---|---|---|
| Fullstack (`fullstack`) | The project can touch UI, API/backend, data, deployment, or cross-layer contracts. | Lock interface contracts before parallel FE/BE work; apply frontend and backend checks when touched. |
| Backend (`backend`) | The project primarily changes services, APIs, data, infra, CLIs, or jobs. | Emphasize contracts, data safety, authz, migrations, performance, and API consumers. |
| Frontend (`frontend`) | The project primarily changes UI, state, client routing, design systems, or browser/mobile behavior. | Emphasize design standards, accessibility, responsive states, visual QA, and API contract expectations. |

## Verification level

| Level | Completion evidence |
|---|---|
| Strict (`strict`) | Run relevant tests, lint/typecheck/build where configured, plus review/QA expected by the active workflow path. Missing commands need an explicit not-run reason. |
| Pragmatic (`pragmatic`) | Run the most relevant targeted checks for the changed surface, plus broader checks when risk is meaningful or behavior changed. State any skipped checks. |
| Minimal (`minimal`) | Run the smallest credible check for low-risk work. If no command is useful, provide a concise manual rationale and mark unverified areas. |

Verification level changes how much evidence is required; it does not remove the need to classify the task, respect gates, or avoid false completion claims. Review/sub-agent use is separate from skill availability: installing review skills does not make every task require delegated review.

## Bundled process skills

`init` installs a selected subset of bundled process skills into `.claude/skills/` from the active config above. Optional design/taste, GitNexus, and Serena capabilities are not redistributed as bundled skills; they remain referenced or installed from their original sources.

| Active config | Bundled process skills installed |
|---|---|
| All profiles | Baseline process skills: `using-superpowers`, `brainstorming`, `writing-plans`, `executing-plans`, `systematic-debugging`, `verification-before-completion`, `phase-handoff`. |
| Verification `strict` | Adds `test-driven-development`, `requesting-code-review`, and `receiving-code-review`. |
| Surface `fullstack` | Adds `dispatching-parallel-agents` and `subagent-driven-development` for cross-layer coordination. |
| Profile `vibecode` | Installs the full bundled process suite, making review, delegation, worktree, and branch-finishing skills available when the adaptive workflow calls for them. |

`update` refreshes the selected skills for the current config. It preserves existing unselected skill directories because they may be user-added or intentionally retained. To shrink an older project that was initialized before selective installation, delete unwanted skill directories manually after review.

## Adaptive review budget

This is the canonical definition of the review-budget tiers. Other docs and skills (e.g. `TEAM_ROSTER.md` §3, the `subagent-driven-development` skill) apply or extend this table by path/profile — they do not redefine it.

Use the smallest review budget that supports the completion claim:

| Budget | Use when | Evidence |
|---|---|---|
| `none` | Low-risk, localized work with clear targeted checks. | Main-agent self-review, targeted verification, and explicit verified/unverified handoff. |
| `single-combined-review` | Medium-risk behavior change, moderate diff, or uncertainty about fit/quality. | One reviewer checks requirements, correctness, tests/docs, and overengineering. |
| `targeted-specialist-review` | Specific sensitive or technical risk exists. | Security, performance, API/data, UI/accessibility, or other specialist review for that risk. |
| `full-multi-stage-review` | HIGH/CRITICAL, broad multi-area work, or user asks for full process. | Separate acceptance/spec and quality/security review only when each pass has a distinct purpose. |

Do not run final review over the same scope already covered by an earlier reviewer. Use final integration review only for multiple independent task streams, high-risk/core changes, or narrow prior reviews.

## Per-task overrides

A user may override the active profile for one task, for example: "use strict verification", "treat this as Vibecode", or "keep this minimal".

Rules:
1. Record the override in the plan or final report for that task.
2. Overrides can make gates, delegation, or verification stricter immediately.
3. Overrides that make the workflow less strict are allowed only for low-risk work; never use them to bypass security review, HIGH/CRITICAL impact warnings, required user approval, or required verification evidence for changed behavior.
4. When the override conflicts with [AGENCY_WORKFLOW.md](./AGENCY_WORKFLOW.md), follow the stricter rule unless the user explicitly accepts the risk.

## Related files

- [AGENCY_WORKFLOW.md](./AGENCY_WORKFLOW.md) — routing, gates, and profile overlay.
- [TEAM_ROSTER.md](./TEAM_ROSTER.md) — profile-aware delegation rules.
- [DEFINITION_OF_DONE.md](./DEFINITION_OF_DONE.md) — verification evidence by path and level.
