#!/usr/bin/env node
'use strict';
/*
 * workflow-check.cjs — path-aware state-checkpoint commit gate (v2.0.0)
 * Claude Code: PreToolUse (matcher: Bash) — { tool_name, tool_input:{command} }
 * Cursor: beforeShellExecution — { command, ... }
 *
 * Blocks `git commit` on Standard/Full paths that lack a state checkpoint.
 * A checkpoint is ANY ONE of:
 *   1. .hero-vibe-kit/session.json in staged/working changes
 *   2. docs/ACTIVE_STATE.md in staged/working changes
 *   3. any file under docs/reports/<reportSlug>/ in staged/working changes
 *
 * Lean paths (read-only, fast, mode tiny/small) → always exit 0.
 * HVK_SKIP_STATE_GATE=1 → emergency override, exit 0.
 * Any parse/git error → fail-safe exit 0.
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

let raw = '';
process.stdin.on('data', (d) => { raw += d; });
process.stdin.on('end', () => {
  let payload = {};
  try { payload = JSON.parse(raw || '{}'); } catch (_) { process.exit(0); }

  // Extract command
  const command = extractCommand(payload);
  if (!command) process.exit(0);
  if (payload.tool_name && payload.tool_name !== 'Bash') process.exit(0);

  // Must be a git command
  if (!/\bgit\b/.test(command)) process.exit(0);

  const isAdd = /\badd\b/.test(command) && !/\bcommit\b/.test(command);
  const isCommit = /\bcommit\b/.test(command);
  if (!isAdd && !isCommit) process.exit(0);

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

  // Get staged + working tree files
  let gitStatus = '';
  try {
    const r = spawnSync('git', ['status', '--porcelain'], { cwd, encoding: 'utf8', timeout: 5000 });
    if (r.status !== 0 || r.error) process.exit(0);
    gitStatus = r.stdout || '';
  } catch (_) { process.exit(0); }

  const changedFiles = gitStatus
    .split('\n')
    .filter(Boolean)
    .map((line) => line.slice(3).trim());

  if (changedFiles.some((f) => isCheckpoint(f, session.reportSlug))) {
    if (cursor) process.stdout.write(JSON.stringify({ permission: 'allow' }));
    process.exit(0);
  }

  // Block
  const slug = session.reportSlug;
  const slugDir = slug ? `docs/reports/${slug}/` : 'docs/reports/<reportSlug>/';
  const msg =
    `hero-vibe-kit: commit blocked — ${session.path || session.mode} path requires a state checkpoint.\n` +
    `\nTouch ONE of these before committing:\n` +
    `  1. .hero-vibe-kit/session.json  ← update phase/nextAction via phase-handoff skill\n` +
    `  2. docs/ACTIVE_STATE.md\n` +
    `  3. any file under ${slugDir}\n` +
    `\nOverride (emergency): HVK_SKIP_STATE_GATE=1 git commit ...\n` +
    `Read-only/Fast/Tiny commits are always allowed.`;

  process.stderr.write('⛔ ' + msg + '\n\n');
  if (cursor) process.stdout.write(JSON.stringify({ permission: 'deny', user_message: msg, agent_message: msg }));
  process.exit(2);
});

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

  if (staged.length === 0) return;
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

function extractCommand(payload) {
  if (payload.tool_input && payload.tool_input.command) return String(payload.tool_input.command);
  if (payload.command) return String(payload.command);
  return '';
}

function isCursorPayload(payload) {
  if (payload.command) return true;
  if (payload.hook_event_name === 'beforeShellExecution') return true;
  return false;
}
