'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const SKILLS_DIR = path.join(__dirname, '..', 'templates', 'skills');
const VENDORED = [
  'brainstorming', 'executing-plans', 'test-driven-development',
  'systematic-debugging', 'verification-before-completion',
  'dispatching-parallel-agents', 'subagent-driven-development',
  'using-git-worktrees', 'using-superpowers',
  'using-hero', 'hero-planning', 'hero-coding', 'hero-reviewing',
  'hero-unit-test', 'hero-security', 'hero-mr-review', 'hero-strict', 'hero-report',
];

function readSkill(name) {
  return fs.readFileSync(path.join(SKILLS_DIR, name, 'SKILL.md'), 'utf8');
}

function readSection(body, heading) {
  const marker = `## ${heading}`;
  const start = body.indexOf(marker);
  assert.notStrictEqual(start, -1, `missing section: ${heading}`);
  const next = body.indexOf('\n## ', start + marker.length);
  return body.slice(start, next === -1 ? body.length : next);
}

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
  assert.match(notice, /Note on hero-reviewing:/);
  assert.match(notice, /former requesting-code-review and\s+receiving-code-review skills/i);
  assert.match(notice, /four-way feedback classification/i);
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
  // hero-mmt-kit intentionally does not automate merge/PR/branch-cleanup decisions
  assert.ok(!fs.existsSync(path.join(SKILLS_DIR, 'finishing-a-development-branch')), 'finishing-a-development-branch should not be vendored');
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
  assert.ok(!fs.existsSync(path.join(SKILLS_DIR, 'security-review')), 'security-review should be merged into hero-security');
  assert.ok(!fs.existsSync(path.join(SKILLS_DIR, 'writing-plans')), 'writing-plans should be merged into hero-planning');
  assert.ok(!fs.existsSync(path.join(SKILLS_DIR, 'requesting-code-review')), 'requesting-code-review should be merged into hero-reviewing');
  assert.ok(!fs.existsSync(path.join(SKILLS_DIR, 'receiving-code-review')), 'receiving-code-review should be merged into hero-reviewing');

  const heroPlanning = fs.readFileSync(path.join(SKILLS_DIR, 'hero-planning', 'SKILL.md'), 'utf8');
  assert.match(heroPlanning, /requirement-to-task/i);
  assert.match(heroPlanning, /implementation work only/i);
  assert.match(heroPlanning, /### Task N:/);
  assert.doesNotMatch(heroPlanning, /plan-document-reviewer-prompt/i);
  const planTemplate = heroPlanning.match(/```markdown\n([\s\S]*?)\n```/);
  assert.ok(planTemplate, 'hero-planning should include a plan document template');
  assert.doesNotMatch(
    planTemplate[1],
    /\b(test(?:ing)?|verification|review|deploy(?:ment)?|release|commit)\b/i,
    'implementation plan template should not contain assurance or delivery stages',
  );

  const heroSecurity = fs.readFileSync(path.join(SKILLS_DIR, 'hero-security', 'SKILL.md'), 'utf8');
  assert.match(heroSecurity, /^name: hero-security$/m);
  assert.match(heroSecurity, /OWASP/i);
  assert.match(heroSecurity, /auth\/authz/i);
  assert.match(heroSecurity, /standalone security review/i);
  assert.match(heroSecurity, /docs\/security-reports\/YYYY-MM-DD-<slug>\.md/i);
  assert.doesNotMatch(heroSecurity, /has no artifact convention|never creates a standalone security report|appended to the invoking report/i);
  assert.doesNotMatch(heroSecurity, /TBD|TODO|implement later|fill in details/i);

  const HERO_SKILLS = ['using-hero', 'hero-planning', 'hero-coding', 'hero-reviewing', 'hero-unit-test', 'hero-security', 'hero-mr-review', 'hero-strict', 'hero-report'];
  for (const name of HERO_SKILLS) {
    const body = fs.readFileSync(path.join(SKILLS_DIR, name, 'SKILL.md'), 'utf8');
    assert.match(body, new RegExp(`^name: ${name}$`, 'm'), `${name}: frontmatter name mismatch`);
    assert.doesNotMatch(body, /TBD|TODO|implement later|fill in details/i, `${name}: contains a placeholder`);
  }
});

test('hero implementation, review, and unit-test contracts stay separated', () => {
  const coding = readSkill('hero-coding');
  const codingProcess = readSection(coding, 'Process');
  const codingReport = readSection(coding, 'Report Convention (on request)');
  assert.match(coding, /<HARD-BOUNDARY>/);
  assert.match(coding, /## Implementation Ledger/);
  assert.match(coding, /### Task state/);
  assert.match(coding, /### Requirement state/);
  for (const field of ['Requirements', 'Depends on', 'Outcome', 'Files / areas', 'Implementation steps',
    'Business rules and edge cases', 'Interfaces produced or changed', 'Completion state']) {
    assert.match(coding, new RegExp(field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
      `hero-coding: missing plan field ${field}`);
  }
  assert.match(coding, /testing, verification, and independent review were not performed/i);
  assert.doesNotMatch(codingProcess, /run relevant verification|build, lint, targeted tests|temporary unit test/i);
  assert.doesNotMatch(coding, /executing-plans|subagent-driven-development|systematic-debugging/i);
  assert.doesNotMatch(codingReport, /^- Evidence:/mi);
  assert.match(coding, /APPROVED_CORRECTIONS=<exact IDs>/);
  assert.match(coding, /prior independent `hero-reviewing` pass classified the item `confirmed`/i);
  assert.match(coding, /explicitly approved that exact `RV-\*` or `FB-\*` ID/i);
  assert.match(coding, /does not.*evaluate or select review feedback|does not.*evaluate feedback/i);
  assert.match(coding, /Perform self-review, dispatch a code reviewer/i);

  const reviewing = readSkill('hero-reviewing');
  assert.match(reviewing, /PLAN_PATH=<approved-plan-path>/);
  assert.match(reviewing, /TARGET=local/);
  assert.match(reviewing, /TARGET=commit:<revision>/);
  assert.match(reviewing, /TARGET=ref:<head-revision> BASE_REF=<base-revision>/);
  assert.match(reviewing, /staged and unstaged tracked changes/i);
  assert.match(reviewing, /untracked file/i);
  assert.match(reviewing, /snapshot drift/i);
  assert.match(reviewing, /read-only and findings-only/i);
  assert.match(reviewing, /MODE=review/);
  assert.match(reviewing, /MODE=assess-feedback/);
  assert.match(reviewing, /MODE=both/);
  assert.match(reviewing, /at most one fresh delegated reviewer/i);
  for (const classification of ['confirmed', 'rejected', 'unclear', 'out-of-scope']) {
    assert.match(reviewing, new RegExp(classification, 'i'), `hero-reviewing: missing ${classification} classification`);
  }
  assert.match(reviewing, /confirmed.*not permission to modify code/i);
  assert.match(reviewing, /Approved correction handoff/i);
  assert.match(reviewing, /Do not automatically invoke `hero-coding`/i);
  assert.match(reviewing, /Do not run build, lint, typecheck, tests, coverage/i);
  for (const field of ['Location', 'Requirement / behavior', 'Evidence', 'Impact', 'Required correction']) {
    assert.match(reviewing, new RegExp(`- ${field}:`, 'i'), `hero-reviewing: missing finding field ${field}`);
  }
  assert.doesNotMatch(reviewing, /requesting-code-review|receiving-code-review/i);
  assert.doesNotMatch(reviewing, /^## ACTIVE_STATE\.md Update$/m);
  assert.doesNotMatch(readSection(reviewing, 'Fresh Review Process'), /fix Critical\/Important|apply (?:the )?fix/i);

  const unitTest = readSkill('hero-unit-test');
  assert.match(unitTest, /PLAN_PATH=<approved-plan-path>/);
  assert.match(unitTest, /## Expected-Behavior Oracle/);
  assert.match(unitTest, /test-only fixtures, mocks, factories, snapshots, and helpers/i);
  assert.match(unitTest, /Exact commands run and actual pass\/fail\/skip counts/i);
  assert.match(unitTest, /Expected production mismatch/i);
  assert.match(unitTest, /Environment\/tooling failure/i);
  assert.match(unitTest, /hand.*(?:back|remediation).*`hero-coding`|hand the remediation back to `hero-coding`/i);
  assert.match(unitTest, /no production code was changed/i);
  assert.doesNotMatch(unitTest, /TDD-first|test-driven-development|pin down the behavior the implementation already exhibits/i);
  assert.doesNotMatch(unitTest, /red\s*(?:→|->).*green\s*(?:→|->).*refactor/i);

  const manifest = require(path.join(__dirname, '..', 'skills.manifest.json'));
  const names = manifest.groups.process.skills.map((skill) => skill.name);
  const manifestText = JSON.stringify(manifest.groups.process);
  assert.ok(names.includes('hero-reviewing'), 'hero-reviewing should remain the canonical skill name');
  assert.ok(!names.includes('hero-review'), 'hero-review alias should not be introduced');
  assert.doesNotMatch(manifestText, /TDD-first/i);
  assert.doesNotMatch(readSkill('using-hero'), /TDD-first/i);
});

test('hero workflow centralizes clear multilingual output guidance', () => {
  const usingHero = readSkill('using-hero');
  const outputStyle = readSection(usingHero, 'Output Style');
  assert.match(outputStyle, /inherit.*project-wide `Response Style`/i);
  assert.match(outputStyle, /chat summaries, progress updates, plans, and reports/i);
  assert.match(outputStyle, /result or current status.*evidence.*next action or decision/i);
  assert.match(outputStyle, /plain wording.*user's language/i);
  assert.match(outputStyle, /unnecessary English code-switching/i);
  assert.match(
    outputStyle,
    /code identifiers.*commands.*file paths.*API names.*configuration keys.*exact errors.*verbatim/i,
  );
  assert.match(outputStyle, /Do not translate technical tokens or invent awkward equivalents/i);
  assert.match(outputStyle, /Briefly explain.*specialized term.*user's language.*first use/i);
  assert.match(outputStyle, /plans and reports actionable for their audience/i);
  assert.match(outputStyle, /explain unfamiliar acronyms/i);
  assert.match(outputStyle, /concise.*simple.*expand risks, blockers, uncertainty.*act safely/i);
  assert.match(usingHero, /concise where safe, complete where clarity requires it/i);

  const stageSpecificGuidance = {
    'hero-planning': /concise.*complete/i,
    'hero-coding': /Report style/i,
    'hero-reviewing': /Review style/i,
    'hero-unit-test': /Test report style/i,
    'hero-security': /Security finding style/i,
    'hero-mr-review': /Report style/i,
    'hero-strict': /Strict verification style/i,
  };

  for (const [name, pattern] of Object.entries(stageSpecificGuidance)) {
    const body = readSkill(name);
    assert.match(body, pattern, `${name}: missing stage-specific reporting guidance`);
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
  assert.match(skillMd, /## Hero Stage Boundary/);
  assert.match(skillMd, /hero-reviewing/);
  assert.doesNotMatch(skillMd, /requesting-code-review|receiving-code-review/i);

  const qualityPrompt = fs.readFileSync(path.join(dir, 'code-quality-reviewer-prompt.md'), 'utf8');
  assert.match(qualityPrompt, /Invoke `hero-reviewing`/);
  assert.match(qualityPrompt, /MODE=review/);
  assert.match(qualityPrompt, /REVIEWER=direct/);
  assert.doesNotMatch(qualityPrompt, /requesting-code-review|receiving-code-review|code-reviewer\.md/i);
});
