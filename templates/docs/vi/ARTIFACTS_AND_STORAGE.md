# Artifacts & Storage

> Quy định mỗi workflow tạo output gì, lưu ở đâu, và cái gì là nguồn chính thức. Source of truth là docs trong repo; Serena dùng cho semantic code intelligence, ghi chú/pointer chỉ là phụ.

## 1. Vai trò lưu trữ

| Loại thông tin | Nơi lưu chính | Mục đích | Ghi chú |
|---|---|---|---|
| Trạng thái workflow bền vững | `docs/ACTIVE_STATE.md` | Backlog xuyên session và trạng thái resume | Cập nhật khi feature bắt đầu, đổi phase/status, bị block, hoặc hoàn tất. |
| PRD / scope | `docs/specs/YYYY-MM-DD-<slug>.md` | Requirement, acceptance criteria, decision log, assumptions | Bắt buộc cho Full path; tùy chọn cho Standard nếu scope phức tạp. |
| Technical plan / TDD | `docs/plans/YYYY-MM-DD-<slug>.md` | Kiến trúc, API/interface contract, chia task, kế hoạch rủi ro | Bắt buộc cho Standard/Full có gate. |
| Impact analysis | `docs/reports/YYYY-MM-DD-<slug>/impact.md` | Blast radius, flow bị ảnh hưởng, mức rủi ro | Bắt buộc cho Standard khi sửa code cũ hoặc refactor. |
| Security review | `docs/reports/YYYY-MM-DD-<slug>/security.md` | Threat model findings, OWASP LLM checks, rủi ro chưa xử lý | Bắt buộc cho Full path và bề mặt nhạy cảm. |
| Performance review | `docs/reports/YYYY-MM-DD-<slug>/performance.md` | Budget, số đo, regression, token/cost checks | Bắt buộc khi có performance budget hoặc sửa hot path. |
| QA / verification | `docs/reports/YYYY-MM-DD-<slug>/qa.md` | Lệnh test, kiểm tra thủ công, gap còn biết trước | Bắt buộc trước khi claim done ở Standard/Full. |
| Raw command logs | `docs/reports/YYYY-MM-DD-<slug>/logs/` | Full output từ command build/test/diff/MCP ồn | Không đưa raw log vào chat; trích dẫn path từ bounded report. |
| Retro / handover | `docs/reports/YYYY-MM-DD-<slug>/retro.md` | Cái gì tốt, cái gì vướng, một cải tiến | Bắt buộc cho Full path; tùy chọn path khác. |
| Resume packet | `docs/reports/YYYY-MM-DD-<slug>/resume.md` | State để compact/restart session | Tạo hoặc cập nhật trước phase handoff, review lớn, final verification, hoặc khi khôi phục context pressure. |
| Task tracking trong session | `TaskCreate` / `TaskList` | Checklist thực thi của session hiện tại | Không bền vững; sau restart tạo lại từ `ACTIVE_STATE.md` + artifact đã link. |
| Semantic code understanding | Serena MCP | Symbol lookup, references, implementations, diagnostics, semantic edits | Không phải lớp storage chính. |
| Ghi chú Serena tùy chọn | `.serena/memories/project/*.md` | Pointer nhẹ trỏ về docs trong repo | Không bao giờ duplicate process, PRD, plan, hoặc report canonical ở đây. |
| Design system | `docs/design/DESIGN_SYSTEM.md` | Profile + direction đã chốt, tham chiếu token, danh mục component, ghi chú nền tảng | Bền vững; tạo khi có việc UI đầu tiên. |
| Tài nguyên thiết kế | `docs/design/assets/` | Media nguồn/tham chiếu (nhỏ, review được) | Asset production sẵn sàng nằm ở asset dir của app. |
| Nội dung help trong sản phẩm | `docs/help/` | Source help dạng Markdown/MDX render trong app | Giữ đồng bộ với feature (DESIGN_STANDARDS §8). |
| Visual QA | `docs/reports/YYYY-MM-DD-<slug>/design-qa.md` | Responsive/a11y/states/media-weight + độ chính xác của help | Bắt buộc cho việc UI ở Standard/Full. |

## 2. Cấu trúc thư mục

```txt
docs/
  AGENCY_WORKFLOW.md
  ARTIFACTS_AND_STORAGE.md
  ACTIVE_STATE.md
  DEFINITION_OF_DONE.md
  BRANCHING.md
  TEAM_ROSTER.md
  COMMUNICATION_PROTOCOL.md
  SECURITY_STANDARDS.md
  PERFORMANCE_STANDARDS.md
  INTERACTION_PATTERNS.md

  design/
    DESIGN_SYSTEM.md
    assets/
  help/

  specs/
    YYYY-MM-DD-feature-name.md

  plans/
    YYYY-MM-DD-feature-name.md

  reports/
    YYYY-MM-DD-feature-name/
      resume.md
      impact.md
      security.md
      performance.md
      qa.md
      logs/
      retro.md

  templates/
    PRD_AI_FEATURE.md
    DESIGN_BRIEF.md
```

Chỉ tạo `specs/`, `plans/`, và `reports/` khi cần artifact đầu tiên thuộc loại đó.

## 3. Artifact theo từng path
Đây chỉ là yêu cầu lưu trữ. Trình tự workflow và gate nằm trong [AGENCY_WORKFLOW.md](./AGENCY_WORKFLOW.md).


| Path | Artifact bền vững bắt buộc |
|---|---|
| Read-only | Không. Trả lời kèm trích dẫn `file:line`; không tạo docs trừ khi User yêu cầu. |
| Fast | Chỉ cập nhật `ACTIVE_STATE.md` nếu task là việc đang kéo dài. Bugfix cần có bằng chứng test trong MR/PR; chỉ tạo `reports/.../qa.md` khi hữu ích. |
| Standard | `ACTIVE_STATE.md`, `plans/*.md`, `reports/.../impact.md`, và `reports/.../qa.md`. Thêm `reports/.../resume.md` cho việc kéo dài, phase handoff, hoặc context pressure. Thêm security/performance report nếu bề mặt chạm tới yêu cầu. |
| Full | `ACTIVE_STATE.md`, `specs/*.md`, `plans/*.md`, `reports/.../resume.md`, `impact.md`, `security.md`, `performance.md`, `qa.md`, và `retro.md`. |
| Spike | `docs/reports/YYYY-MM-DD-<slug>/recommendation.md`; không merge code POC vứt đi vào main. |
| Design (router #9) | `docs/design/DESIGN_SYSTEM.md` (khi có việc UI đầu tiên), `docs/help/<area>.md`, `reports/.../design-qa.md`. Media nguồn ở `docs/design/assets/`. |

## 4. Quy tắc đặt tên

- Dùng lowercase kebab-case slug: `2026-06-02-checkout-retry.md`.
- Dùng cùng `<slug>` cho specs, plans, và reports của cùng một work item.
- Link artifact từ dòng tương ứng trong `ACTIVE_STATE.md`.
- Report ghi evidence và quyết định, không copy đoạn code dài.
- Resume packet ghi state restart ngắn gọn, không duplicate specs, plans, diff, log, hoặc transcript. Xem [CONTEXT_BUDGET.md](./CONTEXT_BUDGET.md).

## 5. Cái gì là authoritative

1. Quy trình: `docs/AGENCY_WORKFLOW.md`.
2. Quy tắc artifact/storage: file này.
3. Trạng thái công việc hiện tại: `docs/ACTIVE_STATE.md`.
4. Requirement: file đã link trong `docs/specs/`.
5. Cách tiếp cận kỹ thuật: file đã link trong `docs/plans/`.
6. Bằng chứng kiểm chứng: file đã link trong `docs/reports/`.

Nếu tool memory hoặc chat history mâu thuẫn với docs trong repo, tin docs trong repo và cập nhật pointer đã cũ.
