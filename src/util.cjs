'use strict';
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const C = { reset: '\x1b[0m', dim: '\x1b[2m', red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', cyan: '\x1b[36m', bold: '\x1b[1m' };
const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
function c(col, s) { return useColor ? col + s + C.reset : s; }

const log = {
  info: (m) => console.log(m),
  step: (m) => console.log(c(C.cyan, '» ') + m),
  ok: (m) => console.log(c(C.green, '✓ ') + m),
  warn: (m) => console.log(c(C.yellow, '⚠ ') + m),
  err: (m) => console.error(c(C.red, '✗ ') + m),
  title: (m) => console.log('\n' + c(C.bold, m)),
};

function ensureDir(d) { fs.mkdirSync(d, { recursive: true }); }
function exists(p) { try { fs.accessSync(p); return true; } catch (_) { return false; } }
function readJSON(p, fallback) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (_) { return fallback; } }
function writeJSON(p, obj) { ensureDir(path.dirname(p)); fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n'); }
function backup(p) { if (exists(p)) { const b = p + '.bak'; fs.copyFileSync(p, b); return b; } return null; }

// Interactive asker. When `auto` is true (--yes / non-interactive), never prompts: returns defaults.
function makeAsker(auto) {
  let rl = null;
  function q(question) {
    if (auto) return Promise.resolve('');
    if (!rl) rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((res) => rl.question(question, (a) => res(a)));
  }
  async function text(label, def) {
    const a = (await q(`${label}${def ? ` [${def}]` : ''}: `)).trim();
    return a || def || '';
  }
  async function yesno(label, defYes) {
    if (auto) return defYes;
    const a = (await q(`${label} ${defYes ? '[Y/n]' : '[y/N]'}: `)).trim().toLowerCase();
    if (!a) return defYes;
    return a === 'y' || a === 'yes';
  }
  async function choice(label, opts, defIdx) {
    defIdx = defIdx || 0;
    if (auto) return opts[defIdx];
    console.log(label);
    opts.forEach((o, i) => console.log(`  ${i + 1}) ${o}`));
    const a = (await q(`Choose [${defIdx + 1}]: `)).trim();
    const i = parseInt(a, 10);
    return (i >= 1 && i <= opts.length) ? opts[i - 1] : opts[defIdx];
  }
  function close() { if (rl) rl.close(); }
  return { text, yesno, choice, close };
}

module.exports = { C, c, log, ensureDir, exists, readJSON, writeJSON, backup, makeAsker };
