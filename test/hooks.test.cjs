'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const GUARD = path.join(__dirname, '..', 'templates', 'common', '.claude', 'hooks', 'git-guard.cjs');
const STOP = path.join(__dirname, '..', 'templates', 'common', '.claude', 'hooks', 'stop-reminder.cjs');
const SB = path.join(__dirname, '..', 'templates', 'common', '.claude', 'hooks', 'session-bridge.cjs');

function run(script, payload) {
  const r = spawnSync('node', [script], { input: JSON.stringify(payload), encoding: 'utf8' });
  return { code: r.status, err: (r.stderr || '').trim() };
}
const bash = (command) => ({ tool_name: 'Bash', tool_input: { command } });

test('blocks force push -f', () => { const r = run(GUARD, bash('git push -f origin main')); assert.strictEqual(r.code, 2); assert.match(r.err, /⛔/); });
test('blocks push --force', () => { assert.strictEqual(run(GUARD, bash('git push --force')).code, 2); });
test('allows --force-with-lease', () => { const r = run(GUARD, bash('git push --force-with-lease origin feat/x')); assert.strictEqual(r.code, 0); assert.strictEqual(r.err, ''); });
test('blocks commit --no-verify', () => { assert.strictEqual(run(GUARD, bash('git commit --no-verify -m x')).code, 2); });
test('blocks reset --hard', () => { assert.strictEqual(run(GUARD, bash('git reset --hard HEAD~1')).code, 2); });
test('blocks push to main', () => { assert.strictEqual(run(GUARD, bash('git push origin main')).code, 2); });
test('no false positive on feat/main-page', () => { const r = run(GUARD, bash('git push origin feat/main-page')); assert.strictEqual(r.code, 0); assert.strictEqual(r.err, ''); });
test('warns on normal commit', () => { const r = run(GUARD, bash('git commit -m "feat: x"')); assert.strictEqual(r.code, 0); assert.match(r.err, /🔔/); });
test('silent on git status', () => { const r = run(GUARD, bash('git status')); assert.strictEqual(r.code, 0); assert.strictEqual(r.err, ''); });
test('silent on non-git bash', () => { const r = run(GUARD, bash('ls -la')); assert.strictEqual(r.code, 0); assert.strictEqual(r.err, ''); });
test('silent on non-Bash tool', () => { const r = run(GUARD, { tool_name: 'Read', tool_input: {} }); assert.strictEqual(r.code, 0); });
test('safe on invalid json', () => { const r = spawnSync('node', [GUARD], { input: 'not json', encoding: 'utf8' }); assert.strictEqual(r.status, 0); });

test('stop-reminder claude loop guard exits 0', () => { assert.strictEqual(run(STOP, { hook_event_name: 'Stop', stop_hook_active: true, cwd: process.cwd() }).code, 0); });

function sbDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hvk-sb-'));
  fs.mkdirSync(path.join(dir, '.hero-mmt-kit'), { recursive: true });
  return dir;
}

const postToolPayload = (cwd) => ({ tool_name: 'Bash', tool_input: { command: 'ls' }, cwd });

test('session-bridge: no session.json exits 0 silently', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hvk-sb-'));
  fs.mkdirSync(path.join(dir, '.hero-mmt-kit'), { recursive: true });
  const r = run(SB, postToolPayload(dir));
  assert.strictEqual(r.code, 0);
  assert.strictEqual(r.err, '');
});
test('session-bridge: injects context to stderr on first call', () => {
  const dir = sbDir();
  const session = { schemaVersion: 1, currentSkill: 'hero-coding', resumePath: 'docs/coding-reports/2026-07-10-x.md', nextAction: 'implement foo' };
  fs.writeFileSync(path.join(dir, '.hero-mmt-kit', 'session.json'), JSON.stringify(session));
  const r = run(SB, postToolPayload(dir));
  assert.strictEqual(r.code, 0);
  assert.match(r.err, /hero-mmt-kit/);
  assert.match(r.err, /hero-coding/);
  assert.match(r.err, /implement foo/);
});
test('session-bridge: creates flag file after injection', () => {
  const dir = sbDir();
  const session = { schemaVersion: 1, currentSkill: 'hero-coding', nextAction: 'implement foo' };
  fs.writeFileSync(path.join(dir, '.hero-mmt-kit', 'session.json'), JSON.stringify(session));
  run(SB, postToolPayload(dir));
  assert.ok(fs.existsSync(path.join(dir, '.hero-mmt-kit', 'session-injected.flag')));
});
test('session-bridge: silent on second call when flag exists', () => {
  const dir = sbDir();
  const session = { schemaVersion: 1, currentSkill: 'hero-coding', nextAction: 'implement foo' };
  fs.writeFileSync(path.join(dir, '.hero-mmt-kit', 'session.json'), JSON.stringify(session));
  // Create flag manually — simulates second call
  fs.writeFileSync(path.join(dir, '.hero-mmt-kit', 'session-injected.flag'), '');
  const r = run(SB, postToolPayload(dir));
  assert.strictEqual(r.code, 0);
  assert.strictEqual(r.err, '');
});

test('stop-reminder: removes session-injected.flag if it exists', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hvk-sr-'));
  fs.mkdirSync(path.join(dir, '.hero-mmt-kit'), { recursive: true });
  const flagPath = path.join(dir, '.hero-mmt-kit', 'session-injected.flag');
  fs.writeFileSync(flagPath, '');
  run(STOP, { hook_event_name: 'Stop', stop_hook_active: false, cwd: dir });
  assert.ok(!fs.existsSync(flagPath));
});
