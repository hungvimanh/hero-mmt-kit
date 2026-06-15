'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const GUARD = path.join(__dirname, '..', 'templates', 'common', '.claude', 'hooks', 'git-guard.cjs');
const STOP = path.join(__dirname, '..', 'templates', 'common', '.claude', 'hooks', 'stop-reminder.cjs');

function run(script, payload) {
  const r = spawnSync('node', [script], { input: JSON.stringify(payload), encoding: 'utf8' });
  return { code: r.status, err: (r.stderr || '').trim() };
}
const bash = (command) => ({ tool_name: 'Bash', tool_input: { command } });
const shell = (command) => ({ command });

test('blocks force push -f', () => { const r = run(GUARD, bash('git push -f origin main')); assert.strictEqual(r.code, 2); assert.match(r.err, /⛔/); });
test('cursor payload blocks force push -f', () => { const r = run(GUARD, shell('git push -f origin main')); assert.strictEqual(r.code, 2); assert.match(r.err, /⛔/); });
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
test('cursor payload allows git status', () => { const r = run(GUARD, shell('git status')); assert.strictEqual(r.code, 0); });
test('stop-reminder claude loop guard exits 0', () => { assert.strictEqual(run(STOP, { hook_event_name: 'Stop', stop_hook_active: true, cwd: process.cwd() }).code, 0); });
test('stop-reminder cursor loop guard exits 0', () => { assert.strictEqual(run(STOP, { hook_event_name: 'stop', loop_count: 1, cwd: process.cwd() }).code, 0); });
