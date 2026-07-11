# CLAUDE.md — hero-mmt-kit (framework repo)

This repository/branch **is** the hero-mmt-kit framework — not a consumer project. (It dogfoods its own workflow.) hero-mmt-kit is a hard fork of hero-vibe-kit: hero-vibe-kit is the AI-led agency workflow kit; hero-mmt-kit is the human-led, Claude-Code-only coding assistant kit. No shared migration path — don't cherry-pick between the two.

- **Contributor guide:** [CONTRIBUTING.md](CONTRIBUTING.md)
- **Workflow skill sources:** `templates/skills/using-hero/SKILL.md` (overview) and the 6 operative `hero-*` skills; consumer projects receive the same skills installed into `.claude/skills/`.
- **CLI:** `bin/hero-mmt-kit.js` · logic in `src/` · what gets installed into a consumer lives in `templates/`
- **Tests:** `npm test` (hook self-tests + doc-link integrity + init/brownfield smoke)

## House rules
- **Zero runtime dependencies** — CLI uses only Node built-ins.
- **English-only templates** — framework instructions, skills, rules, and templates live in English. Assistants should reply in the user's chat language unless asked otherwise.
- **Placeholders**: `{{...}}` are rendered at init; `<TBD>` are for the end user to fill.
- Never instruct users to hand-edit inside `<!-- hero-mmt-kit:start/end -->` managed regions.
- **Vendored skills**: only the curated MIT-licensed core process skills live under `templates/skills/` (with `NOTICE` attribution); they ship in the package and install into a consumer's `.claude/skills/`. Reference everything else (design/taste, GitNexus, Serena) in `skills.manifest.json` — do not redistribute non-permissive or unattributed third-party skills/tools.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **hero-vibe-kit** (2069 symbols, 2447 relationships, 19 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/hero-vibe-kit/context` | Codebase overview, check index freshness |
| `gitnexus://repo/hero-vibe-kit/clusters` | All functional areas |
| `gitnexus://repo/hero-vibe-kit/processes` | All execution flows |
| `gitnexus://repo/hero-vibe-kit/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
