# Harness + Loop Engineering — v2.0.0 Implementation Plan

> **Status:** Awaiting user approval — **do not implement until this plan is explicitly approved.**
>
> **For agentic workers (post-approval):** REQUIRED SUB-SKILL: `phase-handoff` at real phase boundaries; use `subagent-driven-development` for independent implementation tracks or `executing-plans` for sequential inline work. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Operationalize the existing doc-driven orchestration model by adding **Harness engineering** (an *observable, checkable* compliance layer via session state, extended `doctor`, and soft hooks) and **Loop engineering** (deterministic phase/session loops via strengthened `phase-handoff` skill and router integration) — **without** a separate orchestrator runtime. Ship as **semver 2.0.0**.

### Positioning — what this layer is and is not (read first)

v2.0.0 makes workflow state **observable and checkable**, not **cryptographically enforced**. Be honest about this when documenting and naming:

- **Is:** a state file agents write at boundaries, a `doctor` that *reports* compliance and *detects drift*, hooks that *remind*, **and one path-aware hard gate** that prevents committing gated (Standard/Full) work without a state checkpoint. Value = visibility + drift detection + resumability + "no more manual reminders to update state."
- **Is not:** a runtime that prevents *every* possible skip. The gate fires only at `git commit` on Standard/Full; an agent can still produce a thin/low-quality checkpoint. `doctor` treats `session.json` as *suspect*, not authoritative, and detects drift.
- **Two hard guardrails** in 2.0.0: `git-guard` (unchanged) **and** the new **state-checkpoint commit gate** (`workflow-check`, Standard/Full only, with `HVK_SKIP_STATE_GATE=1` escape hatch and fail-safe exit 0 on missing/legacy session). Soft reminders still cover the commit-less pause case (stop-reminder).
- **Why hard, not warn:** the explicit product goal is that the user never again has to prompt "remember to update project state." Warn-only does not achieve that — it still relies on agent compliance. The gate is the mechanism that removes the manual reminder.
- **Anti-false-confidence rule:** a stale or self-contradictory session is worse than none. `doctor` cross-checks session against artifacts and warns on divergence rather than trusting the file blindly (see Task 3.2).

**Architecture:** Additive evolution on top of current SSOT (`AGENCY_WORKFLOW.md`). New mechanics live in:
- `.hero-vibe-kit/session.json` — session-scoped workflow state (path, gate, review budget, phase pointer)
- `src/workflow-state.cjs` + `src/handoff-validate.cjs` — zero-dep parsers/validators
- Extended `src/doctor.cjs` — compliance checks (warn-first by default; `--strict` for CI)
- Optional new hook `workflow-check.cjs` — soft reminders at shell boundaries
- Strengthened `templates/skills/phase-handoff/SKILL.md` — loop executor at phase boundaries

**Tech stack:** Node built-ins only, `node:test`, Markdown templates (English-only), existing hook merge/init/update pipeline.

**Out of scope (v2.0.0):** Orchestrator runtime/service, MCP server, new runtime dependencies, bilingual templates, automatic `/compact`, CI workflow files in consumer repos (document only).

**Related prior work:** `docs/superpowers/specs/2026-06-06-process-first-self-prompting-workflow-design.md`, `templates/skills/phase-handoff/`, `PHASE_HANDOFF_PROTOCOL.md`.

---

## SemVer 2.0.0 rationale

| Change | Breaking? | Notes |
|--------|-----------|-------|
| New `.hero-vibe-kit/session.json` on `init` | Soft breaking | Old projects lack file; `doctor` warns, does not fail unless `--strict` |
| New `workflow-check.cjs` hook wired on `update` | Soft breaking | Merge-safe; only reminds |
| `doctor` new compliance section | Soft breaking | Default = warn; `--strict` exits 1 (for CI) |
| Handoff YAML frontmatter (optional) | Non-breaking | Legacy markdown handoffs still valid |
| Dedup prose in `PHASE_HANDOFF_PROTOCOL` | Non-breaking | Reference doc trimmed, not removed |
| `phase-handoff` skill behavior extended | Behavioral | Agents should invoke at boundaries; no API break |

**2.0.0 is justified** because: (1) installed consumer surface changes (new state file + hook), (2) `doctor` contract expands, (3) operational loop behavior shifts from prose-only to state-backed mechanics. Mitigation: **warn-first defaults**, `update` is idempotent, brownfield merge preserved.

---

## Approval gate (mandatory)

- [ ] **User reviews and approves this plan** (comment "approved" or list requested edits).
- [ ] **No implementation commits** until approval.
- [ ] After approval: create branch `feat/harness-loop-2.0.0` off `main`.

---

## House rules (every task)

1. **Zero runtime dependencies** — CLI uses only Node built-ins (`CONTRIBUTING.md`).
2. **English-only templates** — all template doc/skill changes under `templates/` in English.
3. **SSOT preserved** — routing/path/gates stay in `AGENCY_WORKFLOW.md`; do not duplicate full `PHASE_HANDOFF_PROTOCOL` into always-loaded docs.
4. **Managed regions** — never instruct hand-edits inside `<!-- hero-vibe-kit:start/end -->`.
5. **Hooks fail-safe** — parse errors exit 0; never block on malformed stdin.
6. **Lean by default** — Fast/Tiny paths must not require handoff files or session updates.
7. **Verification gate per task:** `npm test` must be GREEN before each commit.
8. **GitNexus (framework repo):** run `gitnexus_impact` before editing exported CLI symbols; run `gitnexus_detect_changes()` before final commit.
9. **Conventional Commits** — one logical commit per completed task (or per wave if tasks are tightly coupled).
10. **CHANGELOG:** update `[Unreleased]` during work; move to `[2.0.0]` only in the final release commit with `package.json` version bump.

---

## File map (complete)

### New files

| Path | Purpose |
|------|---------|
| `src/workflow-state.cjs` | Read/write/validate `.hero-vibe-kit/session.json` |
| `src/handoff-validate.cjs` | Validate handoff markdown (+ optional YAML frontmatter) |
| `templates/common/.claude/hooks/workflow-check.cjs` | Soft workflow reminders (shared copy to `.cursor/hooks/`) |
| `templates/.hero-vibe-kit/session.schema.json` | JSON Schema for session file (shipped in package `files`) |
| `test/workflow-state.test.cjs` | Unit tests for session state |
| `test/handoff-validate.test.cjs` | Unit tests for handoff validator |
| `test/doctor-workflow.test.cjs` | Integration tests for extended doctor checks |
| `docs/specs/2026-06-16-harness-loop-engineering-design.md` | Short design spec (decisions + non-goals) |

### Modified files — CLI / package

| Path | Change |
|------|--------|
| `bin/hero-vibe-kit.js` | Document `doctor --strict`; optional `validate` alias |
| `src/doctor.cjs` | Session + handoff + ACTIVE_STATE compliance |
| `src/init.cjs` | Seed `session.json`; copy `workflow-check.cjs` |
| `src/update.cjs` | Refresh new hook; preserve existing `session.json` if present |
| `src/merge.cjs` | Ensure new hook merges without clobber |
| `package.json` | Version `2.0.0`; include `session.schema.json` in `files` if needed |
| `CHANGELOG.md` | 2.0.0 entry |
| `README.md` | Document session state, `doctor --strict`, harness/loop overview |
| `CONTRIBUTING.md` | Note new modules + test files |

### Modified files — templates (consumer install)

| Path | Change |
|------|--------|
| `templates/CLAUDE.md.tmpl` | Pointer: `session.json`, `doctor`, `phase-handoff` at boundaries |
| `templates/CURSOR-RULE.mdc.tmpl` | Same |
| `templates/AGENTS.md.tmpl` | Same |
| `templates/common/.claude/settings.json` | Wire `workflow-check.cjs` on Stop or PreToolUse (see Task 3) |
| `templates/common/.cursor/hooks.json` | Mirror hook |
| `templates/common/.claude/hooks/git-guard.cjs` | Optional: richer commit remind text pointing to session/doctor |
| `skills.manifest.json` | Update `phase-handoff` description |

### Modified files — docs

| Path | Change |
|------|--------|
| `templates/docs/AGENCY_WORKFLOW.md` | § Harness enforcement + loop triggers in next-prompt table |
| `templates/docs/ARTIFACTS_AND_STORAGE.md` | `session.json` layout + handoff frontmatter |
| `templates/docs/ACTIVE_STATE.md` | Relationship: durable backlog vs session state |
| `templates/docs/CONTEXT_BUDGET.md` | Link loop boundary → `phase-handoff` + session checkpoint |
| `templates/docs/HANDOFF_TEMPLATES.md` | Optional YAML frontmatter block |
| `templates/docs/PHASE_HANDOFF_PROTOCOL.md` | Replace "future phase-handoff skill" with skill invoke; dedup ops checklist |
| `templates/docs/DEFINITION_OF_DONE.md` | `doctor --strict` as optional CI evidence |
| `templates/docs/SECURITY_STANDARDS.md` | Defer git enforcement → hooks (one paragraph) |

### Modified files — skills

| Path | Change |
|------|--------|
| `templates/skills/phase-handoff/SKILL.md` | Session read/write, router triggers, termination rules |
| `templates/skills/subagent-driven-development/SKILL.md` | Checkpoint → `phase-handoff` when multi-stream |
| `templates/skills/executing-plans/SKILL.md` | Checkpoint steps; boundary vs `subagent-driven-development` |
| `templates/skills/using-superpowers/SKILL.md` | Route: phase boundary → `phase-handoff` |

### Modified files — tests

| Path | Change |
|------|--------|
| `test/hooks.test.cjs` | `workflow-check.cjs` self-tests |
| `test/init-smoke.test.cjs` | Assert `session.json`, new hook installed |
| `test/links.test.cjs` | No new broken links |

---

## Session schema (v1)

File: `.hero-vibe-kit/session.json`

```json
{
  "schemaVersion": 1,
  "workItem": null,
  "path": null,
  "mode": null,
  "phase": null,
  "reviewBudget": null,
  "gates": {
    "prd": { "required": false, "status": "not-applicable", "evidence": null },
    "plan": { "required": false, "status": "not-applicable", "evidence": null }
  },
  "reportSlug": null,
  "canonicalHandoff": null,
  "resumePath": null,
  "nextAction": null,
  "lastCheckpoint": null,
  "loop": {
    "retryCount": 0,
    "maxRetries": 2,
    "lastAction": null
  }
}
```

**Enums (validator enforced):**
- `path`: `read-only` | `fast` | `standard` | `full` | `timeboxed` | null
- `mode`: `tiny` | `small` | `standard` | `full` | null
- `phase`: `discovery` | `planning` | `implementation` | `review` | `delivery` | null
- `reviewBudget`: `none` | `single-combined-review` | `targeted-specialist-review` | `full-multi-stage-review` | null
- `gates.*.status`: `not-applicable` | `pending` | `approved` | `blocked`

**Rules:**
- Fast/Read-only: `gates` default `not-applicable`
- Standard: `gates.plan` may be `required`
- Full: both gates may be `required`
- Agent updates via `phase-handoff` skill; CLI `doctor` reads but does not auto-fix
- `resumePath` + `nextAction` are the **resume hot path**: a fresh session reads them first and acts without rereading `ACTIVE_STATE.md` or full plans. `phase-handoff` must set both at every boundary.
- `loop.*` and `lastCheckpoint` are **reserved** in 2.0.0 — stored if written by the skill, but no hook or reminder consumes timestamps (the Stop-timer reminder is cut; see Task 3.3). `lastCheckpoint` advancing is, however, one way to satisfy the commit gate (Task 3.3). They also back `phase-handoff` loop-termination bookkeeping (`retryCount`/`maxRetries`).
- `schemaVersion` is `1`. Forward policy: a future bump triggers migrate-or-reseed in `workflow-state.cjs`, never a throw (see Open questions).

---

## Handoff frontmatter (optional, v1)

Add to top of canonical handoffs under `docs/reports/<slug>/handoffs/*.md`:

```yaml
---
hvkHandoffVersion: 1
workItem: checkout-flow
mode: standard
fromPhase: implementation
toPhase: review
status: green
approval: approved
reportSlug: 2026-06-16-checkout-flow
---
```

`handoff-validate.cjs` checks required keys when frontmatter present; body still validated for base sections per mode.

---

## Implementation waves

```text
Wave 0 — Spec + approval (this document)
Wave 1 — Loop engineering (docs + skills, no CLI behavior change)
Wave 2 — Session state (workflow-state.cjs + init seed + docs)
Wave 3 — Harness enforcement (handoff-validate, doctor, workflow-check hook)
Wave 4 — Dedup + README + release (2.0.0, CHANGELOG, final verification)
```

---

## Wave 0 — Design spec + plan approval

**Files:**
- Create: `docs/specs/2026-06-16-harness-loop-engineering-design.md`
- Create: `docs/plans/2026-06-16-harness-loop-engineering-2.0.0.md` (this file)

- [ ] **Step 1:** Write short design spec (purpose, principles, non-goals, session schema, hook policy).
- [ ] **Step 2:** User approves plan.
- [ ] **Step 3:** `git checkout -b feat/harness-loop-2.0.0`

**Commit (after approval only):** `docs: add harness+loop engineering 2.0.0 plan and spec`

---

## Wave 1 — Loop engineering (skills + router integration)

**Goal:** Make the Self-Prompting Router executable via `phase-handoff` without new runtime deps.

### Task 1.1 — Strengthen `phase-handoff` skill

**Files:**
- Modify: `templates/skills/phase-handoff/SKILL.md`

- [ ] **Step 1:** Add § **Router integration** — map `AGENCY_WORKFLOW.md` next-prompt states to skill invocation (table).
- [ ] **Step 2:** Add § **Loop termination** — `maxRetries: 2` for review/fix loops; escalate to user on exceed.
- [ ] **Step 3:** Add § **Tiny/Small fast path** — bounded inline output only; no canonical file required.
- [ ] **Step 4:** Cross-link `HANDOFF_TEMPLATES.md` frontmatter (stub until Task 1.3).

> **Note (no session stub):** Do **not** add a placeholder session section here. Session read/write is introduced once, after the module exists, in **Task 2.3** — avoids a throwaway edit and a second pass over the same file.

**Verify:** `npm test`; skill file < 250 lines.

**Commit:** `feat(skills): strengthen phase-handoff for loop engineering`

### Task 1.2 — Router + loop triggers in AGENCY_WORKFLOW

**Files:**
- Modify: `templates/docs/AGENCY_WORKFLOW.md`

- [ ] **Step 1:** Add § **Harness & loop enforcement (overview)** — 8–12 lines: session state, `doctor`, `phase-handoff`; link `ARTIFACTS_AND_STORAGE.md`.
- [ ] **Step 2:** Extend **next-prompt decision table** with column `Loop action` — e.g. "Invoke `phase-handoff`", "Update session checkpoint", "Run `doctor`".
- [ ] **Step 3:** Under Self-Prompting Router, add bullet: at real phase boundary → **must** invoke `phase-handoff` skill.

**Verify:** `npm test`; no duplicate paste of `PHASE_HANDOFF_PROTOCOL` body.

**Commit:** `docs(workflow): wire loop actions into agency workflow router`

### Task 1.3 — Handoff templates + protocol dedup

**Files:**
- Modify: `templates/docs/HANDOFF_TEMPLATES.md`
- Modify: `templates/docs/PHASE_HANDOFF_PROTOCOL.md`
- Modify: `templates/docs/CONTEXT_BUDGET.md`

- [ ] **Step 1:** Add optional YAML frontmatter spec to `HANDOFF_TEMPLATES.md` with example.
- [ ] **Step 2:** In `PHASE_HANDOFF_PROTOCOL.md` § Future `phase-handoff` skill → rename to **Installed skill**; point to `templates/skills/phase-handoff/SKILL.md`.
- [ ] **Step 3:** Trim duplicated operational checklist in protocol if identical to `AGENCY_WORKFLOW` § Phase Handoff (keep link).
- [ ] **Step 4:** `CONTEXT_BUDGET.md` — one paragraph: loop boundary = `phase-handoff` + compact/fresh session.

**Verify:** `npm test` (link integrity).

**Commit:** `docs: add handoff frontmatter spec and dedup phase-handoff protocol`

### Task 1.4 — Companion skills boundary updates

**Files:**
- Modify: `templates/skills/subagent-driven-development/SKILL.md`
- Modify: `templates/skills/executing-plans/SKILL.md`
- Modify: `templates/skills/using-superpowers/SKILL.md`
- Modify: `skills.manifest.json` (description only)

- [ ] **Step 1:** `subagent-driven-development` — after independent task stream completes → optional `phase-handoff` integration review boundary.
- [ ] **Step 2:** `executing-plans` — checkpoint after each task group; do not invoke `phase-handoff` for trivial continuations.
- [ ] **Step 3:** `using-superpowers` — add decision diamond: real phase boundary → invoke `phase-handoff` before other skills.
- [ ] **Step 4:** Update manifest description for `phase-handoff`.

**Verify:** `npm test`

**Commit:** `feat(skills): align execution skills with phase-handoff loop boundaries`

---

## Wave 2 — Session state module

**Goal:** Durable session-scoped workflow pointer separate from `ACTIVE_STATE.md` backlog.

### Task 2.1 — `workflow-state.cjs`

**Files:**
- Create: `src/workflow-state.cjs`
- Create: `templates/.hero-vibe-kit/session.schema.json`
- Create: `test/workflow-state.test.cjs`

- [ ] **Step 1:** Implement `readSession(target)`, `writeSession(target, partial)`, `validateSession(obj)`, `defaultSession()`.
- [ ] **Step 2:** Schema validation in code (no ajv — manual enum checks per house rules).
- [ ] **Step 3:** Tests: default session, merge partial update, invalid enum rejects, missing file returns null.

**Verify:** `node --test test/workflow-state.test.cjs`

**Commit:** `feat(cli): add workflow session state module`

### Task 2.2 — Init/update integration

**Files:**
- Modify: `src/init.cjs`
- Modify: `src/update.cjs`
- Modify: `templates/docs/ARTIFACTS_AND_STORAGE.md`
- Modify: `templates/docs/ACTIVE_STATE.md`

- [ ] **Step 1:** `init` writes `.hero-vibe-kit/session.json` from `defaultSession()` if absent.
- [ ] **Step 2:** `update` never overwrites existing `session.json` (like `ACTIVE_STATE.md` policy); only ensure file exists if missing.
- [ ] **Step 3:** Document session vs ACTIVE_STATE in both docs.
- [ ] **Step 4:** Copy `session.schema.json` into consumer `.hero-vibe-kit/` on init (optional reference file).

**Verify:** `npm test`; init-smoke sees `session.json`.

**Commit:** `feat(init): seed workflow session state on install`

### Task 2.3 — Complete `phase-handoff` session integration

**Files:**
- Modify: `templates/skills/phase-handoff/SKILL.md`

- [ ] **Step 1:** Add concrete session read/write steps in one pass. At every boundary the skill MUST set `phase`, `resumePath`, and `nextAction` (the resume hot path) and advance `lastCheckpoint` — this both feeds resume and satisfies the commit gate (Task 3.3).
- [ ] **Step 2:** Document gate status updates in session when PRD/plan approved.
- [ ] **Step 3:** State the source-of-truth ordering explicitly: handoff artifact + `ACTIVE_STATE.md` are authoritative; `session.json` is a derived convenience pointer. On conflict, trust artifacts and flag the session as stale.
- [ ] **Step 4:** Reinforce the archive rule: when a work item completes, move durable detail to `docs/reports/<slug>/` and replace its `ACTIVE_STATE.md` row with a one-line link — keep the index short.

**Verify:** `npm test`

**Commit:** `feat(skills): integrate session state into phase-handoff skill`

### Task 2.4 — Entry templates

**Files:**
- Modify: `templates/CLAUDE.md.tmpl`
- Modify: `templates/CURSOR-RULE.mdc.tmpl`
- Modify: `templates/AGENTS.md.tmpl`

- [ ] **Step 1:** Add the **resume read order** under context loading: on resume, read `.hero-vibe-kit/session.json` first → then only the `resumePath`/`nextAction` it names → then the latest handoff if needed. Do **not** read all of `ACTIVE_STATE.md` just to locate current work.
- [ ] **Step 2:** Keep addition ≤ 3 lines (no bloat).

**Verify:** `npm test`; init-smoke rendered output contains session pointer.

**Commit:** `docs(templates): mention session state in agent entrypoints`

---

## Wave 3 — Harness enforcement

**Goal:** Make compliance checkable via `doctor` and soft hooks.

### Task 3.1 — `handoff-validate.cjs`

**Files:**
- Create: `src/handoff-validate.cjs`
- Create: `test/handoff-validate.test.cjs`

- [ ] **Step 1:** Parse YAML frontmatter between `---` fences (simple line parser, no deps).
- [ ] **Step 2:** Validate required body sections by `mode` (tiny: 3 fields; standard: base handoff shape from skill).
- [ ] **Step 3:** Return `{ ok, warnings[], errors[] }`.
- [ ] **Step 4:** Unit tests: valid/invalid frontmatter, missing sections, legacy file without frontmatter → warnings only.

**Verify:** `node --test test/handoff-validate.test.cjs`

**Commit:** `feat(cli): add handoff artifact validator`

### Task 3.2 — Extend `doctor`

**Files:**
- Modify: `src/doctor.cjs`
- Modify: `bin/hero-vibe-kit.js`
- Create: `test/doctor-workflow.test.cjs`

- [ ] **Step 1:** Add flag `--strict` (fail on warnings).
- [ ] **Step 2:** Check `session.json` exists and validates (warn if missing on old projects). Also warn if `ACTIVE_STATE.md` exceeds a size threshold (e.g. > ~150 lines) — signals append-bloat instead of archive-and-link (token waste + missing-context risk).
- [ ] **Step 3:** If `session.reportSlug` set, validate latest canonical handoff under `docs/reports/<slug>/handoffs/` if present.
- [ ] **Step 4:** **Drift detection (core value):** cross-check the three state sources and warn on divergence — e.g. `session.phase` vs latest handoff frontmatter `toPhase`; `session.gates.*.status` vs handoff `approval`; `session.reportSlug` points to a slug that has no handoffs dir. Treat `session.json` as *suspect, not authoritative* — never report green solely on its say-so.
- [ ] **Step 5:** Warn if git dirty + `ACTIVE_STATE.md` not in changed files (mirror stop-reminder logic).
- [ ] **Step 6:** Verify `workflow-check.cjs` is wired (settings.json / hooks.json) and self-test it like `checkGitGuard`: Standard-path commit without checkpoint → exit 2; Fast-path commit → exit 0. Warn if not wired.
- [ ] **Step 7:** Integration test: init temp project, mutate session, run doctor — incl. a divergence case (session says `review`, handoff says `implementation`) that must warn.

**Verify:** `npm test`

**Commit:** `feat(doctor): add workflow compliance checks with --strict mode`

### Task 3.3 — `workflow-check.cjs` hook

**Files:**
- Create: `templates/common/.claude/hooks/workflow-check.cjs`
- Modify: `templates/common/.claude/settings.json`
- Modify: `templates/common/.cursor/hooks.json`
- Modify: `src/init.cjs`, `src/update.cjs`
- Modify: `test/hooks.test.cjs`

**This is the mechanism that removes the manual "update state" reminder.** It is a path-aware HARD gate on `git commit`, not a soft nudge.

- [ ] **Step 1:** Hook reads `session.json` + the command. Decide:
  - command is not `git commit` → exit 0.
  - `session.json` missing/invalid (legacy project) → exit 0 (fail-safe).
  - `path` ∈ {`read-only`, `fast`} or `mode` ∈ {`tiny`, `small`} → exit 0 (lean paths exempt).
  - `HVK_SKIP_STATE_GATE=1` in env → exit 0 (emergency override).
- [ ] **Step 2:** For `path` ∈ {`standard`, `full`}: **block (exit 2)** unless the pending change includes a state checkpoint — satisfied by **any one** of: `session.json` modified (incl. `lastCheckpoint`/`phase`/`nextAction` advanced), `docs/ACTIVE_STATE.md` modified, or a file under `docs/reports/<reportSlug>/` (report or handoff) modified in the working tree / staged set. Block message names exactly which file to touch and lists the cheapest option (`session.json`) first, plus the override env var.
- [ ] **Step 3:** Wire in Claude `PreToolUse` Bash matcher + Cursor `beforeShellExecution`; copy hook to `.cursor/hooks/`. Detect staged/working changes via `git status --porcelain` (same pattern as `stop-reminder.cjs`); any git failure → exit 0.
- [ ] **Step 4:** Self-tests: Standard commit without checkpoint → exit 2; with `session.json` touched → exit 0; Fast/Read-only commit → exit 0; override env → exit 0; malformed JSON / no session / git error → exit 0; non-commit command → exit 0.

> **Cut from 2.0.0:** the Stop-event "no checkpoint in last N minutes" reminder. Time-based nags are noisy, depend on session timestamps that are easy to leave stale, and risk hook fatigue. The commit gate is deterministic and event-driven instead. `stop-reminder.cjs` (existing, soft) still covers the pause-without-commit case.

**Policy:** **Hard block on Standard/Full commits without a state checkpoint** (the product goal: no more manual reminders). Lean paths exempt; override + fail-safe prevent footguns. `git-guard` remains the other hard gate; everything else stays warn-only.

**Verify:** `npm test`

**Commit:** `feat(hooks): add workflow-check soft enforcement hook`

### Task 3.4 — Docs for harness

**Files:**
- Modify: `templates/docs/AGENCY_WORKFLOW.md` (harness section detail)
- Modify: `templates/docs/DEFINITION_OF_DONE.md`
- Modify: `templates/docs/SECURITY_STANDARDS.md`

- [ ] **Step 1:** Document `hero-vibe-kit doctor` and `doctor --strict` for CI.
- [ ] **Step 2:** DoD: optional CI step runs doctor --strict on Standard/Full MRs.
- [ ] **Step 3:** Security standards: git guard hooks canonical.

**Verify:** `npm test`

**Commit:** `docs: document harness enforcement and doctor strict mode`

---

## Wave 4 — Release 2.0.0

### Task 4.1 — README + CONTRIBUTING

**Files:**
- Modify: `README.md`
- Modify: `CONTRIBUTING.md`

- [ ] **Step 1:** README section "Harness & loop (2.0)" — session, doctor, phase-handoff, workflow-check.
- [ ] **Step 2:** CONTRIBUTING — list new `src/` modules and test files.

**Commit:** `docs: document 2.0 harness and loop features`

### Task 4.2 — Full verification matrix

Run sequentially; all must pass:

```bash
npm test
node bin/hero-vibe-kit.js init --dir /tmp/hvk-2-smoke --yes --ide both --skip-integrations
node bin/hero-vibe-kit.js doctor --dir /tmp/hvk-2-smoke
node bin/hero-vibe-kit.js doctor --dir /tmp/hvk-2-smoke --strict
node bin/hero-vibe-kit.js update --dir /tmp/hvk-2-smoke --yes
node bin/hero-vibe-kit.js doctor --dir /tmp/hvk-2-smoke --strict
```

- [ ] **Step 1:** All commands exit 0.
- [ ] **Step 2:** GitNexus `detect_changes` — review blast radius; no unexpected flows.
- [ ] **Step 3:** Manual spot-check: `phase-handoff` skill installed; `workflow-check.cjs` wired in both IDEs.

**Commit:** `test: verify 2.0.0 init/update/doctor smoke path`

### Task 4.3 — Version bump + CHANGELOG

**Files:**
- Modify: `package.json` → `"version": "2.0.0"`
- Modify: `CHANGELOG.md`

- [ ] **Step 1:** Move `[Unreleased]` content to `[2.0.0] - YYYY-MM-DD` using Keep a Changelog format.
- [ ] **Step 2:** Sections: `### Added`, `### Changed`, `### Breaking` (soft breaks documented).

**Draft CHANGELOG entry (fill on release):**

```markdown
## [2.0.0] - YYYY-MM-DD
### Added
- Workflow session state (`.hero-vibe-kit/session.json`) — an *observable* pointer for path, phase, gates, and review budget across sessions (not an enforcement mechanism; agents write it voluntarily).
- `handoff-validate` logic and optional YAML frontmatter for canonical phase handoffs.
- `workflow-check` hook: a **path-aware state-checkpoint commit gate** — blocks `git commit` on Standard/Full work that lacks a state checkpoint (`session.json` / `ACTIVE_STATE.md` / report under the active slug). Read-only/Fast/Tiny exempt; `HVK_SKIP_STATE_GATE=1` override; fail-safe exit 0 on missing/legacy session. Removes the need to manually remind agents to update project state.
- `doctor --strict` for CI-friendly compliance checks, including **drift detection** across session ↔ handoff ↔ ACTIVE_STATE and an ACTIVE_STATE bloat warning.

### Changed
- `phase-handoff` skill now integrates router triggers, loop termination, and session checkpoints.
- `AGENCY_WORKFLOW.md` next-prompt table includes explicit loop actions.
- `doctor` reports workflow compliance (warn by default) and treats `session.json` as suspect rather than authoritative.

### Breaking
- Consumer installs after `update` receive the `workflow-check` commit gate and a session file. On **Standard/Full** work, `git commit` is blocked until the change includes a state checkpoint (override: `HVK_SKIP_STATE_GATE=1`). Read-only/Fast/Tiny and legacy projects without a valid `session.json` are unaffected (fail-safe exit 0).
- `doctor --strict` may warn/fail until session/handoffs are populated (warn-only by default).
```

**Commit:** `chore(release): bump version to 2.0.0`

### Task 4.4 — Final commit / PR readiness

- [ ] Single release commit or tag-ready branch `feat/harness-loop-2.0.0`.
- [ ] PR summary: link this plan, list waves, paste verification output.
- [ ] **User asked for commit after completion** — final message:

```text
feat!: harness and loop engineering for 2.0.0

Operationalize doc-driven orchestration with session state, handoff
validation, workflow-check hook, strengthened phase-handoff skill, and
doctor --strict compliance mode. Additive for existing projects (warn-first).
```

---

## Test strategy (summary)

| Layer | Files | Covers |
|-------|-------|--------|
| Unit | `workflow-state.test.cjs`, `handoff-validate.test.cjs` | Parsers, enums, edge cases |
| Hooks | `hooks.test.cjs` | git-guard, stop-reminder, workflow-check |
| Integration | `doctor-workflow.test.cjs`, `init-smoke.test.cjs` | End-to-end install |
| Regression | `links.test.cjs`, `manifest.test.cjs` | Doc links, manifest shape |

**CI bar:** `npm test` green on every commit; `doctor --strict` green on fresh init smoke dir.

---

## Consumer migration guide (ship in README)

1. Run `npx hero-vibe-kit update` — merges new hook; adds `session.json` if missing.
2. Existing projects: `doctor` warns until session/handoffs populated — **expected**.
3. For CI: add `npx hero-vibe-kit doctor --strict` on MRs (optional).
4. Agents: invoke `phase-handoff` at real phase boundaries; update session fields.
5. No action required for Fast/Tiny tasks.

---

## Risk register

| Risk | Mitigation |
|------|------------|
| Harness too ceremonial | Warn-only hooks; Tiny/Small exempt from canonical handoffs; single commit-gate trigger (Stop timer cut) |
| Agent ignores / staleness | doctor treats session as suspect and **detects drift** vs artifacts (Task 3.2 Step 4); positioning note avoids false guarantee |
| State drift (3 sources) | Handoff/ACTIVE_STATE authoritative, session derived; doctor warns on divergence rather than trusting session |
| Over-claiming enforcement | Positioning section + honest CHANGELOG; exactly two hard gates (git-guard + commit checkpoint), rest warn-only |
| Commit gate friction / false block | Path-aware (lean paths exempt); cheap satisfier (`session.json` touch); `HVK_SKIP_STATE_GATE=1` override; fail-safe exit 0 on missing/legacy/git-error |
| Gate gamed by empty checkpoint | Accepted for 2.0.0 — forces the habit; `doctor` drift check catches contradictory/stale checkpoints |
| Hook fight / loops | workflow-check always exit 0; stop_hook_active guards |
| Doc bloat | Dedup protocol; entry templates ≤ 3 new lines |
| 2.0.0 backlash on doctor | Default warn; document `--strict` as opt-in |
| Scope creep to orchestrator | Explicit out-of-scope per wave |

---

## Estimated effort

| Wave | Tasks | Estimate |
|------|-------|----------|
| 0 | Spec + approval | 0.5 day |
| 1 | Loop docs/skills | 1–1.5 days |
| 2 | Session state | 1 day |
| 3 | Harness doctor/hooks | 1.5–2 days |
| 4 | Release | 0.5 day |
| **Total** | | **~4.5–5.5 days** |

---

## Post-approval checklist for implementer

1. Read `CONTRIBUTING.md` and this plan in full.
2. Create branch `feat/harness-loop-2.0.0`.
3. Execute waves 1→4 in order; do not skip verification gates.
4. Update CHANGELOG incrementally under `[Unreleased]`.
5. Final: version 2.0.0, full test matrix, user-requested commit.
6. Do **not** publish npm package unless user explicitly asks.

---

## Resolved decisions (baked into this plan)

1. **`workflow-check` trigger:** `PreToolUse`/`beforeShellExecution` on `git commit`. Stop-event timer reminder **cut** from 2.0.0 — see Task 3.3.
2. **Hard blocking SHIPS in 2.0.0** (changed from earlier draft, per user goal "never prompt for state again"): a **path-aware state-checkpoint commit gate** — blocks `git commit` on Standard/Full when no state checkpoint accompanies the change; allows Read-only/Fast/Tiny; `HVK_SKIP_STATE_GATE=1` override; fail-safe exit 0 on missing/legacy session. See Task 3.3.
3. **State authority:** handoff artifacts + `ACTIVE_STATE.md` are authoritative; `session.json` is a derived **hot pointer** read first on resume. `doctor` treats it as suspect and detects drift (Task 3.2 Step 4).
4. **Resume read order (token discipline):** a fresh session reads `session.json` first (tiny), then only the `resumePath` it names, then the latest handoff if needed — **not** the whole `ACTIVE_STATE.md`. `ACTIVE_STATE.md` stays a single short index (active rows only; completed work archived to `docs/reports/<slug>/` and replaced by a link). No per-item split (would increase files/tokens at resume).

## Open questions for user (resolve at approval)

1. **`doctor --strict` on fresh init:** should strict pass immediately after init with empty session? (Plan default: **yes** — empty session is valid; note this means strict validates little on greenfield and earns its keep on populated projects. Document in DoD.)
2. **Schema migration:** `session.json` carries `schemaVersion: 1`. 2.0.0 has no prior schema to migrate. Confirm the forward policy: on a future bump, `workflow-state.cjs` should detect an older `schemaVersion` and migrate-or-reseed rather than throw. (Plan default: **migrate-or-reseed**, documented now, implemented when first needed.)
3. **Positioning sign-off:** OK to market this as an *observability/compliance* layer (not "enforcement") in README/CHANGELOG? (Plan default: **yes** — avoids over-claiming.)

---

*Plan author: AI assistant · Date: 2026-06-16 · Target version: 2.0.0*
