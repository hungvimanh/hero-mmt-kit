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
