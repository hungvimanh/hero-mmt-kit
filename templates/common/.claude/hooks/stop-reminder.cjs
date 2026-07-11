#!/usr/bin/env node
'use strict';
/*
 * Stop hook — soft reminder (non-blocking, exit 0).
 * Claude Code: Stop — { hook_event_name, stop_hook_active, cwd }
 * If there are uncommitted changes and docs/ACTIVE_STATE.md was not touched,
 * print a reminder for the user. Do NOT block stopping (no exit 2 -> avoid loops).
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function cleanupSessionFlag(cwd) {
  const flagPath = path.join(cwd, '.hero-mmt-kit', 'session-injected.flag');
  try { fs.rmSync(flagPath, { force: true }); } catch (_) {}
}

let raw = '';
process.stdin.on('data', (d) => { raw += d; });
process.stdin.on('end', () => {
  let payload = {};
  try { payload = JSON.parse(raw || '{}'); } catch (_) { /* ignore */ }
  if (payload.stop_hook_active) process.exit(0); // loop guard

  const cwd = payload.cwd || process.cwd();
  let status = '';
  try {
    status = execSync('git status --porcelain', { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch (_) { cleanupSessionFlag(cwd); process.exit(0); }

  const lines = status.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) { cleanupSessionFlag(cwd); process.exit(0); } // no changes

  const stateTouched = lines.some((l) => /ACTIVE_STATE\.md$/.test(l));
  const otherChanged = lines.some((l) => !/ACTIVE_STATE\.md$/.test(l));

  if (otherChanged && !stateTouched) {
    console.error('🔔 [stop-reminder] There are uncommitted changes, but docs/ACTIVE_STATE.md was not updated. ' +
      'If work state changed, update the Active Features table and Session Resume Protocol.');
  }
  cleanupSessionFlag(cwd);
  process.exit(0);
});
