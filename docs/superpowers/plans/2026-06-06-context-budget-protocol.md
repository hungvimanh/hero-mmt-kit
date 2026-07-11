# Context Budget Protocol Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a strict Context Budget Protocol to hero-vibe-kit so the Main Agent stays lightweight, avoids long raw context dumps, checkpoints phase state, and can recover from context-window API 400 errors through artifact-first resume packets.

**Architecture:** This is a documentation/template-only change. `AGENCY_WORKFLOW.md` remains the process router and gets the short mandatory protocol; new `CONTEXT_BUDGET.md` files hold detailed operating guidance; `TEAM_ROSTER.md`, `HANDOFF_TEMPLATES.md`, and `ARTIFACTS_AND_STORAGE.md` link and reinforce bounded-output and resume-packet behavior.

**Tech Stack:** Markdown templates, existing Node.js `node --test` test suite, GitNexus change detection. No runtime dependencies or CLI logic changes.

---

## File structure

- Create: `templates/docs/en/CONTEXT_BUDGET.md`
  - Detailed English operating guide for context-pressure signals, no-dump rules, checkpoints, compact/restart prompts, resume packets, bounded sub-agent outputs, and API 400 recovery.

- Create: `templates/docs/vi/CONTEXT_BUDGET.md`
  - Vietnamese equivalent with matching section structure.

- Modify: `templates/docs/en/AGENCY_WORKFLOW.md`
  - Add short mandatory `Context Budget Protocol` after `Self-Prompting Router`.
  - Add `Context pressure high` row to the next-prompt decision table.
  - Link `CONTEXT_BUDGET.md` in related documents.

- Modify: `templates/docs/vi/AGENCY_WORKFLOW.md`
  - Mirror the English workflow changes.

- Modify: `templates/docs/en/TEAM_ROSTER.md`
  - Add lightweight-controller and read-broad/report-narrow language.
  - Link `CONTEXT_BUDGET.md`.

- Modify: `templates/docs/vi/TEAM_ROSTER.md`
  - Mirror the English roster changes.

- Modify: `templates/docs/en/HANDOFF_TEMPLATES.md`
  - Add `Context budget:` to the base contract.
  - Add base no-full-dumps constraint.
  - Add bounded-output context-budget lines to the reviewer/QA/handover templates.

- Modify: `templates/docs/vi/HANDOFF_TEMPLATES.md`
  - Mirror the English handoff template changes.

- Modify: `templates/docs/en/ARTIFACTS_AND_STORAGE.md`
  - Add `Resume packet` storage role.
  - Add `resume.md` to reports layout.
  - Add resume packet requirements by path and concise-state rule.

- Modify: `templates/docs/vi/ARTIFACTS_AND_STORAGE.md`
  - Mirror the English artifact-storage changes.

---

### Task 1: Create English Context Budget guide

**Files:**
- Create: `templates/docs/en/CONTEXT_BUDGET.md`

- [ ] **Step 1: Create `templates/docs/en/CONTEXT_BUDGET.md`**

Write the following content:

```markdown
# Context Budget Protocol

The Main Agent is a workflow controller, not a transcript warehouse. Use this protocol to keep Claude Code sessions small enough to continue reliably, especially during long Standard and Full path work.

Routing and gates live in [AGENCY_WORKFLOW.md](./AGENCY_WORKFLOW.md). Role behavior lives in [TEAM_ROSTER.md](./TEAM_ROSTER.md). Durable state and resume artifacts live under the rules in [ARTIFACTS_AND_STORAGE.md](./ARTIFACTS_AND_STORAGE.md).

## 1. Purpose

The protocol prevents context-window failures by moving durable state out of chat and into artifacts, bounding sub-agent outputs, and forcing checkpoint/compact/session-split decisions at high-risk moments.

It addresses failures such as:

```text
API Error: 400 Your input exceeds the context window of this model.
```

## 2. Non-goals

This protocol does not:

- automatically run `/compact`,
- change Claude Code settings,
- add runtime dependencies,
- add a memory MCP server,
- require a `resume.md` for every small Fast path task,
- replace the workflow router or Definition of Done.

## 3. Context-pressure signals

Trigger this protocol when any of these happen:

- the Main Agent has read many large files,
- a diff is long or spans many files,
- test output or logs are long,
- a sub-agent returns a long response,
- review/fix loops repeat several times,
- the Main Agent is about to reread broad context,
- Claude Code feels slow, confused, or loses state,
- the user reports context problems,
- Claude Code returns a context-window API 400 error.

## 4. No-dump rules

By default, the Main Agent must not paste these into chat:

- full file contents,
- full diffs,
- full test logs,
- full sub-agent transcripts,
- entire specs or plans when only one task is needed,
- unfiltered command output when pass/fail or a short excerpt is enough.

Prefer:

- targeted excerpts,
- summaries,
- file/path citations,
- report artifacts,
- bounded sub-agent findings.

## 5. Mandatory checkpoint triggers

Checkpoint before moving through these boundaries:

- Discovery → Planning,
- Planning → Implementation,
- Implementation → QA/review,
- QA/review → Handover,
- Handover → commit/PR/merge.

Also checkpoint whenever context pressure is high.

For Standard and Full paths, create or update `docs/reports/YYYY-MM-DD-<slug>/resume.md` when the work is long-running or context pressure is high. For small Fast path work, updating `ACTIVE_STATE.md` is enough unless context pressure is high.

## 6. Resume packet

A resume packet is concise restart state, not a copied transcript.

Store it at:

```text
docs/reports/YYYY-MM-DD-<slug>/resume.md
```

Use this format:

```markdown
# Resume Packet — <work item>

## Current state
- Path:
- Phase:
- Status:
- Last completed step:

## Goal
- User-facing goal:
- Non-goals:

## Approved decisions
- Decision:
- Reason:
- Source artifact:

## Files changed
- `path`: what changed

## Artifacts
- Spec:
- Plan:
- Reports:
- Active state:

## Verification evidence
- Command:
- Result:
- Notes:

## Open risks / blockers
- Risk:
- Blocker:
- Needs user decision:

## Next action
- Do next:
- Do not do:
- Required skill/tool:

## Context hygiene
- Do not reread:
- Do read:
- Do not paste:
- Prefer:
```

## 7. Compact prompt

When staying in the same session, use:

```text
/compact Summarize only durable state for continuing this task. Include: goal, approved decisions, current path/phase, files changed, artifacts, verification evidence, open risks/blockers, next action, and what not to reread. Drop transcripts, full file contents, full diffs, full logs, and conversational detail.
```

## 8. Fresh-session prompt

When the current session is bloated or hit by API 400, start fresh with:

```text
Continue this task from artifacts, not old chat history.

Read first:
- docs/reports/<slug>/resume.md
- docs/ACTIVE_STATE.md
- docs/plans/<plan>.md only if the resume packet requires it
- docs/specs/<spec>.md only if the resume packet requires it

Do not reread the whole repo, full diff, old transcript, or all docs.
Do not paste full files/logs/diffs into chat.
Current goal: <next action from resume packet>.
Start by confirming path, phase, current status, and next action in no more than 5 lines.
```

## 9. Sub-agent output limits

Sub-agents may read broadly, but must report narrowly.

Ask sub-agents to return only:

- status or verdict,
- top findings,
- evidence summary,
- file/path citations,
- risks or blockers,
- next actions.

Sub-agents must not return:

- full transcripts,
- full file contents,
- full diffs,
- full logs,
- broad unrelated commentary.

## 10. Tool-output hygiene

Before running tools that may emit large output:

1. narrow the file path or search pattern,
2. request only the needed lines or summary,
3. avoid reading generated transcripts unless necessary,
4. prefer pass/fail summaries for tests,
5. write long evidence to reports instead of chat.

## 11. API 400 recovery

If Claude Code returns a context-window API 400 error:

1. stop trying to continue the bloated session,
2. start a fresh Claude Code session,
3. provide only the latest resume packet and artifact links,
4. ask the agent to continue artifact-first,
5. avoid rereading broad context unless the resume packet requires it.
```

- [ ] **Step 2: Check English context guide placeholders**

Run:

```powershell
Select-String -Path "templates/docs/en/CONTEXT_BUDGET.md" -Pattern "TBD|TODO|implement later"
```

Expected: no output.

---

### Task 2: Create Vietnamese Context Budget guide

**Files:**
- Create: `templates/docs/vi/CONTEXT_BUDGET.md`

- [ ] **Step 1: Create `templates/docs/vi/CONTEXT_BUDGET.md`**

Write the Vietnamese equivalent with matching section numbers and links:

```markdown
# Context Budget Protocol

Main Agent là bộ điều khiển workflow, không phải kho chứa transcript. Dùng protocol này để giữ session Claude Code đủ nhẹ để tiếp tục ổn định, đặc biệt trong các việc Standard và Full path kéo dài.

Routing và gate nằm trong [AGENCY_WORKFLOW.md](./AGENCY_WORKFLOW.md). Hành vi theo vai trò nằm trong [TEAM_ROSTER.md](./TEAM_ROSTER.md). State bền vững và artifact resume tuân theo [ARTIFACTS_AND_STORAGE.md](./ARTIFACTS_AND_STORAGE.md).

## 1. Mục đích

Protocol này giảm lỗi context window bằng cách chuyển state bền vững ra artifact, giới hạn output của sub-agent, và bắt buộc quyết định checkpoint/compact/tách session ở các thời điểm rủi ro cao.

Protocol xử lý các lỗi như:

```text
API Error: 400 Your input exceeds the context window of this model.
```

## 2. Ngoài phạm vi

Protocol này không:

- tự động chạy `/compact`,
- thay đổi settings của Claude Code,
- thêm runtime dependency,
- thêm MCP server quản lý memory,
- bắt mọi task Fast nhỏ phải có `resume.md`,
- thay thế workflow router hoặc Definition of Done.

## 3. Dấu hiệu context pressure

Kích hoạt protocol này khi có một trong các dấu hiệu:

- Main Agent đã đọc nhiều file lớn,
- diff dài hoặc trải trên nhiều file,
- test output hoặc log dài,
- sub-agent trả response dài,
- nhiều vòng review/fix lặp lại,
- Main Agent chuẩn bị đọc lại context rộng,
- Claude Code chậm, rối hoặc mất state,
- User báo vấn đề context,
- Claude Code trả lỗi API 400 do context window.

## 4. Quy tắc không dump

Mặc định Main Agent không được paste các nội dung này vào chat:

- toàn bộ nội dung file,
- toàn bộ diff,
- toàn bộ test log,
- toàn bộ transcript sub-agent,
- toàn bộ spec hoặc plan khi chỉ cần một task,
- output command không filter khi chỉ cần pass/fail hoặc đoạn ngắn.

Ưu tiên:

- excerpt có mục tiêu,
- summary,
- trích dẫn file/path,
- report artifact,
- finding ngắn gọn từ sub-agent.

## 5. Trigger checkpoint bắt buộc

Checkpoint trước khi đi qua các ranh giới:

- Discovery → Planning,
- Planning → Implementation,
- Implementation → QA/review,
- QA/review → Handover,
- Handover → commit/PR/merge.

Cũng checkpoint bất cứ khi nào context pressure cao.

Với Standard và Full path, tạo hoặc cập nhật `docs/reports/YYYY-MM-DD-<slug>/resume.md` khi công việc kéo dài hoặc context pressure cao. Với Fast path nhỏ, cập nhật `ACTIVE_STATE.md` là đủ trừ khi context pressure cao.

## 6. Resume packet

Resume packet là state ngắn gọn để restart, không phải transcript được copy lại.

Lưu tại:

```text
docs/reports/YYYY-MM-DD-<slug>/resume.md
```

Dùng format:

```markdown
# Resume Packet — <work item>

## Current state
- Path:
- Phase:
- Status:
- Last completed step:

## Goal
- User-facing goal:
- Non-goals:

## Approved decisions
- Decision:
- Reason:
- Source artifact:

## Files changed
- `path`: what changed

## Artifacts
- Spec:
- Plan:
- Reports:
- Active state:

## Verification evidence
- Command:
- Result:
- Notes:

## Open risks / blockers
- Risk:
- Blocker:
- Needs user decision:

## Next action
- Do next:
- Do not do:
- Required skill/tool:

## Context hygiene
- Do not reread:
- Do read:
- Do not paste:
- Prefer:
```

## 7. Prompt compact

Khi tiếp tục trong cùng session, dùng:

```text
/compact Summarize only durable state for continuing this task. Include: goal, approved decisions, current path/phase, files changed, artifacts, verification evidence, open risks/blockers, next action, and what not to reread. Drop transcripts, full file contents, full diffs, full logs, and conversational detail.
```

## 8. Prompt session mới

Khi session hiện tại quá nặng hoặc gặp API 400, mở session mới với:

```text
Continue this task from artifacts, not old chat history.

Read first:
- docs/reports/<slug>/resume.md
- docs/ACTIVE_STATE.md
- docs/plans/<plan>.md only if the resume packet requires it
- docs/specs/<spec>.md only if the resume packet requires it

Do not reread the whole repo, full diff, old transcript, or all docs.
Do not paste full files/logs/diffs into chat.
Current goal: <next action from resume packet>.
Start by confirming path, phase, current status, and next action in no more than 5 lines.
```

## 9. Giới hạn output sub-agent

Sub-agent có thể đọc rộng, nhưng phải báo cáo hẹp.

Yêu cầu sub-agent chỉ trả:

- status hoặc verdict,
- finding quan trọng nhất,
- summary bằng chứng,
- trích dẫn file/path,
- rủi ro hoặc blocker,
- next actions.

Sub-agent không được trả:

- transcript đầy đủ,
- toàn bộ nội dung file,
- toàn bộ diff,
- toàn bộ log,
- bình luận rộng không liên quan.

## 10. Vệ sinh output tool

Trước khi chạy tool có thể tạo output lớn:

1. thu hẹp file path hoặc search pattern,
2. chỉ yêu cầu dòng hoặc summary cần thiết,
3. tránh đọc generated transcript trừ khi thật sự cần,
4. ưu tiên summary pass/fail cho test,
5. ghi evidence dài vào report thay vì chat.

## 11. Khôi phục sau API 400

Nếu Claude Code trả lỗi API 400 do context window:

1. dừng cố tiếp tục session đã phình to,
2. mở session Claude Code mới,
3. chỉ cung cấp resume packet mới nhất và link artifact,
4. yêu cầu agent tiếp tục theo artifact-first,
5. tránh đọc lại context rộng trừ khi resume packet yêu cầu.
```

- [ ] **Step 2: Check Vietnamese context guide placeholders**

Run:

```powershell
Select-String -Path "templates/docs/vi/CONTEXT_BUDGET.md" -Pattern "TBD|TODO|implement later"
```

Expected: no output.

---

### Task 3: Update Agency Workflow context protocol

**Files:**
- Modify: `templates/docs/en/AGENCY_WORKFLOW.md`
- Modify: `templates/docs/vi/AGENCY_WORKFLOW.md`

- [ ] **Step 1: Insert English `Context Budget Protocol` after `Self-Prompting Router`**

Insert this section after the existing self-prompting paragraph and before `### Escalation rule`:

```markdown
### Context Budget Protocol

The Main Agent is a workflow controller, not a transcript warehouse. Before broad exploration, implementation, QA/review, final verification, or any phase handoff:

1. checkpoint durable state in [ACTIVE_STATE.md](./ACTIVE_STATE.md), the current plan/spec, or a resume packet,
2. avoid reading or dumping full files unless a bounded excerpt is necessary,
3. delegate broad reading/review when it improves focus or protects the main context,
4. summarize tool and sub-agent outputs instead of carrying raw logs or transcripts,
5. run `/compact` or start a fresh session from artifact links when context pressure is high.

Detailed rules, compact prompts, session-restart prompts, and API 400 recovery steps live in [CONTEXT_BUDGET.md](./CONTEXT_BUDGET.md).
```

- [ ] **Step 2: Insert Vietnamese `Context Budget Protocol` after `Self-Prompting Router`**

Insert the Vietnamese equivalent before `### Escalation rule (nâng cấp path)`:

```markdown
### Context Budget Protocol

Main Agent là bộ điều khiển workflow, không phải kho chứa transcript. Trước khi exploration rộng, implementation, QA/review, final verification, hoặc bất kỳ phase handoff nào:

1. checkpoint state bền vững trong [ACTIVE_STATE.md](./ACTIVE_STATE.md), plan/spec hiện tại, hoặc resume packet,
2. tránh đọc hoặc dump toàn bộ file trừ khi cần một excerpt có biên rõ,
3. delegate việc đọc/review rộng khi nó giúp tăng focus hoặc bảo vệ context chính,
4. tóm tắt output của tool và sub-agent thay vì mang theo raw log hoặc transcript,
5. chạy `/compact` hoặc mở session mới từ link artifact khi context pressure cao.

Quy tắc chi tiết, prompt compact, prompt restart session và bước khôi phục API 400 nằm trong [CONTEXT_BUDGET.md](./CONTEXT_BUDGET.md).
```

- [ ] **Step 3: Add next-prompt table row in both workflow files**

In English, add this row before `Unexpected risk discovered`:

```markdown
| Context pressure high | Write/update the resume packet, run `/compact` if staying in-session, or start a fresh session from artifact links. |
```

In Vietnamese, add this row before `Phát hiện rủi ro bất ngờ`:

```markdown
| Context pressure cao | Ghi/cập nhật resume packet, chạy `/compact` nếu tiếp tục cùng session, hoặc mở session mới từ link artifact. |
```

- [ ] **Step 4: Link `CONTEXT_BUDGET.md` in related-docs tables**

Add English row after `HANDOFF_TEMPLATES.md`:

```markdown
| [CONTEXT_BUDGET.md](./CONTEXT_BUDGET.md) | Context pressure rules, compact/session restart prompts, resume packet format, and API 400 recovery |
```

Add Vietnamese row after `HANDOFF_TEMPLATES.md`:

```markdown
| [CONTEXT_BUDGET.md](./CONTEXT_BUDGET.md) | Quy tắc context pressure, prompt compact/restart session, format resume packet và khôi phục API 400 |
```

- [ ] **Step 5: Run link test**

Run:

```powershell
npm test -- test/links.test.cjs
```

Expected: all link and EN/VI file-set parity tests pass.

---

### Task 4: Update Team Roster context rules

**Files:**
- Modify: `templates/docs/en/TEAM_ROSTER.md`
- Modify: `templates/docs/vi/TEAM_ROSTER.md`

- [ ] **Step 1: Add English Main Agent context-budget sentence**

After the sentence ending `final claims.`, add:

```markdown
It also owns context budgeting: keep raw context out of chat, prefer artifact links, and follow [CONTEXT_BUDGET.md](./CONTEXT_BUDGET.md) whenever context pressure rises.
```

- [ ] **Step 2: Add Vietnamese Main Agent context-budget sentence**

After the sentence ending `mọi claim cuối cùng.`, add:

```markdown
Main Agent cũng chịu trách nhiệm context budgeting: không đưa raw context dài vào chat, ưu tiên link artifact, và tuân [CONTEXT_BUDGET.md](./CONTEXT_BUDGET.md) khi context pressure tăng.
```

- [ ] **Step 3: Add English read-broad/report-narrow bullets**

Under `### When NOT to use a sub-agent`, after the existing bullets, add:

```markdown
### Context budget for sub-agents
- Sub-agents may read broadly, but must report narrowly.
- Return conclusions, evidence, risks, decisions, next actions, and file/path citations — not transcripts, full file contents, full diffs, or full logs.
- If a sub-agent output is long, the Main Agent should summarize it into a report artifact before continuing.
```

- [ ] **Step 4: Add Vietnamese read-broad/report-narrow bullets**

Under `### Khi nào KHÔNG nên dùng sub-agent`, after the existing bullets, add:

```markdown
### Context budget cho sub-agent
- Sub-agent có thể đọc rộng, nhưng phải báo cáo hẹp.
- Trả về kết luận, bằng chứng, rủi ro, quyết định, bước tiếp theo, và trích dẫn file/path — không trả transcript, toàn bộ nội dung file, toàn bộ diff, hoặc toàn bộ log.
- Nếu output của sub-agent dài, Main Agent nên tóm tắt nó vào report artifact trước khi tiếp tục.
```

- [ ] **Step 5: Run link test**

Run:

```powershell
npm test -- test/links.test.cjs
```

Expected: all link tests pass.

---

### Task 5: Update Handoff Templates bounded output contract

**Files:**
- Modify: `templates/docs/en/HANDOFF_TEMPLATES.md`
- Modify: `templates/docs/vi/HANDOFF_TEMPLATES.md`

- [ ] **Step 1: Add English `Context budget:` field to base contract**

In the base contract block, add `Context budget:` between `Output format:` and `Done criteria:`.

After `Keep prompts short. Include only the context needed for the assigned scope.`, add:

```markdown
Default context budget: do not return full transcripts, full diffs, full logs, or full file contents unless explicitly requested. If evidence is long, summarize it and cite the source path or command.
```

- [ ] **Step 2: Add Vietnamese `Context budget:` field to base contract**

In the Vietnamese base contract block, add `Context budget:` between `Định dạng đầu ra:` and `Tiêu chí Done:`.

After `Giữ prompt ngắn. Chỉ đưa context cần thiết cho phạm vi được giao.`, add:

```markdown
Context budget mặc định: không trả transcript đầy đủ, toàn bộ diff, toàn bộ log, hoặc toàn bộ nội dung file trừ khi được yêu cầu rõ. Nếu bằng chứng dài, hãy tóm tắt và trích dẫn source path hoặc command.
```

- [ ] **Step 3: Add English bounded-output lines to reviewer/QA/handover templates**

Add these lines inside the relevant code blocks:

Spec Compliance Reviewer, after `Output format:` line:

```text
Context budget: Return only the verdict, high-signal gaps, evidence summary, and citations. Do not paste the full implementation or full spec.
```

Code Quality Reviewer, after `Output format:` line:

```text
Context budget: Keep findings bounded and cite files. Do not paste full diffs, logs, or unrelated commentary.
```

QA / Security Reviewer, after `Output format:` line:

```text
Context budget: Summarize long test/security evidence and cite commands or files. Do not paste full logs unless explicitly requested.
```

Handover / Retro Prompt, after `Output format:` line:

```text
Context budget: Summarize evidence and link artifacts. Do not duplicate full reports, diffs, or transcripts.
```

- [ ] **Step 4: Add Vietnamese bounded-output lines to reviewer/QA/handover templates**

Add Vietnamese equivalents inside the matching code blocks:

```text
Context budget: Chỉ trả verdict, gap có tín hiệu cao, summary bằng chứng và citation. Không paste toàn bộ implementation hoặc toàn bộ spec.
```

```text
Context budget: Giữ finding có biên rõ và trích dẫn file. Không paste toàn bộ diff, log hoặc bình luận không liên quan.
```

```text
Context budget: Tóm tắt bằng chứng test/security dài và trích dẫn command hoặc file. Không paste toàn bộ log trừ khi được yêu cầu rõ.
```

```text
Context budget: Tóm tắt bằng chứng và link artifact. Không duplicate toàn bộ report, diff hoặc transcript.
```

- [ ] **Step 5: Run link test**

Run:

```powershell
npm test -- test/links.test.cjs
```

Expected: all link tests pass.

---

### Task 6: Update Artifact storage with resume packets

**Files:**
- Modify: `templates/docs/en/ARTIFACTS_AND_STORAGE.md`
- Modify: `templates/docs/vi/ARTIFACTS_AND_STORAGE.md`

- [ ] **Step 1: Add English storage role row**

After the `Retro / handover` row, add:

```markdown
| Resume packet | `docs/reports/YYYY-MM-DD-<slug>/resume.md` | Compact/session restart state | Create or update before phase handoff, major review, final verification, or context-pressure recovery. |
```

- [ ] **Step 2: Add Vietnamese storage role row**

After the Vietnamese `Retro / handover` row, add:

```markdown
| Resume packet | `docs/reports/YYYY-MM-DD-<slug>/resume.md` | State để compact/restart session | Tạo hoặc cập nhật trước phase handoff, review lớn, final verification, hoặc khi khôi phục context pressure. |
```

- [ ] **Step 3: Add `resume.md` to report directory layout in both files**

In English layout under `reports/YYYY-MM-DD-feature-name/`, add:

```text
      resume.md
```

before `impact.md`.

In Vietnamese layout under the same report directory, add the same line before `impact.md`.

- [ ] **Step 4: Update path artifact guidance in both files**

English:
- Replace the Standard row with:

```markdown
| Standard | `ACTIVE_STATE.md`, `plans/*.md`, `reports/.../impact.md`, and `reports/.../qa.md`. Add `reports/.../resume.md` for long-running work, phase handoff, or context pressure. Add security/performance reports when the touched surface requires them. |
```

- Replace the Full row with:

```markdown
| Full | `ACTIVE_STATE.md`, `specs/*.md`, `plans/*.md`, `reports/.../resume.md`, `impact.md`, `security.md`, `performance.md`, `qa.md`, and `retro.md`. |
```

Vietnamese:
- Replace the Standard row with:

```markdown
| Standard | `ACTIVE_STATE.md`, `plans/*.md`, `reports/.../impact.md`, và `reports/.../qa.md`. Thêm `reports/.../resume.md` cho việc kéo dài, phase handoff, hoặc context pressure. Thêm security/performance report nếu bề mặt chạm tới yêu cầu. |
```

- Replace the Full row with:

```markdown
| Full | `ACTIVE_STATE.md`, `specs/*.md`, `plans/*.md`, `reports/.../resume.md`, `impact.md`, `security.md`, `performance.md`, `qa.md`, và `retro.md`. |
```

- [ ] **Step 5: Add concise resume packet rule in both files**

English: after `Reports should record evidence and decisions, not duplicate long code excerpts.`, add:

```markdown
- Resume packets should record concise restart state, not duplicate specs, plans, diffs, logs, or transcripts. See [CONTEXT_BUDGET.md](./CONTEXT_BUDGET.md).
```

Vietnamese: after `Report ghi evidence và quyết định, không copy đoạn code dài.`, add:

```markdown
- Resume packet ghi state restart ngắn gọn, không duplicate specs, plans, diff, log, hoặc transcript. Xem [CONTEXT_BUDGET.md](./CONTEXT_BUDGET.md).
```

- [ ] **Step 6: Run link test**

Run:

```powershell
npm test -- test/links.test.cjs
```

Expected: all link and parity tests pass.

---

### Task 7: Final verification and scope review

**Files:**
- Verify all created and modified template docs.

- [ ] **Step 1: Run placeholder scan**

Run:

```powershell
Select-String -Path "templates/docs/en/CONTEXT_BUDGET.md","templates/docs/vi/CONTEXT_BUDGET.md","templates/docs/en/HANDOFF_TEMPLATES.md","templates/docs/vi/HANDOFF_TEMPLATES.md" -Pattern "TBD|TODO|implement later"
```

Expected: no output.

- [ ] **Step 2: Run full test suite**

Run:

```powershell
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Run GitNexus change detection**

Run GitNexus MCP `detect_changes` with scope `all` and repo `hero-vibe-kit`.

Expected: documentation/template-scoped changes, low risk, and no unexpected affected execution flows.

- [ ] **Step 4: Inspect scoped diff**

Run:

```powershell
git diff -- templates/docs/en/CONTEXT_BUDGET.md templates/docs/vi/CONTEXT_BUDGET.md templates/docs/en/AGENCY_WORKFLOW.md templates/docs/vi/AGENCY_WORKFLOW.md templates/docs/en/TEAM_ROSTER.md templates/docs/vi/TEAM_ROSTER.md templates/docs/en/HANDOFF_TEMPLATES.md templates/docs/vi/HANDOFF_TEMPLATES.md templates/docs/en/ARTIFACTS_AND_STORAGE.md templates/docs/vi/ARTIFACTS_AND_STORAGE.md docs/superpowers/specs/2026-06-06-context-budget-protocol-design.md docs/superpowers/plans/2026-06-06-context-budget-protocol.md
```

Expected: diff only contains context-budget docs/spec/plan changes and prior approved self-prompting docs changes in the same template files.

- [ ] **Step 5: Do not commit unless requested**

The repo already contains pre-existing uncommitted changes. If a commit is requested later, stage only the files related to approved workflow/context-budget work and avoid unrelated pre-existing changes.

---

## Self-review

- Spec coverage: Tasks cover the new bilingual `CONTEXT_BUDGET.md`, workflow protocol, next-prompt row, roster context rules, handoff bounded-output contract, resume packet storage, tests, and GitNexus change detection.
- Placeholder scan: The plan avoids unmanaged `TBD`, `TODO`, and `implement later` text. The scan patterns mention those strings only as verification commands.
- Scope check: The plan is documentation/template-only and does not add runtime dependencies, hooks, settings changes, CLI commands, or MCP servers.
- Bilingual parity: Every English template change has a matching Vietnamese task.
