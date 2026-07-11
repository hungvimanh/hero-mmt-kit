'use strict';
const fs = require('fs');
const path = require('path');
const { exists, ensureDir } = require('./util.cjs');

const CORE_SKILL_ORDER = [
  'using-superpowers',
  'using-hero',
  'brainstorming',
  'writing-plans',
  'executing-plans',
  'test-driven-development',
  'systematic-debugging',
  'verification-before-completion',
  'requesting-code-review',
  'receiving-code-review',
  'dispatching-parallel-agents',
  'subagent-driven-development',
  'using-git-worktrees',
  'finishing-a-development-branch',
  'security-review',
  'hero-planning',
  'hero-coding',
  'hero-reviewing',
  'hero-unit-test',
  'hero-security',
  'hero-strict',
];

function uniqueCoreSkills(names) {
  const allowed = new Set(CORE_SKILL_ORDER);
  const selected = new Set();
  for (const name of names) {
    if (!allowed.has(name)) throw new Error(`Unknown core skill: ${name}`);
    selected.add(name);
  }
  return CORE_SKILL_ORDER.filter((name) => selected.has(name));
}

function selectProcessSkills() {
  return CORE_SKILL_ORDER.slice();
}

// Recursively copy a directory tree, returning the number of files written.
function copyTree(srcDir, dstDir) {
  ensureDir(dstDir);
  let files = 0;
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const s = path.join(srcDir, entry.name);
    const d = path.join(dstDir, entry.name);
    if (entry.isDirectory()) files += copyTree(s, d);
    else { fs.copyFileSync(s, d); files++; }
  }
  return files;
}

function sourceEntries(src, selectedSkills) {
  const selected = selectedSkills ? new Set(uniqueCoreSkills(selectedSkills)) : null;
  return fs.readdirSync(src, { withFileTypes: true }).filter((entry) => {
    return !entry.isDirectory() || !selected || selected.has(entry.name);
  });
}

// Install vendored core skills (templates/skills/<name>/) into the consumer's
// .claude/skills/ dir. Framework-managed:
// overwrites requested framework skill dirs and the NOTICE file, but never deletes
// user-added skill dirs outside the framework-managed process suite.
function installSkills(pkgRoot, target, opts) {
  opts = opts || {};
  const src = path.join(pkgRoot, 'templates', 'skills');
  if (!exists(src)) return { skills: 0, files: 0, selectedSkills: [] };
  const selectedSkills = opts.selectedSkills ? uniqueCoreSkills(opts.selectedSkills) : null;
  const destinations = opts.destinations || ['.claude/skills'];
  let skills = 0, files = 0;
  const installed = [];

  if (selectedSkills) {
    for (const name of selectedSkills) {
      const skillDir = path.join(src, name);
      if (!exists(skillDir)) throw new Error(`Selected core skill is not vendored: ${name}`);
    }
  }

  for (const rel of destinations) {
    const dstRoot = path.join(target, rel);
    for (const entry of sourceEntries(src, selectedSkills)) {
      if (entry.isDirectory()) {
        const dstDir = path.join(dstRoot, entry.name);
        if (selectedSkills && exists(dstDir)) fs.rmSync(dstDir, { recursive: true, force: true });
        files += copyTree(path.join(src, entry.name), dstDir);
        if (!installed.includes(entry.name)) installed.push(entry.name);
        skills = Math.max(skills, installed.length);
      } else {
        ensureDir(dstRoot);
        fs.copyFileSync(path.join(src, entry.name), path.join(dstRoot, entry.name));
        files++;
      }
    }
  }
  return { skills, files, selectedSkills: selectedSkills || installed };
}

module.exports = {
  CORE_SKILL_ORDER,
  installSkills,
  copyTree,
  selectProcessSkills,
};
