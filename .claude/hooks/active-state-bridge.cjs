#!/usr/bin/env node
'use strict';
/*
 * active-state-bridge.cjs — session-start context injector (v2.0.0)
 * Claude Code: SessionStart
 *
 * Reads docs/ACTIVE_STATE.md (the durable, single source of workflow state —
 * there is no separate session.json pointer) and injects the "Active
 * Features" and "Blockers / Pending Actions" sections as additional context
 * at the start of the session. SessionStart already fires once per session,
 * so no flag-file dedup is needed.
 */
const fs = require('fs');
const path = require('path');

const MAX_CHARS = 4000;

function extractSection(md, heading) {
  const lines = md.split('\n');
  const startIdx = lines.findIndex((l) => l.trim() === heading);
  if (startIdx === -1) return null;
  const rest = lines.slice(startIdx + 1);
  const endOffset = rest.findIndex((l) => /^##\s/.test(l));
  const body = (endOffset === -1 ? rest : rest.slice(0, endOffset)).join('\n').trim();
  return body || null;
}

let raw = '';
process.stdin.on('data', (d) => { raw += d; });
process.stdin.on('end', () => {
  let payload = {};
  try { payload = JSON.parse(raw || '{}'); } catch (_) { process.exit(0); }

  const cwd = (payload && payload.cwd) || process.cwd();
  const activeStatePath = path.join(cwd, 'docs', 'ACTIVE_STATE.md');

  let md;
  try { md = fs.readFileSync(activeStatePath, 'utf8'); } catch (_) { process.exit(0); }

  const features = extractSection(md, '## Active Features in Pipeline');
  const blockers = extractSection(md, '## Blockers / Pending Actions');
  if (!features && !blockers) process.exit(0);

  let context = '[hero-mmt-kit] docs/ACTIVE_STATE.md (auto-injected)\n';
  if (features) context += '\n## Active Features in Pipeline\n' + features + '\n';
  if (blockers) context += '\n## Blockers / Pending Actions\n' + blockers + '\n';
  if (context.length > MAX_CHARS) {
    context = context.slice(0, MAX_CHARS) + '\n...(truncated — read docs/ACTIVE_STATE.md directly for the rest)';
  }

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: context,
    },
  }));
  process.exit(0);
});
