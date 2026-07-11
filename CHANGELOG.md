# Changelog

Notable changes to `hero-mmt-kit` are documented here from `1.0.0` onward.

Format follows [Keep a Changelog](https://keepachangelog.com/); versioning follows [SemVer](https://semver.org/).

## [1.0.0] - 2026-07-10

### Added

- Initial standalone `hero-mmt-kit` release.
- Zero-dependency Node.js CLI published as `hero-mmt-kit`, with `init`, `update`, `discover`, `brownfield`, `doctor`, `version`, and `help` commands.
- Claude Code-only workflow installation for new and brownfield repositories.
- `using-hero` overview skill plus six operative workflow skills:
  - `hero-planning`
  - `hero-coding`
  - `hero-reviewing`
  - `hero-unit-test`
  - `hero-security`
  - `hero-strict`
- Bundled core process skills installed into `.claude/skills/` for every project, with attribution in `templates/skills/NOTICE`.
- Standalone framework-authored `hero-security` skill for OWASP + AI/LLM security reviews.
- Lightweight session state in `.hero-mmt-kit/session.json` with `schemaVersion`, `currentSkill`, `lastCheckpoint`, `resumePath`, `nextAction`, and `updatedAt`.
- Soft Claude Code hooks:
  - `git-guard.cjs` for dangerous git-command protection and commit reminders.
  - `session-bridge.cjs` for once-per-session state injection.
  - `stop-reminder.cjs` for end-of-session state reminders.
- Brownfield discovery flow via `npx hero-mmt-kit discover` / `brownfield`, generating `docs/BROWNFIELD_DISCOVERY.md`.
- Standards and template docs:
  - `docs/ACTIVE_STATE.md`
  - `docs/BROWNFIELD_DISCOVERY.md`
  - `docs/SECURITY_STANDARDS.md`
  - `docs/PERFORMANCE_STANDARDS.md`
  - `docs/DESIGN_STANDARDS.md`
  - `docs/INTERACTION_PATTERNS.md`
  - `docs/templates/PRD_AI_FEATURE.md`
  - `docs/templates/DESIGN_BRIEF.md`
- Managed-region update model using `<!-- hero-mmt-kit:start/end -->` markers in generated guidance files.
- Optional integration detection for taste/design skills, GitNexus, and Serena.
- Presets for `enterprise`, `small-team`, and `solo` posture configuration.
- Test coverage for hook behavior, documentation links, initialization, brownfield discovery, optional integration gating, and CLI smoke flows.

### Changed

- Workflow posture is human-led and Claude Code-only: developers invoke skills directly instead of relying on automatic routing, profiles, IDE targeting, or phase enforcement.
- Framework templates are English-only for consistency and token efficiency; assistants can still reply in the user's chat language.
- Installed skills are no longer selected by profile, project surface, or verification level. Every install receives the full bundled workflow skill suite.
- Optional taste/design skills are installed only when the user opts in with `--taste` or answers Yes during interactive `init`.
- `doctor` validates the current framework surfaces: hooks, settings, session state, doc links, and optional tool presence.

### Removed

- Hard workflow enforcement gates and blocking edit/commit checks.
- Multi-IDE targeting and Cursor-specific installation surfaces.
- Profile, surface, and verification-level selection flags.
- Phase-handoff protocol artifacts and handoff validation logic.
- Legacy migration or compatibility behavior from earlier products. `hero-mmt-kit` starts with a clean runtime directory, managed-region markers, CLI binary, and package name.
