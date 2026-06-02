'use strict';
const path = require('path');
const { spawnSync } = require('child_process');
const { log, exists, readJSON } = require('./util.cjs');
const { checkLinks } = require('./links.cjs');

function hookCheck(hookFile, payload) {
  const r = spawnSync('node', [hookFile], { input: JSON.stringify(payload), encoding: 'utf8' });
  return { code: r.status, err: (r.stderr || '').trim() };
}
function which(cmd) {
  const r = spawnSync(process.platform === 'win32' ? 'where' : 'which', [cmd], { encoding: 'utf8' });
  return r.status === 0;
}

async function doctor(opts) {
  const { target } = opts;
  log.title('hero-vibe-kit · doctor');
  let pass = 0, warn = 0, fail = 0;
  const ok = (m) => { log.ok(m); pass++; };
  const wn = (m) => { log.warn(m); warn++; };
  const er = (m) => { log.err(m); fail++; };

  // config
  const cfg = readJSON(path.join(target, '.hero-vibe-kit', 'config.json'), null);
  if (cfg) ok(`config: v${cfg.version} · ${cfg.projectName} · lang=${cfg.lang} · ${cfg.brownfield ? 'brownfield' : 'new'}`);
  else er('config missing (.hero-vibe-kit/config.json) — run `hero-vibe-kit init`');

  // settings.json
  const sp = path.join(target, '.claude', 'settings.json');
  const settings = readJSON(sp, null);
  if (!exists(sp)) er('.claude/settings.json missing');
  else if (!settings) er('.claude/settings.json is invalid JSON');
  else {
    const cmds = JSON.stringify(settings.hooks || {});
    cmds.includes('git-guard.cjs') ? ok('settings.json: git-guard hook wired') : wn('git-guard hook not wired in settings.json');
    cmds.includes('stop-reminder.cjs') ? ok('settings.json: stop-reminder hook wired') : wn('stop-reminder hook not wired');
  }

  // hook self-tests
  const gg = path.join(target, '.claude', 'hooks', 'git-guard.cjs');
  if (exists(gg)) {
    const block = hookCheck(gg, { tool_name: 'Bash', tool_input: { command: 'git push -f origin main' } });
    const allow = hookCheck(gg, { tool_name: 'Bash', tool_input: { command: 'git status' } });
    if (block.code === 2 && allow.code === 0) ok('git-guard self-test: blocks force-push, allows safe git');
    else er(`git-guard self-test failed (force-push exit=${block.code}, status exit=${allow.code})`);
  } else er('.claude/hooks/git-guard.cjs missing');

  const sr = path.join(target, '.claude', 'hooks', 'stop-reminder.cjs');
  if (exists(sr)) {
    const r = hookCheck(sr, { hook_event_name: 'Stop', stop_hook_active: true, cwd: target });
    r.code === 0 ? ok('stop-reminder self-test: ok') : er('stop-reminder self-test failed');
  } else er('.claude/hooks/stop-reminder.cjs missing');

  // doc links
  const { broken, checked } = checkLinks([path.join(target, 'docs'), path.join(target, 'CLAUDE.md'), path.join(target, 'AGENTS.md')]);
  if (broken.length === 0) ok(`doc links: ${checked} checked, 0 broken`);
  else { er(`doc links: ${broken.length} broken`); broken.slice(0, 8).forEach((b) => console.log('    - ' + path.relative(target, b.file) + ' -> ' + b.link)); }

  // tools
  log.title('Tools');
  ok(`node: ${process.version} (required)`);
  status('git', which('git'), 'recommended');
  status('superpowers skills (skills-lock.json)', exists(path.join(target, 'skills-lock.json')), 'recommended');
  status('GitNexus index (.gitnexus)', exists(path.join(target, '.gitnexus')), 'optional');
  status('Serena (.serena)', exists(path.join(target, '.serena')), 'optional');

  function status(name, present, tier) { present ? ok(`${name}: present (${tier})`) : wn(`${name}: absent (${tier})`); }

  log.title(`Result: ${pass} ok · ${warn} warn · ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

module.exports = { doctor };
