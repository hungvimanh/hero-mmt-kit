# hero-vibe-kit

> An adaptive, AI-assisted software-development workflow for **Claude Code** and **Cursor** — profile-aware routing, real approval gates, pragmatic verification, harness & loop enforcement, selected process skills, and security/performance standards for new and brownfield projects.

## What it is

`hero-vibe-kit` installs a lightweight but disciplined development process into your repository so Claude Code, Cursor, and compatible agents can work like a pragmatic software team:

- **Profile-aware workflow** — choose `vibecode` for high-agency AI execution or `coding-assistant` for developer-led collaboration.
- **Project surfaces** — tune the workflow for `fullstack`, `backend`, or `frontend` projects.
- **Verification levels** — choose `strict`, `pragmatic`, or `minimal` evidence requirements without changing the project structure.
- **Task router** — classify each request (Q&A, chore, bugfix, hotfix, change, refactor, feature, spike, UI/UX) and use the smallest path that fits.
- **Real gates** — approval gates use Claude Code Plan Mode, not prose promises.
- **Adaptive sub-agents** — sub-agents and reviews are escalation tools. Normal Coding Assistant work stays lean; high-risk, broad, or sensitive work gets targeted review.
- **Enforcement hooks** — `git-guard` blocks unsafe git operations; `stop-reminder` nudges state updates; `workflow-check` gates commits on Standard/Full paths behind a session checkpoint.
- **Loop engineering** — `phase-handoff` skill checkpoints `session.json` at every real phase boundary; `doctor --strict` escalates compliance gaps to CI failures.
- **Selected bundled skills** — `init` installs only the vendored process skills needed for the active profile/surface/verification.
- **Standards** — Definition of Done, branching model, communication protocol, artifact storage, security, performance, and AI-feature templates.

It is **documentation + hooks + a zero-dependency CLI**. Optional third-party tools are referenced or installed from their original sources; they are not redistributed.

## Quick start

```bash
# In your project root (new or existing):
npx hero-vibe-kit init

# For existing codebases, create the first AI discovery map:
npx hero-vibe-kit discover

# Then restart Claude Code (or run /hooks) to activate hooks, and:
npx hero-vibe-kit doctor
```

Non-interactive / CI example:

```bash
npx hero-vibe-kit init --yes --preset small-team --profile coding-assistant --surface fullstack --verify pragmatic --ide cursor --skip-integrations
```

## What `init` installs

```text
your-project/
  CLAUDE.md          # hero-vibe-kit managed block; your other content is preserved
  AGENTS.md          # cross-agent entry pointer
  docs/              # English-only workflow docs: AGENCY_WORKFLOW, ASSISTANCE_PROFILES,
                     # CONTEXT_BUDGET, PHASE_HANDOFF_PROTOCOL, HANDOFF_TEMPLATES,
                     # ARTIFACTS_AND_STORAGE, DEFINITION_OF_DONE, BRANCHING,
                     # TEAM_ROSTER, ACTIVE_STATE, COMMUNICATION_PROTOCOL,
                     # INTERACTION_PATTERNS, SECURITY_STANDARDS,
                     # PERFORMANCE_STANDARDS, DESIGN_STANDARDS,
                     # templates/PRD_AI_FEATURE, templates/DESIGN_BRIEF;
                     # later specs/, plans/, reports/ as needed
  .claude/
    settings.json    # hooks merged into existing settings, not clobbered
    hooks/           # git-guard.cjs, stop-reminder.cjs, workflow-check.cjs
    skills/          # selected bundled process skills for the active profile/surface
  .cursor/
    hooks.json       # beforeShellExecution + stop hooks for Cursor
    hooks/           # git-guard.cjs, stop-reminder.cjs, workflow-check.cjs (shared logic)
    rules/           # hero-vibe-kit.mdc always-on workflow rule
    skills/          # same selected bundled process skills as .claude/skills/
  .hero-vibe-kit/
    config.json      # preset, branching, profile, surface, verification, integrations
    session.json     # live workflow pointer: path/phase/gates/resumePath (written by phase-handoff)
```

- **New project:** scaffolds the workflow from scratch.
- **Brownfield project:** preserves existing `CLAUDE.md`, `AGENTS.md`, and `.claude/settings.json`; inserts managed blocks and deep-merges hooks. `docs/ACTIVE_STATE.md` is never overwritten.
- **English-only framework docs:** installed docs and templates are English-only for consistency and token efficiency. Agents still respond in the user's chat language unless asked otherwise.
- **Idempotent updates:** re-running `init`/`update` refreshes framework-managed regions and backs up touched files to `*.bak` when needed.

## Operating profiles

`init` records the active operating profile in `.hero-vibe-kit/config.json` and renders it into the installed docs.

| Setting | Values | Purpose |
|---|---|---|
| Assistance profile | `vibecode`, `coding-assistant` | Chooses high-agency AI execution vs developer-led collaboration. |
| Project surface | `fullstack`, `backend`, `frontend` | Tunes routing, checks, and selected skills to the project shape. |
| Verification level | `strict`, `pragmatic`, `minimal` | Controls evidence requirements without encouraging false completion claims. |
| IDE target | `claude-code`, `cursor`, `both` | Chooses which assistant surfaces to install (interactive prompt if omitted). |

Defaults for `--yes` (with required `--ide`):

```text
profile: coding-assistant
surface: fullstack
verify : pragmatic
ide    : (required — pass --ide claude-code | cursor | both)
```

### Vibecode

Use when the user wants the AI to own technical execution end-to-end. Vibecode installs the full bundled process suite and uses sub-agents/review when risk, scope, or parallel work justifies them.

### Coding Assistant

Use when the user is a developer who wants Claude to code and verify pragmatically while the developer remains the final review gate. Normal tasks should stay lean:

1. understand the request,
2. make a short plan only when useful,
3. implement directly when the scope is clear,
4. run targeted checks,
5. report what was verified, what was not verified, and what needs developer review.

## Adaptive review and sub-agent policy

Sub-agents are no longer default ceremony. The workflow uses the smallest review budget that supports the completion claim:

| Review budget | Use when |
|---|---|
| None | Low-risk, localized work with credible targeted checks. |
| Single combined review | Medium-risk changes where one reviewer can catch requirement, correctness, test, docs, or overengineering issues. |
| Targeted specialist review | Security, performance, API/data, UI/accessibility, migration, or other specific risk. |
| Full multi-stage review | HIGH/CRITICAL, broad multi-area work, or explicit user request for full process. |

Do not run spec review, quality review, and final review over the same scope unless each pass has a distinct purpose. Final integration review is for multiple independent task streams, high-risk/core changes, or narrow prior reviews.

## Selected bundled process skills

Core process skills are bundled under `templates/skills/` as a curated MIT-licensed copy of `obra/superpowers` with attribution in `templates/skills/NOTICE`.

`init` selects bundled skills from the active config:

| Active config | Installed skills |
|---|---|
| All profiles | Baseline process skills: superpowers, brainstorming, planning, executing plans, debugging, verification, phase handoff. |
| `verify: strict` | Adds TDD and code-review helper skills. |
| `surface: fullstack` | Adds delegation helpers for cross-layer coordination. |
| `profile: vibecode` | Installs the full bundled process suite. |

`update` refreshes selected framework-managed skills and preserves existing unselected or user-added skill directories. To shrink an older project initialized before selective installation, manually delete unwanted skill directories after review.

## Task router

| Task | Path | Gate | Typical branch |
|---|---|---|---|
| Q&A / explain / find code | Read-only | No | — |
| chore / docs / config | Fast | No | `chore/`, `docs/` |
| small localized bugfix | Fast | No, but repro test expected | `fix/` |
| hotfix | Fast expedited | No | `hotfix/` |
| change existing logic | Standard | Yes | `change/` |
| refactor | Standard | Yes | `refactor/` |
| new feature | Full | Yes, usually two gates | `feat/` |
| spike / research | Timeboxed | No | `spike/` |
| UI/UX design or redesign | Standard | Yes | `design/` |

Full details live in `docs/AGENCY_WORKFLOW.md`, the single source of truth for routing, gates, phase handoff, and review budgets.

## Harness & loop (v2.0)

v2.0.0 adds an observable compliance layer: session state, loop-safe phase handoff, and commit enforcement.

### Session state

`phase-handoff` writes `.hero-vibe-kit/session.json` at every real phase boundary. It contains the current path, phase, gate status, review budget, resume path, and next action. Resume read order (≈200 tokens):

1. `.hero-vibe-kit/session.json` — get `workItem` / `phase` / `resumePath` / `nextAction`
2. the file `resumePath` names — one focused resume artifact
3. the latest handoff only if the resume artifact is insufficient

Read `ACTIVE_STATE.md` only when switching work items or when the session is blank/stale.

### Commit gate

`workflow-check.cjs` (PreToolUse hook) blocks `git commit` on Standard/Full paths unless the staged changes include a state checkpoint (session update, ACTIVE_STATE update, or a report artifact). Lean paths (read-only, fast, tiny, small) are always exempt. Override: `HVK_SKIP_STATE_GATE=1`.

### Doctor compliance

```bash
npx hero-vibe-kit doctor          # reports session validity, drift, bloat
npx hero-vibe-kit doctor --strict # exit 1 on any compliance failure (CI-safe)
```

`--strict` escalates compliance warnings to failures. Tool-presence warnings (GitNexus, Serena absent) are always soft and never cause strict failure.

## Optional integrations

| Tool | What it is | What init does | Tier |
|---|---|---|---|
| Core process skills | Bundled process skills from `obra/superpowers` (MIT) | Installs selected skills into `.claude/skills/` | Recommended |
| taste-skill | UI/design skills from `Leonxlnx/taste-skill` | Auto-installed for `vibecode` profile or `frontend`/`fullstack` surface; skipped for `backend` + `coding-assistant` | Auto (no prompt) |
| GitNexus | Code-intelligence CLI/MCP | Auto-runs `npx gitnexus analyze` only if this repo already has a `.gitnexus/` index; otherwise skipped | Auto (no prompt) |
| Serena | Semantic code-intelligence MCP | Auto-seeds pointer notes only if `.serena/` already exists; otherwise skipped | Auto (no prompt) |

Required: Node.js 18+ and Claude Code **or** Cursor. Everything else is optional.

## Commands

| Command | Purpose |
|---|---|
| `init` | Install the workflow into the current project. |
| `update` | Re-render managed regions while preserving user edits and working files. |
| `discover` | Scan a brownfield codebase and create `docs/BROWNFIELD_DISCOVERY.md`. |
| `brownfield` | Alias for `discover`. |
| `doctor` | Validate hooks, settings, session state, doc links, and tool presence. `--strict` for CI. |
| `version` | Print the package version. |

Flags:

```text
--dir <path>
--preset solo|small-team|enterprise
--profile vibecode|coding-assistant
--surface fullstack|backend|frontend
--verify strict|pragmatic|minimal
--ide claude-code|cursor|both
--yes
--skip-integrations
--strict      (doctor only) treat compliance warnings as failures — for CI use
```

## Update and customize

- Edit anything outside `<!-- hero-vibe-kit:start/end -->` markers freely; `update` will not touch it.
- Fill `<TBD>` placeholders in Definition of Done, Security, Performance, and design docs once the stack is known.
- Run `npx hero-vibe-kit update` to refresh framework-managed docs/hooks to the latest version.
- Never hand-edit inside managed regions; change the source template or use `update`.

## Uninstall

Remove:

- framework docs under `docs/`,
- `.claude/hooks/*` and the hook block in `.claude/settings.json` (if used),
- `.cursor/hooks/*`, `.cursor/hooks.json`, and `.cursor/rules/hero-vibe-kit.mdc` (if used),
- the managed blocks in `CLAUDE.md` and `AGENTS.md`,
- `.hero-vibe-kit/`,
- bundled skills under `.claude/skills/` and `.cursor/skills/` that you no longer want.

Review before deleting skill directories because some may be user-added or intentionally retained.

## License and attribution

MIT (see `LICENSE`). hero-vibe-kit vendors a curated, lightly trimmed copy of the core process skills from [`obra/superpowers`](https://github.com/obra/superpowers) under `templates/skills/` with attribution in `templates/skills/NOTICE`.

Design/UI skills from [`Leonxlnx/taste-skill`](https://github.com/Leonxlnx/taste-skill) are **not** redistributed; they are installed from source via the `skills` CLI under their own license when the user opts in.
