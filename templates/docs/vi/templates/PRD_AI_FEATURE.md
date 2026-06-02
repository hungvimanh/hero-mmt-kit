# PRD — <Tên feature AI>

> Template PRD **dành riêng cho tính năng AI/assistant**. Mục đích: ép làm rõ những chiều mà phần mềm tất định thường bỏ sót. Điền hết; mục chưa biết → ghi `GIẢ ĐỊNH:` hoặc `<TBD>` (không để trống ngầm). Tuân [COMMUNICATION_PROTOCOL.md](../COMMUNICATION_PROTOCOL.md).
>
> Copy file này vào `docs/specs/YYYY-MM-DD-<feature>.md` khi bắt đầu Phase 1.

**Trạng thái:** Draft | In Review | Approved
**Ngày:** YYYY-MM-DD · **Product Owner:** · **Path (router):** Full / Standard

---

## 1. Bối cảnh & mục tiêu
- **Vấn đề người dùng:** <feature giải quyết đau gì?>
- **Mục tiêu đo được:** <vd: giảm X% thời gian, đạt Y% câu trả lời đúng>
- **Persona / đối tượng dùng:**

## 2. Intent & Scope của assistant  ⭐
- **LÀM gì (in-scope):** <những việc assistant phải làm được>
- **KHÔNG làm gì (out-of-scope, tường minh):** <ranh giới — quan trọng để chống scope creep & hành vi ngoài ý muốn>
- **Use cases chính (ưu tiên):**

## 3. Hành vi khi MƠ HỒ / thiếu thông tin  ⭐
> Đây là quyết định cốt lõi của một assistant. Tham chiếu [INTERACTION_PATTERNS.md](../INTERACTION_PATTERNS.md).
- Khi intent người dùng không rõ → assistant **hỏi lại / đoán-rồi-nêu / từ chối**? <chọn & nêu lý do>
- **Ngưỡng confidence** để hành động vs hỏi lại: `<TBD>`
- Số câu hỏi tối đa trước khi phải hành động: `<TBD>`

## 4. Tone & Persona
- Giọng điệu (formal/thân thiện/ngắn gọn…):
- Điều assistant **không bao giờ** nói/làm về mặt phong cách:
- Ngôn ngữ hỗ trợ:

## 5. Guardrails & Safety  ⭐
> Tuân [SECURITY_STANDARDS.md](../SECURITY_STANDARDS.md) — đặc biệt §2 (OWASP LLM Top 10).
- **Refusal policy:** loại yêu cầu nào phải từ chối + cách từ chối (xem pattern Refusal trong INTERACTION_PATTERNS).
- **Dữ liệu nhạy cảm / PII:** thu thập gì, lưu gì, ẩn/mask thế nào, tuân quy định nào.
- **Prompt injection / lạm dụng:** biện pháp phòng (tách system/user content, kiểm tra đầu ra…).
- **Nội dung cấm / giới hạn:**

## 6. Định nghĩa "ĐÚNG" (vì output phi xác định)  ⭐
> Không thể dùng một `assertEquals` cho output AI. Phải định nghĩa *thế nào là tốt*.
- **Rubric đánh giá** (tiêu chí + thang điểm): vd đúng-sự-thật / bám-yêu-cầu / an-toàn / giọng-điệu.
- **Golden examples** (input → hành vi/đầu ra mong đợi): ≥ 5–10 ví dụ đại diện, gồm cả ca khó/biên.
  | Input | Hành vi/đầu ra mong đợi | Vì sao |
  |-------|-------------------------|--------|
  | | | |

## 7. Eval strategy  ⭐
- **Bộ eval tự động** chạy trên golden set (chấm theo rubric §6) — coi như "test" của feature AI.
- **Regression prompt:** khi đổi prompt/model → chạy lại eval, so điểm trước/sau.
- Ngưỡng đậu: `<TBD>` (vd điểm rubric trung bình ≥ X, không ca an-toàn nào fail).
- Quan hệ với DoD: bổ sung vào [DEFINITION_OF_DONE.md](../DEFINITION_OF_DONE.md) cho feature AI.

## 8. Fallback & Human-in-the-loop  ⭐
- Khi model **fail / timeout / low-confidence** → assistant làm gì? (xin lỗi + gợi ý / trả kết quả một phần / chuyển người thật).
- **Điểm cần con người** (HITL): hành động nào cần người duyệt trước khi thực thi?
- Hành vi khi tool/API phụ thuộc lỗi.

## 9. Model, chi phí & hiệu năng
> Tuân [PERFORMANCE_STANDARDS.md](../PERFORMANCE_STANDARDS.md) §2 (AI-specific).
- Model dùng (vd Claude Opus/Sonnet/Haiku) + lý do; **prompt caching BẮT BUỘC** cho phần prompt tĩnh.
- Token budget / chi phí mục tiêu mỗi request (ceiling).
- Latency mục tiêu (p95).

## 10. Observability
- Log gì (có ẩn PII), cách đánh giá chất lượng *sau khi* lên prod (thu feedback, sample review).
- Metric theo dõi (tỉ lệ refusal, confidence, độ hài lòng…).

## 11. Acceptance Criteria
- [ ] <tiêu chí 1 — đo được>
- [ ] Eval đạt ngưỡng §7
- [ ] Guardrails §5 đã kiểm thử (gồm ca lạm dụng)

## 12. API / Interface contract (cho parallelize)
> Bắt buộc chốt trước khi spawn FE & BE song song (xem AGENCY_WORKFLOW Phase 2/3).

## 13. Decision Log
| Ngày | Câu hỏi/Vấn đề | Quyết định | Người quyết | Lý do |
|------|----------------|-----------|-------------|-------|
| | | | | |

## 14. Assumptions Register
| Giả định | Trạng thái (chờ/đã xác nhận/bác bỏ) |
|----------|-------------------------------------|
| | |
