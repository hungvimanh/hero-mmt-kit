#!/usr/bin/env node
'use strict';
/*
 * Shell git guard — Claude Code PreToolUse (matcher: Bash) — { tool_name, tool_input:{command}, cwd }
 * BLOCKS a small set of genuinely dangerous git commands (exit 2).
 * REMINDS on commits without blocking (exit 0, stderr -> user).
 *
 * Design notes:
 * - Flag/keyword checks run on a quote- and heredoc-stripped copy of the
 *   command so that text inside a commit message — whether `-m "..."` or a
 *   `git commit -m "$(cat <<'EOF' ... EOF)"` heredoc body — can never be
 *   mistaken for a real flag. Branch/refspec checks use the same stripped copy.
 * - Protected-branch detection resolves the repo's default branch dynamically
 *   (origin/HEAD → init.defaultBranch → "main"); nothing is hardcoded and no
 *   GitHub/GitLab-specific workflow term is assumed.
 */
const { execSync } = require('child_process');

// Remove the contents of single/double-quoted spans and heredoc bodies so
// message text can't look like a flag. Leaves the surrounding tokens intact.
function stripQuoted(s) {
  return s
    .replace(/<<[-~]?\s*(['"]?)(\w+)\1[\s\S]*?\n\s*\2\b/g, '<<$2\n$2')
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''");
}

function defaultBranch(cwd) {
  const run = (c) => execSync(c, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  try {
    const head = run('git symbolic-ref --short refs/remotes/origin/HEAD'); // e.g. "origin/main"
    if (head) return head.replace(/^origin\//, '');
  } catch (_) { /* no origin/HEAD */ }
  try {
    const cfg = run('git config --get init.defaultBranch');
    if (cfg) return cfg;
  } catch (_) { /* unset */ }
  return 'main';
}

let raw = '';
process.stdin.on('data', (d) => { raw += d; });
process.stdin.on('end', () => {
  let payload = {};
  try { payload = JSON.parse(raw || '{}'); } catch (_) { process.exit(0); }

  if (payload.tool_name && payload.tool_name !== 'Bash') process.exit(0);
  const cmd = (payload.tool_input && payload.tool_input.command) || '';
  if (!cmd || !/\bgit\b/.test(cmd)) process.exit(0);

  const cwd = payload.cwd || process.cwd();
  const safe = stripQuoted(cmd); // flag/keyword checks run against this

  const block = (msg) => {
    console.error('⛔ [git-guard] ' + msg);
    process.exit(2);
  };

  const isPush = /\bpush\b/.test(safe);
  const isCommit = /\bcommit\b/.test(safe);

  // 1) Force push (allow --force-with-lease)
  if (isPush && (/--force(?!-with-lease)/.test(safe) || /(^|\s)-[a-z]*f[a-z]*(\s|$)/.test(safe))) {
    block('Blocked force-push. If truly needed, prefer --force-with-lease and run it manually. ' +
          'Protected branches should receive changes through a reviewed branch, not a force-push.');
  }

  // 2) commit --no-verify / -n (bypasses hooks/checks)
  if (isCommit && /(--no-verify|(^|\s)-n(\s|$))/.test(safe)) {
    block('Blocked `git commit --no-verify`: do not bypass hooks/checks unless the user explicitly requests it.');
  }

  // 3) reset --hard (can discard changes)
  if (/\breset\b[\s\S]*--hard/.test(safe)) {
    block('Blocked `git reset --hard` (it can discard changes). Consider `git stash`, or run it manually if you truly intend it.');
  }

  // 4) direct push to the repo's protected/default branch
  if (isPush && !/--dry-run/.test(safe)) {
    const def = defaultBranch(cwd);
    const re = new RegExp('(^|\\s|:)' + def.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\s|$)');
    if (re.test(safe)) {
      block(`Blocked direct push to the protected branch \`${def}\`. ` +
            'Push a feature branch instead and merge it through your project\'s review process.');
    }
  }

  // REMIND (non-blocking) on commit
  if (isCommit) {
    console.error('🔔 [git-guard] Before committing, check: ' +
      '(1) docs/ACTIVE_STATE.md updated if work state changed? ' +
      '(2) impact/change analysis run when code changed (if a code-intelligence tool is set up)? ' +
      '(3) a clear, conventional commit message?');
  }

  process.exit(0);
});
