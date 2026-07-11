'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { defaultSession, validateSession, readSession, writeSession } = require('../src/workflow-state.cjs');

function tmpdir() { return fs.mkdtempSync(path.join(os.tmpdir(), 'hvk-ws-')); }

test('defaultSession returns schemaVersion 1 and null fields', () => {
  const s = defaultSession();
  assert.strictEqual(s.schemaVersion, 1);
  assert.strictEqual(s.currentSkill, null);
  assert.strictEqual(s.lastCheckpoint, null);
  assert.strictEqual(s.resumePath, null);
  assert.strictEqual(s.nextAction, null);
  assert.strictEqual(s.updatedAt, null);
});

test('validateSession: valid default session', () => {
  const { ok, errors } = validateSession(defaultSession());
  assert.strictEqual(ok, true, JSON.stringify(errors));
});

test('validateSession: valid populated session', () => {
  const s = Object.assign(defaultSession(), {
    currentSkill: 'hero-coding',
    lastCheckpoint: '2026-07-10T00:00:00.000Z',
    resumePath: 'docs/coding-reports/2026-07-10-x.md',
    nextAction: 'run tests',
    updatedAt: '2026-07-10T00:00:00.000Z',
  });
  const { ok, errors } = validateSession(s);
  assert.strictEqual(ok, true, JSON.stringify(errors));
});

test('validateSession: invalid schemaVersion', () => {
  const s = Object.assign(defaultSession(), { schemaVersion: 2 });
  const { ok, errors } = validateSession(s);
  assert.strictEqual(ok, false);
  assert.ok(errors.some((e) => e.includes('schemaVersion')));
});

test('validateSession: non-string currentSkill is invalid', () => {
  const s = Object.assign(defaultSession(), { currentSkill: 42 });
  const { ok, errors } = validateSession(s);
  assert.strictEqual(ok, false);
  assert.ok(errors.some((e) => e.includes('currentSkill')));
});

test('validateSession: non-object returns error', () => {
  const { ok, errors } = validateSession(null);
  assert.strictEqual(ok, false);
  assert.ok(errors.length > 0);
});

test('readSession: missing file returns null', () => {
  const dir = tmpdir();
  assert.strictEqual(readSession(dir), null);
});

test('readSession: malformed JSON returns null', () => {
  const dir = tmpdir();
  fs.mkdirSync(path.join(dir, '.hero-mmt-kit'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.hero-mmt-kit', 'session.json'), 'not json');
  assert.strictEqual(readSession(dir), null);
});

test('writeSession: creates file with default+partial merge', () => {
  const dir = tmpdir();
  const written = writeSession(dir, { currentSkill: 'hero-planning', nextAction: 'write the plan' });
  assert.strictEqual(written.currentSkill, 'hero-planning');
  assert.strictEqual(written.nextAction, 'write the plan');
  assert.strictEqual(written.schemaVersion, 1);
  const read = readSession(dir);
  assert.strictEqual(read.currentSkill, 'hero-planning');
});

test('writeSession: sequential writes accumulate', () => {
  const dir = tmpdir();
  writeSession(dir, { currentSkill: 'hero-planning' });
  writeSession(dir, { currentSkill: 'hero-coding', nextAction: 'implement foo' });
  const r = readSession(dir);
  assert.strictEqual(r.currentSkill, 'hero-coding');
  assert.strictEqual(r.nextAction, 'implement foo');
});
