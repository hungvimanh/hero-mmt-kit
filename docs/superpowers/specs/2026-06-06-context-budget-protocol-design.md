# Context Budget Protocol — Design Spec

Date: 2026-06-06
Status: Draft for user review

## 1. Purpose

`hero-vibe-kit` should keep the Main Agent lightweight enough to avoid context-window failures during long Claude Code sessions. The immediate problem is API errors such as `400 Your input exceeds the context window of this model`, often caused by the Main Agent accumulating too much chat history, file content, diffs, logs, test output, and sub-agent transcript detail.

This design adds a strict but practical **Context Budget Protocol**. The protocol makes the Main Agent a workflow controller rather than a transcript warehouse. Long-lived state moves into artifacts, broad reading/review can be delegated, outputs are bounded, and phase transitions use checkpoint/compact/session-split rules.

## 2. Current foundation

The framework now has a strong process-first self-prompting foundation:

- `AGENCY_WORKFLOW.md` contains the task router, self-prompting loop, path definitions, and next-prompt decision table.
- `TEAM_ROSTER.md` defines Main Agent accountability and conditional lenses/sub-agents.
- `HANDOFF_TEMPLATES.md` defines reusable prompt contracts for BA, Architect, Implementer, reviewers, brownfield discovery, and handover.
- `ARTIFACTS_AND_STORAGE.md` defines durable state, specs, plans, reports, and authoritative sources.

The missing layer is explicit context management: when to stop adding chat context, what not to dump, how to checkpoint, when to compact, and how to resume from artifacts after a context-window failure.

## 3. Design principles

1. **Main Agent as controller.** The Main Agent owns routing, gates, synthesis, user communication, and final claims, but should not retain raw transcripts, full logs, full file dumps, or full diffs.
2. **Artifact-first memory.** Durable state belongs in `ACTIVE_STATE.md`, specs, plans, reports, and a new resume packet artifact. Chat history is temporary working context.
3. **Read broad, report narrow.** Sub-agents may inspect broad areas, but must return bounded reports: verdict/status, top findings, evidence, citations, and next actions.
4. **Strict checkpoints at risky boundaries.** Before phase transitions, major review, final verification, or commit/PR handoff, the workflow must checkpoint state and compact or split the session when context pressure is high.
5. **No full dumps by default.** Full file contents, full diffs, full logs, and full sub-agent transcripts should not be pasted into the main chat unless explicitly requested or necessary for a small bounded excerpt.
6. **Recover by restarting from artifacts.** If Claude Code hits a context-window 400 error, the expected recovery is a fresh session using the latest resume packet and artifact links, not repeated attempts to continue the bloated session.
7. **Documentation/template-only.** This phase adds operating rules and templates. It does not change runtime code, settings, hooks, model limits, or dependencies.
8. **Bilingual parity.** English and Vietnamese template documents must stay structurally equivalent.

## 4. Proposed architecture

Add a named protocol: **Context Budget Protocol**.

It complements the existing self-prompting loop:

```text
Self-Prompting Router = decides the next valid workflow prompt
Context Budget Protocol = keeps the main session small enough to execute that prompt safely
```

The router still decides path, gate, delegation, and verification. The context protocol governs how much raw context the Main Agent may accumulate while executing that path.

## 5. Primary documentation changes

### 5.1 `AGENCY_WORKFLOW.md`

Add a concise `Context Budget Protocol` section after the existing `Self-Prompting Router` section.

The section should state that the Main Agent is a workflow controller, not a transcript warehouse. Before broad exploration, implementation, QA/review, final verification, or phase handoff, it must:

1. checkpoint durable state,
2. avoid reading or dumping full files unless necessary,
3. delegate broad reading/review when useful,
4. summarize tool and sub-agent outputs,
5. compact or split the session when context pressure is high.

Add a row to the next-prompt decision table:

```markdown
| Context pressure high | Write/update the resume packet, run `/compact` if staying in-session, or start a fresh session from artifact links. |
```

Add `CONTEXT_BUDGET.md` to the related documents table.

### 5.2 New `CONTEXT_BUDGET.md`

Create bilingual context-budget documents:

- `templates/docs/en/CONTEXT_BUDGET.md`
- `templates/docs/vi/CONTEXT_BUDGET.md`

The document should contain:

1. Purpose and non-goals.
2. Context-pressure signals.
3. What the Main Agent should not dump into chat.
4. Mandatory checkpoint triggers.
5. Compact and fresh-session guidance.
6. Resume packet format.
7. Sub-agent output limits.
8. Tool-output hygiene.
9. Recovery procedure for API 400 context-window errors.

### 5.3 `TEAM_ROSTER.md`

Update the Main Agent and sub-agent sections to make context budgeting explicit:

- Main Agent is a lightweight controller and synthesizer.
- Main Agent should not store raw transcripts or full dumps in chat.
- Sub-agents may read broadly, but must report narrowly.
- Sub-agent output should include conclusions, evidence, risks, decisions, next actions, and file/path citations, not transcripts.

### 5.4 `HANDOFF_TEMPLATES.md`

Extend the base handoff contract with a new field:

```text
Context budget:
```

Add a general constraint to the base section:

```text
Do not return full transcripts, full diffs, full logs, or full file contents unless explicitly requested.
```

Reviewer, QA, and handover prompts should emphasize bounded output: verdict/status, top findings, evidence summary, citations, and next actions.

### 5.5 `ARTIFACTS_AND_STORAGE.md`

Add a new artifact type:

| Information | Primary storage | Purpose | Notes |
|---|---|---|---|
| Resume packet | `docs/reports/YYYY-MM-DD-<slug>/resume.md` | Compact/session restart state | Create or update before phase handoff, major review, final verification, or context-pressure recovery. |

Add `resume.md` to the report directory layout and path artifact guidance for Standard/Full work. For small Fast path work, updating `ACTIVE_STATE.md` may be enough unless context pressure is high.

## 6. Strict trigger rules

### 6.1 Phase-boundary triggers

Checkpoint before moving through these boundaries:

- Discovery → Planning
- Planning → Implementation
- Implementation → QA/review
- QA/review → Handover
- Handover → commit/PR/merge

For Standard and Full paths, this should usually create or update `docs/reports/YYYY-MM-DD-<slug>/resume.md`. For Fast path work, `ACTIVE_STATE.md` or a concise report note is enough unless context pressure is high.

### 6.2 Context-pressure signals

Trigger the protocol when any of these occur:

- many large files have been read in the Main Agent session,
- diff is long or spans many files,
- test output or logs are long,
- sub-agent output is long,
- there are many review/fix loops,
- the Main Agent is about to reread broad context,
- the user reports Claude Code is slow, confused, or losing state,
- Claude Code reports `API Error: 400 Your input exceeds the context window`.

### 6.3 Strict no-dump rules

By default, the Main Agent should not paste:

- full file content,
- full diffs,
- full test logs,
- full sub-agent transcripts,
- entire specs/plans when only one task is needed,
- unfiltered command output when pass/fail or a few lines are enough.

Use summaries, targeted excerpts, citations, artifacts, and bounded reports instead.

## 7. Resume packet design

Resume packets live at:

```text
docs/reports/YYYY-MM-DD-<slug>/resume.md
```

Recommended format:

```markdown
# Resume Packet — <work item>

## Current state
- Path:
- Phase:
- Status:
- Last completed step:

## Goal
- User-facing goal:
- Non-goals:

## Approved decisions
- Decision:
- Reason:
- Source artifact:

## Files changed
- `path`: what changed

## Artifacts
- Spec:
- Plan:
- Reports:
- Active state:

## Verification evidence
- Command:
- Result:
- Notes:

## Open risks / blockers
- Risk:
- Blocker:
- Needs user decision:

## Next action
- Do next:
- Do not do:
- Required skill/tool:

## Context hygiene
- Do not reread:
- Do read:
- Do not paste:
- Prefer:
```

The resume packet is intentionally concise. It should contain enough state to resume safely, not a duplicate of specs, plans, diffs, or logs.

## 8. Compact and restart prompts

### 8.1 Compact prompt

When continuing in the same session:

```text
/compact Summarize only durable state for continuing this task. Include: goal, approved decisions, current path/phase, files changed, artifacts, verification evidence, open risks/blockers, next action, and what not to reread. Drop transcripts, full file contents, full diffs, full logs, and conversational detail.
```

### 8.2 Fresh-session prompt

When recovering from a bloated session or API 400:

```text
Continue this task from artifacts, not old chat history.

Read first:
- docs/reports/<slug>/resume.md
- docs/ACTIVE_STATE.md
- docs/plans/<plan>.md only if the resume packet requires it
- docs/specs/<spec>.md only if the resume packet requires it

Do not reread the whole repo, full diff, old transcript, or all docs.
Do not paste full files/logs/diffs into chat.
Current goal: <next action from resume packet>.
Start by confirming path, phase, current status, and next action in no more than 5 lines.
```

### 8.3 Sub-agent bounded-output prompt

When delegating broad reading/review:

```text
Read only the files needed for this bounded task.
Return a bounded report:
- status/verdict
- top findings
- evidence
- file/path citations
- next actions

Do not return full transcripts, full file contents, full diffs, or full logs.
If evidence is long, summarize it and cite the source path/command.
```

## 9. Out of scope

This phase does not add:

- automatic `/compact` hooks,
- Claude Code settings changes,
- a new CLI command such as `hero-vibe-kit resume`,
- runtime package logic,
- model/provider context-limit changes,
- a memory-management MCP server,
- mandatory `resume.md` creation for every small Fast path task.

## 10. Success criteria

After implementation, a consumer project initialized by `hero-vibe-kit` should guide Claude to:

- recognize context-pressure signals,
- avoid dumping long raw content into the main chat,
- delegate broad reading/review while receiving bounded reports,
- checkpoint before high-risk phase boundaries,
- create a concise resume packet when needed,
- compact with a state-preserving prompt,
- recover from API 400 by starting a fresh artifact-first session,
- continue work without rereading the entire repo or old transcript.

The user should experience fewer context-window failures, lighter Main Agent sessions, and cleaner cross-session recovery.

## 11. Verification plan

Implementation should verify:

1. English and Vietnamese template doc link integrity.
2. English and Vietnamese template file-set parity.
3. Placeholder scan for new docs.
4. Full `npm test` suite.
5. `gitnexus_detect_changes(scope: all)` before any commit request.

## 12. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Protocol becomes too strict for small tasks | Allow Fast path to use `ACTIVE_STATE.md` only unless context pressure is high. |
| Docs become duplicated | Keep short mandatory rules in `AGENCY_WORKFLOW.md`; put detailed operations in `CONTEXT_BUDGET.md`. |
| Claude ignores the detailed document | Link `CONTEXT_BUDGET.md` from workflow, roster, handoff templates, and artifact storage. |
| Resume packets become too long | Define resume packet as concise state, not copied specs/plans/logs/diffs. |
| User expects automatic compaction | State that this phase provides prompts and workflow rules, not hooks/settings automation. |
| Bilingual drift | Implement EN/VI changes in the same task and rely on link/parity tests. |
