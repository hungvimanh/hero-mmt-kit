# Changelog

All notable changes to hero-vibe-kit are documented here. Format based on
[Keep a Changelog](https://keepachangelog.com/); versioning follows [SemVer](https://semver.org/).

## [0.1.0] - Unreleased
### Added
- `npx hero-vibe-kit init` — installs the workflow into a project (new or brownfield), idempotent, with backups.
- `update` — re-renders framework-managed regions while preserving user edits and working files (ACTIVE_STATE).
- `doctor` — validates settings.json, hook self-tests, doc-link integrity, and tool presence.
- Bilingual docs (EN + VI): AGENCY_WORKFLOW (task-type router + 5 phases), DEFINITION_OF_DONE, BRANCHING,
  TEAM_ROSTER, ACTIVE_STATE, COMMUNICATION_PROTOCOL, INTERACTION_PATTERNS, SECURITY_STANDARDS,
  PERFORMANCE_STANDARDS, and a PRD_AI_FEATURE template.
- Enforcement hooks for Claude Code: `git-guard` (blocks force-push / `--no-verify` / `reset --hard` /
  direct push to main; reminds on commit) and `stop-reminder`.
- Managed-region markers (`<!-- hero-vibe-kit:start/end -->`) for safe updates.
- Presets: solo, small-team, enterprise.
- Optional integrations (reference & auto-install, never bundled): superpowers/taste skills via the `skills`
  CLI, GitNexus indexing, Serena pointer-memories. All degrade gracefully when absent.
