# Project Active State

**Last Updated:** {{DATE}}
**Current Global Phase:** 0 — Initialization & Setup

> 📌 **The "Active Features" table below IS the durable cross-session backlog.** It is the primary source of state when resuming.
> `TaskCreate`/`TaskList` only live **within the current session** (in-memory, lost when the session closes) — use them to track current work, NOT as a long-term backlog. Whenever a feature's status changes → update this table and the corresponding MR/issue (if any).

## Active Features in Pipeline

| Feature / Epic | Path | Current phase | Branch / MR | Status | PRD | TDD |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| N/A | N/A | N/A | - | Idle | - | - |

## Blockers / Pending Actions
- Waiting for the Product Owner to propose the first feature/idea.
- Decide the tech stack → fill the placeholders in [DEFINITION_OF_DONE.md](./DEFINITION_OF_DONE.md).
- Decide the design direction → update [TEAM_ROSTER.md](./TEAM_ROSTER.md) §3.

## Session Resume Protocol
*An AI starting a new session READS this section:*
1. Read [AGENCY_WORKFLOW.md](./AGENCY_WORKFLOW.md) (SSOT) for the router & paths.
2. Look at the "Active Features" table above + any **open MRs** (`git branch`, MR list) — do NOT rely on the previous session's TaskList (it's gone).
3. By each feature's path & phase:
   - **Read-only/Fast**: continue/finish then open the MR.
   - **Standard/Full at Phase 1–2**: continue brainstorming/planning with the user (via the Plan Mode gate).
   - **Standard/Full at Phase 3–4**: open the linked PRD/TDD, check code & branch status, recreate tasks with `TaskCreate` for this session, ask the user before resuming code/test.
4. Update this table when you start working.
