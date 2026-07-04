'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const BIN = path.join(__dirname, '..', 'bin', 'hero-vibe-kit.js');
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
    /<!-- hero-vibe-kit:start -->[\s\S]*?<!-- hero-vibe-kit:end -->/,
    `<!-- hero-vibe-kit:start -->\n${replacement}\n<!-- hero-vibe-kit:end -->`
  );
}

test('init new project: files + no leftover placeholders + doctor passes', () => {
  const dir = mkdir();
  const r = cli(['init', '--dir', dir, '--yes', '--skip-integrations', '--ide', 'both']);
  assert.strictEqual(r.status, 0, r.stderr);

  for (const f of ['CLAUDE.md', 'AGENTS.md', '.claude/settings.json', '.claude/hooks/git-guard.cjs',
    '.cursor/hooks.json', '.cursor/hooks/git-guard.cjs', '.cursor/hooks/stop-reminder.cjs',
    '.cursor/rules/hero-vibe-kit.mdc',
    '.hero-vibe-kit/config.json', '.hero-vibe-kit/session.json', 'docs/AGENCY_WORKFLOW.md', 'docs/ARTIFACTS_AND_STORAGE.md',
    'docs/SECURITY_STANDARDS.md', 'docs/PERFORMANCE_STANDARDS.md', 'docs/ACTIVE_STATE.md',
    'docs/DESIGN_STANDARDS.md', 'docs/BROWNFIELD_DISCOVERY.md', 'docs/PHASE_HANDOFF_PROTOCOL.md',
    'docs/CONTEXT_BUDGET.md', 'docs/HANDOFF_TEMPLATES.md', 'docs/templates/PRD_AI_FEATURE.md',
    'docs/templates/DESIGN_BRIEF.md',
    '.claude/skills/NOTICE', '.claude/skills/brainstorming/SKILL.md',
    '.claude/skills/dispatching-parallel-agents/SKILL.md', '.claude/skills/subagent-driven-development/SKILL.md',
    '.claude/skills/phase-handoff/SKILL.md',
    '.cursor/skills/NOTICE', '.cursor/skills/brainstorming/SKILL.md',
    '.cursor/skills/dispatching-parallel-agents/SKILL.md', '.cursor/skills/subagent-driven-development/SKILL.md',
    '.cursor/skills/phase-handoff/SKILL.md']) {
    assert.ok(fs.existsSync(path.join(dir, f)), 'missing: ' + f);
  }
  // vendored skills carry MIT attribution; default Coding Assistant installs a selected subset
  assert.match(fs.readFileSync(path.join(dir, '.claude/skills/NOTICE'), 'utf8'), /obra\/superpowers/);
  assert.ok(!fs.existsSync(path.join(dir, '.claude/skills/writing-skills')), 'writing-skills excluded from vendored set');
  assert.ok(!hasSkill(dir, 'test-driven-development'), 'default pragmatic Coding Assistant should not install TDD skill');
  assert.ok(!hasSkill(dir, 'requesting-code-review'), 'default pragmatic Coding Assistant should not install review skill');
  assert.ok(!hasSkill(dir, 'using-git-worktrees'), 'default pragmatic Coding Assistant should not install worktree skill');
  assert.ok(!hasSkill(dir, 'finishing-a-development-branch'), 'default pragmatic Coding Assistant should not install branch finishing skill');
  assert.ok(hasSkill(dir, 'brainstorming', '.cursor/skills'), 'cursor skills should mirror claude selection');
  assert.ok(!fs.existsSync(path.join(dir, 'docs', 'en')), 'consumer docs should not include duplicate en tree');
  assert.ok(!fs.existsSync(path.join(dir, 'docs', 'vi')), 'consumer docs should not include duplicate vi tree');
  const claude = fs.readFileSync(path.join(dir, 'CLAUDE.md'), 'utf8');
  assert.match(claude, /hero-vibe-kit:start/);
  assert.match(claude, /docs\/AGENCY_WORKFLOW\.md/);
  assert.match(claude, /single source of truth/i);
  assert.match(claude, /Context loading/);
  assert.match(claude, /Sub-agent delegation follows the active profile/);
  assert.doesNotMatch(claude, /## 1\. Task classification → workflow \(ROUTER\)/);
  assert.doesNotMatch(claude, /\| # \| Task type \| Trigger \/ example \| Path \| Gate \|/);
  assert.doesNotMatch(claude, /### Phase 1 — Discovery & Scoping/);

  for (const file of [
    path.join(dir, 'CLAUDE.md'),
    path.join(dir, 'AGENTS.md'),
    ...allFiles(path.join(dir, 'docs')).filter((p) => p.endsWith('.md')),
  ]) {
    assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /\{\{[^}]+\}\}/, `unresolved template placeholder in ${file}`);
  }

  const workflow = fs.readFileSync(path.join(dir, 'docs', 'AGENCY_WORKFLOW.md'), 'utf8');
  assert.match(workflow, /Sub-agents are escalation tools, not default ceremony/);
  assert.match(workflow, /adaptive review budget/i);
  assert.match(workflow, /Coding Assistant pragmatic work may finish with targeted verification plus explicit developer review handoff/);
  assert.match(workflow, /PHASE_HANDOFF_PROTOCOL\.md/);
  assert.match(workflow, /Tiny[\s\S]*Small[\s\S]*Standard[\s\S]*Full/);

  const contextBudget = fs.readFileSync(path.join(dir, 'docs', 'CONTEXT_BUDGET.md'), 'utf8');
  for (const expected of ['artifact-first', 'Sanity check', 'Evidence freshness', 'Final claims']) {
    assert.match(contextBudget, new RegExp(expected), `context budget should contain ${expected}`);
  }

  const phaseHandoffSkill = fs.readFileSync(path.join(dir, '.claude', 'skills', 'phase-handoff', 'SKILL.md'), 'utf8');
  assert.match(phaseHandoffSkill, /^name: phase-handoff$/m);
  assert.match(phaseHandoffSkill, /workflow phase boundaries/);

  const roster = fs.readFileSync(path.join(dir, 'docs', 'TEAM_ROSTER.md'), 'utf8');
  assert.match(roster, /Adaptive delegation and review budget/);
  assert.match(roster, /Security-sensitive work.*requires security review/);
  assert.doesNotMatch(roster, /Security-sensitive work.*not-run note/i);
  assert.match(roster, /Brownfield first change/);
  assert.match(roster, /When NOT to use a sub-agent/i);
  assert.doesNotMatch(roster, /MUST spawn a review sub-agent/i);
  assert.doesNotMatch(roster, /MUST delegate.*implementation/i);
  assert.doesNotMatch(workflow, /MUST delegate.*implementation/i);

  const settings = JSON.parse(fs.readFileSync(path.join(dir, '.claude', 'settings.json'), 'utf8'));
  assert.ok(JSON.stringify(settings.hooks).includes('git-guard.cjs'));
  const cursorHooks = JSON.parse(fs.readFileSync(path.join(dir, '.cursor', 'hooks.json'), 'utf8'));
  assert.ok(JSON.stringify(cursorHooks.hooks).includes('git-guard.cjs'));
  const cursorRule = fs.readFileSync(path.join(dir, '.cursor', 'rules', 'hero-vibe-kit.mdc'), 'utf8');
  assert.match(cursorRule, /alwaysApply: true/);
  assert.match(cursorRule, /Plan mode/);
  const config = JSON.parse(fs.readFileSync(path.join(dir, '.hero-vibe-kit', 'config.json'), 'utf8'));
  assert.deepStrictEqual(config.ideTargets, ['claude-code', 'cursor']);
  assert.ok(!Object.prototype.hasOwnProperty.call(config, 'lang'), 'new config should not include lang');

  const session = JSON.parse(fs.readFileSync(path.join(dir, '.hero-vibe-kit', 'session.json'), 'utf8'));
  assert.strictEqual(session.schemaVersion, 1, 'session.json must have schemaVersion 1');
  assert.strictEqual(session.phase, null, 'fresh session phase must be null');
  assert.ok(Object.prototype.hasOwnProperty.call(session, 'loop'), 'session must have loop field');

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

  assert.strictEqual(cli(['init', '--dir', dir, '--yes', '--skip-integrations', '--ide', 'both']).status, 0);
  let claude = fs.readFileSync(path.join(dir, 'CLAUDE.md'), 'utf8');
  assert.match(claude, /PRESERVE ME/);
  assert.strictEqual((claude.match(/hero-vibe-kit:start/g) || []).length, 1);
  assert.match(fs.readFileSync(path.join(dir, 'docs', 'ACTIVE_STATE.md'), 'utf8'), /CUSTOM STATE/);
  assert.match(fs.readFileSync(path.join(dir, 'docs', 'BROWNFIELD_DISCOVERY.md'), 'utf8'), /CUSTOM DISCOVERY/);

  // idempotent second run
  assert.strictEqual(cli(['init', '--dir', dir, '--yes', '--skip-integrations', '--ide', 'both']).status, 0);
  claude = fs.readFileSync(path.join(dir, 'CLAUDE.md'), 'utf8');
  assert.strictEqual((claude.match(/hero-vibe-kit:start/g) || []).length, 1, 'block not duplicated');
  const settings = JSON.parse(fs.readFileSync(path.join(dir, '.claude', 'settings.json'), 'utf8'));
  const ggCount = (JSON.stringify(settings.hooks).match(/git-guard\.cjs/g) || []).length;
  assert.strictEqual(ggCount, 1, 'hook not duplicated');
  const cursorHooks = JSON.parse(fs.readFileSync(path.join(dir, '.cursor', 'hooks.json'), 'utf8'));
  const cursorGgCount = (JSON.stringify(cursorHooks.hooks).match(/git-guard\.cjs/g) || []).length;
  assert.strictEqual(cursorGgCount, 1, 'cursor hook not duplicated');

  fs.writeFileSync(
    path.join(dir, 'CLAUDE.md'),
    replaceManagedBlock(fs.readFileSync(path.join(dir, 'CLAUDE.md'), 'utf8') + '\nUSER CLAUDE FOOTER\n', 'STALE CLAUDE MANAGED GUIDANCE')
  );
  fs.writeFileSync(
    path.join(dir, 'AGENTS.md'),
    replaceManagedBlock(fs.readFileSync(path.join(dir, 'AGENTS.md'), 'utf8') + '\nUSER AGENTS FOOTER\n', 'STALE AGENTS MANAGED GUIDANCE')
  );
  fs.writeFileSync(path.join(dir, 'docs', 'ACTIVE_STATE.md'), 'CUSTOM STATE AFTER INIT\n');
  // corrupt a selected framework-managed vendored skill; update must refresh it
  const skillFile = path.join(dir, '.claude', 'skills', 'brainstorming', 'SKILL.md');
  fs.writeFileSync(skillFile, 'CORRUPTED\n');
  // Existing unselected skill dirs are preserved, not pruned or refreshed.
  const unselectedSkill = path.join(dir, '.claude', 'skills', 'using-git-worktrees', 'SKILL.md');
  fs.mkdirSync(path.dirname(unselectedSkill), { recursive: true });
  fs.writeFileSync(unselectedSkill, 'CUSTOM UNSELECTED SKILL\n');

  const upd = cli(['update', '--dir', dir]);
  assert.strictEqual(upd.status, 0, upd.stderr);
  assert.doesNotMatch(fs.readFileSync(skillFile, 'utf8'), /^CORRUPTED/, 'update should refresh selected vendored skill');
  assert.strictEqual(fs.readFileSync(unselectedSkill, 'utf8'), 'CUSTOM UNSELECTED SKILL\n', 'update should preserve unselected skills');

  claude = fs.readFileSync(path.join(dir, 'CLAUDE.md'), 'utf8');
  assert.match(claude, /PRESERVE ME/);
  assert.match(claude, /USER CLAUDE FOOTER/);
  assert.match(claude, /docs\/AGENCY_WORKFLOW\.md/);
  assert.match(claude, /single source of truth/i);
  assert.match(claude, /Context loading/);
  assert.doesNotMatch(claude, /STALE CLAUDE MANAGED GUIDANCE/);
  assert.strictEqual((claude.match(/hero-vibe-kit:start/g) || []).length, 1);

  const agents = fs.readFileSync(path.join(dir, 'AGENTS.md'), 'utf8');
  assert.match(agents, /USER AGENTS FOOTER/);
  assert.match(agents, /docs\/AGENCY_WORKFLOW\.md/);
  assert.match(agents, /Sub-agent delegation follows the active profile/);
  assert.doesNotMatch(agents, /STALE AGENTS MANAGED GUIDANCE/);
  assert.strictEqual((agents.match(/hero-vibe-kit:start/g) || []).length, 1);

  assert.strictEqual(fs.readFileSync(path.join(dir, 'docs', 'ACTIVE_STATE.md'), 'utf8'), 'CUSTOM STATE AFTER INIT\n');
});

test('init --yes writes default assistance profile config and docs', () => {
  const dir = mkdir();
  const r = cli(['init', '--dir', dir, '--yes', '--skip-integrations', '--ide', 'claude-code']);
  assert.strictEqual(r.status, 0, r.stderr);

  const config = JSON.parse(fs.readFileSync(path.join(dir, '.hero-vibe-kit', 'config.json'), 'utf8'));
  assert.strictEqual(config.assistanceProfile, 'coding-assistant');
  assert.strictEqual(config.projectSurface, 'fullstack');
  assert.strictEqual(config.verificationLevel, 'pragmatic');
  assert.deepStrictEqual(config.ideTargets, ['claude-code']);

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
  const r = cli(['init', '--dir', dir, '--yes', '--skip-integrations', '--profile', 'vibecode', '--surface', 'backend', '--ide', 'claude-code']);
  assert.strictEqual(r.status, 0, r.stderr);

  const config = JSON.parse(fs.readFileSync(path.join(dir, '.hero-vibe-kit', 'config.json'), 'utf8'));
  assert.strictEqual(config.assistanceProfile, 'vibecode');
  assert.strictEqual(config.projectSurface, 'backend');
  assert.strictEqual(config.verificationLevel, 'strict');

  for (const name of PROCESS_SKILLS) assert.ok(hasSkill(dir, name), `vibecode should install ${name}`);

  const claude = fs.readFileSync(path.join(dir, 'CLAUDE.md'), 'utf8');
  assert.match(claude, /Active assistance profile: Vibecode/);
  assert.match(claude, /Project surface: Backend/);
});

test('init accepts coding assistant frontend minimal verification flags', () => {
  const dir = mkdir();
  const r = cli(['init', '--dir', dir, '--yes', '--skip-integrations', '--profile', 'coding-assistant', '--surface', 'frontend', '--verify', 'minimal', '--ide', 'claude-code']);
  assert.strictEqual(r.status, 0, r.stderr);

  const config = JSON.parse(fs.readFileSync(path.join(dir, '.hero-vibe-kit', 'config.json'), 'utf8'));
  assert.strictEqual(config.assistanceProfile, 'coding-assistant');
  assert.strictEqual(config.projectSurface, 'frontend');
  assert.strictEqual(config.verificationLevel, 'minimal');

  for (const name of ['using-superpowers', 'brainstorming', 'writing-plans', 'executing-plans', 'systematic-debugging', 'verification-before-completion', 'phase-handoff']) {
    assert.ok(hasSkill(dir, name), `frontend minimal should install ${name}`);
  }
  for (const name of ['test-driven-development', 'requesting-code-review', 'dispatching-parallel-agents', 'subagent-driven-development', 'using-git-worktrees', 'finishing-a-development-branch']) {
    assert.ok(!hasSkill(dir, name), `frontend minimal should not install ${name}`);
  }
});

test('init --yes without --ide fails before writing config', () => {
  const dir = mkdir();
  const r = cli(['init', '--dir', dir, '--yes', '--skip-integrations']);
  assert.notStrictEqual(r.status, 0);
  assert.match(r.stderr + r.stdout, /requires --ide/i);
  assert.ok(!fs.existsSync(path.join(dir, '.hero-vibe-kit', 'config.json')));
});

test('init --ide cursor installs cursor surfaces only', () => {
  const dir = mkdir();
  const r = cli(['init', '--dir', dir, '--yes', '--skip-integrations', '--ide', 'cursor']);
  assert.strictEqual(r.status, 0, r.stderr);

  assert.ok(fs.existsSync(path.join(dir, '.cursor', 'rules', 'hero-vibe-kit.mdc')));
  assert.ok(fs.existsSync(path.join(dir, '.cursor', 'skills', 'brainstorming', 'SKILL.md')));
  assert.ok(!fs.existsSync(path.join(dir, '.claude', 'settings.json')));
  assert.ok(!fs.existsSync(path.join(dir, '.claude', 'skills', 'brainstorming', 'SKILL.md')));

  const config = JSON.parse(fs.readFileSync(path.join(dir, '.hero-vibe-kit', 'config.json'), 'utf8'));
  assert.deepStrictEqual(config.ideTargets, ['cursor']);

  const doc = cli(['doctor', '--dir', dir]);
  assert.strictEqual(doc.status, 0, 'doctor should pass for cursor-only: ' + doc.stdout + doc.stderr);
});

test('init rejects invalid profile flags before writing config', () => {
  const dir = mkdir();
  const r = cli(['init', '--dir', dir, '--yes', '--skip-integrations', '--profile', 'autopilot', '--ide', 'claude-code']);
  assert.notStrictEqual(r.status, 0);
  assert.match(r.stderr + r.stdout, /Invalid --profile: autopilot/);
  assert.ok(!fs.existsSync(path.join(dir, '.hero-vibe-kit', 'config.json')), 'config should not be written after invalid flags');
});

test('update backfills profile fields and accepts overrides', () => {
  const dir = mkdir();
  const init = cli(['init', '--dir', dir, '--yes', '--skip-integrations', '--ide', 'claude-code']);
  assert.strictEqual(init.status, 0, init.stderr);

  const configPath = path.join(dir, '.hero-vibe-kit', 'config.json');
  const oldConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  delete oldConfig.assistanceProfile;
  delete oldConfig.projectSurface;
  delete oldConfig.verificationLevel;
  fs.writeFileSync(configPath, JSON.stringify(oldConfig, null, 2) + '\n');

  const upd = cli(['update', '--dir', dir, '--profile', 'vibecode', '--surface', 'backend', '--verify', 'minimal']);
  assert.strictEqual(upd.status, 0, upd.stderr);

  const migrated = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  assert.strictEqual(migrated.assistanceProfile, 'vibecode');
  assert.strictEqual(migrated.projectSurface, 'backend');
  assert.strictEqual(migrated.verificationLevel, 'minimal');

  const agents = fs.readFileSync(path.join(dir, 'AGENTS.md'), 'utf8');
  assert.match(agents, /Active assistance profile: Vibecode/);
  assert.match(agents, /Project surface: Backend/);
});
