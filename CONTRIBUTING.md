# Contributing to hero-vibe-kit

Thanks for helping improve hero-vibe-kit! It eats its own dog food — contributions follow the workflow in `templates/docs/en/AGENCY_WORKFLOW.md`.

## Repo layout
```
bin/        CLI entry (hero-vibe-kit.js)
src/        CLI logic (detect, config, render, merge, init, update, doctor, integrations, links)
templates/  what gets installed into a consumer project
  docs/{en,vi}/   bilingual docs (keep BOTH in sync)
  common/.claude/ hooks + settings.json
  CLAUDE.md.tmpl AGENTS.md.tmpl
presets/    solo | small-team | enterprise
test/       node:test suites (hooks, links, init-smoke)
skills.manifest.json  referenced (not bundled) skills
```

## Rules of thumb
- **Zero runtime dependencies.** CLI uses only Node built-ins. Keep it that way.
- **Bilingual parity.** Any change to `templates/docs/en/*` must be mirrored in `templates/docs/vi/*` (same files, same structure, same internal links). `npm test` checks link integrity for both.
- **Placeholders**: use `{{PROJECT_NAME}}`, `{{DATE}}`, `{{TEAM_SIZE}}`, `{{BRANCHING_MODEL}}` for values rendered at init. Use `<TBD>` for values the *user* fills later (e.g. stack commands).
- **Managed regions**: never instruct users to hand-edit inside `<!-- hero-vibe-kit:start/end -->`.
- **Don't redistribute third-party skills/tools.** Reference them in `skills.manifest.json` and install via their CLI.
- **Hooks must stay portable** (Node, cross-platform) and fail-safe (never block on parse errors).

## Before opening a PR
```bash
npm test          # hooks self-tests + bilingual link integrity + init/brownfield smoke
node bin/hero-vibe-kit.js init --dir /tmp/x --yes && node bin/hero-vibe-kit.js doctor --dir /tmp/x
```
- Add a `CHANGELOG.md` entry under *Unreleased*.
- Keep PRs scoped (see the task router); use Conventional Commits.

## Releasing
Bump `package.json` version (SemVer), move the CHANGELOG *Unreleased* section under the new version, tag, publish.
