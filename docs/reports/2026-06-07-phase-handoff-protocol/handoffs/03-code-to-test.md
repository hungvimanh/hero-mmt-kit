# Phase Handoff — Code → Test

## Status
- Work item: Phase Handoff Protocol Integration
- Mode: full
- From phase: Code
- To phase: Test
- Status: green
- Approval: auto-approved
- Approved by: Main Agent
- Approval evidence: Implementation completed according to approved spec and plan; focused and full tests passed after implementation.
- Approval note: Ready for verification and QA review.
- Branch: master
- Base commit: e19641b
- Working tree state: dirty; includes pre-existing AGENTS.md, CLAUDE.md, docs/BROWNFIELD_DISCOVERY.md, docs/PHASE_HANDOFF_PROTOCOL.md, hero-vibe-kit-0.6.3.tgz plus current integration changes
- Evidence captured against: branch master, commit e19641b, working tree dirty, diff summary `docs/reports/2026-06-07-phase-handoff-protocol/logs/20260607-1534-git-diff-name-status.log`, captured at 2026-06-07 15:34 local
- Last updated: 2026-06-07

## Source of truth
- Latest user instruction: `1` selecting Subagent-Driven execution after approving the spec
- Latest approved handoff/amendment: `docs/reports/2026-06-07-phase-handoff-protocol/handoffs/02-design-to-code.md`
- Referenced artifacts:
  - `docs/superpowers/specs/2026-06-07-phase-handoff-protocol-integration-design.md`
  - `docs/superpowers/plans/2026-06-07-phase-handoff-protocol-integration.md`
- Evidence paths:
  - `docs/reports/2026-06-07-phase-handoff-protocol/logs/20260607-1534-git-status-short.log`
  - `docs/reports/2026-06-07-phase-handoff-protocol/logs/20260607-1534-git-diff-name-status.log`
  - `docs/reports/2026-06-07-phase-handoff-protocol/logs/20260607-1534-git-diff-stat.log`
  - `docs/reports/2026-06-07-phase-handoff-protocol/logs/20260607-1534-git-diff-check.log`
  - `docs/reports/2026-06-07-phase-handoff-protocol/logs/20260607-1534-npm-test.log`
  - `docs/reports/2026-06-07-phase-handoff-protocol/logs/20260607-1536-gitnexus-detect-changes.md`

## Read first
- `docs/reports/2026-06-07-phase-handoff-protocol/resume.md`
- this handoff
- required files:
  - `test/links.test.cjs`
  - `test/init-smoke.test.cjs`
  - `test/skills-vendor.test.cjs`
  - `templates/docs/en/AGENCY_WORKFLOW.md`
  - `templates/docs/en/CONTEXT_BUDGET.md`
  - `templates/docs/en/HANDOFF_TEMPLATES.md`
  - `templates/docs/vi/AGENCY_WORKFLOW.md`
  - `templates/docs/vi/CONTEXT_BUDGET.md`
  - `templates/docs/vi/HANDOFF_TEMPLATES.md`
  - `templates/skills/phase-handoff/SKILL.md`

## Do not read
- old transcripts
- full logs unless debugging a listed failure
- full diffs unless a specific hunk is requested
- full protocol docs unless verifying protocol content

## Next action
- Next role: test/verification
- Objective: verify tests and docs/skill integration evidence, then hand off to QA.
- Stop condition: `docs/reports/2026-06-07-phase-handoff-protocol/handoffs/04-test-to-qa.md` exists with test evidence and QA scope.
- Required tools/skills: verification-before-completion, gitnexus_detect_changes

## Changed files
- `templates/docs/en/PHASE_HANDOFF_PROTOCOL.md`: English full protocol reference
- `templates/docs/vi/PHASE_HANDOFF_PROTOCOL.md`: Vietnamese full protocol reference
- `templates/docs/en/AGENCY_WORKFLOW.md`: short mode/phase-boundary rules and aligned Main Agent implementation wording
- `templates/docs/vi/AGENCY_WORKFLOW.md`: Vietnamese mirror
- `templates/docs/en/CONTEXT_BUDGET.md`: artifact-first, sanity, evidence, and final-claim rules
- `templates/docs/vi/CONTEXT_BUDGET.md`: Vietnamese mirror
- `templates/docs/en/HANDOFF_TEMPLATES.md`: phase artifact templates
- `templates/docs/vi/HANDOFF_TEMPLATES.md`: Vietnamese mirror
- `templates/skills/phase-handoff/SKILL.md`: deterministic handoff skill
- `templates/skills/NOTICE`: attribution update separating superpowers-vendored and framework-authored skills
- `skills.manifest.json`: process skill manifest update
- `test/links.test.cjs`: protocol doc assertions
- `test/init-smoke.test.cjs`: install smoke assertions
- `test/skills-vendor.test.cjs`: vendored skill assertions
- `README.md`: installed docs tree and Vietnamese attribution updates
- `docs/reports/2026-06-07-phase-handoff-protocol/*`: implementation evidence and handoff artifacts

## Commands already run
- Command: `node --test test/links.test.cjs`
  - Result: passed after docs/handoff updates
  - Exit code: 0
  - Log path: subagent bounded reports; no raw log file retained for focused passes
  - Top errors, if failed: not applicable
- Command: `node --test test/init-smoke.test.cjs`
  - Result: passed after README/init smoke verification
  - Exit code: 0
  - Log path: subagent bounded reports; no raw log file retained for focused passes
  - Top errors, if failed: not applicable
- Command: `node --test test/skills-vendor.test.cjs`
  - Result: passed after skill/manifest updates
  - Exit code: 0
  - Log path: subagent bounded reports; no raw log file retained for focused passes
  - Top errors, if failed: not applicable
- Command: `git diff --check`
  - Result: passed
  - Exit code: 0
  - Log path: `docs/reports/2026-06-07-phase-handoff-protocol/logs/20260607-1534-git-diff-check.log`
  - Top errors, if failed: not applicable
- Command: `npm test`
  - Result: passed
  - Exit code: 0
  - Log path: `docs/reports/2026-06-07-phase-handoff-protocol/logs/20260607-1534-npm-test.log`
  - Top errors, if failed: not applicable

## Test focus
- Case: Bilingual doc parity
  - Expected result: EN/VI docs file sets match and links resolve
  - Related files: `test/links.test.cjs`, `templates/docs/{en,vi}/*`
- Case: Consumer init installs protocol docs and skill
  - Expected result: init smoke finds docs and `.claude/skills/phase-handoff/SKILL.md`
  - Related files: `test/init-smoke.test.cjs`, `src/init.cjs`, `src/skills.cjs`
- Case: Vendored skill manifest matches templates
  - Expected result: skill tests pass and manifest process group matches template skills
  - Related files: `test/skills-vendor.test.cjs`, `skills.manifest.json`, `templates/skills/`

## Known risks
- Risk: Working tree includes pre-existing changes outside this integration (`AGENTS.md`, `CLAUDE.md`, root docs, package tarball)
  - Severity: medium
  - Why it matters: final handover must not claim those were authored by this implementation
  - Suggested test: final git status/name-status review and explicit changed-file summary
- Risk: Vietnamese protocol drift from English
  - Severity: medium
  - Why it matters: consumers selecting `--lang vi` must receive equivalent process rules
  - Suggested test: link/parity tests plus QA review of representative sections
