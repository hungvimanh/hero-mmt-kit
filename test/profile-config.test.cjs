'use strict';
const test = require('node:test');
const assert = require('node:assert');
const {
  normalizeProfileConfig,
  collectProfileConfig,
} = require('../src/profile-config.cjs');

test('profile config defaults to not installing the taste skill', () => {
  const cfg = normalizeProfileConfig({}, {});
  assert.strictEqual(cfg.installTasteSkill, false);
});

test('normalizeProfileConfig preserves a stored installTasteSkill value', () => {
  const cfg = normalizeProfileConfig({ installTasteSkill: true }, {});
  assert.strictEqual(cfg.installTasteSkill, true);
});

test('normalizeProfileConfig --taste flag overrides stored value', () => {
  const cfg = normalizeProfileConfig({ installTasteSkill: true }, { taste: false });
  assert.strictEqual(cfg.installTasteSkill, false);
});

test('collectProfileConfig honors --taste without prompting', async () => {
  const ask = { yesno() { throw new Error('should not prompt when --taste is set'); } };
  const cfg = await collectProfileConfig({}, { taste: true }, ask);
  assert.strictEqual(cfg.installTasteSkill, true);
});

test('collectProfileConfig prompts once when no flag or stored value is present', async () => {
  const prompts = [];
  const ask = {
    yesno(label, defYes) {
      prompts.push(label);
      assert.strictEqual(defYes, false);
      return Promise.resolve(true);
    },
  };
  const cfg = await collectProfileConfig({}, {}, ask);
  assert.deepStrictEqual(prompts, ['Install the taste/design skill?']);
  assert.strictEqual(cfg.installTasteSkill, true);
});

test('collectProfileConfig skips the prompt when installTasteSkill is already known', async () => {
  const ask = { yesno() { throw new Error('should not prompt when value is already known'); } };
  const cfg = await collectProfileConfig({ installTasteSkill: false }, {}, ask);
  assert.strictEqual(cfg.installTasteSkill, false);
});
