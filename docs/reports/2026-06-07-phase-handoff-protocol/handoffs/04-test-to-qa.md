# Phase Handoff — Test → Verify / QA

## Status
- Work item: Phase Handoff Protocol Integration
- Mode: full
- From phase: Test
- To phase: Verify / QA
- Status: green
- Approval: approved
- Approved by: workflow gate
- Approval evidence: User approved the design spec and selected Subagent-Driven execution; Test → QA transition is required by the Full-mode QA gate and backed by fresh test evidence.
- Approval note: Ready for bounded QA review.
- Branch: master
- Base commit: e19641b
- Working tree state: dirty; includes pre-existing files outside this integration plus current integration changes
- Evidence captured against: branch master, commit e19641b, working tree dirty, diff summary `docs/reports/2026-06-07-phase-handoff-protocol/logs/20260607-1534-git-diff-name-status.log`, captured at 2026-06-07 15:34–15:36 local
- Last updated: 2026-06-07

## Source of truth
- Latest user instruction: `1` selecting Subagent-Driven execution after approving the spec
- Latest approved handoff/amendment: `docs/reports/2026-06-07-phase-handoff-protocol/handoffs/03-code-to-test.md`
- Referenced artifacts:
  - `docs/superpowers/specs/2026-06-07-phase-handoff-protocol-integration-design.md`
  - `docs/superpowers/plans/2026-06-07-phase-handoff-protocol-integration.md`
- Evidence paths:
  - `docs/reports/2026-06-07-phase-handoff-protocol/logs/20260607-1534-git-diff-check.log`
  - `docs/reports/2026-06-07-phase-handoff-protocol/logs/20260607-1534-npm-test.log`
  - `docs/reports/2026-06-07-phase-handoff-protocol/logs/20260607-1536-gitnexus-detect-changes.md`

## Read first
- `docs/reports/2026-06-07-phase-handoff-protocol/resume.md`
- this handoff
- `docs/reports/2026-06-07-phase-handoff-protocol/handoffs/03-code-to-test.md`

## Do not read
- old transcripts
- full logs unless debugging a listed failure
- full diffs unless a specific hunk is requested
- broad docs beyond files listed in QA scope

## Next action
- Next role: QA reviewer
- Objective: challenge protocol integration for missing docs, broken parity, weak skill behavior, and test gaps.
- Stop condition: QA verdict is `pass`, `yellow`, `fail`, or `blocked` with evidence.
- Required tools/skills: requesting-code-review or code-review, verification-before-completion

## Test evidence
- Command: `npm test`
  - Status: passed
  - Exit code: 0
  - Log path: `docs/reports/2026-06-07-phase-handoff-protocol/logs/20260607-1534-npm-test.log`
  - Top errors: none
- Command: `git diff --check`
  - Status: passed
  - Exit code: 0
  - Log path: `docs/reports/2026-06-07-phase-handoff-protocol/logs/20260607-1534-git-diff-check.log`
  - Top errors: none
- Tool: `gitnexus_detect_changes({ scope: "all", repo: "hero-vibe-kit" })`
  - Status: passed
  - Exit code: not applicable
  - Log path: `docs/reports/2026-06-07-phase-handoff-protocol/logs/20260607-1536-gitnexus-detect-changes.md`
  - Top errors: none; risk low, 0 affected execution flows

## QA scope
- Review focus: docs are not bloated, protocol links work, EN/VI parity exists, skill is deterministic, tests cover install behavior.
- Files to inspect:
  - `templates/docs/en/AGENCY_WORKFLOW.md`
  - `templates/docs/en/CONTEXT_BUDGET.md`
  - `templates/docs/en/HANDOFF_TEMPLATES.md`
  - `templates/docs/en/PHASE_HANDOFF_PROTOCOL.md`
  - `templates/docs/vi/AGENCY_WORKFLOW.md`
  - `templates/docs/vi/CONTEXT_BUDGET.md`
  - `templates/docs/vi/HANDOFF_TEMPLATES.md`
  - `templates/docs/vi/PHASE_HANDOFF_PROTOCOL.md`
  - `templates/skills/phase-handoff/SKILL.md`
  - `test/links.test.cjs`
  - `test/init-smoke.test.cjs`
  - `test/skills-vendor.test.cjs`
- Risks to challenge:
  - full protocol copied into always-loaded docs,
  - Tiny/Small ceremony overreach,
  - missing final-claim evidence requirement,
  - skill silently overwrites handoffs,
  - init/update fails to install new skill,
  - pre-existing dirty working tree files are misattributed to this task.
- Coverage limit: return top 5 findings in chat; write full list to `reviews/qa-review.md` if longer.
- If more than 5 findings are found: list highest severity 5 and write the rest to `reviews/qa-review.md`.
