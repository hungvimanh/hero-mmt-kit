# Contributing to hero-vibe-kit

Thanks for helping improve hero-vibe-kit! It eats its own dog food — contributions follow the English-only workflow template in `templates/docs/AGENCY_WORKFLOW.md`.

## Repo layout
```
bin/        CLI entry (hero-vibe-kit.js)
src/        CLI logic (detect, config, render, merge, init, update, doctor, integrations, links,
            workflow-state, handoff-validate)
templates/  what gets installed into a consumer project
  docs/      English-only framework docs (including ARTIFACTS_AND_STORAGE)
  common/.claude/ hooks + settings.json (Claude Code)
  common/.cursor/ hooks.json (Cursor)
  CURSOR-RULE.mdc.tmpl  always-on Cursor project rule
  skills/         VENDORED core process skills (MIT, from obra/superpowers) + NOTICE
  CLAUDE.md.tmpl AGENTS.md.tmpl
presets/    solo | small-team | enterprise
test/       node:test suites (hooks, workflow-check, handoff-validate, doctor-workflow,
            workflow-state, links, init-smoke, manifest, skills-vendor)
skills.manifest.json  vendored core (process) + referenced design/taste skills
```

## Rules of thumb
- **Zero runtime dependencies.** CLI uses only Node built-ins. Keep it that way.
- **English-only templates.** Framework docs, rules, templates, and vendored skills are authored in English. User-facing chat language is adaptive: answer in the user's language unless they ask otherwise.
- **Placeholders**: use `{{DATE}}` (and profile vars like `{{ASSISTANCE_PROFILE}}`) for values rendered at init. Use `<TBD>` for values the *user* fills later (e.g. stack commands).
- **Managed regions**: never instruct users to hand-edit inside `<!-- hero-vibe-kit:start/end -->`.
- **Skills.** Only the curated MIT-licensed core process skills are vendored under `templates/skills/` (with `NOTICE` attribution); they install into a consumer's `.claude/skills/`. Reference everything else (design/taste, GitNexus, Serena) in `skills.manifest.json` and install via their CLI — don't redistribute non-permissive or unattributed skills/tools.
- **Hooks must stay portable** (Node, cross-platform) and fail-safe (never block on parse errors).

## Before opening a PR
```bash
npm test          # hooks + handoff-validate + doctor-workflow + workflow-state + link integrity + init/brownfield smoke
node bin/hero-vibe-kit.js init --dir /tmp/x --yes --ide claude-code && node bin/hero-vibe-kit.js doctor --dir /tmp/x
# For CI: add --strict to catch compliance gaps
node bin/hero-vibe-kit.js doctor --dir /tmp/x --strict
```
- Add a `CHANGELOG.md` entry under *Unreleased*.
- Keep PRs scoped (see the task router); use Conventional Commits.

## Releasing
Bump `package.json` version (SemVer), move the CHANGELOG *Unreleased* section under the new version, tag, publish.
