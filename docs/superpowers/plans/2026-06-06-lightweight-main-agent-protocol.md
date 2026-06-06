# Lightweight Main Agent Protocol Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Main Agent operate as a lightweight user-facing planner/router while sub-agents execute broad or noisy work and return bounded reports.

**Architecture:** Documentation/template-only change. `AGENCY_WORKFLOW.md` owns workflow control, `TEAM_ROSTER.md` owns role responsibility, `HANDOFF_TEMPLATES.md` owns report contract, `CONTEXT_BUDGET.md` owns bounded command/log rules, and `ARTIFACTS_AND_STORAGE.md` owns raw log artifact placement.

**Tech Stack:** Markdown templates, Node built-in test suite via `npm test`.

---

### Task 1: Add Main Agent operating mode

**Files:**
- Modify: `templates/docs/en/AGENCY_WORKFLOW.md`
- Modify: `templates/docs/vi/AGENCY_WORKFLOW.md`

- [ ] **Step 1: Add Lightweight Main Agent Protocol section**

Add after the Self-Prompting Router / Context Budget area:

```markdown
### Lightweight Main Agent Protocol

The Main Agent is the user-facing orchestrator, not the default executor. It should stay small enough to plan, route, synthesize, and talk to the user.

Default flow:

```text
User intent
  -> Main Agent clarifies and plans
  -> Main Agent delegates bounded work
  -> Sub-agents execute / explore / test / review
  -> Sub-agents return bounded reports
  -> Main Agent synthesizes, decides next step, and owns final claims
```

Main Agent does directly only:
- user communication and blocking decisions,
- task classification, planning, and handoff prompts,
- small local edits/checks where delegation costs more than it saves,
- final accountability gates before completion claims.

Sub-agents should handle broad reading, MCP exploration, noisy command execution, implementation, QA, security, performance review, and log analysis when that protects main-thread context.
```

- [ ] **Step 2: Mirror Vietnamese wording**

Use equivalent Vietnamese wording in `templates/docs/vi/AGENCY_WORKFLOW.md`.

### Task 2: Update role responsibilities

**Files:**
- Modify: `templates/docs/en/TEAM_ROSTER.md`
- Modify: `templates/docs/vi/TEAM_ROSTER.md`

- [ ] **Step 1: Update Main Agent description**

Add that Main Agent is coordinator/planner/router/synthesizer and avoids becoming the worker by default.

- [ ] **Step 2: Add executor responsibility to sub-agent section**

Add bullets:
- sub-agents may run build/test/MCP/read/review/implementation tasks,
- output must be bounded,
- raw output belongs in artifacts,
- Main Agent keeps final accountability.

### Task 3: Add handoff report contract

**Files:**
- Modify: `templates/docs/en/HANDOFF_TEMPLATES.md`
- Modify: `templates/docs/vi/HANDOFF_TEMPLATES.md`

- [ ] **Step 1: Extend base contract**

Add fields:

```text
Execution scope:
Commands/tools allowed:
Raw output policy:
```

- [ ] **Step 2: Add bounded report format**

Document default report fields:

```text
Status:
Summary:
Files touched/read:
Commands/tools run:
Result:
Evidence:
Risks/blockers:
Next action:
Artifact/log paths:
```

### Task 4: Add bounded command-output protocol

**Files:**
- Modify: `templates/docs/en/CONTEXT_BUDGET.md`
- Modify: `templates/docs/vi/CONTEXT_BUDGET.md`
- Modify: `templates/docs/en/ARTIFACTS_AND_STORAGE.md`
- Modify: `templates/docs/vi/ARTIFACTS_AND_STORAGE.md`

- [ ] **Step 1: Add noisy command rule**

Rules:
- redirect raw command output to a log artifact,
- print only exit code, summary, counts, top errors, and log path,
- read full log only when debugging.

- [ ] **Step 2: Add log artifact location**

Use `docs/reports/YYYY-MM-DD-<slug>/logs/` for raw command outputs.

### Task 5: Verify docs

**Files:**
- Test: Node test suite

- [ ] **Step 1: Run full tests**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 2: Run GitNexus change detection**

Run GitNexus detect changes with scope `all`.
Expected: low risk, no unexpected affected flows.

- [ ] **Step 3: Do not commit unless user asks**

Leave changes uncommitted and report summary + verification evidence.

---

## Self-review

- Scope = documentation/template-only.
- Bilingual parity required for every template doc change.
- No runtime dependencies.
- No raw logs in chat.
- No commit/package unless user asks.
