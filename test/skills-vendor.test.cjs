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
  'security-review', 'using-hero', 'hero-planning', 'hero-coding', 'hero-reviewing',
  'hero-unit-test', 'hero-security', 'hero-strict',
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
  assert.ok(!fs.existsSync(path.join(SKILLS_DIR, 'concise-output')), 'concise-output should be integrated into hero-* skills, not shipped standalone');
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

test('hero-mmt-kit-authored skills avoid placeholders', () => {
  const securityReview = fs.readFileSync(path.join(SKILLS_DIR, 'security-review', 'SKILL.md'), 'utf8');
  assert.match(securityReview, /^name: security-review$/m);
  assert.match(securityReview, /OWASP/i);
  assert.match(securityReview, /auth\/authz/i);
  assert.doesNotMatch(securityReview, /TBD|TODO|implement later|fill in details/i);

  const HERO_SKILLS = ['using-hero', 'hero-planning', 'hero-coding', 'hero-reviewing', 'hero-unit-test', 'hero-security', 'hero-strict'];
  for (const name of HERO_SKILLS) {
    const body = fs.readFileSync(path.join(SKILLS_DIR, name, 'SKILL.md'), 'utf8');
    assert.match(body, new RegExp(`^name: ${name}$`, 'm'), `${name}: frontmatter name mismatch`);
    assert.doesNotMatch(body, /TBD|TODO|implement later|fill in details/i, `${name}: contains a placeholder`);
  }
});

test('hero workflow skills embed concise reporting guidance', () => {
  const expected = {
    'using-hero': /concise.*technical fact|technical fact.*concise/i,
    'hero-planning': /concise.*complete/i,
    'hero-coding': /Report style/i,
    'hero-reviewing': /Review style/i,
    'hero-unit-test': /Test report style/i,
    'hero-security': /Security finding style/i,
    'hero-strict': /Strict verification style/i,
  };

  for (const [name, pattern] of Object.entries(expected)) {
    const body = fs.readFileSync(path.join(SKILLS_DIR, name, 'SKILL.md'), 'utf8');
    assert.match(body, pattern, `${name}: missing embedded concise reporting guidance`);
    assert.match(body, /file paths|commands|API names|error/i, `${name}: should preserve technical facts verbatim`);
  }
});

test('subagent-driven-development ships its scripts and model-selection discipline', () => {
  const dir = path.join(SKILLS_DIR, 'subagent-driven-development');
  const scriptsDir = path.join(dir, 'scripts');
  for (const name of ['sdd-workspace.sh', 'task-brief.sh', 'review-package.sh']) {
    const p = path.join(scriptsDir, name);
    assert.ok(fs.existsSync(p), `missing script: scripts/${name}`);
    const body = fs.readFileSync(p, 'utf8');
    assert.match(body, /^#!\/usr\/bin\/env bash/, `${name}: missing bash shebang`);
    try {
      const { execFileSync } = require('node:child_process');
      execFileSync('bash', ['-n', p], { stdio: 'pipe' });
    } catch (err) {
      if (err.code !== 'ENOENT') throw new Error(`${name}: bash syntax check failed: ${err.message}`);
      // bash not resolvable on this machine — skip the syntax check, existence/shebang already verified
    }
  }

  for (const name of ['implementer-prompt.md', 'spec-reviewer-prompt.md', 'code-quality-reviewer-prompt.md']) {
    const body = fs.readFileSync(path.join(dir, name), 'utf8');
    assert.match(body, /model:/, `${name}: missing explicit model: field`);
  }

  const skillMd = fs.readFileSync(path.join(dir, 'SKILL.md'), 'utf8');
  assert.match(skillMd, /## Durable Progress/);
  assert.match(skillMd, /## Pre-Flight Plan Review/);
});
