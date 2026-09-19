'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { log, exists, ensureDir, readJSON, writeJSON } = require('./util.cjs');

function uniqueSources(group) {
  return Array.from(new Set((group && group.skills || []).map((s) => s.source)));
}

function installableSources(group) {
  return uniqueSources(group).filter((src) => src && src !== '<TBD>');
}

function wantsDesignIntegration(cfg) {
  return !!(cfg && cfg.installTasteSkill);
}

function runCmd(cmd, args, cwd) {
  try {
    const r = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' });
    return r.status === 0;
  } catch (_) { return false; }
}

const SERENA_MEMOS = {
  'hero_workflow.md':
    'Human-led Claude Code workflow (hero-mmt-kit). Use the **using-hero** skill for the overview.\n\n' +
    'Core skills: hero-planning (implementation-only plan), hero-coding (implementation and requirement tracking only), ' +
    'hero-reviewing (read-only review and supplied-feedback assessment), hero-unit-test (post-implementation unit tests only), ' +
    'hero-mr-review (standalone review of a teammate\'s MR by commit/tag/branch), ' +
    'hero-strict (opt-in full verification pass before a "done" claim).\n\n' +
    'Session state: docs/ACTIVE_STATE.md\'s Active Features table (the single source of durable workflow state).\n\n' +
    'Details (always read the source files, do not duplicate here): docs/ACTIVE_STATE.md, docs/SECURITY_STANDARDS.md, ' +
    'docs/PERFORMANCE_STANDARDS.md.\n',
  'delegation_rules.md':
    'Sub-agent delegation is optional, not automatic.\n\n' +
    'Summary: sub-agents are best as context-collectors for research/exploration and as independent read-only reviewers. ' +
    'Delegating implementation is OPTIONAL and must keep one writing agent active per shared worktree. ' +
    'Every delegated prompt must be SELF-CONTAINED and inherit the active Hero stage boundary: coding cannot add tests/review, ' +
    'reviewing cannot write/fix/run verification, and unit testing cannot modify production code. Include the plan/target, ' +
    'allowed files/actions, exclusions, and Definition of Done; use isolation: "worktree" for overlapping edits.\n',
};

async function run(ctx) {
  const { target, cfg, detect, pkgRoot } = ctx;
  const manifest = readJSON(path.join(pkgRoot, 'skills.manifest.json'), { groups: {} });
  cfg.integrations = cfg.integrations || {};

  log.title('Integrations (auto-detected — no prompts)');

  // ---- Skills (process core) ----
  // Core process skills are now VENDORED and installed by init/update into
  // .claude/skills/ (no `skills` CLI needed). Nothing to do here.
  cfg.integrations.skills = 'bundled';

  // ---- Skills (design — installed only when the user opted into the taste/design skill) ----
  const wantsDesign = wantsDesignIntegration(cfg);
  const designGroups = ['brand', 'design-direction', 'design-tools'];
  const designSources = Array.from(new Set(designGroups.flatMap((name) => installableSources(manifest.groups && manifest.groups[name]))));
  if (wantsDesign && designSources.length) {
    for (const src of designSources) runCmd('npx', ['--yes', 'skills', 'add', src, '--yes'], target);
    cfg.integrations.design = 'installed';
    log.ok('Design packs installed — set ONE direction + profile in docs/DESIGN_STANDARDS.md §2.');
  } else {
    cfg.integrations.design = 'skipped';
  }

  // ---- GitNexus (auto-run only if this repo already has a .gitnexus index) ----
  if (detect.hasGitnexus) {
    log.step('npx gitnexus analyze');
    cfg.integrations.gitnexus = runCmd('npx', ['--yes', 'gitnexus', 'analyze'], target) ? 'indexed' : 'failed';
    if (cfg.integrations.gitnexus === 'failed') log.warn('GitNexus not run. Install/retry later: npx gitnexus analyze');
  } else {
    cfg.integrations.gitnexus = 'skipped';
  }

  // ---- Serena (auto-seed pointer notes only if Serena is already installed) ----
  if (detect.hasSerena) {
    const memDir = path.join(target, '.serena', 'memories', 'project');
    ensureDir(memDir);
    for (const [name, content] of Object.entries(SERENA_MEMOS)) {
      fs.writeFileSync(path.join(memDir, name), content);
    }
    cfg.integrations.serena = 'seeded';
    log.ok('Serena pointer notes seeded (.serena/memories/project/).');
  } else {
    cfg.integrations.serena = 'skipped';
  }

  writeJSON(path.join(target, '.hero-mmt-kit', 'config.json'), cfg);
}

module.exports = { installableSources, run, wantsDesignIntegration };
