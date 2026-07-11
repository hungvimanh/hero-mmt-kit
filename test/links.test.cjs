'use strict';
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { checkLinks } = require('../src/links.cjs');

test('template doc links resolve', () => {
  const dir = path.join(__dirname, '..', 'templates', 'docs');
  const { broken, checked } = checkLinks([dir]);
  assert.ok(checked > 0, 'should check some links');
  assert.deepStrictEqual(broken, [], 'no broken links: ' + JSON.stringify(broken));
});
