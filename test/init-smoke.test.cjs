'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const BIN = path.join(__dirname, '..', 'bin', 'hero-vibe-kit.js');
function cli(args, opts) { return spawnSync('node', [BIN, ...args], Object.assign({ encoding: 'utf8' }, opts)); }
function mkdir() { return fs.mkdtempSync(path.join(os.tmpdir(), 'hvk-')); }
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
  const r = cli(['init', '--dir', dir, '--yes', '--skip-integrations', '--name', 'SmokeApp', '--lang', 'en']);
  assert.strictEqual(r.status, 0, r.stderr);

  for (const f of ['CLAUDE.md', 'AGENTS.md', '.claude/settings.json', '.claude/hooks/git-guard.cjs',
    '.hero-vibe-kit/config.json', 'docs/AGENCY_WORKFLOW.md', 'docs/ARTIFACTS_AND_STORAGE.md',
    'docs/SECURITY_STANDARDS.md', 'docs/PERFORMANCE_STANDARDS.md', 'docs/ACTIVE_STATE.md',
    'docs/DESIGN_STANDARDS.md', 'docs/BROWNFIELD_DISCOVERY.md', 'docs/PHASE_HANDOFF_PROTOCOL.md',
    'docs/CONTEXT_BUDGET.md', 'docs/HANDOFF_TEMPLATES.md', 'docs/templates/PRD_AI_FEATURE.md',
    'docs/templates/DESIGN_BRIEF.md',
    '.claude/skills/NOTICE', '.claude/skills/brainstorming/SKILL.md',
    '.claude/skills/test-driven-development/SKILL.md', '.claude/skills/requesting-code-review/SKILL.md',
    '.claude/skills/phase-handoff/SKILL.md']) {
    assert.ok(fs.existsSync(path.join(dir, f)), 'missing: ' + f);
  }
  // vendored skills carry MIT attribution; excluded meta skill is not shipped
  assert.match(fs.readFileSync(path.join(dir, '.claude/skills/NOTICE'), 'utf8'), /obra\/superpowers/);
  assert.ok(!fs.existsSync(path.join(dir, '.claude/skills/writing-skills')), 'writing-skills excluded from vendored set');
  assert.ok(!fs.existsSync(path.join(dir, 'docs', 'en')), 'consumer docs should not include duplicate en tree');
  assert.ok(!fs.existsSync(path.join(dir, 'docs', 'vi')), 'consumer docs should not include duplicate vi tree');
  const claude = fs.readFileSync(path.join(dir, 'CLAUDE.md'), 'utf8');
  assert.match(claude, /SmokeApp/);
  assert.match(claude, /hero-vibe-kit:start/);
  assert.match(claude, /docs\/AGENCY_WORKFLOW\.md/);
  assert.match(claude, /single source of truth/i);
  assert.match(claude, /Context loading/);
  assert.match(claude, /Sub-agent delegation is path-triggered/);
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
  assert.match(workflow, /Sub-agent delegation is path-triggered/);
  assert.match(workflow, /MUST spawn.*review sub-agent/);
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
  assert.match(roster, /Standard path.*MUST spawn a review sub-agent/);
  assert.match(roster, /Brownfield first change/);
  // subagent policy recalibrated: review/QA required, implementation delegation optional
  assert.match(roster, /When NOT to use a sub-agent/i);
  assert.match(roster, /OPTIONAL/);
  assert.doesNotMatch(roster, /MUST delegate.*implementation/i);
  assert.doesNotMatch(workflow, /MUST delegate.*implementation/i);

  const settings = JSON.parse(fs.readFileSync(path.join(dir, '.claude', 'settings.json'), 'utf8'));
  assert.ok(JSON.stringify(settings.hooks).includes('git-guard.cjs'));

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

  assert.strictEqual(cli(['init', '--dir', dir, '--yes', '--skip-integrations', '--name', 'Legacy']).status, 0);
  let claude = fs.readFileSync(path.join(dir, 'CLAUDE.md'), 'utf8');
  assert.match(claude, /PRESERVE ME/);
  assert.strictEqual((claude.match(/hero-vibe-kit:start/g) || []).length, 1);
  assert.match(fs.readFileSync(path.join(dir, 'docs', 'ACTIVE_STATE.md'), 'utf8'), /CUSTOM STATE/);
  assert.match(fs.readFileSync(path.join(dir, 'docs', 'BROWNFIELD_DISCOVERY.md'), 'utf8'), /CUSTOM DISCOVERY/);

  // idempotent second run
  assert.strictEqual(cli(['init', '--dir', dir, '--yes', '--skip-integrations', '--name', 'Legacy']).status, 0);
  claude = fs.readFileSync(path.join(dir, 'CLAUDE.md'), 'utf8');
  assert.strictEqual((claude.match(/hero-vibe-kit:start/g) || []).length, 1, 'block not duplicated');
  const settings = JSON.parse(fs.readFileSync(path.join(dir, '.claude', 'settings.json'), 'utf8'));
  const ggCount = (JSON.stringify(settings.hooks).match(/git-guard\.cjs/g) || []).length;
  assert.strictEqual(ggCount, 1, 'hook not duplicated');

  fs.writeFileSync(
    path.join(dir, 'CLAUDE.md'),
    replaceManagedBlock(fs.readFileSync(path.join(dir, 'CLAUDE.md'), 'utf8') + '\nUSER CLAUDE FOOTER\n', 'STALE CLAUDE MANAGED GUIDANCE')
  );
  fs.writeFileSync(
    path.join(dir, 'AGENTS.md'),
    replaceManagedBlock(fs.readFileSync(path.join(dir, 'AGENTS.md'), 'utf8') + '\nUSER AGENTS FOOTER\n', 'STALE AGENTS MANAGED GUIDANCE')
  );
  fs.writeFileSync(path.join(dir, 'docs', 'ACTIVE_STATE.md'), 'CUSTOM STATE AFTER INIT\n');
  // corrupt a framework-managed vendored skill; update must refresh it
  const skillFile = path.join(dir, '.claude', 'skills', 'brainstorming', 'SKILL.md');
  fs.writeFileSync(skillFile, 'CORRUPTED\n');

  const upd = cli(['update', '--dir', dir]);
  assert.strictEqual(upd.status, 0, upd.stderr);
  assert.doesNotMatch(fs.readFileSync(skillFile, 'utf8'), /^CORRUPTED/, 'update should refresh vendored skill');

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
  assert.match(agents, /Sub-agent delegation is path-triggered/);
  assert.doesNotMatch(agents, /STALE AGENTS MANAGED GUIDANCE/);
  assert.strictEqual((agents.match(/hero-vibe-kit:start/g) || []).length, 1);

  assert.strictEqual(fs.readFileSync(path.join(dir, 'docs', 'ACTIVE_STATE.md'), 'utf8'), 'CUSTOM STATE AFTER INIT\n');
});
