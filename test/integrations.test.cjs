'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { buildMediaGenConfig } = require('../src/integrations.cjs');

test('buildMediaGenConfig returns skipped when disabled', () => {
  assert.strictEqual(buildMediaGenConfig({ enabled: false }), 'skipped');
});

test('buildMediaGenConfig stores provider + env var name, never a key', () => {
  const cfg = buildMediaGenConfig({ enabled: true, provider: 'acme', apiKeyEnv: 'ACME_API_KEY', model: 'img-1', apiKey: 'sk-leak' });
  assert.deepStrictEqual(cfg, { provider: 'acme', apiKeyEnv: 'ACME_API_KEY', model: 'img-1' });
  assert.ok(!('apiKey' in cfg), 'never stores the key value');
  assert.ok(!JSON.stringify(cfg).includes('sk-leak'), 'key value not present anywhere');
});

test('buildMediaGenConfig omits empty model', () => {
  const cfg = buildMediaGenConfig({ enabled: true, provider: 'acme', apiKeyEnv: 'ACME_API_KEY', model: '' });
  assert.deepStrictEqual(cfg, { provider: 'acme', apiKeyEnv: 'ACME_API_KEY' });
});
