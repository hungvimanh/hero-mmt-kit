# Phase Handoff — Design / Architecture → Code

## Status
- Work item: Phase Handoff Protocol Integration
- Mode: full
- From phase: Design / Architecture
- To phase: Code
- Status: green
- Approval: approved
- Approved by: user
- Approval evidence: User message "approve spec" on 2026-06-07
- Approval note: Design spec approved; implementation plan approved for subagent-driven execution.
- Branch: master
- Base commit: e19641b
- Working tree state: dirty; includes pre-existing AGENTS.md, CLAUDE.md, docs/BROWNFIELD_DISCOVERY.md, docs/PHASE_HANDOFF_PROTOCOL.md, hero-vibe-kit-0.6.3.tgz plus current plan/test/report changes
- Evidence captured against: branch master, commit e19641b, working tree dirty, diff summary not yet captured to log, captured at 2026-06-07 local during implementation planning
- Last updated: 2026-06-07

## Source of truth
- Latest user instruction: "approve spec" and execution choice "1" for subagent-driven development
- Latest approved handoff/amendment: this handoff
- Referenced artifacts:
  - `docs/superpowers/specs/2026-06-07-phase-handoff-protocol-integration-design.md`
  - `docs/superpowers/plans/2026-06-07-phase-handoff-protocol-integration.md`
- Evidence paths:
  - `docs/reports/2026-06-07-phase-handoff-protocol/artifacts/skill-red-pressure.md`

## Read first
- `docs/reports/2026-06-07-phase-handoff-protocol/resume.md`
- this handoff
- `docs/superpowers/plans/2026-06-07-phase-handoff-protocol-integration.md`

## Do not read
- old transcripts
- full logs unless debugging a listed failure
- full diffs unless a specific hunk is requested
- broad docs unless listed under required files

## Next action
- Next role: implementer
- Objective: execute the approved plan task-by-task with TDD for tests and skill authoring.
- Stop condition: implementation reaches Code → Test handoff with updated tests and evidence.
- Required tools/skills: test-driven-development, writing-skills, verification-before-completion, GitNexus impact/detect changes as required.

## Implementation contract
- Architecture approach: docs/templates/tests/skill integration only; no runtime dependency or CLI command.
- API/module/interface contract: no public CLI API changes.
- Data contract: new template docs and skill files copied by existing init/update copy/render paths.

## Task list
- [ ] Add protocol docs EN/VI per approved spec.
- [ ] Update operational docs EN/VI without weakening existing workflow requirements.
- [ ] Add `phase-handoff` skill and manifest/NOTICE updates.
- [ ] Keep RED tests as acceptance coverage; do not redo already captured RED setup unless tests change.
- [ ] Run focused tests, then `npm test`, and prepare Code → Test handoff evidence.

## Implementation already started
- RED tests and the RED pressure artifact were captured before this handoff was finalized.
- Existing RED pressure evidence: `docs/reports/2026-06-07-phase-handoff-protocol/artifacts/skill-red-pressure.md`

## Test strategy
- Unit tests: `node --test test/links.test.cjs test/init-smoke.test.cjs test/skills-vendor.test.cjs`
- Integration tests: `npm test`
- Manual checks: inspect installed smoke output for docs/skill presence.
- Regression focus: bilingual parity, doc links, zero runtime dependencies, skill vendoring.
