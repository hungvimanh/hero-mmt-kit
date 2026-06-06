# Artifacts & Storage

> Defines what each workflow produces, where it is stored, and what is authoritative. The source of truth is the repository docs; Serena is for semantic code intelligence, with optional pointer notes only.

## 1. Storage roles

| Information | Primary storage | Purpose | Notes |
|---|---|---|---|
| Durable workflow state | `docs/ACTIVE_STATE.md` | Cross-session backlog and resume state | Update when a feature starts, changes phase/status, blocks, or finishes. |
| PRD / scope | `docs/specs/YYYY-MM-DD-<slug>.md` | Requirements, acceptance criteria, decision log, assumptions | Required for Full path; optional for Standard when scope is complex. |
| Technical plan / TDD | `docs/plans/YYYY-MM-DD-<slug>.md` | Architecture, API/interface contract, task breakdown, risk plan | Required for Standard/Full gated work. |
| Impact analysis | `docs/reports/YYYY-MM-DD-<slug>/impact.md` | Blast radius, affected flows, risk level | Required for Standard changes to existing code and refactors. |
| Security review | `docs/reports/YYYY-MM-DD-<slug>/security.md` | Threat model findings, OWASP LLM checks, unresolved risks | Required for Full path and sensitive surfaces. |
| Performance review | `docs/reports/YYYY-MM-DD-<slug>/performance.md` | Budget, measurements, regressions, token/cost checks | Required when performance budget exists or hot path changes. |
| QA / verification | `docs/reports/YYYY-MM-DD-<slug>/qa.md` | Test commands, manual checks, known gaps | Required before claiming done on Standard/Full. |
| Raw command logs | `docs/reports/YYYY-MM-DD-<slug>/logs/` | Full output from noisy build/test/diff/MCP commands | Keep raw logs out of chat; cite the path from bounded reports. |
| Retro / handover | `docs/reports/YYYY-MM-DD-<slug>/retro.md` | What went well, pain points, one improvement | Required for Full path; optional otherwise. |
| Resume packet | `docs/reports/YYYY-MM-DD-<slug>/resume.md` | Compact/session restart state | Create or update before phase handoff, major review, final verification, or context-pressure recovery. |
| Session task tracking | `TaskCreate` / `TaskList` | Current-session execution checklist | Not durable; recreate from `ACTIVE_STATE.md` + linked artifacts after restart. |
| Semantic code understanding | Serena MCP | Symbol lookup, references, implementations, diagnostics, semantic edits | Not the primary storage layer. |
| Optional Serena notes | `.serena/memories/project/*.md` | Lightweight pointers back to repo docs | Never duplicate canonical process, PRD, plans, or reports here. |
| Design system | `docs/design/DESIGN_SYSTEM.md` | Locked profile + direction, tokens reference, component inventory, platform notes | Durable; create on the first UI work. |
| Design assets | `docs/design/assets/` | Source/reference media (small, reviewable) | Production-ready assets live in the app's asset dir. |
| In-product help content | `docs/help/` | Markdown/MDX help source rendered in-app | Keep in sync with features (DESIGN_STANDARDS §8). |
| Visual QA | `docs/reports/YYYY-MM-DD-<slug>/design-qa.md` | Responsive/a11y/states/media-weight + help accuracy | Required for UI work on Standard/Full. |

## 2. Directory layout

```txt
docs/
  AGENCY_WORKFLOW.md
  ARTIFACTS_AND_STORAGE.md
  ACTIVE_STATE.md
  DEFINITION_OF_DONE.md
  BRANCHING.md
  TEAM_ROSTER.md
  COMMUNICATION_PROTOCOL.md
  SECURITY_STANDARDS.md
  PERFORMANCE_STANDARDS.md
  INTERACTION_PATTERNS.md

  design/
    DESIGN_SYSTEM.md
    assets/
  help/

  specs/
    YYYY-MM-DD-feature-name.md

  plans/
    YYYY-MM-DD-feature-name.md

  reports/
    YYYY-MM-DD-feature-name/
      resume.md
      impact.md
      security.md
      performance.md
      qa.md
      logs/
      retro.md

  templates/
    PRD_AI_FEATURE.md
    DESIGN_BRIEF.md
```

Create `specs/`, `plans/`, and `reports/` only when the first artifact of that type is needed.

## 3. Artifact rules by path
These are storage requirements only. For workflow sequencing and gates, follow [AGENCY_WORKFLOW.md](./AGENCY_WORKFLOW.md).


| Path | Required durable artifacts |
|---|---|
| Read-only | None. Answer with `file:line` citations; do not create docs unless the user asks. |
| Fast | Update `ACTIVE_STATE.md` only if the task represents ongoing work. Bugfixes should include test evidence in the MR/PR; create `reports/.../qa.md` only when useful. |
| Standard | `ACTIVE_STATE.md`, `plans/*.md`, `reports/.../impact.md`, and `reports/.../qa.md`. Add `reports/.../resume.md` for long-running work, phase handoff, or context pressure. Add security/performance reports when the touched surface requires them. |
| Full | `ACTIVE_STATE.md`, `specs/*.md`, `plans/*.md`, `reports/.../resume.md`, `impact.md`, `security.md`, `performance.md`, `qa.md`, and `retro.md`. |
| Spike | `docs/reports/YYYY-MM-DD-<slug>/recommendation.md`; do not merge throwaway POC code into main. |
| Design (router #9) | `docs/design/DESIGN_SYSTEM.md` (when first UI work), `docs/help/<area>.md`, `reports/.../design-qa.md`. Media source in `docs/design/assets/`. |

## 4. Naming rules

- Use lowercase kebab-case slugs: `2026-06-02-checkout-retry.md`.
- Use the same `<slug>` across specs, plans, and reports for the same work item.
- Link artifacts from the row in `ACTIVE_STATE.md`.
- Reports should record evidence and decisions, not duplicate long code excerpts.
- Resume packets should record concise restart state, not duplicate specs, plans, diffs, logs, or transcripts. See [CONTEXT_BUDGET.md](./CONTEXT_BUDGET.md).

## 5. What is authoritative

1. Process rules: `docs/AGENCY_WORKFLOW.md`.
2. Artifact/storage rules: this file.
3. Current work state: `docs/ACTIVE_STATE.md`.
4. Requirements: linked file in `docs/specs/`.
5. Technical approach: linked file in `docs/plans/`.
6. Verification evidence: linked files in `docs/reports/`.

If a tool memory or chat history conflicts with repo docs, trust the repo docs and update stale pointers.
