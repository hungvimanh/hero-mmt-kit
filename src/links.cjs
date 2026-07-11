'use strict';
const fs = require('fs');
const path = require('path');

function walk(dir) {
  let out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out = out.concat(walk(p));
    else out.push(p);
  }
  return out;
}

// Check relative .md links resolve. roots = list of files or dirs.
function checkLinks(roots) {
  const broken = [];
  let checked = 0;
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    const files = fs.statSync(root).isDirectory() ? walk(root).filter((f) => f.endsWith('.md')) : [root];
    for (const f of files) {
      const dir = path.dirname(f);
      const txt = fs.readFileSync(f, 'utf8');
      const re = /\]\((\.{1,2}\/[^)#? ]+\.md)/g;
      let m;
      while ((m = re.exec(txt))) {
        checked++;
        const t = path.normalize(path.join(dir, m[1]));
        if (!fs.existsSync(t)) broken.push({ file: f, link: m[1] });
      }
    }
  }
  return { broken, checked };
}

module.exports = { checkLinks, walk };
