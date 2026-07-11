# hero-mmt-kit

> A focused, human-led coding workflow for **Claude Code** — six operative skills, one overview skill, simple session state, and soft safety hooks. Zero runtime dependencies.

`hero-mmt-kit` installs a lightweight Claude Code workflow into new or existing repositories. It is designed for developers who stay in control: you choose the task, invoke the relevant skill, and keep the final judgment on plans, code, tests, reviews, and security checks.

## What it is

`hero-mmt-kit` is **documentation + direct-use skills + soft hooks + a zero-dependency CLI**. It does not route work automatically, enforce phases, or block normal development flow.

- **Seven installed workflow skills** — `using-hero` for orientation, plus six operative skills: `hero-planning`, `hero-coding`, `hero-reviewing`, `hero-unit-test`, `hero-security`, and `hero-strict`.
- **Human-led by default** — the developer decides what to work on and which skill to run next.
- **No router, no hard gates** — `using-hero` is a map, not a controller. There is no task-classification engine and no hard PreToolUse workflow enforcement.
- **Soft hooks only** — `git-guard` blocks a small set of genuinely dangerous git commands and reminds on ordinary commits; `stop-reminder` nudges you to update state when stopping with uncommitted changes; `session-bridge` injects session state once per Claude Code session.
- **Lightweight session state** — `.hero-mmt-kit/session.json` is a small resume pointer (`currentSkill`, `lastCheckpoint`, `resumePath`, `nextAction`), not a workflow engine.
- **Full skill suite, every install** — bundled process skills install unconditionally; there is no profile or surface logic deciding which core skills you get.
- **English-only framework templates** — installed framework docs and templates are in English for consistency and token efficiency. Claude can still respond in the user's chat language.

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
    hooks/           # git-guard.cjs, stop-reminder.cjs, session-bridge.cjs
    skills/          # full bundled skill suite
  .hero-mmt-kit/
    config.json      # installTasteSkill, enforceLevel, version, brownfield, integrations
    session.json     # resume pointer: currentSkill/lastCheckpoint/resumePath/nextAction
```

- **New project:** scaffolds the workflow from scratch.
- **Brownfield project:** preserves existing `CLAUDE.md`, `AGENTS.md`, and `.claude/settings.json`; inserts managed blocks (`<!-- hero-mmt-kit:start/end -->`) and deep-merges hooks. `docs/ACTIVE_STATE.md` is never overwritten.
- **Idempotent updates:** re-running `init` or `update` refreshes framework-managed regions and backs up touched files to `*.bak` when needed.
- **One interactive question:** `init` asks whether to install the optional taste/design skill (default No). `--yes` accepts the default; `--taste` opts in without prompting.

## Workflow skills

Start with `using-hero` when you want the map. It explains the available skills, when each one fits, and how session state carries across Claude Code sessions.

| Skill | Use when | Output artifact |
|---|---|---|
| `using-hero` | You need the workflow map or are unsure which skill to invoke next. | No required artifact. |
| `hero-planning` | Starting a feature, bugfix, or refactor that needs a plan before code changes. | `docs/plans/YYYY-MM-DD-slug.md` |
| `hero-coding` | Implementing an approved plan or a small change that does not need a plan. | `docs/coding-reports/YYYY-MM-DD-slug.md` |
| `hero-reviewing` | Performing a fresh-eyes check of an implementation against its plan before merge. | `docs/reviews/YYYY-MM-DD-slug.md` |
| `hero-unit-test` | Verifying implementation correctness, either TDD-first or after implementation. | `docs/test-reports/YYYY-MM-DD-slug.md` |
| `hero-security` | You want an independent OWASP + AI/LLM security review of auth, data, secrets, external input, AI/LLM behavior, or another sensitive surface. | `docs/security-reports/YYYY-MM-DD-slug.md` |
| `hero-strict` | You want extra rigor before claiming the work is done. | Appends to the current report. |

A typical flow is:

```text
hero-planning → hero-coding → hero-unit-test and/or hero-reviewing → done

hero-security when you want a separate security pass → hero-strict if extra rigor is wanted
```

Skip stages that do not fit the size or risk of the change. A one-line typo fix does not need a plan artifact.

The operative skills wrap proven technique skills instead of duplicating their content: `brainstorming`, `writing-plans`, `executing-plans`, `test-driven-development`, `systematic-debugging`, `verification-before-completion`, `requesting-code-review`, `receiving-code-review`, `dispatching-parallel-agents`, `subagent-driven-development`, `using-git-worktrees`, and `finishing-a-development-branch`. `hero-security` is the standalone framework-authored security review skill. These are bundled under `templates/skills/` and installed unconditionally into `.claude/skills/`, with attribution in `templates/skills/NOTICE`.

## Session state

`.hero-mmt-kit/session.json` is a compact resume pointer. Each hero-* skill's Definition of Done includes updating it and `docs/ACTIVE_STATE.md` when there is meaningful state to carry forward.

Resuming work in a fresh session:

1. Read `.hero-mmt-kit/session.json` for `currentSkill`, `resumePath`, and `nextAction`.
2. Read the artifact at `resumePath` for concrete next steps.
3. If `session.json` is blank or stale, read `docs/ACTIVE_STATE.md`'s Active Features table.

## Commands

| Command | Purpose |
|---|---|
| `init` | Install the workflow into the current project. |
| `update` | Re-render managed regions while preserving user edits and working files. |
| `discover` | Scan a brownfield codebase and create `docs/BROWNFIELD_DISCOVERY.md`. |
| `brownfield` | Alias for `discover`. |
| `doctor` | Validate hooks, settings, session state, doc links, and tool presence. Use `--strict` for CI. |
| `version` | Print the package version. |
| `help` | Show usage. |

Flags:

```text
--dir <path>          Target project dir (default: current dir)
--taste              Install the optional taste/design skill (default: off)
--preset <name>      Load a bundled preset (enterprise | small-team | solo) — sets enforceLevel only
--yes                Non-interactive; accept defaults
--skip-integrations  Skip design-skill / GitNexus / Serena integration steps
--strict             (doctor only) treat compliance warnings as failures — for CI use
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
