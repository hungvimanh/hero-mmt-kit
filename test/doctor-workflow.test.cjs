'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const BIN = path.join(__dirname, '..', 'bin', 'hero-mmt-kit.js');
function cli(args, opts) { return spawnSync('node', [BIN, ...args], Object.assign({ encoding: 'utf8' }, opts)); }
function mkdir() { return fs.mkdtempSync(path.join(os.tmpdir(), 'hvk-dr-')); }

function initDir(dir) {
  return cli(['init', '--dir', dir, '--yes', '--skip-integrations']);
}

test('doctor passes on fresh init', () => {
  const dir = mkdir();
  const init = initDir(dir);
  assert.strictEqual(init.status, 0, init.stderr);

  const doc = cli(['doctor', '--dir', dir]);
  assert.strictEqual(doc.status, 0, 'doctor should pass: ' + doc.stdout + doc.stderr);
  assert.match(doc.stdout, /ACTIVE_STATE\.md: \d+ lines/);
  assert.match(doc.stdout, /active-state-bridge self-test: ok/);
});

test('doctor --strict passes on fresh init', () => {
  const dir = mkdir();
  initDir(dir);
  const doc = cli(['doctor', '--dir', dir, '--strict']);
  assert.strictEqual(doc.status, 0, '--strict should pass on fresh init: ' + doc.stdout + doc.stderr);
});

test('doctor warns on missing docs/ACTIVE_STATE.md', () => {
  const dir = mkdir();
  initDir(dir);
  fs.unlinkSync(path.join(dir, 'docs', 'ACTIVE_STATE.md'));
  const doc = cli(['doctor', '--dir', dir]);
  assert.match(doc.stdout + doc.stderr, /ACTIVE_STATE\.md missing/i);
});

test('doctor --strict fails on missing docs/ACTIVE_STATE.md', () => {
  const dir = mkdir();
  initDir(dir);
  fs.unlinkSync(path.join(dir, 'docs', 'ACTIVE_STATE.md'));
  const doc = cli(['doctor', '--dir', dir, '--strict']);
  assert.notStrictEqual(doc.status, 0, '--strict should fail on missing ACTIVE_STATE.md');
});

test('doctor warns on ACTIVE_STATE.md bloat', () => {
  const dir = mkdir();
  initDir(dir);

  // Write a bloated ACTIVE_STATE.md (>150 lines)
  const bloat = Array.from({ length: 160 }, (_, i) => `line ${i + 1}`).join('\n');
  fs.writeFileSync(path.join(dir, 'docs', 'ACTIVE_STATE.md'), bloat);

  const doc = cli(['doctor', '--dir', dir]);
  assert.match(doc.stdout + doc.stderr, /160 lines.*150/i);
});

test('doctor reports git-guard hook wired', () => {
  const dir = mkdir();
  initDir(dir);
  const doc = cli(['doctor', '--dir', dir]);
  assert.match(doc.stdout, /git-guard hook wired/);
});
