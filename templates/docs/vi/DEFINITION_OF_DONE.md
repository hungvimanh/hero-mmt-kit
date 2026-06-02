# Definition of Done (DoD)

> Tiêu chí hoàn thành **đo được**. Một thay đổi chỉ được coi là "xong" khi thỏa DoD của path tương ứng. Path do [AGENCY_WORKFLOW.md §1](./AGENCY_WORKFLOW.md#1-bảng-phân-loại-task--workflow-router) quyết định.

## ⚙️ Placeholder cần điền khi chốt tech stack
Stack chưa chốt — điền các giá trị sau ở PRD/TDD đầu tiên rồi cập nhật file này:

| Biến | Giá trị | Ví dụ |
|------|---------|-------|
| `<TEST_CMD>` | lệnh chạy test | `npm test` / `pytest` |
| `<LINT_CMD>` | lệnh lint + format check | `npm run lint` / `ruff check .` |
| `<BUILD_CMD>` | lệnh build | `npm run build` / `—` |
| `<COVERAGE_MIN>` | ngưỡng coverage tối thiểu | `80%` |
| `<TYPECHECK_CMD>` | type check (nếu có) | `tsc --noEmit` / `mypy .` |

---

## Checklist theo path

### Read-only (Q&A / Explain)
- [ ] Trả lời đúng trọng tâm câu hỏi.
- [ ] Có trích dẫn `file:line` cho mọi khẳng định về code.
- [ ] Không tạo branch / không commit / không sửa file.

### Fast path (Chore / Docs / Config / Bugfix nhỏ / Hotfix)
- [ ] Đúng tiền tố branch ([BRANCHING.md](./BRANCHING.md)).
- [ ] `<TEST_CMD>` xanh · `<LINT_CMD>` xanh · `<BUILD_CMD>` xanh.
- [ ] **Bugfix/Hotfix:** có test tái hiện bug, đã chuyển từ ĐỎ → XANH; regression suite không hỏng.
- [ ] **Chore/Docs:** không thay đổi hành vi runtime.
- [ ] Commit theo Conventional Commits; MR mô tả ngắn gọn *what + why*.
- [ ] Đã chạy `gitnexus_detect_changes` (khi đã có code) — phạm vi đúng dự kiến.
- [ ] **Security (nhẹ):** không commit secret mới (xem [SECURITY_STANDARDS.md](./SECURITY_STANDARDS.md) §5). **Performance (nhẹ):** không gây hồi quy rõ rệt / không thêm N+1 ([PERFORMANCE_STANDARDS.md](./PERFORMANCE_STANDARDS.md) §4).

### Standard path (Sửa logic / Refactor)
Bao gồm toàn bộ Fast path, cộng thêm:
- [ ] Đã qua **Gate** (Plan Mode) và User đã duyệt cách tiếp cận.
- [ ] `gitnexus_impact` (upstream) đã chạy & **blast radius + mức rủi ro được báo cáo**; rủi ro HIGH/CRITICAL đã được User chấp thuận.
- [ ] `<TYPECHECK_CMD>` xanh (nếu áp dụng).
- [ ] **Refactor:** cùng bộ test pass trước & sau (hành vi không đổi); rename dùng `gitnexus_rename`, không find-replace tay.
- [ ] **Sửa logic:** regression test cũ còn xanh + có test mới cho hành vi mới.
- [ ] QA sub-agent đã review (`code-review`); `security-review` nếu chạm bề mặt nhạy cảm.
- [ ] **Security (Standard):** input validation cho code chạm + kiểm quyền nếu chạm authz ([SECURITY_STANDARDS.md](./SECURITY_STANDARDS.md) §5). **Performance (Standard):** bench trước/sau cho hot-path; (AI) prompt caching còn nguyên ([PERFORMANCE_STANDARDS.md](./PERFORMANCE_STANDARDS.md) §4).

### Full path (Feature mới)
Bao gồm toàn bộ Standard path, cộng thêm:
- [ ] **PRD** đã được duyệt (Gate 1) và có link trong ACTIVE_STATE.
- [ ] **TDD** đã được duyệt (Gate 2): có threat model nhẹ + API/interface contract.
- [ ] Coverage ≥ `<COVERAGE_MIN>` cho code mới.
- [ ] Đáp ứng toàn bộ acceptance criteria trong PRD.
- [ ] `security-review` đã chạy, không có finding mới chưa xử lý.
- [ ] **Security standards (Full):** đạt [SECURITY_STANDARDS.md](./SECURITY_STANDARDS.md) §5; feature AI đã kiểm OWASP LLM Top 10 (§2) gồm ca lạm dụng.
- [ ] **Performance standards (Full):** đạt budget [PERFORMANCE_STANDARDS.md](./PERFORMANCE_STANDARDS.md) §1; feature AI đạt token/latency ceiling §2; có số đo tải cho luồng chính.
- [ ] **Handover:** CLAUDE.md cập nhật quyết định kiến trúc mới (nếu có); retro 3 dòng đã ghi; Serena memory cập nhật (con trỏ); task `completed` + ACTIVE_STATE cập nhật.

---

## Quy tắc bất biến (mọi path)
1. **Không claim "đã xong/đã pass" mà chưa chạy lệnh kiểm chứng** — bằng chứng trước, khẳng định sau (`verification-before-completion`).
2. **Test phải thực sự kiểm thử hành vi**, không phải test rỗng/mock toàn bộ để qua cho có.
3. **ACTIVE_STATE.md được cập nhật** khi trạng thái công việc đổi.
