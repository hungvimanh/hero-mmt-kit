# AGENTS.md — hero-vibe-kit (framework repo)

This repository is the hero-vibe-kit framework itself. Any agent working here:

- Read [CONTRIBUTING.md](CONTRIBUTING.md) and [CLAUDE.md](CLAUDE.md) first.
- Workflow template sources live in `templates/docs/{en,vi}/AGENCY_WORKFLOW.md`; consumer projects receive one active `docs/AGENCY_WORKFLOW.md` for the selected language.
- CLI entry: `bin/hero-vibe-kit.js`; logic in `src/`; installable content in `templates/`.
- Run `npm test` before proposing changes. Keep EN/VI docs in sync. Zero runtime deps.

> Note: the `<!-- hero-vibe-kit:start/end -->` managed-block convention and the `git-guard`/`stop-reminder`
> hooks are what this framework installs into *consumer* projects (see `templates/`).
