#!/usr/bin/env node
'use strict';
/*
 * Shell git guard — mixed enforcement for Claude Code and Cursor.
 * Claude Code: PreToolUse (matcher: Bash) — { tool_name, tool_input:{command} }
 * Cursor: beforeShellExecution — { command, ... }
 * BLOCKS dangerous git commands (exit 2; Cursor also emits permission: deny JSON).
 * REMINDS on commits without blocking (exit 0, stderr -> user).
 * Process references: docs/AGENCY_WORKFLOW.md, docs/BRANCHING.md, docs/DEFINITION_OF_DONE.md
 */
let raw = '';
process.stdin.on('data', (d) => { raw += d; });
process.stdin.on('end', () => {
  let payload = {};
  try { payload = JSON.parse(raw || '{}'); } catch (_) { process.exit(0); }

  const cmd = extractCommand(payload);
  if (!cmd) process.exit(0);
  if (payload.tool_name && payload.tool_name !== 'Bash') process.exit(0);
  if (!/\bgit\b/.test(cmd)) process.exit(0);

  const cursor = isCursorPayload(payload);
  const block = (msg) => {
    console.error('⛔ [git-guard] ' + msg);
    if (cursor) {
      const body = JSON.stringify({ permission: 'deny', user_message: msg, agent_message: msg });
      process.stdout.write(body);
    }
    process.exit(2);
  };

  const isPush = /\bpush\b/.test(cmd);
  const isCommit = /\bcommit\b/.test(cmd);

  // 1) Force push (allow --force-with-lease)
  if (isPush && /(--force(?!-with-lease)|(^|\s)-f(\s|$))/.test(cmd)) {
    block('Blocked force-push (--force/-f). If truly needed, use --force-with-lease and confirm manually. ' +
          '`main` is protected — send changes through a Merge Request (docs/BRANCHING.md).');
  }

  // 2) commit --no-verify / -n (bypasses hooks/CI)
  if (isCommit && /(--no-verify|(^|\s)-n(\s|$))/.test(cmd)) {
    block('Blocked `git commit --no-verify`: do not bypass hooks/checks unless the User explicitly requests it.');
  }

  // 3) reset --hard (can discard changes)
  if (/\breset\b[\s\S]*--hard/.test(cmd)) {
    block('Blocked `git reset --hard` (it can discard changes). Consider `git stash`, or run it manually if you truly intend it.');
  }

  // 4) direct push to main (standalone "main" token or :main refspec)
  if (isPush && /(^|\s|:)main(\s|$)/.test(cmd) && !/--dry-run/.test(cmd)) {
    block('Blocked direct push to protected `main`. Create a branch + Merge Request (docs/BRANCHING.md).');
  }

  // REMIND (non-blocking) on commit
  if (isCommit) {
    console.error('🔔 [git-guard] Before committing, check: ' +
      '(1) docs/ACTIVE_STATE.md updated? ' +
      '(2) gitnexus_detect_changes run when code changed? ' +
      '(3) Conventional Commits message? — see docs/DEFINITION_OF_DONE.md');
  }

  if (cursor) process.stdout.write(JSON.stringify({ permission: 'allow' }));
  process.exit(0);
});

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
