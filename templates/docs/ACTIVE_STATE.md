# Project Active State

**Last Updated:** {{DATE}}
**Current Global Phase:** 0 — Initialization & Setup

> 📌 **The "Active Features" table below IS the durable cross-session backlog.** It is the primary source of state when resuming.
> `TaskCreate`/`TaskList` only live **within the current session** (in-memory, lost when the session closes) — use them to track current work, NOT as a long-term backlog. Whenever a feature's status changes → update this table and the corresponding MR/issue (if any).

## Active Features in Pipeline

| Feature / Epic | Path | Current phase | Branch | Status | PRD | TDD |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| N/A | N/A | N/A | - | Idle | - | - |

## Blockers / Pending Actions
- Waiting for the Product Owner to propose the first feature/idea.
- Decide the tech stack → fill the `<TBD>` placeholders in [SECURITY_STANDARDS.md](./SECURITY_STANDARDS.md) and [PERFORMANCE_STANDARDS.md](./PERFORMANCE_STANDARDS.md).
- Decide the design direction → follow [DESIGN_STANDARDS.md](./DESIGN_STANDARDS.md) §2.

## Context budget discipline
This file is an index, not a report. Keep it short enough to read at session start.

Keep here:
- active goals and current phase/status,
- open blockers and next actions,
- decisions that still affect current work,
- links to canonical PRDs, TDDs, reports, MRs, issues, or archived notes.

Do not paste long investigation notes, transcripts, screenshots, logs, PRDs, or completed reports here. Summarize in 1–2 lines and link the source. When work is no longer active, archive durable details under `docs/reports/` (or the canonical artifact path) and replace the table entry with a short link if future agents may need it.

## Session Resume Protocol

This file is the single source of durable workflow state — there is no separate session pointer file. Its "Active Features" table above is injected into context automatically at the start of a session (via the `active-state-bridge` hook), so resuming usually needs no extra reading.

*An AI starting or resuming tracked work:*
1. Check the injected "Active Features" context (or read this table directly if it wasn't injected).
2. If a row names an artifact (plan/report), open it for concrete next steps.
3. If you need to switch work items, re-read this table plus `git branch` for local work in progress.
4. Update this table when durable work state changes. When a work item completes, replace the row with a one-line link to the artifact.
