# Brownfield Discovery

Use this when the project already has code and may have partial, outdated, or non-standard documentation.

## When to run

For an existing project that has never used hero-vibe-kit:

```bash
npx hero-vibe-kit init
npx hero-vibe-kit discover
npx hero-vibe-kit doctor
```

`init` installs the workflow. `discover` scans the current repo and creates `docs/BROWNFIELD_DISCOVERY.md` with the first evidence map.

## What the AI must do after `discover`

1. Read `docs/BROWNFIELD_DISCOVERY.md` first.
2. Read every documentation source listed there, even when it is outside `docs/`.
3. Read config files to identify the stack, entry points, commands, environment requirements, and CI signals.
4. Inspect likely code areas and map the main modules, screens/routes, API handlers, data layer, integrations, and tests.
5. Record findings with certainty labels:
   - **Found** — directly observed in files.
   - **Likely** — inferred from names/structure, not yet proven.
   - **Needs confirmation** — requires the human or missing business context.

## What not to assume

- Do not assume docs live in `docs/`.
- Do not assume missing docs mean missing behavior.
- Do not assume a folder name proves its role before reading files.
- Do not claim a command passes until it has been run.

## Output expected from the first AI pass

After reading the repo, update the discovery report or create a report under `docs/reports/` with:

- project purpose,
- main user roles,
- important flows,
- code structure,
- available verification commands,
- risky/unknown areas,
- open questions for the human.
