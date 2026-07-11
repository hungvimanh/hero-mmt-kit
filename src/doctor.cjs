'use strict';
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');
const { log, exists, readJSON } = require('./util.cjs');
const { checkLinks } = require('./links.cjs');
const { readSession, validateSession } = require('./workflow-state.cjs');

const ACTIVE_STATE_BLOAT_LINES = 150;

function hookCheck(hookFile, payload) {
  const r = spawnSync('node', [hookFile], { input: JSON.stringify(payload), encoding: 'utf8' });
  return { code: r.status, err: (r.stderr || '').trim(), out: (r.stdout || '').trim() };
}
function which(cmd) {
  const r = spawnSync(process.platform === 'win32' ? 'where' : 'which', [cmd], { encoding: 'utf8' });
  return r.status === 0;
}

function checkGitGuard(gg) {
  const block = hookCheck(gg, { tool_name: 'Bash', tool_input: { command: 'git push -f origin main' } });
  const allow = hookCheck(gg, { tool_name: 'Bash', tool_input: { command: 'git status' } });
  return block.code === 2 && allow.code === 0;
}

function getGitDirtyFiles(target) {
  try {
    const r = spawnSync('git', ['status', '--porcelain'], { cwd: target, encoding: 'utf8', timeout: 5000 });
    if (r.status !== 0) return null;
    return (r.stdout || '').split('\n').filter(Boolean).map((l) => l.slice(3).trim());
  } catch { return null; }
}

async function doctor(opts) {
  const { target, flags } = opts;
  const strict = !!(flags && flags.strict);
  log.title('hero-mmt-kit · doctor' + (strict ? ' --strict' : ''));
  let pass = 0, warn = 0, fail = 0, strictWarn = 0;
  const ok = (m) => { log.ok(m); pass++; };
  const wn = (m) => { log.warn(m); warn++; };
  const er = (m) => { log.err(m); fail++; };
  // sw = compliance warning: escalates to fail in --strict mode
  const sw = (m) => { if (strict) { log.err(m); fail++; strictWarn++; } else { log.warn(m); warn++; } };

  const cfg = readJSON(path.join(target, '.hero-mmt-kit', 'config.json'), null);
  if (cfg) {
    ok(`config: v${cfg.version} · ${cfg.brownfield ? 'brownfield' : 'new'}`);
  } else er('config missing (.hero-mmt-kit/config.json) — run `hero-mmt-kit init`');

  const sp = path.join(target, '.claude', 'settings.json');
  const settings = readJSON(sp, null);
  if (!exists(sp)) er('.claude/settings.json missing');
  else if (!settings) er('.claude/settings.json is invalid JSON');
  else {
    const cmds = JSON.stringify(settings.hooks || {});
    cmds.includes('git-guard.cjs') ? ok('Claude settings.json: git-guard hook wired') : wn('Claude git-guard hook not wired in settings.json');
    cmds.includes('stop-reminder.cjs') ? ok('Claude settings.json: stop-reminder hook wired') : wn('Claude stop-reminder hook not wired');
  }

  const gg = path.join(target, '.claude', 'hooks', 'git-guard.cjs');
  if (exists(gg)) {
    checkGitGuard(gg)
      ? ok('Claude git-guard self-test: blocks force-push, allows safe git')
      : er('Claude git-guard self-test failed');
  } else er('.claude/hooks/git-guard.cjs missing');

  const sr = path.join(target, '.claude', 'hooks', 'stop-reminder.cjs');
  if (exists(sr)) {
    const r = hookCheck(sr, { hook_event_name: 'Stop', stop_hook_active: true, cwd: target });
    r.code === 0 ? ok('Claude stop-reminder self-test: ok') : er('Claude stop-reminder self-test failed');
  } else er('.claude/hooks/stop-reminder.cjs missing');

  // --- Workflow compliance ---
  log.title('Workflow compliance');

  const session = readSession(target);
  if (!session) {
    sw('session.json missing (.hero-mmt-kit/session.json) — run `hero-mmt-kit update`');
  } else {
    const { ok: sessionOk, errors: sessionErrors } = validateSession(session);
    if (sessionOk) {
      ok('session.json: valid (schemaVersion 1)');
    } else {
      er('session.json invalid: ' + sessionErrors.join('; '));
    }

    // ACTIVE_STATE.md bloat check
    const activePath = path.join(target, 'docs', 'ACTIVE_STATE.md');
    if (exists(activePath)) {
      const lines = fs.readFileSync(activePath, 'utf8').split('\n').length;
      if (lines > ACTIVE_STATE_BLOAT_LINES) {
        sw(`ACTIVE_STATE.md has ${lines} lines (>${ACTIVE_STATE_BLOAT_LINES}) — archive completed items to docs/reports/ to keep it a short index`);
      } else {
        ok(`ACTIVE_STATE.md: ${lines} lines (under ${ACTIVE_STATE_BLOAT_LINES} threshold)`);
      }
    }

    // Dirty git + ACTIVE_STATE not touched
    const dirtyFiles = getGitDirtyFiles(target);
    if (dirtyFiles !== null && dirtyFiles.length > 0) {
      const activeStateChanged = dirtyFiles.some((f) => f === 'docs/ACTIVE_STATE.md' || f === path.join('docs', 'ACTIVE_STATE.md'));
      if (!activeStateChanged && !dirtyFiles.some((f) => f === '.hero-mmt-kit/session.json')) {
        wn('git working tree is dirty but neither ACTIVE_STATE.md nor session.json is in the changes — consider updating workflow state');
      }
    }
  }

  // --- Doc links ---
  const { broken, checked } = checkLinks([path.join(target, 'docs'), path.join(target, 'CLAUDE.md'), path.join(target, 'AGENTS.md')]);
  if (broken.length === 0) ok(`doc links: ${checked} checked, 0 broken`);
  else { er(`doc links: ${broken.length} broken`); broken.slice(0, 8).forEach((b) => console.log('    - ' + path.relative(target, b.file) + ' -> ' + b.link)); }

  log.title('Tools');
  ok(`node: ${process.version} (required)`);
  // Tool presence is always warn-only (never strict-fail) — optional/recommended absences are expected
  status('git', which('git'), 'recommended');
  status('Claude skills (.claude/skills)', exists(path.join(target, '.claude', 'skills')), 'recommended');
  status('GitNexus index (.gitnexus)', exists(path.join(target, '.gitnexus')), 'optional');
  status('Serena (.serena)', exists(path.join(target, '.serena')), 'optional');

  function status(name, present, tier) { present ? ok(`${name}: present (${tier})`) : wn(`${name}: absent (${tier})`); }

  log.title(`Result: ${pass} ok · ${warn} warn · ${fail} fail`);
  if (strict && strictWarn > 0) {
    process.stderr.write(`  ✗ --strict mode: ${strictWarn} compliance warning(s) treated as failure(s)\n`);
  }
  process.exit(fail > 0 ? 1 : 0);
}

module.exports = { doctor };
