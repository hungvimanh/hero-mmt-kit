'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const BIN = path.join(__dirname, '..', 'bin', 'hero-vibe-kit.js');
function cli(args, opts) { return spawnSync('node', [BIN, ...args], Object.assign({ encoding: 'utf8' }, opts)); }
function mkdir() { return fs.mkdtempSync(path.join(os.tmpdir(), 'hvk-dr-')); }

function initDir(dir) {
  return cli(['init', '--dir', dir, '--yes', '--skip-integrations', '--ide', 'claude-code']);
}

test('doctor passes on fresh init (no session data)', () => {
  const dir = mkdir();
  const init = initDir(dir);
  assert.strictEqual(init.status, 0, init.stderr);

  const doc = cli(['doctor', '--dir', dir]);
  assert.strictEqual(doc.status, 0, 'doctor should pass: ' + doc.stdout + doc.stderr);
  assert.match(doc.stdout, /session\.json: valid/);
});

test('doctor --strict passes on fresh init (empty session is valid)', () => {
  const dir = mkdir();
  initDir(dir);
  const doc = cli(['doctor', '--dir', dir, '--strict']);
  assert.strictEqual(doc.status, 0, '--strict should pass on fresh init: ' + doc.stdout + doc.stderr);
});

test('doctor warns on missing session.json', () => {
  const dir = mkdir();
  initDir(dir);
  fs.unlinkSync(path.join(dir, '.hero-vibe-kit', 'session.json'));
  const doc = cli(['doctor', '--dir', dir]);
  // warn-only by default — doctor still exits 0 unless there are fails
  assert.match(doc.stdout + doc.stderr, /session\.json missing/i);
});

test('doctor --strict fails on missing session.json', () => {
  const dir = mkdir();
  initDir(dir);
  fs.unlinkSync(path.join(dir, '.hero-vibe-kit', 'session.json'));
  const doc = cli(['doctor', '--dir', dir, '--strict']);
  assert.notStrictEqual(doc.status, 0, '--strict should fail on missing session');
});

test('doctor detects drift: session.phase vs handoff toPhase', () => {
  const dir = mkdir();
  initDir(dir);

  // Set session to say we're in 'review'
  const sessionPath = path.join(dir, '.hero-vibe-kit', 'session.json');
  const session = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
  session.phase = 'review';
  session.reportSlug = '2026-06-16-test-item';
  fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));

  // Create a handoff saying toPhase: implementation (diverges from session)
  const handoffDir = path.join(dir, 'docs', 'reports', '2026-06-16-test-item', 'handoffs');
  fs.mkdirSync(handoffDir, { recursive: true });
  fs.writeFileSync(path.join(handoffDir, '01-design-to-code.md'), [
    '---',
    'hvkHandoffVersion: 1',
    'workItem: test-item',
    'mode: standard',
    'fromPhase: planning',
    'toPhase: implementation',
    'status: green',
    'approval: approved',
    'reportSlug: 2026-06-16-test-item',
    '---',
    '',
    '## Source of truth',
    '- plan.md',
    '',
    '## Read first',
    '- resume.md',
    '',
    '## Next action',
    '- Start implementation',
  ].join('\n'));

  const doc = cli(['doctor', '--dir', dir]);
  // Should warn about drift (session says 'review', handoff says 'implementation')
  assert.match(doc.stdout + doc.stderr, /drift/i);
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

test('doctor reports workflow-check hook wired', () => {
  const dir = mkdir();
  initDir(dir);
  const doc = cli(['doctor', '--dir', dir]);
  assert.match(doc.stdout, /workflow-check/);
});
