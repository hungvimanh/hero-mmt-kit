'use strict';
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');
const { log, exists, readJSON } = require('./util.cjs');
const { checkLinks } = require('./links.cjs');
const { resolveIdeTargets } = require('./profile-config.cjs');
const { readSession, validateSession } = require('./workflow-state.cjs');
const { validate: validateHandoff } = require('./handoff-validate.cjs');

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
  const blockClaude = hookCheck(gg, { tool_name: 'Bash', tool_input: { command: 'git push -f origin main' } });
  const allowClaude = hookCheck(gg, { tool_name: 'Bash', tool_input: { command: 'git status' } });
  const blockCursor = hookCheck(gg, { command: 'git push -f origin main' });
  const allowCursor = hookCheck(gg, { command: 'git status' } );
  return blockClaude.code === 2 && allowClaude.code === 0 && blockCursor.code === 2 && allowCursor.code === 0;
}

function checkWorkflowCheck(wc, target) {
  // Non-commit → exit 0
  const nonCommit = hookCheck(wc, { tool_name: 'Bash', tool_input: { command: 'git status' }, cwd: target });
  if (nonCommit.code !== 0) return { ok: false, detail: 'non-commit command should exit 0' };

  // No session.json → fail-safe exit 0
  const noSession = hookCheck(wc, { tool_name: 'Bash', tool_input: { command: 'git commit -m test' }, cwd: '/tmp-nonexistent-hvk-test' });
  if (noSession.code !== 0) return { ok: false, detail: 'missing session should exit 0 (fail-safe)' };

  return { ok: true };
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
  log.title('hero-vibe-kit · doctor' + (strict ? ' --strict' : ''));
  let pass = 0, warn = 0, fail = 0, strictWarn = 0;
  const ok = (m) => { log.ok(m); pass++; };
  const wn = (m) => { log.warn(m); warn++; };
  const er = (m) => { log.err(m); fail++; };
  // sw = compliance warning: escalates to fail in --strict mode
  const sw = (m) => { if (strict) { log.err(m); fail++; strictWarn++; } else { log.warn(m); warn++; } };

  const cfg = readJSON(path.join(target, '.hero-vibe-kit', 'config.json'), null);
  const ideTargets = resolveIdeTargets(cfg || {}, {});
  if (cfg) {
    ok(`config: v${cfg.version} · ${cfg.brownfield ? 'brownfield' : 'new'} · IDE: ${ideTargets.join(', ')}`);
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
      cmds.includes('workflow-check.cjs') ? ok('Claude settings.json: workflow-check hook wired') : sw('Claude workflow-check hook not wired in settings.json — run `hero-vibe-kit update`');
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

    const wc = path.join(target, '.claude', 'hooks', 'workflow-check.cjs');
    if (exists(wc)) {
      const wcTest = checkWorkflowCheck(wc, target);
      wcTest.ok ? ok('Claude workflow-check self-test: ok') : er('Claude workflow-check self-test failed: ' + wcTest.detail);
    } else sw('.claude/hooks/workflow-check.cjs missing — run `hero-vibe-kit update`');
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
      cmds.includes('workflow-check.cjs') ? ok('Cursor hooks.json: workflow-check wired') : sw('Cursor workflow-check hook not wired — run `hero-vibe-kit update`');
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

  // --- Workflow compliance ---
  log.title('Workflow compliance');

  const session = readSession(target);
  if (!session) {
    sw('session.json missing (.hero-vibe-kit/session.json) — run `hero-vibe-kit update` or invoke phase-handoff at a boundary');
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

    // Handoff validation if reportSlug is set
    if (session.reportSlug) {
      const handoffDir = path.join(target, 'docs', 'reports', session.reportSlug, 'handoffs');
      if (!exists(handoffDir)) {
        wn(`session.reportSlug is "${session.reportSlug}" but docs/reports/${session.reportSlug}/handoffs/ does not exist`);
      } else {
        const handoffFiles = fs.readdirSync(handoffDir).filter((f) => f.endsWith('.md')).sort();
        if (handoffFiles.length === 0) {
          wn(`docs/reports/${session.reportSlug}/handoffs/ exists but has no .md files`);
        } else {
          const latest = handoffFiles[handoffFiles.length - 1];
          const latestPath = path.join(handoffDir, latest);
          const text = fs.readFileSync(latestPath, 'utf8');
          const { ok: hOk, warnings: hWarns, errors: hErrors } = validateHandoff(text, latestPath);
          if (hOk) {
            ok(`handoff: ${session.reportSlug}/handoffs/${latest} valid${hWarns.length ? ` (${hWarns.length} warning(s))` : ''}`);
            hWarns.forEach((w) => wn(`  handoff warning: ${w}`));
          } else {
            hErrors.forEach((e) => er(`  handoff error: ${e}`));
            hWarns.forEach((w) => wn(`  handoff warning: ${w}`));
          }

          // Drift detection: compare session.phase vs handoff frontmatter toPhase
          const { parseFrontmatter } = require('./handoff-validate.cjs');
          const { fm } = parseFrontmatter(text);
          if (fm) {
            if (fm.toPhase && session.phase && fm.toPhase !== session.phase) {
              sw(`drift detected: session.phase="${session.phase}" but latest handoff toPhase="${fm.toPhase}" — session may be stale`);
            }
            if (fm.approval && session.gates) {
              const prdStatus = session.gates.prd && session.gates.prd.status;
              const planStatus = session.gates.plan && session.gates.plan.status;
              if (fm.approval === 'approved' && prdStatus !== 'approved' && planStatus !== 'approved') {
                wn(`drift: handoff approval="approved" but session gates show no approved gate — consider updating session.json`);
              }
            }
          } else if (session.phase) {
            wn(`handoff has no frontmatter — cannot compare session.phase vs handoff toPhase (add hvkHandoffVersion block for drift detection)`);
          }
        }
      }
    } else if (session.phase && session.phase !== null) {
      wn(`session.phase="${session.phase}" but session.reportSlug is null — set reportSlug so doctor can validate handoffs`);
    }

    // Dirty git + ACTIVE_STATE not touched
    const dirtyFiles = getGitDirtyFiles(target);
    if (dirtyFiles !== null && dirtyFiles.length > 0) {
      const activeStateChanged = dirtyFiles.some((f) => f === 'docs/ACTIVE_STATE.md' || f === path.join('docs', 'ACTIVE_STATE.md'));
      if (!activeStateChanged && !dirtyFiles.some((f) => f === '.hero-vibe-kit/session.json')) {
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
  if (ideTargets.includes('claude-code')) status('Claude skills (.claude/skills)', exists(path.join(target, '.claude', 'skills')), 'recommended');
  if (ideTargets.includes('cursor')) status('Cursor skills (.cursor/skills)', exists(path.join(target, '.cursor', 'skills')), 'recommended');
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
