# hero-mmt-kit

> A focused, human-led coding workflow for **Claude Code** — seven direct-use skills (planning, coding, reviewing, unit testing, security, MR review, strict verification) plus an on-demand report writer, simple durable state, and soft safety hooks. Zero runtime dependencies.

`hero-mmt-kit` installs a lightweight Claude Code workflow into new or existing repositories. It is designed for developers who stay in control: you choose the task, invoke the relevant skill, and keep the final judgment on plans, code, tests, reviews, and security checks.

## What it is

`hero-mmt-kit` is **documentation + direct-use skills + soft hooks + a zero-dependency CLI**. It does not route work automatically, enforce phases, or block normal development flow.

- **Seven operative skills** (`hero-planning`, `hero-coding`, `hero-reviewing`, `hero-unit-test`, `hero-security`, `hero-mr-review`, `hero-strict`) covering the lifecycle of a change. They define Hero-native stage contracts and, where useful, incorporate attributed methodology from proven vendored techniques. Each phase is done on its own — finishing one never auto-triggers the next.
- **Report writing is on-demand** — `hero-coding`/`hero-reviewing`/`hero-unit-test` end with a concise chat summary; a written report is only produced when asked, via the separate `hero-report` skill.
- **No router, no gates** — there is no task-classification doc and no hard PreToolUse enforcement. `using-hero` is a map, not a controller.
- **Soft hooks only** — `git-guard` blocks a small set of genuinely dangerous git commands and reminds (never blocks) on ordinary commits; `stop-reminder` nudges you to update state when you stop with uncommitted changes; `active-state-bridge` injects `docs/ACTIVE_STATE.md` into context once per session start.
- **Durable state lives in one place** — `docs/ACTIVE_STATE.md`'s Active Features table, not a separate session pointer file.
- **Full skill suite, every install** — the bundled process skills install unconditionally; there's no profile/surface logic deciding what you get.
- **Standards docs** for security, performance, design, and interaction patterns, plus PRD/design-brief templates.

Optional third-party tools such as taste/design skills, GitNexus, and Serena are referenced or installed from their own sources when available; they are not required for the core workflow.

## Quick start

```bash
# In your project root (new or existing):
npx hero-mmt-kit init

# For existing codebases, create the first discovery map:
npx hero-mmt-kit discover

# Restart Claude Code (or run /hooks) to activate hooks, then validate:
npx hero-mmt-kit doctor
```

Non-interactive / CI examples:

```bash
npx hero-mmt-kit init --dir <tmp> --yes --skip-integrations

# Opt into the optional taste/design skill non-interactively:
npx hero-mmt-kit init --dir <tmp> --yes --taste
```

## What `init` installs

```text
your-project/
  CLAUDE.md          # hero-mmt-kit managed block; existing content preserved
  AGENTS.md          # cross-agent entry pointer
  docs/              # ACTIVE_STATE, BROWNFIELD_DISCOVERY, SECURITY_STANDARDS,
                     # PERFORMANCE_STANDARDS, DESIGN_STANDARDS, INTERACTION_PATTERNS,
                     # templates/PRD_AI_FEATURE, templates/DESIGN_BRIEF
  .claude/
    settings.json    # hooks merged into existing settings, not clobbered
    hooks/           # git-guard.cjs, stop-reminder.cjs, active-state-bridge.cjs
    skills/          # full bundled skill suite (see below)
  .hero-mmt-kit/
    config.json      # { installTasteSkill, version, brownfield, integrations }
```

- **New project:** scaffolds the workflow from scratch.
- **Brownfield project:** preserves existing `CLAUDE.md`, `AGENTS.md`, and `.claude/settings.json`; inserts managed blocks (`<!-- hero-mmt-kit:start/end -->`) and deep-merges hooks. `docs/ACTIVE_STATE.md` is never overwritten.
- **Idempotent updates:** re-running `init` or `update` refreshes framework-managed regions and backs up touched files to `*.bak` when needed.
- **One interactive question:** `init` asks whether to install the optional taste/design skill (default No). `--yes` accepts the default; `--taste` opts in without prompting.

## Workflow skills

Invoke `using-hero` first for an overview — it explains which skill applies next and how workflow state carries across sessions. The seven operative skills:

| Skill | Use when | Artifact / report |
|---|---|---|
| `hero-planning` | Clarifying non-trivial work through analysis and brainstorming, then writing an implementation-only plan. | `docs/plans/YYYY-MM-DD-slug.md` — always written; it's the deliverable, not a report |
| `hero-coding` | Implementing every task and requirement in an approved plan, or a small bounded request. No testing or self-review. | `docs/coding-reports/YYYY-MM-DD-slug.md` — on request |
| `hero-reviewing` | Single read-only entry point for a fresh implementation review, technical assessment of supplied feedback, or an explicit combination of both. | `docs/reviews/YYYY-MM-DD-slug.md` — on request |
| `hero-unit-test` | Writing and running post-implementation unit tests from the approved requirements; no production-code fixes. | `docs/test-reports/YYYY-MM-DD-slug.md` — on request |
| `hero-security` | You want an independent OWASP + AI/LLM security review of a sensitive surface. | `docs/security-reports/YYYY-MM-DD-slug.md` — always written for the security pass. |
| `hero-mr-review` | Reviewing a teammate's committed MR/ref against MR intent and repository conventions. | `docs/mr-reviews/YYYY-MM-DD-slug.md` — always written. |
| `hero-strict` | Extra rigor wanted in a separate full verification session before a "done" claim. | Appends to the current report, if one exists/was requested. |

A typical flow is `hero-planning` → `hero-coding` → `hero-unit-test` and/or `hero-reviewing` → (`hero-security` or `hero-strict` when wanted) → done. Start each stage explicitly, preferably in a fresh session: planning defines implementation work; coding implements and tracks it only; unit testing writes/runs tests only; reviewing conducts a fresh review and/or assesses supplied feedback without fixing code or running tests. Confirmed findings require explicit user approval before a later `hero-coding` correction session. Skip stages that do not fit the change. There is no automatic full-pipeline run.

Choose review by source of truth. `hero-reviewing` is the one entry point for comparing a local or committed implementation with its Hero plan or explicit acceptance criteria and for validating supplied review feedback; optional fresh-review delegation happens internally. `hero-mr-review` sits outside that flow and reviews a teammate's committed MR range against MR intent, repository conventions, impact, and potential bugs.

`hero-coding`, `hero-reviewing`, and `hero-unit-test` don't write a report file by default — they end with a concise chat summary. An eighth, on-demand skill, `hero-report`, writes those report files when the user actually wants one, at the path convention the source skill defines. `hero-security` and `hero-mr-review` are the exceptions: both are independent flows that always write their own standalone report (`docs/security-reports/...` and `docs/mr-reviews/...` respectively).

The kit also ships general-purpose vendored technique skills: `brainstorming`, `executing-plans`, `test-driven-development`, `systematic-debugging`, `verification-before-completion`, `dispatching-parallel-agents`, `subagent-driven-development`, `using-git-worktrees`. They remain available for direct use, but their broader lifecycles must not override a Hero stage's hard boundary. All are bundled under `templates/skills/` and installed unconditionally into `.claude/skills/`, with attribution in `templates/skills/NOTICE`.

## Session state

`docs/ACTIVE_STATE.md`'s Active Features table is the single source of durable workflow state — there is no separate session pointer file. Skills update it only when their contract needs durable workflow metadata; read-only review and test-only work do not create unrelated implementation changes merely to record progress. The `active-state-bridge` hook injects it into context automatically at the start of a session, so resuming usually needs no extra reading — otherwise, read `docs/ACTIVE_STATE.md` directly.

## Commands

| Command | Purpose |
|---|---|
| `init` | Install the workflow into the current project. |
| `update` | Re-render managed regions while preserving user edits and working files. |
| `discover` | Scan a brownfield codebase and create `docs/BROWNFIELD_DISCOVERY.md`. |
| `brownfield` | Alias for `discover`. |
| `doctor` | Validate hooks, settings, workflow state, doc links, and tool presence. `--strict` for CI. |
| `version` | Print the package version. |
| `help` | Show usage. |

Flags:

```text
--dir <path>          Target project dir (default: current dir)
--taste                Install the taste/design skill (default: off)
--yes                  Non-interactive; accept defaults
--skip-integrations    Skip design-skill / GitNexus / Serena integration steps
--strict               (doctor only) treat compliance warnings as failures — for CI use
```

## Optional integrations

Integrations are auto-detected. Core workflow installation works without them.

| Tool | What it is | What `init` does |
|---|---|---|
| Taste/design skills | UI/design skills from `Leonxlnx/taste-skill` | Installed from source via the `skills` CLI only if you opt in (`--taste` or interactive Yes) |
| GitNexus | Code-intelligence CLI/MCP | Auto-runs `npx gitnexus analyze` only if the repo already has a `.gitnexus/` index; otherwise skipped |
| Serena | Semantic code-intelligence MCP | Auto-seeds pointer notes only if `.serena/` already exists; otherwise skipped |

Required: Node.js 18+ and Claude Code. Everything else is optional.

## Update and customize

- Edit anything outside `<!-- hero-mmt-kit:start/end -->` markers freely; `update` will not touch it.
- Fill `<TBD>` placeholders in Security, Performance, and Design docs once the stack is known.
- Run `npx hero-mmt-kit update` to refresh framework-managed docs/hooks to the latest version.
- Never hand-edit inside managed regions; change the source template or run `update` from a newer package version.

## Uninstall

Review files before deleting them, especially skill directories that may contain user-added content. To remove the framework, delete or clean up:

- framework docs under `docs/`,
- `.claude/hooks/*` and the hook block in `.claude/settings.json`,
- managed blocks in `CLAUDE.md` and `AGENTS.md`,
- `.hero-mmt-kit/`,
- bundled skills under `.claude/skills/` that you no longer want.

## License and attribution

MIT (see `LICENSE`). `hero-mmt-kit` vendors a curated, lightly trimmed copy of core process skills from [`obra/superpowers`](https://github.com/obra/superpowers) under `templates/skills/` with attribution in `templates/skills/NOTICE`.

Design/UI skills from [`Leonxlnx/taste-skill`](https://github.com/Leonxlnx/taste-skill) are **not** redistributed; they are installed from source via the `skills` CLI under their own license only when the user opts into the taste/design skill.
