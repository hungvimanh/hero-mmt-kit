# Changelog

All notable changes to hero-vibe-kit are documented here. Format based on
[Keep a Changelog](https://keepachangelog.com/); versioning follows [SemVer](https://semver.org/).

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
