# hero-mmt-kit: split coding-assistant into its own kit

## Context

`hero-vibe-kit` currently serves two purposes:

1. **Vibecode** — AI-led agency workflow.
2. **Coding Assistant** — human-led, developer-orchestrated workflow.

Both currently live behind one profile switch, one router table (`AGENCY_WORKFLOW.md`), one hook-enforcement system with PreToolUse hard gates, and two IDE targets: Claude Code + Cursor.

This duality has become costly:

- Every session loads broad shared workflow docs even when only one task mode is needed.
- Vibecode and Coding Assistant cannot be optimized independently.
- The current router-doc-plus-hooks model is too heavy for a human-led coding assistant flow.

Decision: the `coding-assistant` branch becomes a new, independent package: **`hero-mmt-kit`**.

This is a hard branch fork from this point forward:

- Same repo.
- Independent evolution.
- No cherry-picking back to `master` / Vibecode.
- No attempt to support both kits in one consumer repo.
- No automatic migration from `.hero-vibe-kit/` to `.hero-mmt-kit/`.

`hero-mmt-kit` serves:

- Claude Code only.
- One fixed human-led coding assistant profile.
- Seven self-contained Hero skills invoked directly by the developer.
- No router-doc-plus-hard-gate workflow enforcement.

---

## Confirmed design decisions

### Product identity

- Package name becomes `hero-mmt-kit`.
- CLI binary becomes `hero-mmt-kit`.
- Runtime directory becomes `.hero-mmt-kit/`.
- Version resets to `0.1.0` before tagging/publishing.
- `hero-vibe-kit` remains the Vibecode/agency-workflow product line.

### Supported target

- Claude Code only.
- Cursor support is removed.
- Profile/surface/IDE selection is removed.

### Init flow

Init collapses to one interactive yes/no question:

```txt
Install the taste/design skill? [y/N]
```

Rules:

- Interactive mode asks only this yes/no question.
- Default answer is `No`.
- `--yes` uses the default answer and therefore skips the taste/design skill.
- Add an explicit non-interactive opt-in flag, e.g. `--taste`, to install the taste/design skill without prompting.
- No profile prompt.
- No surface prompt.
- No IDE prompt.
- No verification-level prompt.

### Workflow model

Replace the old router-doc-plus-hard-gate model with direct skills:

- `using-hero`
- `hero-planning`
- `hero-coding`
- `hero-reviewing`
- `hero-unit-test`
- `hero-security`
- `hero-strict`

The developer invokes the relevant skill directly.

### Skill philosophy

The new `hero-*` skills are self-contained at the **Hero workflow contract** level, but they do not duplicate the full technique content of vendored MIT skills.

Each `hero-*` skill must include:

- when to use it,
- required inputs,
- process steps,
- output artifact path and naming convention,
- Definition of Done,
- `ACTIVE_STATE.md` update rule,
- relevant framework constraints.

Where useful, a skill may say to apply the installed vendored skill for technique, for example:

- `brainstorming`
- `writing-plans`
- `executing-plans`
- `test-driven-development`
- `requesting-code-review`
- `receiving-code-review`
- `dispatching-parallel-agents`
- `subagent-driven-development`

But the user should not need to navigate a shared router doc or framework doc to understand the Hero-specific workflow contract.

### Vendored skills

Vendored MIT skills stay untouched:

```txt
templates/skills/brainstorming
templates/skills/writing-plans
templates/skills/executing-plans
templates/skills/test-driven-development
templates/skills/systematic-debugging
templates/skills/verification-before-completion
templates/skills/requesting-code-review
templates/skills/receiving-code-review
templates/skills/dispatching-parallel-agents
templates/skills/subagent-driven-development
templates/skills/using-git-worktrees
templates/skills/finishing-a-development-branch
templates/skills/using-superpowers
```

Reason:

- Preserve attribution.
- Avoid redistributing modified third-party content.
- Keep `hero-*` skills as framework-specific wrappers/contracts.

### Removed entirely

Drop these workflow/router/profile concepts:

- `TEAM_ROSTER.md`
- `ASSISTANCE_PROFILES.md`
- `PHASE_HANDOFF_PROTOCOL.md`
- `HANDOFF_TEMPLATES.md`
- `CONTEXT_BUDGET.md`
- `phase-handoff` skill
- 5-phase/path enum
- PreToolUse hard gates
- profile/surface/IDE selection
- Cursor support

### Kept as reference docs

Keep these as-is unless minor link/name updates are required:

- `DESIGN_STANDARDS.md`
- `PERFORMANCE_STANDARDS.md`
- `INTERACTION_PATTERNS.md`
- `PRD_AI_FEATURE.md`
- `DESIGN_BRIEF.md`

These are primarily reference docs for the optional taste/design skill.

### Hooks

Remove hard workflow enforcement hooks:

- `edit-gate.cjs`
- `workflow-check.cjs`

Keep soft/safety hooks:

- `git-guard.cjs`
- `stop-reminder.cjs`
- `session-bridge.cjs`

Update their messages to match the simplified `hero-mmt-kit` state model.

### State tracking

Keep simplified state:

- `ACTIVE_STATE.md`
- `.hero-mmt-kit/session.json`

Drop fields that only existed to drive the removed gate system:

- `path`
- `mode`
- `gates.prd`
- `gates.plan`
- `reviewBudget`
- `loop.retryCount`
- old 5-phase/path enum

Keep only enough state to answer:

> What was last worked on, and what should happen next?

Example simplified schema:

```json
{
  "schemaVersion": 1,
  "currentSkill": null,
  "lastCheckpoint": null,
  "resumePath": null,
  "nextAction": null,
  "updatedAt": null
}
```

---

## New skill set

Location:

```txt
templates/skills/
```

New skills:

| Skill | Purpose | Wraps / references | Output artifact |
|---|---|---|---|
| `using-hero` | Overview/router for the six operative Hero skills | Condensed direct-use guide | n/a |
| `hero-planning` | Turn unclear work into an approved implementation plan | `brainstorming`, `writing-plans`, condensed communication rules | `docs/plans/YYYY-MM-DD-slug.md` |
| `hero-coding` | Execute an approved plan or focused implementation task | `executing-plans`, `subagent-driven-development`, `dispatching-parallel-agents`, branch/commit conventions | `docs/coding-reports/YYYY-MM-DD-slug.md` + optional git actions |
| `hero-reviewing` | Request, receive, or synthesize code review | `requesting-code-review`, `receiving-code-review`, review DoD | `docs/reviews/YYYY-MM-DD-slug.md` |
| `hero-unit-test` | Add focused unit tests or run TDD-first implementation | `test-driven-development`, post-hoc testing guidance, test DoD | `docs/test-reports/YYYY-MM-DD-slug.md` |
| `hero-security` | Perform scoped security review | `security-review`, `SECURITY_STANDARDS.md`, OWASP Top 10 | Findings in invoking report |
| `hero-strict` | Narrow-scope discipline mode: minimal scanning, ask if unclear, avoid opportunistic changes | New behavior contract | n/a |

Each new skill should use a consistent structure:

```md
# Skill name

## Use when

## Inputs

## Process

## Output artifact

## Definition of Done

## ACTIVE_STATE.md update

## Related vendored technique skill, if applicable
```

`using-hero` should remain short. It must not become a replacement for `AGENCY_WORKFLOW.md`.

---

## Manifest and skill ordering

Update `skills.manifest.json`:

- Keep the `process` group with `installPolicy: bundled unconditionally`.
- Add the 7 new Hero skill entries.
- Use `"source": "hero-mmt-kit"` for the new Hero skills.
- Remove `phase-handoff`.

Update `src/skills.cjs`:

- Add the same 7 skills to `CORE_SKILL_ORDER`.
- Remove `phase-handoff`.

Vendored MIT skills remain untouched.

---

## Migration stance

No automatic migration from `.hero-vibe-kit/` to `.hero-mmt-kit/` is required.

`hero-mmt-kit` is treated as a new independent package.

Implementation only needs to ensure:

- new installs use `.hero-mmt-kit/`,
- updates use `.hero-mmt-kit/`,
- no new runtime files are written under `.hero-vibe-kit/`,
- generated templates no longer reference the old runtime directory.

No need to implement:

- legacy session migration,
- doctor warning for old installs,
- detect logic for legacy `hero-vibe-kit`,
- compatibility aliases.

---

## Verification strategy

Tests should stay green at the end of each implementation phase.

Do **not** defer expected test fallout to a late “test cleanup” phase.

Each phase that removes or changes behavior must update the directly affected tests in the same phase:

- Phase A updates package/bin/runtime-dir assertions and any CLI invocation tests.
- Phase B updates Cursor/profile/surface/IDE-related tests while removing those features.
- Phase C updates hook/state/doctor tests while removing hard gates and simplifying session state.
- Phase D updates manifest/skill/link tests while rewriting docs into skills.
- Phase E updates repo-level documentation and CI expectations.
- Phase F is only a final regression/sanity pass, not the main place where broken tests are fixed.

Run targeted tests during each phase when useful, then run `npm test` before moving to the next phase.

---

# Implementation phases

## Phase 0 — Inventory & decisions

Before editing, run an inventory pass for old concepts and build a checklist of references to remove, rename, or intentionally keep.

Search for:

```txt
hero-vibe-kit
.hero-vibe-kit
hero-vibe-kit.js
vibecode
coding-assistant
cursor
.cursor
CURSOR-RULE
AGENCY_WORKFLOW
ASSISTANCE_PROFILES
TEAM_ROSTER
PHASE_HANDOFF
HANDOFF_TEMPLATES
CONTEXT_BUDGET
workflow-check
edit-gate
handoff-validate
verification level
strict
surface
profile
ideTargets
```

Confirm these decisions are reflected in the implementation checklist:

- New package name: `hero-mmt-kit`.
- New binary: `hero-mmt-kit`.
- Version resets to `0.1.0`.
- Claude Code is the only supported target.
- Init asks only one yes/no question: install taste/design skill.
- Default taste/design answer is `No`.
- `--yes` skips taste/design skill.
- Add explicit `--taste` opt-in for non-interactive installs.
- No automatic migration from `.hero-vibe-kit/` to `.hero-mmt-kit/`.
- Vendored MIT skills remain untouched.
- New Hero skills are self-contained for Hero workflow contracts and may reference vendored skills for technique.

Also clean, stash, commit, or consciously preserve unrelated working-tree artifacts before starting the large refactor.

Current known working-tree artifacts to handle before implementation:

```txt
D hero-vibe-kit-4.0.0.tgz
?? docs/BROWNFIELD_DISCOVERY.md
?? docs/PHASE_HANDOFF_PROTOCOL.md
```

Expected verification:

- Inventory checklist exists.
- Unrelated working-tree artifacts are handled intentionally.
- No implementation behavior changes yet, unless cleanup is explicitly part of this phase.

---

## Phase A — Branch & package identity

Rename the package and runtime identity.

### Package/bin changes

Update `package.json`:

- `name: "hero-mmt-kit"`
- `version: "0.1.0"`
- binary entry becomes `hero-mmt-kit`

Rename:

```txt
bin/hero-vibe-kit.js
→ bin/hero-mmt-kit.js
```

Update all CLI-name strings:

- banner,
- help text,
- usage examples,
- command output,
- package references.

Update package metadata if present:

- `package-lock.json`
- `repository`
- `bugs`
- `homepage`
- badges
- `files` allowlist

Do not keep an old `hero-vibe-kit` CLI alias unless explicitly decided later. This fork is a new product identity.

### Runtime directory rename

Rename the per-project runtime convention:

```txt
.hero-vibe-kit/
→ .hero-mmt-kit/
```

Update all references in:

```txt
src/init.cjs
src/update.cjs
src/discover.cjs
src/doctor.cjs
src/detect.cjs
src/workflow-state.cjs
templates/.hero-vibe-kit/
.gitignore
tests
docs
```

Rename template directory:

```txt
templates/.hero-vibe-kit/
→ templates/.hero-mmt-kit/
```

### Tests in this phase

Update tests that directly assert:

- package name,
- binary path,
- CLI invocation path,
- runtime directory name,
- generated `.hero-mmt-kit` files.

Run targeted tests, then run `npm test`.

Expected result:

- CLI can be invoked as `node bin/hero-mmt-kit.js ...`.
- New installs write `.hero-mmt-kit/`, not `.hero-vibe-kit/`.
- Tests are green before moving to Phase B.

---

## Phase B — Drop Cursor and collapse init to one yes/no question

Remove Cursor support and profile/surface/IDE selection.

### Delete Cursor-specific files

Delete:

```txt
src/cursor.cjs
templates/CURSOR-RULE.mdc.tmpl
templates/common/.cursor/hooks.json
```

Remove Cursor merge logic:

```txt
mergeCursorHooks
```

from:

```txt
src/merge.cjs
```

### Collapse profile config

In `src/profile-config.cjs`, remove:

- `PROFILES`
- `vibecode`
- `SURFACES`
- `IDE_TARGETS`
- `IDE_CHOICES`
- `resolveIdeTargets`
- `skillDestinations`
- `defaultVerification`
- profile/surface/IDE validation
- verification-level config

Replace with a minimal config model for the one remaining choice:

```js
{
  installTasteSkill: boolean
}
```

or equivalent.

### Update integrations

In `src/integrations.cjs`:

- remove `wantsDesignIntegration(profile, surface)` derivation,
- use the explicit taste/design yes/no answer instead.

### Update init/update

In `src/init.cjs` and `src/update.cjs`:

- remove all `ideTargets.includes(...)` branching,
- always install Claude Code files,
- always install the remaining 3-hook Claude Code hook set,
- support the single taste/design yes/no prompt,
- support `--yes` as default No for taste/design,
- add explicit `--taste` non-interactive opt-in.

### Update CLI flags

In `bin/hero-mmt-kit.js`, remove:

- `--profile`
- `--surface`
- `--ide`
- verification-level flags if present and obsolete.

Add:

- `--taste`

Expected behavior:

```bash
node bin/hero-mmt-kit.js init --dir <tmp>
# asks: Install the taste/design skill? [y/N]

node bin/hero-mmt-kit.js init --dir <tmp> --yes
# skips taste/design skill

node bin/hero-mmt-kit.js init --dir <tmp> --yes --taste
# installs taste/design skill
```

### Update detect/doctor

In `src/detect.cjs`, remove brownfield checks for:

- existing Cursor hooks,
- existing Cursor rule,
- `.cursor/skills`,
- Cursor-specific install state.

In `src/doctor.cjs`, remove checks for:

- Cursor hooks,
- Cursor rule file,
- Cursor hook self-tests,
- `.cursor/skills`.

### Tests in this phase

Update affected tests in the same phase:

```txt
test/init-smoke.test.cjs
test/profile-config.test.cjs
test/discover.test.cjs
test/doctor*.test.cjs
test/hooks.test.cjs
```

Remove assertions around:

- Cursor files,
- Cursor hooks,
- `.cursor/skills`,
- Vibecode profile,
- coding-assistant profile,
- profile/surface/IDE enums,
- `--ide cursor`,
- `--ide both`,
- surface defaults,
- verification-level config if obsolete.

Add assertions for:

- only one interactive question,
- `--yes` skips taste/design skill,
- `--taste` installs taste/design skill,
- no `.cursor` files are created,
- Claude Code files are always installed.

Run targeted tests, then run `npm test`.

Expected result:

- Claude Code-only init/update flow works.
- No Cursor artifacts are generated.
- Tests are green before moving to Phase C.

---

## Phase C — Remove hard gates and simplify state

Remove the workflow hard-gate system.

### Delete hard gate hooks

Delete:

```txt
templates/common/.claude/hooks/edit-gate.cjs
templates/common/.claude/hooks/workflow-check.cjs
```

Update:

```txt
templates/common/.claude/settings.json
```

Remove:

- PreToolUse Edit/Write matcher for `edit-gate.cjs`,
- workflow-check half of the Bash matcher.

Keep:

- `git-guard.cjs` on Bash,
- `stop-reminder.cjs`,
- `session-bridge.cjs`.

### Delete handoff validation

Delete:

```txt
src/handoff-validate.cjs
templates/skills/phase-handoff/
templates/docs/PHASE_HANDOFF_PROTOCOL.md
templates/docs/HANDOFF_TEMPLATES.md
templates/docs/CONTEXT_BUDGET.md
docs/PHASE_HANDOFF_PROTOCOL.md
```

### Simplify workflow state

Update:

```txt
src/workflow-state.cjs
templates/.hero-mmt-kit/session.schema.json
```

Drop:

- `path`
- `mode`
- `gates.*`
- `reviewBudget`
- `loop.*`
- old 5-phase/path enum

Use simplified state:

```json
{
  "schemaVersion": 1,
  "currentSkill": null,
  "lastCheckpoint": null,
  "resumePath": null,
  "nextAction": null,
  "updatedAt": null
}
```

Keep `ACTIVE_STATE.md`, but simplify expectations:

- current work,
- last checkpoint,
- resume path/artifact,
- next action.

### Update soft hooks

Update messages in:

```txt
git-guard.cjs
stop-reminder.cjs
session-bridge.cjs
```

so they no longer mention:

- phases,
- gates,
- handoff,
- path/mode enums,
- PRD/plan gate enforcement.

`git-guard.cjs` remains a pure git safety hook.

### Update doctor

In `src/doctor.cjs`, remove:

- `checkWorkflowCheck`,
- edit-gate wiring checks,
- workflow-check wiring checks,
- handoff drift checks.

Keep:

- session validity check,
- `git-guard` self-test,
- `ACTIVE_STATE.md` bloat warning,
- soft state visibility checks.

### Tests in this phase

Update affected tests in the same phase:

```txt
test/hooks.test.cjs
test/doctor-workflow.test.cjs
test/workflow-state.test.cjs
test/handoff-validate.test.cjs
```

Delete:

```txt
test/handoff-validate.test.cjs
```

Remove hook-behavior blocks for:

- `edit-gate`,
- `workflow-check`.

Keep and update blocks for:

- `git-guard`,
- `stop-reminder`,
- `session-bridge`.

Update state tests for the simplified schema.

Run targeted tests, then run `npm test`.

Expected result:

- No hard PreToolUse workflow gate remains.
- Simplified session schema validates.
- Doctor no longer expects removed gate wiring.
- Tests are green before moving to Phase D.

---

## Phase D — Docs to skills consolidation

Replace shared router/process docs with self-contained Hero skills.

### Add new Hero skills

Create:

```txt
templates/skills/using-hero/SKILL.md
templates/skills/hero-planning/SKILL.md
templates/skills/hero-coding/SKILL.md
templates/skills/hero-reviewing/SKILL.md
templates/skills/hero-unit-test/SKILL.md
templates/skills/hero-security/SKILL.md
templates/skills/hero-strict/SKILL.md
```

Each operative skill should include:

- Use when
- Inputs
- Process
- Output artifact
- Definition of Done
- `ACTIVE_STATE.md` update
- Related vendored technique skill, if applicable

Artifact conventions:

```txt
hero-planning:
docs/plans/YYYY-MM-DD-slug.md

hero-coding:
docs/coding-reports/YYYY-MM-DD-slug.md

hero-reviewing:
docs/reviews/YYYY-MM-DD-slug.md

hero-unit-test:
docs/test-reports/YYYY-MM-DD-slug.md

hero-security:
findings in the invoking report

hero-strict:
n/a

using-hero:
n/a
```

### Delete replaced docs

Delete:

```txt
templates/docs/AGENCY_WORKFLOW.md
templates/docs/BRANCHING.md
templates/docs/DEFINITION_OF_DONE.md
templates/docs/TEAM_ROSTER.md
templates/docs/COMMUNICATION_PROTOCOL.md
templates/docs/ARTIFACTS_AND_STORAGE.md
templates/docs/ASSISTANCE_PROFILES.md
```

Keep:

```txt
templates/docs/ACTIVE_STATE.md
templates/docs/BROWNFIELD_DISCOVERY.md
templates/docs/SECURITY_STANDARDS.md
templates/docs/DESIGN_STANDARDS.md
templates/docs/PERFORMANCE_STANDARDS.md
templates/docs/INTERACTION_PATTERNS.md
templates/PRD_AI_FEATURE.md
templates/DESIGN_BRIEF.md
```

`hero-security` may either:

- point at `SECURITY_STANDARDS.md`, or
- fold a condensed OWASP checklist into the skill.

Decide based on length while writing. The skill itself must remain usable without a router doc.

### Rewrite generated instruction files

Update:

```txt
templates/CLAUDE.md.tmpl
templates/AGENTS.md.tmpl
```

Remove template variables:

```txt
{{ASSISTANCE_PROFILE}}
{{PROJECT_SURFACE}}
{{VERIFICATION_LEVEL}}
```

Remove links to:

```txt
AGENCY_WORKFLOW.md
ASSISTANCE_PROFILES.md
TEAM_ROSTER.md
PHASE_HANDOFF_PROTOCOL.md
```

Replace with a short direct skill list:

```md
Use `using-hero` for the overview.

Core Hero skills:
- `hero-planning`
- `hero-coding`
- `hero-reviewing`
- `hero-unit-test`
- `hero-security`
- `hero-strict`
```

### Update manifest/order

Update:

```txt
skills.manifest.json
src/skills.cjs
```

Add:

```txt
using-hero
hero-planning
hero-coding
hero-reviewing
hero-unit-test
hero-security
hero-strict
```

Remove:

```txt
phase-handoff
```

### Tests in this phase

Update affected tests in the same phase:

```txt
test/manifest.test.cjs
test/skills-selection.test.cjs
test/skills-vendor.test.cjs
test/links.test.cjs
test/init-smoke.test.cjs
```

Specific test changes:

- update expected skill lists,
- assert 7 new Hero skills are installed,
- assert `phase-handoff` is absent,
- keep vendored skill checks unchanged,
- keep generic link checking,
- delete the specific test that asserts phase handoff protocol is wired into workflow docs.

Run targeted tests, then run `npm test`.

Expected result:

- New Hero skills install.
- Deleted docs are no longer referenced by generated templates.
- Vendored skills remain untouched.
- Tests are green before moving to Phase E.

---

## Phase E — Repo-level docs and CI

Update repo-level docs for the new product identity.

### README

Rewrite install/usage sections for:

- `hero-mmt-kit`,
- Claude Code-only setup,
- one-question init flow,
- optional `--taste`,
- no Cursor support,
- no profiles/surfaces.

Remove examples using:

```txt
--ide cursor
--ide both
--profile
--surface
```

Add relationship note:

```md
hero-vibe-kit is the AI-led agency workflow kit.
hero-mmt-kit is the human-led Claude Code coding assistant kit.
```

### CHANGELOG

Add a new entry describing:

- hard fork from `hero-vibe-kit`,
- package rename to `hero-mmt-kit`,
- version reset to `0.1.0`,
- Claude Code-only target,
- removal of Cursor/profile/surface,
- replacement of router docs and hard gates with direct Hero skills.

Do not rewrite old history.

### CONTRIBUTING

Update references to:

- package name,
- CLI binary,
- runtime directory,
- removed profile/surface concepts,
- removed Cursor target,
- new skill-first architecture.

### Root CLAUDE.md

Update project instructions to say this repo/branch is now the `hero-mmt-kit` framework, not `hero-vibe-kit`.

Update relevant paths:

- CLI binary,
- template locations,
- runtime directory,
- skill model.

Preserve house rules:

- zero runtime dependencies,
- English-only templates,
- placeholders,
- vendored skill attribution policy.

### CI

Update:

```txt
.github/workflows/ci.yml
```

Remove obsolete flags:

```txt
--ide claude-code
```

if Claude Code is now the only target.

### Gitignore

Update patterns:

```txt
.hero-vibe-kit/
→ .hero-mmt-kit/
```

### Tests in this phase

Update docs/CI-related assertions as needed.

Run `npm test`.

Expected result:

- Repo docs describe `hero-mmt-kit`.
- CI no longer depends on removed flags.
- Tests are green before moving to Phase F.

---

## Phase F — Final test and cleanup pass

This phase is not where expected fallout from earlier phases is fixed. Earlier phases must update their own tests before completion.

### Final automated checks

Run:

```bash
npm test
```

Run old-reference searches for dropped concepts and confirm remaining hits are intentional:

```txt
hero-vibe-kit
.hero-vibe-kit
hero-vibe-kit.js
vibecode
cursor
.cursor
CURSOR-RULE
AGENCY_WORKFLOW
ASSISTANCE_PROFILES
TEAM_ROSTER
PHASE_HANDOFF
HANDOFF_TEMPLATES
CONTEXT_BUDGET
workflow-check
edit-gate
handoff-validate
surface
ideTargets
```

Allowed remaining hits should be limited to intentional history/changelog/context references.

### Manual smoke

Run in scratch directories:

```bash
node bin/hero-mmt-kit.js init --dir <tmp> --yes
```

Confirm:

- no taste/design skill installed,
- `.claude/skills/hero-*` installed,
- `.hero-mmt-kit/session.json` created,
- `.claude/settings.json` contains only kept hooks,
- no `.cursor` files,
- no `.hero-vibe-kit` files.

Run:

```bash
node bin/hero-mmt-kit.js init --dir <tmp> --yes --taste
```

Confirm:

- taste/design skill or integration is installed,
- normal Hero skills still install.

Run:

```bash
node bin/hero-mmt-kit.js doctor --dir <tmp>
```

Confirm doctor passes.

Run:

```bash
node bin/hero-mmt-kit.js update --dir <tmp> --yes
```

Confirm update preserves the new model and does not recreate removed artifacts.

### Package sanity

Run:

```bash
npm pack --dry-run
```

Confirm package does not include:

- Cursor templates,
- Cursor rules,
- Cursor hooks,
- `.hero-vibe-kit` runtime templates,
- `phase-handoff` skill,
- removed workflow docs,
- `edit-gate.cjs`,
- `workflow-check.cjs`,
- obsolete handoff validation files.

Confirm package includes:

- `bin/hero-mmt-kit.js`,
- `.hero-mmt-kit` templates,
- 7 new Hero skills,
- vendored MIT skills unchanged,
- required docs/templates.

---

## Final verification checklist

Before tagging/publishing:

- [ ] Package name is `hero-mmt-kit`.
- [ ] Version is `0.1.0`.
- [ ] Binary is `hero-mmt-kit`.
- [ ] No old `hero-vibe-kit` binary remains unless intentionally documented.
- [ ] Runtime directory is `.hero-mmt-kit`.
- [ ] Init asks only one yes/no question in interactive mode.
- [ ] `--yes` skips taste/design skill.
- [ ] `--taste` installs taste/design skill.
- [ ] Claude Code is the only supported target.
- [ ] Cursor files are removed.
- [ ] Profile/surface/IDE config is removed.
- [ ] Hard workflow gates are removed.
- [ ] `git-guard`, `stop-reminder`, and `session-bridge` remain.
- [ ] Simplified session schema works.
- [ ] `ACTIVE_STATE.md` convention is updated.
- [ ] 7 Hero skills are installed.
- [ ] Vendored MIT skills are untouched.
- [ ] Removed docs are not referenced by templates.
- [ ] `npm test` passes.
- [ ] Manual init/update/doctor smoke passes.
- [ ] `npm pack --dry-run` output is clean.
- [ ] Old-reference search has no unintentional hits.

---

## Expected end state

After completion, `hero-mmt-kit` is a focused Claude Code framework package for human-led development.

It no longer contains:

- Vibecode profile logic,
- Cursor support,
- router-doc workflow enforcement,
- hard PreToolUse workflow gates,
- handoff protocol machinery,
- multi-profile/surface/IDE configuration.

It does contain:

- a single clear CLI identity,
- a single Claude Code target,
- a simple one-question init flow,
- simplified state tracking,
- soft reminders/safety hooks,
- seven direct-use Hero skills,
- unchanged vendored MIT technique skills,
- clean tests and package contents.
