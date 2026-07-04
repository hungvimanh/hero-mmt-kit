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
      const eqIdx = a.indexOf('=');
      if (eqIdx !== -1) { flags[a.slice(2, eqIdx)] = a.slice(eqIdx + 1); }
      else if (argv[i + 1] !== undefined && !argv[i + 1].startsWith('--')) { flags[a.slice(2)] = argv[++i]; }
      else { flags[a.slice(2)] = true; }
    } else if (a.startsWith('-') && a.length === 2) {
      flags[a.slice(1)] = true;
    } else pos.push(a);
  }
  return { cmd: pos[0], pos, flags };
}

function printHelp() {
  console.log(`hero-vibe-kit — AI-assisted development workflow for Claude Code and Cursor

Usage: npx hero-vibe-kit <command> [flags]

Commands:
  init      Install the workflow into the current project (new or brownfield)
  update    Re-render managed regions, preserving your edits
  discover  Scan a brownfield project and create an AI discovery report
  brownfield Alias for discover
  doctor    Validate the install (hooks, settings.json, session state, doc links, tools)
  version   Print the version
  help      Show this help

Flags:
  --dir <path>          Target project dir (default: current dir)
  --preset <name>       solo | small-team | enterprise
  --profile <name>      Assistance profile: vibecode | coding-assistant
  --surface <name>      Project surface: fullstack | backend | frontend
  --verify <level>      Verification level: strict | pragmatic | minimal
  --ide <target>        IDE target: claude-code | cursor | both (required with --yes)
  --yes                 Non-interactive; accept defaults
  --skip-integrations   Skip skills / gitnexus / serena prompts
  --strict              (doctor only) treat warnings as failures — for CI use

Assistance profile, project surface, verification level, and IDE target tune the installed workflow guidance.`);
}

async function main() {
  const { cmd, flags } = parseArgs(process.argv.slice(2));
  const target = flags.dir ? path.resolve(String(flags.dir)) : process.cwd();
  const opts = { pkgRoot: PKG_ROOT, target, flags };
  const version = () => console.log(require('../package.json').version);

  if (Object.prototype.hasOwnProperty.call(flags, 'lang')) {
    console.error('Warning: --lang was removed. hero-vibe-kit templates are English-only.');
  }

  if (flags.version || flags.v) { version(); return; }

  switch (cmd) {
    case 'init': await require('../src/init.cjs').init(opts); break;
    case 'update': await require('../src/update.cjs').update(opts); break;
    case 'discover': case 'brownfield': await require('../src/discover.cjs').discover(opts); break;
    case 'doctor': await require('../src/doctor.cjs').doctor(opts); break;
    case 'version': version(); break;
    case 'help': case undefined: printHelp(); break;
    default:
      console.error('Unknown command: ' + cmd); printHelp(); process.exit(1);
  }
}

main().catch((e) => { console.error((e && e.stack) || e); process.exit(1); });
