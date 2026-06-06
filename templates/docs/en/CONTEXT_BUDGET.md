# Context Budget Protocol

The Main Agent is a workflow controller, not a transcript warehouse. Use this protocol to keep Claude Code sessions small enough to continue reliably, especially during long Standard and Full path work.

Routing and gates live in [AGENCY_WORKFLOW.md](./AGENCY_WORKFLOW.md). Role behavior lives in [TEAM_ROSTER.md](./TEAM_ROSTER.md). Durable state and resume artifacts live under the rules in [ARTIFACTS_AND_STORAGE.md](./ARTIFACTS_AND_STORAGE.md).

## 1. Purpose

The protocol prevents context-window failures by moving durable state out of chat and into artifacts, bounding sub-agent outputs, and forcing checkpoint/compact/session-split decisions at high-risk moments.

It addresses failures such as:

```text
API Error: 400 Your input exceeds the context window of this model.
```

## 2. Non-goals

This protocol does not:

- automatically run `/compact`,
- change Claude Code settings,
- add runtime dependencies,
- add a memory MCP server,
- require a `resume.md` for every small Fast path task,
- replace the workflow router or Definition of Done.

## 3. Context-pressure signals

Trigger this protocol when any of these happen:

- the Main Agent has read many large files,
- a diff is long or spans many files,
- test output or logs are long,
- a sub-agent returns a long response,
- review/fix loops repeat several times,
- the Main Agent is about to reread broad context,
- Claude Code feels slow, confused, or loses state,
- the user reports context problems,
- Claude Code returns a context-window API 400 error.

## 4. No-dump rules

By default, the Main Agent must not paste these into chat:

- full file contents,
- full diffs,
- full test logs,
- full sub-agent transcripts,
- entire specs or plans when only one task is needed,
- unfiltered command output when pass/fail or a short excerpt is enough.

Prefer:

- targeted excerpts,
- summaries,
- file/path citations,
- report artifacts,
- bounded sub-agent findings.

## 5. Bounded command-output protocol

Run noisy commands in bounded mode:

1. redirect raw output to a log artifact,
2. print only exit code, pass/fail, counts, top errors, and log path,
3. read the full log only when debugging,
4. delegate long log analysis to a sub-agent when it protects the main context.

Examples of noisy commands: `git diff`, `npm test`, `dotnet build`, `dotnet test`, MCP exploration, broad search, and generated transcripts.

Use summary commands by default:

```text
git diff --stat
git diff --name-status
git diff --check
```

Store raw command output under `docs/reports/YYYY-MM-DD-<slug>/logs/` when a durable artifact is useful.

## 6. Mandatory checkpoint triggers

Checkpoint before moving through these boundaries:

- Discovery → Planning,
- Planning → Implementation,
- Implementation → QA/review,
- QA/review → Handover,
- Handover → commit/PR/merge.

Also checkpoint whenever context pressure is high.

For Standard and Full paths, create or update `docs/reports/YYYY-MM-DD-<slug>/resume.md` when the work is long-running or context pressure is high. For small Fast path work, updating `ACTIVE_STATE.md` is enough unless context pressure is high.

## 7. Resume packet

A resume packet is concise restart state, not a copied transcript.

Store it at:

```text
docs/reports/YYYY-MM-DD-<slug>/resume.md
```

Use this format:

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

## 8. Compact prompt

When staying in the same session, use:

```text
/compact Summarize only durable state for continuing this task. Include: goal, approved decisions, current path/phase, files changed, artifacts, verification evidence, open risks/blockers, next action, and what not to reread. Drop transcripts, full file contents, full diffs, full logs, and conversational detail.
```

## 9. Fresh-session prompt

When the current session is bloated or hit by API 400, start fresh with:

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

## 10. Sub-agent output limits

Sub-agents may read broadly, but must report narrowly.

Ask sub-agents to return only:

- status or verdict,
- top findings,
- evidence summary,
- file/path citations,
- risks or blockers,
- next actions.

Sub-agents must not return:

- full transcripts,
- full file contents,
- full diffs,
- full logs,
- broad unrelated commentary.

## 11. Tool-output hygiene

Before running tools that may emit large output:

1. narrow the file path or search pattern,
2. request only the needed lines or summary,
3. avoid reading generated transcripts unless necessary,
4. prefer pass/fail summaries for tests,
5. write long evidence to reports instead of chat.

## 12. API 400 recovery

If Claude Code returns a context-window API 400 error:

1. stop trying to continue the bloated session,
2. start a fresh Claude Code session,
3. provide only the latest resume packet and artifact links,
4. ask the agent to continue artifact-first,
5. avoid rereading broad context unless the resume packet requires it.
