#!/usr/bin/env node
'use strict';
/*
 * Stop hook — soft reminder (non-blocking, exit 0).
 * If there are uncommitted changes and docs/ACTIVE_STATE.md was not touched,
 * print a reminder for the user. Do NOT block stopping (no exit 2 -> avoid loops).
 */
const { execSync } = require('child_process');

let raw = '';
process.stdin.on('data', (d) => { raw += d; });
process.stdin.on('end', () => {
  let payload = {};
  try { payload = JSON.parse(raw || '{}'); } catch (_) { /* ignore */ }
  if (payload.stop_hook_active) process.exit(0); // avoid recursive activation

  const cwd = payload.cwd || process.cwd();
  let status = '';
  try {
    status = execSync('git status --porcelain', { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch (_) { process.exit(0); }

  const lines = status.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) process.exit(0); // no changes

  const stateTouched = lines.some((l) => /ACTIVE_STATE\.md$/.test(l));
  const otherChanged = lines.some((l) => !/ACTIVE_STATE\.md$/.test(l));

  if (otherChanged && !stateTouched) {
    console.error('🔔 [stop-reminder] There are uncommitted changes, but docs/ACTIVE_STATE.md was not updated. ' +
      'If work state changed, update the pipeline table + resume protocol (docs/AGENCY_WORKFLOW.md §0).');
  }
  process.exit(0);
});
