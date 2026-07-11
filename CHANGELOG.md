# Changelog

Notable changes to `hero-mmt-kit` are documented here from `0.1.0` onward. Entries before `[0.1.0]` predate the fork and describe `hero-vibe-kit`, retained for history only. Format based on
[Keep a Changelog](https://keepachangelog.com/); versioning follows [SemVer](https://semver.org/).

## [0.1.0] - 2026-07-10
### Breaking
- **Hard fork: `hero-vibe-kit` → `hero-mmt-kit`.** This branch/package becomes a new, independent product, not a continuation of hero-vibe-kit. Version numbering resets to `0.1.0`; all history above this entry belongs to hero-vibe-kit and is retained for reference only, not carried forward.
- **Package/binary/runtime rename** — `hero-vibe-kit` → `hero-mmt-kit`; CLI binary `bin/hero-vibe-kit.js` → `bin/hero-mmt-kit.js`; consumer runtime directory `.hero-vibe-kit/` → `.hero-mmt-kit/`; managed-block markers `<!-- hero-vibe-kit:start/end -->` → `<!-- hero-mmt-kit:start/end -->`.
- **Claude Code-only — Cursor support fully removed.** Deleted `src/cursor.cjs`, `.cursor/` templates, `CURSOR-RULE.mdc.tmpl`, the `--ide` flag, and all IDE target-selection logic.
- **Profile/surface/verification-level config model removed.** Dropped `vibecode`/`coding-assistant` profiles, `fullstack`/`backend`/`frontend` surfaces, `strict`/`pragmatic`/`minimal` verification levels, and the `--profile`/`--surface`/`--verify` flags. `init` now asks a single yes/no question ("Install the taste/design skill?", default No), with `--taste` for non-interactive opt-in.
- **Hard enforcement gates removed.** Deleted `edit-gate.cjs` and `workflow-check.cjs` PreToolUse hooks and their `settings.json` wiring. Remaining hooks (`git-guard.cjs`, `session-bridge.cjs`, `stop-reminder.cjs`) are soft/non-blocking only.
- **Phase-handoff protocol removed.** Deleted the `phase-handoff` skill, `src/handoff-validate.cjs`, and the handoff-protocol docs (`PHASE_HANDOFF_PROTOCOL.md`, `HANDOFF_TEMPLATES.md`, `CONTEXT_BUDGET.md`).
- **Session state schema simplified.** `.hero-mmt-kit/session.json` now has only `schemaVersion`, `currentSkill`, `lastCheckpoint`, `resumePath`, `nextAction`, `updatedAt` — dropped `path`/`mode`/`phase`/`gates`/`reviewBudget`/`loop`.
- **No legacy migration path.** `hero-mmt-kit` does not read or migrate an old `.hero-vibe-kit/` install; it is a clean new package with no compatibility aliases.

### Removed
- Shared router doc `AGENCY_WORKFLOW.md` and companion docs `BRANCHING.md`, `DEFINITION_OF_DONE.md`, `TEAM_ROSTER.md`, `COMMUNICATION_PROTOCOL.md`, `ARTIFACTS_AND_STORAGE.md`, `ASSISTANCE_PROFILES.md` — replaced by 7 new self-contained Claude Code skills: `using-hero` (overview) plus 6 operative skills — `hero-planning`, `hero-coding`, `hero-reviewing`, `hero-unit-test`, `hero-security`, `hero-strict` — each wrapping the vendored obra/superpowers technique skills instead of duplicating a router doc.

### Kept
- Reference docs used by the optional taste/design skill and general standards remain: `ACTIVE_STATE.md`, `BROWNFIELD_DISCOVERY.md`, `SECURITY_STANDARDS.md`, `DESIGN_STANDARDS.md`, `PERFORMANCE_STANDARDS.md`, `INTERACTION_PATTERNS.md`, `templates/PRD_AI_FEATURE.md`, `templates/DESIGN_BRIEF.md`.

## [4.0.0] - 2026-07-07
### Breaking
- **Profile model overhaul** — bundled process skills are now installed in full for every profile. Profiles control workflow posture and when skills are used, not which core process skills are available.
- **Vibecode surface selection removed** — `vibecode` no longer asks for backend/frontend/fullstack and normalizes to fullstack lifecycle handling; Coding Assistant keeps the explicit surface selection.

### Added
- **`security-review` skill** — new bundled OWASP-focused process skill for security-sensitive work, Full-path QA, auth/authz, sensitive data, and AI/LLM risk review.
- Integration tests for design/taste install gating and additional profile/skill coverage for full-suite process skill installation.

### Changed
- **Design/taste install gating** — Vibecode auto-installs installable design/taste sources; Coding Assistant installs them only for frontend or fullstack surfaces and skips them for backend-only projects.
- **Workflow docs** — clarified Vibecode as a high-agency AI software-team mode and Coding Assistant as a human-orchestrated phase workflow for planning, executing, review, testing, and security review.
- `init`/`update` logs and manifest metadata now describe bundled core skills instead of selected profile-dependent skills.

## [3.0.0] - 2026-07-04
### Added
- **`concise-output` skill** — new opt-in communication-style skill (`templates/skills/concise-output/SKILL.md`), bundled but outside the process baseline (`skills.manifest.json` new `communication-style` group, `tier: optional`). Compresses reply prose across lite/standard/ultra intensity levels while keeping code, commands, error strings, and the user's own language verbatim; reverts to full clarity for security warnings, irreversible actions, and ambiguous multi-step sequences. Concept adapted (not copied) from `JuliusBrussee/caveman` (MIT); attribution recorded in `templates/skills/NOTICE`.

### Changed
- **Docs/skills de-duplication and cross-referencing audit** — resolved overlapping or ambiguous content found across `templates/docs/*.md` and `templates/skills/*/SKILL.md`:
  - `HANDOFF_TEMPLATES.md` / `PHASE_HANDOFF_PROTOCOL.md` — templates and prompts (base handoff, 5 phase handoffs, QA sub-agent prompt, short next-phase prompt) now live only in `HANDOFF_TEMPLATES.md`; `PHASE_HANDOFF_PROTOCOL.md` links to it instead of repeating them. QA verdict vocabulary in the QA sub-agent prompt aligned to the canonical `pass | yellow | fail | blocked` (was `PASS/PASS_WITH_CONCERNS/FIX_REQUIRED/BLOCKED`).
  - `INTERACTION_PATTERNS.md` / `templates/PRD_AI_FEATURE.md` — PRD template §4 (Tone), §5 (Guardrails), §8 (Fallback) now reference the matching INTERACTION_PATTERNS.md pattern numbers (P9, P5/P8, P4/P6/P7) instead of restating them.
  - `ASSISTANCE_PROFILES.md` / `TEAM_ROSTER.md` / `subagent-driven-development` skill — review-budget tiers (`none` / `single-combined-review` / `targeted-specialist-review` / `full-multi-stage-review`) now defined once in `ASSISTANCE_PROFILES.md` § Adaptive review budget; tier names normalized from Title Case to kebab-case; the other two now apply/extend rather than redefine.
  - `dispatching-parallel-agents` / `subagent-driven-development` skills — narrowed `dispatching-parallel-agents` frontmatter trigger to ad-hoc/no-plan investigation work, added reciprocal "see also" cross-references between the two skills.
  - `using-git-worktrees` / `finishing-a-development-branch` skills — added reciprocal "see also" cross-references (setup vs. teardown of the same workspace lifecycle); `finishing-a-development-branch` now references `using-git-worktrees` § Directory Selection instead of re-listing owned worktree directories.
  - `brainstorming` / `writing-plans` skills — re-linked previously orphaned `spec-document-reviewer-prompt.md` and `plan-document-reviewer-prompt.md` templates as an optional higher-assurance subagent-review alternative to inline self-review.
  - `DESIGN_STANDARDS.md` §3 — added an availability caveat: `gpt-taste`, `imagegen-frontend-web`, `imagegen-frontend-mobile`, `image-to-code`, `redesign-existing-projects` have `"source": "<TBD>"` in `skills.manifest.json` (no installable source wired yet); routing to them now requires verifying actual installation first.
  - `SECURITY_STANDARDS.md` §4 — clarified that none of the bundled hooks (`git-guard`, `workflow-check`, `edit-gate`, `session-bridge`, `stop-reminder`) perform secret scanning, dependency audit, or SAST; these remain placeholders the consuming project must wire up.
  - `CLAUDE.md.tmpl` — Enforcement line now lists all 5 bundled hooks (was only `git-guard` + `stop-reminder`, missing `workflow-check`, `edit-gate`, `session-bridge`).
  - Fixed a broken relative link in `phase-handoff/SKILL.md` (`../../docs/HANDOFF_TEMPLATES.md` resolved to the wrong install-time depth) — replaced with a plain-text path reference.

## [2.1.3] - 2026-06-22
### Fixed
- **Missing hooks at init/update** — `edit-gate.cjs` and `session-bridge.cjs` were present in the package template but not copied by `init` or `update`. Both hooks are now installed alongside `git-guard`, `stop-reminder`, and `workflow-check`.

## [2.1.2] - 2026-06-22
### Fixed
- npm publish of interactive IDE choice fix (2.1.1 patches).

## [2.1.1] - 2026-06-22
### Fixed
- **`--ide=value` syntax** — `parseArgs` in `bin/hero-vibe-kit.js` now handles `--flag=value` form. Previously, `--ide=claude-code` was parsed as key `"ide=claude-code"` instead of `"ide"`, causing `Invalid --ide: undefined` at init time.
- **Interactive IDE prompt** — `collectProfileConfig` was using the return value of `ask.choice` (a string like `"claude-code"`) as an array index, producing `undefined`. Now assigns the return value directly.

## [2.1.0] - 2026-06-19
### Added
- **Enforcement hooks** — hard enforcement gates that block Edit/Write tool calls before code is written without authorization. Converts advisory workflow from "Claude should follow" to "Claude must follow".
  - `edit-gate.cjs` — new PreToolUse hook (matcher: Edit, Write). Blocks source file edits on `standard`/`full` paths when phase is `planning`/`discovery`, or plan gate is not `approved`. Fail-open on missing `session.json`. Emergency override: `HVK_SKIP_EDIT_GATE=1`.
  - `session-bridge.cjs` — new PostToolUse hook. On the first tool call of each session, reads `session.json` and injects current work item, path, phase, plan gate, and next action into model context via stderr. Uses a flag file (`.hero-vibe-kit/session-injected.flag`) to fire only once per session; cleaned up by `stop-reminder` at session end.
  - `workflow-check.cjs` — extended to intercept `git add` before commit: warns via stderr when non-checkpoint files are staged on a gated path and no checkpoint file is staged yet.
  - `stop-reminder.cjs` — extended to clean up `session-injected.flag` at session end so `session-bridge` fires fresh on the next session.
  - `settings.json` — added Edit, Write, and PostToolUse (`.*`) hook matchers alongside existing Bash/Stop hooks.
- **Router table Enforcement column** (`AGENCY_WORKFLOW.md`) — distinguishes `hook` (hard block via PreToolUse, bypassable only with env override) from `convention` (soft, model discipline) for each workflow path.

## [2.0.0] - 2026-06-16
### Breaking
- Requires `--ide` with `--yes` on `init` (no change since 1.2.0, but the harness relies on IDE target being set).

### Added
- **Harness engineering** — observable compliance layer via `session.json`, extended `doctor --strict`, and the `workflow-check` commit gate.
  - `.hero-vibe-kit/session.json` seeded at `init`/`update`; written by `phase-handoff` at every real phase boundary. Stores path, phase, gate status, review budget, resume path, next action, and loop counters.
  - `session.schema.json` ships in the package template for consumers to reference.
  - `src/workflow-state.cjs` — zero-dependency session state module (`defaultSession`, `validateSession`, `readSession`, `writeSession`).
  - `src/handoff-validate.cjs` — validates YAML frontmatter and required body sections in phase-handoff artifacts; used by `doctor` for drift detection. Legacy handoffs (no frontmatter) warn only.
  - `doctor --strict` — escalates compliance warnings (missing session, drift, bloat, hook not wired) to failures for CI use. Tool-presence warnings (GitNexus, Serena) remain soft.
  - `doctor` Workflow compliance section: session schema validation, ACTIVE_STATE.md line-count bloat check (>150 lines warns), latest handoff artifact validation, drift detection (session.phase vs handoff toPhase), gate/approval consistency.
  - `workflow-check.cjs` hook (PreToolUse) — path-aware commit gate. For Standard/Full paths, blocks `git commit` unless staged changes include a session checkpoint (session update, ACTIVE_STATE update, or report artifact). Lean paths (read-only, fast, tiny, small) are always exempt. Fail-safe: any parse error, missing session, or git error exits 0. Override: `HVK_SKIP_STATE_GATE=1`.
  - `workflow-check.cjs` wired in `.claude/settings.json`, `.cursor/hooks.json`, and installed by `init`/`update` to `.claude/hooks/` and `.cursor/hooks/`.

- **Loop engineering** — deterministic phase/session loops via a strengthened `phase-handoff` skill.
  - Added Router Integration table mapping AGENCY_WORKFLOW states to skill invocations.
  - Added loop termination with `maxRetries: 2` and `retryCount` tracking; escalates to user when limit reached.
  - Added fast-path section for Tiny/Small work (bounded inline, no canonical file required).
  - Added Session Read/Write section: must checkpoint session.json at every Standard/Full boundary; write artifact first, session last.
  - Added YAML frontmatter schema for canonical handoffs (`hvkHandoffVersion`, `workItem`, `mode`, `fromPhase`, `toPhase`, `status`, `approval`, `reportSlug`).
  - Added Archive Rule: completed work moves to `docs/reports/`; ACTIVE_STATE row replaced with a one-line link.
  - Resume fast-path documented in `CLAUDE.md`, `AGENTS.md`, `CURSOR-RULE.mdc`, `ACTIVE_STATE.md`, `CONTEXT_BUDGET.md`: read `session.json` first (~200 tokens) → `resumePath` → latest handoff only if needed. Read `ACTIVE_STATE.md` only to switch work items or when session is blank/stale.
  - `AGENCY_WORKFLOW.md` Self-Prompting Router: Rule 7 — invoke `phase-handoff` at every real phase boundary.
  - `HANDOFF_TEMPLATES.md`: optional YAML frontmatter section with complete schema.
  - `PHASE_HANDOFF_PROTOCOL.md`: renamed future recommendation → installed skill; session checkpoint as step 8.
  - `ARTIFACTS_AND_STORAGE.md`: added `session.json` row (derived from artifacts — not authoritative).
  - `skills/using-superpowers`, `skills/executing-plans`, `skills/subagent-driven-development`: `phase-handoff` integration notes.

### Changed
- `DEFINITION_OF_DONE.md`: added CI integration note for `doctor --strict`.
- `SECURITY_STANDARDS.md`: added `workflow-check` hook alongside `git-guard` in process-security section.
- README: added "Harness & loop (v2.0)" section; updated feature list, hooks list, and commands table.

## [1.2.0] - 2026-06-15
### Added
- Added first-class **Cursor** support alongside Claude Code: `init`/`update` now install `.cursor/rules/hero-vibe-kit.mdc`, `.cursor/hooks.json`, shared enforcement hooks, and selected process skills under `.cursor/skills/`.
- Added `--ide claude-code|cursor|both` flag and `ideTargets` in `.hero-vibe-kit/config.json`. Interactive `init` prompts for IDE target; `--yes` requires `--ide`.

### Changed
- Updated `git-guard` and `stop-reminder` hooks to accept both Claude Code and Cursor hook payloads.
- Updated `doctor` to validate Claude Code and/or Cursor installs based on `ideTargets`.

## [1.1.1] - 2026-06-07
### Fixed
- Fixed selected skill installation on Windows by creating each destination directory before recursively copying nested skill files such as `brainstorming/scripts/server.cjs`.

## [1.1.0] - 2026-06-07
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
- Updated README and installed docs to describe the 1.1.0 profile-driven workflow, selected skills, adaptive review policy, and English-only template policy.

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
