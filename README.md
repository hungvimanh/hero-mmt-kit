# hero-mmt-kit

> A focused, human-led coding workflow for **Claude Code** — six direct-use skills (planning, coding, reviewing, unit testing, security, strict verification) plus an on-demand report writer, simple durable state, and soft safety hooks. Zero runtime dependencies.

`hero-mmt-kit` installs a lightweight Claude Code workflow into new or existing repositories. It is designed for developers who stay in control: you choose the task, invoke the relevant skill, and keep the final judgment on plans, code, tests, reviews, and security checks.

## What it is

`hero-mmt-kit` is **documentation + direct-use skills + soft hooks + a zero-dependency CLI**. It does not route work automatically, enforce phases, or block normal development flow.

- **Six operative skills** (`hero-planning`, `hero-coding`, `hero-reviewing`, `hero-unit-test`, `hero-security`, `hero-strict`) covering the lifecycle of a change, each wrapping proven vendored technique skills instead of duplicating them. Each phase is done on its own — finishing one never auto-triggers the next.
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

Invoke `using-hero` first for an overview — it explains which skill applies next and how workflow state carries across sessions. The six operative skills:

| Skill | Use when | Report (on request via `hero-report`) |
|---|---|---|
| `hero-planning` | Starting new work — a feature, bugfix, or refactor that needs a plan before code changes. | `docs/plans/YYYY-MM-DD-slug.md` — always written; it's the deliverable, not a report |
| `hero-coding` | Implementing an approved plan (or a small change that doesn't need one). | `docs/coding-reports/YYYY-MM-DD-slug.md` |
| `hero-reviewing` | Fresh-eyes check of an implementation against its plan, before merge. | `docs/reviews/YYYY-MM-DD-slug.md` |
| `hero-unit-test` | Verifying implementation correctness — TDD-first or post-implementation. | `docs/test-reports/YYYY-MM-DD-slug.md` |
| `hero-security` | The change touches a sensitive surface (auth, data, secrets, external input, AI/LLM behavior). | Findings appended to the invoking report, if one exists/was requested. |
| `hero-strict` | Extra rigor wanted before a "done" claim — a full verification pass. | Appends to the current report, if one exists/was requested. |

A typical flow is `hero-planning` → `hero-coding` → `hero-unit-test` and/or `hero-reviewing` → (`hero-security` if a sensitive surface was touched) → done. Skip stages that don't fit the size of the change — a one-line typo fix doesn't need a plan artifact. Each phase is "done" on its own terms — there's no automatic full-pipeline run; the developer chooses what to invoke next.

`hero-coding`, `hero-reviewing`, and `hero-unit-test` don't write a report file by default — they end with a concise chat summary. A seventh, on-demand skill, `hero-report`, writes the report file when the user actually wants one, at the path convention the source skill defines.

These skills wrap general-purpose vendored technique skills rather than duplicating them: `brainstorming`, `writing-plans`, `executing-plans`, `test-driven-development`, `systematic-debugging`, `verification-before-completion`, `requesting-code-review`, `receiving-code-review`, `dispatching-parallel-agents`, `subagent-driven-development`, `using-git-worktrees`. `hero-security` is a standalone security review skill rather than a wrapper. All are bundled under `templates/skills/` and installed unconditionally into `.claude/skills/` — every install gets the full suite, with attribution in `templates/skills/NOTICE`.

## Session state

`docs/ACTIVE_STATE.md`'s Active Features table is the single source of durable workflow state — there is no separate session pointer file. Each hero-* skill's Definition of Done includes updating it. The `active-state-bridge` hook injects it into context automatically at the start of a session, so resuming usually needs no extra reading — otherwise, read `docs/ACTIVE_STATE.md` directly.

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
