# Communication Protocol — Human ↔ AI

> Hợp đồng giao tiếp giữa **người** (Product Owner / Dev) và **các agent AI** trong dự án. Áp dụng cho **mọi tương tác**, đặc biệt khi **làm rõ yêu cầu** (Phase 1). Là một phần bắt buộc của [AGENCY_WORKFLOW.md](./AGENCY_WORKFLOW.md).
>
> Vì sản phẩm này *là* một AI assistant, chất lượng làm rõ yêu cầu quyết định chất lượng sản phẩm — giao thức này nhằm loại bỏ hiểu lầm ngầm.

## 1. Ngôn ngữ & phong cách
- Dùng ngôn ngữ làm việc của team khi trao đổi với User.
- Ưu tiên lời giải thích dễ hiểu, hạn chế thuật ngữ kỹ thuật khó. Khi bắt buộc dùng thuật ngữ, giữ thuật ngữ tiếng Anh và giải thích ngắn bằng ngôn ngữ đời thường ở lần đầu xuất hiện.
- Giải thích từ mục tiêu của User trước, chỉ nói chi tiết triển khai khi cần hoặc khi User yêu cầu.
- Ngắn gọn, trực diện, không vòng vo. Trình bày phương án quan trọng kèm khuyến nghị rõ ràng.
- Response style mặc định: ít chữ nhất, nhiều tín hiệu nhất. Đưa kết quả quan trọng nhất lên đầu.
- Ưu tiên ký hiệu gọn khi rõ nghĩa: `=` cho nghĩa/kết quả, `->` cho luồng/kết quả, `:` cho giải thích, `-` cho bullet, `|` cho so sánh.
- Tránh mở bài dài, lặp context, lời lịch sự dư thừa, câu động viên và chuyển ý không cần thiết.
- Chỉ mở rộng khi User yêu cầu, gate cần chi tiết, hoặc loại artifact cần đủ nội dung.
- Trích dẫn `file:line` khi nói về code.

## 2. Nguyên tắc cốt lõi
1. **No silent assumptions** — Không bao giờ tự bịa thông tin còn thiếu. Khi thiếu, hoặc **HỎI**, hoặc nêu **giả định tường minh** gắn nhãn `GIẢ ĐỊNH:` để User dễ bác bỏ.
2. **Phân tầng độ chắc chắn** — Tách bạch rõ:
   - ✅ **Chắc chắn** (đã đọc code/tài liệu, có bằng chứng)
   - 🤔 **Suy đoán** (suy luận hợp lý nhưng chưa kiểm chứng)
   - ❓ **Cần xác nhận** (phụ thuộc quyết định của User)
3. **Sự thật trên sự đồng thuận** — AI phản biện khi thấy yêu cầu mâu thuẫn/rủi ro, không "gật cho xong". (Chiều ngược lại: khi nhận feedback, dùng skill `receiving-code-review` — kiểm chứng kỹ thuật, không đồng ý hình thức.)
4. **Bằng chứng trước khẳng định** — Không tuyên bố "đã xong/đã pass" khi chưa chạy lệnh kiểm chứng (xem `verification-before-completion`).

## 3. Giao thức làm rõ yêu cầu
### 3.1. Phân loại câu hỏi
| Loại | Định nghĩa | Cách xử lý |
|------|-----------|-----------|
| **Blocking** | Không có câu trả lời thì KHÔNG thể đi tiếp đúng hướng (vd: phạm vi, đối tượng dùng, ràng buộc cứng) | Phải hỏi & chờ User trả lời |
| **Non-blocking** | Có giá trị mặc định hợp lý | AI **tự quyết theo default**, nêu rõ `GIẢ ĐỊNH:` đã dùng để User chỉnh sau |

> Mục tiêu: không chặn tiến độ vì những thứ có default hợp lý; chỉ chặn ở những điều thực sự cần quyết định của người.

### 3.2. Cách hỏi
- **Câu hỏi độc lập** → gom lại hỏi một lượt qua **`AskUserQuestion`** (tối đa ~4 câu, mỗi câu có option + khuyến nghị).
- **Câu hỏi thăm dò / phụ thuộc nhau** → hỏi **tuần tự, một câu mỗi lần** (theo skill `brainstorming`) để câu sau dựa trên câu trước.
- Ưu tiên câu hỏi dạng lựa chọn hơn câu mở khi có thể.

### 3.3. Kết thúc mỗi vòng làm rõ
Mỗi lượt làm rõ phải khép lại bằng 3 mục:
1. **Tóm tắt hiểu biết hiện tại** (1 đoạn ngắn — để User soi sai sót).
2. **Câu hỏi còn mở** (blocking nào chưa trả lời).
3. **Giả định đang giữ** (assumptions register — danh sách `GIẢ ĐỊNH:` đang dùng).

## 4. Xác nhận, sign-off & sửa hiểu lầm
- **Gate = Plan Mode thật**: chốt PRD/TDD qua `EnterPlanMode → ExitPlanMode`, không phải câu chữ "chờ duyệt".
- **Đóng vòng khi hiểu sai (loop repair)**: khi User sửa/đính chính → AI **nhắc lại cách hiểu MỚI bằng lời của mình** và **chờ User xác nhận** trước khi tiếp tục. Không âm thầm "tự hiểu lại".
- Sau khi User duyệt, coi đó là **commitment** — nếu muốn đổi, mở lại gate, không tự ý đổi hướng.

## 5. Decision log & Assumptions register
Mỗi feature ghi trong PRD (xem template):
- **Decision Log**: `| Ngày | Câu hỏi/Vấn đề | Quyết định | Người quyết | Lý do |` — để sau này biết "vì sao hồi đó chọn thế".
- **Assumptions Register**: danh sách giả định đang giữ + trạng thái (`chờ xác nhận` / `đã xác nhận` / `đã bác bỏ`).

## 6. Quy tắc cho sub-agent (đa agent)
- **Sub-agent KHÔNG giao tiếp trực tiếp với User.** Nếu thiếu thông tin / gặp quyết định cần người → **báo Main Agent**, Main Agent tổng hợp rồi mới hỏi User. Tránh nhiều agent hỏi loạn, mâu thuẫn.
- Main Agent là **một cửa giao tiếp duy nhất** với User.
- Prompt giao cho sub-agent phải **self-contained** (xem [TEAM_ROSTER.md](./TEAM_ROSTER.md)) — gồm cả các giả định/quyết định liên quan đã chốt với User.

## 7. Liên quan
- [AGENCY_WORKFLOW.md](./AGENCY_WORKFLOW.md) — Phase 1 áp dụng giao thức này.
- [templates/PRD_AI_FEATURE.md](./templates/PRD_AI_FEATURE.md) — các chiều cần làm rõ cho feature AI.
- [INTERACTION_PATTERNS.md](./INTERACTION_PATTERNS.md) — cách *sản phẩm* giao tiếp với end-user (khác với tài liệu này: đây là người↔AI trong quá trình phát triển).
