# Changelog

Notable changes to `hero-mmt-kit` are documented here from `1.0.0` onward.

Format follows [Keep a Changelog](https://keepachangelog.com/); versioning follows [SemVer](https://semver.org/).

## [1.1.3] - 2026-07-16

### Added

- `instrumented-debugging.md`, a hero-mmt-kit-original supporting technique added to the vendored `systematic-debugging` skill (alongside `root-cause-tracing.md`, `defense-in-depth.md`, and `condition-based-waiting.md`): for a logic/data bug reproducible from known input, trigger it via a temporary unit test built directly from that input, place tagged `console.log`/`print` checkpoints at breakpoint-equivalent locations, and read the collected trace instead of attaching a debugger. Mandatory cleanup removes the temporary test and all checkpoint lines before the session ends.
- `systematic-debugging/SKILL.md` Phase 1 and its Supporting Techniques list now point to `instrumented-debugging.md`; `hero-coding/SKILL.md` step 4 surfaces it as an option when a mid-implementation bug is reproducible from a known API payload.
- `templates/skills/NOTICE` documents this as a hero-mmt-kit design choice layered on top of the vendored skill, following the same precedent set for `subagent-driven-development`'s backported additions.

## [1.1.2] - 2026-07-14

### Changed

- Extracted `hero-security`'s embedded reference knowledge (the 14-domain security control baseline, OWASP/AI-LLM review checklist, release-gate criteria, report template, and severity guide) out of `SKILL.md` into standalone docs — `docs/SECURITY_CONTROL_BASELINE.md`, `docs/SECURITY_REVIEW_CHECKLIST.md`, and `docs/SECURITY_REPORT_FORMAT.md` — referenced from the skill via `@docs/...`. `hero-security/SKILL.md` shrank from 427 to ~150 lines and now covers only process/behavioral guidance.
- Consolidated all `hero-security` documentation into the project's single `docs/` folder alongside the existing `docs/SECURITY_STANDARDS.md`, instead of splitting it between the project's `docs/` and a skill-local `docs/` subfolder under `.claude/skills/hero-security/`. `SECURITY_STANDARDS.md` now cross-links the three new files.

## [1.1.1] - 2026-07-14

### Fixed

- `hero-planning` no longer stalls in Plan Mode asking "should I implement now?" — after the plan is written and self-reviewed, it exits plan mode, reports the saved path, and stops without offering to implement or auto-invoking `hero-coding`.
- Unified the plan artifact path to `docs/plans/YYYY-MM-DD-<slug>.md` everywhere. The vendored `writing-plans` skill previously defaulted to `docs/superpowers/plans/...`, which didn't match `hero-planning`'s own convention; `writing-plans` and the `requesting-code-review` example now use the same path.

## [1.1.0] - 2026-07-11

### Added

- `hero-report`, an on-demand report writer for coding, reviewing, and unit-test phases when a durable report is explicitly wanted.
- `active-state-bridge.cjs`, which injects `docs/ACTIVE_STATE.md` context at session start and makes that file the single durable workflow-state source.
- Expanded `hero-security` into a standalone OWASP + AI/LLM security engineering workflow with a 14-domain control baseline, release gates, verification requirements, and residual-risk reporting.
- Regression coverage to ensure `security-review` stays merged into `hero-security` and `hero-security` retains a standalone `docs/security-reports/YYYY-MM-DD-<slug>.md` artifact convention.

### Changed

- `hero-security` is now an independent security-review flow that always writes its own report under `docs/security-reports/...`; security findings are not appended into coding/review/test reports as a substitute.
- `hero-coding`, `hero-reviewing`, `hero-unit-test`, and `hero-strict` now recommend or link related independent phases instead of embedding security or report-writing work.
- Reports for coding/review/test phases are on-demand via `hero-report`; chat summaries remain the default for those phases.
- `docs/ACTIVE_STATE.md` replaces `.hero-mmt-kit/session.json` as the workflow state source used by init/update/doctor guidance.
- `git-guard` behavior was tightened to avoid false positives such as branch names containing `main`, while keeping dangerous git commands guarded.
- README, framework guidance, manifest metadata, and vendored skill documentation now describe the report-on-demand model and standalone security-report exception consistently.

### Removed

- Bundled `security-review` skill; its OWASP + AI/LLM review content now lives in `hero-security`.
- `session-bridge.cjs`, `.hero-mmt-kit/session.schema.json`, and session-pointer state logic.
- `finishing-a-development-branch` from the bundled process-skill set.
- Legacy presets and workflow-state tests tied to the removed session/profile model.

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
