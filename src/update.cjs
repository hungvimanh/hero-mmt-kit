'use strict';
const fs = require('fs');
const path = require('path');
const { log, exists, backup, readJSON, writeJSON, ensureDir } = require('./util.cjs');
const { renderTree, renderString } = require('./render.cjs');
const { mergeManagedBlock, mergeSettings } = require('./merge.cjs');
const { normalizeProfileConfig, buildProfileVars, skillDestinations } = require('./profile-config.cjs');
const { refreshCursor } = require('./cursor.cjs');

const TEAM_LABELS = { solo: 'solo (you + AI)', 'small-team': 'small team (2–5)', enterprise: 'larger team (6+)' };
const BRANCH_LABELS = { 'gitlab-flow': 'GitLab flow', 'github-flow': 'GitHub flow', trunk: 'trunk-based' };

async function update(opts) {
  const { pkgRoot, target, flags } = opts;
  const templates = path.join(pkgRoot, 'templates');
  log.title('hero-vibe-kit · update');

  let cfg = readJSON(path.join(target, '.hero-vibe-kit', 'config.json'), null);
  if (!cfg) { log.err('Not initialized (.hero-vibe-kit/config.json missing). Run `hero-vibe-kit init`.'); process.exit(1); }
  try {
    cfg = normalizeProfileConfig(cfg, flags || {});
  } catch (e) {
    log.err(e.message);
    process.exit(1);
  }

  const vars = Object.assign({
    PROJECT_NAME: cfg.projectName,
    DATE: new Date().toISOString().slice(0, 10),
    TEAM_SIZE: TEAM_LABELS[cfg.teamSize] || cfg.teamSize,
    BRANCHING_MODEL: BRANCH_LABELS[cfg.branchingModel] || cfg.branchingModel,
  }, buildProfileVars(cfg));

  const ideTargets = cfg.ideTargets || [];
  const skillDirs = skillDestinations(ideTargets);

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
  log.ok(`CLAUDE.md: ${mergeManagedBlock(path.join(target, 'CLAUDE.md'), claudeInner, cfg.projectName)}`);
  log.ok(`AGENTS.md: ${mergeManagedBlock(path.join(target, 'AGENTS.md'), agentsInner, null)}`);

  if (ideTargets.includes('claude-code')) {
    ensureDir(path.join(target, '.claude', 'hooks'));
    for (const h of ['git-guard.cjs', 'stop-reminder.cjs']) {
      fs.copyFileSync(path.join(templates, 'common', '.claude', 'hooks', h), path.join(target, '.claude', 'hooks', h));
    }
    mergeSettings(path.join(target, '.claude', 'settings.json'), path.join(templates, 'common', '.claude', 'settings.json'));
    log.ok('Claude Code hooks + settings.json refreshed');
  }

  if (ideTargets.includes('cursor')) {
    refreshCursor(pkgRoot, target, vars);
    log.ok('Cursor rule + hooks refreshed');
  }

  // Refresh selected vendored core skills (framework-managed; user-added skills untouched)
  const skills = require('./skills.cjs');
  const selectedSkills = skills.selectProcessSkills(cfg);
  const sk = skills.installSkills(pkgRoot, target, { selectedSkills, destinations: skillDirs });
  log.ok(`Skills refreshed: ${sk.skills} selected core skill(s) → ${skillDirs.join(', ') || '(none)'}`);

  const newVer = JSON.parse(fs.readFileSync(path.join(pkgRoot, 'package.json'), 'utf8')).version;
  cfg.version = newVer;
  delete cfg.lang;
  writeJSON(path.join(target, '.hero-vibe-kit', 'config.json'), cfg);
  log.ok(`Now at v${newVer}`);
}

module.exports = { update };
