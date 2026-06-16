'use strict';
const test = require('node:test');
const assert = require('node:assert');

const { validate, parseFrontmatter } = require('../src/handoff-validate.cjs');

const VALID_FM = `---
hvkHandoffVersion: 1
workItem: checkout-flow
mode: standard
fromPhase: implementation
toPhase: review
status: green
approval: approved
reportSlug: 2026-06-16-checkout-flow
---`;

const BODY_WITH_SECTIONS = `
## Source of truth
- Latest approved handoff

## Read first
- resume.md

## Do not read
- old transcripts

## Next action
- Run the QA checklist
`;

test('parseFrontmatter: extracts fm and body', () => {
  const text = `${VALID_FM}\n${BODY_WITH_SECTIONS}`;
  const { fm, body } = parseFrontmatter(text);
  assert.ok(fm, 'fm should be truthy');
  assert.strictEqual(fm.mode, 'standard');
  assert.ok(body.includes('Source of truth'));
});

test('parseFrontmatter: no frontmatter returns null fm', () => {
  const { fm, body } = parseFrontmatter('# My handoff\n\nSome content');
  assert.strictEqual(fm, null);
  assert.ok(body.includes('My handoff'));
});

test('validate: valid standard handoff passes', () => {
  const text = `${VALID_FM}\n${BODY_WITH_SECTIONS}`;
  const { ok, errors, warnings } = validate(text);
  assert.strictEqual(ok, true, JSON.stringify(errors));
  assert.strictEqual(errors.length, 0);
});

test('validate: missing required frontmatter key is error', () => {
  const fm = `---
hvkHandoffVersion: 1
workItem: my-item
mode: standard
fromPhase: implementation
toPhase: review
status: green
---`;
  const { ok, errors } = validate(`${fm}\n${BODY_WITH_SECTIONS}`);
  assert.strictEqual(ok, false);
  assert.ok(errors.some((e) => e.includes('approval') || e.includes('reportSlug')));
});

test('validate: invalid mode is error', () => {
  const fm = `---
hvkHandoffVersion: 1
workItem: x
mode: mega
fromPhase: implementation
toPhase: review
status: green
approval: approved
reportSlug: 2026-06-16-x
---`;
  const { ok, errors } = validate(`${fm}\n## Next action\n- do it`);
  assert.strictEqual(ok, false);
  assert.ok(errors.some((e) => e.includes('mode')));
});

test('validate: invalid status is error', () => {
  const fm = `---
hvkHandoffVersion: 1
workItem: x
mode: standard
fromPhase: implementation
toPhase: review
status: purple
approval: approved
reportSlug: 2026-06-16-x
---`;
  const { ok, errors } = validate(`${fm}\n${BODY_WITH_SECTIONS}`);
  assert.strictEqual(ok, false);
  assert.ok(errors.some((e) => e.includes('status')));
});

test('validate: missing body section emits warning', () => {
  const text = `${VALID_FM}\n## Next action\n- do it`;
  const { ok, warnings } = validate(text);
  assert.strictEqual(ok, true);
  assert.ok(warnings.some((w) => w.includes('Source of truth')));
});

test('validate: legacy file without frontmatter warns but is ok', () => {
  const legacy = '# Phase Handoff\n\nWork item: my-thing\n\n## Next action\n- do the thing';
  const { ok, warnings, errors } = validate(legacy);
  assert.strictEqual(ok, true, JSON.stringify(errors));
  assert.ok(warnings.some((w) => w.includes('frontmatter')));
});

test('validate: empty file is error', () => {
  const { ok, errors } = validate('');
  assert.strictEqual(ok, false);
  assert.ok(errors.some((e) => e.includes('empty')));
});

test('validate: tiny mode needs only Next action section', () => {
  const fm = `---
hvkHandoffVersion: 1
workItem: x
mode: tiny
fromPhase: implementation
toPhase: review
status: green
approval: auto-approved
reportSlug: 2026-06-16-x
---`;
  const { ok, warnings } = validate(`${fm}\n## Next action\n- quick fix`);
  assert.strictEqual(ok, true);
  assert.ok(!warnings.some((w) => w.includes('Source of truth')));
});
