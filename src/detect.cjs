'use strict';
const fs = require('fs');
const path = require('path');
const { exists } = require('./util.cjs');

const CODE_EXT = new Set(['.js', '.mjs', '.cjs', '.ts', '.jsx', '.tsx', '.py', '.go', '.rs', '.java', '.rb', '.php', '.cs', '.cpp', '.c', '.h', '.vue', '.svelte', '.kt', '.swift', '.scala', '.dart']);
const SKIP = new Set(['.git', 'node_modules', '.gitnexus', '.agents', '.hero-mmt-kit', 'templates', 'dist', 'build', '.next', 'out', 'vendor', '__pycache__', '.serena', '.claude', '.cursor', 'coverage']);

function findCode(dir, depth) {
  if (depth > 3) return false;
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return false; }
  for (const e of entries) {
    if (e.isDirectory()) {
      if (SKIP.has(e.name) || e.name.startsWith('.')) continue;
      if (findCode(path.join(dir, e.name), depth + 1)) return true;
    } else if (CODE_EXT.has(path.extname(e.name))) {
      return true;
    }
  }
  return false;
}

function detect(target) {
  const r = {
    target,
    isGitRepo: exists(path.join(target, '.git')),
    existingClaudeMd: exists(path.join(target, 'CLAUDE.md')),
    existingAgentsMd: exists(path.join(target, 'AGENTS.md')),
    existingSettings: exists(path.join(target, '.claude', 'settings.json')),
    existingActiveState: exists(path.join(target, 'docs', 'ACTIVE_STATE.md')),
    existingConfig: exists(path.join(target, '.hero-mmt-kit', 'config.json')),
    hasSkillsLock: exists(path.join(target, 'skills-lock.json')),
    hasVendoredSkills: exists(path.join(target, '.claude', 'skills')),
    hasSerena: exists(path.join(target, '.serena')),
    hasGitnexus: exists(path.join(target, '.gitnexus')),
    hasCode: findCode(target, 0),
  };
  r.brownfield = r.hasCode || r.existingClaudeMd || r.existingAgentsMd;
  return r;
}

module.exports = { detect };
