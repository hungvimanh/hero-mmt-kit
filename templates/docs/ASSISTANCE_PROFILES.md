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
| Vibecode (`vibecode`) | High-agency AI development where the user gives the brief or idea and the AI team owns clarification, routing, planning, implementation, testing, SQA/review, and evidence unless blocked. | Professional software-company posture: clarify ambiguity, coordinate specialists, produce artifacts, and report decisions/evidence proactively. |
| Coding Assistant (`coding-assistant`) | Human-led development where the developer owns orchestration and invokes the agent through explicit planning, executing, review, and testing phases. | Pragmatic by default; the agent brainstorms and implements bounded phase work, then hands back developer-readable artifacts and evidence. |

## Project surface

Vibecode does not ask for a surface. It treats the project as full-lifecycle/fullstack by default so the AI team can coordinate product, design, backend, frontend, testing, and SQA as needed.

Coding Assistant asks for the project surface because the human developer is choosing which phase checks and optional taste/design skills should be active.

| Surface | Use when | Routing emphasis |
|---|---|---|
| Fullstack (`fullstack`) | The project can touch UI, API/backend, data, deployment, or cross-layer contracts. | Lock interface contracts before parallel FE/BE work; apply frontend and backend checks when touched. |
| Backend (`backend`) | The project primarily changes services, APIs, data, infra, CLIs, or jobs. | Emphasize contracts, data safety, authz, migrations, performance, and API consumers. Taste/design skills are skipped for Coding Assistant backend-only projects. |
| Frontend (`frontend`) | The project primarily changes UI, state, client routing, design systems, or browser/mobile behavior. | Emphasize design standards, accessibility, responsive states, visual QA, and API contract expectations. Taste/design skills are installed for Coding Assistant frontend/fullstack projects. |

## Verification level

| Level | Completion evidence |
|---|---|
| Strict (`strict`) | Run relevant tests, lint/typecheck/build where configured, plus review/QA expected by the active workflow path. Missing commands need an explicit not-run reason. |
| Pragmatic (`pragmatic`) | Run the most relevant targeted checks for the changed surface, plus broader checks when risk is meaningful or behavior changed. State any skipped checks. |
| Minimal (`minimal`) | Run the smallest credible check for low-risk work. If no command is useful, provide a concise manual rationale and mark unverified areas. |

Verification level changes how much evidence is required; it does not remove the need to classify the task, respect gates, or avoid false completion claims. Review/sub-agent use is separate from skill availability: installing review skills does not make every task require delegated review.

## Bundled process skills

`init` installs the full bundled process skill suite into `.claude/skills/` and/or `.cursor/skills/` for every profile. Profile and verification settings control when the workflow uses those skills; they no longer control whether the skills are available.

The bundled process suite includes planning, execution, debugging, TDD, review, delegation, worktree, branch-finishing, security-review, verification, and phase-handoff skills. Optional design/taste, GitNexus, and Serena capabilities are not redistributed as bundled process skills; they remain referenced or installed from their original sources.

| Active config | Optional design/taste install behavior |
|---|---|
| Profile `vibecode` | Auto-installs installable brand/design/taste sources because the AI team owns full product delivery. |
| Profile `coding-assistant` + surface `frontend` or `fullstack` | Installs installable brand/design/taste sources for UI/design work. |
| Profile `coding-assistant` + surface `backend` | Skips taste/design install. |

`update` refreshes all bundled process skills for the current framework version. It preserves user-added skill directories that are not part of the framework-managed process suite.

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
