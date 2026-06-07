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
