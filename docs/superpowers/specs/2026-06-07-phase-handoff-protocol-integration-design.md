# Phase Handoff Protocol Integration — Design Spec

Date: 2026-06-07
Status: Draft for user review

## 1. Purpose

`hero-vibe-kit` should help long AI coding sessions cross real workflow phase boundaries without using chat history as the primary state store. The framework already has a task router, context-budget rules, prompt handoffs, and bounded sub-agent behavior. The missing optimization is a formal, artifact-first **Phase Handoff Protocol** that defines when a phase boundary exists, which handoff artifact to create, how the next phase starts, and what evidence is required before final claims.

This design integrates `docs/PHASE_HANDOFF_PROTOCOL.md` into the framework templates and adds a curated `phase-handoff` skill so installed consumer projects can create bounded, evidence-backed handoffs instead of relying on bloated transcripts.

## 2. Current foundation

Relevant existing framework pieces:

- `templates/docs/{en,vi}/AGENCY_WORKFLOW.md` is the workflow router and single source of truth for paths, gates, and phases.
- `templates/docs/{en,vi}/CONTEXT_BUDGET.md` already teaches no-dump rules, resume packets, compact/fresh-session prompts, and API 400 recovery.
- `templates/docs/{en,vi}/HANDOFF_TEMPLATES.md` already provides bounded prompt contracts for BA, Architect, Implementer, reviewers, brownfield discovery, and handover.
- `templates/docs/{en,vi}/ARTIFACTS_AND_STORAGE.md` already defines durable state locations and report artifacts.
- `templates/skills/` ships curated MIT-licensed process skills into consumer `.claude/skills/`.
- Tests already validate bilingual doc links, identical EN/VI template doc file sets, skill vendoring, and init smoke behavior.

The protocol should layer on top of those pieces. It must not turn `AGENCY_WORKFLOW.md` or `CONTEXT_BUDGET.md` into long always-loaded reference documents.

## 3. Design principles

1. **Artifact-first, not chat-first.** Phase transitions use bounded handoff artifacts. Old chat history is not the source of truth for the next phase.
2. **Smallest mode that fits.** Tiny and Small work avoid unnecessary ceremony; Standard and Full work require handoffs at meaningful phase boundaries.
3. **Bounded canonical artifacts.** `resume.md` is a short pointer. The latest handoff under `handoffs/` is the phase contract. Raw logs, diffs, and reviews belong in supporting artifacts.
4. **Fresh evidence for claims.** Code/test/QA claims must reference evidence produced after the relevant changes on the expected branch and working tree.
5. **Sanity check before trust.** The next phase reads artifacts first, then runs a minimal repo-state sanity check before relying on them.
6. **Bilingual parity.** Every EN template-doc change must be mirrored in VI with equivalent structure, links, headings, and protocol-specific acceptance criteria.
7. **No new runtime dependency.** Integration remains docs/templates/tests/skills only.
8. **Curated skill only.** The new `phase-handoff` skill is authored for this framework and shipped under the existing vendored-skills model; it must not redistribute third-party non-permissive content.

## 4. Proposed architecture

The integration has four layers:

```text
Full reference protocol
  → short operational docs
  → phase-specific handoff templates
  → deterministic phase-handoff skill
```

### 4.1 Full reference protocol

Add the protocol as a reference document in both template languages:

- `templates/docs/en/PHASE_HANDOFF_PROTOCOL.md`
- `templates/docs/vi/PHASE_HANDOFF_PROTOCOL.md`

The full reference is read when designing/debugging workflow behavior, not on every request. Other docs link to it but do not copy its full body.

### 4.2 Operational docs

Update the always-used workflow/context docs with only short operational rules:

- `AGENCY_WORKFLOW.md`: mode selection and phase-boundary rules.
- `CONTEXT_BUDGET.md`: artifact-first checklist, sanity check, evidence freshness, and final-claim contract.
- `HANDOFF_TEMPLATES.md`: phase-specific handoff templates and short next-phase prompts.

### 4.3 Skill

Add:

- `templates/skills/phase-handoff/SKILL.md`

The skill is a deterministic workflow helper. It does not implement code. It guides an agent to:

1. identify current mode and phase boundary,
2. choose the correct handoff template,
3. collect concise repo/evidence state,
4. write or update the canonical handoff,
5. update `resume.md`,
6. output the next-phase prompt,
7. recommend `/compact`, fresh session, or sub-agent boundary when context pressure warrants it.

### 4.4 Tests

Update tests so the framework fails if the protocol integration drifts or a consumer install misses the new docs/skill.

## 5. Documentation changes

### 5.1 `templates/docs/{en,vi}/PHASE_HANDOFF_PROTOCOL.md`

Add the full reference protocol. The EN document should preserve the operational structure from `docs/PHASE_HANDOFF_PROTOCOL.md`. The VI document should mirror headings and meaning, not necessarily word-for-word phrasing.

Required content:

- operational summary,
- workflow modes: Tiny, Small, Standard, Full,
- real phase boundary definition,
- status/verdict/severity model,
- canonical vs supporting artifacts,
- recommended report layout,
- read/write budgets and size limits,
- approval states and evidence,
- base handoff template,
- phase-specific templates,
- resume template,
- change request and stale handoff rules,
- evidence freshness and sanity check,
- context planning/circuit breaker/recovery,
- sub-agent output rules,
- Definition of Done and final verification contract,
- hero-vibe-kit integration appendix.

### 5.2 `templates/docs/{en,vi}/AGENCY_WORKFLOW.md`

Add a short section near the existing context-budget protocol:

- Select a mode before selecting ceremony:
  - Tiny for trivial local changes.
  - Small for localized low-risk work.
  - Standard for existing behavior changes, refactors, meaningful tests/review, or project-required impact analysis.
  - Full for new features, architecture/API/data/security-sensitive work, or high regression cost.
- A real phase boundary occurs when role/mindset changes, user approval or QA is expected, implementation moves to verification, context pressure rises, or a sub-agent/workflow boundary is crossed.
- Standard/Full paths use bounded handoff artifacts at phase boundaries; Tiny/Small do not create reports unless needed for context pressure or evidence.
- Phase starts artifact-first from `resume.md` and the latest canonical handoff, then runs a minimal sanity check.
- Link to `PHASE_HANDOFF_PROTOCOL.md` in related docs.

### 5.3 `templates/docs/{en,vi}/CONTEXT_BUDGET.md`

Refine the existing resume/context rules to align with the protocol:

- `resume.md` should be a pointer to the latest canonical handoff, not a duplicate summary.
- Raw logs, full diffs, and full reviews go under supporting artifacts.
- Add the structured sanity check format:
  - Branch,
  - Working tree,
  - Canonical handoff freshness,
  - Required files exist,
  - Changed files summary,
  - Required commands available,
  - Open blockers,
  - Decision.
- Add evidence freshness rules for changed code, tests, and QA claims.
- Add final-claim guard: if verification evidence is missing, the final user-facing response must say it is implemented but not fully verified and explain why.
- Link to `PHASE_HANDOFF_PROTOCOL.md` for full templates and edge cases.

### 5.4 `templates/docs/{en,vi}/HANDOFF_TEMPLATES.md`

Add a new section for phase-boundary artifacts. It should provide concise templates rather than the full protocol.

Required templates:

- Base handoff status/source/read-first/do-not-read/next-action block.
- BA / Discovery → Design / Architecture.
- Design / Architecture → Code.
- Code → Test.
- Test → Verify / QA.
- Verify / QA → Handover.
- Resume packet pointer format.
- QA sub-agent prompt.
- Short next-phase prompt for fresh sessions or bounded sub-agents.

The existing prompt-contract templates remain useful for sub-agent delegation. The new section should make clear when to use artifact handoffs versus one-off bounded prompts.

### 5.5 Other docs

Update lightweight references where needed:

- `README.md`: mention `PHASE_HANDOFF_PROTOCOL.md` and `CONTEXT_BUDGET.md` in the installed docs tree if the docs list is updated.
- `CHANGELOG.md`: add an Unreleased entry if the repo convention supports it.
- `CLAUDE.md` / `AGENTS.md` templates only if managed blocks need a pointer; avoid duplicating protocol details.

## 6. Skill design: `phase-handoff`

### 6.1 Trigger

The skill description should use trigger-only wording, such as:

```yaml
description: Use when crossing workflow phase boundaries, creating resume packets, recovering from context pressure, or handing work to a fresh session or sub-agent
```

### 6.2 Core content

The skill should be concise and deterministic:

- When to use / when not to use.
- Required inputs.
- Mode and phase-boundary decision table.
- Handoff creation steps.
- Archive/update rules for canonical handoffs.
- Evidence freshness checklist.
- Structured sanity check for the next phase.
- Output format with the next-phase prompt.
- Common mistakes.

### 6.3 Boundaries

The skill must not:

- implement code,
- run broad exploration,
- paste full logs/diffs/files,
- duplicate full protocol text,
- claim completion without final verification evidence,
- silently overwrite already-consumed canonical handoffs.

### 6.4 Skill testing approach

Because this is a skill, use documentation TDD:

- RED: run a baseline pressure scenario without referencing the new skill. The scenario should ask an agent to cross from implementation to QA after multiple files changed and noisy tests ran. Expected failure: relying on chat, skipping `resume.md`, missing evidence identity, or returning an unbounded transcript-like handoff.
- GREEN: write the skill and run a with-skill scenario. Expected pass: chooses mode/phase, writes bounded handoff/resume structure, lists evidence paths, includes sanity check and next-phase prompt, and avoids raw logs/diffs.
- REFACTOR: if the with-skill agent finds loopholes, tighten the skill with explicit counters.

For repo tests, practical smoke coverage should ensure the skill is present and installed. The behavioral pressure scenario can be documented in the implementation report if it cannot be automated cheaply.

## 7. Test strategy

### 7.1 Link and parity tests

Extend `test/links.test.cjs` or add a focused test that verifies:

- `templates/docs/en/PHASE_HANDOFF_PROTOCOL.md` and `templates/docs/vi/PHASE_HANDOFF_PROTOCOL.md` both exist.
- EN/VI docs trees still have identical relative file sets.
- Links resolve in both languages.
- Protocol-related headings or phrases appear in both languages, including:
  - mode selection,
  - real phase boundary,
  - `resume.md`,
  - sanity check,
  - evidence freshness,
  - final verification.

### 7.2 Init smoke tests

Update `test/init-smoke.test.cjs` expectations so a new consumer project includes:

- `docs/PHASE_HANDOFF_PROTOCOL.md`,
- `docs/CONTEXT_BUDGET.md`,
- `docs/HANDOFF_TEMPLATES.md`,
- `.claude/skills/phase-handoff/SKILL.md`.

Also verify installed workflow docs reference the protocol but do not include duplicate full protocol sections in `CLAUDE.md` managed blocks.

### 7.3 Skill vendor tests

Update `test/skills-vendor.test.cjs` or equivalent to ensure:

- `phase-handoff` is included in the curated skill set,
- `SKILL.md` has valid frontmatter with `name` and `description`,
- the skill has no prohibited placeholders,
- `NOTICE` remains accurate for vendored third-party skills. If `phase-handoff` is authored in this repo, it should not require third-party attribution beyond the project license.

### 7.4 Full verification

Run:

```text
npm test
```

Before final completion claims, also run project-required checks for changed code/docs:

- `git diff --check`,
- `gitnexus_detect_changes()` before any commit,
- relevant smoke/link tests if full `npm test` is unavailable.

## 8. Report and handoff artifacts for this implementation

Because this work itself is a Full/Standard process-framework change, create a report folder during implementation:

```text
docs/reports/2026-06-07-phase-handoff-protocol/
  resume.md
  handoffs/
    02-design-to-code.md
    03-code-to-test.md
    04-test-to-qa.md
    05-qa-to-handover.md
  logs/
  reviews/
```

Create directories only when used. Do not create empty placeholder directories.

The design spec is the approved design source. The implementation plan should decide the exact task sequence and evidence artifacts.

## 9. Risks and mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| Docs become too long and always-loaded context grows | High | Keep full protocol in `PHASE_HANDOFF_PROTOCOL.md`; keep `AGENCY_WORKFLOW.md` and `CONTEXT_BUDGET.md` operational and short. |
| EN/VI parity drifts | High | Mirror file sets and headings; add targeted tests for protocol phrases. |
| Skill becomes a process essay rather than deterministic helper | Medium | Keep `SKILL.md` concise; link protocol for details; focus on exact steps/output. |
| New skill lacks behavioral proof | Medium | Run at least one baseline and one with-skill pressure scenario; record findings in the implementation report. |
| Framework encourages ceremony for tiny tasks | Medium | Make Tiny/Small paths explicitly avoid report folders unless context pressure or evidence requires them. |
| Final claims still rely on memory | High | Add final verification contract to docs and skill; tests check key phrases. |

## 10. Acceptance criteria

The integration is complete when:

1. `templates/docs/en/PHASE_HANDOFF_PROTOCOL.md` and `templates/docs/vi/PHASE_HANDOFF_PROTOCOL.md` exist and links resolve.
2. `AGENCY_WORKFLOW.md`, `CONTEXT_BUDGET.md`, and `HANDOFF_TEMPLATES.md` in both languages reference the protocol and expose short operational rules.
3. `templates/skills/phase-handoff/SKILL.md` exists with valid skill frontmatter and deterministic phase-handoff guidance.
4. Init installs `docs/PHASE_HANDOFF_PROTOCOL.md` and `.claude/skills/phase-handoff/SKILL.md` into a consumer project.
5. Tests verify bilingual parity, protocol references, installed docs, and installed skill presence.
6. No runtime dependencies are added.
7. Raw logs/diffs are not copied into handoff bodies or chat responses.
8. The implementation records evidence under `docs/reports/2026-06-07-phase-handoff-protocol/` when commands or QA outputs are noisy.
9. Final response states what was changed, what was verified, and what was not verified.

## 11. Spec self-review

- Placeholder scan: no `TBD`, `TODO`, or unresolved fill-in sections are required for implementation.
- Internal consistency: the proposed layers match the accepted design and avoid putting the full protocol into always-loaded docs.
- Scope check: this is one cohesive framework integration; CLI automation is intentionally out of scope.
- Ambiguity check: the scope includes docs, tests, and the `phase-handoff` skill; it excludes a new `hero-vibe-kit handoff` CLI command.
