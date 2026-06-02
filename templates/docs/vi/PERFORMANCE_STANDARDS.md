# Performance Standards

> Budget hiệu năng **đo được** cho {{PROJECT_NAME}}. Là một phần của [DEFINITION_OF_DONE.md](./DEFINITION_OF_DONE.md) và được xét ở **Phase 2 (đặt budget)** + **Phase 4 (kiểm)** trong [AGENCY_WORKFLOW.md](./AGENCY_WORKFLOW.md).
>
> Điền `<TBD>` theo yêu cầu sản phẩm khi chốt ở PRD/TDD đầu tiên.

## 1. Budget chung (parameter hoá)
- **Latency**: API p95 ≤ `<TBD>` ms, p99 ≤ `<TBD>` ms.
- **Throughput**: ≥ `<TBD>` req/s ở tải mục tiêu.
- **Kích thước**: payload/response ≤ `<TBD>`; bundle frontend (nếu có) ≤ `<TBD>` KB.
- **Database**: không N+1; số query mỗi request ≤ `<TBD>`; có index cho truy vấn nóng.
- **Memory/CPU**: không leak; mức nền ≤ `<TBD>`.

## 2. AI-specific (bắt buộc cho feature AI)
> Tham chiếu chéo `templates/PRD_AI_FEATURE.md §9`.
- **Prompt caching — BẮT BUỘC**: tận dụng caching của Claude cho phần prompt tĩnh (system, tài liệu nền) để giảm chi phí & độ trễ. Đây là đòn bẩy lớn nhất.
- **Chọn model theo task**: dùng model nhẹ nhất đủ dùng (Haiku → Sonnet → Opus); không mặc định model mạnh nhất cho mọi việc.
- **Token/cost ceiling**: trần token & chi phí mỗi request `<TBD>`; cảnh báo khi vượt.
- **Streaming**: stream phản hồi dài để giảm thời gian chờ cảm nhận.
- **Context discipline**: chỉ nạp context cần thiết; tránh nhồi toàn bộ tài liệu vào mỗi lượt.
- **Batching**: gộp khi xử lý khối lượng lớn không cần realtime.

## 3. Gate hồi quy hiệu năng
- **`change/` + `refactor/` chạm hot-path**: đo **bench trước & sau**, không để xấu đi quá `<TBD>`%.
- **Feature** (Full path): có ít nhất 1 phép đo/đánh giá tải cho luồng quan trọng trước khi merge.
- **Observability**: theo dõi p95/p99, token/cost, error rate sau khi lên prod (xem PRD §10).

## 4. Checklist theo path (đưa vào DoD)
- **Fast path**: không gây hồi quy hiệu năng rõ rệt; không thêm N+1.
- **Standard path**: + bench trước/sau cho code chạm hot-path; + (AI) prompt caching còn nguyên/được áp dụng.
- **Full path**: + đạt budget §1; + (feature AI) đạt token/latency ceiling §2; + có số đo tải cho luồng chính.
