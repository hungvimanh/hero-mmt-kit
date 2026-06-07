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

Use this shape for Standard or Full mode:

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
