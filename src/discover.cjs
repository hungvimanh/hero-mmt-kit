'use strict';
const fs = require('fs');
const path = require('path');
const { log, ensureDir, exists, readJSON } = require('./util.cjs');
const { detect } = require('./detect.cjs');
const { mergeManagedBlock } = require('./merge.cjs');

const DOC_FILES = new Set(['README.md', 'CONTRIBUTING.md', 'CHANGELOG.md', 'ARCHITECTURE.md', 'ROADMAP.md', 'LICENSE.md']);
const DOC_DIRS = new Set(['docs', 'documentation', 'wiki', 'adr', 'architecture', 'specs', 'plans', '.github']);
const CODE_DIRS = new Set(['src', 'app', 'pages', 'components', 'lib', 'server', 'api', 'backend', 'frontend', 'mobile', 'packages', 'apps']);
const TEST_DIRS = new Set(['test', 'tests', '__tests__', 'spec', 'e2e', 'cypress', 'playwright']);
const CONFIG_FILES = new Set([
  'package.json', 'pnpm-lock.yaml', 'package-lock.json', 'yarn.lock', 'tsconfig.json', 'jsconfig.json',
  'vite.config.js', 'vite.config.ts', 'next.config.js', 'next.config.mjs', 'nuxt.config.js', 'nuxt.config.ts',
  'docker-compose.yml', 'docker-compose.yaml', 'Dockerfile', '.env.example', '.env.sample',
  '.github/workflows', '.gitlab-ci.yml', 'Makefile', 'turbo.json', 'nx.json', 'pyproject.toml', 'requirements.txt',
  'go.mod', 'Cargo.toml', 'pom.xml', 'build.gradle', 'settings.gradle'
]);
const SKIP_DIRS = new Set(['.git', 'node_modules', '.hero-vibe-kit', '.claude', '.serena', '.gitnexus', 'dist', 'build', '.next', 'out', 'coverage', 'vendor']);

function rel(target, p) { return path.relative(target, p).split(path.sep).join('/'); }
function hasMarkdown(name) { return /\.mdx?$/i.test(name); }
function uniq(xs) { return Array.from(new Set(xs)).sort(); }
function bullet(xs, empty) { return xs.length ? xs.map((x) => `- ${x}`).join('\n') : `- ${empty}`; }
function section(title, body) { return `## ${title}\n${body}\n`; }

function listEntries(dir) {
  try { return fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return []; }
}

function walkNear(target, visit, maxDepth, maxItems) {
  let seen = 0;
  function walk(dir, depth) {
    if (depth > maxDepth || seen >= maxItems) return;
    for (const e of listEntries(dir)) {
      if (seen >= maxItems) return;
      if (e.isDirectory() && SKIP_DIRS.has(e.name)) continue;
      const abs = path.join(dir, e.name);
      seen++;
      visit(abs, e, depth);
      if (e.isDirectory()) walk(abs, depth + 1);
    }
  }
  walk(target, 0);
}

function scan(target) {
  const found = { docs: [], codeDirs: [], testDirs: [], config: [], ci: [], packageScripts: [] };

  for (const e of listEntries(target)) {
    const abs = path.join(target, e.name);
    if (e.isDirectory()) {
      if (CODE_DIRS.has(e.name)) found.codeDirs.push(e.name + '/');
      if (TEST_DIRS.has(e.name)) found.testDirs.push(e.name + '/');
      if (DOC_DIRS.has(e.name)) found.docs.push(e.name + '/');
    } else {
      if (DOC_FILES.has(e.name) || hasMarkdown(e.name)) found.docs.push(e.name);
      if (CONFIG_FILES.has(e.name)) found.config.push(e.name);
    }
  }

  walkNear(target, (abs, e) => {
    const r = rel(target, abs);
    if (e.isDirectory()) {
      if (r === '.github/workflows') found.ci.push(r + '/');
      if (DOC_DIRS.has(e.name) && r !== e.name) found.docs.push(r + '/');
      if (TEST_DIRS.has(e.name) && r !== e.name) found.testDirs.push(r + '/');
      return;
    }
    if (hasMarkdown(e.name) && (r.includes('/') || !DOC_FILES.has(e.name))) found.docs.push(r);
    if (CONFIG_FILES.has(e.name) || CONFIG_FILES.has(r)) found.config.push(r);
    if (r.startsWith('.github/workflows/')) found.ci.push(r);
  }, 3, 700);

  const pkg = readJSON(path.join(target, 'package.json'), null);
  if (pkg && pkg.scripts) {
    for (const name of ['dev', 'start', 'build', 'test', 'lint', 'typecheck', 'check']) {
      if (pkg.scripts[name]) found.packageScripts.push(`npm run ${name} — ${pkg.scripts[name]}`);
    }
  }

  return {
    docs: uniq(found.docs),
    codeDirs: uniq(found.codeDirs),
    testDirs: uniq(found.testDirs),
    config: uniq(found.config),
    ci: uniq(found.ci),
    packageScripts: uniq(found.packageScripts),
  };
}

function contentEn(date, d, s) {
  return [
    '# Brownfield Discovery',
    '',
    `Generated: ${date}`,
    '',
    section('1. Summary and read-next', [
      '- This is a lightweight orientation map, not a final architecture report.',
      '- Read only the files needed for the selected task path; expand context when evidence is insufficient.',
      '- Do not paste long excerpts here — prefer paths, short evidence notes, and linked reports.', '',
      '### Read next candidates', bullet(uniq([...s.docs.slice(0, 8), ...s.config.slice(0, 8)]), 'No docs/config candidates found — inspect the repository tree and likely code areas.'),
    ].join('\n')),
    section('2. What was found', [
      '### Existing docs and knowledge sources', bullet(s.docs, 'None found yet — ask the AI to inspect code/config first, then create missing docs.'), '',
      '### Likely code/app areas', bullet(s.codeDirs, 'No common top-level code folder found — inspect config files and repository tree.'), '',
      '### Tests', bullet(s.testDirs, 'No common test folder found — inspect package/build config before assuming tests are absent.'), '',
      '### Config/build/CI signals', bullet(uniq([...s.config, ...s.ci]), 'No common config/CI files found.'), '',
      '### Package script candidates', bullet(s.packageScripts, 'No package scripts found.'),
    ].join('\n')),
    section('3. Status labels for the AI', [
      '- **Found**: paths listed above exist in this repo.',
      '- **Likely**: folder names suggest their role, but the AI must read files before claiming behavior.',
      '- **Needs confirmation**: business purpose, user roles, deployment flow, and risky areas must be confirmed with the human if not documented.',
    ].join('\n')),
    section('4. First reading checklist for the AI', [
      '1. Read the summary/read-next list first; do not load every discovered file by default.',
      '2. Read config files needed to identify framework, commands, runtime, env requirements, and entry points.',
      '3. Inspect likely code/app areas only as needed for the selected task path.',
      '4. Inspect tests to learn expected behavior and safe verification commands.',
      '5. Write findings as evidence, not guesses: cite files and separate certainty levels.',
    ].join('\n')),
    section('5. Open questions', [
      '- What is the product/business goal of this project?',
      '- Who are the main users/admins/operators?',
      '- Which flows are most risky to break?',
      '- What command proves the app is healthy locally and in CI?',
      '- Are there docs outside the repository that should be linked as references?',
    ].join('\n')),
    section('6. Assumptions register', '- `<TBD>`'),
    section('7. Notes outside the managed block', 'Add human-written corrections below or above this managed block. Re-run `hero-vibe-kit discover` to refresh only the generated block.'),
    `Brownfield signal: ${d.brownfield ? 'existing project/code detected' : 'no code detected by lightweight scan'}`,
  ].join('\n');
}

async function discover(opts) {
  const { target } = opts;
  log.title('hero-vibe-kit · brownfield discovery');
  log.step(`Target : ${target}`);

  const date = new Date().toISOString().slice(0, 10);
  const d = detect(target);
  const s = scan(target);
  const inner = contentEn(date, d, s);
  const out = path.join(target, 'docs', 'BROWNFIELD_DISCOVERY.md');
  ensureDir(path.dirname(out));
  const result = mergeManagedBlock(out, inner, 'Brownfield Discovery');

  log.ok(`Report : ${path.relative(target, out).split(path.sep).join('/')} (${result})`);
  log.ok(`Docs   : ${s.docs.length} found`);
  log.ok(`Code   : ${s.codeDirs.length} likely area(s)`);
  log.ok(`Tests  : ${s.testDirs.length} likely area(s)`);
  log.title('Next steps');
  console.log('  1. Ask the AI to read docs/BROWNFIELD_DISCOVERY.md before changing code.');
  console.log('  2. Fill the open questions and assumptions after the first real discovery pass.');
  console.log('  3. Run: npx hero-vibe-kit doctor');
}

module.exports = { discover, scan };
