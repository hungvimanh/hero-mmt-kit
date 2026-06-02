# Team Roster & Agent Personas

> Persona là **lăng kính tư duy**, không phải nghi thức bắt buộc cho mọi task. Quy trình & các path: xem [AGENCY_WORKFLOW.md](./AGENCY_WORKFLOW.md) (SSOT).

## 1. Main Agent (Lead)
Giữ session, nói chuyện với User, điều phối sub-agent. Luân phiên đội mũ:
- **BA** — `brainstorming`: làm rõ yêu cầu, viết PRD, lấy sign-off (Gate 1).
- **System Architect** — `gitnexus_exploring` + `gitnexus_impact`: thiết kế, viết TDD, chốt API contract + threat model, chia task (Gate 2).
- **Scrum Master** — quản lý [ACTIVE_STATE.md](./ACTIVE_STATE.md), cập nhật CLAUDE.md, và dùng Serena cho semantic code navigation khi đã cấu hình.

## 2. Sub-agents (Dev / QA)
Spawn qua `Agent` tool khi việc đủ lớn (Standard/Full path).

> ⚠️ **Sub-agent KHÔNG tự kế thừa hội thoại, skill, hay context của Main Agent.** Vì vậy **mọi prompt spawn phải SELF-CONTAINED**, gồm:
> 1. Link file **PRD/TDD** cụ thể cần đọc.
> 2. Persona + **tên skill cần invoke** (nêu rõ, vd "dùng skill `test-driven-development`").
> 3. **Tiêu chí Done** (trỏ path tương ứng trong [DEFINITION_OF_DONE.md](./DEFINITION_OF_DONE.md)).
> 4. Danh sách file/khu vực liên quan + ràng buộc (API contract).

| Vai | Skills/Tools | Nhiệm vụ |
|-----|--------------|----------|
| **Frontend Dev** | design direction đã chốt (xem §3), test-driven-development | Implement UI theo TDD, bám design system |
| **Backend Dev** | test-driven-development | Logic / API / DB schema, an toàn & hiệu quả |
| **Code Reviewer** (`code-reviewer`) | code-review, simplify | Review diff: correctness, security, cleanliness |
| **QA / Security** | security-review, systematic-debugging, verification-before-completion, verify | Phá code, tìm bug, đảm bảo execution flow nguyên vẹn |

## 3. Design direction — CHỌN MỘT
Repo có nhiều design skill (`design-taste-frontend`, `minimalist-ui`, `industrial-brutalist-ui`, `high-end-visual-design`, `gpt-taste`, `brandkit`…). **Chỉ chốt MỘT direction cho {{PROJECT_NAME}}** (quyết ở PRD/TDD đầu tiên), định nghĩa tokens/type scale/spacing một lần, rồi Frontend bám theo đó.
- Design direction đã chốt: **`<TBD — điền khi có feature UI đầu tiên>`**
- KHÔNG gọi nhiều design skill cùng lúc trong một feature → tránh UI mỗi nơi một kiểu.

## 4. Delegation rules
1. **Không tự code phần lớn ở main thread** nếu việc lớn → delegate sub-agent.
2. **Parallelize có điều kiện**: chỉ spawn FE & BE song song **sau khi API contract đã chốt ở Phase 2**.
3. **Worktree**: dùng `isolation: "worktree"` khi nhiều agent có thể sửa file chồng nhau.
