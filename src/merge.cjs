'use strict';
const fs = require('fs');
const path = require('path');
const { ensureDir, exists, backup } = require('./util.cjs');

const START = '<!-- hero-mmt-kit:start -->';
const END = '<!-- hero-mmt-kit:end -->';

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function block(inner) {
  return `${START}\n<!-- Managed by hero-mmt-kit. Update via the framework; edits inside this block are overwritten on \`update\`. -->\n${inner.trim()}\n${END}`;
}

// Insert/replace the hero-mmt-kit managed block. Preserves everything outside the markers.
function mergeManagedBlock(file, inner, titleIfNew) {
  const b = block(inner);
  if (!exists(file)) {
    ensureDir(path.dirname(file));
    const head = titleIfNew ? `# ${titleIfNew}\n\n` : '';
    fs.writeFileSync(file, head + b + '\n');
    return 'created';
  }
  let txt = fs.readFileSync(file, 'utf8');
  backup(file);
  if (txt.includes(START) && txt.includes(END)) {
    txt = txt.replace(new RegExp(escapeRe(START) + '[\\s\\S]*?' + escapeRe(END)), b);
  } else {
    txt = txt.replace(/\s*$/, '') + '\n\n' + b + '\n';
  }
  fs.writeFileSync(file, txt);
  return 'merged';
}

// Deep-merge our hooks + permissions into an existing settings.json without clobbering the user's.
function mergeSettings(file, templateFile) {
  const tpl = JSON.parse(fs.readFileSync(templateFile, 'utf8'));
  let cur = {};
  if (exists(file)) { cur = JSON.parse(fs.readFileSync(file, 'utf8')); backup(file); }
  else ensureDir(path.dirname(file));

  cur.hooks = cur.hooks || {};
  for (const ev of Object.keys(tpl.hooks || {})) {
    cur.hooks[ev] = cur.hooks[ev] || [];
    const existingCmds = new Set();
    for (const m of cur.hooks[ev]) for (const h of (m.hooks || [])) existingCmds.add(h.command);
    for (const matcher of tpl.hooks[ev]) {
      const newHooks = (matcher.hooks || []).filter((h) => !existingCmds.has(h.command));
      if (newHooks.length) cur.hooks[ev].push(Object.assign({}, matcher, { hooks: newHooks }));
    }
  }

  if (tpl.permissions && tpl.permissions.allow) {
    cur.permissions = cur.permissions || {};
    cur.permissions.allow = Array.from(new Set([...(cur.permissions.allow || []), ...tpl.permissions.allow]));
  }

  fs.writeFileSync(file, JSON.stringify(cur, null, 2) + '\n');
}

module.exports = { mergeManagedBlock, mergeSettings, START, END };
