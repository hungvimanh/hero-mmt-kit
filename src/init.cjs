'use strict';
const fs = require('fs');
const path = require('path');
const { log, ensureDir, exists, backup, writeJSON, makeAsker } = require('./util.cjs');
const { detect } = require('./detect.cjs');
const { renderTree, renderString } = require('./render.cjs');
const { mergeManagedBlock, mergeSettings } = require('./merge.cjs');
const { collectProfileConfig } = require('./profile-config.cjs');
const { defaultSession } = require('./workflow-state.cjs');

async function init(opts) {
  const { pkgRoot, target, flags } = opts;
  const templates = path.join(pkgRoot, 'templates');
  const auto = !!flags.yes;
  const ask = makeAsker(auto);

  log.title('hero-mmt-kit · init');
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
  try {
    cfg = await collectProfileConfig(cfg, flags, ask);
  } catch (e) {
    log.err(e.message);
    ask.close();
    process.exit(1);
  }
  if (!cfg.enforceLevel) cfg.enforceLevel = 'mixed';
  delete cfg.lang;
  cfg.version = JSON.parse(fs.readFileSync(path.join(pkgRoot, 'package.json'), 'utf8')).version;
  cfg.brownfield = d.brownfield;

  const vars = { DATE: new Date().toISOString().slice(0, 10) };

  const skillDirs = ['.claude/skills'];

  // ---- 1. docs ----
  const srcDocs = path.join(templates, 'docs');
  let docCount = 0, keptActiveState = false;
  for (const f of renderTree(srcDocs, vars)) {
    const dest = path.join(target, 'docs', f.rel);
    if (path.basename(f.rel) === 'ACTIVE_STATE.md' && exists(dest)) { keptActiveState = true; continue; }
    if (path.basename(f.rel) === 'BROWNFIELD_DISCOVERY.md' && exists(dest)) continue;
    ensureDir(path.dirname(dest));
    if (exists(dest)) backup(dest);
    fs.writeFileSync(dest, f.content);
    docCount++;
  }
  log.ok(`Docs    : ${docCount} file(s)` + (keptActiveState ? ' · kept existing ACTIVE_STATE.md' : ''));

  // ---- 2. CLAUDE.md / AGENTS.md managed block ----
  const claudeInner = renderString(fs.readFileSync(path.join(templates, 'CLAUDE.md.tmpl'), 'utf8'), vars);
  const agentsInner = renderString(fs.readFileSync(path.join(templates, 'AGENTS.md.tmpl'), 'utf8'), vars);
  log.ok(`CLAUDE.md: ${mergeManagedBlock(path.join(target, 'CLAUDE.md'), claudeInner, 'Project')}`);
  log.ok(`AGENTS.md: ${mergeManagedBlock(path.join(target, 'AGENTS.md'), agentsInner, null)}`);

  // ---- 3. Claude Code hooks + settings ----
  ensureDir(path.join(target, '.claude', 'hooks'));
  for (const h of ['git-guard.cjs', 'stop-reminder.cjs', 'session-bridge.cjs']) {
    fs.copyFileSync(path.join(templates, 'common', '.claude', 'hooks', h), path.join(target, '.claude', 'hooks', h));
  }
  mergeSettings(path.join(target, '.claude', 'settings.json'), path.join(templates, 'common', '.claude', 'settings.json'));
  log.ok('Claude  : git-guard + stop-reminder + session-bridge → .claude/hooks; settings.json merged');

  // ---- 3a. selected vendored core skills ----
  const skills = require('./skills.cjs');
  const selectedSkills = skills.selectProcessSkills(cfg);
  const sk = skills.installSkills(pkgRoot, target, { selectedSkills, destinations: skillDirs });
  log.ok(`Skills  : ${sk.skills} bundled core skill(s) → ${skillDirs.join(', ') || '(none)'}`);

  // ---- 4. config + session state ----
  writeJSON(path.join(target, '.hero-mmt-kit', 'config.json'), cfg);
  log.ok('Config  : .hero-mmt-kit/config.json');

  const sessionPath = path.join(target, '.hero-mmt-kit', 'session.json');
  if (!exists(sessionPath)) {
    writeJSON(sessionPath, defaultSession());
    log.ok('Session : .hero-mmt-kit/session.json (seeded)');
  } else {
    log.ok('Session : .hero-mmt-kit/session.json (preserved)');
  }

  const schemaSrc = path.join(pkgRoot, 'templates', '.hero-mmt-kit', 'session.schema.json');
  if (exists(schemaSrc)) {
    const schemaDest = path.join(target, '.hero-mmt-kit', 'session.schema.json');
    if (!exists(schemaDest)) fs.copyFileSync(schemaSrc, schemaDest);
  }

  // ---- 5. optional integrations ----
  if (!flags['skip-integrations']) {
    await require('./integrations.cjs').run({ target, cfg, detect: d, pkgRoot });
  } else {
    log.warn('Skipped integrations (design skills / gitnexus / serena). Core skills are bundled regardless.');
  }

  ask.close();

  log.title('Next steps');
  console.log('  1. Invoke the using-hero skill for an overview of the hero-* workflow skills.');
  console.log('  2. Restart Claude Code (or run /hooks) to activate .claude hooks.');
  console.log('  3. Fill <TBD> in SECURITY_STANDARDS / PERFORMANCE_STANDARDS when you pick a stack.');
  console.log('  4. Run: npx hero-mmt-kit doctor');
}

module.exports = { init };
