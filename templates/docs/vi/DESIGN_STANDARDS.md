# Tiêu chuẩn Design — UI/UX

> **Tiêu chuẩn & hướng dẫn cho UI/UX.** File này chứa *tiêu chuẩn, định tuyến skill, hồ sơ thiết kế (profile), media và trợ giúp trong sản phẩm* — KHÔNG phải trình tự quy trình. Để biết *khi nào* mỗi bước diễn ra (phase, cổng kiểm, router), xem [AGENCY_WORKFLOW.md](./AGENCY_WORKFLOW.md) (SSOT). Các chi tiết riêng của từng dự án được khóa dưới dạng `<TBD>` trong PRD / Design Brief.

## §1 UX ↔ UI (hai lớp)
- **UX (không gian vấn đề):** chân dung người dùng (persona), luồng chính, kiến trúc thông tin, danh mục màn hình, các trạng thái của từng màn hình (trống / đang tải / lỗi / thành công / một phần).
- **UI (bề mặt giải pháp):** thương hiệu, một hướng thị giác đã khóa, design token, hệ thống component.

## §2 Hồ sơ thiết kế (profile) — phù hợp với sản phẩm
Chọn **một** profile cho mỗi dự án (quyết định trong PRD/TDD đầu tiên), ghi lại trong `docs/design/DESIGN_SYSTEM.md` và [TEAM_ROSTER.md](./TEAM_ROSTER.md) §3. Profile xác lập cân bằng *sáng tạo × kỷ luật* và những bước nào bắt buộc so với có thể bỏ qua.

| Profile | Sản phẩm điển hình | Sáng tạo | Kỷ luật | Thương hiệu & media | Bước bắt buộc | Có thể bỏ qua |
|---|---|---|---|---|---|---|
| **system-strict** | công cụ nội bộ, CRUD, admin B2B | thấp | rất cao | tối thiểu; bộ icon chuẩn, không media đặt riêng | một bộ token đã khóa (hướng tinh gọn, ví dụ `minimalist-ui`), bố cục/khoảng cách nghiêm ngặt, tái sử dụng component, a11y, QA tính nhất quán | khám phá thương hiệu, khám phá imagegen, media tùy chỉnh |
| **branded-product** | SaaS / ứng dụng năng suất cho người dùng cuối | trung bình | cao | token thương hiệu + media đặt riêng có chọn lọc (trạng thái trống, minh họa chính) | cổng kiểm hướng thị giác, design system, imagegen cho màn hình chính, media chọn lọc | media marketing nặng, cổng sáng tạo theo từng section |
| **expressive** | tiêu dùng, marketing/landing, đậm thương hiệu | cao | nhất quán | thương hiệu đầy đủ + media nhúng phong phú + chuyển động | thương hiệu, khám phá hướng thị giác, sản xuất media, design system, đánh giá thị giác theo từng section, QA hiệu năng media | — |

Mặc định khi chưa rõ loại sản phẩm: **branded-product**, xác nhận tại cổng kiểm.

## §3 Định tuyến skill thiết kế — công việc → skill
> Cài đặt qua CLI `skills` theo các nhóm trong [skills.manifest.json](../../skills.manifest.json). **Chọn đúng MỘT hướng thị giác** và khóa lại.

| Nhu cầu | Skill | Khi nào |
|---|---|---|
| Thương hiệu / nhận diện (logo, brand board) | `brandkit` | Sản phẩm/thương hiệu mới hoặc tái định vị. Một lần. (branded-product / expressive) |
| **Khóa một hướng thị giác — CHỌN MỘT** | một trong `design-taste-frontend` · `minimalist-ui` · `industrial-brutalist-ui` · `high-end-visual-design` · `gpt-taste` | Tại cổng kiểm Phase-2. Đúng một, rồi khóa. |
| Tạo ảnh tham chiếu (web) | `imagegen-frontend-web` | Khám phá/khóa diện mạo theo từng section trước khi code. |
| Tạo ảnh tham chiếu (mobile) | `imagegen-frontend-mobile` | Khám phá màn hình mobile. |
| Biến ảnh thiết kế đã duyệt thành code | `image-to-code` | Triển khai từ một tham chiếu thị giác đã duyệt. |
| Thiết kế lại / kiểm toán UI hiện có | `redesign-existing-projects` | Hàng router #9 trên các bề mặt hiện có. |
| Wireframe tương tác / lựa chọn thị giác A-B | `brainstorming` + công cụ thị giác đi kèm | Dựng wireframe UX và chọn bố cục. |

**Chọn hướng theo cảm quan:** `minimalist-ui` = biên tập sạch sẽ · `industrial-brutalist-ui` = thô mộc kiểu cơ khí/terminal · `high-end-visual-design` = cảm giác agency đắt tiền · `gpt-taste` = biên tập + chuyển động GSAP · `design-taste-frontend` = mặc định chống "slop" tổng quát.

## §4 Design token & hệ thống
- Token là **nguồn chân lý duy nhất**: màu sắc, thang chữ, khoảng cách, bo góc, đổ bóng, chuyển động.
- **Không có giá trị thiết kế cứng** trong component — tham chiếu token.
- Đặt tên token nhất quán (ngữ nghĩa hơn là chữ nghĩa, ví dụ `color-surface` chứ không phải `gray-100`).
- **Chọn đúng một hướng** cho dự án; không trộn lẫn các skill thiết kế trong cùng một tính năng.

## §5 Nền tảng
- Khai báo phạm vi cho mỗi dự án: chỉ-web / chỉ-mobile / web+mobile.
- **Một nguồn token dùng chung là chuẩn tắc.** Các lớp nền tảng bổ sung các pattern đặc thù theo nền tảng:
  - **Web:** breakpoint responsive, hover/focus, con trỏ + bàn phím.
  - **Mobile:** điều hướng native, quy ước nền tảng (HIG / Material), vùng chạm, vùng an toàn (safe area).
- Định tuyến: `imagegen-frontend-web` so với `imagegen-frontend-mobile`.

## §6 Sản xuất media / asset
Ngoài CSS, sản phẩm thường cần media nhúng.
- **Loại asset:** icon, minh họa, nhiếp ảnh/ảnh hero, ảnh OG/chia sẻ mạng xã hội, sơ đồ, hình ảnh trợ giúp/onboarding (ảnh chụp màn hình có chú thích, GIF/video ngắn — xem §8), chuyển động ngắn tùy chọn (lottie/video).
- **Đường dẫn render:**
  1. Một **nhà cung cấp media AI đã cấu hình** (không phụ thuộc nhà cung cấp; API key lấy từ môi trường của bên tiêu dùng) cho raster/minh họa độ chi tiết cao hơn. Cấu hình qua `hero-vibe-kit init` (chỉ lưu nhà cung cấp + tên biến môi trường).
  2. **Phương án dự phòng dùng subagent Claude** (`imagegen-frontend-web/mobile`, `brandkit`) khi chưa cấu hình nhà cung cấp — tạo tham chiếu, mockup, prompt và các asset trong khả năng.
- **Lưu trữ:** nguồn/tham chiếu & khám phá → `docs/design/assets/` (bền vững, có thể review; giữ nhỏ — file thô lớn để dưới một đường dẫn được gitignore); asset đã tối ưu sẵn-sàng-sản-xuất → thư mục asset riêng của ứng dụng (`<TBD>`).
- **DoD của asset:** đã tối ưu/nén, đúng định dạng (SVG/WebP/AVIF khi phù hợp), rõ bản quyền/có giấy phép, có alt text, có `srcset` responsive khi phù hợp.

## §7 Checklist QA thị giác
- Responsive trên các breakpoint đã khai báo.
- Nền tảng a11y **WCAG AA**: tương phản, focus hiển thị rõ, điều hướng bàn phím, alt text, vùng mốc ngữ nghĩa (landmark).
- Bao phủ mọi trạng thái (trống/đang tải/lỗi/thành công/một phần).
- Đa trình duyệt; chế độ tối (nếu áp dụng); tôn trọng `prefers-reduced-motion`.
- Trọng lượng media nằm trong ngân sách của [PERFORMANCE_STANDARDS.md](./PERFORMANCE_STANDARDS.md).

## §8 Trợ giúp & onboarding trong sản phẩm
Mọi sản phẩm có UI đều phải có một bề mặt trợ giúp trong sản phẩm trên bề mặt **thứ cấp** (dưới biểu tượng `?` / cài đặt / footer — không bao giờ trên thanh điều hướng chức năng chính).
- **Thư viện pattern (chuẩn hóa 4):**
  1. **Trang Trợ giúp/Hướng dẫn riêng** — có section riêng trong điều hướng thứ cấp, mục lục theo tác vụ.
  2. **Onboarding lần đầu** — tour/coachmark, có thể bỏ qua và phát lại.
  3. **Trợ giúp theo ngữ cảnh** — tooltip, gợi ý inline, hướng dẫn ở trạng thái trống nơi người dùng cần.
  4. **FAQ / xử lý sự cố** — câu hỏi thường gặp + giải quyết lỗi, có thể tìm kiếm.
- **Độ sâu theo profile:** `system-strict` = văn bản có cấu trúc + ảnh chụp màn hình; `branded-product` = + ảnh có chú thích + gợi ý trạng thái trống; `expressive` = + tour onboarding + GIF/video ngắn.
- **Nguồn nội dung:** soạn dưới dạng Markdown/MDX trong `docs/help/` (có phiên bản, review được), render trong ứng dụng; phản chiếu (các) ngôn ngữ của dự án; tuân theo nền tảng a11y ở §7.
- **Quy tắc đồng bộ:** một tính năng có tác động đến người dùng **chưa được xem là done** cho đến khi mục trợ giúp của nó tồn tại và chính xác.

## §9 Tạo phẩm (artifact)
Các tạo phẩm thiết kế và nơi lưu trữ chúng được định nghĩa trong [ARTIFACTS_AND_STORAGE.md](./ARTIFACTS_AND_STORAGE.md): đặc tả UX (trong PRD), `docs/design/DESIGN_SYSTEM.md`, `docs/design/assets/`, `docs/help/`, và báo cáo QA thị giác.
