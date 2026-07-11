# hero-mmt-kit

> A focused, human-led coding workflow for **Claude Code** — six direct-use skills (planning, coding, reviewing, unit testing, security, strict verification), simple session state, and soft safety hooks. Zero runtime dependencies.

hero-vibe-kit is the AI-led agency workflow kit. hero-mmt-kit is the human-led Claude Code coding assistant kit. This repository hosts both as a hard fork: hero-mmt-kit has its own package, its own version history (starting at 0.1.0), and no shared migration path or cherry-picking between them.

## What it is

`hero-mmt-kit` installs a small, disciplined workflow into your repository. Unlike an AI-led framework, it does not route tasks, gate commits, or enforce phases — the developer decides what to work on and invokes skills directly:

- **Six operative skills** (`hero-planning`, `hero-coding`, `hero-reviewing`, `hero-unit-test`, `hero-security`, `hero-strict`) covering the lifecycle of a change, each wrapping proven vendored technique skills instead of duplicating them.
- **No router, no gates** — there is no task-classification doc and no hard PreToolUse enforcement. `using-hero` is a map, not a controller.
- **Soft hooks only** — `git-guard` blocks a small set of genuinely dangerous git commands and reminds (never blocks) on ordinary commits; `stop-reminder` nudges you to update state when you stop with uncommitted changes; `session-bridge` injects session state into context once per session.
- **Lightweight session state** — `.hero-mmt-kit/session.json` is a small resume pointer (`currentSkill`, `lastCheckpoint`, `resumePath`, `nextAction`), not a workflow engine.
- **Full skill suite, every install** — the bundled process skills install unconditionally; there's no profile/surface logic deciding what you get.
- **Standards docs** for security, performance, design, and interaction patterns, plus PRD/design-brief templates.

It is **documentation + soft hooks + a zero-dependency CLI**. Optional third-party tools (the taste/design skill) are installed from their original sources, not redistributed.

## Quick start

```bash
# In your project root (new or existing):
npx hero-mmt-kit init

# For existing codebases, create the first discovery map:
npx hero-mmt-kit discover

# Then restart Claude Code (or run /hooks) to activate hooks, and:
npx hero-mmt-kit doctor
```

Non-interactive / CI example:

```bash
npx hero-mmt-kit init --dir <tmp> --yes --skip-integrations
# or, opting into the taste/design skill non-interactively:
npx hero-mmt-kit init --dir <tmp> --yes --taste
```

## What `init` installs

```text
your-project/
  CLAUDE.md          # hero-mmt-kit managed block; your other content is preserved
  AGENTS.md          # cross-agent entry pointer
  docs/              # ACTIVE_STATE, BROWNFIELD_DISCOVERY, SECURITY_STANDARDS,
                     # PERFORMANCE_STANDARDS, DESIGN_STANDARDS, INTERACTION_PATTERNS,
                     # templates/PRD_AI_FEATURE, templates/DESIGN_BRIEF
  .claude/
    settings.json    # hooks merged into existing settings, not clobbered
    hooks/           # git-guard.cjs, stop-reminder.cjs, session-bridge.cjs
    skills/          # full bundled skill suite (see below)
  .hero-mmt-kit/
    config.json      # { installTasteSkill, enforceLevel, version, brownfield, integrations }
    session.json     # resume pointer: currentSkill/lastCheckpoint/resumePath/nextAction
```

- **New project:** scaffolds the workflow from scratch.
- **Brownfield project:** preserves existing `CLAUDE.md`, `AGENTS.md`, and `.claude/settings.json`; inserts managed blocks (`<!-- hero-mmt-kit:start/end -->`) and deep-merges hooks. `docs/ACTIVE_STATE.md` is never overwritten.
- **English-only framework docs:** installed docs and templates are English-only for consistency and token efficiency. Claude still replies in the user's chat language unless asked otherwise.
- **Idempotent updates:** re-running `init`/`update` refreshes framework-managed regions and backs up touched files to `*.bak` when needed.
- **One interactive question:** `init` asks "Install the taste/design skill?" (default No). `--yes` accepts the default; `--taste` opts in without prompting.

## Workflow skills

Invoke `using-hero` first for an overview — it explains which skill applies next and how session state carries across sessions. The six operative skills:

| Skill | Use when | Output artifact |
|---|---|---|
| `hero-planning` | Starting new work — a feature, bugfix, or refactor that needs a plan before code changes. | `docs/plans/YYYY-MM-DD-slug.md` |
| `hero-coding` | Implementing an approved plan (or a small change that doesn't need one). | `docs/coding-reports/YYYY-MM-DD-slug.md` |
| `hero-reviewing` | Fresh-eyes check of an implementation against its plan, before merge. | `docs/reviews/YYYY-MM-DD-slug.md` |
| `hero-unit-test` | Verifying implementation correctness — TDD-first or post-implementation. | `docs/test-reports/YYYY-MM-DD-slug.md` |
| `hero-security` | The change touches a sensitive surface (auth, data, secrets, external input, AI/LLM behavior). | Findings recorded in the invoking report. |
| `hero-strict` | Extra rigor wanted before a "done" claim — a full verification pass. | Appends to the current report. |

A typical flow is `hero-planning` → `hero-coding` → `hero-unit-test` and/or `hero-reviewing` → (`hero-security` if a sensitive surface was touched) → done. Skip stages that don't fit the size of the change — a one-line typo fix doesn't need a plan artifact.

These six skills wrap general-purpose vendored technique skills rather than duplicating them: `brainstorming`, `writing-plans`, `executing-plans`, `test-driven-development`, `systematic-debugging`, `verification-before-completion`, `requesting-code-review`, `receiving-code-review`, `dispatching-parallel-agents`, `subagent-driven-development`, `using-git-worktrees`, `finishing-a-development-branch`, plus a hero-mmt-kit-authored `security-review` skill. All are bundled under `templates/skills/` and installed unconditionally into `.claude/skills/` — every install gets the full suite, with attribution in `templates/skills/NOTICE`.

## Session state

`.hero-mmt-kit/session.json` is a small resume pointer, not a workflow engine. Each hero-* skill's Definition of Done includes writing it plus updating `docs/ACTIVE_STATE.md`.

Resuming work in a fresh session:

1. Read `.hero-mmt-kit/session.json` (~100 tokens) → `currentSkill`, `resumePath`, `nextAction`.
2. Read the artifact at `resumePath` for concrete next steps.
3. If `session.json` is blank/stale, read `docs/ACTIVE_STATE.md`'s Active Features table instead.

## Commands

| Command | Purpose |
|---|---|
| `init` | Install the workflow into the current project. |
| `update` | Re-render managed regions while preserving user edits and working files. |
| `discover` | Scan a brownfield codebase and create `docs/BROWNFIELD_DISCOVERY.md`. |
| `brownfield` | Alias for `discover`. |
| `doctor` | Validate hooks, settings, session state, doc links, and tool presence. `--strict` for CI. |
| `version` | Print the package version. |
| `help` | Show usage. |

Flags:

```text
--dir <path>          Target project dir (default: current dir)
--taste                Install the taste/design skill (default: off)
--preset <name>        Load a bundled preset (enterprise | small-team | solo) — sets enforceLevel only
--yes                  Non-interactive; accept defaults
--skip-integrations    Skip design-skill / GitNexus / Serena integration steps
--strict               (doctor only) treat compliance warnings as failures — for CI use
```

## Optional integrations

Integrations are auto-detected — no prompts beyond the single taste/design question in `init`.

| Tool | What it is | What `init` does |
|---|---|---|
| Taste/design skills | UI/design skills from `Leonxlnx/taste-skill` | Installed from source via the `skills` CLI only if you opted in (`--taste` or the interactive Yes) |
| GitNexus | Code-intelligence CLI/MCP | Auto-runs `npx gitnexus analyze` only if the repo already has a `.gitnexus/` index; otherwise skipped |
| Serena | Semantic code-intelligence MCP | Auto-seeds pointer notes only if `.serena/` already exists; otherwise skipped |

Required: Node.js 18+ and Claude Code. Everything else is optional.

## Update and customize

- Edit anything outside `<!-- hero-mmt-kit:start/end -->` markers freely; `update` will not touch it.
- Fill `<TBD>` placeholders in Security, Performance, and Design docs once the stack is known.
- Run `npx hero-mmt-kit update` to refresh framework-managed docs/hooks to the latest version.
- Never hand-edit inside managed regions; change the source template or use `update`.

## Uninstall

Remove:

- framework docs under `docs/`,
- `.claude/hooks/*` and the hook block in `.claude/settings.json`,
- the managed blocks in `CLAUDE.md` and `AGENTS.md`,
- `.hero-mmt-kit/`,
- bundled skills under `.claude/skills/` that you no longer want.

Review before deleting skill directories because some may be user-added or intentionally retained.

## License and attribution

MIT (see `LICENSE`). hero-mmt-kit vendors a curated, lightly trimmed copy of core process skills from [`obra/superpowers`](https://github.com/obra/superpowers) under `templates/skills/` with attribution in `templates/skills/NOTICE`.

Design/UI skills from [`Leonxlnx/taste-skill`](https://github.com/Leonxlnx/taste-skill) are **not** redistributed; they are installed from source via the `skills` CLI under their own license only when the user opts into the taste/design skill.
