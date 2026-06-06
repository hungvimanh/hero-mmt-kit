# Team Roster & Agent Personas

> Persona là **lăng kính tư duy**, không phải nghi thức bắt buộc cho mọi task. Router, gate và thứ tự phase nằm trong [AGENCY_WORKFLOW.md](./AGENCY_WORKFLOW.md) (SSOT).

## 1. Main Agent (Lead)
Giữ session, nói chuyện với User, và điều phối sub-agent. Main Agent chịu trách nhiệm phân loại task, gate, tổng hợp, giao tiếp với User và mọi claim cuối cùng. Main Agent cũng chịu trách nhiệm context budgeting: không đưa raw context dài vào chat, ưu tiên link artifact, và tuân [CONTEXT_BUDGET.md](./CONTEXT_BUDGET.md) khi context pressure tăng.

Main Agent luân phiên lăng kính theo trạng thái workflow:
- **BA** — kích hoạt khi discovery, PRD, giả định và acceptance criteria.
- **System Architect** — kích hoạt khi impact analysis, technical planning, interface contract và đánh giá rủi ro.
- **Developer** — kích hoạt khi có implementation task.
- **QA** — kích hoạt trước completion cho Standard và Full path, tùy chọn cho Fast path.
- **Security** — kích hoạt khi chạm authentication, permission, user input, secrets, external integration, deployment, hành vi AI, hoặc bề mặt nhạy cảm khác.
- **Scrum Master** — quản lý [ACTIVE_STATE.md](./ACTIVE_STATE.md), link artifact, handoff và retro.
- **Design/UX** — kích hoạt cho UI flow, wireframe và visual direction đã chốt; xem [DESIGN_STANDARDS.md](./DESIGN_STANDARDS.md).

Role trước hết là lăng kính. Chỉ spawn sub-agent khi path yêu cầu review/QA hoặc khi delegation thật sự cải thiện focus, tốc độ hoặc cô lập context.

## 2. Routing model và effort cho sub-agent
Dùng bảng này mỗi khi spawn sub-agent. Giữ model ID tập trung ở đây để khi Claude có model mới chỉ cần cập nhật một doc.

| Độ khó task | Model | Effort | Dùng khi |
|---|---|---|---|
| Khó / Rất khó | Cùng model với Main Agent | medium | Kiến trúc, review sâu, việc mơ hồ, synthesis rủi ro cao |
| Trung bình-khó | `claude-sonnet-4-6` | medium | Implementation có biên rõ, review tập trung, investigation vừa phải |
| Đơn giản | `claude-haiku-4-5` | medium / high | Tóm tắt nhỏ, check đơn giản, tra cứu doc hẹp |

Quy tắc:
- Ưu tiên model nhỏ nhất vẫn đủ an toàn cho task.
- Dùng model của Main Agent khi giảm reasoning quality dễ gây rework.
- Không hardcode model ID trong handoff prompt ngoài bảng này; chỉ cite tier và effort.

## 3. Delegate theo path
Delegate sub-agent giúp giảm context ở main thread và bảo đảm có review chuyên trách. Path quyết định; User không cần nhắc "dùng sub-agent".

- **Fast path** → sub-agent tùy chọn; main agent có thể tự implement.
- **Standard path** → BẮT BUỘC spawn review sub-agent (QA/code-review) trước khi hoàn tất.
- **Full path** → BẮT BUỘC spawn QA/review sub-agent trước khi hoàn tất; **delegate Dev implementation là TÙY CHỌN** — chỉ dùng khi thực sự có lợi (nhánh song song độc lập hoặc để cô lập context).
- **Lần sửa đầu trong brownfield** → nếu tồn tại `docs/BROWNFIELD_DISCOVERY.md` và request chạm > 2 file hoặc vùng **Cần xác nhận**, xử lý như Standard (gate + review sub-agent).

### Khi nào KHÔNG nên dùng sub-agent
- Task nhỏ/khu trú mà việc spawn một sub-agent tốn hơn lợi ích thu được.
- Khi main agent đã nắm đủ context cần thiết — sub-agent dùng để *thu thập* context, không phải để làm việc mà bạn đã làm trực tiếp được.
- Không bao giờ giao phần implementation cho sub-agent mà thiếu prompt self-contained — nó không có context của project.

### Context budget cho sub-agent
- Sub-agent có thể đọc rộng, nhưng phải báo cáo hẹp.
- Trả về kết luận, bằng chứng, rủi ro, quyết định, bước tiếp theo, và trích dẫn file/path — không trả transcript, toàn bộ nội dung file, toàn bộ diff, hoặc toàn bộ log.
- Dùng concise response style từ [COMMUNICATION_PROTOCOL.md](./COMMUNICATION_PROTOCOL.md): ít chữ nhất, nhiều tín hiệu nhất, kết quả trước.
- Nếu output của sub-agent dài, Main Agent nên tóm tắt nó vào report artifact trước khi tiếp tục.

## 4. Hợp đồng prompt cho sub-agent
Sub-agent KHÔNG tự kế thừa hội thoại, skill, hay context của Main Agent. Dùng [HANDOFF_TEMPLATES.md](./HANDOFF_TEMPLATES.md) cho các prompt skeleton tái sử dụng. Mọi prompt spawn vẫn phải SELF-CONTAINED và ngắn gọn:
1. Vai trò/persona + đầu ra cụ thể.
2. File/khu vực cần xem và file cần tránh.
3. Link PRD/TDD/report nếu đã có.
4. Skill/tool cần invoke khi phù hợp.
5. Tiêu chí Done từ [DEFINITION_OF_DONE.md](./DEFINITION_OF_DONE.md).
6. Định dạng đầu ra: phát hiện, rủi ro, quyết định, bước tiếp theo, và trích dẫn file/path — không trả transcript.

| Vai | Skills/Tools | Nhiệm vụ |
|-----|--------------|----------|
| **BA Discovery** | brainstorming, communication protocol | Làm rõ scope, giả định, flow và acceptance criteria trước khi lập implementation plan |
| **Architect Planner** | gitnexus_exploring, gitnexus_impact, writing-plans | Khám phá kiến trúc, đánh giá impact, chốt contract và tạo technical plan |
| **Frontend Dev** | design direction đã chốt, test-driven-development | Implement UI theo TDD và design system |
| **Backend Dev** | test-driven-development | Logic / API / DB schema, an toàn & hiệu quả |
| **Spec Compliance Reviewer** | PRD/TDD đã duyệt, plan artifacts | Kiểm implementation có khớp requirement đã duyệt và biên task không |
| **Code Reviewer** (`code-reviewer`) | code-review, simplify | Review diff: correctness, security, cleanliness |
| **QA / Security** | security-review, systematic-debugging, verification-before-completion, verify | Phá code, tìm bug, đảm bảo execution flow và bề mặt nhạy cảm nguyên vẹn |

## 5. Design direction & profile
Design standards, skill routing, và quy tắc "chỉ chốt một direction" nằm ở [DESIGN_STANDARDS.md](./DESIGN_STANDARDS.md). Chốt các mục này cho từng project (ở PRD/Design Brief đầu tiên):
- Design profile cho {{PROJECT_NAME}}: **`<TBD — system-strict | branded-product | expressive>`**
- Visual direction đã chọn: **`<TBD — fill when the first UI feature appears>`**

## 6. Parallelization và worktree
- Chỉ spawn FE & BE song song sau khi API/interface contract đã chốt.
- Dùng `isolation: "worktree"` khi nhiều agent có thể sửa file chồng nhau.
