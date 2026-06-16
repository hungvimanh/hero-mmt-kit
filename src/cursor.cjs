'use strict';
const fs = require('fs');
const path = require('path');
const { ensureDir, exists, backup } = require('./util.cjs');
const { renderString } = require('./render.cjs');
const { mergeCursorHooks } = require('./merge.cjs');

const HOOK_FILES = ['git-guard.cjs', 'stop-reminder.cjs', 'workflow-check.cjs'];
const RULE_FILE = 'hero-vibe-kit.mdc';

function hookSourceDir(pkgRoot) {
  return path.join(pkgRoot, 'templates', 'common', '.claude', 'hooks');
}

function installHooks(target, pkgRoot, hookRelDir) {
  const src = hookSourceDir(pkgRoot);
  const dst = path.join(target, hookRelDir);
  ensureDir(dst);
  for (const h of HOOK_FILES) {
    fs.copyFileSync(path.join(src, h), path.join(dst, h));
  }
}

function installCursor(pkgRoot, target, vars) {
  const templates = path.join(pkgRoot, 'templates');
  installHooks(target, pkgRoot, '.cursor/hooks');
  mergeCursorHooks(
    path.join(target, '.cursor', 'hooks.json'),
    path.join(templates, 'common', '.cursor', 'hooks.json')
  );

  const ruleTmpl = fs.readFileSync(path.join(templates, 'CURSOR-RULE.mdc.tmpl'), 'utf8');
  const ruleDest = path.join(target, '.cursor', 'rules', RULE_FILE);
  ensureDir(path.dirname(ruleDest));
  if (exists(ruleDest)) backup(ruleDest);
  fs.writeFileSync(ruleDest, renderString(ruleTmpl, vars));
}

function refreshCursor(pkgRoot, target, vars) {
  installCursor(pkgRoot, target, vars);
}

module.exports = {
  HOOK_FILES,
  RULE_FILE,
  hookSourceDir,
  installHooks,
  installCursor,
  refreshCursor,
};
