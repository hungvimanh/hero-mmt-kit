#!/usr/bin/env node
'use strict';
const path = require('path');
const PKG_ROOT = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const flags = {};
  const pos = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      if (argv[i + 1] !== undefined && !argv[i + 1].startsWith('--')) flags[key] = argv[++i];
      else flags[key] = true;
    } else if (a.startsWith('-') && a.length === 2) {
      flags[a.slice(1)] = true;
    } else pos.push(a);
  }
  return { cmd: pos[0], pos, flags };
}

function printHelp() {
  console.log(`hero-vibe-kit — AI-assisted development workflow for Claude Code

Usage: npx hero-vibe-kit <command> [flags]

Commands:
  init      Install the workflow into the current project (new or brownfield)
  update    Re-render managed regions, preserving your edits
  doctor    Validate the install (hooks, settings.json, doc links, tools)
  version   Print the version
  help      Show this help

Flags:
  --dir <path>          Target project dir (default: current dir)
  --preset <name>       solo | small-team | enterprise
  --lang <en|vi>        Docs language (default: en)
  --name <name>         Project name (default: dir name)
  --yes                 Non-interactive; accept defaults
  --skip-integrations   Skip skills / gitnexus / serena prompts`);
}

async function main() {
  const { cmd, flags } = parseArgs(process.argv.slice(2));
  const target = flags.dir ? path.resolve(String(flags.dir)) : process.cwd();
  const opts = { pkgRoot: PKG_ROOT, target, flags };
  const version = () => console.log(require('../package.json').version);

  if (flags.version || flags.v) { version(); return; }

  switch (cmd) {
    case 'init': await require('../src/init.cjs').init(opts); break;
    case 'update': await require('../src/update.cjs').update(opts); break;
    case 'doctor': await require('../src/doctor.cjs').doctor(opts); break;
    case 'version': version(); break;
    case 'help': case undefined: printHelp(); break;
    default:
      console.error('Unknown command: ' + cmd); printHelp(); process.exit(1);
  }
}

main().catch((e) => { console.error((e && e.stack) || e); process.exit(1); });
