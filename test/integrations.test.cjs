'use strict';
const test = require('node:test');
const assert = require('node:assert');

const { installableSources, wantsDesignIntegration } = require('../src/integrations.cjs');

test('wantsDesignIntegration reflects the taste skill opt-in', () => {
  assert.strictEqual(wantsDesignIntegration({ installTasteSkill: true }), true);
  assert.strictEqual(wantsDesignIntegration({ installTasteSkill: false }), false);
});

test('wantsDesignIntegration defaults to false when unset', () => {
  assert.strictEqual(wantsDesignIntegration({}), false);
  assert.strictEqual(wantsDesignIntegration(null), false);
});

test('installableSources filters TBD sources and deduplicates install sources', () => {
  assert.deepStrictEqual(installableSources({ skills: [
    { source: 'Leonxlnx/taste-skill' },
    { source: '<TBD>' },
    { source: 'Leonxlnx/taste-skill' },
    { source: '' },
  ] }), ['Leonxlnx/taste-skill']);
});
