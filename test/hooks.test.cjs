'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const GUARD = path.join(__dirname, '..', 'templates', 'common', '.claude', 'hooks', 'git-guard.cjs');
const STOP = path.join(__dirname, '..', 'templates', 'common', '.claude', 'hooks', 'stop-reminder.cjs');
const WC = path.join(__dirname, '..', 'templates', 'common', '.claude', 'hooks', 'workflow-check.cjs');

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

// workflow-check tests
function tmpWithSession(session) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hvk-wc-'));
  fs.mkdirSync(path.join(dir, '.hero-vibe-kit'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.hero-vibe-kit', 'session.json'), JSON.stringify(session));
  return dir;
}
const wcBash = (command, cwd) => ({ tool_name: 'Bash', tool_input: { command }, cwd });
const wcCursor = (command, cwd) => ({ command, cwd });

test('workflow-check: non-commit command exits 0', () => {
  assert.strictEqual(run(WC, wcBash('git status', process.cwd())).code, 0);
});
test('workflow-check: missing session exits 0 (fail-safe)', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hvk-wc-'));
  assert.strictEqual(run(WC, wcBash('git commit -m test', dir)).code, 0);
});
test('workflow-check: malformed json exits 0 (fail-safe)', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hvk-wc-'));
  fs.mkdirSync(path.join(dir, '.hero-vibe-kit'));
  fs.writeFileSync(path.join(dir, '.hero-vibe-kit', 'session.json'), 'not json');
  assert.strictEqual(run(WC, wcBash('git commit -m test', dir)).code, 0);
});
test('workflow-check: fast path exits 0', () => {
  const dir = tmpWithSession({ schemaVersion: 1, path: 'fast', mode: null });
  assert.strictEqual(run(WC, wcBash('git commit -m test', dir)).code, 0);
});
test('workflow-check: tiny mode exits 0', () => {
  const dir = tmpWithSession({ schemaVersion: 1, path: null, mode: 'tiny' });
  assert.strictEqual(run(WC, wcBash('git commit -m test', dir)).code, 0);
});
test('workflow-check: standard path without checkpoint exits 2', () => {
  const dir = tmpWithSession({ schemaVersion: 1, path: 'standard', mode: 'standard', reportSlug: null });
  // Need a real git repo so git status --porcelain succeeds
  spawnSync('git', ['init'], { cwd: dir, encoding: 'utf8' });
  spawnSync('git', ['commit', '--allow-empty', '-m', 'init'], { cwd: dir, encoding: 'utf8' });
  const r = run(WC, wcBash('git commit -m test', dir));
  assert.strictEqual(r.code, 2);
  assert.match(r.err, /⛔/);
});
test('workflow-check: HVK_SKIP_STATE_GATE=1 override exits 0', () => {
  const dir = tmpWithSession({ schemaVersion: 1, path: 'standard', mode: 'standard' });
  const r = spawnSync('node', [WC], {
    input: JSON.stringify(wcBash('git commit -m test', dir)),
    encoding: 'utf8',
    env: Object.assign({}, process.env, { HVK_SKIP_STATE_GATE: '1' }),
  });
  assert.strictEqual(r.status, 0);
});
test('workflow-check: cursor non-commit exits 0', () => {
  assert.strictEqual(run(WC, wcCursor('git status', process.cwd())).code, 0);
});

// P3: git add warn tests
test('workflow-check: git add on lean path exits 0 silently', () => {
  const dir = tmpWithSession({ schemaVersion: 1, path: 'fast', mode: null, reportSlug: null });
  spawnSync('git', ['init'], { cwd: dir, encoding: 'utf8' });
  const r = run(WC, wcBash('git add src/foo.js', dir));
  assert.strictEqual(r.code, 0);
  assert.strictEqual(r.err, '');
});
test('workflow-check: git add on standard path with staged non-checkpoint warns', () => {
  const dir = tmpWithSession({ schemaVersion: 1, path: 'standard', mode: 'standard', reportSlug: null,
    gates: { plan: { required: true, status: 'pending' } } });
  spawnSync('git', ['init'], { cwd: dir, encoding: 'utf8' });
  spawnSync('git', ['commit', '--allow-empty', '-m', 'init'], { cwd: dir, encoding: 'utf8' });
  // Stage a non-checkpoint file
  fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'src', 'foo.js'), 'x');
  spawnSync('git', ['add', 'src/foo.js'], { cwd: dir, encoding: 'utf8' });
  // Now intercept another git add — should warn because staged files have no checkpoint
  const r = run(WC, wcBash('git add src/bar.js', dir));
  assert.strictEqual(r.code, 0);
  assert.match(r.err, /⚠/);
});
test('workflow-check: git add no warn when checkpoint is staged', () => {
  const dir = tmpWithSession({ schemaVersion: 1, path: 'standard', mode: 'standard', reportSlug: null });
  spawnSync('git', ['init'], { cwd: dir, encoding: 'utf8' });
  spawnSync('git', ['commit', '--allow-empty', '-m', 'init'], { cwd: dir, encoding: 'utf8' });
  // Stage checkpoint file
  spawnSync('git', ['add', '.hero-vibe-kit/session.json'], { cwd: dir, encoding: 'utf8' });
  const r = run(WC, wcBash('git add src/foo.js', dir));
  assert.strictEqual(r.code, 0);
  assert.strictEqual(r.err, '');
});
test('workflow-check: git add no warn when staging area is empty', () => {
  const dir = tmpWithSession({ schemaVersion: 1, path: 'standard', mode: 'standard', reportSlug: null });
  spawnSync('git', ['init'], { cwd: dir, encoding: 'utf8' });
  spawnSync('git', ['commit', '--allow-empty', '-m', 'init'], { cwd: dir, encoding: 'utf8' });
  const r = run(WC, wcBash('git add src/foo.js', dir));
  assert.strictEqual(r.code, 0);
  assert.strictEqual(r.err, '');
});

const EG = path.join(__dirname, '..', 'templates', 'common', '.claude', 'hooks', 'edit-gate.cjs');
const edit = (filePath, cwd) => ({ tool_name: 'Edit', tool_input: { file_path: filePath }, cwd });
const write = (filePath, cwd) => ({ tool_name: 'Write', tool_input: { file_path: filePath }, cwd });

function egDir(session) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hvk-eg-'));
  fs.mkdirSync(path.join(dir, '.hero-vibe-kit'), { recursive: true });
  if (session) fs.writeFileSync(path.join(dir, '.hero-vibe-kit', 'session.json'), JSON.stringify(session));
  return dir;
}

const stdSession = (phase, planStatus, planRequired = true) => ({
  schemaVersion: 1, path: 'standard', mode: 'standard', phase,
  gates: { plan: { required: planRequired, status: planStatus } },
});

// Fail-open cases
test('edit-gate: no session.json exits 0', () => {
  const dir = egDir(null);
  assert.strictEqual(run(EG, edit(path.join(dir, 'src/foo.js'), dir)).code, 0);
});
test('edit-gate: lean path exits 0', () => {
  const dir = egDir({ schemaVersion: 1, path: 'fast', mode: null, phase: 'planning' });
  assert.strictEqual(run(EG, edit(path.join(dir, 'src/foo.js'), dir)).code, 0);
});
test('edit-gate: tiny mode exits 0', () => {
  const dir = egDir({ schemaVersion: 1, path: null, mode: 'tiny', phase: 'planning' });
  assert.strictEqual(run(EG, edit(path.join(dir, 'src/foo.js'), dir)).code, 0);
});
test('edit-gate: non-Edit/Write tool exits 0', () => {
  const dir = egDir(stdSession('planning', 'pending'));
  const r = run(EG, { tool_name: 'Bash', tool_input: { command: 'ls' }, cwd: dir });
  assert.strictEqual(r.code, 0);
});

// Safe file whitelist
test('edit-gate: docs/ file always allowed', () => {
  const dir = egDir(stdSession('planning', 'pending'));
  assert.strictEqual(run(EG, edit(path.join(dir, 'docs/README.md'), dir)).code, 0);
});
test('edit-gate: .json file always allowed', () => {
  const dir = egDir(stdSession('planning', 'pending'));
  assert.strictEqual(run(EG, edit(path.join(dir, 'package.json'), dir)).code, 0);
});
test('edit-gate: .config.ts file always allowed', () => {
  const dir = egDir(stdSession('planning', 'pending'));
  assert.strictEqual(run(EG, edit(path.join(dir, 'vite.config.ts'), dir)).code, 0);
});
test('edit-gate: .hero-vibe-kit/ file always allowed', () => {
  const dir = egDir(stdSession('planning', 'pending'));
  assert.strictEqual(run(EG, edit(path.join(dir, '.hero-vibe-kit/session.json'), dir)).code, 0);
});

// Blocking cases
test('edit-gate: planning phase blocks src/ edit', () => {
  const dir = egDir(stdSession('planning', 'pending'));
  const r = run(EG, edit(path.join(dir, 'src/foo.js'), dir));
  assert.strictEqual(r.code, 2);
  assert.match(r.err, /⛔/);
});
test('edit-gate: discovery phase blocks src/ edit', () => {
  const dir = egDir(stdSession('discovery', 'pending'));
  const r = run(EG, edit(path.join(dir, 'src/foo.js'), dir));
  assert.strictEqual(r.code, 2);
});
test('edit-gate: null phase + required plan gate blocks', () => {
  const dir = egDir(stdSession(null, 'pending', true));
  const r = run(EG, edit(path.join(dir, 'src/foo.js'), dir));
  assert.strictEqual(r.code, 2);
});
test('edit-gate: null phase + plan not required allows', () => {
  const dir = egDir(stdSession(null, 'pending', false));
  assert.strictEqual(run(EG, edit(path.join(dir, 'src/foo.js'), dir)).code, 0);
});
test('edit-gate: plan gate pending blocks', () => {
  const dir = egDir(stdSession('implementation', 'pending'));
  const r = run(EG, edit(path.join(dir, 'src/foo.js'), dir));
  assert.strictEqual(r.code, 2);
});

// Allowed cases
test('edit-gate: implementation phase + approved gate allows', () => {
  const dir = egDir(stdSession('implementation', 'approved'));
  assert.strictEqual(run(EG, edit(path.join(dir, 'src/foo.js'), dir)).code, 0);
});
test('edit-gate: review phase + approved gate allows', () => {
  const dir = egDir(stdSession('review', 'approved'));
  assert.strictEqual(run(EG, edit(path.join(dir, 'src/foo.js'), dir)).code, 0);
});
test('edit-gate: delivery phase + approved gate allows', () => {
  const dir = egDir(stdSession('delivery', 'approved'));
  assert.strictEqual(run(EG, edit(path.join(dir, 'src/foo.js'), dir)).code, 0);
});
test('edit-gate: Write tool also blocked on planning phase', () => {
  const dir = egDir(stdSession('planning', 'pending'));
  assert.strictEqual(run(EG, write(path.join(dir, 'src/foo.js'), dir)).code, 2);
});
test('edit-gate: standard path without mode field is still blocked', () => {
  const dir = egDir({ schemaVersion: 1, path: 'standard', phase: 'planning',
    gates: { plan: { required: true, status: 'pending' } } });
  // No 'mode' key — mode is undefined
  const r = run(EG, edit(path.join(dir, 'src/foo.js'), dir));
  assert.strictEqual(r.code, 2);
});
test('edit-gate: HVK_SKIP_EDIT_GATE=1 overrides block', () => {
  const dir = egDir(stdSession('planning', 'pending'));
  const r = spawnSync('node', [EG], {
    input: JSON.stringify(edit(path.join(dir, 'src/foo.js'), dir)),
    encoding: 'utf8',
    env: { ...process.env, HVK_SKIP_EDIT_GATE: '1' },
  });
  assert.strictEqual(r.status, 0);
});
