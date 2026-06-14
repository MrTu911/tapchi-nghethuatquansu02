# HƯỚNG DẪN SỬ DỤNG — VAI TRÒ QUẢN TRỊ HỆ THỐNG
## Hệ thống Tạp chí điện tử — Tạp chí Nghệ thuật Quân sự Việt Nam (Học viện Quốc phòng)

> Tài liệu dành cho **Quản trị hệ thống (SYSADMIN)** — toàn quyền kỹ thuật & vận hành:
> người dùng, phân quyền, tích hợp, cấu hình, bảo mật. Đây là vai trò **mạnh nhất** về kỹ thuật.
> Xem thêm: `docs/huong-dan/README.md`.

---

## MỤC LỤC
1. [Vai trò & nguyên tắc an toàn](#1-vai-trò--nguyên-tắc-an-toàn)
2. [Đăng nhập & bảng điều khiển](#2-đăng-nhập--bảng-điều-khiển)
3. [Quản lý người dùng & phân quyền (RBAC)](#3-quản-lý-người-dùng--phân-quyền-rbac)
4. [Quản lý nội dung & CMS](#4-quản-lý-nội-dung--cms)
5. [Hệ thống & Phân tích](#5-hệ-thống--phân-tích)
6. [Bảo mật & Audit](#6-bảo-mật--audit)
7. [Web Crawler](#7-web-crawler)
8. [Lưu ý vận hành](#8-lưu-ý-vận-hành)

---

## 1. Vai trò & nguyên tắc an toàn
Quản trị hệ thống có quyền cao nhất về kỹ thuật: tạo/sửa người dùng, cấu hình phân quyền, tích hợp,
sao lưu, bảo trì. Đây cũng là vai trò **duy nhất** được gán các vai trò cấp cao (Phó/Tổng biên tập,
Kiểm định bảo mật, Quản trị) cho người khác.

> ⚠️ Vì quyền lớn, **bắt buộc bật 2FA**, hạn chế dùng tài khoản này cho thao tác hằng ngày, và luôn để lại
> dấu vết trong nhật ký kiểm toán.

---

## 2. Đăng nhập & bảng điều khiển
Vào `/auth/login` (demo: `admin@tapchintqsvn.edu.vn` / `TapChi@2025`) → **Bảng điều khiển Quản trị** (`/dashboard/admin`).

Dashboard tổng hợp tình trạng hệ thống: người dùng, bài/đợt xuất bản, hoạt động, cảnh báo.

---

## 3. Quản lý người dùng & phân quyền (RBAC)
**Vào:** **Quản lý Người dùng**.

| Chức năng | Đường dẫn | Nội dung |
|---|---|---|
| Tất cả Người dùng | `/dashboard/admin/users` | Xem/tạo/sửa/khóa tài khoản, **duyệt đăng ký**, **gán mọi vai trò** |
| Phản biện viên | `/dashboard/admin/reviewers` | Quản lý hồ sơ & năng lực phản biện viên |
| Quyền (RBAC) | `/dashboard/admin/permissions` | Cấu hình quyền chi tiết cho từng vai trò |
| Phiên đăng nhập | `/dashboard/admin/sessions` | Xem & **thu hồi** phiên đăng nhập |

> **Gán vai trò cấp cao:** chỉ Quản trị hệ thống mới gán được `DEPUTY_EIC`, `EIC`, `SECURITY_AUDITOR`, `SYSADMIN`
> (chống leo thang quyền). Tạo người dùng mới: trang Người dùng → *Tạo người dùng* (`/dashboard/admin/users/create`).

---

## 4. Quản lý nội dung & CMS
- **Quản lý Nội dung:** Số Tạp chí, Tập, Chuyên mục, Từ khóa, Metadata & Xuất bản (`/dashboard/admin/issues`, `/volumes`, `/categories`, `/keywords`, `/metadata`).
- **CMS & Website:** Trang chủ, Trang công khai, Tin tức, Thông báo, Banner & Slider, Thư viện Media, Video, Podcast, Menu điều hướng, **Cài đặt Website** (`/dashboard/admin/cms/*`, `/dashboard/admin/news`, `/dashboard/admin/banners`).

> Khi sửa **Cài đặt Website**, dùng đúng identity NTQS — Học viện Quốc phòng (ISSN 1859-0454, 93 Hoàng Quốc Việt,
> tapchintqsvn@gmail.com, (069) 556 635).

---

## 5. Hệ thống & Phân tích
**Vào:** **Hệ thống & Phân tích**.

| Chức năng | Đường dẫn |
|---|---|
| Thống kê Tổng quan | `/dashboard/admin/statistics` |
| Phân tích Chi tiết | `/dashboard/admin/analytics` |
| Báo cáo & Export | `/dashboard/admin/reports` |
| **Quy trình Workflow** | `/dashboard/admin/workflow` *(chỉ SYSADMIN)* |
| Cài đặt Phản biện | `/dashboard/admin/review-settings` |
| **Tích hợp** (CrossRef/ORCID…) | `/dashboard/admin/integrations` *(chỉ SYSADMIN)* |
| **Giao diện & Theme** | `/dashboard/admin/ui-config` *(chỉ SYSADMIN)* |

---

## 6. Bảo mật & Audit
**Vào:** **Bảo mật & Audit**: Cảnh báo Bảo mật (`/dashboard/admin/security-alerts`), Nhật ký Bảo mật (`/dashboard/admin/security-logs`), Nhật ký Kiểm toán (`/dashboard/admin/audit-logs`). Phối hợp Kiểm định bảo mật để xử lý sự cố.

---

## 7. Web Crawler
**Vào:** **Web Crawler**: Nguồn Web Crawl (`/dashboard/admin/web-sources`), Nội dung đã Crawl (`/dashboard/admin/crawled-content`) — cấu hình thu thập & xét duyệt nội dung tự động.

---

## 8. Lưu ý vận hành
- **Sao lưu & bảo trì:** thực hiện định kỳ; bật chế độ bảo trì khi cần.
- **Secrets/biến môi trường:** không hard-code, không commit; đổi qua nguồn secret.
- **Database tách biệt:** dùng đúng `tapchi_ntqs`, không trộn với hệ thống khác.
- **Quyền publish:** Quản trị hệ thống về mặt kỹ thuật cũng xuất bản được — nhưng theo nghiệp vụ, **ký xuất bản là việc của Tổng biên tập**; chỉ dùng quyền này khi thật cần.

---

> **Tài khoản demo:** `admin@tapchintqsvn.edu.vn` / `TapChi@2025`.
