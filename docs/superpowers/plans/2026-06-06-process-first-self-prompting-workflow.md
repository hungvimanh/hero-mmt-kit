# Process-first Self-Prompting Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add process-first self-prompting workflow guidance to hero-vibe-kit templates so Claude can classify work, generate the next prompt or handoff, delegate only when useful, verify, and update state without the user prompting every role manually.

**Architecture:** This is a documentation/template-only change. `AGENCY_WORKFLOW.md` remains the canonical router, `TEAM_ROSTER.md` becomes the conditional role library, and new `HANDOFF_TEMPLATES.md` files hold compact reusable prompt skeletons. English and Vietnamese templates must stay structurally equivalent.

**Tech Stack:** Markdown templates, Node.js built-in `node --test`, existing hero-vibe-kit template/link tests. No runtime dependency changes.

---

## File structure

- Modify: `templates/docs/en/AGENCY_WORKFLOW.md`
  - Add Self-Prompting Loop and Router guidance after the task classification table.
  - Add delegate-or-direct rules in each path section.
  - Add the next-prompt decision table.
  - Link `HANDOFF_TEMPLATES.md` in related documents.

- Modify: `templates/docs/vi/AGENCY_WORKFLOW.md`
  - Mirror the English workflow changes in Vietnamese.
  - Keep headings and table structure aligned with the English file.

- Modify: `templates/docs/en/TEAM_ROSTER.md`
  - Expand from a short persona list into a conditional role library.
  - Link to `HANDOFF_TEMPLATES.md` for reusable handoff skeletons.
  - Keep existing path-triggered delegation behavior.

- Modify: `templates/docs/vi/TEAM_ROSTER.md`
  - Mirror the English role-library changes in Vietnamese.
  - Use Vietnamese role labels followed by stable English role names where helpful.

- Create: `templates/docs/en/HANDOFF_TEMPLATES.md`
  - Define prompt-contract structure and eight reusable handoff templates.

- Create: `templates/docs/vi/HANDOFF_TEMPLATES.md`
  - Vietnamese equivalent of the English handoff template document.

- Test: `test/links.test.cjs`
  - Existing bilingual doc-link integrity test should catch broken template links.

- Test: `test/init-smoke.test.cjs`
  - Existing init smoke should catch missing template packaging/copy behavior.

- Test: `test/integrations.test.cjs`
  - Existing integration smoke should catch update/install regressions.

---

### Task 1: Add English handoff template document

**Files:**
- Create: `templates/docs/en/HANDOFF_TEMPLATES.md`

- [ ] **Step 1: Create the English handoff template file**

Write this file exactly at `templates/docs/en/HANDOFF_TEMPLATES.md`:

```markdown
# Handoff Templates — Prompt Contracts

Use these templates when the workflow path requires the Main Agent to hand work to a sub-agent or to generate a focused internal prompt. These are prompt contracts, not full process definitions. Routing, gates, and path selection live in [AGENCY_WORKFLOW.md](./AGENCY_WORKFLOW.md); role behavior lives in [TEAM_ROSTER.md](./TEAM_ROSTER.md).

A handoff prompt must be self-contained because sub-agents do not inherit the Main Agent's conversation, skills, or local context.

## 1. Base contract

Every handoff should include:

```text
Role:
Goal:
Inputs:
Required context:
Constraints:
Output format:
Done criteria:
```

Keep prompts short. Include only the context needed for the assigned scope.

## 2. BA Discovery Prompt

```text
Role: Business Analyst (BA) lens.
Goal: Turn the user's idea into a clear PRD/scope proposal with user goals, core flows, acceptance criteria, assumptions, and blocking questions.
Inputs: User request, relevant business context, existing specs if any, and links to docs that constrain the feature.
Required context: AGENCY_WORKFLOW.md Full path Phase 1, COMMUNICATION_PROTOCOL.md, ARTIFACTS_AND_STORAGE.md, and PRD_AI_FEATURE.md when the work is an AI/assistant feature.
Constraints: Do not design implementation details, choose technologies, or write code. Ask one blocking question at a time when the scope is unclear.
Output format: Summary, proposed scope, user personas or actors, main flows, acceptance criteria, assumptions, risks, blocking questions, and recommended next gate.
Done criteria: The Main Agent can present a PRD/scope artifact for user approval or knows exactly which blocking question to ask next.
```

## 3. Architect Planning Prompt

```text
Role: System Architect lens.
Goal: Convert approved scope into a technical plan with architecture notes, impact analysis, interface contracts, risks, and implementation tasks.
Inputs: Approved PRD/scope, relevant files or modules, impact-analysis results, constraints, and existing plans if any.
Required context: AGENCY_WORKFLOW.md Standard or Full path, TEAM_ROSTER.md, SECURITY_STANDARDS.md, PERFORMANCE_STANDARDS.md, ARTIFACTS_AND_STORAGE.md, and any brownfield discovery report.
Constraints: Do not edit code before the required gate. Do not broaden scope beyond the approved PRD. Warn on HIGH or CRITICAL impact before proceeding.
Output format: Architecture summary, affected areas, interface/API contract, security/performance considerations, task breakdown, verification plan, risks, and open decisions.
Done criteria: The Main Agent can present a technical plan for user approval and can split implementation into bounded tasks.
```

## 4. Implementer Prompt

```text
Role: Developer implementer.
Goal: Complete one bounded implementation task exactly as specified.
Inputs: Approved plan task, relevant files, interface contract, tests to run, and constraints.
Required context: The specific task text, AGENCY_WORKFLOW.md path requirements, test-driven-development when required, and relevant snippets or file paths.
Constraints: Do not modify unrelated files. Do not add features, abstractions, fallbacks, or refactors outside the assigned task. Ask for context if the task is ambiguous.
Output format: Status (DONE, DONE_WITH_CONCERNS, NEEDS_CONTEXT, or BLOCKED), files changed, tests run, evidence, concerns, and next recommended review.
Done criteria: The assigned task is implemented, path-required tests are run, and the Main Agent has enough evidence to start review.
```

## 5. Spec Compliance Reviewer Prompt

```text
Role: Spec compliance reviewer.
Goal: Check whether the implementation matches the approved PRD, plan, and task boundaries.
Inputs: Approved spec/plan, implementation summary, changed files, and test evidence.
Required context: The exact requirements being reviewed and any decision log entries that changed scope.
Constraints: Focus on missing requirements, extra behavior, contradictions, and ambiguous interpretations. Do not perform general style review unless it affects spec compliance.
Output format: Verdict, compliant items, missing items, extra behavior, ambiguities, required fixes, and file/path citations.
Done criteria: The Main Agent knows whether to proceed to code quality review or send a focused fix prompt.
```

## 6. Code Quality Reviewer Prompt

```text
Role: Code quality reviewer.
Goal: Review changed code or docs for correctness, simplicity, reuse, maintainability, and efficiency.
Inputs: Changed files, implementation summary, and relevant constraints.
Required context: Project house rules, path-specific DoD, and any files needed to understand the changed surface.
Constraints: Prefer high-signal findings. Avoid style-only churn. Do not request broad refactors unrelated to the task.
Output format: Verdict, strengths, findings grouped by severity, suggested fixes, and file/path citations.
Done criteria: The Main Agent knows whether the work is ready for final verification or needs targeted fixes.
```

## 7. QA / Security Reviewer Prompt

```text
Role: QA / Security reviewer.
Goal: Try to break the change and verify the path-specific Definition of Done, including security-sensitive behavior when applicable.
Inputs: Approved scope, implementation summary, changed files, test commands, verification evidence, and known risks.
Required context: DEFINITION_OF_DONE.md, SECURITY_STANDARDS.md, PERFORMANCE_STANDARDS.md when relevant, and AGENCY_WORKFLOW.md QA requirements.
Constraints: Do not rubber-stamp. Look for regressions, unsafe assumptions, missing validation at boundaries, permission/auth issues, AI guardrail gaps, and unverified claims.
Output format: Verdict, tests or checks reviewed, confirmed risks, suspected risks, missing evidence, required fixes, and file/path citations.
Done criteria: The Main Agent can either fix concrete issues or safely proceed to handover with evidence.
```

## 8. Brownfield Discovery Prompt

```text
Role: Brownfield discovery analyst.
Goal: Map existing project behavior before risky changes and separate evidence from assumptions.
Inputs: User request, BROWNFIELD_DISCOVERY.md if present, existing docs, likely code areas, tests, and known risky areas.
Required context: AGENCY_WORKFLOW.md brownfield rules, ARTIFACTS_AND_STORAGE.md, and COMMUNICATION_PROTOCOL.md.
Constraints: Do not infer business purpose without evidence. Do not change code. Mark uncertain areas as needing human confirmation.
Output format: Evidence-backed findings, likely areas, tests/commands found, risky flows, assumptions, confirmation questions, and recommended path escalation.
Done criteria: The Main Agent knows whether the work can proceed, must escalate to Standard, or needs user confirmation first.
```

## 9. Handover / Retro Prompt

```text
Role: Handover and Scrum Master lens.
Goal: Close the work with evidence, state updates, remaining risks, and a lightweight retro.
Inputs: Completed implementation summary, review results, verification evidence, changed artifacts, and unresolved risks.
Required context: ARTIFACTS_AND_STORAGE.md, DEFINITION_OF_DONE.md, BRANCHING.md, and the active workflow path.
Constraints: Do not claim completion without verification evidence. Do not hide unresolved risks. Do not update canonical docs unless the change introduced durable process or architecture decisions.
Output format: What changed, verification evidence, artifacts updated, unresolved risks, handover notes, and three-line retro.
Done criteria: The Main Agent can report completion accurately and knows whether finishing-a-development-branch or another closeout step is needed.
```
```

- [ ] **Step 2: Check no unmanaged placeholder text was introduced**

Run:

```powershell
Select-String -Path "templates/docs/en/HANDOFF_TEMPLATES.md" -Pattern "TBD|TODO|fill in|implement later"
```

Expected: no output.

---

### Task 2: Add Vietnamese handoff template document

**Files:**
- Create: `templates/docs/vi/HANDOFF_TEMPLATES.md`

- [ ] **Step 1: Create the Vietnamese handoff template file**

Write this file exactly at `templates/docs/vi/HANDOFF_TEMPLATES.md`:

```markdown
# Handoff Templates — Hợp đồng prompt

Dùng các template này khi workflow path yêu cầu Main Agent bàn giao việc cho sub-agent hoặc tự tạo một prompt nội bộ có phạm vi rõ. Đây là hợp đồng prompt, không phải định nghĩa quy trình đầy đủ. Routing, gate và chọn path nằm trong [AGENCY_WORKFLOW.md](./AGENCY_WORKFLOW.md); hành vi theo vai trò nằm trong [TEAM_ROSTER.md](./TEAM_ROSTER.md).

Prompt bàn giao phải self-contained vì sub-agent không tự kế thừa hội thoại, skill hay context cục bộ của Main Agent.

## 1. Hợp đồng cơ sở

Mọi handoff nên có:

```text
Vai trò:
Mục tiêu:
Input:
Context bắt buộc:
Ràng buộc:
Định dạng đầu ra:
Tiêu chí Done:
```

Giữ prompt ngắn. Chỉ đưa context cần thiết cho phạm vi được giao.

## 2. Prompt khám phá BA

```text
Vai trò: Lăng kính Phân tích nghiệp vụ (BA).
Mục tiêu: Biến ý tưởng của User thành đề xuất PRD/scope rõ ràng gồm mục tiêu người dùng, luồng chính, tiêu chí chấp nhận, giả định và câu hỏi blocking.
Input: Yêu cầu của User, context nghiệp vụ liên quan, spec hiện có nếu có, và link tới tài liệu đang ràng buộc feature.
Context bắt buộc: AGENCY_WORKFLOW.md Full path Phase 1, COMMUNICATION_PROTOCOL.md, ARTIFACTS_AND_STORAGE.md, và PRD_AI_FEATURE.md khi đây là feature AI/assistant.
Ràng buộc: Không thiết kế chi tiết implementation, không chọn công nghệ, không viết code. Khi scope chưa rõ, hỏi từng câu blocking một.
Định dạng đầu ra: Tóm tắt, scope đề xuất, persona hoặc actor, luồng chính, acceptance criteria, giả định, rủi ro, câu hỏi blocking, và gate tiếp theo được khuyến nghị.
Tiêu chí Done: Main Agent có thể trình PRD/scope artifact để User duyệt hoặc biết chính xác câu hỏi blocking tiếp theo cần hỏi.
```

## 3. Prompt lập kế hoạch Architect

```text
Vai trò: Lăng kính Kiến trúc sư hệ thống (Architect).
Mục tiêu: Chuyển scope đã duyệt thành kế hoạch kỹ thuật gồm ghi chú kiến trúc, impact analysis, interface contract, rủi ro và task implementation.
Input: PRD/scope đã duyệt, file hoặc module liên quan, kết quả impact analysis, ràng buộc, và plan hiện có nếu có.
Context bắt buộc: AGENCY_WORKFLOW.md Standard hoặc Full path, TEAM_ROSTER.md, SECURITY_STANDARDS.md, PERFORMANCE_STANDARDS.md, ARTIFACTS_AND_STORAGE.md, và report brownfield discovery nếu có.
Ràng buộc: Không sửa code trước gate bắt buộc. Không mở rộng scope ngoài PRD đã duyệt. Cảnh báo nếu impact HIGH hoặc CRITICAL trước khi tiếp tục.
Định dạng đầu ra: Tóm tắt kiến trúc, vùng bị ảnh hưởng, API/interface contract, cân nhắc security/performance, breakdown task, kế hoạch verify, rủi ro và quyết định còn mở.
Tiêu chí Done: Main Agent có thể trình technical plan cho User duyệt và chia implementation thành các task có biên rõ.
```

## 4. Prompt Implementer

```text
Vai trò: Developer implementer.
Mục tiêu: Hoàn thành đúng một implementation task đã được giới hạn rõ.
Input: Task trong plan đã duyệt, file liên quan, interface contract, test cần chạy, và ràng buộc.
Context bắt buộc: Nội dung task cụ thể, yêu cầu path trong AGENCY_WORKFLOW.md, test-driven-development khi bắt buộc, và snippet hoặc file path liên quan.
Ràng buộc: Không sửa file không liên quan. Không thêm feature, abstraction, fallback hoặc refactor ngoài task được giao. Hỏi thêm context nếu task mơ hồ.
Định dạng đầu ra: Trạng thái (DONE, DONE_WITH_CONCERNS, NEEDS_CONTEXT, hoặc BLOCKED), file đã đổi, test đã chạy, bằng chứng, concern, và review tiếp theo được khuyến nghị.
Tiêu chí Done: Task được giao đã implement, test bắt buộc theo path đã chạy, và Main Agent có đủ bằng chứng để bắt đầu review.
```

## 5. Prompt reviewer kiểm spec

```text
Vai trò: Spec compliance reviewer.
Mục tiêu: Kiểm tra implementation có khớp PRD, plan và biên task đã duyệt hay không.
Input: Spec/plan đã duyệt, tóm tắt implementation, file đã đổi và bằng chứng test.
Context bắt buộc: Các requirement chính xác đang được review và decision log nếu scope từng thay đổi.
Ràng buộc: Tập trung vào requirement bị thiếu, hành vi thừa, mâu thuẫn và cách hiểu mơ hồ. Không review style chung trừ khi ảnh hưởng tới việc tuân spec.
Định dạng đầu ra: Verdict, mục đã tuân thủ, mục còn thiếu, hành vi thừa, điểm mơ hồ, fix bắt buộc, và trích dẫn file/path.
Tiêu chí Done: Main Agent biết nên chuyển sang code quality review hay gửi prompt fix có trọng tâm.
```

## 6. Prompt reviewer chất lượng code

```text
Vai trò: Code quality reviewer.
Mục tiêu: Review code hoặc docs đã đổi về correctness, simplicity, reuse, maintainability và efficiency.
Input: File đã đổi, tóm tắt implementation và ràng buộc liên quan.
Context bắt buộc: House rules của project, DoD theo path, và file cần thiết để hiểu bề mặt đã đổi.
Ràng buộc: Ưu tiên finding có tín hiệu cao. Tránh churn chỉ vì style. Không yêu cầu refactor rộng ngoài task.
Định dạng đầu ra: Verdict, điểm mạnh, finding theo mức độ nghiêm trọng, fix đề xuất, và trích dẫn file/path.
Tiêu chí Done: Main Agent biết work đã sẵn sàng cho final verification hay cần fix có mục tiêu.
```

## 7. Prompt QA / Security reviewer

```text
Vai trò: QA / Security reviewer.
Mục tiêu: Cố gắng phá thay đổi và verify Definition of Done theo path, gồm hành vi nhạy cảm về security khi có liên quan.
Input: Scope đã duyệt, tóm tắt implementation, file đã đổi, lệnh test, bằng chứng verify và rủi ro đã biết.
Context bắt buộc: DEFINITION_OF_DONE.md, SECURITY_STANDARDS.md, PERFORMANCE_STANDARDS.md khi liên quan, và yêu cầu QA trong AGENCY_WORKFLOW.md.
Ràng buộc: Không rubber-stamp. Tìm regression, giả định không an toàn, thiếu validation ở boundary, lỗi quyền/auth, lỗ hổng guardrail AI và claim chưa được verify.
Định dạng đầu ra: Verdict, test hoặc check đã xem, rủi ro đã xác nhận, rủi ro nghi ngờ, bằng chứng còn thiếu, fix bắt buộc, và trích dẫn file/path.
Tiêu chí Done: Main Agent có thể fix issue cụ thể hoặc an toàn chuyển sang handover với bằng chứng.
```

## 8. Prompt Brownfield Discovery

```text
Vai trò: Brownfield discovery analyst.
Mục tiêu: Map hành vi project hiện có trước các thay đổi rủi ro và tách bằng chứng khỏi giả định.
Input: Yêu cầu của User, BROWNFIELD_DISCOVERY.md nếu có, docs hiện có, vùng code khả nghi, tests và vùng rủi ro đã biết.
Context bắt buộc: Quy tắc brownfield trong AGENCY_WORKFLOW.md, ARTIFACTS_AND_STORAGE.md và COMMUNICATION_PROTOCOL.md.
Ràng buộc: Không suy diễn mục đích nghiệp vụ nếu thiếu bằng chứng. Không sửa code. Gắn nhãn vùng chưa chắc là cần User xác nhận.
Định dạng đầu ra: Finding dựa trên bằng chứng, vùng khả nghi, test/command tìm được, flow rủi ro, giả định, câu hỏi xác nhận và khuyến nghị nâng path.
Tiêu chí Done: Main Agent biết work có thể tiếp tục, phải nâng lên Standard, hay cần User xác nhận trước.
```

## 9. Prompt Handover / Retro

```text
Vai trò: Lăng kính Handover và Scrum Master.
Mục tiêu: Đóng công việc bằng bằng chứng, cập nhật trạng thái, rủi ro còn lại và retro nhẹ.
Input: Tóm tắt implementation đã xong, kết quả review, bằng chứng verification, artifact đã đổi và rủi ro chưa giải quyết.
Context bắt buộc: ARTIFACTS_AND_STORAGE.md, DEFINITION_OF_DONE.md, BRANCHING.md và workflow path đang active.
Ràng buộc: Không claim hoàn tất nếu thiếu bằng chứng verify. Không che giấu rủi ro còn lại. Không cập nhật canonical docs trừ khi thay đổi tạo ra quyết định process hoặc architecture bền vững.
Định dạng đầu ra: Đã đổi gì, bằng chứng verification, artifact đã cập nhật, rủi ro chưa giải quyết, handover notes và retro ba dòng.
Tiêu chí Done: Main Agent có thể báo cáo completion chính xác và biết có cần finishing-a-development-branch hoặc bước closeout nào khác không.
```
```

- [ ] **Step 2: Check no unmanaged placeholder text was introduced**

Run:

```powershell
Select-String -Path "templates/docs/vi/HANDOFF_TEMPLATES.md" -Pattern "TBD|TODO|fill in|implement later"
```

Expected: no output.

---

### Task 3: Update English agency workflow router

**Files:**
- Modify: `templates/docs/en/AGENCY_WORKFLOW.md`

- [ ] **Step 1: Insert Self-Prompting Router after the task table**

In `templates/docs/en/AGENCY_WORKFLOW.md`, insert this section after row #9 of the router table and before `### Escalation rule`:

```markdown
### Self-Prompting Router

Treat the router as the controller for the next prompt, not just as reference material. For every user request, the Main Agent must:

1. classify the task using the table above,
2. select the workflow path,
3. identify required gates, verification steps, and Done criteria,
4. identify which lenses or sub-agents are required by the path,
5. generate the next internal prompt or handoff prompt from [HANDOFF_TEMPLATES.md](./HANDOFF_TEMPLATES.md) when a handoff is needed,
6. continue only when the current gate or Done criteria allow the workflow to advance.

Use this loop throughout the work:

```text
User intent
  → classify task
  → select workflow path
  → identify required lenses/agents
  → prepare context and prompt contract
  → act directly or delegate
  → verify output
  → update state/artifacts
  → choose the next prompt
```

Self-prompting does **not** mean spawning more agents by default. It means the framework decides the next valid prompt from task type, path state, and Done criteria.
```

- [ ] **Step 2: Add delegate-or-direct guidance to path definitions**

In `templates/docs/en/AGENCY_WORKFLOW.md`, update the four path sections as follows:

Add this line to `### Read-only` after the current paragraph:

```markdown
Delegate only for broad exploration that would exceed a few targeted searches; otherwise answer directly.
```

Add this line to `### Fast path` after the numbered list:

```markdown
Delegate implementation only when it saves meaningful context or time; review is optional unless the escalation rule fires.
```

Add this line to `### Standard path` after the numbered list:

```markdown
Implementation delegation is optional, but the review sub-agent is mandatory before completion. Use [HANDOFF_TEMPLATES.md](./HANDOFF_TEMPLATES.md) for reviewer prompts.
```

Add this line to `### Full path (5-phase) — new features only` after `See §3.`:

```markdown
Use BA and Architect lenses for the gates; delegate implementation only for independent tracks or context isolation; QA/review remains mandatory.
```

- [ ] **Step 3: Add next-prompt decision table before Related documents**

Insert this section before `## 4. Related documents`:

```markdown
## 4. Next-prompt decision table

After each step, choose the next prompt/action from workflow state:

| Current state | Next prompt/action |
|---|---|
| Request unclear | Ask one clarifying question using [COMMUNICATION_PROTOCOL.md](./COMMUNICATION_PROTOCOL.md). |
| Task classified as Q&A | Answer read-only with cited evidence. |
| Task classified as chore/docs/config | Use Fast path and verify relevant docs/build checks. |
| Localized bugfix | Trigger `systematic-debugging` and write a repro test before fixing. |
| Existing behavior change | Enter Standard path, run impact analysis, prepare the plan gate. |
| Refactor | Enter Standard path, run impact analysis, preserve behavior, avoid manual rename. |
| New feature idea | Generate the BA Discovery Prompt and produce the PRD/scope artifact. |
| PRD approved | Generate the Architect Planning Prompt and produce the technical plan. |
| Plan approved | Generate a bounded implementer prompt or act directly when delegation is not useful. |
| Implementation done | Generate spec compliance and code quality review prompts. |
| Sensitive surface touched | Generate the QA / Security Reviewer Prompt. |
| Review failed | Generate a focused fix prompt using reviewer findings. |
| Verification passed | Generate the Handover / Retro Prompt and update state/artifacts. |
| Unexpected risk discovered | Stop, report the risk, and request the required gate or user decision. |
```

Then rename the existing `## 4. Related documents` heading to:

```markdown
## 5. Related documents
```

- [ ] **Step 4: Link handoff templates in the related documents table**

Add this row to the related documents table:

```markdown
| [HANDOFF_TEMPLATES.md](./HANDOFF_TEMPLATES.md) | Reusable prompt contracts for BA, Architect, Implementer, reviewers, brownfield discovery, and handover |
```

- [ ] **Step 5: Run link-focused test after the English workflow edit**

Run:

```powershell
npm test -- test/links.test.cjs
```

Expected: the link test passes, or if the command runs the full `node --test` suite because of npm argument behavior, no failures are caused by the new English workflow links.

---

### Task 4: Update Vietnamese agency workflow router

**Files:**
- Modify: `templates/docs/vi/AGENCY_WORKFLOW.md`

- [ ] **Step 1: Insert Vietnamese Self-Prompting Router after the task table**

In `templates/docs/vi/AGENCY_WORKFLOW.md`, insert this section after row #9 of the router table and before `### Escalation rule`:

```markdown
### Self-Prompting Router

Xem router như bộ điều khiển prompt tiếp theo, không chỉ là bảng tham khảo. Với mọi yêu cầu của User, Main Agent phải:

1. phân loại task bằng bảng ở trên,
2. chọn workflow path,
3. xác định gate, bước verify và tiêu chí Done bắt buộc,
4. xác định lăng kính hoặc sub-agent nào được path yêu cầu,
5. tạo prompt nội bộ tiếp theo hoặc prompt handoff từ [HANDOFF_TEMPLATES.md](./HANDOFF_TEMPLATES.md) khi cần bàn giao,
6. chỉ tiếp tục khi gate hiện tại hoặc tiêu chí Done cho phép workflow đi tiếp.

Dùng vòng lặp này xuyên suốt công việc:

```text
User intent
  → classify task
  → select workflow path
  → identify required lenses/agents
  → prepare context and prompt contract
  → act directly or delegate
  → verify output
  → update state/artifacts
  → choose the next prompt
```

Self-prompting **không** có nghĩa là mặc định spawn thêm agent. Nó nghĩa là framework quyết định prompt hợp lệ tiếp theo dựa trên loại task, trạng thái path và tiêu chí Done.
```

- [ ] **Step 2: Add delegate-or-direct guidance to Vietnamese path definitions**

Add this line to `### Read-only` after the current paragraph:

```markdown
Chỉ delegate khi cần exploration rộng vượt quá vài lượt search có mục tiêu; còn lại trả lời trực tiếp.
```

Add this line to `### Fast path` after the numbered list:

```markdown
Chỉ delegate implementation khi tiết kiệm đáng kể context hoặc thời gian; review là tùy chọn trừ khi escalation rule được kích hoạt.
```

Add this line to `### Standard path` after the numbered list:

```markdown
Delegate implementation là tùy chọn, nhưng sub-agent review là bắt buộc trước khi hoàn tất. Dùng [HANDOFF_TEMPLATES.md](./HANDOFF_TEMPLATES.md) cho prompt reviewer.
```

Add this line to `### Full path (5-phase) — chỉ cho Feature mới` after `Xem §3.`:

```markdown
Dùng lăng kính BA và Architect cho các gate; chỉ delegate implementation cho các nhánh độc lập hoặc khi cần cô lập context; QA/review vẫn bắt buộc.
```

- [ ] **Step 3: Add Vietnamese next-prompt decision table before Related documents**

Insert this section before `## 4. Tài liệu liên quan`:

```markdown
## 4. Bảng quyết định prompt tiếp theo

Sau mỗi bước, chọn prompt/action tiếp theo dựa trên trạng thái workflow:

| Trạng thái hiện tại | Prompt/action tiếp theo |
|---|---|
| Yêu cầu chưa rõ | Hỏi một câu làm rõ theo [COMMUNICATION_PROTOCOL.md](./COMMUNICATION_PROTOCOL.md). |
| Task được phân loại là Q&A | Trả lời read-only với bằng chứng được trích dẫn. |
| Task là chore/docs/config | Dùng Fast path và verify các check docs/build liên quan. |
| Bugfix khu trú | Trigger `systematic-debugging` và viết repro test trước khi sửa. |
| Đổi hành vi tính năng đã có | Vào Standard path, chạy impact analysis, chuẩn bị plan gate. |
| Refactor | Vào Standard path, chạy impact analysis, giữ nguyên hành vi, tránh rename thủ công. |
| Ý tưởng feature mới | Tạo BA Discovery Prompt và tạo artifact PRD/scope. |
| PRD đã duyệt | Tạo Architect Planning Prompt và tạo technical plan. |
| Plan đã duyệt | Tạo prompt implementer có biên rõ hoặc tự làm trực tiếp khi delegate không hữu ích. |
| Implementation xong | Tạo prompt review spec compliance và code quality. |
| Chạm bề mặt nhạy cảm | Tạo QA / Security Reviewer Prompt. |
| Review fail | Tạo prompt fix có trọng tâm dựa trên finding của reviewer. |
| Verification pass | Tạo Handover / Retro Prompt và cập nhật state/artifact. |
| Phát hiện rủi ro bất ngờ | Dừng lại, báo rủi ro, và yêu cầu gate hoặc quyết định của User. |
```

Then rename the existing `## 4. Tài liệu liên quan` heading to:

```markdown
## 5. Tài liệu liên quan
```

- [ ] **Step 4: Link Vietnamese handoff templates in the related documents table**

Add this row to the related documents table:

```markdown
| [HANDOFF_TEMPLATES.md](./HANDOFF_TEMPLATES.md) | Hợp đồng prompt tái sử dụng cho BA, Architect, Implementer, reviewer, brownfield discovery và handover |
```

- [ ] **Step 5: Run link-focused test after the Vietnamese workflow edit**

Run:

```powershell
npm test -- test/links.test.cjs
```

Expected: the link test passes, or if the command runs the full `node --test` suite because of npm argument behavior, no failures are caused by the Vietnamese workflow links.

---

### Task 5: Update English team roster as conditional role library

**Files:**
- Modify: `templates/docs/en/TEAM_ROSTER.md`

- [ ] **Step 1: Replace the Main Agent section with conditional lens language**

Replace the body of `## 1. Main Agent (Lead)` with:

```markdown
Holds the session, talks to the user, and orchestrates sub-agents. The Main Agent is accountable for classification, gates, synthesis, user communication, and final claims.

It rotates lenses based on workflow state:
- **BA** — activates during discovery, PRD, assumptions, and acceptance criteria work.
- **System Architect** — activates during impact analysis, technical planning, interface contracts, and risk assessment.
- **Developer** — activates during implementation tasks.
- **QA** — activates before completion for Standard and Full paths, and optionally for Fast path work.
- **Security** — activates when touching authentication, permissions, user input, secrets, external integrations, deployment, AI behavior, or other sensitive surfaces.
- **Scrum Master** — manages [ACTIVE_STATE.md](./ACTIVE_STATE.md), artifact links, handoff, and retro.
- **Design/UX** — activates for UI flows, wireframes, and locked visual direction; see [DESIGN_STANDARDS.md](./DESIGN_STANDARDS.md).

Roles are lenses first. Spawn a sub-agent only when the path requires review/QA or when delegation genuinely improves focus, speed, or context isolation.
```

- [ ] **Step 2: Add handoff-template link to the prompt contract section**

Replace the first paragraph under `## 3. Sub-agent prompt contract` with:

```markdown
Sub-agents do NOT inherit the Main Agent's conversation, skills, or context. Use [HANDOFF_TEMPLATES.md](./HANDOFF_TEMPLATES.md) for reusable prompt skeletons. Every spawn prompt must still be SELF-CONTAINED and concise:
```

- [ ] **Step 3: Update the role table to include BA, Architect, and compliance reviewer**

Replace the role table under `## 3. Sub-agent prompt contract` with:

```markdown
| Role | Skills/Tools | Job |
|------|--------------|-----|
| **BA Discovery** | brainstorming, communication protocol | Clarify scope, assumptions, flows, and acceptance criteria before implementation planning |
| **Architect Planner** | gitnexus_exploring, gitnexus_impact, writing-plans | Explore architecture, assess impact, lock contracts, and produce the technical plan |
| **Frontend Dev** | locked design direction, test-driven-development | Implement UI per the TDD and design system |
| **Backend Dev** | test-driven-development | Logic / API / DB schema, safe & efficient |
| **Spec Compliance Reviewer** | approved PRD/TDD, plan artifacts | Check whether implementation matches approved requirements and task boundaries |
| **Code Reviewer** (`code-reviewer`) | code-review, simplify | Review diffs: correctness, security, cleanliness |
| **QA / Security** | security-review, systematic-debugging, verification-before-completion, verify | Break the code, find bugs, ensure execution flow and sensitive surfaces are intact |
```

- [ ] **Step 4: Run link-focused test after roster edit**

Run:

```powershell
npm test -- test/links.test.cjs
```

Expected: no broken link from `TEAM_ROSTER.md` to `HANDOFF_TEMPLATES.md`.

---

### Task 6: Update Vietnamese team roster as conditional role library

**Files:**
- Modify: `templates/docs/vi/TEAM_ROSTER.md`

- [ ] **Step 1: Replace the Vietnamese Main Agent section with conditional lens language**

Replace the body of `## 1. Main Agent (Lead)` with:

```markdown
Giữ session, nói chuyện với User, và điều phối sub-agent. Main Agent chịu trách nhiệm phân loại task, gate, tổng hợp, giao tiếp với User và mọi claim cuối cùng.

Main Agent luân phiên lăng kính theo trạng thái workflow:
- **BA** — kích hoạt khi discovery, PRD, giả định và acceptance criteria.
- **System Architect** — kích hoạt khi impact analysis, technical planning, interface contract và đánh giá rủi ro.
- **Developer** — kích hoạt khi có implementation task.
- **QA** — kích hoạt trước completion cho Standard và Full path, tùy chọn cho Fast path.
- **Security** — kích hoạt khi chạm authentication, permission, user input, secrets, external integration, deployment, hành vi AI, hoặc bề mặt nhạy cảm khác.
- **Scrum Master** — quản lý [ACTIVE_STATE.md](./ACTIVE_STATE.md), link artifact, handoff và retro.
- **Design/UX** — kích hoạt cho UI flow, wireframe và visual direction đã chốt; xem [DESIGN_STANDARDS.md](./DESIGN_STANDARDS.md).

Role trước hết là lăng kính. Chỉ spawn sub-agent khi path yêu cầu review/QA hoặc khi delegation thật sự cải thiện focus, tốc độ hoặc cô lập context.
```

- [ ] **Step 2: Add Vietnamese handoff-template link to the prompt contract section**

Replace the first paragraph under `## 3. Hợp đồng prompt cho sub-agent` with:

```markdown
Sub-agent KHÔNG tự kế thừa hội thoại, skill, hay context của Main Agent. Dùng [HANDOFF_TEMPLATES.md](./HANDOFF_TEMPLATES.md) cho các prompt skeleton tái sử dụng. Mọi prompt spawn vẫn phải SELF-CONTAINED và ngắn gọn:
```

- [ ] **Step 3: Update the Vietnamese role table**

Replace the role table under `## 3. Hợp đồng prompt cho sub-agent` with:

```markdown
| Vai | Skills/Tools | Nhiệm vụ |
|-----|--------------|----------|
| **BA Discovery** | brainstorming, communication protocol | Làm rõ scope, giả định, flow và acceptance criteria trước khi lập implementation plan |
| **Architect Planner** | gitnexus_exploring, gitnexus_impact, writing-plans | Khám phá kiến trúc, đánh giá impact, chốt contract và tạo technical plan |
| **Frontend Dev** | design direction đã chốt, test-driven-development | Implement UI theo TDD và design system |
| **Backend Dev** | test-driven-development | Logic / API / DB schema, an toàn & hiệu quả |
| **Spec Compliance Reviewer** | PRD/TDD đã duyệt, plan artifacts | Kiểm implementation có khớp requirement đã duyệt và biên task không |
| **Code Reviewer** (`code-reviewer`) | code-review, simplify | Review diff: correctness, security, cleanliness |
| **QA / Security** | security-review, systematic-debugging, verification-before-completion, verify | Phá code, tìm bug, đảm bảo execution flow và bề mặt nhạy cảm nguyên vẹn |
```

- [ ] **Step 4: Run link-focused test after Vietnamese roster edit**

Run:

```powershell
npm test -- test/links.test.cjs
```

Expected: no broken link from Vietnamese `TEAM_ROSTER.md` to `HANDOFF_TEMPLATES.md`.

---

### Task 7: Run full verification and inspect scope

**Files:**
- Verify: `templates/docs/en/AGENCY_WORKFLOW.md`
- Verify: `templates/docs/vi/AGENCY_WORKFLOW.md`
- Verify: `templates/docs/en/TEAM_ROSTER.md`
- Verify: `templates/docs/vi/TEAM_ROSTER.md`
- Verify: `templates/docs/en/HANDOFF_TEMPLATES.md`
- Verify: `templates/docs/vi/HANDOFF_TEMPLATES.md`

- [ ] **Step 1: Run full test suite**

Run:

```powershell
npm test
```

Expected: all Node test files pass.

- [ ] **Step 2: Check for placeholders in new handoff docs**

Run:

```powershell
Select-String -Path "templates/docs/en/HANDOFF_TEMPLATES.md","templates/docs/vi/HANDOFF_TEMPLATES.md" -Pattern "TBD|TODO|fill in|implement later"
```

Expected: no output.

- [ ] **Step 3: Check git diff scope**

Run:

```powershell
git diff -- templates/docs/en/AGENCY_WORKFLOW.md templates/docs/vi/AGENCY_WORKFLOW.md templates/docs/en/TEAM_ROSTER.md templates/docs/vi/TEAM_ROSTER.md templates/docs/en/HANDOFF_TEMPLATES.md templates/docs/vi/HANDOFF_TEMPLATES.md docs/superpowers/specs/2026-06-06-process-first-self-prompting-workflow-design.md docs/superpowers/plans/2026-06-06-process-first-self-prompting-workflow.md
```

Expected: diff only contains the approved self-prompting workflow docs/spec/plan changes.

- [ ] **Step 4: Run GitNexus change detection before any commit request**

Run the GitNexus MCP change detector with scope `all`.

Expected: changes are documentation/template scoped. If GitNexus reports unexpected affected execution flows, inspect before proceeding.

- [ ] **Step 5: Do not commit unless the user asks**

This repository already had pre-existing uncommitted files before this work. Do not create a commit unless the user explicitly asks for one. If a commit is requested, stage only the files for this feature and avoid unrelated pre-existing changes.

---

## Self-review

- Spec coverage: The plan covers router enhancement, handoff templates, role library behavior, delegate-or-direct rules, next-prompt table, bilingual parity, no runtime dependencies, and verification.
- Placeholder scan: The plan contains no `TBD`, `TODO`, `implement later`, or unspecified implementation steps. The string `fill in` appears only in the placeholder-scan command pattern, not as a plan placeholder.
- Type/name consistency: File names, headings, and linked document names are consistent across English and Vietnamese tasks.
- Scope check: The plan is documentation/template-only and does not add runtime dependencies, MCP servers, cloud automation, or mandatory new agent runtime behavior.
