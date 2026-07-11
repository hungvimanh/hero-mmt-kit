'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const GUARD = path.join(__dirname, '..', 'templates', 'common', '.claude', 'hooks', 'git-guard.cjs');
const STOP = path.join(__dirname, '..', 'templates', 'common', '.claude', 'hooks', 'stop-reminder.cjs');
const ASB = path.join(__dirname, '..', 'templates', 'common', '.claude', 'hooks', 'active-state-bridge.cjs');

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

function runStdout(script, payload) {
  const r = spawnSync('node', [script], { input: JSON.stringify(payload), encoding: 'utf8' });
  return { code: r.status, out: (r.stdout || '').trim() };
}

function asbDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hvk-asb-'));
  fs.mkdirSync(path.join(dir, 'docs'), { recursive: true });
  return dir;
}

const sessionStartPayload = (cwd) => ({ hook_event_name: 'SessionStart', cwd });

test('active-state-bridge: no ACTIVE_STATE.md exits 0 silently', () => {
  const dir = asbDir();
  const r = runStdout(ASB, sessionStartPayload(dir));
  assert.strictEqual(r.code, 0);
  assert.strictEqual(r.out, '');
});
test('active-state-bridge: injects Active Features context on session start', () => {
  const dir = asbDir();
  const md = [
    '# Project Active State',
    '',
    '## Active Features in Pipeline',
    '',
    '| Feature | Path | Phase | Branch | Status | PRD | TDD |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    '| Foo | src/foo | Coding | feat/foo | In progress | - | - |',
    '',
    '## Blockers / Pending Actions',
    '- none',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(dir, 'docs', 'ACTIVE_STATE.md'), md);
  const r = runStdout(ASB, sessionStartPayload(dir));
  assert.strictEqual(r.code, 0);
  const parsed = JSON.parse(r.out);
  const ctx = parsed.hookSpecificOutput.additionalContext;
  assert.strictEqual(parsed.hookSpecificOutput.hookEventName, 'SessionStart');
  assert.match(ctx, /Active Features in Pipeline/);
  assert.match(ctx, /feat\/foo/);
  assert.match(ctx, /Blockers \/ Pending Actions/);
});
