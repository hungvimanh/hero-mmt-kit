'use strict';
const fs = require('fs');
const path = require('path');
const { log, ensureDir, exists, backup, writeJSON, makeAsker } = require('./util.cjs');
const { detect } = require('./detect.cjs');
const { renderTree, renderString } = require('./render.cjs');
const { mergeManagedBlock, mergeSettings } = require('./merge.cjs');

const TEAM_LABELS = { solo: 'solo (you + AI)', 'small-team': 'small team (2–5)', enterprise: 'larger team (6+)' };
const BRANCH_LABELS = { 'gitlab-flow': 'GitLab flow', 'github-flow': 'GitHub flow', trunk: 'trunk-based' };

async function init(opts) {
  const { pkgRoot, target, flags } = opts;
  const templates = path.join(pkgRoot, 'templates');
  const auto = !!flags.yes;
  const ask = makeAsker(auto);

  log.title('hero-vibe-kit · init');
  const d = detect(target);
  log.step(`Target : ${target}`);
  log.step(`Mode   : ${d.brownfield ? 'brownfield (existing project)' : 'new project'}`);

  // ---- config ----
  let cfg = {};
  if (flags.preset) {
    const pf = path.join(pkgRoot, 'presets', String(flags.preset) + '.json');
    if (!exists(pf)) { log.err(`Unknown preset: ${flags.preset}`); ask.close(); process.exit(1); }
    cfg = JSON.parse(fs.readFileSync(pf, 'utf8'));
    log.ok(`Preset : ${flags.preset}`);
  }
  cfg.projectName = flags.name || cfg.projectName || (auto ? path.basename(target) : await ask.text('Project name', path.basename(target)));
  cfg.lang = flags.lang || cfg.lang || (auto ? 'en' : await ask.choice('Docs language:', ['en', 'vi'], 0));
  if (!cfg.teamSize) cfg.teamSize = auto ? 'small-team' : await ask.choice('Team size:', ['solo', 'small-team', 'enterprise'], 1);
  if (!cfg.branchingModel) cfg.branchingModel = auto ? 'github-flow' : await ask.choice('Branching model:', ['github-flow', 'gitlab-flow', 'trunk'], 0);
  if (!cfg.enforceLevel) cfg.enforceLevel = 'mixed';
  cfg.version = JSON.parse(fs.readFileSync(path.join(pkgRoot, 'package.json'), 'utf8')).version;
  cfg.brownfield = d.brownfield;

  if (cfg.lang !== 'en' && cfg.lang !== 'vi') { log.err(`Unsupported lang: ${cfg.lang} (use en|vi)`); ask.close(); process.exit(1); }

  const vars = {
    PROJECT_NAME: cfg.projectName,
    DATE: new Date().toISOString().slice(0, 10),
    TEAM_SIZE: TEAM_LABELS[cfg.teamSize] || cfg.teamSize,
    BRANCHING_MODEL: BRANCH_LABELS[cfg.branchingModel] || cfg.branchingModel,
  };

  // ---- 1. docs ----
  const srcDocs = path.join(templates, 'docs', cfg.lang);
  let docCount = 0, keptActiveState = false;
  for (const f of renderTree(srcDocs, vars)) {
    const dest = path.join(target, 'docs', f.rel);
    if (path.basename(f.rel) === 'ACTIVE_STATE.md' && exists(dest)) { keptActiveState = true; continue; }
    ensureDir(path.dirname(dest));
    if (exists(dest)) backup(dest);
    fs.writeFileSync(dest, f.content);
    docCount++;
  }
  log.ok(`Docs    : ${docCount} file(s) [${cfg.lang}]` + (keptActiveState ? ' · kept existing ACTIVE_STATE.md' : ''));

  // ---- 2. CLAUDE.md / AGENTS.md managed block ----
  const claudeInner = renderString(fs.readFileSync(path.join(templates, 'CLAUDE.md.tmpl'), 'utf8'), vars);
  const agentsInner = renderString(fs.readFileSync(path.join(templates, 'AGENTS.md.tmpl'), 'utf8'), vars);
  log.ok(`CLAUDE.md: ${mergeManagedBlock(path.join(target, 'CLAUDE.md'), claudeInner, cfg.projectName)}`);
  log.ok(`AGENTS.md: ${mergeManagedBlock(path.join(target, 'AGENTS.md'), agentsInner, null)}`);

  // ---- 3. hooks + settings ----
  ensureDir(path.join(target, '.claude', 'hooks'));
  for (const h of ['git-guard.cjs', 'stop-reminder.cjs']) {
    fs.copyFileSync(path.join(templates, 'common', '.claude', 'hooks', h), path.join(target, '.claude', 'hooks', h));
  }
  mergeSettings(path.join(target, '.claude', 'settings.json'), path.join(templates, 'common', '.claude', 'settings.json'));
  log.ok('Hooks   : git-guard + stop-reminder installed; settings.json merged');

  // ---- 4. config ----
  writeJSON(path.join(target, '.hero-vibe-kit', 'config.json'), cfg);
  log.ok('Config  : .hero-vibe-kit/config.json');

  // ---- 5. optional integrations ----
  if (!flags['skip-integrations']) {
    await require('./integrations.cjs').run({ target, cfg, detect: d, ask, pkgRoot });
  } else {
    log.warn('Skipped integrations (skills / gitnexus / serena).');
  }

  ask.close();

  log.title('Next steps');
  console.log('  1. Review docs/AGENCY_WORKFLOW.md (single source of truth).');
  console.log('  2. Restart Claude Code (or run /hooks) to activate the git-guard + stop-reminder hooks.');
  console.log('  3. Fill <TBD> in DEFINITION_OF_DONE / SECURITY_STANDARDS / PERFORMANCE_STANDARDS when you pick a stack.');
  console.log('  4. Run: npx hero-vibe-kit doctor');
}

module.exports = { init };
