# Context Budget Protocol

The Main Agent is a workflow controller, not a transcript warehouse. Use this protocol to keep Claude Code sessions small enough to continue reliably, especially during long Standard and Full path work.

Routing and gates live in [AGENCY_WORKFLOW.md](./AGENCY_WORKFLOW.md). Role behavior lives in [TEAM_ROSTER.md](./TEAM_ROSTER.md). Durable state and resume artifacts live under the rules in [ARTIFACTS_AND_STORAGE.md](./ARTIFACTS_AND_STORAGE.md).

## 1. Purpose

## 1.1 Artifact-first phase boundaries

The invariant is:

```text
Phase work → bounded handoff artifact → context reset boundary → next phase reads artifact-first
```

Writing a handoff file does not reduce context by itself. It helps only when followed by `/compact`, a fresh session, a bounded sub-agent handoff, or a workflow boundary where only the artifact is passed forward.

For Tiny/Small work, avoid report ceremony unless context pressure or evidence needs it. For Standard/Full work, create bounded handoffs at real phase boundaries and keep `resume.md` as a short pointer to the latest canonical handoff.

Full reference: [PHASE_HANDOFF_PROTOCOL.md](./PHASE_HANDOFF_PROTOCOL.md).

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

For Standard and Full paths, update `docs/reports/YYYY-MM-DD-<slug>/resume.md` at every real phase boundary so it points to the latest canonical handoff. For Tiny/Small work, updating `ACTIVE_STATE.md` is enough unless context pressure, evidence needs, or a real handoff requires a report folder.

## 7. Resume packet

A resume packet is the fresh-session entry point. It points; it does not duplicate every handoff.

Store it at:

```text
docs/reports/YYYY-MM-DD-<slug>/resume.md
```

Use this format:

```markdown
# Resume Packet — <Work Item>

## Current pointer
- Latest canonical handoff:
- Current mode:
- Current phase:
- Next action:

## State
- Status: green | yellow | red
- Branch:
- Working tree state:
- Key artifacts:
- Changed files summary:

## Verification
- Last command:
- Result:
- Log path:
- Evidence freshness:

## Open items
- Blockers:
- Risks:
- User decisions needed:

## Context rules for next session
- Read first:
- Read only if needed:
- Do not reread:
- Do not paste:
```

If `resume.md` and the latest approved handoff conflict, fix `resume.md` before continuing.

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

## 12. Sanity check

At the start of Code, Test, QA, or Handover, verify minimally:

```markdown
## Sanity check
- Branch: pass | warn | block — note
- Working tree: pass | warn | block — note
- Canonical handoff freshness: pass | warn | block — note
- Required files exist: pass | warn | block — note
- Changed files summary: pass | warn | block — note
- Required commands available: pass | warn | block — note
- Open blockers: pass | warn | block — note

Decision: continue | continue-with-warning | stop
```

Hard blockers include wrong branch, stale handoff, missing required file, missing approval, evidence claimed as current but older than relevant changes, or unresolved blockers marked complete without evidence.

## 13. Evidence freshness

Evidence is valid only if it was produced after the relevant code/config/artifact change, on the expected branch and working tree, with a referenced log path when output is long.

Before Code → Test, Test → QA, or QA → Handover handoffs, capture or explicitly mark the status of:

- current branch,
- `git status`,
- `git diff --name-status`,
- `git diff --stat`,
- `git diff --check`,
- relevant build/test commands,
- project-required impact/change analysis when code changed.

If a command is not run, record the command, reason, risk, and severity.

## 14. Final claims

Final claims require fresh evidence. Before saying work is complete, the latest QA/Handover artifact or final summary must show:

- `git diff --check` passed, if code changed,
- build passed, if relevant,
- relevant tests passed or skipped with reason/risk,
- QA verdict: `pass`, `yellow`, `fail`, or `blocked`,
- unresolved risks,
- project-required change/impact analysis when code changed,
- final changed files summary,
- evidence freshness statement.

If evidence is missing, say: `Implemented, but not fully verified because <reason>.`

## 15. API 400 recovery

If Claude Code returns a context-window API 400 error:

1. stop trying to continue the bloated session,
2. start a fresh Claude Code session,
3. provide only the latest resume packet and artifact links,
4. ask the agent to continue artifact-first,
5. avoid rereading broad context unless the resume packet requires it.
