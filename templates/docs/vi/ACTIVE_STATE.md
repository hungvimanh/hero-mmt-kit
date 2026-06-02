# Project Active State

**Last Updated:** {{DATE}}
**Current Global Phase:** 0 — Initialization & Setup

> 📌 **Bảng "Active Features" dưới đây LÀ backlog bền vững xuyên session.** Đây là nguồn trạng thái chính khi resume.
> `TaskCreate`/`TaskList` chỉ sống **trong session hiện tại** (in-memory, mất khi đóng session) — chỉ dùng để theo dõi việc đang làm, KHÔNG dùng làm backlog dài hạn. Mỗi khi trạng thái một feature đổi → cập nhật bảng này và (nếu có) GitLab MR/issue tương ứng.

## Active Features in Pipeline

| Feature / Epic | Path | Phase hiện tại | Branch / MR | Status | PRD | TDD |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| N/A | N/A | N/A | - | Idle | - | - |

## Blockers / Pending Actions
- Chờ Product Owner đề xuất feature/ý tưởng đầu tiên.
- Chốt tech stack → điền placeholder trong [DEFINITION_OF_DONE.md](./DEFINITION_OF_DONE.md).
- Chốt design direction → cập nhật [TEAM_ROSTER.md](./TEAM_ROSTER.md) §3.

## Session Resume Protocol
*AI khởi tạo session mới ĐỌC mục này:*
1. Đọc [AGENCY_WORKFLOW.md](./AGENCY_WORKFLOW.md) (SSOT) để nắm router & path, rồi đọc [ARTIFACTS_AND_STORAGE.md](./ARTIFACTS_AND_STORAGE.md) để biết nơi lưu artifact.
2. Xem bảng "Active Features" ở trên + các **GitLab MR đang mở** (`git branch`, MR list) — KHÔNG dựa vào TaskList của session cũ (đã mất).
3. Theo path & phase của từng feature:
   - **Read-only/Fast**: tiếp tục/hoàn tất rồi mở MR.
   - **Standard/Full ở Phase 1–2**: tiếp tục brainstorming/planning với User (qua Plan Mode gate).
   - **Standard/Full ở Phase 3–4**: mở PRD/TDD đã link, kiểm tra trạng thái code & branch, tái tạo task bằng `TaskCreate` cho session này, hỏi User trước khi resume code/test.
4. Cập nhật lại bảng này khi bắt đầu làm.
