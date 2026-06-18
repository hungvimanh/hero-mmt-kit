# Enforcement Hooks — Design Spec

**Date:** 2026-06-18
**Status:** Approved
**Source:** Consumer feedback — TVU.CHECKIN.BE session, 2026-06-18

---

## Problem

Claude implements tasks without passing through the Standard workflow gates — no router classification, no Plan Mode, no impact analysis, no approval. The entire process in `CLAUDE.md` and `AGENCY_WORKFLOW.md` is soft instruction: the model reads it, understands it, and can still skip it when a task looks "simple." The only hard constraint today is the commit gate (`workflow-check.cjs`) — which fires too late (code is already done).

**Root cause:** `PreToolUse` hooks only cover `Bash`. `Edit` and `Write` tool calls have zero enforcement. By the time `git commit` is blocked, work has already been done without authorization.

---

## Scope

| Priority | Description | Type |
|----------|-------------|------|
| P0 | Block `Edit`/`Write` when phase or plan gate is not ready | New hook file |
| P1 | Inject session state context at session start (first tool call) | New hook file |
| P2 | Distinguish `hook` (hard block) vs `convention` (soft) in router table | Docs change |
| P3 | Warn early on `git add` before commit gate fires | Extend existing hook |

---

## Architecture

```
templates/common/.claude/hooks/
  git-guard.cjs        — unchanged
  stop-reminder.cjs    — add flag cleanup for P1
  workflow-check.cjs   — keep commit gate, add P3 git-add warn
  edit-gate.cjs        — NEW: P0, gates Edit/Write tool calls
  session-bridge.cjs   — NEW: P1, injects session context once per session

templates/common/.claude/settings.json  — add Edit, Write, PostToolUse matchers
templates/docs/AGENCY_WORKFLOW.md       — P2: add Enforcement column to router table
```

---

## P0 — `edit-gate.cjs`

Gates every `Edit` and `Write` tool call on standard/full paths.

### Logic

```
1. Read .hero-vibe-kit/session.json
   → missing or malformed → allow (fail-open)

2. Lean path or lean mode → allow
   Lean paths : read-only, fast, null
   Lean modes : tiny, small, null

3. file_path matches safe whitelist → allow
   Whitelist:
     docs/
     i18n/
     tests/  or  __tests__/
     *.config.*   (e.g. vite.config.ts, jest.config.js)
     *.json       (package.json, tsconfig.json, etc.)
     .hero-vibe-kit/

4. phase ∈ {planning, discovery} → BLOCK

5. phase = null AND gates.plan.required = true → BLOCK

6. gates.plan.required = true AND gates.plan.status ≠ approved → BLOCK

7. → allow
```

### Tool input field

- `Edit` tool: `tool_input.file_path`
- `Write` tool: `tool_input.file_path`

### Block message (stderr + exit 2)

```
⛔ hero-vibe-kit: edit blocked — {path} path, phase={phase}, plan gate={status}.

To unblock:
  - Advance to implementation phase via the phase-handoff skill, OR
  - Approve the plan gate (session.json gates.plan.status = "approved")

Safe paths (always allowed): docs/, tests/, i18n/, *.json, *.config.*
Override (emergency): HVK_SKIP_EDIT_GATE=1
```

### Fail-safe behavior

| Condition | Behavior |
|-----------|----------|
| session.json missing | allow (fail-open) |
| session.json malformed | allow (fail-open) |
| lean path/mode | allow |
| file in whitelist | allow |
| any read error | allow (fail-open) |

---

## P1 — `session-bridge.cjs`

Injects current session state into model context on the first tool call of each session. Simulates a `SessionStart` hook using `PostToolUse` with a flag file guard.

### Logic

```
PostToolUse, matcher: .*

1. Check .hero-vibe-kit/session-injected.flag
   → exists → exit 0 (already injected this session)

2. Read .hero-vibe-kit/session.json
   → missing → exit 0

3. Write to stderr:
   ─────────────────────────────────────────
   [hero-vibe-kit] Session state (auto-injected)
     Work item : {workItem ?? "(none)"}
     Path      : {path ?? "(not set)"} / Phase: {phase ?? "(not set)"}
     Plan gate : {gates.plan.status ?? "n/a"}
     Next      : {nextAction ?? "(none)"}
   ─────────────────────────────────────────

4. Write .hero-vibe-kit/session-injected.flag (empty file)

5. exit 0
```

### Flag lifecycle

- **Created:** after first successful injection
- **Deleted:** by `stop-reminder.cjs` at session end (add one `fs.rmSync` call, safe if missing)

### Implementation note

`PostToolUse` matcher `".*"` assumes Claude Code supports regex/wildcard matchers for PostToolUse (same as PreToolUse). If not supported, enumerate matchers explicitly (e.g., `"Bash"`, `"Edit"`, `"Write"`, `"Read"`) or use an empty matcher if that means "all". Verify during implementation.

### Why stderr, not stdout

Stdout in `PostToolUse` hooks is parsed as JSON by Claude Code. Plain-text context must go to stderr, which is shown to the model as inline context.

---

## P3 — `workflow-check.cjs` addition

Adds an early warning when `git add` stages non-checkpoint files on a gated path. Does **not** block — warns only (exit 0).

### Logic (new handler, prepended before existing commit handler)

```
command matches `git` AND `add` AND NOT `commit`

1. no session.json → exit 0
2. lean path → exit 0
3. git status --porcelain → staged file list
4. staged files contain no checkpoint file
   AND path is standard or full
   → stderr WARN (exit 0):
   "⚠ hero-vibe-kit: staging non-checkpoint files on {path} path.
    Plan gate: {status}. Remember to touch session.json or ACTIVE_STATE.md before committing."
```

Checkpoint definition (unchanged from existing commit gate):
1. `.hero-vibe-kit/session.json`
2. `docs/ACTIVE_STATE.md`
3. any file under `docs/reports/{reportSlug}/`

---

## P2 — `AGENCY_WORKFLOW.md` router table update

Add `Enforcement` column to the router table:

| Path | Gates Required | Enforcement |
|------|---------------|-------------|
| Full | PRD approved + Plan approved | `hook` — hard block (edit-gate, workflow-check) |
| Standard | Plan approved | `hook` — hard block (edit-gate, workflow-check) |
| Timeboxed | — | `convention` — soft (model discipline) |
| Fast | — | `convention` — soft (model discipline) |
| Read-only | — | `convention` — soft (model discipline) |

Add a note beneath the table:

> **hook** = enforced by `PreToolUse`/`PostToolUse` hooks — Claude cannot bypass without an explicit `HVK_SKIP_*` env override.
> **convention** = relies on model following instructions — no hard block exists.

---

## `settings.json` changes

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          { "type": "command", "command": "node .claude/hooks/git-guard.cjs" },
          { "type": "command", "command": "node .claude/hooks/workflow-check.cjs" }
        ]
      },
      {
        "matcher": "Edit",
        "hooks": [
          { "type": "command", "command": "node .claude/hooks/edit-gate.cjs" }
        ]
      },
      {
        "matcher": "Write",
        "hooks": [
          { "type": "command", "command": "node .claude/hooks/edit-gate.cjs" }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": ".*",
        "hooks": [
          { "type": "command", "command": "node .claude/hooks/session-bridge.cjs" }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          { "type": "command", "command": "node .claude/hooks/stop-reminder.cjs" }
        ]
      }
    ]
  }
}
```

---

## Error messages — design principles

- All block messages start with `⛔ hero-vibe-kit:` (consistent with existing hooks)
- All warn messages start with `⚠ hero-vibe-kit:`
- Every block message includes the recovery path (what to do to unblock)
- Emergency override env vars: `HVK_SKIP_EDIT_GATE=1`, existing `HVK_SKIP_STATE_GATE=1`

---

## Out of scope

- Cursor enforcement (P0/P1 are Claude Code only for now; P2/P3 Cursor support can follow)
- Consumer-configurable whitelist patterns (option A chosen: hardcoded inverted whitelist)
- Nested worktree or multi-repo scenarios
