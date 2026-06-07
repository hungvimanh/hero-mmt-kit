# Phase Handoff Protocol Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the Phase Handoff Protocol into hero-vibe-kit template docs, installable skills, and tests so consumer projects can continue artifact-first across workflow phase boundaries.

**Architecture:** This is a docs/templates/tests/skill integration. The full protocol becomes a reference doc under `templates/docs/{en,vi}/PHASE_HANDOFF_PROTOCOL.md`; always-read workflow docs get short operational rules only; `templates/skills/phase-handoff/SKILL.md` provides deterministic handoff behavior; tests prove bilingual parity, init install behavior, and skill vendoring.

**Tech Stack:** Node.js built-ins, `node --test`, Markdown templates, Claude Code native `.claude/skills/` layout, GitNexus required checks.

---

## File Structure

- Create: `templates/docs/en/PHASE_HANDOFF_PROTOCOL.md`
  - Full English reference protocol copied from `docs/PHASE_HANDOFF_PROTOCOL.md`, with template-safe relative links where needed.
- Create: `templates/docs/vi/PHASE_HANDOFF_PROTOCOL.md`
  - Vietnamese counterpart mirroring the English structure and preserving literal command/file/template names.
- Modify: `templates/docs/en/AGENCY_WORKFLOW.md`
  - Add concise mode-selection and real-phase-boundary rules; add related-doc link.
- Modify: `templates/docs/vi/AGENCY_WORKFLOW.md`
  - Vietnamese mirror of the English workflow additions.
- Modify: `templates/docs/en/CONTEXT_BUDGET.md`
  - Tighten `resume.md`, sanity-check, evidence freshness, and final-claim rules.
- Modify: `templates/docs/vi/CONTEXT_BUDGET.md`
  - Vietnamese mirror of the English context-budget additions.
- Modify: `templates/docs/en/HANDOFF_TEMPLATES.md`
  - Add phase-boundary artifact templates and next-phase prompts.
- Modify: `templates/docs/vi/HANDOFF_TEMPLATES.md`
  - Vietnamese mirror of the English handoff-template additions.
- Create: `templates/skills/phase-handoff/SKILL.md`
  - New hero-vibe-kit-authored deterministic skill.
- Modify: `templates/skills/NOTICE`
  - Clarify that `phase-handoff` is authored by hero-vibe-kit, while listed superpowers skills remain attributed to obra/superpowers.
- Modify: `skills.manifest.json`
  - Add `phase-handoff` to the vendored process group with source `hero-vibe-kit`.
- Modify: `test/links.test.cjs`
  - Add protocol-specific bilingual/link/phrase assertions.
- Modify: `test/init-smoke.test.cjs`
  - Assert new docs and skill are installed.
- Modify: `test/skills-vendor.test.cjs`
  - Include `phase-handoff` in the vendored set and validate skill frontmatter.
- Optionally modify: `README.md`
  - Add `PHASE_HANDOFF_PROTOCOL` and `CONTEXT_BUDGET` to the installed docs list if the tree comment is updated.
- Create during execution: `docs/reports/2026-06-07-phase-handoff-protocol/`
  - Use only populated artifacts: baseline/with-skill skill pressure notes, command logs, phase handoffs, QA notes.

---

## Task 1: Write failing tests for protocol docs and vendored skill

**Files:**
- Modify: `test/links.test.cjs`
- Modify: `test/init-smoke.test.cjs`
- Modify: `test/skills-vendor.test.cjs`

- [ ] **Step 1: Add failing protocol assertions to `test/links.test.cjs`**

Append this test after the existing `template docs language trees have identical relative file sets` test:

```js
test('phase handoff protocol is wired into bilingual workflow docs', () => {
  const docsRoot = path.join(__dirname, '..', 'templates', 'docs');
  const requiredFiles = [
    'PHASE_HANDOFF_PROTOCOL.md',
    'AGENCY_WORKFLOW.md',
    'CONTEXT_BUDGET.md',
    'HANDOFF_TEMPLATES.md',
  ];

  for (const lang of ['en', 'vi']) {
    for (const file of requiredFiles) {
      assert.ok(fs.existsSync(path.join(docsRoot, lang, file)), `${lang}: missing ${file}`);
    }
  }

  const enWorkflow = fs.readFileSync(path.join(docsRoot, 'en', 'AGENCY_WORKFLOW.md'), 'utf8');
  const viWorkflow = fs.readFileSync(path.join(docsRoot, 'vi', 'AGENCY_WORKFLOW.md'), 'utf8');
  assert.match(enWorkflow, /PHASE_HANDOFF_PROTOCOL\.md/);
  assert.match(viWorkflow, /PHASE_HANDOFF_PROTOCOL\.md/);
  assert.match(enWorkflow, /Tiny.*Small.*Standard.*Full/s);
  assert.match(viWorkflow, /Tiny.*Small.*Standard.*Full/s);

  const enContext = fs.readFileSync(path.join(docsRoot, 'en', 'CONTEXT_BUDGET.md'), 'utf8');
  const viContext = fs.readFileSync(path.join(docsRoot, 'vi', 'CONTEXT_BUDGET.md'), 'utf8');
  for (const phrase of ['artifact-first', 'resume.md', 'Sanity check', 'Evidence freshness', 'Final claims']) {
    assert.match(enContext, new RegExp(phrase.replace('.', '\\.')), `en context missing ${phrase}`);
  }
  for (const phrase of ['artifact-first', 'resume.md', 'Sanity check', 'Evidence freshness', 'claim cuối']) {
    assert.match(viContext, new RegExp(phrase.replace('.', '\\.')), `vi context missing ${phrase}`);
  }

  const enHandoff = fs.readFileSync(path.join(docsRoot, 'en', 'HANDOFF_TEMPLATES.md'), 'utf8');
  const viHandoff = fs.readFileSync(path.join(docsRoot, 'vi', 'HANDOFF_TEMPLATES.md'), 'utf8');
  for (const phrase of ['Code → Test', 'Test → Verify / QA', 'QA sub-agent prompt', 'Short next-phase prompt']) {
    assert.match(enHandoff, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `en handoff missing ${phrase}`);
  }
  for (const phrase of ['Code → Test', 'Test → Verify / QA', 'Prompt QA sub-agent', 'Prompt ngắn cho phase tiếp theo']) {
    assert.match(viHandoff, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `vi handoff missing ${phrase}`);
  }
});
```

- [ ] **Step 2: Add failing init smoke assertions to `test/init-smoke.test.cjs`**

In the file-existence array inside `init new project: files + no leftover placeholders + doctor passes`, add these entries after `docs/BROWNFIELD_DISCOVERY.md` and after the existing skill assertions:

```js
    'docs/PHASE_HANDOFF_PROTOCOL.md', 'docs/CONTEXT_BUDGET.md', 'docs/HANDOFF_TEMPLATES.md',
```

and:

```js
    '.claude/skills/phase-handoff/SKILL.md',
```

After the existing workflow assertions near `assert.match(workflow, /MUST spawn.*review sub-agent/);`, add:

```js
  assert.match(workflow, /PHASE_HANDOFF_PROTOCOL\.md/);
  assert.match(workflow, /Tiny.*Small.*Standard.*Full/s);
  const contextBudget = fs.readFileSync(path.join(dir, 'docs', 'CONTEXT_BUDGET.md'), 'utf8');
  assert.match(contextBudget, /artifact-first/);
  assert.match(contextBudget, /Sanity check/);
  assert.match(contextBudget, /Evidence freshness/);
  assert.match(contextBudget, /Final claims/);
  const phaseSkill = fs.readFileSync(path.join(dir, '.claude', 'skills', 'phase-handoff', 'SKILL.md'), 'utf8');
  assert.match(phaseSkill, /name:\s*phase-handoff/);
  assert.match(phaseSkill, /workflow phase boundaries/);
```

- [ ] **Step 3: Add failing skill vendor assertions to `test/skills-vendor.test.cjs`**

Add `phase-handoff` to the `VENDORED` array:

```js
  'using-git-worktrees', 'finishing-a-development-branch', 'using-superpowers',
  'phase-handoff',
```

Add this test after `every curated core skill is vendored with a SKILL.md + frontmatter`:

```js
test('phase-handoff skill is authored locally and avoids placeholders', () => {
  const skill = path.join(SKILLS_DIR, 'phase-handoff', 'SKILL.md');
  const text = fs.readFileSync(skill, 'utf8');
  assert.match(text, /^---\nname:\s*phase-handoff\n/m);
  assert.match(text, /description:\s*Use when/);
  assert.match(text, /artifact-first/);
  assert.match(text, /Sanity check/);
  assert.doesNotMatch(text, /TBD|TODO|implement later|fill in details/i);
});
```

- [ ] **Step 4: Run focused tests and verify RED**

Run:

```powershell
node --test test/links.test.cjs test/init-smoke.test.cjs test/skills-vendor.test.cjs
```

Expected: FAIL because `PHASE_HANDOFF_PROTOCOL.md` and `templates/skills/phase-handoff/SKILL.md` do not exist yet, and docs do not include the new protocol phrases.

---

## Task 2: Create report folder and run skill RED pressure scenario

**Files:**
- Create: `docs/reports/2026-06-07-phase-handoff-protocol/artifacts/skill-red-pressure.md`
- Create: `docs/reports/2026-06-07-phase-handoff-protocol/resume.md`
- Create: `docs/reports/2026-06-07-phase-handoff-protocol/handoffs/02-design-to-code.md`

- [ ] **Step 1: Run baseline pressure scenario before writing the skill**

Dispatch a sub-agent with this prompt, without mentioning the future `phase-handoff` skill:

```text
You are continuing a long framework task. Implementation is about to move to QA. Multiple docs and tests changed, test output is noisy, and the main chat is too long.

Create the handoff that the QA agent should use next. Include enough context for QA to proceed safely.

Constraints:
- Do not read old chat transcripts.
- Do not paste full logs or full diffs.
- Keep the answer bounded.

Return the handoff you would give QA.
```

Expected RED: the response should miss at least one protocol requirement, such as `resume.md` pointer, evidence identity, structured sanity check, read/do-not-read budget, approval state, or fresh evidence rules.

- [ ] **Step 2: Save RED findings**

Create `docs/reports/2026-06-07-phase-handoff-protocol/artifacts/skill-red-pressure.md` with this structure:

```markdown
# Skill RED Pressure Scenario — phase-handoff

## Scenario
- Boundary: Implementation → QA
- Pressure: long chat, noisy tests, multiple changed docs/tests
- Skill available: no

## Observed baseline behavior
- Missing:
- Risky assumption:
- Unbounded output tendency:

## Failure classification
- Verdict: fail
- Why this proves the skill is needed:
```

Fill the bullets from the actual sub-agent result. Do not paste the full sub-agent transcript; summarize the exact failures.

- [ ] **Step 3: Create current implementation handoff scaffold**

Create `docs/reports/2026-06-07-phase-handoff-protocol/handoffs/02-design-to-code.md` with:

```markdown
# Phase Handoff — Design / Architecture → Code

## Status
- Work item: Phase Handoff Protocol Integration
- Mode: full
- From phase: Design / Architecture
- To phase: Code
- Status: green
- Approval: approved
- Approved by: user
- Approval evidence: User message "approve spec" on 2026-06-07
- Approval note: Design spec approved; implementation plan may be executed after plan approval.
- Branch: master
- Base commit: record during execution
- Working tree state: dirty before implementation; record exact status in logs
- Evidence captured against: record during execution
- Last updated: 2026-06-07

## Source of truth
- Latest user instruction: "approve spec"
- Latest approved handoff/amendment: this handoff
- Referenced artifacts:
  - `docs/superpowers/specs/2026-06-07-phase-handoff-protocol-integration-design.md`
  - `docs/superpowers/plans/2026-06-07-phase-handoff-protocol-integration.md`
- Evidence paths:
  - `docs/reports/2026-06-07-phase-handoff-protocol/artifacts/skill-red-pressure.md`

## Read first
- `docs/reports/2026-06-07-phase-handoff-protocol/resume.md`
- this handoff
- `docs/superpowers/plans/2026-06-07-phase-handoff-protocol-integration.md`

## Do not read
- old transcripts
- full logs unless debugging a listed failure
- full diffs unless a specific hunk is requested
- broad docs unless listed under required files

## Next action
- Next role: implementer
- Objective: execute the approved plan task-by-task with TDD for tests and skill authoring.
- Stop condition: implementation reaches Code → Test handoff with updated tests and evidence.
- Required tools/skills: test-driven-development, writing-skills, verification-before-completion, GitNexus impact/detect changes as required.

## Implementation contract
- Architecture approach: docs/templates/tests/skill integration only; no runtime dependency or CLI command.
- API/module/interface contract: no public CLI API changes.
- Data contract: new template docs and skill files copied by existing init/update copy/render paths.

## Task list
- [ ] Add failing tests.
- [ ] Capture skill RED pressure scenario.
- [ ] Add protocol docs EN/VI.
- [ ] Update operational docs EN/VI.
- [ ] Add `phase-handoff` skill and manifest/NOTICE updates.
- [ ] Run tests and QA.

## Test strategy
- Unit tests: `node --test test/links.test.cjs test/init-smoke.test.cjs test/skills-vendor.test.cjs`
- Integration tests: `npm test`
- Manual checks: inspect installed smoke output for docs/skill presence.
- Regression focus: bilingual parity, doc links, zero runtime dependencies, skill vendoring.
```

- [ ] **Step 4: Create `resume.md` pointer**

Create `docs/reports/2026-06-07-phase-handoff-protocol/resume.md` with:

```markdown
# Resume Packet — Phase Handoff Protocol Integration

## Current pointer
- Latest canonical handoff: `handoffs/02-design-to-code.md`
- Current mode: full
- Current phase: Code
- Next action: execute `docs/superpowers/plans/2026-06-07-phase-handoff-protocol-integration.md`

## State
- Status: green
- Branch: master
- Working tree state: dirty; pre-existing user/project changes must be preserved
- Key artifacts:
  - `docs/superpowers/specs/2026-06-07-phase-handoff-protocol-integration-design.md`
  - `docs/superpowers/plans/2026-06-07-phase-handoff-protocol-integration.md`
  - `handoffs/02-design-to-code.md`
- Changed files summary: to be updated after implementation

## Verification
- Last command: RED tests pending
- Result: not yet run after implementation
- Log path: to be created under `logs/`
- Evidence freshness: pending execution

## Open items
- Blockers: none
- Risks: EN/VI parity drift; skill behavior too vague; noisy evidence copied into canonical handoff
- User decisions needed: execution approach after plan approval

## Context rules for next session
- Read first: this resume, latest canonical handoff, approved implementation plan
- Read only if needed: referenced logs/reviews/artifacts
- Do not reread: old chat transcripts, full protocol unless editing protocol docs
- Do not paste: full logs, full diffs, full files, sub-agent transcripts
```

---

## Task 3: Add full protocol reference docs in EN and VI

**Files:**
- Create: `templates/docs/en/PHASE_HANDOFF_PROTOCOL.md`
- Create: `templates/docs/vi/PHASE_HANDOFF_PROTOCOL.md`

- [ ] **Step 1: Create English protocol reference**

Copy the full content of `docs/PHASE_HANDOFF_PROTOCOL.md` to `templates/docs/en/PHASE_HANDOFF_PROTOCOL.md`.

Required adjustments after copying:

```text
- Keep the title: # Phase Handoff Protocol v4 — Context-Safe Workflow Boundaries
- Keep literal code blocks and template blocks unchanged.
- Keep the hero-vibe-kit appendix.
- Do not add managed-region markers.
- Do not introduce {{...}} placeholders.
- Do not replace <TBD> examples; they are intentional user-fill placeholders.
```

- [ ] **Step 2: Create Vietnamese protocol reference**

Create `templates/docs/vi/PHASE_HANDOFF_PROTOCOL.md` as a Vietnamese translation of the English reference.

Translation rules:

```text
- Preserve every heading level and heading order from the English document.
- Preserve literal command names, paths, statuses, modes, filenames, and template keys exactly when they are part of contracts.
- Translate explanatory prose into Vietnamese.
- Keep code/template blocks usable; translate surrounding labels only when doing so does not break the contract.
- Preserve links and paths.
- Do not add {{...}} placeholders.
```

- [ ] **Step 3: Verify docs file-set parity goes GREEN for new files**

Run:

```powershell
node --test test/links.test.cjs
```

Expected: file-set and link checks should pass or fail only on protocol phrase assertions not yet added to operational docs.

---

## Task 4: Update AGENCY_WORKFLOW with mode and phase-boundary rules

**Files:**
- Modify: `templates/docs/en/AGENCY_WORKFLOW.md`
- Modify: `templates/docs/vi/AGENCY_WORKFLOW.md`

- [ ] **Step 1: Insert English phase-boundary section**

In `templates/docs/en/AGENCY_WORKFLOW.md`, insert this section after the existing `### Context Budget Protocol` block and before `### Escalation rule`:

```markdown
### Phase Handoff Protocol

Use the smallest workflow mode that fits the work before adding ceremony:

| Mode | Use when | Handoff expectation |
|---|---|---|
| Tiny | Typo, text tweak, trivial config, obvious verification, <= 2 likely files | Usually none |
| Small | Localized low-risk work, <= 5 likely files, simple rollback | One compact handoff only if context pressure appears |
| Standard | Existing behavior change, refactor, meaningful tests/review, project-required impact analysis | Required at Code → Test and Test → QA when the phase boundary is real |
| Full | New feature, architecture/API/data/security-sensitive work, high regression cost | Required at every real phase boundary |

A real phase boundary occurs when the next step needs a different role or review mindset, user approval or QA is expected, work moves from implementation to verification, context pressure rises, or a sub-agent/workflow boundary is crossed.

At a real boundary, create a bounded handoff under `docs/reports/YYYY-MM-DD-<slug>/handoffs/`, update `resume.md` as a short pointer, then start the next phase artifact-first. The next phase reads `resume.md` and the latest canonical handoff first, then runs the structured sanity check in [CONTEXT_BUDGET.md](./CONTEXT_BUDGET.md).

Full templates and edge cases live in [PHASE_HANDOFF_PROTOCOL.md](./PHASE_HANDOFF_PROTOCOL.md). Do not copy that full protocol into always-loaded docs.
```

- [ ] **Step 2: Insert Vietnamese phase-boundary section**

In `templates/docs/vi/AGENCY_WORKFLOW.md`, insert this section in the equivalent location:

```markdown
### Phase Handoff Protocol

Chọn workflow mode nhỏ nhất phù hợp trước khi thêm nghi thức:

| Mode | Dùng khi | Kỳ vọng handoff |
|---|---|---|
| Tiny | Sửa typo, đổi text, config rất nhỏ, verify hiển nhiên, dự kiến <= 2 file | Thường không cần |
| Small | Việc khu trú rủi ro thấp, dự kiến <= 5 file, rollback đơn giản | Chỉ cần một handoff gọn nếu xuất hiện context pressure |
| Standard | Đổi hành vi hiện có, refactor, cần test/review có ý nghĩa, hoặc project bắt buộc impact analysis | Bắt buộc ở Code → Test và Test → QA khi đó là phase boundary thật |
| Full | Feature mới, đổi architecture/API/data/security-sensitive, chi phí regression cao | Bắt buộc ở mọi phase boundary thật |

Phase boundary thật xuất hiện khi bước tiếp theo cần vai trò hoặc mindset review khác, cần User approval hoặc QA, công việc chuyển từ implementation sang verification, context pressure tăng, hoặc chuẩn bị qua boundary sub-agent/workflow.

Tại boundary thật, tạo handoff có biên dưới `docs/reports/YYYY-MM-DD-<slug>/handoffs/`, cập nhật `resume.md` như con trỏ ngắn, rồi bắt đầu phase tiếp theo theo artifact-first. Phase tiếp theo đọc `resume.md` và canonical handoff mới nhất trước, sau đó chạy sanity check có cấu trúc trong [CONTEXT_BUDGET.md](./CONTEXT_BUDGET.md).

Template đầy đủ và edge case nằm trong [PHASE_HANDOFF_PROTOCOL.md](./PHASE_HANDOFF_PROTOCOL.md). Không copy toàn bộ protocol đó vào docs luôn được load.
```

- [ ] **Step 3: Add related-doc rows**

In both EN and VI related-doc tables, add a row immediately after `CONTEXT_BUDGET.md`:

English:

```markdown
| [PHASE_HANDOFF_PROTOCOL.md](./PHASE_HANDOFF_PROTOCOL.md) | Full artifact-first phase-boundary protocol, handoff templates, sanity checks, evidence freshness, and recovery rules |
```

Vietnamese:

```markdown
| [PHASE_HANDOFF_PROTOCOL.md](./PHASE_HANDOFF_PROTOCOL.md) | Protocol đầy đủ cho phase boundary theo artifact-first, handoff template, sanity check, evidence freshness và quy tắc khôi phục |
```

- [ ] **Step 4: Run focused workflow doc test**

Run:

```powershell
node --test test/links.test.cjs
```

Expected: workflow phrase assertions pass; remaining failures should point to `CONTEXT_BUDGET.md`, `HANDOFF_TEMPLATES.md`, or missing skill.

---

## Task 5: Update CONTEXT_BUDGET with sanity/evidence/final-claim rules

**Files:**
- Modify: `templates/docs/en/CONTEXT_BUDGET.md`
- Modify: `templates/docs/vi/CONTEXT_BUDGET.md`

- [ ] **Step 1: Add English artifact-first section**

In `templates/docs/en/CONTEXT_BUDGET.md`, insert after `## 1. Purpose`:

```markdown
## 1.1 Artifact-first phase boundaries

The invariant is:

```text
Phase work → bounded handoff artifact → context reset boundary → next phase reads artifact-first
```

Writing a handoff file does not reduce context by itself. It helps only when followed by `/compact`, a fresh session, a bounded sub-agent handoff, or a workflow boundary where only the artifact is passed forward.

For Tiny/Small work, avoid report ceremony unless context pressure or evidence needs it. For Standard/Full work, create bounded handoffs at real phase boundaries and keep `resume.md` as a short pointer to the latest canonical handoff.

Full reference: [PHASE_HANDOFF_PROTOCOL.md](./PHASE_HANDOFF_PROTOCOL.md).
```

- [ ] **Step 2: Add Vietnamese artifact-first section**

In `templates/docs/vi/CONTEXT_BUDGET.md`, insert after `## 1. Mục đích`:

```markdown
## 1.1 Artifact-first tại phase boundary

Bất biến là:

```text
Phase work → bounded handoff artifact → context reset boundary → next phase reads artifact-first
```

Viết một file handoff không tự giảm context. Nó chỉ có tác dụng khi theo sau bởi `/compact`, session mới, handoff cho sub-agent có biên, hoặc workflow boundary nơi chỉ artifact được chuyển tiếp.

Với việc Tiny/Small, tránh ceremony report trừ khi context pressure hoặc nhu cầu evidence yêu cầu. Với Standard/Full, tạo handoff có biên tại phase boundary thật và giữ `resume.md` như con trỏ ngắn tới canonical handoff mới nhất.

Tham khảo đầy đủ: [PHASE_HANDOFF_PROTOCOL.md](./PHASE_HANDOFF_PROTOCOL.md).
```

- [ ] **Step 3: Replace English resume section with pointer format**

In `templates/docs/en/CONTEXT_BUDGET.md`, replace the current `## 7. Resume packet` template with:

```markdown
## 7. Resume packet

A resume packet is the fresh-session entry point. It points; it does not duplicate every handoff.

Store it at:

```text
docs/reports/YYYY-MM-DD-<slug>/resume.md
```

Use this format:

```markdown
# Resume Packet — <Work Item>

## Current pointer
- Latest canonical handoff:
- Current mode:
- Current phase:
- Next action:

## State
- Status: green | yellow | red
- Branch:
- Working tree state:
- Key artifacts:
- Changed files summary:

## Verification
- Last command:
- Result:
- Log path:
- Evidence freshness:

## Open items
- Blockers:
- Risks:
- User decisions needed:

## Context rules for next session
- Read first:
- Read only if needed:
- Do not reread:
- Do not paste:
```

If `resume.md` and the latest approved handoff conflict, fix `resume.md` before continuing.
```

- [ ] **Step 4: Replace Vietnamese resume section with pointer format**

In `templates/docs/vi/CONTEXT_BUDGET.md`, replace the current `## 7. Resume packet` template with:

```markdown
## 7. Resume packet

Resume packet là điểm vào cho session mới. Nó chỉ trỏ tới thông tin cần đọc; không duplicate mọi handoff.

Lưu tại:

```text
docs/reports/YYYY-MM-DD-<slug>/resume.md
```

Dùng format:

```markdown
# Resume Packet — <Work Item>

## Current pointer
- Latest canonical handoff:
- Current mode:
- Current phase:
- Next action:

## State
- Status: green | yellow | red
- Branch:
- Working tree state:
- Key artifacts:
- Changed files summary:

## Verification
- Last command:
- Result:
- Log path:
- Evidence freshness:

## Open items
- Blockers:
- Risks:
- User decisions needed:

## Context rules for next session
- Read first:
- Read only if needed:
- Do not reread:
- Do not paste:
```

Nếu `resume.md` và approved handoff mới nhất mâu thuẫn, sửa `resume.md` trước khi tiếp tục.
```

- [ ] **Step 5: Add sanity/evidence/final-claim sections in EN**

Append before `## 12. API 400 recovery`:

```markdown
## 12. Sanity check

At the start of Code, Test, QA, or Handover, verify minimally:

```markdown
## Sanity check
- Branch: pass | warn | block — note
- Working tree: pass | warn | block — note
- Canonical handoff freshness: pass | warn | block — note
- Required files exist: pass | warn | block — note
- Changed files summary: pass | warn | block — note
- Required commands available: pass | warn | block — note
- Open blockers: pass | warn | block — note

Decision: continue | continue-with-warning | stop
```

Hard blockers include wrong branch, stale handoff, missing required file, missing approval, evidence claimed as current but older than relevant changes, or unresolved blockers marked complete without evidence.

## 13. Evidence freshness

Evidence is valid only if it was produced after the relevant code/config/artifact change, on the expected branch and working tree, with a referenced log path when output is long.

Before Code → Test, Test → QA, or QA → Handover handoffs, capture or explicitly mark the status of:

- current branch,
- `git status`,
- `git diff --name-status`,
- `git diff --stat`,
- `git diff --check`,
- relevant build/test commands,
- project-required impact/change analysis when code changed.

If a command is not run, record the command, reason, risk, and severity.

## 14. Final claims

Final claims require fresh evidence. Before saying work is complete, the latest QA/Handover artifact or final summary must show:

- `git diff --check` passed, if code changed,
- build passed, if relevant,
- relevant tests passed or skipped with reason/risk,
- QA verdict: `pass`, `yellow`, `fail`, or `blocked`,
- unresolved risks,
- project-required change/impact analysis when code changed,
- final changed files summary,
- evidence freshness statement.

If evidence is missing, say: `Implemented, but not fully verified because <reason>.`
```

Renumber the existing `## 12. API 400 recovery` heading to `## 15. API 400 recovery`.

- [ ] **Step 6: Add sanity/evidence/final-claim sections in VI**

Append before `## 12. Khôi phục sau API 400`:

```markdown
## 12. Sanity check

Khi bắt đầu Code, Test, QA hoặc Handover, verify tối thiểu:

```markdown
## Sanity check
- Branch: pass | warn | block — note
- Working tree: pass | warn | block — note
- Canonical handoff freshness: pass | warn | block — note
- Required files exist: pass | warn | block — note
- Changed files summary: pass | warn | block — note
- Required commands available: pass | warn | block — note
- Open blockers: pass | warn | block — note

Decision: continue | continue-with-warning | stop
```

Hard blocker gồm sai branch, handoff stale, thiếu file bắt buộc, thiếu approval, evidence được claim là hiện tại nhưng cũ hơn thay đổi liên quan, hoặc blocker chưa giải quyết bị đánh dấu complete mà thiếu evidence.

## 13. Evidence freshness

Evidence chỉ hợp lệ khi được tạo sau thay đổi code/config/artifact liên quan, trên branch và working tree mong đợi, có log path được tham chiếu khi output dài.

Trước các handoff Code → Test, Test → QA, hoặc QA → Handover, capture hoặc ghi rõ trạng thái của:

- branch hiện tại,
- `git status`,
- `git diff --name-status`,
- `git diff --stat`,
- `git diff --check`,
- command build/test liên quan,
- impact/change analysis mà project yêu cầu khi code đổi.

Nếu không chạy command, ghi command, lý do, rủi ro và severity.

## 14. Claim cuối

Claim cuối cần evidence mới. Trước khi nói work đã hoàn tất, artifact QA/Handover mới nhất hoặc summary cuối phải thể hiện:

- `git diff --check` pass, nếu code đổi,
- build pass, nếu liên quan,
- test liên quan pass hoặc được skip kèm lý do/rủi ro,
- QA verdict: `pass`, `yellow`, `fail`, hoặc `blocked`,
- rủi ro chưa giải quyết,
- change/impact analysis mà project yêu cầu khi code đổi,
- summary file đã đổi cuối cùng,
- statement về evidence freshness.

Nếu thiếu evidence, nói: `Implemented, but not fully verified because <reason>.`
```

Renumber the existing `## 12. Khôi phục sau API 400` heading to `## 15. Khôi phục sau API 400`.

- [ ] **Step 7: Run context doc test**

Run:

```powershell
node --test test/links.test.cjs
```

Expected: context phrase assertions pass; remaining failures should point to `HANDOFF_TEMPLATES.md` or missing skill.

---

## Task 6: Update HANDOFF_TEMPLATES with phase artifact templates

**Files:**
- Modify: `templates/docs/en/HANDOFF_TEMPLATES.md`
- Modify: `templates/docs/vi/HANDOFF_TEMPLATES.md`

- [ ] **Step 1: Add English phase-boundary artifact section**

Append this section after the existing `## 1. Base contract` bounded-report block and before `## 2. BA Discovery Prompt`:

```markdown
## 1.1 Phase-boundary artifact templates

Use these when a real phase boundary needs a canonical handoff artifact, not just a one-off sub-agent prompt. Store canonical handoffs under `docs/reports/YYYY-MM-DD-<slug>/handoffs/` and keep `resume.md` as the short pointer.

Every phase handoff starts with:

```markdown
# Phase Handoff — <From Phase> → <To Phase>

## Status
- Work item:
- Mode: tiny | small | standard | full
- From phase:
- To phase:
- Status: green | yellow | red
- Approval: draft | approved | auto-approved | blocked
- Approved by:
- Approval evidence:
- Approval note:
- Branch:
- Base commit:
- Working tree state:
- Evidence captured against:
- Last updated:

## Source of truth
- Latest user instruction:
- Latest approved handoff/amendment:
- Referenced artifacts:
- Evidence paths:

## Read first
- `docs/reports/<slug>/resume.md`
- this handoff
- required files:

## Do not read
- old transcripts
- full logs unless debugging a listed failure
- full diffs unless a specific hunk is requested
- broad docs unless listed under required files

## Next action
- Next role:
- Objective:
- Stop condition:
- Required tools/skills:
```

### BA / Discovery → Design / Architecture

Add:

```markdown
## Product context
- User-facing goal:
- Personas/users:
- Business flows:
- Success criteria:
- Non-goals:

## Requirements
- Acceptance criteria:
- Edge cases:
- Constraints:
- Assumptions:
- Open product questions:
```

### Design / Architecture → Code

Add:

```markdown
## Implementation contract
- Architecture approach:
- API/module/interface contract:
- Data contract:

## Task list
- [ ] Task:

## Test strategy
- Unit tests:
- Integration tests:
- Manual checks:
- Regression focus:

## Impact analysis
- Symbol/area:
- Risk level:
- Direct callers/affected flows:
- Required precautions:
```

### Code → Test

Add:

```markdown
## Changed files
- `path`: purpose

## Commands already run
- Command:
  - Result:
  - Exit code:
  - Log path:
  - Top errors, if failed:

## Test focus
- Case:
  - Expected result:
  - Related files:

## Known risks
- Risk:
  - Severity:
  - Why it matters:
  - Suggested test:
```

### Test → Verify / QA

Add:

```markdown
## Test evidence
- Command:
  - Status: passed | failed | skipped
  - Exit code:
  - Log path:
  - Top errors:

## QA scope
- Review focus:
- Files to inspect:
- Risks to challenge:
- Coverage limit:
- If more than 5 findings are found:
```

### Verify / QA → Handover

Add:

```markdown
## QA verdict
- Verdict: pass | yellow | fail | blocked
- Reviewer:
- Review report path:

## Final verification
- Command:
  - Result:
  - Exit code:
  - Log path:

## User-facing summary
- What changed:
- What was verified:
- What was not verified:
```

### QA sub-agent prompt

```text
You are the QA reviewer for this task.

Read first:
- docs/reports/<slug>/resume.md
- docs/reports/<slug>/handoffs/04-test-to-qa.md

Run the structured sanity check:
- Branch: pass | warn | block — note
- Working tree: pass | warn | block — note
- Canonical handoff freshness: pass | warn | block — note
- Required files exist: pass | warn | block — note
- Changed files summary: pass | warn | block — note
- Required commands available: pass | warn | block — note
- Open blockers: pass | warn | block — note
- Decision: continue | continue-with-warning | stop

Read implementation files only when needed to verify a specific claim or finding.
Do not reread broad repository context.
Do not paste full logs, full diffs, full files, or transcript.

Return only: verdict, top 5 findings by severity, evidence summary, file:line citations, required fixes, commands run and result, report/log paths.
```

### Short next-phase prompt

```text
Continue this task artifact-first, not chat-first.

Read first:
- docs/reports/<slug>/resume.md
- docs/reports/<slug>/handoffs/<latest-canonical-handoff>.md

Do not read old transcripts, full logs, full diffs, or broad docs.
Read referenced files only if the handoff says they are required.
Do not paste full files/logs/diffs into chat.

Start with the structured sanity check, then confirm in <= 5 lines: mode, current phase, status, latest handoff, next action.
```
```

- [ ] **Step 2: Add Vietnamese phase-boundary artifact section**

Append the Vietnamese mirror in the equivalent location. Use this exact heading and required phrases so tests can match:

```markdown
## 1.1 Template artifact cho phase boundary

Dùng phần này khi một phase boundary thật cần canonical handoff artifact, không chỉ là prompt sub-agent một lần. Lưu canonical handoff dưới `docs/reports/YYYY-MM-DD-<slug>/handoffs/` và giữ `resume.md` như con trỏ ngắn.

Mọi phase handoff bắt đầu bằng cùng base template như bản tiếng Anh, giữ nguyên các key contract như `Status`, `Source of truth`, `Read first`, `Do not read`, `Next action` để agent đa ngôn ngữ dễ dùng.

### BA / Discovery → Design / Architecture

Ghi product context, personas/users, business flows, success criteria, non-goals, acceptance criteria, edge cases, constraints, assumptions và open product questions.

### Design / Architecture → Code

Ghi implementation contract, API/module/interface contract, data contract, task list, test strategy và impact analysis khi áp dụng.

### Code → Test

Ghi changed files, commands already run, test focus, implementation notes và known risks.

### Test → Verify / QA

Ghi test evidence, QA scope, fixes sau test failure nếu có, và remaining gaps nếu có.

### Verify / QA → Handover

Ghi QA verdict, final verification, user-facing summary, confirmed findings nếu có, và release/merge recommendation nếu áp dụng.

### Prompt QA sub-agent

```text
You are the QA reviewer for this task.

Read first:
- docs/reports/<slug>/resume.md
- docs/reports/<slug>/handoffs/04-test-to-qa.md

Run the structured sanity check:
- Branch: pass | warn | block — note
- Working tree: pass | warn | block — note
- Canonical handoff freshness: pass | warn | block — note
- Required files exist: pass | warn | block — note
- Changed files summary: pass | warn | block — note
- Required commands available: pass | warn | block — note
- Open blockers: pass | warn | block — note
- Decision: continue | continue-with-warning | stop

Read implementation files only when needed to verify a specific claim or finding.
Do not reread broad repository context.
Do not paste full logs, full diffs, full files, or transcript.

Return only: verdict, top 5 findings by severity, evidence summary, file:line citations, required fixes, commands run and result, report/log paths.
```

### Prompt ngắn cho phase tiếp theo

```text
Continue this task artifact-first, not chat-first.

Read first:
- docs/reports/<slug>/resume.md
- docs/reports/<slug>/handoffs/<latest-canonical-handoff>.md

Do not read old transcripts, full logs, full diffs, or broad docs.
Read referenced files only if the handoff says they are required.
Do not paste full files/logs/diffs into chat.

Start with the structured sanity check, then confirm in <= 5 lines: mode, current phase, status, latest handoff, next action.
```
```

- [ ] **Step 3: Run handoff doc test**

Run:

```powershell
node --test test/links.test.cjs
```

Expected: handoff phrase assertions pass; remaining failures should point to missing skill/init/vendor changes.

---

## Task 7: Add the `phase-handoff` skill and manifest updates

**Files:**
- Create: `templates/skills/phase-handoff/SKILL.md`
- Modify: `templates/skills/NOTICE`
- Modify: `skills.manifest.json`

- [ ] **Step 1: Create `templates/skills/phase-handoff/SKILL.md`**

Create the file with this content:

```markdown
---
name: phase-handoff
description: Use when crossing workflow phase boundaries, creating resume packets, recovering from context pressure, or handing work to a fresh session or sub-agent
---

# Phase Handoff

## Overview

Create bounded, evidence-backed handoff artifacts so the next workflow phase starts artifact-first, not chat-first.

Core principle:

```text
Phase work → bounded handoff artifact → context reset boundary → next phase reads artifact-first
```

## When to Use

Use this skill when:

- moving between Discovery, Design, Code, Test, QA, or Handover,
- context pressure is medium/high,
- sending work to a fresh session or sub-agent,
- recovering from a context-window/API 400 failure,
- a review or approval gate depends on current phase state.

Do not use it for:

- trivial Tiny work with obvious verification,
- switching between small edits inside the same implementation step,
- replacing tests, QA, or final verification.

## Quick Mode Check

| Mode | Use when | Handoff rule |
|---|---|---|
| Tiny | Typo/text/trivial config, <= 2 likely files, obvious verification | Avoid report folder unless context pressure appears |
| Small | Localized low-risk work, <= 5 likely files, simple rollback | Max one compact handoff if needed |
| Standard | Existing behavior change, refactor, meaningful tests/review, impact analysis required | Code → Test and Test → QA handoffs when boundaries are real |
| Full | New feature, architecture/API/data/security-sensitive work, high regression cost | Handoff at every real boundary |

Escalate mode if risk grows, file count grows, tests fail for unclear reasons, requirements change, or context pressure becomes medium/high.

## Real Phase Boundary

A real boundary exists when any are true:

- next step needs a different role or review mindset,
- current phase produced a decision, implementation, or test result future work depends on,
- user approval or QA gate is expected,
- context pressure trigger is reached,
- a sub-agent/workflow boundary is about to be crossed,
- work moves from planning to implementation or implementation to verification.

Not a boundary: two small edits in the same implementation step, rerunning a command after a trivial fix, reading one referenced file, or updating a typo in the same artifact.

## Required Inputs

Collect only bounded evidence:

- work item slug and report path,
- current mode, from phase, to phase,
- branch and working tree summary,
- latest user instruction and approval state,
- changed-file summary,
- command summaries and log paths,
- known risks/blockers,
- next role/objective/stop condition.

Do not paste full logs, full diffs, full files, secrets, or old transcripts into the handoff.

## Write Order

1. Check whether `resume.md` already points to a newer canonical handoff.
2. Write supporting artifacts first: logs, reviews, decisions, change notes.
3. Write or update the canonical handoff under `handoffs/`.
4. If replacing an already-used canonical handoff, archive the old one first.
5. Update `resume.md` last so it points to the latest handoff.
6. Output the short next-phase prompt.
7. Recommend `/compact`, fresh session, or sub-agent boundary when context pressure warrants it.

Never let two agents update the same canonical handoff or `resume.md` in parallel without reconciliation.

## Base Handoff Shape

Every handoff includes:

```markdown
# Phase Handoff — <From Phase> → <To Phase>

## Status
- Work item:
- Mode: tiny | small | standard | full
- From phase:
- To phase:
- Status: green | yellow | red
- Approval: draft | approved | auto-approved | blocked
- Approved by:
- Approval evidence:
- Approval note:
- Branch:
- Base commit:
- Working tree state:
- Evidence captured against:
- Last updated:

## Source of truth
- Latest user instruction:
- Latest approved handoff/amendment:
- Referenced artifacts:
- Evidence paths:

## Read first
- `docs/reports/<slug>/resume.md`
- this handoff
- required files:

## Do not read
- old transcripts
- full logs unless debugging a listed failure
- full diffs unless a specific hunk is requested
- broad docs unless listed under required files

## Next action
- Next role:
- Objective:
- Stop condition:
- Required tools/skills:
```

Add phase-specific sections from `docs/PHASE_HANDOFF_PROTOCOL.md` or `docs/HANDOFF_TEMPLATES.md`.

## Resume Shape

Keep `resume.md` short:

```markdown
# Resume Packet — <Work Item>

## Current pointer
- Latest canonical handoff:
- Current mode:
- Current phase:
- Next action:

## State
- Status:
- Branch:
- Working tree state:
- Key artifacts:
- Changed files summary:

## Verification
- Last command:
- Result:
- Log path:
- Evidence freshness:

## Open items
- Blockers:
- Risks:
- User decisions needed:

## Context rules for next session
- Read first:
- Read only if needed:
- Do not reread:
- Do not paste:
```

If `resume.md` conflicts with the latest handoff, fix `resume.md` before continuing.

## Sanity Check for the Next Phase

The next phase starts with:

```markdown
## Sanity check
- Branch: pass | warn | block — note
- Working tree: pass | warn | block — note
- Canonical handoff freshness: pass | warn | block — note
- Required files exist: pass | warn | block — note
- Changed files summary: pass | warn | block — note
- Required commands available: pass | warn | block — note
- Open blockers: pass | warn | block — note

Decision: continue | continue-with-warning | stop
```

Stop on wrong branch, stale/superseded handoff, missing required file, missing approval, stale evidence claimed as current, or unresolved blocker marked complete without evidence.

## Evidence Freshness

Important claims need fresh evidence paths. Before Code → Test, Test → QA, or QA → Handover, capture or mark:

- current branch,
- `git status`,
- `git diff --name-status`,
- `git diff --stat`,
- `git diff --check`,
- relevant build/test commands,
- project-required impact/change analysis when code changed.

If a command is skipped, record command, reason, risk, and severity.

## Output

Return only:

```text
Status:
Handoff written:
Resume updated:
Evidence paths:
Next-phase prompt:
Context boundary recommendation:
Risks/blockers:
```

## Common Mistakes

| Mistake | Fix |
|---|---|
| Writing a handoff but continuing the bloated chat | Follow with `/compact`, fresh session, or bounded sub-agent handoff when context pressure is medium/high |
| Duplicating the whole handoff in `resume.md` | Make `resume.md` a pointer only |
| Pasting full logs/diffs | Store them under `logs/` and cite paths |
| Marking approval as approved without evidence | Use `draft` or `blocked`, or cite the approval source |
| Trusting stale artifacts | Run the sanity check before continuing |
| Creating ceremony for Tiny work | Skip report folders unless context pressure or evidence requires them |
```

- [ ] **Step 2: Update `templates/skills/NOTICE`**

Replace lines 16-21 with:

```text
Vendored skills from obra/superpowers:
  brainstorming, writing-plans, executing-plans, test-driven-development,
  systematic-debugging, verification-before-completion, requesting-code-review,
  receiving-code-review, dispatching-parallel-agents,
  subagent-driven-development, using-git-worktrees,
  finishing-a-development-branch, using-superpowers

Framework-authored skills shipped by hero-vibe-kit:
  phase-handoff
```

- [ ] **Step 3: Update `skills.manifest.json`**

In `groups.process.skills`, add this object after `finishing-a-development-branch`:

```json
{ "name": "phase-handoff", "source": "hero-vibe-kit" }
```

Also update the process group description so it says:

```json
"description": "Core process skills the workflow invokes by name. Most are vendored under templates/skills/ and installed into .claude/skills/ by init/update (curated, lightly trimmed copy of obra/superpowers; attribution in templates/skills/NOTICE). The phase-handoff skill is authored by hero-vibe-kit. The workflow still runs without skills (gates/hooks/router intact) but loses skill-guided depth."
```

- [ ] **Step 4: Run skill tests and verify GREEN for skill coverage**

Run:

```powershell
node --test test/skills-vendor.test.cjs
```

Expected: PASS.

---

## Task 8: Update init smoke and README docs tree expectations

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update README installed docs tree**

In `README.md`, replace the docs tree comment at lines 47-50 with:

```markdown
  docs/              # AGENCY_WORKFLOW (SSOT) + CONTEXT_BUDGET, PHASE_HANDOFF_PROTOCOL,
                     # HANDOFF_TEMPLATES, ARTIFACTS_AND_STORAGE, DEFINITION_OF_DONE,
                     # BRANCHING, TEAM_ROSTER, ACTIVE_STATE, COMMUNICATION_PROTOCOL,
                     # INTERACTION_PATTERNS, SECURITY_STANDARDS, PERFORMANCE_STANDARDS,
                     # templates/PRD_AI_FEATURE; later specs/, plans/, reports/ as needed
```

- [ ] **Step 2: Run init smoke focused test**

Run:

```powershell
node --test test/init-smoke.test.cjs
```

Expected: PASS.

---

## Task 9: Run full verification and create Code → Test handoff

**Files:**
- Create: `docs/reports/2026-06-07-phase-handoff-protocol/logs/<timestamp>-*.log`
- Create: `docs/reports/2026-06-07-phase-handoff-protocol/handoffs/03-code-to-test.md`
- Modify: `docs/reports/2026-06-07-phase-handoff-protocol/resume.md`

- [ ] **Step 1: Capture git summary evidence**

Run summary commands and save outputs to logs:

```powershell
git status --short
git diff --name-status
git diff --stat
git diff --check
```

Use log filenames under:

```text
docs/reports/2026-06-07-phase-handoff-protocol/logs/YYYYMMDD-HHMM-<command>.log
```

Expected: `git diff --check` exits 0. If it fails, fix whitespace before continuing.

- [ ] **Step 2: Run full test suite**

Run:

```powershell
npm test
```

Save full output to a log under `docs/reports/2026-06-07-phase-handoff-protocol/logs/`.

Expected: PASS.

- [ ] **Step 3: Run GitNexus change detection**

Run MCP:

```text
gitnexus_detect_changes({ scope: "all", repo: "hero-vibe-kit" })
```

Expected: affected scope matches docs/templates/tests/skill integration. If it reports unexpected code execution-flow risk, stop and investigate.

- [ ] **Step 4: Create `03-code-to-test.md`**

Create `docs/reports/2026-06-07-phase-handoff-protocol/handoffs/03-code-to-test.md` with:

```markdown
# Phase Handoff — Code → Test

## Status
- Work item: Phase Handoff Protocol Integration
- Mode: full
- From phase: Code
- To phase: Test
- Status: green
- Approval: auto-approved
- Approved by: Main Agent
- Approval evidence: Implementation completed according to approved spec and plan
- Approval note: Ready for verification and QA review
- Branch: <actual branch>
- Base commit: <actual base commit or none>
- Working tree state: <actual summary>
- Evidence captured against: <branch/commit/working tree/diff summary/log timestamp>
- Last updated: 2026-06-07

## Source of truth
- Latest user instruction: "approve spec"
- Latest approved handoff/amendment: `handoffs/02-design-to-code.md`
- Referenced artifacts:
  - `docs/superpowers/specs/2026-06-07-phase-handoff-protocol-integration-design.md`
  - `docs/superpowers/plans/2026-06-07-phase-handoff-protocol-integration.md`
- Evidence paths:
  - `<git status log>`
  - `<git diff name-status log>`
  - `<git diff stat log>`
  - `<git diff check log>`
  - `<npm test log>`

## Read first
- `docs/reports/2026-06-07-phase-handoff-protocol/resume.md`
- this handoff
- required files:
  - `test/links.test.cjs`
  - `test/init-smoke.test.cjs`
  - `test/skills-vendor.test.cjs`
  - `templates/docs/en/AGENCY_WORKFLOW.md`
  - `templates/docs/en/CONTEXT_BUDGET.md`
  - `templates/docs/en/HANDOFF_TEMPLATES.md`
  - `templates/skills/phase-handoff/SKILL.md`

## Do not read
- old transcripts
- full logs unless debugging a listed failure
- full diffs unless a specific hunk is requested
- full protocol docs unless verifying protocol content

## Next action
- Next role: test/verification
- Objective: verify tests and docs/skill integration evidence, then hand off to QA.
- Stop condition: `04-test-to-qa.md` exists with test evidence and QA scope.
- Required tools/skills: verification-before-completion, gitnexus_detect_changes

## Changed files
- `templates/docs/en/PHASE_HANDOFF_PROTOCOL.md`: English full protocol reference
- `templates/docs/vi/PHASE_HANDOFF_PROTOCOL.md`: Vietnamese full protocol reference
- `templates/docs/en/AGENCY_WORKFLOW.md`: short mode/phase-boundary rules
- `templates/docs/vi/AGENCY_WORKFLOW.md`: Vietnamese mirror
- `templates/docs/en/CONTEXT_BUDGET.md`: sanity/evidence/final-claim rules
- `templates/docs/vi/CONTEXT_BUDGET.md`: Vietnamese mirror
- `templates/docs/en/HANDOFF_TEMPLATES.md`: phase artifact templates
- `templates/docs/vi/HANDOFF_TEMPLATES.md`: Vietnamese mirror
- `templates/skills/phase-handoff/SKILL.md`: deterministic handoff skill
- `templates/skills/NOTICE`: attribution update
- `skills.manifest.json`: process skill manifest update
- `test/links.test.cjs`: protocol doc assertions
- `test/init-smoke.test.cjs`: install smoke assertions
- `test/skills-vendor.test.cjs`: vendored skill assertions
- `README.md`: installed docs tree update

## Commands already run
- Command: `node --test test/links.test.cjs test/init-smoke.test.cjs test/skills-vendor.test.cjs`
  - Result: <passed/failed>
  - Exit code: <code>
  - Log path: <path>
  - Top errors, if failed: <top errors>
- Command: `npm test`
  - Result: <passed/failed>
  - Exit code: <code>
  - Log path: <path>
  - Top errors, if failed: <top errors>

## Test focus
- Case: Bilingual doc parity
  - Expected result: EN/VI docs file sets match and links resolve
  - Related files: `test/links.test.cjs`, `templates/docs/{en,vi}/*`
- Case: Consumer init installs protocol docs and skill
  - Expected result: init smoke finds docs and `.claude/skills/phase-handoff/SKILL.md`
  - Related files: `test/init-smoke.test.cjs`, `src/init.cjs`, `src/skills.cjs`
- Case: Vendored skill manifest matches templates
  - Expected result: skill tests pass and manifest process group matches template skills
  - Related files: `test/skills-vendor.test.cjs`, `skills.manifest.json`, `templates/skills/`

## Known risks
- Risk: Vietnamese protocol drift from English
  - Severity: medium
  - Why it matters: consumers selecting `--lang vi` must receive equivalent process rules
  - Suggested test: compare headings/required protocol phrases and links
```

Fill all `<...>` placeholders with actual execution evidence before saving.

- [ ] **Step 5: Update `resume.md` pointer**

Update `docs/reports/2026-06-07-phase-handoff-protocol/resume.md`:

```markdown
- Latest canonical handoff: `handoffs/03-code-to-test.md`
- Current phase: Test
- Next action: verify evidence and prepare `handoffs/04-test-to-qa.md`
```

Also update changed files summary and verification evidence with actual log paths.

---

## Task 10: QA review, final verification, and handover artifacts

**Files:**
- Create: `docs/reports/2026-06-07-phase-handoff-protocol/handoffs/04-test-to-qa.md`
- Create: `docs/reports/2026-06-07-phase-handoff-protocol/reviews/qa-review.md`
- Create: `docs/reports/2026-06-07-phase-handoff-protocol/handoffs/05-qa-to-handover.md`
- Modify: `docs/reports/2026-06-07-phase-handoff-protocol/resume.md`

- [ ] **Step 1: Create `04-test-to-qa.md`**

Create the Test → QA handoff from `03-code-to-test.md` evidence:

```markdown
# Phase Handoff — Test → Verify / QA

## Status
- Work item: Phase Handoff Protocol Integration
- Mode: full
- From phase: Test
- To phase: Verify / QA
- Status: green
- Approval: auto-approved
- Approved by: Main Agent
- Approval evidence: Test evidence captured in Code → Test handoff
- Approval note: Ready for bounded QA review
- Branch: <actual branch>
- Base commit: <actual base commit or none>
- Working tree state: <actual summary>
- Evidence captured against: <fresh evidence identity>
- Last updated: 2026-06-07

## Source of truth
- Latest user instruction: "approve spec"
- Latest approved handoff/amendment: `handoffs/03-code-to-test.md`
- Referenced artifacts:
  - `docs/superpowers/specs/2026-06-07-phase-handoff-protocol-integration-design.md`
  - `docs/superpowers/plans/2026-06-07-phase-handoff-protocol-integration.md`
- Evidence paths:
  - `<npm test log>`
  - `<git diff check log>`
  - `<gitnexus detect changes summary or note>`

## Read first
- `docs/reports/2026-06-07-phase-handoff-protocol/resume.md`
- this handoff
- `handoffs/03-code-to-test.md`

## Do not read
- old transcripts
- full logs unless debugging a listed failure
- full diffs unless a specific hunk is requested
- broad docs beyond files listed in QA scope

## Next action
- Next role: QA reviewer
- Objective: challenge protocol integration for missing docs, broken parity, weak skill behavior, and test gaps.
- Stop condition: QA verdict is `pass`, `yellow`, `fail`, or `blocked` with evidence.
- Required tools/skills: requesting-code-review or code-review, verification-before-completion

## Test evidence
- Command: `npm test`
  - Status: <passed/failed/skipped>
  - Exit code: <code>
  - Log path: <path>
  - Top errors: <none or top errors>

## QA scope
- Review focus: docs are not bloated, protocol links work, EN/VI parity exists, skill is deterministic, tests cover install behavior.
- Files to inspect:
  - `templates/docs/en/AGENCY_WORKFLOW.md`
  - `templates/docs/en/CONTEXT_BUDGET.md`
  - `templates/docs/en/HANDOFF_TEMPLATES.md`
  - `templates/docs/vi/AGENCY_WORKFLOW.md`
  - `templates/docs/vi/CONTEXT_BUDGET.md`
  - `templates/docs/vi/HANDOFF_TEMPLATES.md`
  - `templates/skills/phase-handoff/SKILL.md`
  - `test/links.test.cjs`
  - `test/init-smoke.test.cjs`
  - `test/skills-vendor.test.cjs`
- Risks to challenge:
  - full protocol copied into always-loaded docs,
  - Tiny/Small ceremony overreach,
  - missing final-claim evidence requirement,
  - skill silently overwrites handoffs,
  - init/update fails to install new skill.
- Coverage limit: return top 5 findings in chat; write full list to `reviews/qa-review.md` if longer.
- If more than 5 findings are found: list highest severity 5 and write the rest to `reviews/qa-review.md`.
```

- [ ] **Step 2: Dispatch bounded QA reviewer**

Use a sub-agent with this prompt:

```text
You are the QA reviewer for Phase Handoff Protocol Integration.

Read first:
- docs/reports/2026-06-07-phase-handoff-protocol/resume.md
- docs/reports/2026-06-07-phase-handoff-protocol/handoffs/04-test-to-qa.md

Run the structured sanity check:
- Branch: pass | warn | block — note
- Working tree: pass | warn | block — note
- Canonical handoff freshness: pass | warn | block — note
- Required files exist: pass | warn | block — note
- Changed files summary: pass | warn | block — note
- Required commands available: pass | warn | block — note
- Open blockers: pass | warn | block — note
- Decision: continue | continue-with-warning | stop

Review only the files listed in QA scope unless a finding requires a narrower follow-up.
Do not paste full logs, full diffs, full files, or transcript.

Return only:
- verdict: pass | yellow | fail | blocked,
- top 5 findings by severity,
- evidence summary,
- file:line citations,
- required fixes,
- commands run and result,
- report/log paths.

If findings are long, write them to docs/reports/2026-06-07-phase-handoff-protocol/reviews/qa-review.md and return only the path plus summary.
```

Expected: QA returns pass/yellow or actionable findings. If findings are fail/blocking, fix them with a new RED/GREEN mini-loop where applicable, rerun affected tests, and update handoffs.

- [ ] **Step 3: Run final verification**

Run:

```powershell
git diff --check
npm test
```

Run MCP:

```text
gitnexus_detect_changes({ scope: "all", repo: "hero-vibe-kit" })
```

Expected: `git diff --check` and `npm test` pass; detect changes scope matches expected docs/templates/tests/skill files.

- [ ] **Step 4: Create `05-qa-to-handover.md`**

Create final handover artifact:

```markdown
# Phase Handoff — Verify / QA → Handover

## Status
- Work item: Phase Handoff Protocol Integration
- Mode: full
- From phase: Verify / QA
- To phase: Handover
- Status: green | yellow | red
- Approval: auto-approved
- Approved by: Main Agent
- Approval evidence: QA verdict and final verification evidence
- Approval note: <note>
- Branch: <actual branch>
- Base commit: <actual base commit or none>
- Working tree state: <actual summary>
- Evidence captured against: <fresh evidence identity>
- Last updated: 2026-06-07

## Source of truth
- Latest user instruction: "approve spec"
- Latest approved handoff/amendment: `handoffs/04-test-to-qa.md`
- Referenced artifacts:
  - `docs/superpowers/specs/2026-06-07-phase-handoff-protocol-integration-design.md`
  - `docs/superpowers/plans/2026-06-07-phase-handoff-protocol-integration.md`
  - `reviews/qa-review.md`
- Evidence paths:
  - `<git diff check log>`
  - `<npm test log>`
  - `<gitnexus detect changes summary or note>`

## Read first
- `docs/reports/2026-06-07-phase-handoff-protocol/resume.md`
- this handoff

## Do not read
- old transcripts
- full logs unless debugging a listed failure
- full diffs unless a specific hunk is requested

## Next action
- Next role: Main Agent handover
- Objective: report what changed, what passed, what was not verified, and unresolved risks.
- Stop condition: user receives final summary with evidence.
- Required tools/skills: verification-before-completion

## QA verdict
- Verdict: <pass|yellow|fail|blocked>
- Reviewer: QA sub-agent
- Review report path: `reviews/qa-review.md` or inline summary path

## Final verification
- Command: `git diff --check`
  - Result: <passed/failed>
  - Exit code: <code>
  - Log path: <path>
- Command: `npm test`
  - Result: <passed/failed>
  - Exit code: <code>
  - Log path: <path>

## User-facing summary
- What changed:
  - Added Phase Handoff Protocol template docs EN/VI.
  - Added short operational protocol hooks to workflow/context/handoff docs EN/VI.
  - Added installable `phase-handoff` skill.
  - Added tests for protocol docs, init install, and skill vendoring.
- What was verified:
  - <actual verification summary>
- What was not verified:
  - <actual gaps or none>

## Release/merge recommendation
- Recommendation: <ready/not ready>
- Conditions: <conditions or none>
- Unresolved risks: <risks or none>
```

- [ ] **Step 5: Update final `resume.md` pointer**

Update `resume.md`:

```markdown
- Latest canonical handoff: `handoffs/05-qa-to-handover.md`
- Current phase: Handover
- Next action: report final summary to user
```

---

## Self-Review

**Spec coverage:**
- Full protocol docs EN/VI: Task 3.
- Short operational rules in workflow/context/handoff docs: Tasks 4-6.
- `phase-handoff` skill: Task 7.
- Tests for bilingual parity/install/vendor behavior: Tasks 1, 7, 8, 9.
- Evidence/report artifacts and phase handoffs: Tasks 2, 9, 10.
- Final verification and GitNexus detect changes: Tasks 9-10.

**Placeholder scan:**
- Implementation examples contain `<actual ...>` only inside handoff templates that must be filled with real execution evidence during the task. These are not code placeholders; they are required runtime evidence fields. No implementation step says `TBD`, `TODO`, or `implement later`.

**Type/name consistency:**
- Skill name is consistently `phase-handoff`.
- Protocol doc path is consistently `PHASE_HANDOFF_PROTOCOL.md`.
- Report slug is consistently `2026-06-07-phase-handoff-protocol`.
- Test commands use `node --test` and `npm test` consistent with `package.json`.
