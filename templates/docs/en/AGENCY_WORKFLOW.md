# Agency Workflow — Single Source of Truth

> **This is the ONLY canonical process document.** Every other file (CLAUDE.md, AGENTS.md, TEAM_ROSTER.md, Serena memories) only **links** here — it must NOT copy the content. To change the process, edit only this file.

The AI acts as a lean software agency. Operating scale: **{{TEAM_SIZE}} + AI**, following **{{BRANCHING_MODEL}}** (see [BRANCHING.md](./BRANCHING.md)). Completion criteria: see [DEFINITION_OF_DONE.md](./DEFINITION_OF_DONE.md).

The personas (BA / Architect / Developer / QA / Scrum Master) are **thinking lenses**, not mandatory ceremony for every task — details in [TEAM_ROSTER.md](./TEAM_ROSTER.md).

---

## 0. Golden rules

1. **Start every request by CLASSIFYING the task** (table §1) → pick the right *path*. Don't default to the full 5-phase process for everything.
2. **Don't jump into code while the request is unclear.** For Standard/Full paths, clarify scope first.
3. **A gate is real Plan Mode, not a promise.** When a path requires a "Gate", use `EnterPlanMode` → present the plan → `ExitPlanMode` for the user to approve. This is a harness-enforced block, replacing the prose "wait for sign-off".
4. **Update [ACTIVE_STATE.md](./ACTIVE_STATE.md)** when starting / finishing a unit of work. It is the durable cross-session backlog (TaskCreate only lives within the current session).
5. **Follow [COMMUNICATION_PROTOCOL.md](./COMMUNICATION_PROTOCOL.md) in every interaction** — especially when clarifying requirements: no silent assumptions, layered certainty, blocking/non-blocking question classification, close the loop on misunderstandings.

---

## 1. Task classification → workflow (ROUTER)

When a request arrives, consult this table first to pick path, branch, required steps, and DoD.

| # | Task type | Trigger / example | Path | Gate | Branch | Required steps | Skills / Tools | DoD (short) |
|---|---|---|---|---|---|---|---|---|
| 1 | **Q&A / Explain / Find code** | "Explain X", "find where Y is handled", "what does this code do" | Read-only | No | — | Answer directly, **don't edit files** | `gitnexus_query`, `gitnexus_context`, serena `find_symbol` | Correct answer + `file:line` citations; no branch/commit |
| 2 | **Chore / Docs / Config** | edit README, change config, bump version, format | Fast | No | `chore/` `docs/` | edit → MR | — | build/lint green; no runtime behavior change |
| 3 | **Small bugfix (localized)** | clear root cause, ≤ ~2 files, not a shared symbol | Fast | No (but **repro test required**) | `fix/` | `systematic-debugging` → write a RED test reproducing the bug → fix → GREEN → MR | systematic-debugging, test-driven-development, verification-before-completion | bug repro test (red→green); regression green; root cause noted in MR |
| 4 | **Hotfix (urgent prod)** | production incident needs an urgent patch | Fast (expedited) | No | `hotfix/` (off `main`) | minimal fix + test → fast MR → backport to the development branch | systematic-debugging, verify | incident patched + test; backported; logged for post-mortem |
| 5 | **Change logic of an existing feature** | "change how X is computed", "add a condition to Y", "change behavior Z" | Standard | **YES** | `change/` | **impact analysis REQUIRED** → ensure/add regression tests → implement → QA review | `gitnexus_impact` (upstream), test-driven-development, code-review | impact reported; regression + new tests green; `detect_changes` scope correct |
| 6 | **Refactor (NO behavior change)** | "split this module", "rename", "clean up" | Standard | **YES** | `refactor/` | tests GREEN before → impact analysis → change (use `gitnexus_rename`) → tests GREEN after (unchanged) | gitnexus_rename, gitnexus_impact, simplify | same test suite passes before & after; NO manual find-replace |
| 7 | **New feature** | "build feature Z" | Full (5-phase) | **YES (2 gates: PRD + TDD)** | `feat/` | full §3 | brainstorming, writing-plans, test-driven-development, design system, code-review, security-review | full [DEFINITION_OF_DONE.md](./DEFINITION_OF_DONE.md) |
| 8 | **Spike / Research / POC** | "feasibility study", "try an approach" | Timeboxed | No (timebox instead of gate) | `spike/` (throwaway) | clear timebox → output a **recommendation doc**; **do NOT merge POC code** into main | deep-research, gitnexus_exploring | conclusion + recommendation doc; POC code stays out of main |

### Escalation rule
A task on the **Fast path** that turns out to:
- touch a symbol with many callers / `gitnexus_impact` returns **MEDIUM or higher**, OR
- spread across **> 5 files**,

→ **stop and escalate to the Standard path**: open Plan Mode (gate), run and report impact analysis before continuing.

---

## 2. The four paths (definitions)

### Read-only
Answer questions, read/explain code. No branch, no gate, no commit. Prefer `gitnexus_query`/`gitnexus_context` over blind grep. Always cite `file:line`.

### Fast path
For small, low-risk work (chore/docs/localized bugfix/hotfix).
1. Create a branch with the right prefix (see [BRANCHING.md](./BRANCHING.md)).
2. Make the change. For a **bugfix**: write a failing (red) test that reproduces the bug BEFORE fixing.
3. Quick self-review (`code-review` if you want) + run tests/lint.
4. Open an MR against the "Fast" DoD in [DEFINITION_OF_DONE.md](./DEFINITION_OF_DONE.md).
> No plan sign-off needed. But if you hit the escalation rule → move to Standard.

### Standard path
For changing existing feature logic & refactors.
1. **Gate**: `EnterPlanMode` → investigate + run `gitnexus_impact` (upstream) → present a plan stating **blast radius + risk level** → `ExitPlanMode` and wait for approval.
2. Warn the user if risk is **HIGH/CRITICAL** before continuing.
3. Implement with TDD; for refactors keep tests unchanged.
4. QA: spawn a review sub-agent (`code-review` + `security-review` if touching a sensitive surface) + `gitnexus_detect_changes`.
5. MR against the "Standard" DoD.

### Full path (5-phase) — new features only
See §3.

---

## 3. Full path: 5 phases for a new feature

> Applies only to task type **#7 (Feature)**. Small tasks do NOT run these phases.

### Phase 1 — Discovery & Scoping (lens: Business Analyst)
1. Trigger the `brainstorming` skill. **Apply [COMMUNICATION_PROTOCOL.md](./COMMUNICATION_PROTOCOL.md)** throughout (how to ask, label assumptions, close each round with a summary + open questions + assumptions).
2. Clarify: User Personas, Business Flows, Edge Cases, goals, acceptance criteria.
3. **If it's an AI/assistant feature:** use the **[PRD_AI_FEATURE.md template](./templates/PRD_AI_FEATURE.md)** — it forces the AI-specific dimensions (behavior under ambiguity, guardrails/refusal, definition of "correct" + golden examples, eval strategy, fallback/HITL), and references [INTERACTION_PATTERNS.md](./INTERACTION_PATTERNS.md) for how the assistant talks to end-users.
4. Output: **PRD / Scope Document** (copy to `docs/specs/YYYY-MM-DD-<feature>.md`, link in ACTIVE_STATE) — including a Decision Log + Assumptions Register.
5. **GATE 1 (Plan Mode):** present the PRD → `ExitPlanMode` → wait for the user (Product Owner) to approve.

### Phase 2 — Architecture & Planning (lens: System Architect)
1. `gitnexus_exploring` to understand the current architecture (skip if the relevant area is empty).
2. `gitnexus_impact` for any change to existing code.
3. **Lightweight threat modeling (shift-left):** list attack surface / sensitive data / permissions right here, per [SECURITY_STANDARDS.md](./SECURITY_STANDARDS.md) — don't push it all to QA.
4. **Set the performance budget:** decide target latency/throughput/token-cost per [PERFORMANCE_STANDARDS.md](./PERFORMANCE_STANDARDS.md) (fill the `<TBD>`s).
5. **Lock the API/interface contract** between components (FE↔BE, module↔module). *This is a prerequisite for parallelizing in Phase 3.*
6. Trigger `writing-plans` to break down the work → create tasks with `TaskCreate` (session-scoped) + record in ACTIVE_STATE (durable).
7. Output: **Technical Design Document (TDD)** + task list.
8. **GATE 2 (Plan Mode):** present the TDD → `ExitPlanMode` → wait for approval of the technical approach.

### Phase 3 — Implementation (lens: Developer, possibly a sub-agent)
1. Mark tasks `in_progress` (`TaskUpdate`) + update ACTIVE_STATE.
2. Large work → **delegate to sub-agents** via the `Agent` tool. **Sub-agent prompts must be self-contained** (sub-agents do NOT inherit the conversation/skills): embed PRD/TDD links, name the skills to invoke, the Done criteria, and the relevant files. Details: [TEAM_ROSTER.md](./TEAM_ROSTER.md).
3. **Conditional parallelization:** only spawn FE & BE in parallel **after the API contract (Phase 2.5) is locked**. When multiple agents edit overlapping files → `isolation: "worktree"`.
4. Developers apply `test-driven-development`.
5. Frontend follows **one** locked design direction (don't invoke multiple design skills at once — see TEAM_ROSTER §design).

### Phase 4 — Quality Assurance (lens: QA, sub-agent)
1. Spawn a Code Reviewer / QA sub-agent (self-contained prompt).
2. QA runs `verification-before-completion`, `security-review`, `systematic-debugging` as needed. Check against [SECURITY_STANDARDS.md](./SECURITY_STANDARDS.md) + [PERFORMANCE_STANDARDS.md](./PERFORMANCE_STANDARDS.md) (incl. OWASP LLM Top 10 for AI features, and performance budgets).
3. `gitnexus_detect_changes` to confirm no unexpected execution flows broke.
4. Must meet [DEFINITION_OF_DONE.md](./DEFINITION_OF_DONE.md) (Full level) before merging.

### Phase 5 — Handover & Retro (lens: DevOps / Scrum Master)
1. Trigger `finishing-a-development-branch` → open/merge the MR per [BRANCHING.md](./BRANCHING.md).
2. Update **CLAUDE.md** if there are new architectural decisions (record only what's new, don't duplicate).
3. **Light retro (3 lines):** what went well / what was painful / one improvement for next time — record in ACTIVE_STATE or the MR.
4. Save project context to Serena memory (pointers, no content duplication).
5. Mark tasks `completed` + update ACTIVE_STATE.

---

## 4. Related documents
| File | Content |
|------|---------|
| [TASK router §1](#1-task-classification--workflow-router) | Pick a path by task type |
| [DEFINITION_OF_DONE.md](./DEFINITION_OF_DONE.md) | Measurable completion criteria (per path) |
| [BRANCHING.md](./BRANCHING.md) | Branching model, branch naming, Conventional Commits |
| [TEAM_ROSTER.md](./TEAM_ROSTER.md) | Personas + sub-agent delegation rules + design direction |
| [ACTIVE_STATE.md](./ACTIVE_STATE.md) | Pipeline state + resume protocol |
| [COMMUNICATION_PROTOCOL.md](./COMMUNICATION_PROTOCOL.md) | Human↔AI communication protocol (requirements clarification) |
| [templates/PRD_AI_FEATURE.md](./templates/PRD_AI_FEATURE.md) | PRD template for AI features (dimensions to clarify) |
| [INTERACTION_PATTERNS.md](./INTERACTION_PATTERNS.md) | How the product (assistant) talks to end-users |
| [SECURITY_STANDARDS.md](./SECURITY_STANDARDS.md) | Security baseline + OWASP LLM Top 10 |
| [PERFORMANCE_STANDARDS.md](./PERFORMANCE_STANDARDS.md) | Performance budgets + AI standards (prompt caching…) |
