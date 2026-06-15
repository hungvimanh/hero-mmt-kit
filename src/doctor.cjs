'use strict';
const path = require('path');
const { spawnSync } = require('child_process');
const { log, exists, readJSON } = require('./util.cjs');
const { checkLinks } = require('./links.cjs');
const { resolveIdeTargets } = require('./profile-config.cjs');

function hookCheck(hookFile, payload) {
  const r = spawnSync('node', [hookFile], { input: JSON.stringify(payload), encoding: 'utf8' });
  return { code: r.status, err: (r.stderr || '').trim(), out: (r.stdout || '').trim() };
}
function which(cmd) {
  const r = spawnSync(process.platform === 'win32' ? 'where' : 'which', [cmd], { encoding: 'utf8' });
  return r.status === 0;
}

function checkGitGuard(gg) {
  const blockClaude = hookCheck(gg, { tool_name: 'Bash', tool_input: { command: 'git push -f origin main' } });
  const allowClaude = hookCheck(gg, { tool_name: 'Bash', tool_input: { command: 'git status' } });
  const blockCursor = hookCheck(gg, { command: 'git push -f origin main' });
  const allowCursor = hookCheck(gg, { command: 'git status' });
  return blockClaude.code === 2 && allowClaude.code === 0 && blockCursor.code === 2 && allowCursor.code === 0;
}

async function doctor(opts) {
  const { target } = opts;
  log.title('hero-vibe-kit · doctor');
  let pass = 0, warn = 0, fail = 0;
  const ok = (m) => { log.ok(m); pass++; };
  const wn = (m) => { log.warn(m); warn++; };
  const er = (m) => { log.err(m); fail++; };

  const cfg = readJSON(path.join(target, '.hero-vibe-kit', 'config.json'), null);
  const ideTargets = resolveIdeTargets(cfg || {}, {});
  if (cfg) {
    ok(`config: v${cfg.version} · ${cfg.projectName} · ${cfg.brownfield ? 'brownfield' : 'new'} · IDE: ${ideTargets.join(', ')}`);
  } else er('config missing (.hero-vibe-kit/config.json) — run `hero-vibe-kit init`');

  if (ideTargets.includes('claude-code')) {
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
        ? ok('Claude git-guard self-test: blocks force-push, allows safe git (Claude + Cursor payloads)')
        : er('Claude git-guard self-test failed');
    } else er('.claude/hooks/git-guard.cjs missing');

    const sr = path.join(target, '.claude', 'hooks', 'stop-reminder.cjs');
    if (exists(sr)) {
      const r = hookCheck(sr, { hook_event_name: 'Stop', stop_hook_active: true, cwd: target });
      r.code === 0 ? ok('Claude stop-reminder self-test: ok') : er('Claude stop-reminder self-test failed');
    } else er('.claude/hooks/stop-reminder.cjs missing');
  }

  if (ideTargets.includes('cursor')) {
    const hp = path.join(target, '.cursor', 'hooks.json');
    const hooks = readJSON(hp, null);
    if (!exists(hp)) er('.cursor/hooks.json missing');
    else if (!hooks) er('.cursor/hooks.json is invalid JSON');
    else {
      const cmds = JSON.stringify(hooks.hooks || {});
      cmds.includes('git-guard.cjs') ? ok('Cursor hooks.json: git-guard wired') : wn('Cursor git-guard hook not wired');
      cmds.includes('stop-reminder.cjs') ? ok('Cursor hooks.json: stop-reminder wired') : wn('Cursor stop-reminder hook not wired');
    }

    const rule = path.join(target, '.cursor', 'rules', 'hero-vibe-kit.mdc');
    exists(rule) ? ok('Cursor rule: .cursor/rules/hero-vibe-kit.mdc present') : er('Cursor rule missing (.cursor/rules/hero-vibe-kit.mdc)');

    const gg = path.join(target, '.cursor', 'hooks', 'git-guard.cjs');
    if (exists(gg)) {
      checkGitGuard(gg)
        ? ok('Cursor git-guard self-test: blocks force-push, allows safe git (Claude + Cursor payloads)')
        : er('Cursor git-guard self-test failed');
    } else er('.cursor/hooks/git-guard.cjs missing');

    const sr = path.join(target, '.cursor', 'hooks', 'stop-reminder.cjs');
    if (exists(sr)) {
      const r = hookCheck(sr, { hook_event_name: 'stop', loop_count: 1, cwd: target });
      r.code === 0 ? ok('Cursor stop-reminder self-test: ok') : er('Cursor stop-reminder self-test failed');
    } else er('.cursor/hooks/stop-reminder.cjs missing');
  }

  const { broken, checked } = checkLinks([path.join(target, 'docs'), path.join(target, 'CLAUDE.md'), path.join(target, 'AGENTS.md')]);
  if (broken.length === 0) ok(`doc links: ${checked} checked, 0 broken`);
  else { er(`doc links: ${broken.length} broken`); broken.slice(0, 8).forEach((b) => console.log('    - ' + path.relative(target, b.file) + ' -> ' + b.link)); }

  log.title('Tools');
  ok(`node: ${process.version} (required)`);
  status('git', which('git'), 'recommended');
  if (ideTargets.includes('claude-code')) status('Claude skills (.claude/skills)', exists(path.join(target, '.claude', 'skills')), 'recommended');
  if (ideTargets.includes('cursor')) status('Cursor skills (.cursor/skills)', exists(path.join(target, '.cursor', 'skills')), 'recommended');
  status('GitNexus index (.gitnexus)', exists(path.join(target, '.gitnexus')), 'optional');
  status('Serena (.serena)', exists(path.join(target, '.serena')), 'optional');

  function status(name, present, tier) { present ? ok(`${name}: present (${tier})`) : wn(`${name}: absent (${tier})`); }

  log.title(`Result: ${pass} ok · ${warn} warn · ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

module.exports = { doctor };
