'use strict';
const fs = require('fs');
const path = require('path');
const { log, exists, backup, readJSON, writeJSON, ensureDir } = require('./util.cjs');
const { renderTree, renderString } = require('./render.cjs');
const { mergeManagedBlock, mergeSettings } = require('./merge.cjs');
const { normalizeProfileConfig } = require('./profile-config.cjs');
const { defaultSession } = require('./workflow-state.cjs');

async function update(opts) {
  const { pkgRoot, target, flags } = opts;
  const templates = path.join(pkgRoot, 'templates');
  log.title('hero-mmt-kit · update');

  let cfg = readJSON(path.join(target, '.hero-mmt-kit', 'config.json'), null);
  if (!cfg) { log.err('Not initialized (.hero-mmt-kit/config.json missing). Run `hero-mmt-kit init`.'); process.exit(1); }
  try {
    cfg = normalizeProfileConfig(cfg, flags || {});
  } catch (e) {
    log.err(e.message);
    process.exit(1);
  }

  const vars = { DATE: new Date().toISOString().slice(0, 10) };

  const skillDirs = ['.claude/skills'];

  // Re-render managed docs; NEVER touch ACTIVE_STATE (working state).
  const srcDocs = path.join(templates, 'docs');
  let n = 0;
  for (const f of renderTree(srcDocs, vars)) {
    if (path.basename(f.rel) === 'ACTIVE_STATE.md') continue;
    const dest = path.join(target, 'docs', f.rel);
    if (path.basename(f.rel) === 'BROWNFIELD_DISCOVERY.md' && exists(dest)) continue;
    ensureDir(path.dirname(dest));
    if (exists(dest)) backup(dest);
    fs.writeFileSync(dest, f.content);
    n++;
  }
  log.ok(`Docs re-rendered: ${n} (ACTIVE_STATE.md preserved)`);

  // Managed blocks (content outside markers preserved)
  const claudeInner = renderString(fs.readFileSync(path.join(templates, 'CLAUDE.md.tmpl'), 'utf8'), vars);
  const agentsInner = renderString(fs.readFileSync(path.join(templates, 'AGENTS.md.tmpl'), 'utf8'), vars);
  log.ok(`CLAUDE.md: ${mergeManagedBlock(path.join(target, 'CLAUDE.md'), claudeInner, 'Project')}`);
  log.ok(`AGENTS.md: ${mergeManagedBlock(path.join(target, 'AGENTS.md'), agentsInner, null)}`);

  ensureDir(path.join(target, '.claude', 'hooks'));
  for (const h of ['git-guard.cjs', 'stop-reminder.cjs', 'session-bridge.cjs']) {
    fs.copyFileSync(path.join(templates, 'common', '.claude', 'hooks', h), path.join(target, '.claude', 'hooks', h));
  }
  mergeSettings(path.join(target, '.claude', 'settings.json'), path.join(templates, 'common', '.claude', 'settings.json'));
  log.ok('Claude Code hooks + settings.json refreshed');

  // Refresh bundled core skills (framework-managed; user-added skills untouched)
  const skills = require('./skills.cjs');
  const selectedSkills = skills.selectProcessSkills(cfg);
  const sk = skills.installSkills(pkgRoot, target, { selectedSkills, destinations: skillDirs });
  log.ok(`Skills refreshed: ${sk.skills} bundled core skill(s) → ${skillDirs.join(', ') || '(none)'}`);

  const sessionPath = path.join(target, '.hero-mmt-kit', 'session.json');
  if (!exists(sessionPath)) {
    ensureDir(path.dirname(sessionPath));
    writeJSON(sessionPath, defaultSession());
    log.ok('Session : .hero-mmt-kit/session.json (seeded — was missing)');
  }

  const newVer = JSON.parse(fs.readFileSync(path.join(pkgRoot, 'package.json'), 'utf8')).version;
  cfg.version = newVer;
  delete cfg.lang;
  writeJSON(path.join(target, '.hero-mmt-kit', 'config.json'), cfg);
  log.ok(`Now at v${newVer}`);
}

module.exports = { update };
