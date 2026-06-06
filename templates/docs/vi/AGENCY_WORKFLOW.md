# Agency Workflow — Single Source of Truth

> **Đây là tài liệu quy trình DUY NHẤT (canonical).** Mọi tài liệu khác (CLAUDE.md, AGENTS.md, TEAM_ROSTER.md, ghi chú Serena tùy chọn) chỉ được **trỏ link** tới đây, KHÔNG được sao chép nội dung. Sửa quy trình → chỉ sửa file này.

AI đóng vai một software agency tinh gọn. Quy mô vận hành: **{{TEAM_SIZE}} + AI**, theo **{{BRANCHING_MODEL}}** (xem [BRANCHING.md](./BRANCHING.md)). Tiêu chí hoàn thành: xem [DEFINITION_OF_DONE.md](./DEFINITION_OF_DONE.md).

Persona (BA / Architect / Developer / QA / Scrum Master) là **lăng kính tư duy**, không phải nghi thức bắt buộc cho mọi việc — chi tiết ở [TEAM_ROSTER.md](./TEAM_ROSTER.md).

---

## 0. Quy tắc vàng

1. **Bắt đầu mọi yêu cầu bằng việc PHÂN LOẠI task** (bảng §1) → chọn đúng *path*. Đừng mặc định chạy full 5-phase cho mọi việc.
2. **Không lao vào code khi yêu cầu chưa rõ.** Với Standard/Full path, làm rõ scope trước.
3. **Gate = Plan Mode thật, không phải lời hứa.** Khi một path yêu cầu "Gate", dùng `EnterPlanMode` → trình kế hoạch → `ExitPlanMode` để User duyệt. Đây là cơ chế chặn được harness enforce, thay cho câu chữ "chờ sign-off".
4. **Cập nhật [ACTIVE_STATE.md](./ACTIVE_STATE.md)** khi bắt đầu / kết thúc một đơn vị công việc. Đây là backlog bền vững xuyên session (TaskCreate chỉ sống trong session hiện tại).
5. **Tuân [COMMUNICATION_PROTOCOL.md](./COMMUNICATION_PROTOCOL.md) trong mọi tương tác** — đặc biệt khi làm rõ yêu cầu: no silent assumptions, phân tầng độ chắc chắn, phân loại câu hỏi blocking/non-blocking, đóng vòng khi hiểu sai.
6. **Với codebase cũ, chạy brownfield discovery trước** sau khi cài: `hero-vibe-kit init` → `hero-vibe-kit discover` → `hero-vibe-kit doctor`. Đọc [BROWNFIELD_DISCOVERY.md](./BROWNFIELD_DISCOVERY.md) trước khi sửa code.
7. **Delegate sub-agent theo path, không theo prompt của User** đối với phần *review/QA* mà path yêu cầu — cứ làm kể cả khi User không nhắc. Sub-agent mạnh nhất ở research/exploration và review; **delegate phần implementation là tùy chọn** — chỉ dùng khi thực sự có lợi (nhánh song song độc lập, hoặc để cô lập context). Không phải task nào cũng cần sub-agent.

---

## 1. Bảng phân loại task → workflow (ROUTER)

Khi nhận yêu cầu, tra bảng này trước để chọn path, branch, bước bắt buộc và DoD.

| # | Loại task | Trigger / ví dụ | Path | Gate | Branch | Bước bắt buộc | Skills / Tools | DoD rút gọn |
|---|---|---|---|---|---|---|---|---|
| 1 | **Q&A / Explain / Find code** | "Giải thích X", "tìm chỗ xử lý Y", "code này làm gì" | Read-only | Không | — | Trả lời trực tiếp, **không sửa file** | `gitnexus_query`, `gitnexus_context`, serena `find_symbol` | Trả lời đúng + trích `file:line`; không tạo branch/commit |
| 2 | **Chore / Docs / Config** | sửa README, đổi config, bump version, format | Fast | Không | `chore/` `docs/` | sửa → MR | — | build/lint xanh; không đổi hành vi runtime |
| 3 | **Bugfix nhỏ (khu trú)** | lỗi rõ nguyên nhân, ≤ ~2 file, không phải symbol dùng chung | Fast | Không (nhưng **bắt buộc repro test**) | `fix/` | `systematic-debugging` → viết test ĐỎ tái hiện bug → fix → test XANH → MR | systematic-debugging, test-driven-development, verification-before-completion | test tái hiện bug (đỏ→xanh); regression xanh; root cause ghi trong MR |
| 4 | **Hotfix (prod khẩn cấp)** | sự cố production cần vá gấp | Fast (expedited) | Không | `hotfix/` (off `main`) | fix tối thiểu + test → MR nhanh → backport về nhánh phát triển | systematic-debugging, verify | vá sự cố + test; đã backport; ghi lại để hậu kiểm |
| 5 | **Sửa / đổi logic tính năng đã có** | "đổi cách tính X", "thêm điều kiện cho Y", "đổi hành vi Z" | Standard | **CÓ** | `change/` | **impact analysis BẮT BUỘC** → đảm bảo/ bổ sung regression test → impl → QA review | `gitnexus_impact` (upstream), test-driven-development, code-review | impact đã báo cáo; regression + test mới xanh; `detect_changes` đúng phạm vi |
| 6 | **Refactor (KHÔNG đổi hành vi)** | "tách module", "đổi tên", "dọn code" | Standard | **CÓ** | `refactor/` | test XANH trước → impact analysis → đổi (dùng `gitnexus_rename`) → test XANH sau (không đổi) | gitnexus_rename, gitnexus_impact, simplify | cùng bộ test pass trước & sau; KHÔNG find-replace thủ công |
| 7 | **Feature mới** | "xây tính năng Z" | Full (5-phase) | **CÓ (2 gate: PRD + TDD)** | `feat/` | §3 đầy đủ — nếu feature có UI, theo design track ([DESIGN_STANDARDS.md](./DESIGN_STANDARDS.md)) | brainstorming, writing-plans, test-driven-development, design system, code-review, security-review | đủ [DEFINITION_OF_DONE.md](./DEFINITION_OF_DONE.md) |
| 8 | **Spike / Research / POC** | "nghiên cứu khả thi", "thử nghiệm cách tiếp cận" | Timeboxed | Không (timebox thay gate) | `spike/` (vứt đi) | timebox rõ ràng → output **doc khuyến nghị**; **KHÔNG merge code POC** vào main | deep-research, gitnexus_exploring | có doc kết luận + khuyến nghị; code POC không vào main |
| 9 | **UI/UX Design / Redesign** | "redesign trang này", "design màn hình cho X", "cải thiện UI" | Standard | **CÓ** | `design/` | chọn profile → UX (nếu có màn hình mới) → chọn MỘT direction → chốt tokens/design system → tạo media (nếu profile cần) → implement (gồm in-product help) → Visual QA | xem [DESIGN_STANDARDS.md](./DESIGN_STANDARDS.md) | Design DoD ([DEFINITION_OF_DONE.md](./DEFINITION_OF_DONE.md)) |

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

### Lightweight Main Agent Protocol

Main Agent là orchestrator giao tiếp với User, không phải executor mặc định. Giữ Main Agent đủ nhẹ để clarify, plan, route, synthesize và nói chuyện với User.

Luồng mặc định:

```text
User intent
  → Main Agent clarify và plan
  → Main Agent delegate việc có biên rõ
  → sub-agent execute / explore / test / review
  → sub-agent trả bounded report
  → Main Agent synthesize, quyết định bước tiếp theo và chịu trách nhiệm claim cuối
```

Main Agent chỉ trực tiếp làm:
- giao tiếp với User và quyết định blocking,
- phân loại task, lập plan và tạo handoff prompt,
- edit/check nhỏ khi delegate tốn hơn lợi ích,
- final accountability gate trước khi claim hoàn tất.

Sub-agent nên xử lý broad reading, MCP exploration, noisy command execution, implementation, QA, security, performance review và log analysis khi việc đó bảo vệ context chính.

### Context Budget Protocol

Main Agent là bộ điều khiển workflow, không phải kho chứa transcript. Trước khi exploration rộng, implementation, QA/review, final verification, hoặc bất kỳ phase handoff nào:

1. checkpoint state bền vững trong [ACTIVE_STATE.md](./ACTIVE_STATE.md), plan/spec hiện tại, hoặc resume packet,
2. tránh đọc hoặc dump toàn bộ file trừ khi cần một excerpt có biên rõ,
3. delegate việc đọc/review rộng khi nó giúp tăng focus hoặc bảo vệ context chính,
4. tóm tắt output của tool và sub-agent thay vì mang theo raw log hoặc transcript,
5. chạy `/compact` hoặc mở session mới từ link artifact khi context pressure cao.

Quy tắc chi tiết, prompt compact, prompt restart session và bước khôi phục API 400 nằm trong [CONTEXT_BUDGET.md](./CONTEXT_BUDGET.md).

### Escalation rule (nâng cấp path)
Một task đang ở **Fast path** mà phát hiện:
- chạm symbol có nhiều caller / `gitnexus_impact` trả về **MEDIUM trở lên**, HOẶC
- thay đổi lan ra **> 5 file**, HOẶC
- trong repo brownfield đã có `docs/BROWNFIELD_DISCOVERY.md`, chạm **> 2 file** hoặc vùng gắn nhãn **Cần xác nhận**,

→ **dừng lại, nâng lên Standard path**: mở Plan Mode (gate), chạy & báo cáo impact analysis trước khi tiếp tục.

---

## 2. Bốn path (định nghĩa)

### Read-only
Trả lời câu hỏi, đọc/giải thích code. Không branch, không gate, không commit. Ưu tiên `gitnexus_query`/`gitnexus_context` thay vì grep mù. Luôn trích dẫn `file:line`.
Chỉ delegate khi cần exploration rộng vượt quá vài lượt search có mục tiêu; còn lại trả lời trực tiếp.

### Fast path
Cho việc nhỏ, rủi ro thấp (chore/docs/bugfix khu trú/hotfix).
1. Tạo branch đúng tiền tố (xem [BRANCHING.md](./BRANCHING.md)).
2. Thực hiện thay đổi. Nếu là **bugfix**: viết test tái hiện bug (đỏ) TRƯỚC khi sửa.
3. Self-review nhanh (`code-review` nếu muốn) + chạy test/lint.
4. Mở MR theo DoD "Fast" trong [DEFINITION_OF_DONE.md](./DEFINITION_OF_DONE.md).
> Không cần Plan sign-off. Nhưng nếu chạm trúng escalation rule → nâng lên Standard.

Chỉ delegate implementation khi tiết kiệm đáng kể context hoặc thời gian; review là tùy chọn trừ khi escalation rule được kích hoạt.

### Standard path
Cho thay đổi logic tính năng đã có & refactor.
1. **Gate**: `EnterPlanMode` → khảo sát + chạy `gitnexus_impact` (upstream) → trình kế hoạch nêu **blast radius + mức rủi ro** → `ExitPlanMode` chờ User duyệt.
2. Cảnh báo User nếu rủi ro **HIGH/CRITICAL** trước khi tiếp tục.
3. Implement theo TDD; refactor thì giữ test không đổi.
4. QA: **BẮT BUỘC spawn** sub-agent review (`code-review` + `security-review` nếu chạm bề mặt nhạy cảm) + `gitnexus_detect_changes`.
5. MR theo DoD "Standard".

Delegate implementation là tùy chọn, nhưng sub-agent review là bắt buộc trước khi hoàn tất. Dùng [HANDOFF_TEMPLATES.md](./HANDOFF_TEMPLATES.md) cho prompt reviewer.

### Full path (5-phase) — chỉ cho Feature mới
Xem §3.
Dùng lăng kính BA và Architect cho các gate; chỉ delegate implementation cho các nhánh độc lập hoặc khi cần cô lập context; QA/review vẫn bắt buộc.

---

## 3. Full path: 5 phase cho Feature mới

> Chỉ áp dụng cho task loại **#7 (Feature)**. Việc nhỏ KHÔNG chạy phase này.

### Phase 1 — Discovery & Scoping (lăng kính: Business Analyst)
1. Trigger skill `brainstorming`. **Áp dụng [COMMUNICATION_PROTOCOL.md](./COMMUNICATION_PROTOCOL.md)** xuyên suốt (cách hỏi, gắn nhãn giả định, kết mỗi vòng bằng tóm tắt + câu hỏi mở + giả định).
2. Làm rõ: User Personas, Business Flows, Edge Cases, mục tiêu, tiêu chí chấp nhận (acceptance criteria).
3. **Nếu là feature AI/assistant:** dùng **[template PRD_AI_FEATURE.md](./templates/PRD_AI_FEATURE.md)** — bắt buộc làm rõ các chiều đặc thù (hành vi khi mơ hồ, guardrails/refusal, định nghĩa "đúng" + golden examples, eval strategy, fallback/HITL), tham chiếu [INTERACTION_PATTERNS.md](./INTERACTION_PATTERNS.md) cho cách assistant giao tiếp với end-user.
4. Output: **PRD / Scope Document** trong `docs/specs/` theo [ARTIFACTS_AND_STORAGE.md](./ARTIFACTS_AND_STORAGE.md), link vào ACTIVE_STATE — gồm Decision Log + Assumptions Register.
5. **Nếu feature có UI:** ghi nhận *design profile + danh mục màn hình + luồng chính + trạng thái từng màn hình + những help pattern nào áp dụng* — xem [DESIGN_STANDARDS.md](./DESIGN_STANDARDS.md) §1–§2, §8 và [template DESIGN_BRIEF.md](./templates/DESIGN_BRIEF.md).
6. **GATE 1 (Plan Mode):** trình PRD → `ExitPlanMode` → chờ User (Product Owner) duyệt.

### Phase 2 — Architecture & Planning (lăng kính: System Architect)
1. `gitnexus_exploring` để hiểu kiến trúc hiện tại (bỏ qua nếu vùng liên quan còn trống).
2. `gitnexus_impact` cho mọi sửa đổi lên code đã có.
3. **Threat modeling nhẹ (shift-left):** liệt kê bề mặt tấn công / dữ liệu nhạy cảm / quyền hạn ngay tại đây theo [SECURITY_STANDARDS.md](./SECURITY_STANDARDS.md) — đừng để dồn hết về QA.
4. **Đặt performance budget:** chốt latency/throughput/token-cost mục tiêu theo [PERFORMANCE_STANDARDS.md](./PERFORMANCE_STANDARDS.md) (điền `<TBD>`).
5. **Nếu feature có UI:** chọn **design profile** và **chốt MỘT visual direction** (một taste skill duy nhất; có thể khám phá qua visual companion / `imagegen-*`). Định nghĩa **design tokens / design system như một phần của contract** (tokens là FE↔design contract, giống API contract). Lên kế hoạch tạo media (provider đã cấu hình vs Claude subagent). Xem [DESIGN_STANDARDS.md](./DESIGN_STANDARDS.md) §2–§6.
6. **Chốt API/interface contract** giữa các thành phần (FE↔BE, module↔module). *Đây là điều kiện tiên quyết để được phép parallelize ở Phase 3.*
7. Trigger `writing-plans` để chia nhỏ công việc → tạo task bằng `TaskCreate` (session-scoped) + ghi vào ACTIVE_STATE (bền vững).
8. Output: **Technical Design Document (TDD)** trong `docs/plans/` + Task list, kèm report artifact trong `docs/reports/` theo [ARTIFACTS_AND_STORAGE.md](./ARTIFACTS_AND_STORAGE.md).
9. **GATE 2 (Plan Mode):** trình TDD **kèm theo, với feature có UI, design profile + visual direction đã chọn + mockup các màn hình chính** → `ExitPlanMode` → chờ User duyệt cách tiếp cận kỹ thuật. (Không có gate design riêng.)

### Phase 3 — Implementation (lăng kính: Developer)
1. Cập nhật task `in_progress` (`TaskUpdate`) + ACTIVE_STATE.
2. **Mặc định main agent tự implement với full project context.** Chỉ delegate cho Dev sub-agent khi thực sự có lợi — ví dụ nhánh song song độc lập, hoặc để cô lập một context lớn. Sub-agent KHÔNG tự kế thừa hội thoại/skill, nên mọi prompt delegate phải self-contained (link PRD/TDD, skill cần invoke, tiêu chí Done, file liên quan). Chi tiết: [TEAM_ROSTER.md](./TEAM_ROSTER.md).
3. **Parallelize CÓ ĐIỀU KIỆN:** chỉ spawn FE & BE song song **sau khi API contract (Phase 2.5) đã chốt**. Khi nhiều agent sửa file chồng nhau → `isolation: "worktree"`.
4. Developer áp dụng `test-driven-development`.
5. Frontend implement dựa trên **design system đã chốt** (tokens/components) từ Phase 2; dùng `image-to-code` khi implement từ các visual reference đã duyệt; tạo media nhúng theo [DESIGN_STANDARDS.md](./DESIGN_STANDARDS.md) §6; KHÔNG đưa design direction mới vào giữa chừng khi đang build.

### Phase 4 — Quality Assurance (lăng kính: QA, sub-agent)
1. Spawn Code Reviewer / QA sub-agent (prompt self-contained).
2. QA chạy `verification-before-completion`, `security-review`, `systematic-debugging` khi cần. Đối chiếu [SECURITY_STANDARDS.md](./SECURITY_STANDARDS.md) + [PERFORMANCE_STANDARDS.md](./PERFORMANCE_STANDARDS.md) (gồm OWASP LLM Top 10 cho feature AI, và budget hiệu năng).
3. `gitnexus_detect_changes` để xác nhận không vỡ execution flow ngoài dự kiến.
4. Phải đạt [DEFINITION_OF_DONE.md](./DEFINITION_OF_DONE.md) (mức Full) trước khi merge.
5. **Visual QA (feature có UI):** chạy checklist [DESIGN_STANDARDS.md](./DESIGN_STANDARDS.md) §7 (gồm media weight) và xác minh mục in-product help tồn tại & chính xác (quy tắc đồng bộ §8); ghi vào `reports/.../design-qa.md`.

### Phase 5 — Handover & Retro (lăng kính: DevOps / Scrum Master)
1. Trigger `finishing-a-development-branch` → mở/merge MR theo [BRANCHING.md](./BRANCHING.md).
2. Cập nhật **CLAUDE.md** nếu có quyết định kiến trúc mới (chỉ ghi cái mới, không lặp).
3. **Retro nhẹ (3 dòng):** cái gì chạy tốt / cái gì vướng / 1 cải tiến cho lần sau — ghi vào ACTIVE_STATE, MR, hoặc `docs/reports/<slug>/retro.md` theo [ARTIFACTS_AND_STORAGE.md](./ARTIFACTS_AND_STORAGE.md).
4. Nếu đã cấu hình Serena, dùng nó cho semantic code navigation và chỉ giữ ghi chú tùy chọn dạng con trỏ, không lặp nội dung.
5. Đánh dấu task `completed` + cập nhật ACTIVE_STATE.

---

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
| Context pressure cao | Ghi/cập nhật resume packet, chạy `/compact` nếu tiếp tục cùng session, hoặc mở session mới từ link artifact. |
| Phát hiện rủi ro bất ngờ | Dừng lại, báo rủi ro, và yêu cầu gate hoặc quyết định của User. |

---

## 5. Tài liệu liên quan
| File | Nội dung |
|------|----------|
| [TASK router §1](#1-bảng-phân-loại-task--workflow-router) | Chọn path theo loại task |
| [DEFINITION_OF_DONE.md](./DEFINITION_OF_DONE.md) | Tiêu chí hoàn thành đo được (theo path) |
| [BRANCHING.md](./BRANCHING.md) | GitLab flow, đặt tên nhánh, Conventional Commits |
| [TEAM_ROSTER.md](./TEAM_ROSTER.md) | Persona + quy tắc delegate sub-agent + design direction |
| [HANDOFF_TEMPLATES.md](./HANDOFF_TEMPLATES.md) | Hợp đồng prompt tái sử dụng cho BA, Architect, Implementer, reviewer, brownfield discovery và handover |
| [CONTEXT_BUDGET.md](./CONTEXT_BUDGET.md) | Quy tắc context pressure, prompt compact/restart session, format resume packet và khôi phục API 400 |
| [ACTIVE_STATE.md](./ACTIVE_STATE.md) | Trạng thái pipeline + resume protocol |
| [ARTIFACTS_AND_STORAGE.md](./ARTIFACTS_AND_STORAGE.md) | Output artifact, layout docs/specs/plans/reports, quy tắc lưu trữ |
| [COMMUNICATION_PROTOCOL.md](./COMMUNICATION_PROTOCOL.md) | Giao thức giao tiếp Human↔AI (làm rõ yêu cầu) |
| [templates/PRD_AI_FEATURE.md](./templates/PRD_AI_FEATURE.md) | Template PRD cho feature AI (các chiều cần làm rõ) |
| [INTERACTION_PATTERNS.md](./INTERACTION_PATTERNS.md) | Cách sản phẩm (assistant) giao tiếp với end-user |
| [SECURITY_STANDARDS.md](./SECURITY_STANDARDS.md) | Baseline bảo mật + OWASP LLM Top 10 |
| [PERFORMANCE_STANDARDS.md](./PERFORMANCE_STANDARDS.md) | Budget hiệu năng + chuẩn AI (prompt caching…) |
| [DESIGN_STANDARDS.md](./DESIGN_STANDARDS.md) | UX↔UI, design profiles, skill routing, tokens, platform, media, visual QA, in-product help |
