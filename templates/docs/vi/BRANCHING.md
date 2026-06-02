# Branching & Commit Convention

> Mô hình: **GitLab flow** cho nhóm nhỏ 2–5 người. `main` luôn ở trạng thái deploy được.

## Nhánh
- **`main`** — protected. KHÔNG commit/push trực tiếp. Mọi thay đổi vào qua **Merge Request (MR)**.
- Nhánh làm việc ngắn hạn, tạo từ `main`, đặt tên `<type>/<mô-tả-ngắn-kebab>`:

| Tiền tố | Dùng cho | Loại task (router) |
|---------|----------|--------------------|
| `feat/` | tính năng mới | #7 |
| `fix/` | sửa bug | #3 |
| `change/` | đổi logic tính năng đã có | #5 |
| `refactor/` | dọn code, không đổi hành vi | #6 |
| `chore/` | build, deps, config | #2 |
| `docs/` | chỉ tài liệu | #2 |
| `hotfix/` | vá khẩn cấp prod (off `main`) | #4 |
| `spike/` | nghiên cứu/POC (vứt đi, không merge code) | #8 |

Ví dụ: `feat/user-login`, `fix/null-cart-total`, `change/discount-rounding`.

## Merge Request
- **Bắt buộc ≥ 1 reviewer** duyệt trước khi merge.
- Phải thỏa [DEFINITION_OF_DONE.md](./DEFINITION_OF_DONE.md) của path tương ứng (CI xanh).
- **Squash merge** vào `main` để giữ lịch sử sạch (1 nhánh = 1 commit ý nghĩa).
- Xóa nhánh sau khi merge.
- Mô tả MR nêu rõ **what + why**, link PRD/TDD nếu là Standard/Full.

## Commit — Conventional Commits
Định dạng: `<type>(<scope>): <mô tả>` — type khớp tiền tố nhánh: `feat` `fix` `refactor` `chore` `docs` `test` `perf`.

```
feat(auth): thêm đăng nhập bằng email
fix(cart): xử lý total null khi giỏ rỗng
```

- BREAKING CHANGE: thêm `!` sau type (`feat!:`) hoặc footer `BREAKING CHANGE:`.
- KHÔNG dùng `--no-verify` / `--no-gpg-sign` trừ khi User yêu cầu rõ (hook sẽ chặn).

## Hotfix & backport
1. Tạo `hotfix/<...>` từ `main`.
2. Vá tối thiểu + test tái hiện → MR nhanh (vẫn cần review) → merge vào `main`.
3. **Backport**: cherry-pick/merge thay đổi đó về nhánh phát triển đang mở để không bị mất khi nhánh đó merge sau.
4. Ghi lại sự cố để hậu kiểm (Phase 5 retro).
