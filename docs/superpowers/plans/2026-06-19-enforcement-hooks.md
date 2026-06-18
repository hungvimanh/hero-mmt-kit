# Enforcement Hooks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add hard enforcement gates to Edit/Write tool calls so Claude cannot bypass the Standard/Full workflow without an explicit override.

**Architecture:** Two new hook files (`edit-gate.cjs`, `session-bridge.cjs`) plus targeted extensions to `workflow-check.cjs` and `stop-reminder.cjs`. All hooks follow the existing fail-open pattern (missing/malformed session.json → allow). Lean paths are always exempt.

**Tech Stack:** Node.js (CommonJS), Claude Code PreToolUse/PostToolUse hooks, `node --test` test runner.

**Spec:** `docs/superpowers/specs/2026-06-18-enforcement-hooks-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `templates/common/.claude/hooks/edit-gate.cjs` | Create | P0: block Edit/Write on wrong phase/gate |
| `templates/common/.claude/hooks/session-bridge.cjs` | Create | P1: inject session state once per session |
| `templates/common/.claude/hooks/workflow-check.cjs` | Modify | P3: warn on `git add` without checkpoint staged |
| `templates/common/.claude/hooks/stop-reminder.cjs` | Modify | Clean up session-injected.flag at session end |
| `templates/common/.claude/settings.json` | Modify | Register Edit, Write, PostToolUse matchers |
| `templates/docs/AGENCY_WORKFLOW.md` | Modify | P2: add Enforcement column to router table |
| `test/hooks.test.cjs` | Modify | Tests for all new/changed hook behavior |

---

## Task 1: Create `edit-gate.cjs` with tests (P0)

**Files:**
- Create: `templates/common/.claude/hooks/edit-gate.cjs`
- Modify: `test/hooks.test.cjs`

- [ ] **Step 1: Add failing tests to `test/hooks.test.cjs`**

Add these lines at the end of the file (after the existing workflow-check tests):

```javascript
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
test('edit-gate: HVK_SKIP_EDIT_GATE=1 overrides block', () => {
  const dir = egDir(stdSession('planning', 'pending'));
  const r = spawnSync('node', [EG], {
    input: JSON.stringify(edit(path.join(dir, 'src/foo.js'), dir)),
    encoding: 'utf8',
    env: { ...process.env, HVK_SKIP_EDIT_GATE: '1' },
  });
  assert.strictEqual(r.status, 0);
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```
node --test test/hooks.test.cjs 2>&1 | grep -E "(FAIL|edit-gate|Cannot find)"
```

Expected: multiple `FAIL` lines for `edit-gate:` tests, `Cannot find module` or similar for `EG`.

- [ ] **Step 3: Create `templates/common/.claude/hooks/edit-gate.cjs`**

```javascript
#!/usr/bin/env node
'use strict';
/*
 * edit-gate.cjs — plan-gate enforcement for Edit/Write tool calls (v1.0.0)
 * Claude Code: PreToolUse (matcher: Edit, Write)
 *
 * Blocks Edit/Write on standard/full paths when:
 *   1. phase ∈ {planning, discovery}
 *   2. phase = null AND gates.plan.required = true
 *   3. gates.plan.required = true AND gates.plan.status ≠ approved
 *
 * Lean paths (read-only, fast, null) → always exit 0.
 * Safe file paths → always exit 0.
 * HVK_SKIP_EDIT_GATE=1 → emergency override.
 * Any read/parse error → fail-safe exit 0.
 */
const fs = require('fs');
const path = require('path');

const SAFE_PREFIXES = ['docs/', 'i18n/', 'tests/', '__tests__/', '.hero-vibe-kit/'];
const SAFE_PATTERNS = [/\.config\.[^/]+$/, /\.json$/];
const LEAN_PATHS = ['read-only', 'fast', null, undefined];
const LEAN_MODES = ['tiny', 'small', null, undefined];
const BLOCKING_PHASES = ['planning', 'discovery'];

let raw = '';
process.stdin.on('data', (d) => { raw += d; });
process.stdin.on('end', () => {
  let payload = {};
  try { payload = JSON.parse(raw || '{}'); } catch (_) { process.exit(0); }

  const toolName = payload.tool_name;
  if (toolName !== 'Edit' && toolName !== 'Write') process.exit(0);

  if (process.env.HVK_SKIP_EDIT_GATE === '1') process.exit(0);

  const cwd = (payload && payload.cwd) || process.cwd();
  const filePath = (payload.tool_input && payload.tool_input.file_path) || '';

  const sessionPath = path.join(cwd, '.hero-vibe-kit', 'session.json');
  let session;
  try { session = JSON.parse(fs.readFileSync(sessionPath, 'utf8')); } catch (_) { process.exit(0); }
  if (!session || typeof session !== 'object') process.exit(0);

  if (LEAN_PATHS.includes(session.path) || LEAN_MODES.includes(session.mode)) process.exit(0);

  const gated = ['standard', 'full'];
  if (!gated.includes(session.path) && !gated.includes(session.mode)) process.exit(0);

  const rel = path.relative(cwd, filePath).replace(/\\/g, '/');
  if (isSafe(rel)) process.exit(0);

  const phase = session.phase;
  const planGate = session.gates && session.gates.plan;

  if (BLOCKING_PHASES.includes(phase)) block(session, `phase=${phase}`);
  if (phase == null && planGate && planGate.required) block(session, 'phase not set and plan gate is required');
  if (planGate && planGate.required && planGate.status !== 'approved') block(session, `plan gate status=${planGate.status || 'pending'}`);

  process.exit(0);
});

function isSafe(rel) {
  if (SAFE_PREFIXES.some((p) => rel.startsWith(p))) return true;
  if (SAFE_PATTERNS.some((rx) => rx.test(rel))) return true;
  return false;
}

function block(session, reason) {
  const msg =
    `hero-vibe-kit: edit blocked — ${session.path || session.mode} path, ${reason}.\n\n` +
    `To unblock:\n` +
    `  - Advance to implementation phase via the phase-handoff skill, OR\n` +
    `  - Approve the plan gate (session.json gates.plan.status = "approved")\n\n` +
    `Safe paths (always allowed): docs/, tests/, i18n/, *.json, *.config.*\n` +
    `Override (emergency): HVK_SKIP_EDIT_GATE=1`;
  process.stderr.write('⛔ ' + msg + '\n\n');
  process.exit(2);
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```
node --test test/hooks.test.cjs 2>&1 | grep -E "(FAIL|edit-gate)"
```

Expected: all `edit-gate:` lines show `▶` (pass), no FAIL.

- [ ] **Step 5: Commit**

```bash
git add templates/common/.claude/hooks/edit-gate.cjs test/hooks.test.cjs
git commit -m "feat(hooks): add edit-gate.cjs — PreToolUse gate for Edit/Write (P0)"
```

---

## Task 2: Add P3 git-add warn to `workflow-check.cjs`

**Files:**
- Modify: `templates/common/.claude/hooks/workflow-check.cjs`
- Modify: `test/hooks.test.cjs`

- [ ] **Step 1: Add failing tests**

Append to `test/hooks.test.cjs`:

```javascript
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
```

- [ ] **Step 2: Run tests to confirm they fail**

```
node --test test/hooks.test.cjs 2>&1 | grep -E "FAIL.*git add"
```

Expected: the three new git-add tests fail.

- [ ] **Step 3: Modify `workflow-check.cjs`**

Replace lines 33–34 (the `// Only act on git commit` early-exit) with the new routing block, and add the `warnOnAdd` function at the bottom. The full modified stdin handler and new function:

Replace this section (lines 33–34):
```javascript
  // Only act on git commit
  if (!/\bgit\b/.test(command) || !/\bcommit\b/.test(command)) process.exit(0);
```

With:
```javascript
  // Must be a git command
  if (!/\bgit\b/.test(command)) process.exit(0);

  const isAdd = /\badd\b/.test(command) && !/\bcommit\b/.test(command);
  const isCommit = /\bcommit\b/.test(command);
  if (!isAdd && !isCommit) process.exit(0);
```

Then move the `HVK_SKIP_STATE_GATE` check to only apply for commits. Replace:
```javascript
  // Emergency override
  if (process.env.HVK_SKIP_STATE_GATE === '1') process.exit(0);

  const cwd = (payload && payload.cwd) || process.cwd();
  const cursor = isCursorPayload(payload);

  // Read session.json — fail-safe if missing or malformed
  const sessionPath = path.join(cwd, '.hero-vibe-kit', 'session.json');
  let session;
  try { session = JSON.parse(fs.readFileSync(sessionPath, 'utf8')); } catch (_) { process.exit(0); }
  if (!session || typeof session !== 'object') process.exit(0);

  // Lean paths exempt
  const leanPaths = ['read-only', 'fast', null, undefined];
  const leanModes = ['tiny', 'small', null, undefined];
  if (leanPaths.includes(session.path) || leanModes.includes(session.mode)) process.exit(0);

  // Only gate Standard and Full
  const gated = ['standard', 'full'];
  if (!gated.includes(session.path) && !gated.includes(session.mode)) process.exit(0);
```

With:
```javascript
  // Emergency override — commit gate only
  if (isCommit && process.env.HVK_SKIP_STATE_GATE === '1') process.exit(0);

  const cwd = (payload && payload.cwd) || process.cwd();
  const cursor = isCursorPayload(payload);

  // Read session.json — fail-safe if missing or malformed
  const sessionPath = path.join(cwd, '.hero-vibe-kit', 'session.json');
  let session;
  try { session = JSON.parse(fs.readFileSync(sessionPath, 'utf8')); } catch (_) { process.exit(0); }
  if (!session || typeof session !== 'object') process.exit(0);

  // Lean paths exempt
  const leanPaths = ['read-only', 'fast', null, undefined];
  const leanModes = ['tiny', 'small', null, undefined];
  if (leanPaths.includes(session.path) || leanModes.includes(session.mode)) process.exit(0);

  // Only gate Standard and Full
  const gated = ['standard', 'full'];
  if (!gated.includes(session.path) && !gated.includes(session.mode)) process.exit(0);

  // P3: warn on git add with non-checkpoint staged files
  if (isAdd) {
    warnOnAdd(session, cwd);
    process.exit(0);
  }
```

Add this function before `extractCommand` at the bottom of the file:

```javascript
function warnOnAdd(session, cwd) {
  let gitStatus = '';
  try {
    const r = spawnSync('git', ['status', '--porcelain'], { cwd, encoding: 'utf8', timeout: 5000 });
    if (r.status !== 0 || r.error) return;
    gitStatus = r.stdout || '';
  } catch (_) { return; }

  // Staged files: first char is not ' ' or '?'
  const staged = gitStatus
    .split('\n')
    .filter(Boolean)
    .filter((l) => l[0] !== ' ' && l[0] !== '?')
    .map((l) => l.slice(3).trim());

  if (staged.length === 0) return; // nothing staged yet, no need to warn
  if (staged.some((f) => isCheckpoint(f, session.reportSlug))) return;

  const gateStatus = (session.gates && session.gates.plan && session.gates.plan.status) || 'pending';
  process.stderr.write(
    `⚠ hero-vibe-kit: staging non-checkpoint files on ${session.path || session.mode} path.\n` +
    `Plan gate: ${gateStatus}. Remember to touch session.json or ACTIVE_STATE.md before committing.\n`
  );
}

function isCheckpoint(f, slug) {
  if (f === '.hero-vibe-kit/session.json') return true;
  if (f === 'docs/ACTIVE_STATE.md') return true;
  if (slug && f.startsWith(`docs/reports/${slug}/`)) return true;
  if (!slug && f.startsWith('docs/reports/')) return true;
  return false;
}
```

**Important:** Remove the duplicate `isCheckpoint` inline function inside the existing commit gate handler (the one at line 71) and replace it with a call to the new standalone `isCheckpoint`:

Find and replace the existing inline function:
```javascript
  const slug = session.reportSlug;
  function isCheckpoint(f) {
    if (f === '.hero-vibe-kit/session.json') return true;
    if (f === 'docs/ACTIVE_STATE.md') return true;
    if (slug && f.startsWith(`docs/reports/${slug}/`)) return true;
    if (!slug && f.startsWith('docs/reports/')) return true;
    return false;
  }

  if (changedFiles.some(isCheckpoint)) {
```

With:
```javascript
  if (changedFiles.some((f) => isCheckpoint(f, session.reportSlug))) {
```

- [ ] **Step 4: Run tests**

```
node --test test/hooks.test.cjs 2>&1 | grep -E "(FAIL|git add|workflow-check)"
```

Expected: all `workflow-check:` tests pass, no FAIL.

- [ ] **Step 5: Commit**

```bash
git add templates/common/.claude/hooks/workflow-check.cjs test/hooks.test.cjs
git commit -m "feat(hooks): add git-add early warn to workflow-check (P3)"
```

---

## Task 3: Create `session-bridge.cjs` with tests (P1)

**Files:**
- Create: `templates/common/.claude/hooks/session-bridge.cjs`
- Modify: `test/hooks.test.cjs`

- [ ] **Step 1: Add failing tests**

Append to `test/hooks.test.cjs`:

```javascript
const SB = path.join(__dirname, '..', 'templates', 'common', '.claude', 'hooks', 'session-bridge.cjs');
const postToolPayload = (cwd) => ({ tool_name: 'Bash', tool_input: { command: 'ls' }, cwd });

test('session-bridge: no session.json exits 0 silently', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hvk-sb-'));
  fs.mkdirSync(path.join(dir, '.hero-vibe-kit'), { recursive: true });
  const r = run(SB, postToolPayload(dir));
  assert.strictEqual(r.code, 0);
  assert.strictEqual(r.err, '');
});
test('session-bridge: injects context to stderr on first call', () => {
  const dir = egDir(stdSession('implementation', 'approved'));
  // Manually set workItem and nextAction for assertion
  const session = { schemaVersion: 1, path: 'standard', phase: 'implementation',
    workItem: 'TICKET-42', nextAction: 'implement foo',
    gates: { plan: { required: true, status: 'approved' } } };
  fs.writeFileSync(path.join(dir, '.hero-vibe-kit', 'session.json'), JSON.stringify(session));
  const r = run(SB, postToolPayload(dir));
  assert.strictEqual(r.code, 0);
  assert.match(r.err, /hero-vibe-kit/);
  assert.match(r.err, /TICKET-42/);
  assert.match(r.err, /implementation/);
  assert.match(r.err, /approved/);
});
test('session-bridge: creates flag file after injection', () => {
  const dir = egDir(null);
  const session = { schemaVersion: 1, path: 'standard', phase: 'implementation',
    gates: { plan: { required: true, status: 'approved' } } };
  fs.writeFileSync(path.join(dir, '.hero-vibe-kit', 'session.json'), JSON.stringify(session));
  run(SB, postToolPayload(dir));
  assert.ok(fs.existsSync(path.join(dir, '.hero-vibe-kit', 'session-injected.flag')));
});
test('session-bridge: silent on second call when flag exists', () => {
  const dir = egDir(null);
  const session = { schemaVersion: 1, path: 'standard', phase: 'implementation',
    gates: { plan: { required: true, status: 'approved' } } };
  fs.writeFileSync(path.join(dir, '.hero-vibe-kit', 'session.json'), JSON.stringify(session));
  // Create flag manually
  fs.writeFileSync(path.join(dir, '.hero-vibe-kit', 'session-injected.flag'), '');
  const r = run(SB, postToolPayload(dir));
  assert.strictEqual(r.code, 0);
  assert.strictEqual(r.err, '');
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```
node --test test/hooks.test.cjs 2>&1 | grep -E "FAIL.*session-bridge"
```

Expected: all four `session-bridge:` tests fail.

- [ ] **Step 3: Create `templates/common/.claude/hooks/session-bridge.cjs`**

```javascript
#!/usr/bin/env node
'use strict';
/*
 * session-bridge.cjs — one-time session context injector (v1.0.0)
 * Claude Code: PostToolUse (matcher: .*)
 *
 * On the first tool call of the session, reads session.json and emits
 * current workflow state to stderr. Guarded by a flag file so it only
 * fires once per session. Flag is cleaned up by stop-reminder.cjs.
 */
const fs = require('fs');
const path = require('path');

let raw = '';
process.stdin.on('data', (d) => { raw += d; });
process.stdin.on('end', () => {
  let payload = {};
  try { payload = JSON.parse(raw || '{}'); } catch (_) { process.exit(0); }

  const cwd = (payload && payload.cwd) || process.cwd();
  const flagPath = path.join(cwd, '.hero-vibe-kit', 'session-injected.flag');
  const sessionPath = path.join(cwd, '.hero-vibe-kit', 'session.json');

  if (fs.existsSync(flagPath)) process.exit(0);

  let session;
  try { session = JSON.parse(fs.readFileSync(sessionPath, 'utf8')); } catch (_) { process.exit(0); }
  if (!session || typeof session !== 'object') process.exit(0);

  const planStatus = (session.gates && session.gates.plan && session.gates.plan.status) || 'n/a';
  const sep = '─'.repeat(55);
  process.stderr.write([
    sep,
    '[hero-vibe-kit] Session state (auto-injected)',
    `  Work item : ${session.workItem ?? '(none)'}`,
    `  Path      : ${session.path ?? '(not set)'} / Phase: ${session.phase ?? '(not set)'}`,
    `  Plan gate : ${planStatus}`,
    `  Next      : ${session.nextAction ?? '(none)'}`,
    sep,
  ].join('\n') + '\n');

  try { fs.writeFileSync(flagPath, ''); } catch (_) { /* best-effort */ }

  process.exit(0);
});
```

- [ ] **Step 4: Run tests**

```
node --test test/hooks.test.cjs 2>&1 | grep -E "(FAIL|session-bridge)"
```

Expected: all `session-bridge:` tests pass.

- [ ] **Step 5: Commit**

```bash
git add templates/common/.claude/hooks/session-bridge.cjs test/hooks.test.cjs
git commit -m "feat(hooks): add session-bridge.cjs — one-time session context injector (P1)"
```

---

## Task 4: Update `stop-reminder.cjs` to clean up flag

**Files:**
- Modify: `templates/common/.claude/hooks/stop-reminder.cjs`
- Modify: `test/hooks.test.cjs`

- [ ] **Step 1: Add failing test**

Append to `test/hooks.test.cjs`:

```javascript
test('stop-reminder: removes session-injected.flag if it exists', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hvk-sr-'));
  fs.mkdirSync(path.join(dir, '.hero-vibe-kit'), { recursive: true });
  const flagPath = path.join(dir, '.hero-vibe-kit', 'session-injected.flag');
  fs.writeFileSync(flagPath, '');
  run(STOP, { hook_event_name: 'Stop', stop_hook_active: false, cwd: dir });
  assert.ok(!fs.existsSync(flagPath));
});
```

- [ ] **Step 2: Run test to confirm it fails**

```
node --test test/hooks.test.cjs 2>&1 | grep -E "FAIL.*session-injected"
```

- [ ] **Step 3: Modify `stop-reminder.cjs`**

Add two require lines at the top (after `'use strict';`):
```javascript
const fs = require('fs');
const path = require('path');
```

Add flag cleanup before the final `process.exit(0)` (line 38):
```javascript
  // Clean up session-bridge flag so next session gets fresh context injection
  const flagPath = path.join(cwd, '.hero-vibe-kit', 'session-injected.flag');
  try { fs.rmSync(flagPath, { force: true }); } catch (_) { /* ignore */ }

  process.exit(0);
```

- [ ] **Step 4: Run tests**

```
node --test test/hooks.test.cjs 2>&1 | grep -E "(FAIL|session-injected|stop-reminder)"
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add templates/common/.claude/hooks/stop-reminder.cjs test/hooks.test.cjs
git commit -m "feat(hooks): stop-reminder cleans up session-injected.flag at session end"
```

---

## Task 5: Update `settings.json`

**Files:**
- Modify: `templates/common/.claude/settings.json`

- [ ] **Step 1: Replace file contents**

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          { "type": "command", "command": "node .claude/hooks/git-guard.cjs" },
          { "type": "command", "command": "node .claude/hooks/workflow-check.cjs" }
        ]
      },
      {
        "matcher": "Edit",
        "hooks": [
          { "type": "command", "command": "node .claude/hooks/edit-gate.cjs" }
        ]
      },
      {
        "matcher": "Write",
        "hooks": [
          { "type": "command", "command": "node .claude/hooks/edit-gate.cjs" }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": ".*",
        "hooks": [
          { "type": "command", "command": "node .claude/hooks/session-bridge.cjs" }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          { "type": "command", "command": "node .claude/hooks/stop-reminder.cjs" }
        ]
      }
    ]
  }
}
```

> **Implementation note:** If `".*"` does not work as a PostToolUse matcher (Claude Code may require exact tool names), replace with an array of individual matchers: `"Bash"`, `"Edit"`, `"Write"`, `"Read"`, `"Glob"`, `"Grep"`. Verify by checking whether session-bridge fires after a Bash call in a consumer project.

- [ ] **Step 2: Validate JSON**

```bash
node -e "JSON.parse(require('fs').readFileSync('templates/common/.claude/settings.json','utf8')); console.log('valid')"
```

Expected: `valid`

- [ ] **Step 3: Commit**

```bash
git add templates/common/.claude/settings.json
git commit -m "feat(config): register Edit, Write, PostToolUse hook matchers"
```

---

## Task 6: Update `AGENCY_WORKFLOW.md` router table (P2)

**Files:**
- Modify: `templates/docs/AGENCY_WORKFLOW.md`

- [ ] **Step 1: Locate the router table**

```bash
grep -n "Enforcement\|read-only\|Fast\|Standard\|Full\|Timeboxed" templates/docs/AGENCY_WORKFLOW.md | head -20
```

Note the line numbers where the router table lives.

- [ ] **Step 2: Add Enforcement column**

Find the router table header row. It will look something like:

```markdown
| Path | When to use | Gates | ... |
```

Add `Enforcement` as the last column header, and add the value for each row:

| Path | ... | Enforcement |
|------|-----|-------------|
| Full | ... | `hook` — hard block (`edit-gate`, `workflow-check`) |
| Standard | ... | `hook` — hard block (`edit-gate`, `workflow-check`) |
| Timeboxed | ... | `convention` — soft (model discipline) |
| Fast | ... | `convention` — soft (model discipline) |
| Read-only | ... | `convention` — soft (model discipline) |

Add this note directly beneath the table (before the next heading):

```markdown
> **hook** = enforced by `PreToolUse` hooks — Claude cannot bypass without `HVK_SKIP_EDIT_GATE=1` or `HVK_SKIP_STATE_GATE=1`.
> **convention** = relies on model following instructions — no hard block exists.
```

- [ ] **Step 3: Run doc-link test to check no broken links were introduced**

```bash
node --test test/links.test.cjs
```

Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add templates/docs/AGENCY_WORKFLOW.md
git commit -m "docs(workflow): add Enforcement column to router table (P2)"
```

---

## Task 7: Full test suite + smoke check

- [ ] **Step 1: Run full test suite**

```bash
node --test
```

Expected: all tests pass. If any fail, fix before continuing.

- [ ] **Step 2: Verify edit-gate fires in a real temp project**

```bash
node -e "
const fs = require('fs'), os = require('os'), path = require('path'), {spawnSync} = require('child_process');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hvk-smoke-'));
fs.mkdirSync(path.join(dir, '.hero-vibe-kit'));
fs.writeFileSync(path.join(dir, '.hero-vibe-kit', 'session.json'), JSON.stringify({
  schemaVersion: 1, path: 'standard', mode: 'standard', phase: 'planning',
  gates: { plan: { required: true, status: 'pending' } }
}));
const HOOK = path.join('templates', 'common', '.claude', 'hooks', 'edit-gate.cjs');
const r = spawnSync('node', [HOOK], {
  input: JSON.stringify({ tool_name: 'Edit', tool_input: { file_path: path.join(dir, 'src/foo.js') }, cwd: dir }),
  encoding: 'utf8'
});
console.log('exit code:', r.status, '(expected: 2)');
console.log('has ⛔:', r.stderr.includes('⛔'), '(expected: true)');
"
```

Expected output:
```
exit code: 2 (expected: 2)
has ⛔: true (expected: true)
```

- [ ] **Step 3: Final commit if any cleanup needed**

If the smoke check required fixes, commit them:
```bash
git add -p
git commit -m "fix(hooks): smoke-check corrections"
```

---

## Self-Review

**Spec coverage:**
- P0 (`edit-gate.cjs`): Task 1 — full implementation + tests. ✓
- P1 (`session-bridge.cjs`): Task 3 — full implementation + tests. ✓
- P2 (router table docs): Task 6 — `Enforcement` column + explanatory note. ✓
- P3 (`workflow-check.cjs` git-add warn): Task 2 — `warnOnAdd` + tests. ✓
- Flag lifecycle (created by session-bridge, deleted by stop-reminder): Tasks 3 + 4. ✓
- settings.json matchers (Edit, Write, PostToolUse): Task 5. ✓
- `HVK_SKIP_EDIT_GATE` override: implemented in edit-gate.cjs + tested. ✓

**Placeholder scan:** No TBD/TODO in code steps. All code blocks are complete. ✓

**Type consistency:**
- `isCheckpoint(f, slug)` defined once in Task 2 as a standalone function; called in both `warnOnAdd` and the commit gate handler. ✓
- `egDir` and `stdSession` helpers defined in Task 1 and reused in Task 3. ✓
- `SB` constant defined in Task 3 before use. ✓

**PostToolUse matcher note:** The `".*"` wildcard may need verification against Claude Code's actual matcher syntax. Task 5 includes an explicit note and fallback.
