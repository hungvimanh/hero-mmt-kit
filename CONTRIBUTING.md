# Contributing to hero-mmt-kit

Thanks for helping improve hero-mmt-kit! This repo hosts two related but independently-versioned products on different branches: `hero-vibe-kit` (AI-led agency workflow) and `hero-mmt-kit` (human-led Claude Code coding assistant — this branch). Contributions to this branch should stay scoped to hero-mmt-kit; it does not share a migration path or cherry-picks with hero-vibe-kit.

## Repo layout
```
bin/        CLI entry (hero-mmt-kit.js)
src/        CLI logic (detect, discover, profile-config, render, merge, init, update, doctor,
            integrations, links, workflow-state, skills, util)
templates/  what gets installed into a consumer project
  docs/      English-only framework docs (ACTIVE_STATE, BROWNFIELD_DISCOVERY, SECURITY_STANDARDS,
             DESIGN_STANDARDS, PERFORMANCE_STANDARDS, INTERACTION_PATTERNS)
    templates/  PRD_AI_FEATURE.md, DESIGN_BRIEF.md
  common/.claude/ hooks (git-guard, session-bridge, stop-reminder) + settings.json (Claude Code only)
  skills/         VENDORED core process skills (MIT, from obra/superpowers) + hero-mmt-kit-authored
                  skills (`using-hero`, `hero-planning`, `hero-coding`, `hero-reviewing`,
                  `hero-unit-test`, `hero-security`, `hero-strict`, `security-review`) + NOTICE
  CLAUDE.md.tmpl AGENTS.md.tmpl
presets/    solo | small-team | enterprise (sets enforceLevel only)
test/       node:test suites (hooks, doctor-workflow, workflow-state, links, init-smoke, manifest,
            skills-vendor, skills-selection, profile-config, integrations, discover)
skills.manifest.json  vendored core (process) skills + referenced design/taste skills
```

## Rules of thumb
- **Zero runtime dependencies.** CLI uses only Node built-ins. Keep it that way.
- **English-only templates.** Framework docs, rules, templates, and vendored skills are authored in English. User-facing chat language is adaptive: answer in the user's language unless they ask otherwise.
- **Placeholders**: use `{{DATE}}` for values rendered at init. Use `<TBD>` for values the *user* fills later (e.g. stack commands).
- **Managed regions**: never instruct users to hand-edit inside `<!-- hero-mmt-kit:start/end -->`.
- **Skills.** Only the curated MIT-licensed core process skills (plus the hero-mmt-kit-authored `hero-*`/`using-hero`/`security-review` skills) are vendored under `templates/skills/` (with `NOTICE` attribution); they install into a consumer's `.claude/skills/`. Reference everything else (design/taste, GitNexus, Serena) in `skills.manifest.json` and install via their CLI — don't redistribute non-permissive or unattributed skills/tools.
- **Hooks must stay portable** (Node, cross-platform) and fail-safe (never block on parse errors). There are only three: `git-guard.cjs`, `session-bridge.cjs`, `stop-reminder.cjs` — all soft/non-blocking, no hard gates.

## Before opening a PR
```bash
npm test          # hooks + doctor-workflow + workflow-state + links + init-smoke + manifest +
                   # skills-vendor + skills-selection + profile-config + integrations + discover
node bin/hero-mmt-kit.js init --dir /tmp/x --yes --skip-integrations && node bin/hero-mmt-kit.js doctor --dir /tmp/x
# For CI: add --strict to catch compliance gaps
node bin/hero-mmt-kit.js doctor --dir /tmp/x --strict
```
- Add a `CHANGELOG.md` entry under *Unreleased* (or the current top version block if one is already open — check the top of `CHANGELOG.md` before adding a new heading).
- Keep PRs scoped; use Conventional Commits.

## Releasing
Bump `package.json` version (SemVer), move the CHANGELOG *Unreleased* section under the new version, tag, publish.
