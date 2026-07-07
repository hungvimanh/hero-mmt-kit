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
function hasSkill(dir, name, rel = '.claude/skills') { return fs.existsSync(path.join(dir, rel, name, 'SKILL.md')); }

test('selectProcessSkills returns the full process suite for every profile', () => {
  for (const cfg of [
    { assistanceProfile: 'coding-assistant', projectSurface: 'backend', verificationLevel: 'minimal' },
    { assistanceProfile: 'coding-assistant', projectSurface: 'frontend', verificationLevel: 'pragmatic' },
    { assistanceProfile: 'coding-assistant', projectSurface: 'fullstack', verificationLevel: 'strict' },
    { assistanceProfile: 'vibecode', projectSurface: 'fullstack', verificationLevel: 'strict' },
  ]) {
    assert.deepStrictEqual(selectProcessSkills(cfg), CORE_SKILL_ORDER);
  }
});

test('installSkills copies selected skill directories plus NOTICE', () => {
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

test('installSkills copies all process skills selected by profile selection', () => {
  const dir = mkdir();
  const result = installSkills(PKG_ROOT, dir, { selectedSkills: selectProcessSkills({ assistanceProfile: 'coding-assistant', projectSurface: 'backend' }) });

  assert.strictEqual(result.skills, CORE_SKILL_ORDER.length);
  assert.deepStrictEqual(result.selectedSkills, CORE_SKILL_ORDER);
  for (const name of CORE_SKILL_ORDER) assert.ok(hasSkill(dir, name), `missing ${name}`);
});

test('installSkills mirrors selected skills to multiple destinations', () => {
  const dir = mkdir();
  installSkills(PKG_ROOT, dir, { selectedSkills: ['brainstorming'], destinations: ['.claude/skills', '.cursor/skills'] });

  assert.ok(hasSkill(dir, 'brainstorming', '.claude/skills'));
  assert.ok(hasSkill(dir, 'brainstorming', '.cursor/skills'));
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
