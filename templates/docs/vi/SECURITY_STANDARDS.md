# Security Standards

> Baseline bảo mật **đo được** cho {{PROJECT_NAME}}. Là tiêu chí mà `security-review` (Phase 4) chấm theo và là một phần của [DEFINITION_OF_DONE.md](./DEFINITION_OF_DONE.md). Shift-left: phần lớn được xét ngay ở **threat modeling Phase 2** ([AGENCY_WORKFLOW.md](./AGENCY_WORKFLOW.md)).
>
> Điền các `<TBD>` theo stack/quy định cụ thể khi chốt ở PRD/TDD đầu tiên.

## 1. Baseline chung (mọi project)
- **Secrets**: KHÔNG hardcode secret/khoá/API token trong code hay log. Dùng biến môi trường / secret manager. `.env` phải nằm trong `.gitignore`. Bật secret-scanning (xem §4).
- **Dependency & supply-chain**: khoá phiên bản (lockfile); chạy `<AUDIT_CMD>` (vd `npm audit` / `pip-audit`); bật cập nhật tự động (Dependabot/Renovate); chỉ thêm dependency có nguồn tin cậy.
- **Input validation & output encoding**: validate mọi input từ ngoài (user, API, file); encode output theo ngữ cảnh (chống XSS/SQLi/command injection). Dùng parameterized query, không nối chuỗi.
- **AuthN/AuthZ**: xác thực rõ ràng; **least privilege** cho mọi vai trò/khoá/tài nguyên; kiểm tra quyền ở phía server, không tin client.
- **Transport & data at rest**: TLS cho mọi traffic; mã hoá dữ liệu nhạy cảm khi lưu nếu cần.
- **Logging**: log đủ để điều tra nhưng **không lộ secret/PII**; không in stack trace/nội bộ ra cho người dùng cuối.
- **Error handling**: thông báo lỗi cho user không tiết lộ chi tiết hệ thống (path, version, query…).

## 2. AI-specific — OWASP LLM Top 10 (bắt buộc cho feature AI)
> Tham chiếu chéo `templates/PRD_AI_FEATURE.md §5`.
- **Prompt injection**: tách bạch **system prompt** với **nội dung không tin cậy** (input user, dữ liệu fetch, tool output). KHÔNG thực thi/đi theo lệnh nằm trong dữ liệu không tin cậy một cách mù quáng.
- **Sensitive information disclosure**: không để model rò rỉ secret/PII/dữ liệu khách khác; lọc đầu ra; tối thiểu hoá dữ liệu đưa vào context.
- **Excessive agency**: giới hạn **quyền của tool/agent** (chỉ cấp tool thực sự cần); hành động khó đảo ngược phải có xác nhận/human-in-the-loop (xem [INTERACTION_PATTERNS.md](./INTERACTION_PATTERNS.md) P2/P6).
- **Insecure output handling**: coi đầu ra của model như **dữ liệu không tin cậy** — validate/sanitize trước khi render HTML, chạy code, hay truyền xuống hệ thống khác.
- **Guardrails & refusal**: chính sách từ chối nội dung cấm (PRD §5); chống lạm dụng/jailbreak.
- **Supply chain của model/plugin**: chỉ dùng model/MCP/plugin từ nguồn tin cậy; ghi rõ phiên bản.

## 3. An toàn quy trình (đã enforce một phần qua hook)
- `main` được bảo vệ; vào qua MR ([BRANCHING.md](./BRANCHING.md)). Hook `git-guard` chặn force-push, `commit --no-verify`, `reset --hard`.
- Không bỏ qua hook/CI để "cho nhanh".

## 4. Tool tự động (tùy chọn — degrade nếu thiếu)
- **Secret scanning**: vd `gitleaks` (có thể chạy như pre-commit hook để **chặn**). `<TBD: bật/tắt>`
- **`<AUDIT_CMD>`** trong CI / lệnh `doctor`.
- **SAST** (tùy stack): `<TBD>`.

## 5. Checklist theo path (đưa vào DoD)
- **Fast path**: không secret mới bị commit; `<AUDIT_CMD>` không lỗi nghiêm trọng mới.
- **Standard path**: + input validation cho code chạm; + kiểm quyền nếu chạm authz.
- **Full path**: + threat model (Phase 2) đã xử lý; + `security-review` pass; + (feature AI) toàn bộ §2 đã kiểm, gồm ca lạm dụng.
