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
Context budget:
Tiêu chí Done:
```

Giữ prompt ngắn. Chỉ đưa context cần thiết cho phạm vi được giao.

Context budget mặc định: ít chữ nhất, nhiều tín hiệu nhất, kết quả trước. Không trả transcript đầy đủ, toàn bộ diff, toàn bộ log, hoặc toàn bộ nội dung file trừ khi được yêu cầu rõ. Nếu bằng chứng dài, hãy tóm tắt và trích dẫn source path hoặc command.

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
