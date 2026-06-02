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

test('init new project: files + no leftover placeholders + doctor passes', () => {
  const dir = mkdir();
  const r = cli(['init', '--dir', dir, '--yes', '--skip-integrations', '--name', 'SmokeApp', '--lang', 'en']);
  assert.strictEqual(r.status, 0, r.stderr);

  for (const f of ['CLAUDE.md', 'AGENTS.md', '.claude/settings.json', '.claude/hooks/git-guard.cjs',
    '.hero-vibe-kit/config.json', 'docs/AGENCY_WORKFLOW.md', 'docs/ARTIFACTS_AND_STORAGE.md',
    'docs/SECURITY_STANDARDS.md', 'docs/PERFORMANCE_STANDARDS.md', 'docs/ACTIVE_STATE.md',
    'docs/templates/PRD_AI_FEATURE.md']) {
    assert.ok(fs.existsSync(path.join(dir, f)), 'missing: ' + f);
  }
  assert.ok(!fs.existsSync(path.join(dir, 'docs', 'en')), 'consumer docs should not include duplicate en tree');
  assert.ok(!fs.existsSync(path.join(dir, 'docs', 'vi')), 'consumer docs should not include duplicate vi tree');
  const claude = fs.readFileSync(path.join(dir, 'CLAUDE.md'), 'utf8');
  assert.match(claude, /SmokeApp/);
  assert.match(claude, /hero-vibe-kit:start/);
  assert.doesNotMatch(claude, /\{\{/, 'no leftover {{ }}');

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

  assert.strictEqual(cli(['init', '--dir', dir, '--yes', '--skip-integrations', '--name', 'Legacy']).status, 0);
  let claude = fs.readFileSync(path.join(dir, 'CLAUDE.md'), 'utf8');
  assert.match(claude, /PRESERVE ME/);
  assert.strictEqual((claude.match(/hero-vibe-kit:start/g) || []).length, 1);
  assert.match(fs.readFileSync(path.join(dir, 'docs', 'ACTIVE_STATE.md'), 'utf8'), /CUSTOM STATE/);

  // idempotent second run
  assert.strictEqual(cli(['init', '--dir', dir, '--yes', '--skip-integrations', '--name', 'Legacy']).status, 0);
  claude = fs.readFileSync(path.join(dir, 'CLAUDE.md'), 'utf8');
  assert.strictEqual((claude.match(/hero-vibe-kit:start/g) || []).length, 1, 'block not duplicated');
  const settings = JSON.parse(fs.readFileSync(path.join(dir, '.claude', 'settings.json'), 'utf8'));
  const ggCount = (JSON.stringify(settings.hooks).match(/git-guard\.cjs/g) || []).length;
  assert.strictEqual(ggCount, 1, 'hook not duplicated');
});
