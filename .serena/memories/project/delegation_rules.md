Quy tắc delegate sub-agent (canonical): **`docs/TEAM_ROSTER.md`**.

Tóm tắt: Việc lớn (Standard/Full path) → Main Agent delegate qua `Agent` tool. Sub-agent KHÔNG tự kế thừa hội thoại/skill/context → **prompt phải self-contained** (link PRD/TDD, skill cần invoke, tiêu chí Done, file liên quan). Parallelize FE/BE chỉ khi API contract đã chốt ở Phase 2; dùng `isolation: "worktree"` khi sửa file chồng nhau.

Chi tiết: `docs/TEAM_ROSTER.md` (đừng lặp nội dung ở đây).
