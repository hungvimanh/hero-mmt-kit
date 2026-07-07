'use strict';
const test = require('node:test');
const assert = require('node:assert');
const {
  normalizeProfileConfig,
  buildProfileVars,
  collectProfileConfig,
  defaultVerification,
  skillDestinations,
} = require('../src/profile-config.cjs');

test('profile config defaults to coding assistant fullstack pragmatic', () => {
  const cfg = normalizeProfileConfig({}, {});
  assert.strictEqual(cfg.assistanceProfile, 'coding-assistant');
  assert.strictEqual(cfg.projectSurface, 'fullstack');
  assert.strictEqual(cfg.verificationLevel, 'pragmatic');
  assert.deepStrictEqual(cfg.ideTargets, ['claude-code']);
});

test('vibecode defaults verification to strict', () => {
  const cfg = normalizeProfileConfig({}, { profile: 'vibecode' });
  assert.strictEqual(cfg.assistanceProfile, 'vibecode');
  assert.strictEqual(cfg.projectSurface, 'fullstack');
  assert.strictEqual(cfg.verificationLevel, 'strict');
  assert.strictEqual(defaultVerification('vibecode'), 'strict');
});

test('explicit verification flag overrides profile default while vibecode ignores surface', () => {
  const cfg = normalizeProfileConfig({}, {
    profile: 'vibecode',
    surface: 'backend',
    verify: 'minimal',
  });
  assert.strictEqual(cfg.assistanceProfile, 'vibecode');
  assert.strictEqual(cfg.projectSurface, 'fullstack');
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
  assert.strictEqual(cfg.projectSurface, 'fullstack');
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

test('collectProfileConfig skips surface prompt for vibecode', async () => {
  const prompts = [];
  const ask = {
    choice(label, choices, defaultIndex) {
      prompts.push(label);
      if (label === 'Assistance profile:') return 'vibecode';
      if (label === 'IDE target:') return 'claude-code';
      return choices[defaultIndex];
    },
  };

  const cfg = await collectProfileConfig({}, {}, ask, false);

  assert.deepStrictEqual(prompts, ['Assistance profile:', 'IDE target:']);
  assert.strictEqual(cfg.assistanceProfile, 'vibecode');
  assert.strictEqual(cfg.projectSurface, 'fullstack');
  assert.strictEqual(cfg.verificationLevel, 'strict');
});

test('collectProfileConfig asks surface for coding assistant', async () => {
  const prompts = [];
  const ask = {
    choice(label, choices, defaultIndex) {
      prompts.push(label);
      if (label === 'Assistance profile:') return 'coding-assistant';
      if (label === 'Project surface:') return 'backend';
      if (label === 'IDE target:') return 'claude-code';
      return choices[defaultIndex];
    },
  };

  const cfg = await collectProfileConfig({}, {}, ask, false);

  assert.deepStrictEqual(prompts, ['Assistance profile:', 'Project surface:', 'IDE target:']);
  assert.strictEqual(cfg.assistanceProfile, 'coding-assistant');
  assert.strictEqual(cfg.projectSurface, 'backend');
});

test('skillDestinations maps IDE targets to skill directories', () => {
  assert.deepStrictEqual(skillDestinations(['claude-code']), ['.claude/skills']);
  assert.deepStrictEqual(skillDestinations(['cursor']), ['.cursor/skills']);
  assert.deepStrictEqual(skillDestinations(['claude-code', 'cursor']), ['.claude/skills', '.cursor/skills']);
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

test('ide flag selects a single target', () => {
  const cfg = normalizeProfileConfig({}, { ide: 'cursor' });
  assert.deepStrictEqual(cfg.ideTargets, ['cursor']);
});

test('ide both expands to claude-code and cursor', () => {
  const cfg = normalizeProfileConfig({}, { ide: 'both' });
  assert.deepStrictEqual(cfg.ideTargets, ['claude-code', 'cursor']);
});

test('invalid ide values fail clearly', () => {
  assert.throws(
    () => normalizeProfileConfig({}, { ide: 'vscode' }),
    /Invalid --ide: vscode\. Expected one of: claude-code, cursor, both\./
  );
});
