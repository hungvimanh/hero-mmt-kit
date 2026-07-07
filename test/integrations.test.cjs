'use strict';
const test = require('node:test');
const assert = require('node:assert');

const { installableSources, wantsDesignIntegration } = require('../src/integrations.cjs');

test('wantsDesignIntegration installs design for vibecode regardless of surface', () => {
  assert.strictEqual(wantsDesignIntegration({ assistanceProfile: 'vibecode', projectSurface: 'backend' }), true);
  assert.strictEqual(wantsDesignIntegration({ assistanceProfile: 'vibecode', projectSurface: 'fullstack' }), true);
});

test('wantsDesignIntegration installs design for coding assistant frontend/fullstack only', () => {
  assert.strictEqual(wantsDesignIntegration({ assistanceProfile: 'coding-assistant', projectSurface: 'backend' }), false);
  assert.strictEqual(wantsDesignIntegration({ assistanceProfile: 'coding-assistant', projectSurface: 'frontend' }), true);
  assert.strictEqual(wantsDesignIntegration({ assistanceProfile: 'coding-assistant', projectSurface: 'fullstack' }), true);
});

test('installableSources filters TBD sources and deduplicates install sources', () => {
  assert.deepStrictEqual(installableSources({ skills: [
    { source: 'Leonxlnx/taste-skill' },
    { source: '<TBD>' },
    { source: 'Leonxlnx/taste-skill' },
    { source: '' },
  ] }), ['Leonxlnx/taste-skill']);
});
