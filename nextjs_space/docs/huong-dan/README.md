# Bộ tài liệu Hướng dẫn sử dụng — theo vai trò
## Tạp chí Nghệ thuật Quân sự Việt Nam (Học viện Quốc phòng)

Hướng dẫn sử dụng hệ thống tạp chí điện tử cho **từng vai trò**. Mỗi tài liệu mô tả chi tiết:
*chức năng → vào đâu (menu + đường dẫn) → các bước → lưu ý nghiệp vụ*, kèm ảnh minh họa.
Mỗi tài liệu có sẵn bản **Markdown** (xem trong repo) và bản **Word `.docx`** (để in/phát hành).

### Khối lãnh đạo biên tập
| Vai trò | Role | Dashboard | Tài liệu | Tài khoản demo |
|---|---|---|---|---|
| Tổng biên tập | `EIC` | `/dashboard/eic` | [tong-bien-tap.md](./tong-bien-tap.md) · `.docx` | tongbientap@tapchintqsvn.edu.vn |
| Phó Tổng biên tập | `DEPUTY_EIC` | `/dashboard/deputy` | [pho-tong-bien-tap.md](./pho-tong-bien-tap.md) · `.docx` | photongbientap@tapchintqsvn.edu.vn |
| Thư ký tòa soạn / BTV chính | `MANAGING_EDITOR` | `/dashboard/managing` | [thu-ky-toa-soan.md](./thu-ky-toa-soan.md) · `.docx` | bientapchinh@tapchintqsvn.edu.vn |

### Khối nghiệp vụ biên tập
| Vai trò | Role | Dashboard | Tài liệu | Tài khoản demo |
|---|---|---|---|---|
| Biên tập viên chuyên mục | `SECTION_EDITOR` | `/dashboard/editor` | [bien-tap-vien-chuyen-muc.md](./bien-tap-vien-chuyen-muc.md) · `.docx` | bientap@tapchintqsvn.edu.vn |
| Biên tập viên dàn trang | `LAYOUT_EDITOR` | `/dashboard/layout` | [bien-tap-vien-dan-trang.md](./bien-tap-vien-dan-trang.md) · `.docx` | dangtrang@tapchintqsvn.edu.vn |
| Phản biện viên | `REVIEWER` | `/dashboard/reviewer` | [phan-bien-vien.md](./phan-bien-vien.md) · `.docx` | phanbien2@tapchintqsvn.edu.vn |
| Tác giả | `AUTHOR` | `/dashboard/author` | [tac-gia.md](./tac-gia.md) · `.docx` | docgia@tapchintqsvn.edu.vn |

### Khối quản trị & giám sát
| Vai trò | Role | Dashboard | Tài liệu | Tài khoản demo |
|---|---|---|---|---|
| Kiểm định bảo mật | `SECURITY_AUDITOR` | `/dashboard/security` | [kiem-dinh-bao-mat.md](./kiem-dinh-bao-mat.md) · `.docx` | kiemtoan@tapchintqsvn.edu.vn |
| Chỉ huy Học viện | `COMMANDER` | `/dashboard/commander` | [chi-huy-hoc-vien.md](./chi-huy-hoc-vien.md) · `.docx` | chihuy@tapchintqsvn.edu.vn |
| Quản trị hệ thống | `SYSADMIN` | `/dashboard/admin` | [quan-tri-he-thong.md](./quan-tri-he-thong.md) · `.docx` | admin@tapchintqsvn.edu.vn |

> **Mật khẩu demo chung:** `TapChi@2025`.

### Độc giả (trang công khai)
| Vai trò | Role | Khu vực | Tài liệu |
|---|---|---|---|
| Độc giả | `READER` | Trang công khai (không cần đăng nhập) | [doc-gia.md](./doc-gia.md) · `.docx` |

> Độc giả đọc nội dung trên trang công khai (số tạp chí, bài báo, tìm kiếm, thư viện) — không có dashboard riêng.

## Sơ đồ vai trò trong quy trình
```
Tác giả ──nộp──► [Sàng lọc] ──► Biên tập viên chuyên mục ──gán──► Phản biện viên
                                      │ (quyết định)
                                      ▼
                 Thư ký tòa soạn / Phó Tổng biên tập ──sản xuất──► Biên tập viên dàn trang
                                      │                                   │
                                      ▼                                   ▼
                              Tổng biên tập ───────────── KÝ XUẤT BẢN ───►  Đã xuất bản
   (Kiểm định bảo mật: đồng ký bài mật · Chỉ huy Học viện: xem báo cáo · Quản trị: vận hành hệ thống)
```

## Trang Trợ giúp trong ứng dụng
Người dùng có thể mở **Tổng quan → Hướng dẫn sử dụng** (`/dashboard/help`) — hub tra cứu nhanh theo
vai trò (ảnh + lối tắt tới trang thao tác). Bản đầy đủ để in là các file `.docx` trong thư mục này.

## Tài liệu liên quan
- Ma trận kiểm thử lãnh đạo: [../qa/leadership-flow-checklist.md](../qa/leadership-flow-checklist.md)
