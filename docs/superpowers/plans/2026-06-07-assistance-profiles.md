# Assistance Profiles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Step 1 of assistance profiles: project config, CLI flags, generated docs, router/DoD wording, migration defaults, and tests for Vibecode vs Coding Assistant behavior.

**Architecture:** Add a small `src/profile-config.cjs` module that owns profile validation, defaults, and render variables. Wire it into `init` and `update`, then render active profile/surface/verification metadata into managed docs. Keep skill installation unchanged in this plan; profile-specific skill subset installation is a separate follow-up plan.

**Tech Stack:** Node.js CommonJS, Node built-ins only, `node:test`, existing template renderer with `{{PLACEHOLDER}}` substitutions, existing hero-vibe-kit CLI.

---

## File structure

Create:

- `src/profile-config.cjs` — validates `--profile`, `--surface`, `--verify`; applies defaults; builds template variables.
- `test/profile-config.test.cjs` — unit tests for profile defaults, overrides, and invalid values.
- `templates/docs/ASSISTANCE_PROFILES.md` — canonical profile/surface/verification reference rendered into consumer projects.

Modify:

- `bin/hero-vibe-kit.js` — add help text for new flags.
- `src/init.cjs` — collect interactive profile/surface choices, apply flag/default validation, render new vars into docs and managed blocks.
- `src/update.cjs` — backfill missing profile config, accept override flags, render new vars, persist migrated config.
- `templates/CLAUDE.md.tmpl` — show active profile/surface/verification and link profile reference.
- `templates/AGENTS.md.tmpl` — show active profile/surface/verification at the cross-agent entry point.
- `templates/docs/AGENCY_WORKFLOW.md` — add pre-router profile resolution and profile-specific gate/delegation wording.
- `templates/docs/DEFINITION_OF_DONE.md` — add verification levels and profile-specific completion evidence.
- `templates/docs/TEAM_ROSTER.md` — tune sub-agent requirements for Vibecode vs Coding Assistant.
- `README.md` — document new CLI flags and default behavior.
- `test/init-smoke.test.cjs` — add CLI smoke coverage for defaults, flags, invalid values, and update migration.
- `test/links.test.cjs` — assert `ASSISTANCE_PROFILES.md` is linked and link-check passes.

Do not modify in this plan:

- `src/skills.cjs` — selective skill installation is follow-up work.
- `skills.manifest.json` — process group split is follow-up work.

---

### Task 0: Pre-edit impact analysis

**Files:**
- Inspect: `src/init.cjs`
- Inspect: `src/update.cjs`
- Inspect: `src/skills.cjs`
- Inspect: `bin/hero-vibe-kit.js`

- [ ] **Step 1: Run GitNexus impact for `init` before editing**

Use MCP tool:

```text
gitnexus_impact({
  repo: "hero-vibe-kit",
  target: "init",
  file_path: "src/init.cjs",
  kind: "Function",
  direction: "upstream",
  maxDepth: 3
})
```

Expected: report direct callers, affected flows, and risk level in the session before edits. If risk is HIGH or CRITICAL, stop and ask the user before editing.

- [ ] **Step 2: Run GitNexus impact for `update` before editing**

Use MCP tool:

```text
gitnexus_impact({
  repo: "hero-vibe-kit",
  target: "update",
  file_path: "src/update.cjs",
  kind: "Function",
  direction: "upstream",
  maxDepth: 3
})
```

Expected: report direct callers, affected flows, and risk level in the session before edits. If risk is HIGH or CRITICAL, stop and ask the user before editing.

- [ ] **Step 3: Run GitNexus impact for `installSkills` to confirm it stays unchanged**

Use MCP tool:

```text
gitnexus_impact({
  repo: "hero-vibe-kit",
  target: "installSkills",
  file_path: "src/skills.cjs",
  kind: "Function",
  direction: "upstream",
  maxDepth: 3
})
```

Expected: report that this plan intentionally does not modify the symbol. This protects the Step 1 scope boundary.

- [ ] **Step 4: Commit the spec and plan artifacts if the user asked for commits**

If the user asked for commits, run:

```powershell
git add docs/superpowers/specs/2026-06-07-assistance-profiles-design.md docs/superpowers/plans/2026-06-07-assistance-profiles.md
git commit -m @'
docs: specify assistance profiles

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
'@
```

Expected: commit succeeds. If the user did not ask for commits, skip this step and say it was skipped because commits require explicit user request.

---

### Task 1: Write failing profile config tests

**Files:**
- Create: `test/profile-config.test.cjs`
- Modify: `test/init-smoke.test.cjs`

- [ ] **Step 1: Create unit tests for profile config defaults and validation**

Create `test/profile-config.test.cjs` with this complete content:

```js
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const {
  normalizeProfileConfig,
  buildProfileVars,
  defaultVerification,
} = require('../src/profile-config.cjs');

test('profile config defaults to coding assistant fullstack pragmatic', () => {
  const cfg = normalizeProfileConfig({}, {});
  assert.strictEqual(cfg.assistanceProfile, 'coding-assistant');
  assert.strictEqual(cfg.projectSurface, 'fullstack');
  assert.strictEqual(cfg.verificationLevel, 'pragmatic');
});

test('vibecode defaults verification to strict', () => {
  const cfg = normalizeProfileConfig({}, { profile: 'vibecode' });
  assert.strictEqual(cfg.assistanceProfile, 'vibecode');
  assert.strictEqual(cfg.projectSurface, 'fullstack');
  assert.strictEqual(cfg.verificationLevel, 'strict');
  assert.strictEqual(defaultVerification('vibecode'), 'strict');
});

test('explicit verification flag overrides profile default', () => {
  const cfg = normalizeProfileConfig({}, {
    profile: 'vibecode',
    surface: 'backend',
    verify: 'minimal',
  });
  assert.strictEqual(cfg.assistanceProfile, 'vibecode');
  assert.strictEqual(cfg.projectSurface, 'backend');
  assert.strictEqual(cfg.verificationLevel, 'minimal');
});

test('profile flag resets verification when verify flag is absent', () => {
  const cfg = normalizeProfileConfig({
    assistanceProfile: 'coding-assistant',
    projectSurface: 'frontend',
    verificationLevel: 'pragmatic',
  }, {
    profile: 'vibecode',
  });
  assert.strictEqual(cfg.assistanceProfile, 'vibecode');
  assert.strictEqual(cfg.projectSurface, 'frontend');
  assert.strictEqual(cfg.verificationLevel, 'strict');
});

test('existing verification is preserved when profile is not overridden', () => {
  const cfg = normalizeProfileConfig({
    assistanceProfile: 'coding-assistant',
    projectSurface: 'frontend',
    verificationLevel: 'minimal',
  }, {});
  assert.strictEqual(cfg.assistanceProfile, 'coding-assistant');
  assert.strictEqual(cfg.projectSurface, 'frontend');
  assert.strictEqual(cfg.verificationLevel, 'minimal');
});

test('profile render vars are human-readable', () => {
  const vars = buildProfileVars({
    assistanceProfile: 'coding-assistant',
    projectSurface: 'frontend',
    verificationLevel: 'pragmatic',
  });
  assert.strictEqual(vars.ASSISTANCE_PROFILE, 'coding-assistant');
  assert.strictEqual(vars.ASSISTANCE_PROFILE_LABEL, 'Coding Assistant');
  assert.strictEqual(vars.PROJECT_SURFACE, 'frontend');
  assert.strictEqual(vars.PROJECT_SURFACE_LABEL, 'Frontend');
  assert.strictEqual(vars.VERIFICATION_LEVEL, 'pragmatic');
});

test('invalid profile values fail clearly', () => {
  assert.throws(
    () => normalizeProfileConfig({}, { profile: 'autopilot' }),
    /Invalid --profile: autopilot\. Expected one of: vibecode, coding-assistant\./
  );
});

test('invalid surface values fail clearly', () => {
  assert.throws(
    () => normalizeProfileConfig({}, { surface: 'mobile' }),
    /Invalid --surface: mobile\. Expected one of: fullstack, backend, frontend\./
  );
});

test('invalid verification values fail clearly', () => {
  assert.throws(
    () => normalizeProfileConfig({}, { verify: 'exhaustive' }),
    /Invalid --verify: exhaustive\. Expected one of: strict, pragmatic, minimal\./
  );
});
```

- [ ] **Step 2: Run unit tests and verify they fail because module is missing**

Run:

```powershell
npm test -- test/profile-config.test.cjs
```

Expected: FAIL with output containing `Cannot find module '../src/profile-config.cjs'`.

- [ ] **Step 3: Add CLI smoke tests for new flags and migration**

Append these tests to `test/init-smoke.test.cjs` after the existing `brownfield: preserves existing CLAUDE.md and ACTIVE_STATE; idempotent` test:

```js
test('init --yes writes default assistance profile config and docs', () => {
  const dir = mkdir();
  const r = cli(['init', '--dir', dir, '--yes', '--skip-integrations', '--name', 'ProfileDefault']);
  assert.strictEqual(r.status, 0, r.stderr);

  const config = JSON.parse(fs.readFileSync(path.join(dir, '.hero-vibe-kit', 'config.json'), 'utf8'));
  assert.strictEqual(config.assistanceProfile, 'coding-assistant');
  assert.strictEqual(config.projectSurface, 'fullstack');
  assert.strictEqual(config.verificationLevel, 'pragmatic');

  const claude = fs.readFileSync(path.join(dir, 'CLAUDE.md'), 'utf8');
  assert.match(claude, /Active assistance profile: Coding Assistant/);
  assert.match(claude, /Project surface: Fullstack/);
  assert.match(claude, /Verification level: pragmatic/);

  const workflow = fs.readFileSync(path.join(dir, 'docs', 'AGENCY_WORKFLOW.md'), 'utf8');
  assert.match(workflow, /Resolve the active assistance profile/);
  assert.match(workflow, /ASSISTANCE_PROFILES\.md/);

  assert.ok(fs.existsSync(path.join(dir, 'docs', 'ASSISTANCE_PROFILES.md')), 'missing profile reference doc');
});

test('init accepts vibecode backend flags and derives strict verification', () => {
  const dir = mkdir();
  const r = cli(['init', '--dir', dir, '--yes', '--skip-integrations', '--name', 'VibeBackend', '--profile', 'vibecode', '--surface', 'backend']);
  assert.strictEqual(r.status, 0, r.stderr);

  const config = JSON.parse(fs.readFileSync(path.join(dir, '.hero-vibe-kit', 'config.json'), 'utf8'));
  assert.strictEqual(config.assistanceProfile, 'vibecode');
  assert.strictEqual(config.projectSurface, 'backend');
  assert.strictEqual(config.verificationLevel, 'strict');

  const claude = fs.readFileSync(path.join(dir, 'CLAUDE.md'), 'utf8');
  assert.match(claude, /Active assistance profile: Vibecode/);
  assert.match(claude, /Project surface: Backend/);
});

test('init accepts coding assistant frontend minimal verification flags', () => {
  const dir = mkdir();
  const r = cli(['init', '--dir', dir, '--yes', '--skip-integrations', '--name', 'FrontAssist', '--profile', 'coding-assistant', '--surface', 'frontend', '--verify', 'minimal']);
  assert.strictEqual(r.status, 0, r.stderr);

  const config = JSON.parse(fs.readFileSync(path.join(dir, '.hero-vibe-kit', 'config.json'), 'utf8'));
  assert.strictEqual(config.assistanceProfile, 'coding-assistant');
  assert.strictEqual(config.projectSurface, 'frontend');
  assert.strictEqual(config.verificationLevel, 'minimal');
});

test('init rejects invalid profile flags before writing config', () => {
  const dir = mkdir();
  const r = cli(['init', '--dir', dir, '--yes', '--skip-integrations', '--profile', 'autopilot']);
  assert.notStrictEqual(r.status, 0);
  assert.match(r.stderr + r.stdout, /Invalid --profile: autopilot/);
  assert.ok(!fs.existsSync(path.join(dir, '.hero-vibe-kit', 'config.json')), 'config should not be written after invalid flags');
});

test('update backfills profile fields and accepts overrides', () => {
  const dir = mkdir();
  const init = cli(['init', '--dir', dir, '--yes', '--skip-integrations', '--name', 'Migrated']);
  assert.strictEqual(init.status, 0, init.stderr);

  const configPath = path.join(dir, '.hero-vibe-kit', 'config.json');
  const oldConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  delete oldConfig.assistanceProfile;
  delete oldConfig.projectSurface;
  delete oldConfig.verificationLevel;
  fs.writeFileSync(configPath, JSON.stringify(oldConfig, null, 2) + '\n');

  const upd = cli(['update', '--dir', dir, '--profile', 'vibecode', '--surface', 'backend']);
  assert.strictEqual(upd.status, 0, upd.stderr);

  const migrated = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  assert.strictEqual(migrated.assistanceProfile, 'vibecode');
  assert.strictEqual(migrated.projectSurface, 'backend');
  assert.strictEqual(migrated.verificationLevel, 'strict');

  const agents = fs.readFileSync(path.join(dir, 'AGENTS.md'), 'utf8');
  assert.match(agents, /Active assistance profile: Vibecode/);
  assert.match(agents, /Project surface: Backend/);
});
```

- [ ] **Step 4: Run smoke tests and verify they fail for missing behavior**

Run:

```powershell
npm test -- test/init-smoke.test.cjs
```

Expected: FAIL with at least one assertion about missing `assistanceProfile` or missing active profile text.

- [ ] **Step 5: Commit failing tests if the user asked for commits**

If the user asked for commits, run:

```powershell
git add test/profile-config.test.cjs test/init-smoke.test.cjs
git commit -m @'
test: cover assistance profile config

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
'@
```

Expected: commit succeeds. If commits were not requested, skip and state that the failing tests are uncommitted.

---

### Task 2: Implement profile config module and CLI wiring

**Files:**
- Create: `src/profile-config.cjs`
- Modify: `src/init.cjs`
- Modify: `src/update.cjs`
- Modify: `bin/hero-vibe-kit.js`
- Test: `test/profile-config.test.cjs`
- Test: `test/init-smoke.test.cjs`

- [ ] **Step 1: Create the profile config module**

Create `src/profile-config.cjs` with this complete content:

```js
'use strict';

const PROFILES = ['vibecode', 'coding-assistant'];
const SURFACES = ['fullstack', 'backend', 'frontend'];
const VERIFY_LEVELS = ['strict', 'pragmatic', 'minimal'];

const DEFAULTS = {
  assistanceProfile: 'coding-assistant',
  projectSurface: 'fullstack',
};

const PROFILE_LABELS = {
  vibecode: 'Vibecode',
  'coding-assistant': 'Coding Assistant',
};

const SURFACE_LABELS = {
  fullstack: 'Fullstack',
  backend: 'Backend',
  frontend: 'Frontend',
};

function hasFlag(flags, key) {
  return !!flags && Object.prototype.hasOwnProperty.call(flags, key);
}

function flagValue(flags, key) {
  if (!hasFlag(flags, key)) return null;
  const value = flags[key];
  return value === true ? '' : String(value);
}

function validateChoice(flagName, value, allowed) {
  if (!allowed.includes(value)) {
    throw new Error(`Invalid --${flagName}: ${value}. Expected one of: ${allowed.join(', ')}.`);
  }
  return value;
}

function defaultVerification(profile) {
  return profile === 'vibecode' ? 'strict' : 'pragmatic';
}

function normalizeProfileConfig(input, flags) {
  const cfg = Object.assign({}, input || {});
  const profileFlag = flagValue(flags, 'profile');
  const surfaceFlag = flagValue(flags, 'surface');
  const verifyFlag = flagValue(flags, 'verify');

  if (profileFlag !== null) cfg.assistanceProfile = profileFlag;
  if (!cfg.assistanceProfile) cfg.assistanceProfile = DEFAULTS.assistanceProfile;
  cfg.assistanceProfile = validateChoice('profile', String(cfg.assistanceProfile), PROFILES);

  if (surfaceFlag !== null) cfg.projectSurface = surfaceFlag;
  if (!cfg.projectSurface) cfg.projectSurface = DEFAULTS.projectSurface;
  cfg.projectSurface = validateChoice('surface', String(cfg.projectSurface), SURFACES);

  if (verifyFlag !== null) cfg.verificationLevel = verifyFlag;
  else if (!cfg.verificationLevel || profileFlag !== null) cfg.verificationLevel = defaultVerification(cfg.assistanceProfile);
  cfg.verificationLevel = validateChoice('verify', String(cfg.verificationLevel), VERIFY_LEVELS);

  return cfg;
}

async function collectProfileConfig(input, flags, ask, auto) {
  const cfg = Object.assign({}, input || {});
  if (!hasFlag(flags, 'profile') && !cfg.assistanceProfile) {
    cfg.assistanceProfile = auto ? DEFAULTS.assistanceProfile : await ask.choice('Assistance profile:', PROFILES, 1);
  }
  if (!hasFlag(flags, 'surface') && !cfg.projectSurface) {
    cfg.projectSurface = auto ? DEFAULTS.projectSurface : await ask.choice('Project surface:', SURFACES, 0);
  }
  return normalizeProfileConfig(cfg, flags);
}

function buildProfileVars(cfg) {
  return {
    ASSISTANCE_PROFILE: cfg.assistanceProfile,
    ASSISTANCE_PROFILE_LABEL: PROFILE_LABELS[cfg.assistanceProfile] || cfg.assistanceProfile,
    PROJECT_SURFACE: cfg.projectSurface,
    PROJECT_SURFACE_LABEL: SURFACE_LABELS[cfg.projectSurface] || cfg.projectSurface,
    VERIFICATION_LEVEL: cfg.verificationLevel,
  };
}

module.exports = {
  PROFILES,
  SURFACES,
  VERIFY_LEVELS,
  DEFAULTS,
  PROFILE_LABELS,
  SURFACE_LABELS,
  defaultVerification,
  normalizeProfileConfig,
  collectProfileConfig,
  buildProfileVars,
};
```

- [ ] **Step 2: Run profile config unit tests and verify they pass**

Run:

```powershell
npm test -- test/profile-config.test.cjs
```

Expected: PASS for all tests in `test/profile-config.test.cjs`.

- [ ] **Step 3: Wire profile config into `src/init.cjs`**

Modify `src/init.cjs`:

1. Add this require after existing requires:

```js
const { collectProfileConfig, buildProfileVars } = require('./profile-config.cjs');
```

2. Replace this config block:

```js
  cfg.projectName = flags.name || cfg.projectName || (auto ? path.basename(target) : await ask.text('Project name', path.basename(target)));
  if (!cfg.teamSize) cfg.teamSize = auto ? 'small-team' : await ask.choice('Team size:', ['solo', 'small-team', 'enterprise'], 1);
  if (!cfg.branchingModel) cfg.branchingModel = auto ? 'github-flow' : await ask.choice('Branching model:', ['github-flow', 'gitlab-flow', 'trunk'], 0);
  if (!cfg.enforceLevel) cfg.enforceLevel = 'mixed';
  delete cfg.lang;
  cfg.version = JSON.parse(fs.readFileSync(path.join(pkgRoot, 'package.json'), 'utf8')).version;
  cfg.brownfield = d.brownfield;
```

with this block:

```js
  cfg.projectName = flags.name || cfg.projectName || (auto ? path.basename(target) : await ask.text('Project name', path.basename(target)));
  if (!cfg.teamSize) cfg.teamSize = auto ? 'small-team' : await ask.choice('Team size:', ['solo', 'small-team', 'enterprise'], 1);
  if (!cfg.branchingModel) cfg.branchingModel = auto ? 'github-flow' : await ask.choice('Branching model:', ['github-flow', 'gitlab-flow', 'trunk'], 0);
  try {
    cfg = await collectProfileConfig(cfg, flags, ask, auto);
  } catch (e) {
    log.err(e.message);
    ask.close();
    process.exit(1);
  }
  if (!cfg.enforceLevel) cfg.enforceLevel = 'mixed';
  delete cfg.lang;
  cfg.version = JSON.parse(fs.readFileSync(path.join(pkgRoot, 'package.json'), 'utf8')).version;
  cfg.brownfield = d.brownfield;
```

3. Replace the `vars` object with this code:

```js
  const vars = Object.assign({
    PROJECT_NAME: cfg.projectName,
    DATE: new Date().toISOString().slice(0, 10),
    TEAM_SIZE: TEAM_LABELS[cfg.teamSize] || cfg.teamSize,
    BRANCHING_MODEL: BRANCH_LABELS[cfg.branchingModel] || cfg.branchingModel,
  }, buildProfileVars(cfg));
```

- [ ] **Step 4: Wire profile config into `src/update.cjs`**

Modify `src/update.cjs`:

1. Add this require after existing requires:

```js
const { normalizeProfileConfig, buildProfileVars } = require('./profile-config.cjs');
```

2. Replace this line:

```js
  const { pkgRoot, target } = opts;
```

with:

```js
  const { pkgRoot, target, flags } = opts;
```

3. Replace this block:

```js
  const cfg = readJSON(path.join(target, '.hero-vibe-kit', 'config.json'), null);
  if (!cfg) { log.err('Not initialized (.hero-vibe-kit/config.json missing). Run `hero-vibe-kit init`.'); process.exit(1); }
```

with this block:

```js
  let cfg = readJSON(path.join(target, '.hero-vibe-kit', 'config.json'), null);
  if (!cfg) { log.err('Not initialized (.hero-vibe-kit/config.json missing). Run `hero-vibe-kit init`.'); process.exit(1); }
  try {
    cfg = normalizeProfileConfig(cfg, flags || {});
  } catch (e) {
    log.err(e.message);
    process.exit(1);
  }
```

4. Replace the `vars` object with this code:

```js
  const vars = Object.assign({
    PROJECT_NAME: cfg.projectName,
    DATE: new Date().toISOString().slice(0, 10),
    TEAM_SIZE: TEAM_LABELS[cfg.teamSize] || cfg.teamSize,
    BRANCHING_MODEL: BRANCH_LABELS[cfg.branchingModel] || cfg.branchingModel,
  }, buildProfileVars(cfg));
```

- [ ] **Step 5: Update CLI help text**

Modify `bin/hero-vibe-kit.js` help output. Replace the flags section:

```text
Flags:
  --dir <path>          Target project dir (default: current dir)
  --preset <name>       solo | small-team | enterprise
  --name <name>         Project name (default: dir name)
  --yes                 Non-interactive; accept defaults
  --skip-integrations   Skip skills / gitnexus / serena prompts`);
```

with:

```text
Flags:
  --dir <path>          Target project dir (default: current dir)
  --preset <name>       solo | small-team | enterprise
  --name <name>         Project name (default: dir name)
  --profile <name>      vibecode | coding-assistant
  --surface <name>      fullstack | backend | frontend
  --verify <level>      strict | pragmatic | minimal
  --yes                 Non-interactive; accept defaults
  --skip-integrations   Skip skills / gitnexus / serena prompts

Profile controls AI autonomy. Surface controls technical workflow emphasis. Verify controls completion evidence.`);
```

- [ ] **Step 6: Run tests and verify CLI logic still fails only on missing doc text**

Run:

```powershell
npm test -- test/profile-config.test.cjs test/init-smoke.test.cjs
```

Expected: `test/profile-config.test.cjs` passes. `test/init-smoke.test.cjs` still fails because templates do not yet include active profile text or `ASSISTANCE_PROFILES.md`.

- [ ] **Step 7: Commit CLI config implementation if the user asked for commits**

If the user asked for commits, run:

```powershell
git add src/profile-config.cjs src/init.cjs src/update.cjs bin/hero-vibe-kit.js
git commit -m @'
feat: add assistance profile config

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
'@
```

Expected: commit succeeds. If commits were not requested, skip and state that CLI config implementation is uncommitted.

---

### Task 3: Add profile docs and render active profile metadata

**Files:**
- Create: `templates/docs/ASSISTANCE_PROFILES.md`
- Modify: `templates/CLAUDE.md.tmpl`
- Modify: `templates/AGENTS.md.tmpl`
- Modify: `templates/docs/AGENCY_WORKFLOW.md`
- Modify: `templates/docs/DEFINITION_OF_DONE.md`
- Modify: `templates/docs/TEAM_ROSTER.md`
- Modify: `README.md`
- Test: `test/init-smoke.test.cjs`
- Test: `test/links.test.cjs`

- [ ] **Step 1: Create canonical assistance profiles doc**

Create `templates/docs/ASSISTANCE_PROFILES.md` with this complete content:

```markdown
# Assistance Profiles

`hero-vibe-kit` separates team/process scale from how autonomous the AI should be.

- `teamSize` / preset controls team scale: solo, small team, or enterprise.
- `assistanceProfile` controls AI autonomy and ceremony level.
- `projectSurface` controls technical workflow emphasis.
- `verificationLevel` controls completion evidence.

Active configuration for this project:

- Assistance profile: **{{ASSISTANCE_PROFILE_LABEL}}** (`{{ASSISTANCE_PROFILE}}`)
- Project surface: **{{PROJECT_SURFACE_LABEL}}** (`{{PROJECT_SURFACE}}`)
- Verification level: **{{VERIFICATION_LEVEL}}**

## Assistance profiles

### Vibecode

Use `vibecode` when the user gives a requirement, problem, or feature description and expects the AI to drive technical delivery end-to-end.

Default behavior:

- Clarify scope before meaningful work.
- Use the Full path for new features.
- Keep Plan Mode gates strong for behavior changes, refactors, new features, and UI/UX design work.
- Run stricter verification before completion claims.
- Use review/QA sub-agents for Standard and Full paths.
- Treat handoff artifacts and durable state as part of delivery when the work crosses a real phase boundary.

Default verification level: `strict`.

### Coding Assistant

Use `coding-assistant` when the user is a developer and wants AI to code, verify pragmatically, and leave final review to the developer.

Default behavior:

- Keep low-risk work lightweight.
- Use short scope confirmation for small tasks instead of heavy ceremony.
- Use Plan Mode when risk, ambiguity, sensitive surfaces, or task size justify it.
- Run relevant available checks and report what was not verified.
- Treat developer review as the final expected gate.
- Use review/QA sub-agents for broad, risky, or security-sensitive changes.

Default verification level: `pragmatic`.

## Project surfaces

### Fullstack

Use `fullstack` when both frontend and backend concerns matter.

Emphasize:

- API/interface contracts.
- Frontend/backend split.
- Integration verification.
- Security and performance baselines.
- Design standards when UI work exists.

### Backend

Use `backend` when the project is backend-only or mostly backend.

Emphasize:

- API contracts.
- Data, schema, and migration effects.
- Auth, permissions, secrets, and external integrations.
- Security, performance, and backend tests.

Frontend and design guidance is optional unless the task asks for UI work.

### Frontend

Use `frontend` when the project is frontend-only or mostly frontend.

Emphasize:

- Screens, components, states, and user flows.
- Accessibility.
- API consumption assumptions.
- Design consistency and visual/manual verification.

Backend guidance is limited to API consumer assumptions unless the task asks for backend work.

## Verification levels

### strict

Use for autonomous delivery. Completion claims need relevant evidence: tests, lint/build, regression checks, review/QA where required, security/performance checks for sensitive surfaces, and clear limitations.

### pragmatic

Use for developer-in-the-loop work. Run checks that are relevant and available. Do not invent heavy QA for every small change. Always report what was verified and what remains for developer review.

### minimal

Use only when explicitly requested. Make the change, do a quick self-review or syntax/build check when available, and clearly state that final testing/review remains with the user.

## Per-task overrides

The project config is the default. User instructions can override it for a single task:

```text
"Build this end-to-end, vibecode style"
"Just patch this as coding assistant; I will review"
"Frontend only"
"Backend API only"
```

Resolution order:

```text
explicit user override
→ obvious task scope from request
→ project default config
```
```

- [ ] **Step 2: Add active profile metadata to `templates/CLAUDE.md.tmpl`**

Insert this block after the opening single-source-of-truth paragraph:

```markdown
> **Active operating profile:**
> - Active assistance profile: {{ASSISTANCE_PROFILE_LABEL}} (`{{ASSISTANCE_PROFILE}}`)
> - Project surface: {{PROJECT_SURFACE_LABEL}} (`{{PROJECT_SURFACE}}`)
> - Verification level: {{VERIFICATION_LEVEL}}
> See [ASSISTANCE_PROFILES](docs/ASSISTANCE_PROFILES.md) before changing gate, delegation, or verification strictness.
```

- [ ] **Step 3: Add active profile metadata to `templates/AGENTS.md.tmpl`**

Insert this block after the canonical development process paragraph:

```markdown
Active operating profile:
- Active assistance profile: {{ASSISTANCE_PROFILE_LABEL}} (`{{ASSISTANCE_PROFILE}}`)
- Project surface: {{PROJECT_SURFACE_LABEL}} (`{{PROJECT_SURFACE}}`)
- Verification level: {{VERIFICATION_LEVEL}}
- Profile rules: [docs/ASSISTANCE_PROFILES.md](docs/ASSISTANCE_PROFILES.md)
```

- [ ] **Step 4: Update `templates/docs/AGENCY_WORKFLOW.md` golden rules**

In `templates/docs/AGENCY_WORKFLOW.md`, insert this subsection after the language policy paragraph and before `The personas`:

```markdown
Active operating profile:

- Assistance profile: **{{ASSISTANCE_PROFILE_LABEL}}** (`{{ASSISTANCE_PROFILE}}`)
- Project surface: **{{PROJECT_SURFACE_LABEL}}** (`{{PROJECT_SURFACE}}`)
- Verification level: **{{VERIFICATION_LEVEL}}**

Profile definitions, override examples, and verification levels live in [ASSISTANCE_PROFILES.md](./ASSISTANCE_PROFILES.md).
```

Then insert this golden rule before the existing task classification rule:

```markdown
1. **Resolve the active assistance profile before routing.** Use explicit user override first, then obvious task scope, then the project default from [ASSISTANCE_PROFILES.md](./ASSISTANCE_PROFILES.md). The active profile tunes gates, delegation, and completion evidence; it does not replace the task router.
```

Renumber the existing golden rules so the list remains sequential.

- [ ] **Step 5: Add profile-specific gate and delegation wording to `AGENCY_WORKFLOW.md`**

In `templates/docs/AGENCY_WORKFLOW.md`, add this subsection after `### Self-Prompting Router`:

```markdown
### Assistance profile overlay

The task type still chooses the path. The active assistance profile changes how strict the path is.

| Area | Vibecode | Coding Assistant |
|---|---|---|
| Default posture | AI owns end-to-end delivery | AI codes and verifies; developer reviews final code |
| New features | Full path by default | Standard or Full depending on size and ambiguity |
| Plan Mode gates | Strong for Standard, Full, refactor, and UI/UX design | Required for medium+ impact, broad changes, sensitive surfaces, or ambiguous features |
| Verification | `strict` evidence before completion claims | `pragmatic` evidence plus explicit developer-review handoff |
| Review/QA sub-agent | Required for Standard and Full paths | Recommended for broad/risky work; required for sensitive or high-impact changes unless explicitly documented as not run |
| Phase handoff | Use at real phase boundaries | Use only when context or phase separation justifies it |
```

- [ ] **Step 6: Update Definition of Done with verification levels**

In `templates/docs/DEFINITION_OF_DONE.md`, add this section near the top after the introductory text:

```markdown
## Verification level overlay

Active verification level for this project: **{{VERIFICATION_LEVEL}}**. See [ASSISTANCE_PROFILES.md](./ASSISTANCE_PROFILES.md) for the canonical definitions.

| Level | Completion evidence |
|---|---|
| `strict` | Run relevant tests/lint/build, include regression evidence for bugfixes when feasible, run required review/QA for Standard/Full, check sensitive security/performance surfaces, and report limitations. |
| `pragmatic` | Run relevant available checks for the scope, avoid heavy QA for small changes, report verified and unverified areas, and leave final review to the developer. |
| `minimal` | Make the requested change, do a quick self-review or syntax/build check when available, and clearly state that full verification remains with the user. |
```

- [ ] **Step 7: Update Team Roster delegation rules**

In `templates/docs/TEAM_ROSTER.md`, replace the bullets under `## 3. Path-triggered delegation` with:

```markdown
- **Fast path** → sub-agents optional; main agent may implement directly.
- **Standard path + Vibecode** → MUST spawn a review sub-agent (QA/code-review) before completion.
- **Standard path + Coding Assistant** → SHOULD spawn a review sub-agent for broad, risky, or ambiguous changes; MUST escalate before editing if impact is HIGH/CRITICAL.
- **Full path + Vibecode** → MUST spawn a QA/review sub-agent before completion; delegating Dev implementation remains optional.
- **Full path + Coding Assistant** → SHOULD spawn QA/review unless risk is low and the user expects developer review as the final gate.
- **Security-sensitive work** → auth, permissions, secrets, external integrations, deployment, AI behavior, or user-input-sensitive surfaces require security review. A security review may be skipped only when scope review confirms the selected path does not touch a sensitive surface.
- **Brownfield first change** → if `docs/BROWNFIELD_DISCOVERY.md` exists and the request touches > 2 files or **Needs confirmation** areas, treat as Standard (gate + review expectations from the active profile).
```

- [ ] **Step 8: Update README quick-start and flags**

In `README.md`, replace the non-interactive example:

```bash
npx hero-vibe-kit init --yes --preset small-team --lang en --skip-integrations
```

with:

```bash
npx hero-vibe-kit init --yes --preset small-team --profile coding-assistant --surface fullstack --skip-integrations
```

Replace the flags line:

```markdown
Flags: `--dir <path>` · `--preset solo|small-team|enterprise` · `--name <name>` · `--yes` · `--skip-integrations`.
```

with:

```markdown
Flags: `--dir <path>` · `--preset solo|small-team|enterprise` · `--name <name>` · `--profile vibecode|coding-assistant` · `--surface fullstack|backend|frontend` · `--verify strict|pragmatic|minimal` · `--yes` · `--skip-integrations`.
```

Add this paragraph after `What init installs`:

```markdown
`init` also records the active operating profile in `.hero-vibe-kit/config.json`: `vibecode` for autonomous end-to-end AI delivery, or `coding-assistant` for developer-in-the-loop coding. The project surface (`fullstack`, `backend`, or `frontend`) controls which workflow concerns are emphasized. Defaults for `--yes` are `coding-assistant`, `fullstack`, and `pragmatic` verification.
```

- [ ] **Step 9: Update link tests for profile docs**

Modify `test/links.test.cjs`. In the `phase handoff protocol is wired into workflow docs` test, replace:

```js
  const requiredDocs = ['PHASE_HANDOFF_PROTOCOL.md', 'AGENCY_WORKFLOW.md', 'CONTEXT_BUDGET.md', 'HANDOFF_TEMPLATES.md'];
```

with:

```js
  const requiredDocs = ['PHASE_HANDOFF_PROTOCOL.md', 'AGENCY_WORKFLOW.md', 'CONTEXT_BUDGET.md', 'HANDOFF_TEMPLATES.md', 'ASSISTANCE_PROFILES.md'];
```

After the `workflow should list context tiers` assertion, add:

```js
  assertContains(workflow, 'ASSISTANCE_PROFILES.md', 'workflow should reference assistance profiles');
```

- [ ] **Step 10: Run targeted smoke and link tests**

Run:

```powershell
npm test -- test/profile-config.test.cjs test/init-smoke.test.cjs test/links.test.cjs
```

Expected: PASS for all targeted tests.

- [ ] **Step 11: Commit docs and template implementation if the user asked for commits**

If the user asked for commits, run:

```powershell
git add templates/docs/ASSISTANCE_PROFILES.md templates/CLAUDE.md.tmpl templates/AGENTS.md.tmpl templates/docs/AGENCY_WORKFLOW.md templates/docs/DEFINITION_OF_DONE.md templates/docs/TEAM_ROSTER.md README.md test/links.test.cjs
git commit -m @'
docs: add assistance profile routing guidance

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
'@
```

Expected: commit succeeds. If commits were not requested, skip and state that docs/template changes are uncommitted.

---

### Task 4: Full verification and expected scope checks

**Files:**
- Verify: all changed files
- Test: full repository test suite

- [ ] **Step 1: Run the full test suite**

Run:

```powershell
npm test
```

Expected: PASS for every Node test file.

- [ ] **Step 2: Run package smoke by packing the project**

Run:

```powershell
npm pack --dry-run
```

Expected: PASS with package contents including `src/profile-config.cjs` and `templates/docs/ASSISTANCE_PROFILES.md`.

- [ ] **Step 3: Run GitNexus change detection before any commit or completion claim**

Use MCP tool:

```text
gitnexus_detect_changes({
  repo: "hero-vibe-kit",
  scope: "all"
})
```

Expected: changed symbols and affected flows match this plan: init/update config flow, rendered docs/templates, tests, and README. If unexpected symbols or flows appear, investigate before completion.

- [ ] **Step 4: Check working tree status**

Run:

```powershell
git status --short
```

Expected: changed files are limited to the implementation scope in this plan plus the already-approved spec and this plan file.

- [ ] **Step 5: Commit final implementation if the user asked for commits**

If the user asked for commits and earlier task commits were skipped, run:

```powershell
git add bin/hero-vibe-kit.js src/profile-config.cjs src/init.cjs src/update.cjs templates/CLAUDE.md.tmpl templates/AGENTS.md.tmpl templates/docs/ASSISTANCE_PROFILES.md templates/docs/AGENCY_WORKFLOW.md templates/docs/DEFINITION_OF_DONE.md templates/docs/TEAM_ROSTER.md README.md test/profile-config.test.cjs test/init-smoke.test.cjs test/links.test.cjs docs/superpowers/specs/2026-06-07-assistance-profiles-design.md docs/superpowers/plans/2026-06-07-assistance-profiles.md
git commit -m @'
feat: add assistance profiles

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
'@
```

Expected: commit succeeds. If the user did not ask for commits, skip and state that commits require explicit user request.

---

## Self-review checklist for the implementer

- Spec coverage: this plan implements Step 1 from the approved spec: config fields, CLI flags, update migration, rendered docs, router/DoD wording, and tests. It intentionally leaves selective skill installation for a follow-up plan.
- Placeholder scan: no task should introduce unresolved `{{...}}` placeholders in rendered consumer docs. `test/init-smoke.test.cjs` checks rendered docs for unresolved placeholders.
- Type consistency: use these exact field names everywhere: `assistanceProfile`, `projectSurface`, `verificationLevel`. Use these exact render variable names: `ASSISTANCE_PROFILE`, `ASSISTANCE_PROFILE_LABEL`, `PROJECT_SURFACE`, `PROJECT_SURFACE_LABEL`, `VERIFICATION_LEVEL`.
- Runtime dependency check: do not add npm dependencies. The helper uses Node built-ins only.
- Backward compatibility check: existing `.hero-vibe-kit/config.json` files migrate on `update` without prompting.
