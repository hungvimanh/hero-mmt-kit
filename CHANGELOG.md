# Changelog

All notable changes to hero-vibe-kit are documented here. Format based on
[Keep a Changelog](https://keepachangelog.com/); versioning follows [SemVer](https://semver.org/).

## [1.0.0] - 2026-06-07
### Breaking
- Removed Vietnamese framework template support. Framework templates and installed docs are now English-only; agents still respond in the user's chat language unless asked otherwise. `--lang` is deprecated/ignored with a warning.
- Reframed sub-agent/review policy from mandatory review loops to adaptive, risk-based review budgets. Normal Coding Assistant work now defaults to direct implementation, targeted verification, and explicit developer-review handoff instead of automatic multi-review swarms.

### Added
- Added assistance profiles for consumer projects: `vibecode` for high-agency AI execution and `coding-assistant` for developer-led collaboration.
- Added project surfaces (`fullstack`, `backend`, `frontend`) and verification levels (`strict`, `pragmatic`, `minimal`) to `init`, `update`, rendered docs, and `.hero-vibe-kit/config.json`.
- Added `ASSISTANCE_PROFILES.md` as the canonical installed reference for active profile, surface, verification, per-task overrides, adaptive review budgets, and selected process skills.
- Added selective bundled process skill installation so `init` installs only the core skills needed for the active profile/surface/verification instead of always installing the full vendored suite.
- Added artifact-first Phase Handoff Protocol guidance for real phase boundaries, including bounded canonical handoffs, `resume.md` pointers, sanity checks, evidence freshness, and final-claim verification rules.
- Added a framework-authored `phase-handoff` skill for safe handoff/resume behavior across fresh sessions and sub-agents.

### Changed
- Updated `AGENCY_WORKFLOW.md`, `TEAM_ROSTER.md`, `DEFINITION_OF_DONE.md`, and process skills so sub-agents are escalation tools, not default ceremony. Review budgets now range from no delegated review, to one combined review, to targeted specialist review, to full multi-stage review only when risk justifies it.
- Updated Coding Assistant defaults to `fullstack` + `pragmatic` verification for `--yes`, with a leaner workflow and explicit verified/unverified final reports.
- Updated `update` to refresh selected framework-managed skills while preserving existing unselected or user-added skill directories.
- Updated README and installed docs to describe the 1.0.0 profile-driven workflow, selected skills, adaptive review policy, and English-only template policy.

## [0.6.3] - 2026-06-06
### Changed
- Updated bilingual sub-agent model routing defaults: medium-hard tasks use `claude-sonnet-4-6`; simple tasks use `claude-haiku-4-5` with medium/high effort guidance.
- Added Lightweight Main Agent Protocol guidance so the Main Agent stays as planner/router/synthesizer while sub-agents execute broad or noisy work and return bounded reports.
- Added bounded command-output/log artifact rules for build/test/diff/MCP outputs.

## [0.6.2] - 2026-06-06
### Added
- Added bilingual sub-agent model/effort routing in `TEAM_ROSTER.md`, with model IDs centralized for easier future Claude model updates.
- Added `Model tier` and `Effort` fields to bilingual handoff prompt contracts.

### Changed
- Updated generated `AGENTS.md` and `CLAUDE.md` templates to point to `TEAM_ROSTER.md` for sub-agent model/effort selection instead of hardcoding model IDs.

## [0.6.1] - 2026-06-06
### Changed
- Added concise response-style guidance to the bilingual communication protocol: minimum words, maximum signal, result first, compact markers, and no filler by default.
- Linked the concise style into bilingual sub-agent reporting and handoff prompt context budgets.

## [0.6.0] - 2026-06-06
### Added
- Process-first self-prompting workflow guidance so the Main Agent classifies task type, selects the workflow path, generates bounded handoff prompts, verifies gates, updates artifacts, and chooses the next prompt from workflow state.
- Bilingual `HANDOFF_TEMPLATES.md` prompt contracts for BA discovery, architect planning, implementer, reviewers, brownfield discovery, and handover/retro.
- Bilingual `CONTEXT_BUDGET.md` protocol with no-dump rules, mandatory checkpoint triggers, resume packet format, `/compact` prompt, fresh-session prompt, sub-agent output limits, tool-output hygiene, and API 400 recovery.

### Changed
- Reframed `TEAM_ROSTER.md` as a conditional role/lens library with context-budget rules for the Main Agent and bounded sub-agent outputs.
- Updated `AGENCY_WORKFLOW.md` to include the Self-Prompting Router, next-prompt decision table, and Context Budget Protocol.
- Updated `ARTIFACTS_AND_STORAGE.md` to define `reports/.../resume.md` as the compact/session-restart artifact for long-running work, handoffs, final verification, and context-pressure recovery.

## [0.5.0] - 2026-06-03
### Added
- Vendored core process skills under `templates/skills/` (a curated, lightly trimmed MIT copy of `obra/superpowers`, with `NOTICE` attribution). `init`/`update` install them into a consumer's `.claude/skills/` — no `skills` CLI or network needed.
- Design docs: a concise **references-first (avoid AI-slop)** section (gather real references from Dribbble/Mobbin/Behance/Muzli, generate variations, avoid LLM defaults), an optional design-MCP note (browser/Figma), and an optional storytelling layer; `DESIGN_BRIEF.md` now requires named references.
- Tests for vendored skills, install/refresh into `.claude/skills/`, and the recalibrated sub-agent wording.

### Changed
- **Sub-agent policy recalibrated** (per the "context-collector" model): required review/QA stays path-triggered, but **delegating implementation is now optional** — the main agent implements with full context by default and delegates Dev work only when it genuinely helps. "Not every task needs a sub-agent." Mirrored across AGENCY_WORKFLOW, TEAM_ROSTER, CLAUDE.md/AGENTS.md templates, and the Serena delegation memo.
- `init`/`update` no longer run `npx skills add obra/superpowers`; core skills are bundled. `doctor` now checks `.claude/skills/` instead of `skills-lock.json`. Manifest `process` group marked `vendored`/`bundled` with MIT attribution.

### Removed
- The `writing-skills` meta skill from the installed set (consumers don't author skills).

## [0.4.1] - 2026-06-03
### Changed
- Optimized installed Claude/agent instructions with just-in-time context loading so agents read path-specific docs only when needed.
- Reduced duplicated workflow guidance across roster, DoD, artifact, active-state, and brownfield discovery docs while preserving Standard/Full gate and sub-agent requirements.
- Made brownfield discovery output summary-first to avoid turning old-project scans into large context sinks.

### Added
- Tests for compact installed guidance, update refresh behavior, rendered placeholder cleanup, and EN/VI docs file-set parity.

## [0.4.0] - 2026-06-03
### Added
- `discover` / `brownfield` command to scan old codebases and generate `docs/BROWNFIELD_DISCOVERY.md` without assuming docs live in `docs/`.
- Bilingual `BROWNFIELD_DISCOVERY.md` template and workflow guidance for old projects: `init` → `discover` → `doctor`.

### Changed
- `init` and `update` preserve an existing `docs/BROWNFIELD_DISCOVERY.md` so human/AI discovery notes are not overwritten.

## [0.3.0] - 2026-06-03
### Added
- Design UI/UX sub-workflow: bilingual `DESIGN_STANDARDS.md` with 3 product-fit profiles, UX↔UI split, job→skill routing, platform scope, media production, visual QA, and in-product help/onboarding standards.
- `DESIGN_BRIEF.md` template for clarifying UI/UX before implementation.
- Router row #9 for UI/UX design/redesign work, plus Phase 1–4 design steps folded into the existing Gate 2 flow.
- `design/` branch prefix and Design/UI Definition of Done items.
- Design artifact locations for `docs/design/`, `docs/design/assets/`, `docs/help/`, and visual QA reports.
- Optional provider-agnostic AI media-generation config that stores only provider + environment variable name, never the API key value.

### Changed
- Split design skills in `skills.manifest.json` into `brand`, `design-direction`, and `design-tools` groups.
- Updated optional integration install flow to install design skill sources safely and skip placeholder sources.
- Updated Human ↔ AI communication guidance to prefer simple language, explain from the user's goal first, and reduce hard technical terms unless requested.

## [0.2.0] - Previous
### Added
- `npx hero-vibe-kit init` — installs the workflow into a project (new or brownfield), idempotent, with backups.
- `update` — re-renders framework-managed regions while preserving user edits and working files (ACTIVE_STATE).
- `doctor` — validates settings.json, hook self-tests, doc-link integrity, and tool presence.
- Bilingual docs (EN + VI): AGENCY_WORKFLOW (task-type router + 5 phases), DEFINITION_OF_DONE, BRANCHING,
  TEAM_ROSTER, ACTIVE_STATE, ARTIFACTS_AND_STORAGE, COMMUNICATION_PROTOCOL, INTERACTION_PATTERNS,
  SECURITY_STANDARDS, PERFORMANCE_STANDARDS, and a PRD_AI_FEATURE template.
- Enforcement hooks for Claude Code: `git-guard` (blocks force-push / `--no-verify` / `reset --hard` /
  direct push to main; reminds on commit) and `stop-reminder`.
- Managed-region markers (`<!-- hero-vibe-kit:start/end -->`) for safe updates.
- Presets: solo, small-team, enterprise.
- Optional integrations (reference & auto-install, never bundled): superpowers/taste skills via the `skills`
  CLI, GitNexus indexing, and Serena semantic code-intelligence support. All degrade gracefully when absent.
