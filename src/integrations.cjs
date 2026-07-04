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

function runCmd(cmd, args, cwd) {
  try {
    const r = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' });
    return r.status === 0;
  } catch (_) { return false; }
}

const SERENA_MEMOS = {
  'agency_workflow.md':
    'Canonical development process (single source of truth): **docs/AGENCY_WORKFLOW.md**.\n\n' +
    'Summary: classify every request via the router table → pick a path (Read-only / Fast / Standard / Full). ' +
    'Do NOT run the full 5-phase process for small tasks. A "Gate" means real Plan Mode (ExitPlanMode), not a promise.\n\n' +
    'Details (always read the source files, do not duplicate here): docs/AGENCY_WORKFLOW.md, docs/DEFINITION_OF_DONE.md, ' +
    'docs/BRANCHING.md, docs/TEAM_ROSTER.md, docs/ACTIVE_STATE.md, docs/COMMUNICATION_PROTOCOL.md, ' +
    'docs/SECURITY_STANDARDS.md, docs/PERFORMANCE_STANDARDS.md.\n',
  'delegation_rules.md':
    'Sub-agent delegation rules (canonical): **docs/TEAM_ROSTER.md**.\n\n' +
    'Summary: sub-agents are best as context-collectors (research/exploration) and reviewers (QA/code-review). ' +
    'Required review/QA is path-triggered (Standard/Full), not user-prompt-triggered — do it even if unasked. ' +
    'Delegating implementation is OPTIONAL: the main agent implements with full context by default, and delegates ' +
    'Dev work only when it genuinely helps (independent parallel tracks, or to isolate context). Not every task needs a sub-agent. ' +
    'Sub-agents do NOT inherit the conversation/skills/context → any delegated prompt must be SELF-CONTAINED ' +
    '(PRD/TDD links, skills to invoke, Done criteria, relevant files). Parallelize FE/BE only after the API contract ' +
    'is locked in Phase 2; use isolation: "worktree" for overlapping edits.\n',
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

  // ---- Skills (design — auto-install for vibecode / frontend / fullstack; skip for backend coding-assistant) ----
  const wantsDesign = cfg.assistanceProfile === 'vibecode' || cfg.projectSurface === 'frontend' || cfg.projectSurface === 'fullstack';
  const designGroups = ['brand', 'design-direction', 'design-tools'];
  const designSources = Array.from(new Set(designGroups.flatMap((name) => installableSources(manifest.groups && manifest.groups[name]))));
  if (wantsDesign && designSources.length) {
    for (const src of designSources) runCmd('npx', ['--yes', 'skills', 'add', src, '--yes'], target);
    cfg.integrations.design = 'installed';
    log.ok('Design packs installed — set ONE direction + profile in docs/TEAM_ROSTER.md §3.');
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

  writeJSON(path.join(target, '.hero-vibe-kit', 'config.json'), cfg);
}

module.exports = { run };
