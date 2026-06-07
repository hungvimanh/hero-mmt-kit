'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const PKG_ROOT = path.join(__dirname, '..');
const {
  CORE_SKILL_ORDER,
  installSkills,
  selectProcessSkills,
} = require('../src/skills.cjs');

function mkdir() { return fs.mkdtempSync(path.join(os.tmpdir(), 'hvk-skills-')); }
function hasSkill(dir, name) { return fs.existsSync(path.join(dir, '.claude', 'skills', name, 'SKILL.md')); }

const BASELINE = [
  'using-superpowers',
  'brainstorming',
  'writing-plans',
  'executing-plans',
  'systematic-debugging',
  'verification-before-completion',
  'phase-handoff',
];

test('selectProcessSkills returns lean baseline for coding assistant frontend minimal', () => {
  const selected = selectProcessSkills({
    assistanceProfile: 'coding-assistant',
    projectSurface: 'frontend',
    verificationLevel: 'minimal',
  });

  assert.deepStrictEqual(selected, BASELINE);
  for (const name of ['test-driven-development', 'requesting-code-review', 'receiving-code-review', 'using-git-worktrees', 'finishing-a-development-branch']) {
    assert.ok(!selected.includes(name), `${name} should not be selected`);
  }
});

test('selectProcessSkills adds fullstack delegation helpers for pragmatic coding assistant', () => {
  const selected = selectProcessSkills({
    assistanceProfile: 'coding-assistant',
    projectSurface: 'fullstack',
    verificationLevel: 'pragmatic',
  });

  assert.ok(selected.includes('dispatching-parallel-agents'));
  assert.ok(selected.includes('subagent-driven-development'));
  assert.ok(!selected.includes('test-driven-development'));
  assert.ok(!selected.includes('requesting-code-review'));
  assert.ok(!selected.includes('using-git-worktrees'));
  assert.ok(!selected.includes('finishing-a-development-branch'));
});

test('selectProcessSkills adds strict verification helpers for coding assistant', () => {
  const selected = selectProcessSkills({
    assistanceProfile: 'coding-assistant',
    projectSurface: 'backend',
    verificationLevel: 'strict',
  });

  for (const name of ['test-driven-development', 'requesting-code-review', 'receiving-code-review']) {
    assert.ok(selected.includes(name), `${name} should be selected`);
  }
  assert.ok(!selected.includes('using-git-worktrees'));
  assert.ok(!selected.includes('finishing-a-development-branch'));
});

test('selectProcessSkills installs the full process suite for vibecode', () => {
  const selected = selectProcessSkills({
    assistanceProfile: 'vibecode',
    projectSurface: 'backend',
    verificationLevel: 'strict',
  });

  assert.deepStrictEqual(selected, CORE_SKILL_ORDER);
});

test('installSkills copies only selected skill directories plus NOTICE', () => {
  const dir = mkdir();
  const result = installSkills(PKG_ROOT, dir, { selectedSkills: ['using-superpowers', 'brainstorming'] });

  assert.strictEqual(result.skills, 2);
  assert.deepStrictEqual(result.selectedSkills, ['using-superpowers', 'brainstorming']);
  assert.ok(fs.existsSync(path.join(dir, '.claude', 'skills', 'NOTICE')), 'NOTICE should be installed');
  assert.ok(hasSkill(dir, 'using-superpowers'));
  assert.ok(hasSkill(dir, 'brainstorming'));
  assert.ok(fs.existsSync(path.join(dir, '.claude', 'skills', 'brainstorming', 'scripts', 'server.cjs')), 'nested skill scripts should be installed');
  assert.ok(!fs.existsSync(path.join(dir, '.claude', 'skills', 'test-driven-development')));
});

test('installSkills preserves unselected existing skill directories', () => {
  const dir = mkdir();
  const custom = path.join(dir, '.claude', 'skills', 'test-driven-development', 'SKILL.md');
  fs.mkdirSync(path.dirname(custom), { recursive: true });
  fs.writeFileSync(custom, 'CUSTOM USER CONTENT\n');

  installSkills(PKG_ROOT, dir, { selectedSkills: ['brainstorming'] });

  assert.strictEqual(fs.readFileSync(custom, 'utf8'), 'CUSTOM USER CONTENT\n');
  assert.ok(hasSkill(dir, 'brainstorming'));
});

test('installSkills refreshes selected corrupted skill directories', () => {
  const dir = mkdir();
  installSkills(PKG_ROOT, dir, { selectedSkills: ['brainstorming'] });
  const skillFile = path.join(dir, '.claude', 'skills', 'brainstorming', 'SKILL.md');
  fs.writeFileSync(skillFile, 'CORRUPTED\n');

  installSkills(PKG_ROOT, dir, { selectedSkills: ['brainstorming'] });

  assert.doesNotMatch(fs.readFileSync(skillFile, 'utf8'), /^CORRUPTED/);
});

test('installSkills prunes stale files inside selected skill directories', () => {
  const dir = mkdir();
  installSkills(PKG_ROOT, dir, { selectedSkills: ['brainstorming'] });
  const staleFile = path.join(dir, '.claude', 'skills', 'brainstorming', 'stale-helper.md');
  fs.writeFileSync(staleFile, 'STALE\n');

  installSkills(PKG_ROOT, dir, { selectedSkills: ['brainstorming'] });

  assert.ok(!fs.existsSync(staleFile), 'selected skill directory should be replaced, not merged');
});
