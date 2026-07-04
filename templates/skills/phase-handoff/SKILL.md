---
name: phase-handoff
description: Use when crossing workflow phase boundaries, creating resume packets, recovering from context pressure, or handing work to a fresh session or sub-agent
---

# Phase Handoff

## Overview

Core principle: Phase work → bounded handoff artifact → context reset boundary → next phase reads artifact-first.

A phase handoff preserves decisions, evidence, and the exact next action without carrying the full conversation forward.

## When to Use

Use when:
- Moving from discovery to planning, planning to implementation, implementation to review, or review to delivery.
- Context pressure makes continued work unreliable.
- A fresh session or sub-agent must resume with minimal ambiguity.
- Work must pause after a real decision, approval, test result, or blocker.

Do not use when:
- The next action is a tiny same-session continuation.
- No phase boundary, approval point, or context reset exists.
- A normal status update is enough.
- You would duplicate a more authoritative plan, test log, issue, or PR summary.

## Quick Mode Check

| Mode | Use for | Artifact size |
| --- | --- | --- |
| Tiny | One next action, no branching | 3-5 bullets |
| Small | Simple phase transition | 6-10 bullets |
| Standard | Multi-step resume with evidence | Short structured packet |
| Full | High-risk or multi-agent handoff | Structured packet plus evidence map |

## Real Phase Boundary

Only hand off at a real boundary:
- A phase is complete or intentionally paused.
- The next phase has a different goal, owner, or risk profile.
- Required approval, evidence, or blocker state has changed.
- Continuing without a reset would hide assumptions or stale context.

## Router Integration

The Self-Prompting Router in `AGENCY_WORKFLOW.md` drives when to invoke this skill. Map router states to skill actions:

| Router state | Loop action |
| --- | --- |
| PRD approved | Invoke `phase-handoff` (discovery → planning boundary); write session `phase: planning` |
| Plan approved | Invoke `phase-handoff` (planning → implementation boundary); write session `phase: implementation` |
| Implementation done | Invoke `phase-handoff` (implementation → review boundary); write session `phase: review` |
| Review passed | Invoke `phase-handoff` (review → delivery boundary); write session `phase: delivery` |
| Context pressure high | Invoke `phase-handoff` (in-phase checkpoint); advance `lastCheckpoint` |
| Blocker / unexpected risk | Invoke `phase-handoff` to record state; set session `phase` and `nextAction` before stopping |

At any real phase boundary, the Main Agent **must** invoke `phase-handoff` before starting the next phase. Self-prompting does not carry state forward through chat history — only the artifact and session pointer do.

## Loop Termination

For review/fix loops, the skill tracks retry attempts via the session `loop` counter:

- `loop.retryCount` increments each time the same phase re-enters after a failed review.
- `loop.maxRetries` defaults to `2`.
- When `loop.retryCount >= loop.maxRetries`: stop, escalate to the user, and record the blocker in session `nextAction`.

Always reset `loop.retryCount` to `0` when a phase succeeds and transitions forward.

## Fast Path (Tiny/Small)

For Tiny or Small mode:
- Inline bounded output is sufficient — no canonical file under `docs/reports/` required.
- Do not create a report folder unless context pressure, evidence, or a real handoff requires it.
- Do update `ACTIVE_STATE.md` when the task unit completes.
- Session state update is optional for Tiny; recommended for Small if the work spans sessions.

## Session Read/Write

At every real boundary (Standard or Full), the skill **must** update `.hero-vibe-kit/session.json`:

**Minimum required fields at each boundary:**
- `phase` — the current phase (e.g., `"implementation"`)
- `resumePath` — path to the latest `resume.md` (the fresh-session entry point)
- `nextAction` — the first concrete action for the next phase
- `lastCheckpoint` — ISO timestamp of this update

**Also update when relevant:**
- `workItem` — the slug or identifier of the current work item
- `path` — `read-only` | `fast` | `standard` | `full` | `timeboxed`
- `mode` — `tiny` | `small` | `standard` | `full`
- `reviewBudget` — `none` | `single-combined-review` | `targeted-specialist-review` | `full-multi-stage-review`
- `reportSlug` — the `docs/reports/YYYY-MM-DD-<slug>` directory name
- `canonicalHandoff` — path to the latest handoff artifact
- `gates.prd.status` and `gates.plan.status` when a gate is approved or blocked
- `loop.retryCount` on review failures

**Write order at a boundary:**
1. Write supporting artifacts first (logs, reviews).
2. Write the canonical handoff artifact.
3. Update `resume.md` as a short pointer.
4. Write `session.json` last — only after the artifacts are durable.

**Source-of-truth rule:** handoff artifacts and `ACTIVE_STATE.md` are authoritative. `session.json` is a derived convenience pointer. On any conflict between session and artifacts, trust the artifacts and flag the session as stale (set `nextAction` to `"verify session vs handoff — potential drift"`).

**Advancing `lastCheckpoint` also satisfies the `workflow-check` commit gate for Standard/Full paths** — so updating the session is the cheapest way to unblock a commit.

## Gate Status Updates

When a PRD or plan gate is approved:
- Set `gates.prd.status: "approved"` and `gates.prd.evidence: "<approval source>"` when the PRD gate passes.
- Set `gates.plan.status: "approved"` and `gates.plan.evidence: "<approval source>"` when the plan gate passes.
- Set `gates.*.status: "blocked"` when a gate is blocked with a reason in `nextAction`.
- For Fast/Read-only paths: leave `gates.*.required: false` and `gates.*.status: "not-applicable"`.

## Archive Rule

When a work item completes:
1. Move all durable detail to `docs/reports/<slug>/`.
2. Replace the item's row in `ACTIVE_STATE.md` with a one-line link: `- [slug](docs/reports/<slug>/resume.md) — completed YYYY-MM-DD`.
3. Keep `ACTIVE_STATE.md` as a short index (active rows only).
4. Reset session to a blank default for the next work item.

Do not let `ACTIVE_STATE.md` grow as an append log — that defeats its purpose as a short cross-session index.

## Required Inputs

Capture only what the next phase needs:
- Mode: tiny, small, standard, or full.
- Status: green, yellow, or red.
- Approval: draft, approved, auto-approved, or blocked.
- Approved by, approval evidence, and approval note when relevant.
- Branch, base commit, working tree state, and evidence captured against.
- Source of truth, read first, do not read, and next action.
- Last updated, constraints, allowed edit scope, and known non-goals.

## Write Order

1. State status and phase boundary first.
2. Record approval and evidence identity before conclusions.
3. List decisions and constraints.
4. List changed files or touched areas.
5. Give the next action.
6. End with risks, blockers, and verification gaps.

## Base Handoff Shape

Use this shape for Standard or Full mode. See also optional YAML frontmatter in `docs/HANDOFF_TEMPLATES.md`.

```markdown
# Phase Handoff

Work item: specific task, issue, PR, or artifact
Mode: tiny | small | standard | full
From phase: discovery | planning | implementation | review | delivery
To phase: discovery | planning | implementation | review | delivery
Status: green | yellow | red
Approval: draft | approved | auto-approved | blocked
Approved by: name, role, or automation identity
Approval evidence: artifact, command, review, issue, or decision source
Approval note: concise reason or condition
Branch: current branch
Base commit: commit used as baseline
Working tree state: clean, dirty, or scoped changes
Evidence captured against: branch, commit, timestamp, or run identity
Last updated: timestamp or session point
Source of truth: authoritative plan, issue, PR, artifact, or decision
Read first: smallest required artifact list
Do not read: logs, diffs, transcripts, or stale artifacts to skip
Next action: first concrete action for the next phase
```

Keep the packet bounded. Link or name evidence; do not paste full logs unless the exact text is necessary.

## Resume Shape

A resume packet is shorter and action-first:

```markdown
Resume from: phase and status
Read first: artifact or evidence identity
Do next: one concrete action
Do not redo: decisions already made
Watch for: stale evidence, blockers, constraints
Verify with: smallest trustworthy check
```

## Sanity check

Before acting, the next phase records:
- Branch: pass | warn | block — note
- Working tree: pass | warn | block — note
- Canonical handoff freshness: pass | warn | block — note
- Required files exist: pass | warn | block — note
- Changed files summary: pass | warn | block — note
- Required commands available: pass | warn | block — note
- Open blockers: pass | warn | block — note

Decision: continue | continue-with-warning | stop

If any item blocks, clarify or refresh evidence before changing files.

## Evidence Freshness

Treat evidence as stale when:
- Files, dependencies, branch state, or tests changed after it was captured.
- The handoff lacks command output identity or timestamp/session point.
- The next action depends on external state such as CI, packages, APIs, or approvals.

Refresh the smallest evidence needed. Do not rerun broad checks unless the risk requires it.

## Canonical Update Safety

Before updating a canonical handoff or `resume.md`:

1. Check the current `resume.md` latest pointer.
2. If the canonical handoff already exists and a later phase consumed it, archive the old version under `archive/` before a material update.
3. Write supporting artifacts first, then the canonical handoff, then `resume.md` last.
4. If another agent changed the same canonical file or `resume.md`, write a conflict note and stop for reconciliation.

Never silently overwrite an already-used canonical handoff.

## Output

For Standard or Full real phase boundaries, write the canonical handoff artifact where the workflow expects it and update `resume.md`. For Tiny or Small handoffs without durable artifact need, return a bounded summary directly.

Always output artifact paths and the next-phase prompt. Do not include full logs, diffs, or transcripts.

## Common Mistakes

- Writing a narrative instead of a resume-ready packet.
- Omitting approval state or evidence identity.
- Treating old test output as fresh without saying why.
- Handing off in the middle of one unresolved thought.
- Pasting entire logs instead of naming the evidence and key result.
- Leaving the next phase to infer the first action.
- Forgetting to update `session.json` at a Standard/Full boundary (blocks the commit gate).
- Updating session before the handoff artifact is written (write artifact first, session last).
