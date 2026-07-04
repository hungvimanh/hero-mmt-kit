# Agency Workflow — Single Source of Truth

> **This is the ONLY canonical process document.** Every other file (CLAUDE.md, AGENTS.md, TEAM_ROSTER.md, optional Serena notes) only **links** here — it must NOT copy the content. To change the process, edit only this file.

The AI acts as a lean software agency, following the branching model in [BRANCHING.md](./BRANCHING.md). Completion criteria: see [DEFINITION_OF_DONE.md](./DEFINITION_OF_DONE.md).

> **Language policy:** this workflow and all framework templates are English-only for token efficiency and consistency. Use the user's chat language for responses unless they ask otherwise.

> **Active operating profile:** {{ASSISTANCE_PROFILE_LABEL}} (`{{ASSISTANCE_PROFILE}}`) · surface: {{PROJECT_SURFACE_LABEL}} (`{{PROJECT_SURFACE}}`) · verification: {{VERIFICATION_LEVEL}}. Resolve details in [ASSISTANCE_PROFILES.md](./ASSISTANCE_PROFILES.md) before changing gate, delegation, or verification strictness.

The personas (BA / Architect / Developer / QA / Scrum Master) are **thinking lenses**, not mandatory ceremony for every task — details in [TEAM_ROSTER.md](./TEAM_ROSTER.md).

---

## 0. Golden rules

1. **Resolve the active assistance profile before routing.** Use [ASSISTANCE_PROFILES.md](./ASSISTANCE_PROFILES.md) to apply the active profile, surface, verification level, and any per-task override.
2. **Start every request by CLASSIFYING the task** (table §1) → pick the right *path*. Don't default to the full 5-phase process for everything.
3. **Don't jump into code while the request is unclear.** For Standard/Full paths, clarify scope first.
4. **A gate is real Plan Mode, not a promise.** When a path requires a "Gate", use `EnterPlanMode` → present the plan → `ExitPlanMode` for the user to approve. This is a harness-enforced block, replacing the prose "wait for sign-off".
5. **Update [ACTIVE_STATE.md](./ACTIVE_STATE.md)** when starting / finishing a unit of work. It is the durable cross-session backlog (TaskCreate only lives within the current session).
6. **Follow [COMMUNICATION_PROTOCOL.md](./COMMUNICATION_PROTOCOL.md) in every interaction** — especially when clarifying requirements: no silent assumptions, layered certainty, blocking/non-blocking question classification, close the loop on misunderstandings.
7. **For old codebases, run brownfield discovery first** after install: `hero-vibe-kit init` → `hero-vibe-kit discover` → `hero-vibe-kit doctor`. Read [BROWNFIELD_DISCOVERY.md](./BROWNFIELD_DISCOVERY.md) before changing code.
8. **Sub-agents are escalation tools, not default ceremony.** Use them when they reduce context load, add specialist judgment, isolate parallel work, or satisfy a real risk requirement. Do not run duplicate review passes over the same scope; review is evidence, not ritual.

---

## 1. Task classification → workflow (ROUTER)

When a request arrives, consult this table first to pick path, branch, required steps, and DoD.

| # | Task type | Trigger / example | Path | Gate | Branch | Required steps | Skills / Tools | DoD (short) | Enforcement |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **Q&A / Explain / Find code** | "Explain X", "find where Y is handled", "what does this code do" | Read-only | No | — | Answer directly, **don't edit files** | `gitnexus_query`, `gitnexus_context`, serena `find_symbol` | Correct answer + `file:line` citations; no branch/commit | `convention` — soft (model discipline) |
| 2 | **Chore / Docs / Config** | edit README, change config, bump version, format | Fast | No | `chore/` `docs/` | edit → MR | — | build/lint green; no runtime behavior change | `convention` — soft (model discipline) |
| 3 | **Small bugfix (localized)** | clear root cause, ≤ ~2 files, not a shared symbol | Fast | No (but **repro test required**) | `fix/` | `systematic-debugging` → write a RED test reproducing the bug → fix → GREEN → MR | systematic-debugging, test-driven-development, verification-before-completion | bug repro test (red→green); regression green; root cause noted in MR | `convention` — soft (model discipline) |
| 4 | **Hotfix (urgent prod)** | production incident needs an urgent patch | Fast (expedited) | No | `hotfix/` (off `main`) | minimal fix + test → fast MR → backport to the development branch | systematic-debugging, verify | incident patched + test; backported; logged for post-mortem | `convention` — soft (model discipline) |
| 5 | **Change logic of an existing feature** | "change how X is computed", "add a condition to Y", "change behavior Z" | Standard | **YES** | `change/` | **impact analysis REQUIRED** → ensure/add regression tests → implement → adaptive review/QA if risk warrants | `gitnexus_impact` (upstream), test-driven-development, code-review | impact reported; regression + new tests green; `detect_changes` scope correct | `hook` — hard block (`edit-gate`, `workflow-check`) |
| 6 | **Refactor (NO behavior change)** | "split this module", "rename", "clean up" | Standard | **YES** | `refactor/` | tests GREEN before → impact analysis → change (use `gitnexus_rename`) → tests GREEN after (unchanged) | gitnexus_rename, gitnexus_impact, simplify | same test suite passes before & after; NO manual find-replace | `hook` — hard block (`edit-gate`, `workflow-check`) |
| 7 | **New feature** | "build feature Z" | Full (5-phase) | **YES (2 gates: PRD + TDD)** | `feat/` | full §3 — if the feature has UI, follow the design track ([DESIGN_STANDARDS.md](./DESIGN_STANDARDS.md)) | brainstorming, writing-plans, test-driven-development, design system, code-review, security-review | full [DEFINITION_OF_DONE.md](./DEFINITION_OF_DONE.md) | `hook` — hard block (`edit-gate`, `workflow-check`) |
| 8 | **Spike / Research / POC** | "feasibility study", "try an approach" | Timeboxed | No (timebox instead of gate) | `spike/` (throwaway) | clear timebox → output a **recommendation doc**; **do NOT merge POC code** into main | deep-research, gitnexus_exploring | conclusion + recommendation doc; POC code stays out of main | `convention` — soft (model discipline) |
| 9 | **UI/UX Design / Redesign** | "redesign this page", "design the screens for X", "improve the UI" | Standard | **YES** | `design/` | pick profile → UX (if new screens) → pick ONE direction → lock tokens/design system → produce media (if profile needs it) → implement (incl. in-product help) → Visual QA | see [DESIGN_STANDARDS.md](./DESIGN_STANDARDS.md) | Design DoD ([DEFINITION_OF_DONE.md](./DEFINITION_OF_DONE.md)) | `hook` — hard block (`edit-gate`, `workflow-check`) |

> **hook** = enforced by `PreToolUse` hooks — Claude cannot bypass without `HVK_SKIP_EDIT_GATE=1` or `HVK_SKIP_STATE_GATE=1`.
> **convention** = relies on model following instructions — no hard block exists.

### Harness & loop enforcement (overview)

v2.0.0 adds an observable compliance layer on top of the router. Three mechanics work together:

- **Session state** (`.hero-vibe-kit/session.json`) — a small JSON file the `phase-handoff` skill writes at every real phase boundary. It stores the current path, phase, gate status, review budget, resume path, and next action. The fresh-session read order is: `session.json` first (~200 tokens) → `resumePath` it names → latest handoff only if needed. Do **not** read all of `ACTIVE_STATE.md` just to locate current work.
- **`doctor` compliance** — `hero-vibe-kit doctor` reports session validity, drift between session and handoff artifacts, and ACTIVE_STATE bloat. Use `doctor --strict` in CI for a fail-on-warn run.
- **`workflow-check` hook** — a path-aware commit gate wired as a `PreToolUse` hook. For Standard/Full paths it blocks `git commit` unless the change includes a state checkpoint (session update, ACTIVE_STATE update, or a report artifact). Read-only/Fast/Tiny paths are exempt. `HVK_SKIP_STATE_GATE=1` is the emergency override. Legacy projects without a valid `session.json` get a fail-safe exit 0.

Full storage layout for `session.json`: [ARTIFACTS_AND_STORAGE.md](./ARTIFACTS_AND_STORAGE.md).

### Self-Prompting Router

Treat the router as the controller for the next prompt, not just as reference material. For every user request, the Main Agent must:

1. classify the task using the table above,
2. select the workflow path,
3. identify required gates, verification steps, and Done criteria,
4. identify which lenses or sub-agents, if any, are justified by risk, scope, and context cost,
5. generate the next internal prompt or handoff prompt from [HANDOFF_TEMPLATES.md](./HANDOFF_TEMPLATES.md) when a handoff is needed,
6. continue only when the current gate or Done criteria allow the workflow to advance.
7. **At every real phase boundary — invoke the `phase-handoff` skill** to write the handoff artifact, update `resume.md`, and checkpoint `session.json`.

Use this loop throughout the work:

```text
User intent
  → classify task
  → select workflow path
  → identify required lenses/agents
  → prepare context and prompt contract
  → act directly or delegate
  → verify output
  → update state/artifacts (phase-handoff at real boundaries)
  → choose the next prompt
```

Self-prompting does **not** mean spawning more agents by default. It means the framework decides the next valid prompt from task type, path state, and Done criteria.

### Assistance profile overlay

Apply the active profile from [ASSISTANCE_PROFILES.md](./ASSISTANCE_PROFILES.md) after selecting the path:

| Area | Vibecode | Coding Assistant |
|---|---|---|
| Default posture | Agent owns routing, gates, implementation, and evidence unless blocked. | Human-led; agent assists, proposes, and keeps developer review central. |
| New features | Full path by default, with PRD and TDD gates. | Full path for broad features; bounded enhancements may stay Standard with user agreement. |
| Plan Mode gates | Treat required gates as strict blockers. | Treat required gates as blockers; keep plans concise for developer approval. |
| Verification | Run the active verification level and report evidence before claims. | Run the active verification level; prefer targeted checks plus developer-readable evidence. |
| Review/QA sub-agent | Required for HIGH/CRITICAL, security-sensitive, or broad multi-area work; otherwise choose the smallest review budget that proves the claim. | Required for HIGH/CRITICAL or sensitive work; optional for normal tasks, with targeted verification and explicit developer handoff. |
| Phase handoff | Use artifact-first handoffs at real phase boundaries. | Use handoffs when context, role, or review boundaries make them useful. |

### Lightweight Main Agent Protocol

The Main Agent is the user-facing lead. For normal Coding Assistant work it may implement directly; for broad, noisy, parallel, or risky work it orchestrates sub-agents. Keep it small enough to clarify, plan, route, synthesize, and talk to the user.

Default flow:

```text
User intent
  → Main Agent clarifies and plans
  → Main Agent acts directly when the work is clear and bounded
  → Main Agent delegates only when delegation adds value
  → sub-agents return bounded reports when used
  → Main Agent synthesizes, decides next step, and owns final claims
```

Main Agent does directly:
- user communication and blocking decisions,
- task classification, planning, and handoff prompts,
- small and medium local edits/checks where delegation costs more than it saves,
- pragmatic verification and final accountability before completion claims.

Sub-agents should handle broad reading, MCP exploration, noisy command execution, independent implementation tracks, QA, security, performance review, and log analysis when that protects main-thread context or adds specialist value.

### Context Budget Protocol

The Main Agent is a workflow controller, not a transcript warehouse. Before broad exploration, implementation, QA/review, final verification, or any phase handoff:

1. checkpoint durable state in [ACTIVE_STATE.md](./ACTIVE_STATE.md), the current plan/spec, or a resume packet,
2. avoid reading or dumping full files unless a bounded excerpt is necessary,
3. delegate broad reading/review when it improves focus or protects the main context,
4. summarize tool and sub-agent outputs instead of carrying raw logs or transcripts,
5. run `/compact` or start a fresh session from artifact links when context pressure is high.

Detailed rules, compact prompts, session-restart prompts, and API 400 recovery steps live in [CONTEXT_BUDGET.md](./CONTEXT_BUDGET.md).

### Phase Handoff Protocol

Use the smallest workflow mode that fits the work before adding ceremony:

| Mode | Use when | Handoff expectation |
|---|---|---|
| Tiny | Typo, text tweak, trivial config, obvious verification, <= 2 likely files | Usually none |
| Small | Localized low-risk work, <= 5 likely files, simple rollback | One compact handoff only if context pressure appears |
| Standard | Existing behavior change, refactor, meaningful tests/review, project-required impact analysis | Required at Code → Test and Test → QA when the phase boundary is real |
| Full | New feature, architecture/API/data/security-sensitive work, high regression cost | Required at every real phase boundary |

A real phase boundary occurs when the next step needs a different role or review mindset, user approval or QA is expected, work moves from implementation to verification, context pressure rises, or a sub-agent/workflow boundary is crossed.

At a real boundary, create a bounded handoff under `docs/reports/YYYY-MM-DD-<slug>/handoffs/`, update `resume.md` as a short pointer only (do not duplicate the handoff), then start the next phase artifact-first. The next phase reads `resume.md` and the latest canonical handoff first, then runs the structured sanity check in [CONTEXT_BUDGET.md](./CONTEXT_BUDGET.md).

Full templates and edge cases live in [PHASE_HANDOFF_PROTOCOL.md](./PHASE_HANDOFF_PROTOCOL.md). Do not copy that full protocol into always-loaded docs.

### Escalation rule
A task on the **Fast path** that turns out to:
- touch a symbol with many callers / `gitnexus_impact` returns **MEDIUM or higher**, OR
- spread across **> 5 files**, OR
- in a brownfield repo with `docs/BROWNFIELD_DISCOVERY.md`, touch **> 2 files** or areas marked **Needs confirmation**,

→ **stop and escalate to the Standard path**: open Plan Mode (gate), run and report impact analysis before continuing.

---

## 2. The four paths (definitions)

### Read-only
Answer questions, read/explain code. No branch, no gate, no commit. Prefer `gitnexus_query`/`gitnexus_context` over blind grep. Always cite `file:line`.
Delegate only for broad exploration that would exceed a few targeted searches; otherwise answer directly.

### Fast path
For small, low-risk work (chore/docs/localized bugfix/hotfix).
1. Create a branch with the right prefix (see [BRANCHING.md](./BRANCHING.md)).
2. Make the change. For a **bugfix**: write a failing (red) test that reproduces the bug BEFORE fixing.
3. Quick self-review (`code-review` if you want) + run tests/lint.
4. Open an MR against the "Fast" DoD in [DEFINITION_OF_DONE.md](./DEFINITION_OF_DONE.md).
> No plan sign-off needed. But if you hit the escalation rule → move to Standard.

Delegate implementation only when it saves meaningful context or time; review is optional unless the escalation rule fires.

### Standard path
For changing existing feature logic & refactors.
1. **Gate**: `EnterPlanMode` → investigate + run `gitnexus_impact` (upstream) → present a plan stating **blast radius + risk level** → `ExitPlanMode` and wait for approval.
2. Warn the user if risk is **HIGH/CRITICAL** before continuing.
3. Implement with TDD; for refactors keep tests unchanged.
4. QA: run `gitnexus_detect_changes`; apply the active profile's review/QA rule from [ASSISTANCE_PROFILES.md](./ASSISTANCE_PROFILES.md).
5. MR against the "Standard" DoD.

Implementation delegation is optional. For review/QA, choose an adaptive review budget: none for low-risk work with credible targeted verification, one combined reviewer for medium-risk uncertainty, targeted specialist review for security/performance/API/data/UI risk, and full multi-stage review only for high-risk or broad multi-area work. Security-sensitive work requires security review when the selected path touches a sensitive surface. Use [HANDOFF_TEMPLATES.md](./HANDOFF_TEMPLATES.md) for reviewer prompts.

### Full path (5-phase) — new features only
See §3.
Use BA and Architect lenses for the gates; delegate implementation only for independent tracks or context isolation. For QA/review, apply the active profile and adaptive review budget: review high-risk seams, avoid duplicate review over already-covered scope, and reserve final integration review for multi-area work.

---

## 3. Full path: 5 phases for a new feature

> Applies only to task type **#7 (Feature)**. Small tasks do NOT run these phases.

### Phase 1 — Discovery & Scoping (lens: Business Analyst)
1. Trigger the `brainstorming` skill. **Apply [COMMUNICATION_PROTOCOL.md](./COMMUNICATION_PROTOCOL.md)** throughout (how to ask, label assumptions, close each round with a summary + open questions + assumptions).
2. Clarify: User Personas, Business Flows, Edge Cases, goals, acceptance criteria.
3. **If it's an AI/assistant feature:** use the **[PRD_AI_FEATURE.md template](./templates/PRD_AI_FEATURE.md)** — it forces the AI-specific dimensions (behavior under ambiguity, guardrails/refusal, definition of "correct" + golden examples, eval strategy, fallback/HITL), and references [INTERACTION_PATTERNS.md](./INTERACTION_PATTERNS.md) for how the assistant talks to end-users.
4. Output: **PRD / Scope Document** under `docs/specs/` per [ARTIFACTS_AND_STORAGE.md](./ARTIFACTS_AND_STORAGE.md), linked from ACTIVE_STATE — including a Decision Log + Assumptions Register.
5. **If the feature has UI:** capture the *design profile + screen inventory + primary flows + per-screen states + which help patterns apply* — see [DESIGN_STANDARDS.md](./DESIGN_STANDARDS.md) §1–§2, §8 and the [DESIGN_BRIEF.md template](./templates/DESIGN_BRIEF.md).
6. **GATE 1 (Plan Mode):** present the PRD → `ExitPlanMode` → wait for the user (Product Owner) to approve.

### Phase 2 — Architecture & Planning (lens: System Architect)
1. `gitnexus_exploring` to understand the current architecture (skip if the relevant area is empty).
2. `gitnexus_impact` for any change to existing code.
3. **Lightweight threat modeling (shift-left):** list attack surface / sensitive data / permissions right here, per [SECURITY_STANDARDS.md](./SECURITY_STANDARDS.md) — don't push it all to QA.
4. **Set the performance budget:** decide target latency/throughput/token-cost per [PERFORMANCE_STANDARDS.md](./PERFORMANCE_STANDARDS.md) (fill the `<TBD>`s).
5. **If the feature has UI:** pick the **design profile** and **lock ONE visual direction** (a single taste skill; optionally explore via the visual companion / `imagegen-*`). Define **design tokens / the design system as part of the contract** (tokens are the FE↔design contract, like the API contract). Plan media production (configured provider vs Claude subagent). See [DESIGN_STANDARDS.md](./DESIGN_STANDARDS.md) §2–§6.
6. **Lock the API/interface contract** between components (FE↔BE, module↔module). *This is a prerequisite for parallelizing in Phase 3.*
7. Trigger `writing-plans` to break down the work → create tasks with `TaskCreate` (session-scoped) + record in ACTIVE_STATE (durable).
8. Output: **Technical Design Document (TDD)** under `docs/plans/` + task list, with report artifacts under `docs/reports/` as required by [ARTIFACTS_AND_STORAGE.md](./ARTIFACTS_AND_STORAGE.md).
9. **GATE 2 (Plan Mode):** present the TDD **plus, for UI features, the design profile + chosen visual direction + key-screen mockups** → `ExitPlanMode` → wait for approval of the technical approach. (No separate design gate.)

### Phase 3 — Implementation (lens: Developer)
1. Mark tasks `in_progress` (`TaskUpdate`) + update ACTIVE_STATE.
2. Execute implementation as bounded tasks. The Main Agent may handle focused edits when delegation costs more than it saves; delegate to Dev sub-agent(s) when the task is broad, independent, context-heavy, or needs isolation. Review/QA delegation follows the adaptive review budget, not a fixed loop. Sub-agents do NOT inherit the conversation/skills, so any delegated prompt must be self-contained (PRD/TDD links, skills to invoke, Done criteria, relevant files). Details: [TEAM_ROSTER.md](./TEAM_ROSTER.md).
3. **Conditional parallelization:** only spawn FE & BE in parallel **after the API contract (Phase 2.5) is locked**. When multiple agents edit overlapping files → `isolation: "worktree"`.
4. Developers apply `test-driven-development`.
5. Frontend implements against the **locked design system** (tokens/components) from Phase 2; use `image-to-code` when implementing from approved visual references; produce embedded media per [DESIGN_STANDARDS.md](./DESIGN_STANDARDS.md) §6; do NOT introduce a new design direction mid-build.

### Phase 4 — Quality Assurance (lens: QA)
1. Apply the active profile's adaptive review budget from [ASSISTANCE_PROFILES.md](./ASSISTANCE_PROFILES.md): run no delegated review for low-risk work with credible targeted evidence, one combined review for medium-risk uncertainty, targeted specialist review for sensitive surfaces, and full multi-stage review only for high-risk or broad multi-area work. Coding Assistant pragmatic work may finish with targeted verification plus explicit developer review handoff.
2. QA runs `verification-before-completion` and the checks required by [DEFINITION_OF_DONE.md](./DEFINITION_OF_DONE.md). For Full path, `security-review` is required; use `systematic-debugging` when failures or unexpected behavior appear. Check against [SECURITY_STANDARDS.md](./SECURITY_STANDARDS.md) + [PERFORMANCE_STANDARDS.md](./PERFORMANCE_STANDARDS.md) (incl. OWASP LLM Top 10 for AI features, and performance budgets).
3. `gitnexus_detect_changes` to confirm no unexpected execution flows broke.
4. Must meet [DEFINITION_OF_DONE.md](./DEFINITION_OF_DONE.md) (Full level) before merging.
5. **Visual QA (UI features):** run the [DESIGN_STANDARDS.md](./DESIGN_STANDARDS.md) §7 checklist (incl. media weight) and verify the in-product help entry exists & is accurate (§8 sync rule); record in `reports/.../design-qa.md`.

### Phase 5 — Handover & Retro (lens: DevOps / Scrum Master)
1. Trigger `finishing-a-development-branch` → open/merge the MR per [BRANCHING.md](./BRANCHING.md).
2. Update **CLAUDE.md** if there are new architectural decisions (record only what's new, don't duplicate).
3. **Light retro (3 lines):** what went well / what was painful / one improvement for next time — record it in ACTIVE_STATE, the MR, or `docs/reports/<slug>/retro.md` per [ARTIFACTS_AND_STORAGE.md](./ARTIFACTS_AND_STORAGE.md).
4. If Serena is configured, use it for semantic code navigation and keep any optional notes as pointers only, with no content duplication.
5. Mark tasks `completed` + update ACTIVE_STATE.

---

## 4. Next-prompt decision table

After each step, choose the next prompt/action from workflow state:

| Current state | Next prompt/action | Loop action |
|---|---|---|
| Request unclear | Ask one clarifying question using [COMMUNICATION_PROTOCOL.md](./COMMUNICATION_PROTOCOL.md). | — |
| Task classified as Q&A | Answer read-only with cited evidence. | — |
| Task classified as chore/docs/config | Use Fast path and verify relevant docs/build checks. | Update `ACTIVE_STATE.md` when done. |
| Localized bugfix | Trigger `systematic-debugging` and write a repro test before fixing. | Update `ACTIVE_STATE.md` when done. |
| Existing behavior change | Enter Standard path, run impact analysis, prepare the plan gate. | Write session `path: standard` when starting. |
| Refactor | Enter Standard path, run impact analysis, preserve behavior, avoid manual rename. | Write session `path: standard` when starting. |
| New feature idea | Generate the BA Discovery Prompt and produce the PRD/scope artifact. | Write session `path: full`, `phase: discovery`. |
| PRD approved | Generate the Architect Planning Prompt and produce the technical plan. | Invoke `phase-handoff`; write session `phase: planning`, `gates.prd.status: approved`. |
| Plan approved | Generate a bounded implementer prompt or act directly when delegation is not useful. | Invoke `phase-handoff`; write session `phase: implementation`, `gates.plan.status: approved`. |
| Implementation done | Select the smallest review budget that fits risk; often targeted verification is enough. | Invoke `phase-handoff`; write session `phase: review`, `resumePath`, `nextAction`. |
| Sensitive surface touched | Generate a targeted Security Reviewer Prompt for the touched sensitive surface. | — |
| Review failed | Generate a focused fix prompt using reviewer findings; re-review only the fix or disputed finding unless scope expanded. | Increment `session.loop.retryCount`; if `>= maxRetries`, escalate to user. |
| Verification passed | Generate the Handover / Retro Prompt and update state/artifacts. | Invoke `phase-handoff`; write session `phase: delivery`. |
| Context pressure high | Write/update the resume packet, run `/compact` if staying in-session, or start a fresh session from artifact links. | Invoke `phase-handoff` checkpoint; advance `lastCheckpoint`. |
| Unexpected risk discovered | Stop, report the risk, and request the required gate or user decision. | Invoke `phase-handoff` to record state; write `nextAction` before stopping. |

---

## 5. Related documents
| File | Content |
|------|---------|
| [TASK router §1](#1-task-classification--workflow-router) | Pick a path by task type |
| [DEFINITION_OF_DONE.md](./DEFINITION_OF_DONE.md) | Measurable completion criteria (per path) |
| [BRANCHING.md](./BRANCHING.md) | Branching model, branch naming, Conventional Commits |
| [TEAM_ROSTER.md](./TEAM_ROSTER.md) | Personas + sub-agent delegation rules + design direction |
| [HANDOFF_TEMPLATES.md](./HANDOFF_TEMPLATES.md) | Reusable prompt contracts for BA, Architect, Implementer, reviewers, brownfield discovery, and handover |
| [CONTEXT_BUDGET.md](./CONTEXT_BUDGET.md) | Context pressure rules, compact/session restart prompts, resume packet format, and API 400 recovery |
| [PHASE_HANDOFF_PROTOCOL.md](./PHASE_HANDOFF_PROTOCOL.md) | Full artifact-first phase-boundary protocol, handoff templates, sanity checks, evidence freshness, and recovery rules |
| [ACTIVE_STATE.md](./ACTIVE_STATE.md) | Pipeline state + resume protocol |
| [ARTIFACTS_AND_STORAGE.md](./ARTIFACTS_AND_STORAGE.md) | Output artifacts, docs/specs/plans/reports layout, storage rules |
| [COMMUNICATION_PROTOCOL.md](./COMMUNICATION_PROTOCOL.md) | Human↔AI communication protocol (requirements clarification) |
| [templates/PRD_AI_FEATURE.md](./templates/PRD_AI_FEATURE.md) | PRD template for AI features (dimensions to clarify) |
| [INTERACTION_PATTERNS.md](./INTERACTION_PATTERNS.md) | How the product (assistant) talks to end-users |
| [SECURITY_STANDARDS.md](./SECURITY_STANDARDS.md) | Security baseline + OWASP LLM Top 10 |
| [PERFORMANCE_STANDARDS.md](./PERFORMANCE_STANDARDS.md) | Performance budgets + AI standards (prompt caching…) |
| [DESIGN_STANDARDS.md](./DESIGN_STANDARDS.md) | UX↔UI, design profiles, skill routing, tokens, platform, media, visual QA, in-product help |
