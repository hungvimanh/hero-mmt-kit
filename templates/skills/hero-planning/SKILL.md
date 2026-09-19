---
name: hero-planning
description: Use when non-trivial work needs collaborative requirements discovery and an implementation-only plan before code changes
---

# Hero Planning

## Overview

hero-planning has two responsibilities:

1. Reach a shared, precise understanding of what the user needs.
2. Translate that understanding into an implementation plan whose tasks cover the required business behavior without omission or accidental scope expansion.

This skill owns both brainstorming and plan writing. It does not invoke `brainstorming` or `writing-plans` as nested workflow steps, and it does not implement the plan.

<HARD-BOUNDARY>
The plan contains implementation work only. Do not add testing, verification, code review, security review, deployment, release, merge, or commit tasks. Do not run those activities during planning. They belong to independent skills or later sessions so they can examine the implementation with fresh context.
</HARD-BOUNDARY>

## When to Use

Use this skill when:
- Starting a feature, non-trivial bugfix, or refactor.
- Changing existing behavior, data, interfaces, or architecture.
- The request has business rules, edge cases, dependencies, or ambiguity worth resolving before code changes.
- An approved brief or spec must be converted into executable implementation tasks.

Skip it for a typo, a trivial configuration edit, or an obvious bounded change. Those can go directly to `hero-coding` without a plan artifact.

## Inputs

- The user's request and follow-up decisions.
- Any issue, PRD, design, approved spec, or external contract that is a source of truth.
- Relevant codebase context. Use GitNexus (`gitnexus_query`, `gitnexus_context`, `gitnexus_impact`) or Serena when available; fall back to ordinary exploration when they are not.
- Existing workflow state from `docs/ACTIVE_STATE.md`, when present.

If an approved design already exists, reuse it. Do not repeat questions it has already answered; investigate only gaps or contradictions that would change implementation.

## Process

### 1. Establish the source of truth

Identify what defines the requested behavior: the current conversation, an issue, a PRD, an approved design, an existing API contract, or a combination of them. If sources conflict, surface the conflict and resolve it with the user before planning further.

Separate:
- Explicit requirements.
- Constraints that must remain true.
- Suggestions that are optional.
- Assumptions that still need a decision.

### 2. Explore the current system

Understand the existing behavior before proposing the target behavior:
- Trace the relevant entry points, control flow, data flow, state, interfaces, and persistence.
- Locate established patterns and nearby implementations that should be reused.
- Identify consumers, compatibility obligations, migrations, configuration, and generated artifacts affected by the change.
- For refactors or existing-behavior changes, run upstream `gitnexus_impact` when GitNexus is available. Report direct callers, affected processes, and risk before finalizing the approach.

Do not invent file paths, symbols, APIs, or line numbers. Inspect the codebase and use exact names where they are known.

### 3. Brainstorm with the user

Resolve decisions that affect behavior or implementation. Ask one focused question at a time when an answer is genuinely needed.

Cover the dimensions relevant to the work:
- Purpose, users or actors, and triggering events.
- Primary flow and alternate flows.
- Inputs, outputs, state transitions, and side effects.
- Business rules and invariants.
- Permissions, ownership, and visibility rules.
- Failure behavior, recovery behavior, and edge cases.
- Backward compatibility, migration, rollout constraints, and platform limits.
- Explicit scope and non-goals.

For a meaningful design choice, present the viable approaches, their trade-offs, and a recommendation. Do not manufacture alternatives when only one approach fits the codebase and requirements.

Do not silently choose business behavior. If an unresolved answer could change the plan, keep discussing instead of recording a guess.

### 4. Build the requirement ledger

Assign stable IDs (`R1`, `R2`, ...) to the confirmed requirements. Each entry must state observable business behavior or a concrete constraint, not an implementation activity.

The ledger must capture:
- Required behavior.
- Business rules and invariants.
- Error and edge-case behavior.
- Compatibility or migration obligations.
- Explicitly excluded scope.

Every later implementation task references these IDs. This makes coverage visible while the plan is being constructed rather than relying on a post-hoc plan review.

### 5. Choose the implementation design

Describe the selected approach at implementation level:
- Components or modules and their responsibilities.
- Control flow and data flow.
- Interfaces, signatures, schemas, events, and configuration keys.
- State transitions, persistence changes, and migrations.
- Error propagation and fallback behavior.
- Compatibility boundaries and sequencing constraints.

Keep the design proportional to the change. Follow existing architecture unless changing it is necessary for the requirement.

### 6. Map the change surface

Create a change map before decomposing tasks:
- Exact files or directories to create, modify, move, or remove.
- The responsibility of each changed area.
- Relevant symbols or sections when known.
- Requirement IDs served by each change.

Prefer focused files and clear interfaces, but do not introduce unrelated restructuring. Files that must change together should usually belong to the same task.

### 7. Decompose implementation tasks

Order tasks by dependency. A task is the smallest coherent implementation unit that produces a meaningful business or architectural outcome.

Task boundaries must:
- Map to one or more requirement IDs, or be explicit enabling work for a mapped task.
- Include setup, schema, configuration, generated files, and required documentation in the task whose outcome needs them.
- Keep dependent changes sequential and expose interfaces before their consumers.
- Preserve the `### Task N: [Name]` heading format so execution tooling can extract task briefs.
- Describe implementation only; assurance and delivery work is not a task category here.

Each task must tell an implementer what to change without prescribing an entire finished patch. Include exact contracts or pseudocode only where prose would leave behavior ambiguous.

### 8. Account for complete coverage

Build the requirement-to-task matrix as part of the plan:
- Every requirement ID maps to at least one implementation task.
- Every task maps to a requirement or a named implementation dependency.
- Business rules and edge cases appear in the task that owns them.
- Cross-task interfaces use consistent names and shapes.
- No task introduces behavior outside the agreed scope without labeling it as required enabling work.

If a requirement has no implementing task, add or correct the task before saving. If a task has no requirement or dependency, remove it or resolve the scope with the user.

### 9. Write the plan and stop

Save the plan to:

`docs/plans/YYYY-MM-DD-<slug>.md`

Use a lowercase kebab-case slug matching the work item. Keep the plan concise but complete: compress prose, preserve every business rule and technical fact. Preserve exact file paths, implementation commands, API names, config keys, schemas, error behavior, and risk labels.

If Plan Mode is active, exit it after the plan file is saved so the user can read the artifact normally. Then report the path and stop. Do not ask to implement, offer execution choices, invoke `hero-coding`, or start another workflow stage. The user decides when and in which session implementation begins.

## Plan Document Contract

Every plan must use this structure, adapting subsections only when they truly do not apply:

```markdown
# [Work Item] Implementation Plan

**Goal:** [The business or product outcome]

**Source of truth:** [Request, issue, PRD, approved design, or contract]

**Chosen approach:** [Short description and the decisive reason]

**Implementation boundary:** This document contains implementation tasks only. Assurance and delivery activities are intentionally handled in separate sessions.

## Requirements

| ID | Required behavior or constraint | Source |
|---|---|---|
| R1 | ... | ... |

## Scope

### In scope
- ...

### Out of scope
- ...

## Current and Target Behavior

### Current behavior
- ...

### Target behavior
- ...

### Business rules and edge cases
- `R1`: ...

## Implementation Design

### Components and responsibilities
- ...

### Interfaces and data flow
- ...

### State, migration, and compatibility
- ...

## Change Map

| Path / area | Action | Responsibility | Requirements |
|---|---|---|---|
| `exact/path` | Create / Modify / Remove | ... | R1 |

## Task Dependencies

`Task 1 → Task 2 → Task 3`

## Implementation Tasks

### Task 1: [Coherent implementation outcome]

**Requirements:** R1, R2

**Depends on:** None

**Outcome:** [The implemented state this task leaves behind]

**Files / areas:**
- Create: `exact/path`
- Modify: `exact/path` — [symbol or responsibility]
- Remove: `exact/path`

**Implementation steps:**
- [ ] [Concrete code, schema, configuration, migration, or documentation change]
- [ ] [Concrete business-rule, state-flow, interface, or error-handling change]

**Business rules and edge cases:**
- [Exact behavior this task owns]

**Interfaces produced or changed:**
- [Exact name, inputs, outputs, schema, event, or configuration key]

**Completion state:** [What now exists after implementation, without assurance or delivery instructions]

## Requirements Coverage

| Requirement | Implemented by | Notes |
|---|---|---|
| R1 | Task 1 | ... |

## Resolved Decisions

- [Decision]: [Resolution and reason]

## Preconditions

- [External dependency that must exist before the applicable task can start]
```

## Plan Quality Rules

- Use confirmed requirements, not inferred intent.
- Use exact file paths and symbol names when the codebase makes them knowable.
- Keep interfaces consistent across tasks.
- Keep steps actionable; avoid vague future-work language or generic instructions such as "handle edge cases appropriately."
- Do not duplicate complete production code in the plan. Include signatures, schemas, algorithms, or pseudocode only when they prevent ambiguity.
- Include implementation commands only when they create or transform implementation artifacts. Omit commands whose purpose belongs to a later assurance or delivery session.
- Do not include execution-mode choices or handoff prompts in the artifact.
- Do not dispatch a plan-review subagent from this skill. Completeness comes from the requirement ledger and coverage matrix; independent review, when wanted, happens in another session.

## Definition of Done

- Requirements and business decisions are explicit; no implementation-changing question remains unresolved.
- Current behavior, target behavior, business rules, edge cases, and constraints are captured.
- The chosen design, change map, interfaces, dependencies, and migration or compatibility needs are explicit.
- Every requirement maps to implementation work, and every task has a requirement or named dependency.
- The plan contains implementation tasks only and preserves the `### Task N:` extraction contract.
- The plan is saved at `docs/plans/YYYY-MM-DD-<slug>.md`.
- Plan Mode, when active, has been exited; no implementation or later workflow stage has started.

## ACTIVE_STATE.md Update

Add or update the work item's row in `docs/ACTIVE_STATE.md` with the plan path, planning phase, and current status. Keep this as workflow metadata; the implementation detail belongs only in the plan.

## Related Skills and Stage Boundaries

- `hero-coding` may consume the approved plan only after the user explicitly starts implementation, preferably in a separate session.
- `hero-unit-test`, `hero-reviewing`, `hero-security`, and deployment or release work are independent later stages. They are not embedded in this plan.
- When a standalone `brainstorming` session already produced an approved design, use that design as an input and plan only the remaining implementation detail.
