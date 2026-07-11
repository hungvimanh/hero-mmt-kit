'use strict';
const fs = require('fs');
const path = require('path');

function renderString(s, vars) {
  return s.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in vars ? vars[k] : m));
}

function walk(dir) {
  let out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out = out.concat(walk(p));
    else out.push(p);
  }
  return out;
}

// Returns [{ rel, content }] with placeholders substituted.
function renderTree(srcDir, vars) {
  return walk(srcDir).map((abs) => ({
    rel: path.relative(srcDir, abs),
    content: renderString(fs.readFileSync(abs, 'utf8'), vars),
  }));
}

module.exports = { renderString, renderTree, walk };
