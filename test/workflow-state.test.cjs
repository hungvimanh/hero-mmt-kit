'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { defaultSession, validateSession, readSession, writeSession } = require('../src/workflow-state.cjs');

function tmpdir() { return fs.mkdtempSync(path.join(os.tmpdir(), 'hvk-ws-')); }

test('defaultSession returns schemaVersion 1', () => {
  const s = defaultSession();
  assert.strictEqual(s.schemaVersion, 1);
  assert.strictEqual(s.path, null);
  assert.strictEqual(s.phase, null);
  assert.strictEqual(s.loop.retryCount, 0);
  assert.strictEqual(s.loop.maxRetries, 2);
});

test('validateSession: valid default session', () => {
  const { ok, errors } = validateSession(defaultSession());
  assert.strictEqual(ok, true, JSON.stringify(errors));
});

test('validateSession: valid populated session', () => {
  const s = Object.assign(defaultSession(), { path: 'standard', mode: 'standard', phase: 'implementation', reviewBudget: 'single-combined-review' });
  s.gates.prd.status = 'approved';
  s.gates.plan.status = 'pending';
  const { ok, errors } = validateSession(s);
  assert.strictEqual(ok, true, JSON.stringify(errors));
});

test('validateSession: invalid path enum', () => {
  const s = Object.assign(defaultSession(), { path: 'mega-fast' });
  const { ok, errors } = validateSession(s);
  assert.strictEqual(ok, false);
  assert.ok(errors.some((e) => e.includes('path')));
});

test('validateSession: invalid phase enum', () => {
  const s = Object.assign(defaultSession(), { phase: 'coding' });
  const { ok } = validateSession(s);
  assert.strictEqual(ok, false);
});

test('validateSession: invalid gate status', () => {
  const s = defaultSession();
  s.gates.prd.status = 'maybe';
  const { ok } = validateSession(s);
  assert.strictEqual(ok, false);
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
  fs.mkdirSync(path.join(dir, '.hero-vibe-kit'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.hero-vibe-kit', 'session.json'), 'not json');
  assert.strictEqual(readSession(dir), null);
});

test('writeSession: creates file with default+partial merge', () => {
  const dir = tmpdir();
  const written = writeSession(dir, { phase: 'planning', workItem: 'my-feature' });
  assert.strictEqual(written.phase, 'planning');
  assert.strictEqual(written.workItem, 'my-feature');
  assert.strictEqual(written.schemaVersion, 1);
  const read = readSession(dir);
  assert.strictEqual(read.phase, 'planning');
});

test('writeSession: merges nested gates without clobbering', () => {
  const dir = tmpdir();
  writeSession(dir, { gates: { prd: { status: 'approved', evidence: 'plan-mode' } } });
  const r = readSession(dir);
  assert.strictEqual(r.gates.prd.status, 'approved');
  assert.strictEqual(r.gates.plan.status, 'not-applicable');
});

test('writeSession: sequential writes accumulate', () => {
  const dir = tmpdir();
  writeSession(dir, { phase: 'discovery' });
  writeSession(dir, { phase: 'planning', workItem: 'feat-x' });
  const r = readSession(dir);
  assert.strictEqual(r.phase, 'planning');
  assert.strictEqual(r.workItem, 'feat-x');
});
