'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const BIN = path.join(__dirname, '..', 'bin', 'hero-mmt-kit.js');
const PROCESS_SKILLS = require(path.join(__dirname, '..', 'skills.manifest.json')).groups.process.skills.map((s) => s.name);
function cli(args, opts) { return spawnSync('node', [BIN, ...args], Object.assign({ encoding: 'utf8' }, opts)); }
function mkdir() { return fs.mkdtempSync(path.join(os.tmpdir(), 'hvk-')); }
function hasSkill(dir, name, rel = '.claude/skills') { return fs.existsSync(path.join(dir, rel, name, 'SKILL.md')); }
function allFiles(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...allFiles(p));
    else out.push(p);
  }
  return out;
}
function replaceManagedBlock(text, replacement) {
  return text.replace(
    /<!-- hero-mmt-kit:start -->[\s\S]*?<!-- hero-mmt-kit:end -->/,
    `<!-- hero-mmt-kit:start -->\n${replacement}\n<!-- hero-mmt-kit:end -->`
  );
}

test('init new project: files + no leftover placeholders + doctor passes', () => {
  const dir = mkdir();
  const r = cli(['init', '--dir', dir, '--yes', '--skip-integrations']);
  assert.strictEqual(r.status, 0, r.stderr);

  for (const f of ['CLAUDE.md', '.claude/settings.json', '.claude/hooks/git-guard.cjs',
    '.claude/hooks/active-state-bridge.cjs',
    '.hero-mmt-kit/config.json',
    'docs/SECURITY_STANDARDS.md', 'docs/PERFORMANCE_STANDARDS.md', 'docs/ACTIVE_STATE.md',
    'docs/DESIGN_STANDARDS.md', 'docs/BROWNFIELD_DISCOVERY.md', 'docs/INTERACTION_PATTERNS.md',
    'docs/templates/PRD_AI_FEATURE.md', 'docs/templates/DESIGN_BRIEF.md',
    '.claude/skills/NOTICE', '.claude/skills/brainstorming/SKILL.md',
    '.claude/skills/dispatching-parallel-agents/SKILL.md', '.claude/skills/subagent-driven-development/SKILL.md',
    '.claude/skills/using-hero/SKILL.md',
    '.claude/skills/hero-planning/SKILL.md', '.claude/skills/hero-coding/SKILL.md',
    '.claude/skills/hero-reviewing/SKILL.md', '.claude/skills/hero-unit-test/SKILL.md',
    '.claude/skills/hero-security/SKILL.md', '.claude/skills/hero-mr-review/SKILL.md',
    '.claude/skills/hero-strict/SKILL.md', '.claude/skills/hero-report/SKILL.md']) {
    assert.ok(fs.existsSync(path.join(dir, f)), 'missing: ' + f);
  }
  assert.ok(!fs.existsSync(path.join(dir, '.hero-mmt-kit', 'session.json')), 'session.json should no longer be seeded');
  assert.ok(!fs.existsSync(path.join(dir, '.claude', 'hooks', 'session-bridge.cjs')), 'session-bridge hook should no longer be installed');
  assert.ok(!fs.existsSync(path.join(dir, '.claude', 'skills', 'finishing-a-development-branch')), 'finishing-a-development-branch should not be installed');
  assert.ok(!fs.existsSync(path.join(dir, '.claude', 'skills', 'writing-plans')), 'writing-plans should not be installed');
  assert.ok(!fs.existsSync(path.join(dir, '.claude', 'skills', 'requesting-code-review')), 'requesting-code-review should not be installed');
  assert.ok(!fs.existsSync(path.join(dir, '.claude', 'skills', 'receiving-code-review')), 'receiving-code-review should not be installed');
  assert.ok(!fs.existsSync(path.join(dir, '.cursor')), 'no .cursor artifacts should be created');
  assert.ok(!fs.existsSync(path.join(dir, '.claude', 'hooks', 'edit-gate.cjs')), 'edit-gate hook should not be installed');
  assert.ok(!fs.existsSync(path.join(dir, '.claude', 'hooks', 'workflow-check.cjs')), 'workflow-check hook should not be installed');
  assert.ok(!fs.existsSync(path.join(dir, '.claude', 'skills', 'phase-handoff')), 'phase-handoff skill should not be installed');
  for (const removedDoc of ['PHASE_HANDOFF_PROTOCOL.md', 'HANDOFF_TEMPLATES.md', 'CONTEXT_BUDGET.md',
    'AGENCY_WORKFLOW.md', 'BRANCHING.md', 'DEFINITION_OF_DONE.md', 'TEAM_ROSTER.md',
    'COMMUNICATION_PROTOCOL.md', 'ARTIFACTS_AND_STORAGE.md', 'ASSISTANCE_PROFILES.md']) {
    assert.ok(!fs.existsSync(path.join(dir, 'docs', removedDoc)), `${removedDoc} should not be installed`);
  }
  // vendored skills carry MIT attribution; every install gets the full bundled process suite
  assert.match(fs.readFileSync(path.join(dir, '.claude/skills/NOTICE'), 'utf8'), /obra\/superpowers/);
  assert.ok(!fs.existsSync(path.join(dir, '.claude/skills/writing-skills')), 'writing-skills excluded from vendored set');
  for (const name of PROCESS_SKILLS) {
    assert.ok(hasSkill(dir, name), `should install ${name}`);
  }
  assert.ok(!fs.existsSync(path.join(dir, 'docs', 'en')), 'consumer docs should not include duplicate en tree');
  assert.ok(!fs.existsSync(path.join(dir, 'docs', 'vi')), 'consumer docs should not include duplicate vi tree');
  const claude = fs.readFileSync(path.join(dir, 'CLAUDE.md'), 'utf8');
  assert.match(claude, /hero-mmt-kit:start/);
  assert.match(claude, /using-hero/);
  assert.match(claude, /hero-planning/);
  assert.match(claude, /Context loading/);
  assert.match(claude, /Sub-agent delegation is optional, not automatic/);
  assert.match(claude, /User-facing replies and artifacts must use the user's language/i);
  assert.match(claude, /Avoid unnecessary English code-switching in non-English prose/i);
  assert.match(claude, /Keep code identifiers, commands, file paths, API names, configuration keys, and exact error messages verbatim/i);
  assert.match(claude, /briefly explain it in the user's language on first use/i);
  assert.match(claude, /lead with the conclusion or current status.*key facts or evidence.*next action/i);
  assert.match(claude, /Clarity, completeness, safety, and honesty outrank terseness/i);
  assert.doesNotMatch(
    claude,
    /Min words, max information density|Basic grammar only|Skip articles\/pronouns|1-3 lines preferred|Expand only if user asks|Assume user technical/i,
  );
  assert.doesNotMatch(claude, /## 1\. Task classification → workflow \(ROUTER\)/);
  assert.doesNotMatch(claude, /\| # \| Task type \| Trigger \/ example \| Path \| Gate \|/);
  assert.doesNotMatch(claude, /### Phase 1 — Discovery & Scoping/);
  assert.doesNotMatch(claude, /docs\/AGENCY_WORKFLOW\.md/);

  for (const file of [
    path.join(dir, 'CLAUDE.md'),
    ...allFiles(path.join(dir, 'docs')).filter((p) => p.endsWith('.md')),
  ]) {
    assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /\{\{[^}]+\}\}/, `unresolved template placeholder in ${file}`);
  }

  const usingHero = fs.readFileSync(path.join(dir, '.claude', 'skills', 'using-hero', 'SKILL.md'), 'utf8');
  assert.match(usingHero, /hero-planning/);
  assert.match(usingHero, /hero-coding/);
  assert.match(usingHero, /hero-reviewing/);
  assert.match(usingHero, /hero-unit-test/);
  assert.match(usingHero, /hero-security/);
  assert.match(usingHero, /hero-mr-review/);
  assert.match(usingHero, /hero-strict/);
  assert.doesNotMatch(usingHero, /TDD-first/i);

  const heroCoding = fs.readFileSync(path.join(dir, '.claude', 'skills', 'hero-coding', 'SKILL.md'), 'utf8');
  assert.match(heroCoding, /implementation-only stage/i);
  assert.match(heroCoding, /### Requirement state/);
  assert.doesNotMatch(heroCoding, /run relevant verification|build, lint, targeted tests/i);

  const heroReviewing = fs.readFileSync(path.join(dir, '.claude', 'skills', 'hero-reviewing', 'SKILL.md'), 'utf8');
  assert.match(heroReviewing, /TARGET=local/);
  assert.match(heroReviewing, /TARGET=commit:<revision>/);
  assert.match(heroReviewing, /BASE_REF=<base-revision>/);
  assert.match(heroReviewing, /untracked file/i);
  assert.match(heroReviewing, /MODE=review/);
  assert.match(heroReviewing, /MODE=assess-feedback/);
  assert.match(heroReviewing, /MODE=both/);
  for (const classification of ['confirmed', 'rejected', 'unclear', 'out-of-scope']) {
    assert.match(heroReviewing, new RegExp(classification, 'i'));
  }

  const heroUnitTest = fs.readFileSync(path.join(dir, '.claude', 'skills', 'hero-unit-test', 'SKILL.md'), 'utf8');
  assert.match(heroUnitTest, /post-implementation unit-testing stage/i);
  assert.match(heroUnitTest, /no production code was changed/i);
  assert.doesNotMatch(heroUnitTest, /TDD-first|test-driven-development/i);

  assert.match(claude, /implement and track every approved requirement\/task/i);
  assert.match(claude, /post-implementation unit tests/i);
  assert.doesNotMatch(claude, /TDD-first/i);

  const settings = JSON.parse(fs.readFileSync(path.join(dir, '.claude', 'settings.json'), 'utf8'));
  assert.ok(JSON.stringify(settings.hooks).includes('git-guard.cjs'));
  assert.ok(JSON.stringify(settings.hooks).includes('active-state-bridge.cjs'));
  assert.ok(settings.hooks.SessionStart, 'active-state-bridge should be wired on SessionStart');
  assert.ok(!settings.hooks.PostToolUse, 'no PostToolUse hook should remain (session-bridge removed)');

  const config = JSON.parse(fs.readFileSync(path.join(dir, '.hero-mmt-kit', 'config.json'), 'utf8'));
  assert.strictEqual(config.installTasteSkill, false);
  assert.ok(!Object.prototype.hasOwnProperty.call(config, 'lang'), 'new config should not include lang');

  const doc = cli(['doctor', '--dir', dir]);
  assert.strictEqual(doc.status, 0, 'doctor should pass: ' + doc.stdout + doc.stderr);
});

test('brownfield: preserves existing CLAUDE.md and ACTIVE_STATE; idempotent', () => {
  const dir = mkdir();
  fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'CLAUDE.md'), '# Mine\n\nPRESERVE ME\n');
  fs.writeFileSync(path.join(dir, 'src', 'a.ts'), 'export const a = 1;\n');
  fs.writeFileSync(path.join(dir, 'docs', 'ACTIVE_STATE.md'), 'CUSTOM STATE\n');
  fs.writeFileSync(path.join(dir, 'docs', 'BROWNFIELD_DISCOVERY.md'), 'CUSTOM DISCOVERY\n');

  assert.strictEqual(cli(['init', '--dir', dir, '--yes', '--skip-integrations']).status, 0);
  let claude = fs.readFileSync(path.join(dir, 'CLAUDE.md'), 'utf8');
  assert.match(claude, /PRESERVE ME/);
  assert.strictEqual((claude.match(/hero-mmt-kit:start/g) || []).length, 1);
  assert.match(fs.readFileSync(path.join(dir, 'docs', 'ACTIVE_STATE.md'), 'utf8'), /CUSTOM STATE/);
  assert.match(fs.readFileSync(path.join(dir, 'docs', 'BROWNFIELD_DISCOVERY.md'), 'utf8'), /CUSTOM DISCOVERY/);

  // idempotent second run
  assert.strictEqual(cli(['init', '--dir', dir, '--yes', '--skip-integrations']).status, 0);
  claude = fs.readFileSync(path.join(dir, 'CLAUDE.md'), 'utf8');
  assert.strictEqual((claude.match(/hero-mmt-kit:start/g) || []).length, 1, 'block not duplicated');
  const settings = JSON.parse(fs.readFileSync(path.join(dir, '.claude', 'settings.json'), 'utf8'));
  const ggCount = (JSON.stringify(settings.hooks).match(/git-guard\.cjs/g) || []).length;
  assert.strictEqual(ggCount, 1, 'hook not duplicated');

  fs.writeFileSync(
    path.join(dir, 'CLAUDE.md'),
    replaceManagedBlock(fs.readFileSync(path.join(dir, 'CLAUDE.md'), 'utf8') + '\nUSER CLAUDE FOOTER\n', 'STALE CLAUDE MANAGED GUIDANCE')
  );
  fs.writeFileSync(path.join(dir, 'docs', 'ACTIVE_STATE.md'), 'CUSTOM STATE AFTER INIT\n');
  // corrupt a framework-managed vendored skill; update must refresh it
  const skillFile = path.join(dir, '.claude', 'skills', 'brainstorming', 'SKILL.md');
  fs.writeFileSync(skillFile, 'CORRUPTED\n');
  // User-added skill dirs outside the framework-managed process suite are preserved.
  const unselectedSkill = path.join(dir, '.claude', 'skills', 'custom-user-skill', 'SKILL.md');
  fs.mkdirSync(path.dirname(unselectedSkill), { recursive: true });
  fs.writeFileSync(unselectedSkill, 'CUSTOM USER SKILL\n');
  const retiredReviewSkills = ['requesting-code-review', 'receiving-code-review'];
  for (const name of retiredReviewSkills) {
    const stale = path.join(dir, '.claude', 'skills', name, 'SKILL.md');
    fs.mkdirSync(path.dirname(stale), { recursive: true });
    fs.writeFileSync(stale, 'LEGACY REVIEW SKILL\n');
  }

  const upd = cli(['update', '--dir', dir]);
  assert.strictEqual(upd.status, 0, upd.stderr);
  assert.doesNotMatch(fs.readFileSync(skillFile, 'utf8'), /^CORRUPTED/, 'update should refresh selected vendored skill');
  assert.strictEqual(fs.readFileSync(unselectedSkill, 'utf8'), 'CUSTOM USER SKILL\n', 'update should preserve user-added skills');
  for (const name of retiredReviewSkills) {
    assert.ok(!fs.existsSync(path.join(dir, '.claude', 'skills', name)), `update should remove retired ${name}`);
  }

  claude = fs.readFileSync(path.join(dir, 'CLAUDE.md'), 'utf8');
  assert.match(claude, /PRESERVE ME/);
  assert.match(claude, /USER CLAUDE FOOTER/);
  assert.match(claude, /using-hero/);
  assert.match(claude, /Context loading/);
  assert.match(claude, /Avoid unnecessary English code-switching in non-English prose/i);
  assert.doesNotMatch(claude, /STALE CLAUDE MANAGED GUIDANCE/);
  assert.strictEqual((claude.match(/hero-mmt-kit:start/g) || []).length, 1);

  assert.strictEqual(fs.readFileSync(path.join(dir, 'docs', 'ACTIVE_STATE.md'), 'utf8'), 'CUSTOM STATE AFTER INIT\n');
});

test('init --yes writes default config and docs, taste skill off by default', () => {
  const dir = mkdir();
  const r = cli(['init', '--dir', dir, '--yes', '--skip-integrations']);
  assert.strictEqual(r.status, 0, r.stderr);

  const config = JSON.parse(fs.readFileSync(path.join(dir, '.hero-mmt-kit', 'config.json'), 'utf8'));
  assert.strictEqual(config.installTasteSkill, false);

  const claude = fs.readFileSync(path.join(dir, 'CLAUDE.md'), 'utf8');
  assert.doesNotMatch(claude, /\{\{[^}]+\}\}/, 'no unresolved template placeholders');
  assert.doesNotMatch(claude, /ASSISTANCE_PROFILE|PROJECT_SURFACE|VERIFICATION_LEVEL/);

  assert.ok(!fs.existsSync(path.join(dir, 'docs', 'ASSISTANCE_PROFILES.md')), 'profile reference doc should no longer be installed');
});

test('init --taste installs the design/taste skill integration', () => {
  const dir = mkdir();
  const r = cli(['init', '--dir', dir, '--yes', '--taste', '--skip-integrations']);
  assert.strictEqual(r.status, 0, r.stderr);

  const config = JSON.parse(fs.readFileSync(path.join(dir, '.hero-mmt-kit', 'config.json'), 'utf8'));
  assert.strictEqual(config.installTasteSkill, true);
});

test('update honors --taste and persists the change to config', () => {
  const dir = mkdir();
  const init = cli(['init', '--dir', dir, '--yes', '--skip-integrations']);
  assert.strictEqual(init.status, 0, init.stderr);

  const configPath = path.join(dir, '.hero-mmt-kit', 'config.json');
  assert.strictEqual(JSON.parse(fs.readFileSync(configPath, 'utf8')).installTasteSkill, false);

  const upd = cli(['update', '--dir', dir, '--taste']);
  assert.strictEqual(upd.status, 0, upd.stderr);
  assert.strictEqual(JSON.parse(fs.readFileSync(configPath, 'utf8')).installTasteSkill, true);
});
