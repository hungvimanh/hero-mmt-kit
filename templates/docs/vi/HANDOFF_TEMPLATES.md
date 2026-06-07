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
Model tier:
Effort:
Phạm vi execution:
Command/tool được phép:
Chính sách raw output:
Ràng buộc:
Định dạng đầu ra:
Context budget:
Tiêu chí Done:
```

Giữ prompt ngắn. Chỉ đưa context cần thiết cho phạm vi được giao. Set `Model tier` và `Effort` theo [TEAM_ROSTER.md](./TEAM_ROSTER.md); không hardcode model ID trong prompt một lần.

Context budget mặc định: ít chữ nhất, nhiều tín hiệu nhất, kết quả trước. Không trả transcript đầy đủ, toàn bộ diff, toàn bộ log, hoặc toàn bộ nội dung file trừ khi được yêu cầu rõ. Nếu bằng chứng dài, hãy tóm tắt và trích dẫn source path hoặc command.

Bounded report mặc định:

```text
Status:
Summary:
Files touched/read:
Commands/tools run:
Result:
Evidence:
Risks/blockers:
Next action:
Artifact/log paths:
```

## 1.1 Template artifact cho phase boundary

Dùng các template vận hành này khi một phase trong workflow bàn giao sang phase kế tiếp. Artifact handoff canonical nằm dưới `docs/reports/YYYY-MM-DD-<slug>/handoffs/`. Giữ `resume.md` thật ngắn: file này chỉ nên trỏ tới report phase hiện tại, file handoff đang active, gate decision mới nhất và next action, thay vì lặp lại toàn bộ report.

Base handoff artifact:

```text
# <Phase> handoff

Work item:
Mode: tiny | small | standard | full
From phase:
To phase:
Status: green | yellow | red
Approval: draft | approved | auto-approved | blocked
Approved by:
Approval evidence:
Approval note:
Branch:
Base commit:
Working tree state:
Evidence captured against:
Last updated:

## Source of truth
- Latest user instruction:
- Latest approved handoff/amendment:
- Referenced artifacts:
- Evidence paths:

## Read first
- Files or sections the next agent must read:
- Commands or logs to trust:
- Constraints that changed during the phase:

## Do not read
- Large transcripts, raw logs, or exploratory files that are superseded:
- Outdated assumptions or discarded options:

## Next action
- First action for the next phase:
- Gate or approval needed:
- Expected output artifact:
```

### BA / Discovery → Design / Architecture

```text
Vai trò: Lăng kính Design / Architecture.
Mục tiêu: Chuyển discovery đã duyệt thành hướng kỹ thuật mà không mở lại tranh luận về scope.
Input: Discovery report, PRD/scope đã duyệt, quyết định của User, ràng buộc đã biết và câu hỏi còn mở.
Source of truth: docs/reports/YYYY-MM-DD-<slug>/discovery.md và docs/reports/YYYY-MM-DD-<slug>/handoffs/01-ba-to-design.md.
Read first: Goal đã duyệt, non-goal, actor, acceptance criteria, constraint và quyết định chưa chốt.
Do not read: Raw interview note hoặc exploratory log trừ khi được trích dẫn là source of truth.
Next action: Tạo các option kiến trúc, approach được khuyến nghị, rủi ro, target impact-analysis và gate phê duyệt.
Output: Tóm tắt kiến trúc, vùng bị ảnh hưởng, interface contract, strategy verify, rủi ro và quyết định còn mở.
```

### Design / Architecture → Code

```text
Vai trò: Developer implementer.
Mục tiêu: Chỉ implement task hoặc task slice trong technical plan đã duyệt.
Input: Architecture plan đã duyệt, task breakdown, interface contract, file mục tiêu, test cần chạy và ràng buộc.
Source of truth: docs/reports/YYYY-MM-DD-<slug>/architecture.md và docs/reports/YYYY-MM-DD-<slug>/handoffs/02-design-to-code.md.
Read first: Biên task, impact analysis bắt buộc, data/API contract, ghi chú migration và Definition of Done.
Do not read: Design alternative đã bị thay thế hoặc lịch sử repo rộng, trừ khi plan trích dẫn.
Next action: Xác nhận scope task, chạy pre-edit analysis bắt buộc, implement slice nhỏ an toàn nhất và ghi lại file/test đã đổi.
Output: Status, files changed, tests run, evidence, concerns và review target tiếp theo.
```

### Code → Test

```text
Vai trò: Test-focused reviewer.
Mục tiêu: Validate implementation theo scope đã duyệt và tìm automated/manual coverage còn thiếu.
Input: Tóm tắt implementation, file đã đổi, plan đã duyệt, command test đã chạy và rủi ro đã biết.
Source of truth: docs/reports/YYYY-MM-DD-<slug>/implementation.md và docs/reports/YYYY-MM-DD-<slug>/handoffs/03-code-to-test.md.
Read first: Diff summary, acceptance criteria, edge case, bằng chứng test hiện có và vùng chưa test.
Do not read: Full diff hoặc raw log trừ khi cần inspect failure đã được trích dẫn.
Next action: Chạy hoặc đề xuất test có mục tiêu, map coverage với acceptance criteria và liệt kê gap.
Output: Test verdict, commands run, pass/fail evidence, missing coverage và fix bắt buộc.
```

### Test → Verify / QA

```text
Vai trò: Lăng kính Verify / QA.
Mục tiêu: Thử thách thay đổi đã test bằng DoD theo path, regression, security và check user outcome.
Input: Test report, tóm tắt implementation, scope đã duyệt, file đã đổi, rủi ro đã biết và hướng dẫn verify.
Source of truth: docs/reports/YYYY-MM-DD-<slug>/test.md và docs/reports/YYYY-MM-DD-<slug>/handoffs/04-test-to-qa.md.
Read first: Test verdict, failure hoặc skipped test, bước manual verification, risk list và DoD checklist.
Do not read: Raw log đã pass trừ khi summary evidence bị nghi ngờ.
Next action: Verify outcome hướng User hoặc artifact đã document, probe vùng rủi ro và quyết định pass/fix/block.
Output: QA verdict, checks performed, evidence, suspected risks, required fixes và handover readiness.
```

### Verify / QA → Handover

```text
Vai trò: Lăng kính Handover / Scrum Master.
Mục tiêu: Đóng work bằng evidence chính xác, residual risk và hướng dẫn cho owner kế tiếp.
Input: QA verdict, verification evidence, artifact đã đổi, decision log và rủi ro chưa giải quyết.
Source of truth: docs/reports/YYYY-MM-DD-<slug>/qa.md và docs/reports/YYYY-MM-DD-<slug>/handoffs/05-qa-to-handover.md.
Read first: Final verdict, remaining risks, accepted deviation, command đã chạy và artifact path.
Do not read: Intermediate scratch note đã bị final QA report thay thế.
Next action: Chuẩn bị final bounded report, cập nhật pointer trong resume.md nếu cần và nêu follow-up work.
Output: Đã đổi gì, evidence, file/artifact, risk, kết quả user-facing và next action.
```

### Prompt QA sub-agent

```text
Vai trò: QA sub-agent.
Mục tiêu: Verify độc lập output của phase và cố tìm failure tín hiệu cao trước handover.
Input: File handoff đang active, canonical report path, file đã đổi, command cần chạy và rủi ro đã biết.
Context bắt buộc: DEFINITION_OF_DONE.md, yêu cầu QA trong AGENCY_WORKFLOW.md và standards document liên quan.
Ràng buộc: Không rubber-stamp. Không mở rộng scope. Tóm tắt log dài và trích dẫn command/file. Nếu thiếu evidence, nói rõ.
Định dạng đầu ra: Status, checks performed, evidence, failures or gaps, risk assessment và recommendation: PASS, PASS_WITH_CONCERNS, FIX_REQUIRED hoặc BLOCKED.
Tiêu chí Done: Main Agent có thể fix issue cụ thể hoặc handover với evidence có thể bảo vệ.
```

### Prompt ngắn cho phase tiếp theo

```text
Continue from: docs/reports/YYYY-MM-DD-<slug>/handoffs/<phase-to-phase>.md
Read first: resume.md, active handoff và canonical report path được liệt kê trong đó.
Do not read: Raw transcript hoặc scratch file đã bị thay thế trừ khi handoff yêu cầu rõ.
Next action: Hoàn thành first action trong handoff, tạo expected artifact và trả bounded report.
```

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
Context budget: Chỉ trả verdict, gap có tín hiệu cao, summary bằng chứng và citation. Không paste toàn bộ implementation hoặc toàn bộ spec.
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
Context budget: Giữ finding có biên rõ và trích dẫn file. Không paste toàn bộ diff, log hoặc bình luận không liên quan.
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
Context budget: Tóm tắt bằng chứng test/security dài và trích dẫn command hoặc file. Không paste toàn bộ log trừ khi được yêu cầu rõ.
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
Context budget: Tóm tắt bằng chứng và link artifact. Không duplicate toàn bộ report, diff hoặc transcript.
Tiêu chí Done: Main Agent có thể báo cáo completion chính xác và biết có cần finishing-a-development-branch hoặc bước closeout nào khác không.
```
