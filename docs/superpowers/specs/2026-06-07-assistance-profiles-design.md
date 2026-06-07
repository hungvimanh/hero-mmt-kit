# Design: Assistance Profiles for Consumer Project Flexibility

Date: 2026-06-07
Status: Approved for specification; pending user review before implementation planning
Repository: `hero-vibe-kit`

## Problem

`hero-vibe-kit` currently provides a strong task router, workflow gates, hooks, and standards for consumer projects. It also supports team-size presets (`solo`, `small-team`, `enterprise`). However, it does not clearly distinguish between different ways a consumer wants to use AI:

1. **Vibecode**: the user gives a requirement, problem, or feature description, and the AI owns the technical work end-to-end through the full process.
2. **Coding Assistant**: the user is a developer who describes work for the AI to implement and verify pragmatically, then the developer reviews the code. Coding Assistant projects may be fullstack, backend-only, or frontend-only.

Without this distinction, the framework can feel too heavy for developer-in-the-loop projects and too generic for users expecting autonomous AI delivery. It can also install or emphasize skills and docs that are not relevant to a backend-only or frontend-only consumer project.

## Goals

- Add a clear project-level default for how autonomous the AI workflow should be.
- Support consumer project surfaces: fullstack, backend-only, and frontend-only.
- Keep the current task router and workflow discipline, but tune gates, verification, and delegation by profile.
- Avoid over-installing or over-emphasizing irrelevant skills/docs, while preserving safe overrides.
- Maintain backward compatibility for existing installs.
- Keep framework templates English-only.

## Non-goals

- Do not replace the existing task classification table.
- Do not remove existing workflow paths (`Read-only`, `Fast`, `Standard`, `Full`).
- Do not make Coding Assistant mode careless; it must remain evidence-based.
- Do not destructively delete existing skills or docs when a profile changes.
- Do not refactor the entire template tree into modules in the first implementation step.

## Decision summary

Introduce three new configuration dimensions:

```text
assistanceProfile:  vibecode | coding-assistant
projectSurface:     fullstack | backend | frontend
verificationLevel:  strict | pragmatic | minimal
```

These sit alongside the existing dimensions:

```text
teamSize:           solo | small-team | enterprise
branchingModel:     github-flow | gitlab-flow | trunk
```

The recommended default for non-interactive installs is:

```text
teamSize: small-team
branchingModel: github-flow
assistanceProfile: coding-assistant
projectSurface: fullstack
verificationLevel: pragmatic
```

Rationale: this default is easiest for developer adoption. Users who want autonomous AI delivery can explicitly choose `vibecode`.

## Profile model

### `vibecode`

Use when the user wants AI to drive technical delivery end-to-end from a requirement or feature description.

Default behavior:

- Strong discovery and planning for ambiguous or meaningful work.
- Full feature flow for new features.
- Stronger QA/review ownership by AI.
- Higher expectation for tests, verification, impact checks, and handoff artifacts.
- Sub-agent review/QA remains mandatory for Standard and Full paths.

Default verification level: `strict`.

### `coding-assistant`

Use when the user is a developer and AI acts as a coding partner.

Default behavior:

- AI implements and verifies pragmatically.
- Developer review is the final expected gate.
- Less ceremony for low-risk work.
- Plan Mode and review sub-agents are used when risk, size, ambiguity, or sensitive surfaces justify them.
- Verification is evidence-based but not exhaustive by default.

Default verification level: `pragmatic`.

## Project surface model

### `fullstack`

Use when the consumer project includes both frontend and backend concerns.

Router emphasis:

- API/interface contracts.
- FE/BE split and integration points.
- Integration verification.
- Security and performance baseline.
- UI/design standards when UI work exists.

### `backend`

Use when the project is backend-only or mostly backend.

Router emphasis:

- API contracts.
- Data/schema/migration considerations.
- Auth, permissions, secrets, external integrations.
- Security and performance.
- Backend tests and focused verification.

Frontend/design docs and skills should not be active by default, though the user can override per task.

### `frontend`

Use when the project is frontend-only or mostly frontend.

Router emphasis:

- Screens, components, states, and user flows.
- Accessibility.
- API consumption assumptions and contracts.
- Design consistency and visual/manual verification.
- In-product help and interaction patterns when applicable.

Backend guidance remains limited to API consumer assumptions and security basics unless the user overrides.

## Verification levels

### `strict`

Default for `vibecode`.

Completion claims require relevant evidence:

- Run relevant tests/lint/build, or explicitly state why they could not be run.
- Bugfixes should include repro/regression evidence when feasible.
- Standard/Full work should include review or QA evidence.
- Security/performance-sensitive surfaces must be checked or explicitly marked unverified.
- Repos with GitNexus should run `gitnexus_detect_changes` before commits.
- Known limitations must be reported.

### `pragmatic`

Default for `coding-assistant`.

Completion claims require reasonable evidence for the scope:

- Run available and relevant test/lint/build commands when feasible.
- Do not require a new test for every small chore or change.
- Bugfixes and behavior changes should still include root cause and focused verification when feasible.
- If verification cannot be run, say exactly what was not verified and why.
- Developer review remains the final expected gate.

### `minimal`

Optional override only.

Completion claims must be explicit about limited verification:

- Make the requested code change.
- Do quick self-review or syntax/build check if feasible.
- State that the change is not fully verified.
- User/developer owns final testing and review.

## Hybrid override rule

The project config is the default. Per-task user instructions can override it.

Resolution order:

```text
explicit user override
→ obvious task scope from request
→ project default config
```

Examples:

```text
"Build this end-to-end, vibecode style"
→ activeProfile = vibecode

"Just patch this as coding assistant; I will review"
→ activeProfile = coding-assistant

"Frontend only"
→ activeSurface = frontend

"Backend API only"
→ activeSurface = backend
```

The router should avoid asking extra questions when config is sufficient. It should ask only when the profile/surface decision changes gates, risk, or completion criteria materially.

## Router behavior

The existing router remains the core. The new pre-router sequence is:

```text
resolve active assistance profile
→ resolve active project surface
→ classify task
→ choose path
→ apply profile-specific strictness
→ verify against profile-specific DoD
```

### Same task, different strictness

New feature:

- `vibecode`: Full path, discovery/PRD, architecture plan, implementation, QA/review, handover, strict verification.
- `coding-assistant`: Standard or Full depending on size and ambiguity, short scope confirmation, pragmatic verification, developer review final.

Small bugfix:

- `vibecode`: systematic debugging, repro test expected when feasible, fix, regression verification, review if risk rises.
- `coding-assistant`: identify root cause, add repro test if feasible, fix, run focused test/build if available, state verified/unverified scope.

Frontend UI change:

- `vibecode`: design profile, state inventory, design standards, implementation, visual QA.
- `coding-assistant`: component/screen scope, implementation, basic accessibility/state check, visual/manual verification if feasible, developer review.

## Gate behavior

### Vibecode

Plan Mode gates remain strong for:

- Existing behavior changes.
- Refactors.
- New features.
- UI/UX design or redesign.
- Any risky or ambiguous work.

### Coding Assistant

Plan Mode gates are required when:

- Impact analysis is MEDIUM or higher.
- The task touches many files or multiple subsystems.
- The task affects API/data/security-sensitive behavior.
- The user requests a full plan.
- A feature is large or ambiguous.

For small, low-risk work, the AI may summarize the approach briefly and proceed without full Plan Mode, while still reporting verification evidence.

## Sub-agent behavior

### Vibecode

Keep current strong delegation requirements:

- Standard path: review/QA sub-agent required before completion.
- Full path: QA/review sub-agent required before completion.
- Implementation delegation remains optional unless independent tracks or context isolation make it useful.

### Coding Assistant

Use lighter delegation:

- Review sub-agent is recommended for broad, risky, or ambiguous changes.
- Full path should use review/QA unless the user explicitly expects developer review and the risk is low.
- Security-sensitive surfaces require security review or an explicit unverified limitation.
- HIGH/CRITICAL impact requires warning the user before edits.

This preserves the Coding Assistant promise: AI codes and verifies pragmatically; the developer reviews the final code.

## CLI behavior

### Interactive `init`

After current prompts:

```text
Project name
Team size
Branching model
```

ask:

```text
Assistance profile:
  - vibecode
  - coding-assistant

Project surface:
  - fullstack
  - backend
  - frontend
```

Do not ask verification level interactively by default. Derive it from profile:

```text
vibecode          → strict
coding-assistant  → pragmatic
```

### Non-interactive flags

Add:

```text
--profile <vibecode|coding-assistant>
--surface <fullstack|backend|frontend>
--verify <strict|pragmatic|minimal>
```

Examples:

```bash
npx hero-vibe-kit init --profile vibecode --surface fullstack --yes
npx hero-vibe-kit init --profile coding-assistant --surface backend --yes
npx hero-vibe-kit init --profile coding-assistant --surface frontend --verify minimal --yes
```

Invalid values should fail clearly before writing files.

### `update`

`update` should:

- Read existing `.hero-vibe-kit/config.json`.
- Backfill missing profile fields for older installs.
- Accept profile/surface/verify override flags.
- Re-render managed docs with the active config.
- Install missing bundled skills if the new profile requires them.
- Never delete existing skills or user-installed docs.

Example:

```bash
npx hero-vibe-kit update --profile vibecode --surface fullstack
```

### Help output

Add these flags to help:

```text
--profile <name>    vibecode | coding-assistant
--surface <name>    fullstack | backend | frontend
--verify <level>    strict | pragmatic | minimal
```

Explain:

```text
Profile controls how autonomous the AI workflow is.
Surface controls which technical workflow/docs are emphasized.
Verify controls the default completion evidence level.
```

## Template and doc changes

Add render variables:

```text
ASSISTANCE_PROFILE
ASSISTANCE_PROFILE_LABEL
PROJECT_SURFACE
PROJECT_SURFACE_LABEL
VERIFICATION_LEVEL
```

If the renderer supports only simple replacement, avoid complex conditionals in the first implementation. Use clear active-profile text and canonical reference docs.

Primary docs to update:

```text
templates/CLAUDE.md.tmpl
templates/AGENTS.md.tmpl
templates/docs/AGENCY_WORKFLOW.md
templates/docs/DEFINITION_OF_DONE.md
templates/docs/TEAM_ROSTER.md
templates/docs/COMMUNICATION_PROTOCOL.md
templates/docs/DESIGN_STANDARDS.md
templates/docs/SECURITY_STANDARDS.md
templates/docs/PERFORMANCE_STANDARDS.md
README.md
```

Add a canonical profile reference:

```text
templates/docs/ASSISTANCE_PROFILES.md
```

`AGENCY_WORKFLOW.md` should reference this document instead of duplicating all details.

## Skill installation strategy

Use a phased approach.

### Step 1: Config + docs + router behavior

- Add config fields and CLI flags.
- Add `ASSISTANCE_PROFILES.md`.
- Update workflow, DoD, and roster wording.
- Keep bundled skill installation mostly unchanged or lightly filtered.
- Update tests around config and rendered docs.

This delivers most user-facing value with lower risk.

### Step 2: Skill subset install

Split `skills.manifest.json` process groups:

```json
{
  "process-core": {
    "profiles": ["vibecode", "coding-assistant"]
  },
  "process-vibecode": {
    "profiles": ["vibecode"]
  },
  "process-coding-assistant": {
    "profiles": ["coding-assistant"]
  },
  "frontend": {
    "surfaces": ["frontend", "fullstack"]
  },
  "backend": {
    "surfaces": ["backend", "fullstack"]
  }
}
```

Conservative rule:

- Package may still include all vendored skills.
- Install the profile subset by default.
- `update --profile vibecode` may add missing skills.
- Never delete extra skills when switching profiles.

## Backward compatibility

Existing consumer projects without the new fields migrate softly to:

```json
{
  "assistanceProfile": "coding-assistant",
  "projectSurface": "fullstack",
  "verificationLevel": "pragmatic"
}
```

`update` must not prompt for these fields. It should backfill defaults unless override flags are provided.

Existing docs and managed regions remain compatible because new fields are additive.

## Tests

Add or update tests for:

1. `init --yes`
   - Config contains `coding-assistant`, `fullstack`, `pragmatic`.
   - Rendered docs mention the active profile.

2. `init --yes --profile vibecode --surface backend`
   - Config contains `vibecode`, `backend`, `strict`.

3. `init --yes --profile coding-assistant --surface frontend --verify minimal`
   - Config contains `coding-assistant`, `frontend`, `minimal`.

4. Invalid flags
   - Invalid `--profile`, `--surface`, or `--verify` fails clearly before writing files.

5. `update` migration
   - Existing config without new fields gets defaults without prompting.

6. Doc link integrity
   - New `ASSISTANCE_PROFILES.md` is linked correctly from generated docs.

7. Skill install behavior
   - Step 1: at least ensure profile config does not break skill installation.
   - Step 2: assert profile-specific subset installation where implemented.

## Rollout

Recommended rollout has two steps:

1. Implement config, docs, router behavior, and tests.
2. Implement profile-specific skill subset installation once Step 1 is stable.

This avoids over-refactoring while solving the core consumer flexibility problem.

## Risks and mitigations

### Docs become too large

Mitigation: add `ASSISTANCE_PROFILES.md` as the canonical profile reference. Keep `AGENCY_WORKFLOW.md` focused on routing.

### Coding Assistant becomes too loose

Mitigation: define `pragmatic` as evidence-based. AI must run relevant available checks or state what remains unverified.

### Profile changes remove useful tools

Mitigation: never delete existing skills or user-installed files. Only add missing skills.

### Confusion between preset and profile

Mitigation: document the distinction:

- `preset` / `teamSize` = team and process scale.
- `profile` = AI autonomy and ceremony level.
- `surface` = technical project scope.
- `verify` = completion evidence level.

## Acceptance criteria

- New installs can choose Vibecode or Coding Assistant behavior.
- Coding Assistant supports fullstack, backend-only, and frontend-only defaults.
- Non-interactive flags support profile, surface, and verification level.
- Existing installs migrate without breaking.
- Generated docs clearly state the active profile, surface, and verification level.
- Router and DoD wording explain how behavior changes by profile.
- Tests cover defaults, flags, invalid values, migration, and doc links.
