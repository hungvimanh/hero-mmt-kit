'use strict';
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { checkLinks } = require('../src/links.cjs');

for (const lang of ['en', 'vi']) {
  test(`doc links resolve (${lang})`, () => {
    const dir = path.join(__dirname, '..', 'templates', 'docs', lang);
    const { broken, checked } = checkLinks([dir]);
    assert.ok(checked > 0, 'should check some links');
    assert.deepStrictEqual(broken, [], 'no broken links: ' + JSON.stringify(broken));
  });
}
