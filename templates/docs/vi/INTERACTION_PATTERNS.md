# Interaction Patterns — Assistant ↔ End-User (Product Layer)

> Thư viện **pattern giao tiếp của SẢN PHẨM với người dùng cuối**. Khác với [COMMUNICATION_PROTOCOL.md](./COMMUNICATION_PROTOCOL.md) (người↔AI trong lúc *phát triển*) — đây là cách *assistant đã build* nói chuyện với *end-user*.
>
> Là **tài sản dùng lại**: mỗi PRD feature AI (mục §3, §5, §8 của [template](./templates/PRD_AI_FEATURE.md)) tham chiếu các pattern ở đây thay vì thiết kế lại từ đầu. Ngưỡng/ chi tiết cụ thể (`<TBD>`) chốt ở từng PRD.

## Nguyên tắc nền
1. **Người dùng luôn nắm quyền kiểm soát** — assistant hỗ trợ, không tự ý thay người quyết định việc khó đảo ngược.
2. **Minh bạch giới hạn** — nói rõ khi không chắc, không biết, hoặc không làm được; không bịa.
3. **Chi phí lỗi định hình hành vi** — việc rủi ro thấp → cứ làm; rủi ro cao/khó đảo ngược → xác nhận trước.

---

## P1 — Clarification (làm rõ ý định)
- **Khi nào hỏi lại:** intent mơ hồ, thiếu tham số bắt buộc, hoặc nhiều cách hiểu dẫn tới kết quả rất khác.
- **Khi nào KHÔNG hỏi:** có default an toàn/rõ ràng → cứ làm và **nêu giả định đã dùng** ("Mình hiểu là X, nếu không đúng cho mình biết nhé").
- **Cách hỏi:** một câu hỏi trọng tâm, kèm 2–4 lựa chọn nếu được; không tra tấn bằng chuỗi câu hỏi.
- **Ngưỡng:** tối đa `<TBD>` câu trước khi đưa ra nỗ lực tốt nhất.

## P2 — Confirmation (xác nhận trước hành động)
- **Bắt buộc xác nhận** trước hành động: khó đảo ngược, ảnh hưởng dữ liệu/tiền/người khác, hoặc ra ngoài (gửi mail, public…).
- **Không cần** với hành động đọc/không phá hủy.
- Nêu rõ **việc sắp làm + hệ quả** rồi mới hỏi đồng ý.

## P3 — Uncertainty / Low-confidence (thể hiện độ chắc)
- Khi không chắc → **nói rõ mức độ chắc** + đề nghị kiểm chứng, thay vì khẳng định chắc nịch.
- Trích nguồn/grounding khi có. Phân biệt "mình biết" vs "mình suy đoán".

## P4 — Error & Graceful Degradation (lỗi & suy giảm mượt)
- Lỗi → giải thích **bằng ngôn ngữ người dùng** (không nuốt lỗi, không đổ stack trace).
- Ưu tiên **kết quả một phần + nêu phần thiếu** hơn là fail trắng.
- Gợi ý bước tiếp theo / cách thử lại.

## P5 — Refusal (từ chối an toàn)
- Cấu trúc: **từ chối ngắn gọn + lý do + (nếu có) hướng thay thế hợp lệ**.
- Giữ giọng tôn trọng, không phán xét; không tiết lộ chi tiết nội bộ về cách lọc.
- Phân biệt "không được phép" vs "không làm được" vs "cần thêm thông tin".

## P6 — Handoff to Human (chuyển người thật)
- Khi nào escalate: vượt phạm vi, rủi ro cao, người dùng yêu cầu, hoặc lặp lại thất bại.
- Chuyển kèm **tóm tắt ngữ cảnh** để người tiếp nhận không phải hỏi lại từ đầu.

## P7 — Conversation Repair (sửa khi hiểu sai)
- Người dùng nói "không phải vậy" → assistant **nhận lỗi gọn, nhắc lại cách hiểu mới, xác nhận** rồi mới tiếp.
- Không lặp lại cùng câu trả lời sai; không phòng thủ.

## P8 — Memory & Privacy (ghi nhớ & riêng tư)
- Nói rõ assistant **nhớ gì / không nhớ gì**; cho người dùng cách xem/xoá.
- Không phơi dữ liệu nhạy cảm trong phản hồi/log; tuân chính sách PII ở PRD §5.

## P9 — Tone & Consistency (giọng điệu nhất quán)
- Một persona thống nhất xuyên các feature (chốt ở [TEAM_ROSTER.md](./TEAM_ROSTER.md) §3 / PRD §4).
- Ngắn gọn mặc định; chi tiết khi người dùng cần.

---

## Cách dùng
Trong PRD feature AI: ở §3 (mơ hồ) trỏ **P1**; §5 (safety) trỏ **P5/P8**; §8 (fallback) trỏ **P4/P6/P7**; §4 (tone) trỏ **P9**. Mỗi pattern điền ngưỡng/chi tiết cụ thể cho feature đó.
