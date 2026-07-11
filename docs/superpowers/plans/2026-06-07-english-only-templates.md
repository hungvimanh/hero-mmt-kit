# English-Only Templates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove Vietnamese template support and make hero-vibe-kit use one English-only framework template tree while preserving adaptive chat-language behavior.

**Architecture:** Collapse `templates/docs/en/*` into `templates/docs/*`, remove `templates/docs/vi/*`, and update CLI code so `init`, `update`, and `discover` no longer branch on language. Tests and docs become single-tree checks, and managed instructions explicitly separate English source instructions from user-language chat responses.

**Tech Stack:** Node.js CommonJS, Node built-in `node:test`, filesystem-based templates, zero runtime dependencies.

---

## File structure map

- Modify: `bin/hero-vibe-kit.js` — remove `--lang` from public help and optionally warn if passed.
- Modify: `src/init.cjs` — stop asking for `Docs language`, stop validating/storing `cfg.lang`, render from `templates/docs`.
- Modify: `src/update.cjs` — render from `templates/docs`, remove stale `cfg.lang` from config.
- Modify: `src/discover.cjs` — delete Vietnamese report generator and language selection, always generate English content.
- Move/delete: `templates/docs/en/**` → `templates/docs/**`; remove `templates/docs/vi/**`.
- Modify: `templates/CLAUDE.md.tmpl`, `templates/AGENTS.md.tmpl`, `templates/docs/COMMUNICATION_PROTOCOL.md` or `templates/docs/AGENCY_WORKFLOW.md` — add English-source/user-language-chat rule.
- Modify: root `CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING.md`, `README.md`, `CHANGELOG.md` — remove active bilingual parity instructions and document the breaking change.
- Modify: `presets/solo.json`, `presets/small-team.json`, `presets/enterprise.json` — remove `lang`.
- Modify: `test/links.test.cjs` — convert EN/VI link/parity tests to single-tree tests.
- Modify: `test/init-smoke.test.cjs` — remove `--lang en` from init smoke and assert config has no `lang`.
- Modify: `test/discover.test.cjs` — remove `--lang` and replace Vietnamese brownfield test with English-only idempotency / removed-language behavior.

No commits should be created during execution unless the user explicitly asks for commits.

---

### Task 1: Collapse template docs to a single English tree

**Files:**
- Move: `templates/docs/en/*` → `templates/docs/*`
- Delete: `templates/docs/en/`
- Delete: `templates/docs/vi/`

- [ ] **Step 1: Inspect current docs tree**

Run:

```powershell
Get-ChildItem "templates\docs" | Select-Object Name, Mode
```

Expected before change: output includes `en` and `vi` directories.

- [ ] **Step 2: Move English docs to the docs root**

Run:

```powershell
Get-ChildItem "templates\docs\en" | Move-Item -Destination "templates\docs"
```

Expected: files such as `templates\docs\AGENCY_WORKFLOW.md`, `templates\docs\CONTEXT_BUDGET.md`, and `templates\docs\templates\PRD_AI_FEATURE.md` now exist.

- [ ] **Step 3: Remove now-empty English directory and Vietnamese directory**

Run:

```powershell
Remove-Item "templates\docs\en" -Recurse -Force -Confirm:$false
Remove-Item "templates\docs\vi" -Recurse -Force -Confirm:$false
```

Expected: `templates\docs\en` and `templates\docs\vi` no longer exist.

- [ ] **Step 4: Verify single docs tree exists**

Run:

```powershell
Test-Path "templates\docs\AGENCY_WORKFLOW.md"
Test-Path "templates\docs\vi"
Test-Path "templates\docs\en"
```

Expected output:

```text
True
False
False
```

- [ ] **Step 5: Checkpoint without commit**

Run:

```powershell
git status --short
```

Expected: many docs moves/deletes are visible. Do not commit unless the user asks.

---

### Task 2: Update CLI language handling

**Files:**
- Modify: `bin/hero-vibe-kit.js:22-42`
- Modify: `src/init.cjs:31-60`
- Modify: `src/update.cjs:26-38,58-60`
- Modify: `presets/solo.json`
- Modify: `presets/small-team.json`
- Modify: `presets/enterprise.json`

- [ ] **Step 1: Run GitNexus impact before editing CLI symbols**

Run these impact checks through GitNexus MCP before editing symbols:

```text
gitnexus_impact({ target: "parseArgs", direction: "upstream", file_path: "bin/hero-vibe-kit.js", kind: "Function", repo: "hero-vibe-kit" })
gitnexus_impact({ target: "printHelp", direction: "upstream", file_path: "bin/hero-vibe-kit.js", kind: "Function", repo: "hero-vibe-kit" })
gitnexus_impact({ target: "init", direction: "upstream", file_path: "src/init.cjs", kind: "Function", repo: "hero-vibe-kit" })
gitnexus_impact({ target: "update", direction: "upstream", file_path: "src/update.cjs", kind: "Function", repo: "hero-vibe-kit" })
```

Expected: record risk, direct callers, and affected processes in the session before editing. If any result is HIGH or CRITICAL, warn the user before continuing.

- [ ] **Step 2: Update help text in `bin/hero-vibe-kit.js`**

Replace the `Flags:` section with this text:

```js
Flags:
  --dir <path>          Target project dir (default: current dir)
  --preset <name>       solo | small-team | enterprise
  --name <name>         Project name (default: dir name)
  --yes                 Non-interactive; accept defaults
  --skip-integrations   Skip skills / gitnexus / serena prompts`);
```

Expected: `--lang <en|vi>` is absent from help output.

- [ ] **Step 3: Add an explicit removed-flag warning in `main`**

In `bin/hero-vibe-kit.js`, after `const version = () => console.log(require('../package.json').version);`, insert:

```js
  if (Object.prototype.hasOwnProperty.call(flags, 'lang')) {
    console.error('Warning: --lang was removed. hero-vibe-kit templates are English-only.');
  }
```

Expected behavior: existing invocations with `--lang` do not crash, but users are told the flag is removed.

- [ ] **Step 4: Update config selection in `src/init.cjs`**

Replace lines that assign and validate `cfg.lang` with this block:

```js
  cfg.projectName = flags.name || cfg.projectName || (auto ? path.basename(target) : await ask.text('Project name', path.basename(target)));
  if (!cfg.teamSize) cfg.teamSize = auto ? 'small-team' : await ask.choice('Team size:', ['solo', 'small-team', 'enterprise'], 1);
  if (!cfg.branchingModel) cfg.branchingModel = auto ? 'github-flow' : await ask.choice('Branching model:', ['github-flow', 'gitlab-flow', 'trunk'], 0);
  if (!cfg.enforceLevel) cfg.enforceLevel = 'mixed';
  delete cfg.lang;
  cfg.version = JSON.parse(fs.readFileSync(path.join(pkgRoot, 'package.json'), 'utf8')).version;
  cfg.brownfield = d.brownfield;
```

Expected: `init` no longer asks for or validates docs language.

- [ ] **Step 5: Update docs source path and log in `src/init.cjs`**

Replace:

```js
  const srcDocs = path.join(templates, 'docs', cfg.lang);
```

with:

```js
  const srcDocs = path.join(templates, 'docs');
```

Replace:

```js
  log.ok(`Docs    : ${docCount} file(s) [${cfg.lang}]` + (keptActiveState ? ' · kept existing ACTIVE_STATE.md' : ''));
```

with:

```js
  log.ok(`Docs    : ${docCount} file(s)` + (keptActiveState ? ' · kept existing ACTIVE_STATE.md' : ''));
```

Expected: init renders from `templates/docs` and output no longer includes `[en]` or `[vi]`.

- [ ] **Step 6: Update docs source path and config normalization in `src/update.cjs`**

Replace:

```js
  const srcDocs = path.join(templates, 'docs', cfg.lang);
```

with:

```js
  const srcDocs = path.join(templates, 'docs');
```

Before writing config near the end, add:

```js
  delete cfg.lang;
```

so the end of `update` reads:

```js
  const newVer = JSON.parse(fs.readFileSync(path.join(pkgRoot, 'package.json'), 'utf8')).version;
  cfg.version = newVer;
  delete cfg.lang;
  writeJSON(path.join(target, '.hero-vibe-kit', 'config.json'), cfg);
  log.ok(`Now at v${newVer}`);
```

Expected: `update` ignores and removes stale `lang` metadata.

- [ ] **Step 7: Remove `lang` from presets**

Replace `presets/solo.json` with:

```json
{
  "teamSize": "solo",
  "branchingModel": "trunk",
  "enforceLevel": "soft"
}
```

Replace `presets/small-team.json` with:

```json
{
  "teamSize": "small-team",
  "branchingModel": "github-flow",
  "enforceLevel": "mixed"
}
```

Replace `presets/enterprise.json` with:

```json
{
  "teamSize": "enterprise",
  "branchingModel": "gitlab-flow",
  "enforceLevel": "hard"
}
```

- [ ] **Step 8: Run targeted init smoke**

Run:

```powershell
node --test test\init-smoke.test.cjs
```

Expected at this stage: failures related to old test expectations are acceptable until Task 5 updates tests. No runtime crash from missing `templates/docs/en` should occur.

---

### Task 3: Make brownfield discovery English-only

**Files:**
- Modify: `src/discover.cjs:136-193`
- Modify later: `test/discover.test.cjs`

- [ ] **Step 1: Run GitNexus impact before editing discover symbols**

Run:

```text
gitnexus_impact({ target: "contentVi", direction: "upstream", file_path: "src/discover.cjs", kind: "Function", repo: "hero-vibe-kit" })
gitnexus_impact({ target: "discover", direction: "upstream", file_path: "src/discover.cjs", kind: "Function", repo: "hero-vibe-kit" })
```

Expected: record risk, direct callers, and affected processes in the session before editing. If any result is HIGH or CRITICAL, warn the user before continuing.

- [ ] **Step 2: Delete the `contentVi` function**

Remove the entire symbol:

```js
function contentVi(projectName, date, d, s) {
  return [
    `# Brownfield Discovery — ${projectName}`,
    ...
  ].join('\n');
}
```

Expected: `contentVi` no longer exists in `src/discover.cjs`.

- [ ] **Step 3: Simplify language selection in `discover`**

Replace the start of `discover` with:

```js
async function discover(opts) {
  const { target, flags } = opts;
  const cfg = readJSON(path.join(target, '.hero-vibe-kit', 'config.json'), {});

  log.title('hero-vibe-kit · brownfield discovery');
  log.step(`Target : ${target}`);
```

Expected: no `lang` variable and no unsupported-language validation remain.

- [ ] **Step 4: Always use English discovery content**

Replace:

```js
  const inner = lang === 'vi' ? contentVi(projectName, date, d, s) : contentEn(projectName, date, d, s);
```

with:

```js
  const inner = contentEn(projectName, date, d, s);
```

Expected: `discover` and `brownfield` always generate English managed content.

- [ ] **Step 5: Run targeted discover tests**

Run:

```powershell
node --test test\discover.test.cjs
```

Expected at this stage: the old Vietnamese test fails until Task 5 updates it. The first English report test should still pass or only fail due to removed `--lang` expectations.

---

### Task 4: Update framework and template documentation

**Files:**
- Modify: `templates/CLAUDE.md.tmpl`
- Modify: `templates/AGENTS.md.tmpl`
- Modify: `templates/docs/COMMUNICATION_PROTOCOL.md`
- Modify: `templates/docs/AGENCY_WORKFLOW.md`
- Modify: `CLAUDE.md`
- Modify: `AGENTS.md`
- Modify: `CONTRIBUTING.md`
- Modify: `README.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Add communication-language rule to managed `CLAUDE.md` template**

In `templates/CLAUDE.md.tmpl`, add this bullet under `### Non-negotiables`:

```md
- **Language:** framework instructions, skills, rules, and templates are English-only. Respond to the user in the same language they use in chat unless they request another language.
```

Expected: installed `CLAUDE.md` tells agents to chat in the user's language while keeping rules English-only.

- [ ] **Step 2: Add communication-language rule to managed `AGENTS.md` template**

In `templates/AGENTS.md.tmpl`, add this numbered item after “Read only the docs needed...” and renumber the following items:

```md
4. Framework instructions, skills, rules, and templates are English-only; respond to the user in the same language they use in chat unless they request another language.
```

Expected: installed `AGENTS.md` carries the same rule.

- [ ] **Step 3: Add rule to `templates/docs/COMMUNICATION_PROTOCOL.md`**

Add a short section near the top:

```md
## Language policy

Framework instructions, skills, rules, and templates are English-only. The assistant responds to the user in the same language the user uses in chat unless the user requests another language. Do not translate the framework docs at runtime; explain the relevant guidance conversationally when needed.
```

Expected: detailed communication guidance includes the new policy.

- [ ] **Step 4: Add source-language note to `templates/docs/AGENCY_WORKFLOW.md`**

Add near the opening context section:

```md
> **Language policy:** this workflow and all framework templates are English-only for token efficiency and consistency. Use the user's chat language for responses unless they ask otherwise.
```

Expected: the primary workflow doc reinforces the rule.

- [ ] **Step 5: Update root `CLAUDE.md` active project instructions**

Replace references to:

```md
`templates/docs/{en,vi}/AGENCY_WORKFLOW.md`
```

with:

```md
`templates/docs/AGENCY_WORKFLOW.md`
```

Remove the bilingual parity bullet and add:

```md
- **English-only templates** — framework instructions, skills, rules, and templates live in English. Assistants should reply in the user's chat language unless asked otherwise.
```

Expected: active project instructions no longer require bilingual parity.

- [ ] **Step 6: Update root `AGENTS.md` active project instructions**

Replace the workflow-template source line with:

```md
- Workflow template sources live in `templates/docs/`; consumer projects receive English framework docs and agents reply in the user's chat language.
```

Replace “Keep EN/VI docs in sync” with:

```md
Keep framework templates English-only. Zero runtime deps.
```

- [ ] **Step 7: Update `CONTRIBUTING.md` rules**

Replace the bilingual parity rule with:

```md
- **English-only templates.** Framework docs, rules, templates, and vendored skills are authored in English. User-facing chat language is adaptive: answer in the user's language unless they ask otherwise.
```

Keep the existing skills redistribution rule, but remove the sentence that says bilingual parity applies to `templates/docs/{en,vi}` only.

- [ ] **Step 8: Update `README.md` install tree and flags**

Change:

```md
.hero-vibe-kit/
  config.json      # your choices (team size, branching, language, integrations)
```

to:

```md
.hero-vibe-kit/
  config.json      # your choices (team size, branching, integrations)
```

Replace the language-selection bullet with:

```md
- **English-only framework docs**: `init` renders one active docs set into `docs/`. Agents still reply in the user's chat language unless asked otherwise.
```

Replace flags line:

```md
Flags: `--dir <path>` · `--preset solo|small-team|enterprise` · `--lang en|vi` · `--name <name>` · `--yes` · `--skip-integrations`.
```

with:

```md
Flags: `--dir <path>` · `--preset solo|small-team|enterprise` · `--name <name>` · `--yes` · `--skip-integrations`.
```

- [ ] **Step 9: Update `CHANGELOG.md`**

Add under the latest unreleased or top release section:

```md
### Breaking
- Removed Vietnamese framework template support. `templates/docs` is now English-only, `--lang` is deprecated/ignored with a warning, and agents are instructed to respond in the user's chat language.
```

Expected: release notes disclose the breaking change.

- [ ] **Step 10: Search for remaining active bilingual docs references**

Run:

```powershell
rg "templates/docs/\{en,vi\}|templates/docs/en|templates/docs/vi|Bilingual parity|Keep EN/VI docs in sync|--lang en\|vi|Docs language" .
```

Expected: matches may remain in historical specs/plans, but no active runtime files, tests, root instructions, README, or current templates should require bilingual parity or advertise `--lang en|vi`.

---

### Task 5: Update tests to single-tree English behavior

**Files:**
- Modify: `test/links.test.cjs`
- Modify: `test/init-smoke.test.cjs`
- Modify: `test/discover.test.cjs`

- [ ] **Step 1: Replace `test/links.test.cjs` with single-tree tests**

Use this complete file content:

```js
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { checkLinks } = require('../src/links.cjs');

test('template doc links resolve', () => {
  const dir = path.join(__dirname, '..', 'templates', 'docs');
  const { broken, checked } = checkLinks([dir]);
  assert.ok(checked > 0, 'should check some links');
  assert.deepStrictEqual(broken, [], 'no broken links: ' + JSON.stringify(broken));
});

test('phase handoff protocol is wired into workflow docs', () => {
  const docsRoot = path.join(__dirname, '..', 'templates', 'docs');
  const requiredDocs = ['PHASE_HANDOFF_PROTOCOL.md', 'AGENCY_WORKFLOW.md', 'CONTEXT_BUDGET.md', 'HANDOFF_TEMPLATES.md'];
  const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const assertContains = (text, expected, message) => {
    assert.match(text, new RegExp(escapeRegExp(expected)), message || `missing: ${expected}`);
  };

  for (const doc of requiredDocs) {
    assert.ok(fs.existsSync(path.join(docsRoot, doc)), `missing ${doc}`);
  }

  const workflow = fs.readFileSync(path.join(docsRoot, 'AGENCY_WORKFLOW.md'), 'utf8');
  assertContains(workflow, 'PHASE_HANDOFF_PROTOCOL.md', 'workflow should reference phase handoff protocol');
  assert.match(workflow, /Tiny[\s\S]*Small[\s\S]*Standard[\s\S]*Full/, 'workflow should list context tiers');

  const contextBudget = fs.readFileSync(path.join(docsRoot, 'CONTEXT_BUDGET.md'), 'utf8');
  for (const expected of ['artifact-first', 'resume.md', 'Sanity check', 'Evidence freshness', 'Final claims']) {
    assertContains(contextBudget, expected, `context budget should contain ${expected}`);
  }

  const handoffTemplates = fs.readFileSync(path.join(docsRoot, 'HANDOFF_TEMPLATES.md'), 'utf8');
  for (const expected of ['Code → Test', 'Test → Verify / QA', 'QA sub-agent prompt', 'Short next-phase prompt']) {
    assertContains(handoffTemplates, expected, `handoff templates should contain ${expected}`);
  }
});
```

Expected: no loop over `['en', 'vi']` and no parity test remain.

- [ ] **Step 2: If the escape regex in Step 1 is awkward after paste, use the existing helper exactly**

If syntax is wrong, replace the helper with the known-good version from the old file:

```js
  const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
```

Expected: `node --test test\links.test.cjs` parses.

- [ ] **Step 3: Update `test/init-smoke.test.cjs` init command**

Replace:

```js
  const r = cli(['init', '--dir', dir, '--yes', '--skip-integrations', '--name', 'SmokeApp', '--lang', 'en']);
```

with:

```js
  const r = cli(['init', '--dir', dir, '--yes', '--skip-integrations', '--name', 'SmokeApp']);
```

- [ ] **Step 4: Add config assertion in init smoke**

After reading `settings`, add:

```js
  const config = JSON.parse(fs.readFileSync(path.join(dir, '.hero-vibe-kit', 'config.json'), 'utf8'));
  assert.strictEqual(config.projectName, 'SmokeApp');
  assert.ok(!Object.prototype.hasOwnProperty.call(config, 'lang'), 'new config should not include lang');
```

Expected: smoke test asserts new configs have no `lang`.

- [ ] **Step 5: Replace the first discover command**

In `test/discover.test.cjs`, replace:

```js
  const r = cli(['discover', '--dir', dir, '--lang', 'en', '--name', 'LegacyApp']);
```

with:

```js
  const r = cli(['discover', '--dir', dir, '--name', 'LegacyApp']);
```

- [ ] **Step 6: Replace Vietnamese discover test**

Replace the whole test named `brownfield alias supports Vietnamese report and is idempotent` with:

```js
test('brownfield alias creates English report and is idempotent even when --lang is passed', () => {
  const dir = mkdir();
  fs.mkdirSync(path.join(dir, 'app'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'app', 'main.js'), 'console.log(1);\n');

  const first = cli(['brownfield', '--dir', dir, '--lang', 'vi']);
  assert.strictEqual(first.status, 0, first.stderr);
  assert.match(first.stderr, /--lang was removed/);
  const second = cli(['brownfield', '--dir', dir, '--lang', 'vi']);
  assert.strictEqual(second.status, 0, second.stderr);

  const report = fs.readFileSync(path.join(dir, 'docs', 'BROWNFIELD_DISCOVERY.md'), 'utf8');
  assert.match(report, /What was found/);
  assert.doesNotMatch(report, /Những gì đã tìm thấy/);
  assert.match(report, /app\//);
  assert.strictEqual((report.match(/hero-vibe-kit:start/g) || []).length, 1, 'managed block not duplicated');
});
```

Expected: old `--lang vi` produces warning but English content.

- [ ] **Step 7: Run targeted tests**

Run:

```powershell
node --test test\links.test.cjs test\init-smoke.test.cjs test\discover.test.cjs
```

Expected: all targeted tests pass. If a syntax error occurs in `test/links.test.cjs`, fix the regex helper using the old file's helper pattern.

---

### Task 6: Clean up remaining references and run verification

**Files:**
- Modify any active files found by searches from Task 4.
- Test: full suite.

- [ ] **Step 1: Search for removed language-split paths**

Run:

```powershell
rg "templates/docs/(en|vi)|templates/docs/\{en,vi\}|docs language|Docs language|--lang en\|vi|Bilingual parity|bilingual parity|Keep EN/VI" .
```

Expected: no matches in runtime code, tests, README, root instructions, or templates. Historical design docs may still mention old architecture, but active docs should not.

- [ ] **Step 2: Search for `cfg.lang` and active language branching**

Run:

```powershell
rg "cfg\.lang|flags\.lang|contentVi|lang ===|lang !==|\['en', 'vi'\]" src test presets templates README.md CLAUDE.md AGENTS.md CONTRIBUTING.md
```

Expected: no active language branching remains except the removed-flag warning that checks `flags` for the presence of `lang` in `bin/hero-vibe-kit.js`.

- [ ] **Step 3: Run full tests**

Run:

```powershell
npm test
```

Expected: all Node tests pass with exit code 0.

- [ ] **Step 4: Run GitNexus change detection before reporting completion**

Run:

```text
gitnexus_detect_changes({ scope: "all", repo: "hero-vibe-kit" })
```

Expected: changed symbols and affected flows match the planned scope: CLI argument/help handling, init/update docs rendering, brownfield discovery language removal, docs/tests.

- [ ] **Step 5: Inspect git status**

Run:

```powershell
git status --short
```

Expected: changes are limited to planned files and docs tree moves/deletes.

- [ ] **Step 6: Final report**

Report:

```md
Implemented English-only templates.

Verification:
- npm test: pass, include test count from output.
- GitNexus detect_changes: summarize changed symbols and risk/affected flows.

Notes:
- No commit was created because this session requires explicit user instruction before committing.
- --lang now warns that it was removed and docs render English-only.
```

Do not claim completion unless Step 3 and Step 4 have fresh successful output.
