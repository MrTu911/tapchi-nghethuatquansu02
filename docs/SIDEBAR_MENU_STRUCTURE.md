# Cấu Trúc Menu Sidebar Dashboard v2.1

## Tổng Quan

Sidebar menu đã được tái cấu trúc hoàn toàn để phù hợp với quy trình xuất bản bài báo khoa học và phân quyền rõ ràng cho từng vai trò.

## Quy Trình Xuất Bản Bài Báo

Menu được tổ chức theo 7 bước trong quy trình xuất bản:

### 1️⃣ Nộp Bài (AUTHOR)
- **Vai trò**: Tác giả, Admin
- **Chức năng**:
  - Nộp bài mới: Gửi bản thảo nghiên cứu
  - Bài đã nộp: Quản lý và theo dõi bài của mình

### 2️⃣ Biên Tập - Tiếp nhận (EDITOR)
- **Vai trò**: Section Editor, Managing Editor, EIC, Admin
- **Chức năng**:
  - Bài cần xử lý: Xem danh sách bài chờ
  - Gán phản biện: Chỉ định reviewer
  - Quy trình & Deadline: Theo dõi tiến độ

### 3️⃣ Phản Biện (REVIEWER)
- **Vai trò**: Reviewer, Admin
- **Chức năng**:
  - Bài cần phản biện: Danh sách bài được giao
  - Lịch sử phản biện: Các bài đã đánh giá

### 4️⃣ Biên Tập - Quyết định (EDITOR)
- **Vai trò**: Section Editor, Managing Editor, EIC, Admin
- **Chức năng**:
  - Đưa ra quyết định: Chấp nhận, từ chối, yêu cầu chỉnh sửa
  - Quản lý trao đổi với tác giả

### 5️⃣ Sản Xuất (LAYOUT_EDITOR)
- **Vai trò**: Layout Editor, Managing Editor, EIC, Admin
- **Chức năng**:
  - Hàng đợi Sản xuất: Trình bày và định dạng bài

### 6️⃣ Kho Bài Báo (REPOSITORY)
- **Vai trò**: Editor trở lên, Admin
- **Chức năng**:
  - Tất cả Bài báo: Danh sách đầy đủ
  - Tìm kiếm Nâng cao: Tra cứu chi tiết

### 7️⃣ Xuất Bản (Được quản lý trong phần Quản lý Nội dung)

## Phân Quyền Theo Vai Trò

### 🔵 Tất Cả Người Dùng
**Phần: Tổng quan**
- Bảng điều khiển
- Trang chủ công khai
- Thông báo
- Tin nhắn
- Hồ sơ cá nhân

### 📝 Tác Giả (AUTHOR)
**Quyền truy cập**:
- Tổng quan
- 1. Nộp Bài

### 🔍 Phản Biện Viên (REVIEWER)
**Quyền truy cập**:
- Tổng quan
- 3. Phản Biện

### ✏️ Biên Tập Viên Chuyên Mục (SECTION_EDITOR)
**Quyền truy cập**:
- Tổng quan
- 2/4. Biên Tập
- 6. Kho Bài Báo

### 🎨 Biên Tập Bố Cục (LAYOUT_EDITOR)
**Quyền truy cập**:
- Tổng quan
- 5. Sản Xuất

### 📋 Thư Ký Tòa Soạn (MANAGING_EDITOR)
**Quyền truy cập**:
- Tất cả các phần workflow (1-6)
- Quản lý Nội dung (Issues, Volumes, Categories...)
- Quản lý Người dùng
- CMS & Website
- Một số chức năng Hệ thống

### 👑 Tổng Biên Tập (EIC)
**Quyền truy cập**:
- Tất cả các phần workflow (1-6)
- Quản lý Nội dung
- Quản lý Người dùng
- CMS & Website
- Hệ thống & Phân tích
- Bảo mật & Audit (xem)

### 🛡️ Admin (SYSADMIN)
**Quyền truy cập**: **TẤT CẢ**
- Tất cả các phần workflow (1-6)
- Quản lý Nội dung (đầy đủ)
- Quản lý Người dùng (đầy đủ)
- CMS & Website (đầy đủ)
- Hệ thống & Phân tích (đầy đủ)
- Bảo mật & Audit (đầy đủ)
- Cấu hình hệ thống
- Tích hợp
- Giao diện & Theme

## Các Phần Dành Riêng Cho Admin

### 📚 Quản lý Nội dung
- Số Tạp chí (Issues)
- Tập (Volumes)
- Chuyên mục
- Từ khóa
- Metadata & Xuất bản

### 👥 Quản lý Người dùng
- Tất cả Người dùng
- Phản biện viên
- Quyền (RBAC)
- Phiên đăng nhập

### 🌐 CMS & Website
- Trang chủ
- Trang công khai
- Tin tức
- Banner & Slider
- Thư viện Media
- Video
- Menu điều hướng
- Cài đặt Website

### ⚙️ Hệ thống & Phân tích
- Thống kê Tổng quan
- Phân tích Chi tiết
- Báo cáo & Export
- Quy trình Workflow
- Cài đặt Phản biện
- Tích hợp
- Giao diện & Theme

### 🔐 Bảo mật & Audit
- Cảnh báo Bảo mật
- Nhật ký Bảo mật
- Nhật ký Kiểm toán

## Tính Năng Mới

### ✅ Thu Gọn Tự Động
- Menu tự động lưu trạng thái thu gọn vào localStorage
- Trạng thái được giữ nguyên khi reload trang
- Mặc định: Chỉ phần "Tổng quan" được mở

### ✅ Nút Thu Gọn/Mở Rộng Tất Cả
- Nằm ở góc phải header sidebar
- Click để thu gọn hoặc mở rộng tất cả các section
- Icon động: ChevronDown (đang mở) / ChevronRight (đang đóng)

### ✅ Mô Tả Chi Tiết
- Mỗi section có description ngắn gọn
- Mỗi menu item có tooltip mô tả chức năng
- Giúp người dùng hiểu rõ hơn về từng chức năng

### ✅ Đánh Số Theo Workflow
- Các phần workflow được đánh số rõ ràng (1-6)
- Giúp hiểu rõ quy trình xuất bản
- Phù hợp với các tài liệu SOP

### ✅ Icon Phân Biệt
- Mỗi section có icon riêng biệt
- Dễ nhận diện visually
- Tăng tính thẩm mỹ của UI

## Ví Dụ Menu Theo Vai Trò

### Author (Tác giả)
```
📊 Tổng quan
  ├─ Bảng điều khiển
  ├─ Trang chủ công khai
  ├─ Thông báo
  ├─ Tin nhắn
  └─ Hồ sơ cá nhân

📤 1. Nộp Bài
  ├─ Nộp bài mới
  └─ Bài đã nộp
```

### Reviewer (Phản biện viên)
```
📊 Tổng quan
  └─ ...

✅ 3. Phản Biện
  ├─ Bài cần phản biện
  └─ Lịch sử phản biện
```

### Admin (Quản trị viên)
```
📊 Tổng quan
  └─ ...

📤 1. Nộp Bài
  └─ ...

✅ 3. Phản Biện
  └─ ...

✏️ 2/4. Biên Tập
  └─ ...

🎨 5. Sản Xuất
  └─ ...

📦 6. Kho Bài Báo
  └─ ...

📚 Quản lý Nội dung
  ├─ Số Tạp chí
  ├─ Tập (Volumes)
  ├─ Chuyên mục
  ├─ Từ khóa
  └─ Metadata & Xuất bản

👥 Quản lý Người dùng
  ├─ Tất cả Người dùng
  ├─ Phản biện viên
  ├─ Quyền (RBAC)
  └─ Phiên đăng nhập

🌐 CMS & Website
  ├─ Trang chủ
  ├─ Trang công khai
  ├─ Tin tức
  ├─ Banner & Slider
  ├─ Thư viện Media
  ├─ Video
  ├─ Menu điều hướng
  └─ Cài đặt Website

⚙️ Hệ thống & Phân tích
  ├─ Thống kê Tổng quan
  ├─ Phân tích Chi tiết
  ├─ Báo cáo & Export
  ├─ Quy trình Workflow
  ├─ Cài đặt Phản biện
  ├─ Tích hợp
  └─ Giao diện & Theme

🔐 Bảo mật & Audit
  ├─ Cảnh báo Bảo mật
  ├─ Nhật ký Bảo mật
  └─ Nhật ký Kiểm toán
```

## Hướng Dẫn Sử Dụng

### Cho Người Dùng
1. **Điều hướng**: Click vào menu item để truy cập trang
2. **Thu gọn section**: Click vào header của section
3. **Thu gọn tất cả**: Click icon ở góc phải header sidebar
4. **Xem mô tả**: Hover chuột vào menu item (tooltip)

### Cho Nhà Phát Triển
1. **File chính**: `components/dashboard/sidebar.tsx`
2. **Thêm menu item**: Thêm vào mảng `items` của section tương ứng
3. **Phân quyền**: Cập nhật mảng `roles` cho menu item
4. **LocalStorage key**: `sidebar-collapsed-sections`

## Lưu Ý Kỹ Thuật

- Menu sử dụng React useState và useEffect
- Trạng thái thu gọn được lưu vào localStorage
- Phân quyền sử dụng hàm `can.*()` từ `@/lib/rbac`
- Responsive: Tự động chuyển sang mobile sidebar trên màn hình nhỏ
- Icons từ lucide-react
- Styling với Tailwind CSS

## Version History

- **v2.1** (Latest): 
  - Tổ chức menu theo quy trình workflow
  - Thêm tính năng thu gọn tự động
  - Thêm nút thu gọn/mở rộng tất cả
  - Phân quyền rõ ràng hơn
  - Admin có đầy đủ chức năng

- **v2.0**: 
  - Cấu trúc menu cơ bản
  - Phân quyền theo vai trò

---

**Lưu ý**: Tài liệu này mô tả cấu trúc menu sidebar. Để biết chi tiết về từng chức năng cụ thể, vui lòng tham khảo tài liệu của module tương ứng.
