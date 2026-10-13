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
  'using-hero', 'hero-planning', 'hero-coding', 'hero-node', 'hero-golang', 'hero-reviewing',
  'hero-unit-test', 'hero-security', 'hero-mr-review', 'hero-gitflow', 'hero-strict', 'hero-report',
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

  const HERO_SKILLS = ['using-hero', 'hero-planning', 'hero-coding', 'hero-node', 'hero-golang', 'hero-reviewing', 'hero-unit-test', 'hero-security', 'hero-mr-review', 'hero-gitflow', 'hero-strict', 'hero-report'];
  for (const name of HERO_SKILLS) {
    const body = fs.readFileSync(path.join(SKILLS_DIR, name, 'SKILL.md'), 'utf8');
    assert.match(body, new RegExp(`^name: ${name}$`, 'm'), `${name}: frontmatter name mismatch`);
    assert.doesNotMatch(body, /TBD|TODO|implement later|fill in details/i, `${name}: contains a placeholder`);
  }
});

test('hero-gitflow keeps Git actions explicit and protects local state', () => {
  const gitflow = readSkill('hero-gitflow');
  assert.match(gitflow, /only for a Git action the user has specifically requested/i);
  assert.match(gitflow, /Completing one action never authorizes another/i);
  assert.match(gitflow, /develop`, `release\/\*`, `main`, and `master` are protected branches/);
  assert.match(gitflow, /Never commit while on them, or push, merge, rebase, or revert \*into\* them/);
  assert.match(gitflow, /`feature\/\*` and `fix\/\*` must start from `develop` or `release\/\*`/);
  assert.match(gitflow, /`hotfix\/\*` must start from `main` or `master`/);
  assert.match(gitflow, /feature\/BU-1740-short-description/);
  assert.match(gitflow, /BU-1740: Add account search filters/);
  assert.match(gitflow, /short descriptive title.*followed by detailed bullet points/i);
  assert.match(gitflow, /Never touch `\.gitignore`.*do not edit, stage, unstage, restore, stash, clean, or include it in a commit/i);
  assert.match(gitflow, /If it is already staged, stop and ask the user to handle it/i);
  assert.match(gitflow, /git diff --cached --name-only/);
  assert.match(gitflow, /do not add an agent\/actor signature/i);
  assert.match(gitflow, /conflict involves incompatible logic.*stop.*ask the user/i);
  assert.match(gitflow, /Do not force-push or use destructive reset\/cleanup/i);

  const worktrees = readSkill('using-git-worktrees');
  assert.doesNotMatch(worktrees, /Add to \.gitignore, commit the change/i);
  assert.match(worktrees, /Do not edit, stage, restore, or commit `\.gitignore`/);
  const brainstorming = readSkill('brainstorming');
  assert.doesNotMatch(brainstorming, /^- Commit the design document to git$/m);
  assert.match(brainstorming, /Do not commit the design document unless the user specifically asks/i);
  const implementer = fs.readFileSync(path.join(SKILLS_DIR, 'subagent-driven-development', 'implementer-prompt.md'), 'utf8');
  assert.doesNotMatch(implementer, /^    4\. Commit your work$/m);
  assert.match(implementer, /do not commit unless the user specifically requested it/i);
  const workspace = fs.readFileSync(path.join(SKILLS_DIR, 'subagent-driven-development', 'scripts', 'sdd-workspace.sh'), 'utf8');
  assert.doesNotMatch(workspace, /[>]{1,2}\s*[^\n]*\.gitignore/);
  assert.match(workspace, /git[^\n]*check-ignore -q/);
  assert.match(workspace, /XDG_CACHE_HOME/);
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

test('hero-node inherits the coding stage without adding assurance or delivery', () => {
  const node = readSkill('hero-node');
  const parent = readSection(node, 'Scope and Mandatory Parent');
  assert.match(parent, /same coding stage; it is not a new stage/i);
  assert.match(parent, /Before any production edit, read the complete actual sibling/i);
  assert.match(parent, /\.\.\/hero-coding\/SKILL\.md/);
  assert.strictEqual(fs.existsSync(path.resolve(SKILLS_DIR, 'hero-node', '../hero-coding/SKILL.md')), true);
  assert.match(parent, /missing or unreadable, stop/i);
  assert.match(parent, /Inherit the entire parent contract by reference/i);
  assert.match(parent, /No test authoring\/running, verification commands, self-review, review delegation/i);
  assert.match(parent, /Git delivery actions/i);
  assert.match(parent, /task\/requirement ledger.*dependencies.*plan immutable/i);
  assert.match(parent, /exact correction IDs confirmed.*explicitly approved/i);
  assert.match(parent, /frontend project does not qualify merely/i);

  const handoff = readSection(node, 'Handoff and Report Convention');
  assert.match(handoff, /Do not create a report file automatically/i);
  assert.match(handoff, /hero-report` with source stage `hero-coding`/);
  assert.match(handoff, /docs\/coding-reports\/YYYY-MM-DD-<slug>\.md/);
  assert.match(handoff, /testing, verification, and independent review were not performed/i);
  assert.match(handoff, /task\/requirement states.*blockers.*approved deviations/i);
  assert.doesNotMatch(handoff, /docs\/node-reports\//);

  assert.match(readSkill('using-hero'), /choose `hero-node` instead of generic `hero-coding`/i);
  const notice = fs.readFileSync(path.join(SKILLS_DIR, 'NOTICE'), 'utf8');
  assert.match(notice, /Framework-authored skills shipped by hero-mmt-kit:[\s\S]*?hero-node/);
});

test('hero-node enforces explicit Node conventions with bounded exceptions', () => {
  const node = readSkill('hero-node');
  const scope = readSection(node, 'MUST: Bounded Changes');
  assert.match(scope, /Do not mechanically convert untouched code/i);
  assert.match(scope, /refactors, configuration changes, formatting churn, dependencies, or migrations/i);
  assert.match(scope, /stop and escalate/i);

  const conditions = readSection(node, 'MUST: Explicit Conditions and Conversions');
  assert.match(conditions, /`=== true` or `=== false`.*predicate results/i);
  assert.match(conditions, /Do not use unary `!` or `!!`/);
  assert.match(conditions, /isAuthorized === false/);
  assert.match(conditions, /rather than truthiness/i);
  assert.match(conditions, /Distinguish `undefined`, `null`.*zero.*`false`/i);
  assert.match(conditions, /not coercive equality/i);
  assert.match(conditions, /Conversion alone is not validation/i);
  assert.match(conditions, /Never mechanically replace `!value`/);

  const flow = readSection(node, 'MUST: Readable Data and Control Flow');
  assert.match(flow, /short-circuit side effects/i);
  assert.match(flow, /Map data field by field/i);
  assert.match(flow, /Do not replace spread with `Object.assign`/);
  assert.match(flow, /only one simple condition and two simple value branches/i);
  assert.match(flow, /No nesting, compound conditions/i);
  assert.match(flow, /Respect the existing formatter/i);

  const models = readSection(node, 'MUST: Owned Models and Boundary Validation');
  assert.match(models, /Do not use `any`.*anywhere in new or necessarily changed TypeScript code/i);
  assert.match(models, /explicitly declared fields and complete constructor assignments/i);
  assert.match(models, /do not use constructor parameter properties/i);
  assert.match(models, /non-null assertions, definite-assignment assertions/i);
  assert.match(models, /does not validate it/i);
  assert.match(models, /function parseJob\(input: unknown\): JobDto/);
  assert.match(models, /In JavaScript, use equivalent explicit class fields/i);

  const cohesion = readSection(node, 'PREFER: Cohesion and Safe Early Returns');
  assert.match(cohesion, /early returns.*preserve cleanup/i);
  assert.match(cohesion, /one-function-per-file/i);
  assert.match(cohesion, /giant service\/module/i);

  const exceptions = readSection(node, 'Allowed Shapes and Narrow Exceptions');
  assert.match(exceptions, /`unknown`.*validated and narrowed/i);
  assert.match(exceptions, /library-provided option types/i);
  assert.match(exceptions, /internal `type`\/`interface`/);
  assert.match(exceptions, /Typed dictionaries.*genuine domain requirement/i);
  assert.match(exceptions, /Spread is allowed only when genuinely unavoidable/i);
  assert.match(exceptions, /record the exception in the implementation handoff/i);
  assert.match(exceptions, /no blanket framework exception/i);
});

test('hero-golang inherits coding without adding design, assurance, or delivery', () => {
  const go = readSkill('hero-golang');
  const parent = readSection(go, 'Scope and Mandatory Parent');
  assert.match(go, /^description: Use for implementation-only Go /m);
  assert.match(parent, /same coding stage; it is not a new stage/i);
  assert.match(parent, /Before any production edit, read the complete actual sibling/i);
  assert.match(parent, /\.\.\/hero-coding\/SKILL\.md/);
  assert.strictEqual(fs.existsSync(path.resolve(SKILLS_DIR, 'hero-golang', '../hero-coding/SKILL.md')), true);
  assert.match(parent, /missing or unreadable, stop/i);
  assert.match(parent, /Inherit the entire parent contract by reference/i);
  assert.match(parent, /No architecture design, test authoring\/running, verification commands, self-review, review delegation/i);
  assert.match(parent, /Git delivery actions/i);
  assert.match(parent, /task\/requirement ledger.*dependencies.*plan immutable/i);
  assert.match(parent, /exact correction IDs confirmed.*explicitly approved/i);
  assert.match(parent, /mixed-language request, apply these rules only to the Go portion/i);

  const handoff = readSection(go, 'Handoff and Report Convention');
  assert.match(handoff, /Do not create a report file automatically/i);
  assert.match(handoff, /hero-report` with source stage `hero-coding`/);
  assert.match(handoff, /docs\/coding-reports\/YYYY-MM-DD-<slug>\.md/);
  assert.match(handoff, /testing, verification, and independent review were not performed/i);
  assert.match(handoff, /task\/requirement states.*blockers.*approved deviations/i);
  assert.match(handoff, /List any formatting command actually run/i);
  assert.match(handoff, /Do not create a new report category, directory, or workflow stage/i);
  assert.doesNotMatch(handoff, /docs\/(?:go|golang)-reports\//);

  assert.match(readSkill('using-hero'), /choose `hero-golang` instead of generic `hero-coding`/i);
  assert.match(readSkill('hero-coding'), /`hero-golang` specializes this same implementation-only contract for Go/i);
  const notice = fs.readFileSync(path.join(SKILLS_DIR, 'NOTICE'), 'utf8');
  assert.match(notice, /Framework-authored skills shipped by hero-mmt-kit:[\s\S]*?hero-golang/);
});

test('hero-golang bounds project changes and permits only edited-file formatting', () => {
  const go = readSkill('hero-golang');
  const scope = readSection(go, 'MUST: Bounded Changes and Project Baseline');
  assert.match(scope, /Do not mechanically convert untouched code/i);
  assert.match(scope, /supported Go version from `go\.mod`.*`toolchain`.*`go\.work`.*build constraints/i);
  assert.match(scope, /locally installed toolchain does not raise the module's supported version/i);
  assert.match(scope, /Preserve the existing module\/package layout, public API/i);
  assert.match(scope, /Do not add or upgrade dependencies.*without approval for that exact change/i);
  assert.match(scope, /Do not run `go mod tidy` or generators in this stage/i);
  assert.match(scope, /stop and escalate/i);

  const format = readSection(go, 'MUST: Formatting Only on Edited Files');
  assert.match(format, /`gofmt -w` may run only on the Go files edited for the current task, named explicitly/i);
  assert.match(format, /Never run it on.*a broad glob, or files you did not edit/i);
  assert.match(format, /`goimports`.*project already uses it and it is already installed/i);
  assert.match(format, /Do not download or install any tool/i);
  assert.match(format, /Do not format generated or vendored files/i);
  assert.match(format, /unrelated user changes.*do not run it/i);
  assert.match(format, /not verification or correctness evidence/i);
  assert.match(format, /does not permit `go build`, `go vet`, `go test`, linters, race detection, benchmarks, `go generate`/i);
});

test('hero-golang preserves Go error, concurrency, and ownership contracts', () => {
  const go = readSkill('hero-golang');
  const errors = readSection(go, 'MUST: Errors and Failure Paths');
  assert.match(errors, /Preserve the existing sentinel errors, error types, and wrapping contract/i);
  assert.match(errors, /`errors\.Is` and `errors\.As`/);
  assert.match(errors, /nil pointer stored in an interface is not equal to `nil`/i);
  assert.match(errors, /Do not call `log\.Fatal` or `os\.Exit` from library or helper code/i);

  const concurrency = readSection(go, 'MUST: Context, Goroutines, and Channels');
  assert.match(concurrency, /propagate it to blocking calls that support cancellation/i);
  assert.match(concurrency, /`cancel` function.*on all paths/i);
  assert.match(concurrency, /Every goroutine.*owner and a guaranteed exit/i);
  assert.match(concurrency, /buffered channel is not a cancellation mechanism/i);
  assert.match(concurrency, /channel-closing owner.*every sender has finished/i);
  assert.match(concurrency, /Deliver results and errors together, or through a defined error path/i);
  assert.match(concurrency, /unbuffered results channel needs a concurrent reader/i);
  assert.match(concurrency, /Bound concurrency.*unbounded input/i);
  assert.match(concurrency, /loop variables according to the owning module's Go language version/i);
  assert.match(concurrency, /`errgroup` does not justify adding.*without explicit dependency approval/i);

  const ownership = readSection(go, 'MUST: Shared State, Ownership, and Resources');
  assert.match(ownership, /Do not copy values containing.*`sync` types after first use/i);
  assert.match(ownership, /Never return a slice that aliases a pooled or reused buffer/i);
  assert.match(ownership, /copy\(out, buf\.Bytes\(\)\)/);
  assert.doesNotMatch(ownership, /return buf\.Bytes\(\)/);
  assert.match(ownership, /Do not add `sync\.Pool`.*unless the approved scope asks/i);
  assert.match(ownership, /close files and HTTP response bodies.*commit or rollback/i);
  assert.match(ownership, /`Close`, `Flush`, `Sync`, or `Commit`.*written data/i);

  const boundary = readSection(go, 'MUST: Boundary Data and Zero Values');
  assert.match(boundary, /Decoding or type conversion is not validation/i);
  assert.match(boundary, /absent, `null`, zero, and empty.*contract distinguishes them/i);
  assert.match(boundary, /Preserve existing JSON\/DB tags and wire representations/i);
  assert.match(boundary, /Check the status code and response contract/i);
  assert.match(boundary, /Bound reads of untrusted input or responses/i);
  assert.doesNotMatch(go, /func (?:WorkerPool|safeFetch)\b|## Go Tooling Integration|### Standard Project Layout|```yaml/);
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
    'hero-node': /Handoff and Report Convention/i,
    'hero-golang': /Handoff and Report Convention/i,
    'hero-reviewing': /Review style/i,
    'hero-unit-test': /Test report style/i,
    'hero-security': /Security finding style/i,
    'hero-mr-review': /Report style/i,
    'hero-gitflow': /Output Style/i,
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
