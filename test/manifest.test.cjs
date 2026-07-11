'use strict';
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const manifest = require(path.join(__dirname, '..', 'skills.manifest.json'));

test('manifest has process and the 3 design groups', () => {
  const g = manifest.groups;
  assert.ok(g.process, 'process group present');
  assert.ok(!g['communication-style'], 'communication-style group removed; concise principles live in hero-* skills');
  assert.ok(g.brand, 'brand group present');
  assert.ok(g['design-direction'], 'design-direction group present');
  assert.ok(g['design-tools'], 'design-tools group present');
  assert.ok(!g.design, 'old conflated design group removed');
});

test('design-direction is pick-one; design-tools is not', () => {
  assert.strictEqual(manifest.groups['design-direction'].pickOne, true);
  assert.notStrictEqual(manifest.groups['design-tools'].pickOne, true);
});

test('every skill has a name and a source string', () => {
  for (const [name, group] of Object.entries(manifest.groups)) {
    for (const s of group.skills) {
      assert.ok(typeof s.name === 'string' && s.name.length, `${name}: skill name`);
      assert.ok(typeof s.source === 'string' && s.source.length, `${name}/${s.name}: source (use "<TBD>" if unknown, never empty)`);
    }
  }
});

test('design-direction contains the taste skills and brand is separate', () => {
  const dir = manifest.groups['design-direction'].skills.map((s) => s.name);
  assert.ok(dir.includes('minimalist-ui') && dir.includes('design-taste-frontend'));
  assert.ok(!dir.includes('brandkit'), 'brandkit lives in the brand group');
  assert.deepStrictEqual(manifest.groups.brand.skills.map((s) => s.name), ['brandkit']);
});

test('process skill selection metadata installs the full bundled suite', () => {
  const proc = manifest.groups.process;
  const selection = proc.selection;
  assert.ok(selection, 'process selection metadata present');
  assert.strictEqual(selection.mode, 'all');
  assert.deepStrictEqual(selection.deriveFrom, []);
  assert.match(selection.installPolicy, /full bundled process suite/);
  assert.match(selection.updatePolicy, /preserve user-added/);
  assert.ok(proc.skills.map((s) => s.name).includes('security-review'));
});

test('optional design groups remain external and unbundled', () => {
  for (const name of ['brand', 'design-direction', 'design-tools']) {
    assert.strictEqual(manifest.groups[name].tier, 'optional', `${name} should remain optional`);
    assert.notStrictEqual(manifest.groups[name].bundled, true, `${name} should not be bundled`);
  }
});
