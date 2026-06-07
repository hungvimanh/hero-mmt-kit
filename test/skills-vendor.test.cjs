'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const SKILLS_DIR = path.join(__dirname, '..', 'templates', 'skills');
const VENDORED = [
  'brainstorming', 'writing-plans', 'executing-plans', 'test-driven-development',
  'systematic-debugging', 'verification-before-completion', 'requesting-code-review',
  'receiving-code-review', 'dispatching-parallel-agents', 'subagent-driven-development',
  'using-git-worktrees', 'finishing-a-development-branch', 'using-superpowers',
  'phase-handoff',
];

test('every curated core skill is vendored with a SKILL.md + frontmatter', () => {
  for (const name of VENDORED) {
    const skill = path.join(SKILLS_DIR, name, 'SKILL.md');
    assert.ok(fs.existsSync(skill), `missing vendored skill: ${name}/SKILL.md`);
    const head = fs.readFileSync(skill, 'utf8').slice(0, 600);
    assert.match(head, /^---/, `${name}: missing frontmatter`);
    assert.match(head, /\nname:/, `${name}: missing name in frontmatter`);
    assert.match(head, /\ndescription:/, `${name}: missing description in frontmatter`);
  }
});

test('NOTICE attribution to obra/superpowers (MIT) is present', () => {
  const notice = fs.readFileSync(path.join(SKILLS_DIR, 'NOTICE'), 'utf8');
  assert.match(notice, /obra\/superpowers/);
  assert.match(notice, /MIT/);
});

test('skill-authoring meta + dev-only cruft are trimmed', () => {
  // writing-skills is intentionally excluded (consumers do not author skills)
  assert.ok(!fs.existsSync(path.join(SKILLS_DIR, 'writing-skills')), 'writing-skills should not be vendored');
  // dev-only/meta files removed from systematic-debugging
  for (const cruft of ['CREATION-LOG.md', 'test-academic.md', 'test-pressure-1.md', 'test-pressure-2.md', 'test-pressure-3.md']) {
    assert.ok(!fs.existsSync(path.join(SKILLS_DIR, 'systematic-debugging', cruft)), `cruft not trimmed: systematic-debugging/${cruft}`);
  }
  // non–Claude-Code tool references removed from using-superpowers
  assert.ok(!fs.existsSync(path.join(SKILLS_DIR, 'using-superpowers', 'references')), 'using-superpowers/references should be trimmed');
});

test('vendored set matches the manifest process group', () => {
  const manifest = require(path.join(__dirname, '..', 'skills.manifest.json'));
  const proc = manifest.groups.process;
  assert.strictEqual(proc.tier, 'vendored');
  assert.strictEqual(proc.bundled, true);
  const names = proc.skills.map((s) => s.name).sort();
  assert.deepStrictEqual(names, [...VENDORED].sort());
});

test('phase-handoff skill is authored locally and avoids placeholders', () => {
  const skill = fs.readFileSync(path.join(SKILLS_DIR, 'phase-handoff', 'SKILL.md'), 'utf8');
  assert.match(skill, /^name: phase-handoff$/m);
  assert.match(skill, /^description: Use when/m);
  assert.match(skill, /artifact-first/);
  assert.match(skill, /Sanity check/);
  assert.doesNotMatch(skill, /TBD|TODO|implement later|fill in details/i);
});
