# Brownfield Discovery

Dùng tài liệu này khi project đã có code sẵn và tài liệu có thể thiếu, cũ, hoặc nằm ngoài cấu trúc chuẩn.

## Khi nào chạy

Với project cũ chưa từng dùng hero-vibe-kit:

```bash
npx hero-vibe-kit init
npx hero-vibe-kit discover
npx hero-vibe-kit doctor
```

`init` cài workflow. `discover` quét repo hiện tại và tạo `docs/BROWNFIELD_DISCOVERY.md` làm bản đồ bằng chứng ban đầu.

## AI phải làm gì sau `discover`

1. Đọc `docs/BROWNFIELD_DISCOVERY.md` trước.
2. Đọc mọi nguồn tài liệu được liệt kê trong đó, kể cả khi nằm ngoài `docs/`.
3. Đọc config để nhận diện stack, entry point, lệnh chạy, yêu cầu environment và tín hiệu CI.
4. Xem các khu vực code có khả năng quan trọng và lập bản đồ module chính, màn hình/route, API handler, data layer, tích hợp ngoài và test.
5. Ghi nhận kết quả với nhãn độ chắc chắn:
   - **Đã thấy** — quan sát trực tiếp trong file.
   - **Có khả năng** — suy ra từ tên/cấu trúc, chưa chứng minh.
   - **Cần xác nhận** — cần người xác nhận hoặc thiếu ngữ cảnh nghiệp vụ.

## Không được tự giả định

- Không mặc định tài liệu luôn nằm trong `docs/`.
- Không kết luận thiếu docs nghĩa là thiếu hành vi.
- Không kết luận vai trò thư mục chỉ từ tên trước khi đọc file.
- Không nói một lệnh đã pass nếu chưa chạy.

## Output mong đợi sau lượt đọc đầu tiên của AI

Sau khi đọc repo, cập nhật discovery report hoặc tạo report trong `docs/reports/` với:

- mục đích project,
- vai trò người dùng chính,
- luồng quan trọng,
- cấu trúc code,
- lệnh kiểm chứng có thể dùng,
- vùng rủi ro/chưa rõ,
- câu hỏi còn mở cho người.
