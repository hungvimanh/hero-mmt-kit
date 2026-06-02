# CLAUDE.md — hero-vibe-kit (framework repo)

This repository **is** the hero-vibe-kit framework — not a consumer project. (It dogfoods its own workflow.)

- **Contributor guide:** [CONTRIBUTING.md](CONTRIBUTING.md)
- **Workflow template sources:** `templates/docs/{en,vi}/AGENCY_WORKFLOW.md`; consumer projects receive one active `docs/AGENCY_WORKFLOW.md` for the selected language.
- **CLI:** `bin/hero-vibe-kit.js` · logic in `src/` · what gets installed into a consumer lives in `templates/`
- **Tests:** `npm test` (hook self-tests + bilingual doc-link integrity + init/brownfield smoke)

## House rules
- **Zero runtime dependencies** — CLI uses only Node built-ins.
- **Bilingual parity** — any change in `templates/docs/en/*` must be mirrored in `templates/docs/vi/*`.
- **Placeholders**: `{{...}}` are rendered at init; `<TBD>` are for the end user to fill.
- Never instruct users to hand-edit inside `<!-- hero-vibe-kit:start/end -->` managed regions.
- Do not redistribute third-party skills/tools — reference them in `skills.manifest.json`.
