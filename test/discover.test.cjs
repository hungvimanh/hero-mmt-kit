'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const BIN = path.join(__dirname, '..', 'bin', 'hero-mmt-kit.js');
function cli(args, opts) { return spawnSync('node', [BIN, ...args], Object.assign({ encoding: 'utf8' }, opts)); }
function mkdir() { return fs.mkdtempSync(path.join(os.tmpdir(), 'hvk-discover-')); }

test('discover creates a brownfield report for code with docs outside docs', () => {
  const dir = mkdir();
  fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'tests'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'architecture'), { recursive: true });
  fs.mkdirSync(path.join(dir, '.github'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'src', 'app.ts'), 'export const app = 1;\n');
  fs.writeFileSync(path.join(dir, 'tests', 'app.test.ts'), 'export {};\n');
  fs.writeFileSync(path.join(dir, 'README.md'), '# Legacy\n');
  fs.writeFileSync(path.join(dir, 'architecture', 'ADR-001.md'), '# ADR\n');
  fs.writeFileSync(path.join(dir, '.github', 'copilot-instructions.md'), '# Instructions\n');
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ scripts: { test: 'node --test', build: 'tsc' } }, null, 2));

  const r = cli(['discover', '--dir', dir]);
  assert.strictEqual(r.status, 0, r.stderr);

  const reportPath = path.join(dir, 'docs', 'BROWNFIELD_DISCOVERY.md');
  assert.ok(fs.existsSync(reportPath), 'report created');
  const report = fs.readFileSync(reportPath, 'utf8');
  assert.match(report, /Brownfield Discovery/);
  assert.match(report, /README\.md/);
  assert.match(report, /architecture\/ADR-001\.md/);
  assert.match(report, /\.github\/copilot-instructions\.md/);
  assert.match(report, /src\//);
  assert.match(report, /tests\//);
  assert.match(report, /npm run test/);
});

test('brownfield alias creates English report and is idempotent even when --lang is passed', () => {
  const dir = mkdir();
  fs.mkdirSync(path.join(dir, 'app'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'app', 'main.js'), 'console.log(1);\n');

  const first = cli(['brownfield', '--dir', dir, '--lang', 'vi']);
  assert.strictEqual(first.status, 0, first.stderr);
  assert.match(first.stderr, /--lang was removed/);
  const second = cli(['brownfield', '--dir', dir, '--lang', 'vi']);
  assert.strictEqual(second.status, 0, second.stderr);

  const report = fs.readFileSync(path.join(dir, 'docs', 'BROWNFIELD_DISCOVERY.md'), 'utf8');
  assert.match(report, /What was found/);
  assert.doesNotMatch(report, /Những gì đã tìm thấy/);
  assert.match(report, /app\//);
  assert.strictEqual((report.match(/hero-mmt-kit:start/g) || []).length, 1, 'managed block not duplicated');
});

test('help lists discover and brownfield commands', () => {
  const r = cli(['help']);
  assert.strictEqual(r.status, 0, r.stderr);
  assert.match(r.stdout, /discover/);
  assert.match(r.stdout, /brownfield/);
});
