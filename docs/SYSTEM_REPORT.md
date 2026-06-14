# BÁO CÁO TOÀN DIỆN HỆ THỐNG TẠP CHÍ NGHIÊN CỨU KHOA HỌC HẬU CẦN QUÂN SỰ

## 📋 THÔNG TIN TỔNG QUAN

### Thông tin hệ thống
- **Tên hệ thống:** Tạp chí Nghiên cứu Khoa học Hậu cần Quân sự (Military Logistics Science Journal)
- **Phiên bản:** 2.0
- **Công nghệ:** Next.js 14, TypeScript, Prisma, PostgreSQL
- **Loại triển khai:** Intranet (100% offline, không kết nối internet)
- **Lưu trữ:** Local filesystem (không AWS S3)
- **Domain:** https://tapchinckhhcqs.abacusai.app

### Mục đích
Hệ thống quản lý toàn bộ quy trình xuất bản tạp chí khoa học từ nộp bài, phản biện, biên tập, đến xuất bản và lưu trữ. Hệ thống hỗ trợ 7 bước quy trình xuất bản chuẩn quốc tế.

---

## 🎯 CÁC VAI TRÒ NGƯỜI DÙNG

### 1. READER (Độc giả)
- Xem bài báo công khai
- Tìm kiếm và lọc bài báo
- Đọc tin tức
- Xem lịch sử các số báo

### 2. AUTHOR (Tác giả)
- Nộp bài nghiên cứu
- Theo dõi tiến trình phản biện
- Chỉnh sửa và nộp lại bản sửa
- Nhận thông báo quyết định
- Xem lịch sử phiên bản

### 3. REVIEWER (Phản biện viên)
- Nhận bài phản biện
- Đánh giá chất lượng bài báo
- Đưa ra nhận xét và quyết định
- Theo dõi deadline
- Xem lịch sử phản biện

### 4. SECTION_EDITOR (Biên tập viên chuyên mục)
- Quản lý bài nộp theo chuyên mục
- Giao bài cho phản biện viên
- Theo dõi tiến trình phản biện
- Đưa ra quyết định biên tập
- Quản lý phiên bản bài báo

### 5. MANAGING_EDITOR (Thư ký tòa soạn)
- Quản lý toàn bộ bài nộp
- Phân công biên tập viên
- Theo dõi tiến độ tổng thể
- Quản lý quy trình sản xuất
- Chuẩn bị xuất bản

### 6. EIC (Tổng biên tập)
- Quyết định cuối cùng về bài báo
- Phê duyệt xuất bản
- Quản lý ban biên tập
- Thiết lập chính sách
- Giám sát chất lượng

### 7. LAYOUT_EDITOR (Biên tập bố cục)
- Thiết kế layout bài báo
- Chuyển đổi định dạng
- Tạo file PDF cuối cùng
- Kiểm tra chất lượng in ấn

### 8. SYSADMIN (Quản trị viên hệ thống)
- Quản lý người dùng
- Phân quyền hệ thống
- Quản lý cấu hình
- Backup và restore
- Theo dõi bảo mật
- Xem audit logs

### 9. SECURITY_AUDITOR (Kiểm toán viên bảo mật)
- Theo dõi hoạt động bảo mật
- Xem audit logs
- Phát hiện hành vi bất thường
- Báo cáo bảo mật

---

## 🔐 HỆ THỐNG PHÂN QUYỀN (RBAC)

### Quyền truy cập theo vai trò

| Chức năng | READER | AUTHOR | REVIEWER | EDITOR | MANAGING_EDITOR | EIC | LAYOUT | SYSADMIN |
|-----------|--------|--------|----------|--------|-----------------|-----|--------|----------|
| Xem bài công khai | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Nộp bài | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Phản biện bài | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Giao phản biện | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Quyết định biên tập | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Quản lý người dùng | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Quản lý hệ thống | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Xuất bản số báo | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ |
| Xem audit logs | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |

---

## 📊 QUY TRÌNH XUẤT BẢN (7 BƯỚC)

### Bước 1: Nộp Bài (1-2 ngày)
**Người thực hiện:** Tác giả
**Trạng thái:** DRAFT, SUBMITTED

**Quy trình:**
1. Tác giả đăng ký tài khoản và xác thực email
2. Điền đầy đủ thông tin bài báo (tiêu đề, tóm tắt, từ khóa)
3. Upload file PDF bản thảo
4. Upload tài liệu bổ sung (nếu có)
5. Xác nhận và nộp bài

**Kết quả:**
- ✅ Bài được gửi thành công → Chuyển sang Bước 2
- ❌ Thiếu thông tin → Yêu cầu bổ sung

### Bước 2: Kiểm tra Sơ bộ (3-5 ngày)
**Người thực hiện:** Thư ký tòa soạn / Biên tập viên
**Trạng thái:** INITIAL_REVIEW

**Quy trình:**
1. Kiểm tra định dạng và yêu cầu kỹ thuật
2. Kiểm tra đạo văn (plagiarism check)
3. Đánh giá sơ bộ nội dung
4. Phân công chuyên mục phù hợp

**Kết quả:**
- ✅ Đạt yêu cầu → Chuyển sang Bước 3
- ⚠️ Cần chỉnh sửa nhỏ → Gửi lại tác giả
- ❌ Không đạt → Từ chối (REJECTED)

### Bước 3: Phản biện (20-30 ngày)
**Người thực hiện:** Phản biện viên (2-3 người)
**Trạng thái:** UNDER_REVIEW

**Quy trình:**
1. Biên tập viên chọn phản biện viên phù hợp
2. Gửi yêu cầu phản biện (có deadline)
3. Phản biện viên đánh giá theo tiêu chí:
   - Tính mới của nghiên cứu
   - Phương pháp nghiên cứu
   - Kết quả và thảo luận
   - Tài liệu tham khảo
   - Chất lượng trình bày
4. Đưa ra quyết định:
   - ACCEPT: Chấp nhận
   - MINOR_REVISION: Sửa nhỏ
   - MAJOR_REVISION: Sửa lớn
   - REJECT: Từ chối

**Lưu ý:**
- Hỗ trợ phản biện ẩn danh (Single/Double Blind)
- Tự động nhắc nhở khi gần deadline
- Có thể mời thêm phản biện viên nếu cần

### Bước 4: Quyết định Biên tập (5-7 ngày)
**Người thực hiện:** Biên tập viên / Tổng biên tập
**Trạng thái:** EDITOR_DECISION

**Quy trình:**
1. Tổng hợp ý kiến từ các phản biện viên
2. Đánh giá tổng thể
3. Đưa ra quyết định cuối cùng:
   - **Accept:** Chấp nhận xuất bản → Bước 5
   - **Revision Required:** Yêu cầu sửa → Quay lại tác giả
   - **Reject:** Từ chối xuất bản

**Email thông báo:**
- Gửi quyết định cho tác giả
- Đính kèm nhận xét của phản biện
- Hướng dẫn chỉnh sửa (nếu có)

### Bước 5: Chỉnh sửa & Duyệt lại (10-15 ngày)
**Người thực hiện:** Tác giả & Biên tập viên
**Trạng thái:** REVISION, RESUBMITTED

**Quy trình (nếu cần sửa):**
1. Tác giả nhận nhận xét
2. Chỉnh sửa theo yêu cầu
3. Nộp lại bản sửa (version mới)
4. Biên tập viên hoặc phản biện kiểm tra lại
5. Quyết định: Chấp nhận / Sửa thêm / Từ chối

**Lưu ý:**
- Hệ thống lưu tất cả các phiên bản
- Có thể so sánh giữa các phiên bản
- Tối đa 2-3 vòng sửa chữa

### Bước 6: Sản xuất & Trình bày (7-10 ngày)
**Người thực hiện:** Biên tập viên bố cục
**Trạng thái:** ACCEPTED, PRODUCTION

**Quy trình:**
1. Chuyển đổi sang định dạng xuất bản
2. Thiết kế layout chuẩn
3. Thêm DOI, metadata
4. Tạo file PDF cuối cùng
5. Kiểm tra chất lượng (proofreading)
6. Phê duyệt cuối cùng

**Đầu ra:**
- File PDF đầy đủ
- Metadata chuẩn
- DOI đã đăng ký

### Bước 7: Xuất bản (1-2 ngày)
**Người thực hiện:** Thư ký tòa soạn / Tổng biên tập
**Trạng thái:** PUBLISHED

**Quy trình:**
1. Phân số báo (Issue) cho bài viết
2. Thiết lập quyền truy cập
3. Xuất bản lên website
4. Thông báo cho tác giả
5. Lưu trữ vào kho dữ liệu
6. Cập nhật thống kê

**Kết quả:**
- Bài báo công khai trên website
- Có thể tìm kiếm và truy cập
- Được lưu trữ vĩnh viễn

---

## 🔍 CÁC CHỨC NĂNG CHÍNH

### A. QUẢN LÝ BÀI VIẾT

#### 1. Nộp bài mới
- Upload file PDF (tối đa 10MB)
- Nhập metadata (tiêu đề, tóm tắt, từ khóa)
- Chọn chuyên mục
- Thêm tác giả đồng tác giả
- Upload tài liệu bổ sung

#### 2. Quản lý phiên bản
- Lưu tất cả phiên bản chỉnh sửa
- So sánh giữa các phiên bản
- Xem lịch sử thay đổi
- Rollback về phiên bản cũ

#### 3. Kiểm tra đạo văn
- Tích hợp công cụ plagiarism check
- Hiển thị tỷ lệ trùng lặp
- Highlight đoạn văn trùng
- Lưu báo cáo kiểm tra

#### 4. Workflow actions
- Gửi bài đi phản biện
- Yêu cầu chỉnh sửa
- Chấp nhận / Từ chối
- Phân công số báo

### B. QUẢN LÝ PHẢN BIỆN

#### 1. Giao bài phản biện
- Tìm phản biện viên phù hợp
- Gửi lời mời (có deadline)
- Theo dõi tình trạng chấp nhận
- Nhắc nhở khi gần deadline

#### 2. Cài đặt phản biện
- **Blind review mode:**
  - Open Review (Không ẩn danh)
  - Single Blind (Ẩn tác giả)
  - Double Blind (Ẩn cả tác giả và phản biện)
- Số lượng phản biện tối thiểu: 2-3
- Thời hạn phản biện: 20-30 ngày
- Tự động giao phản biện: Bật/Tắt

#### 3. Form phản biện
- Đánh giá theo tiêu chí:
  - Tính độc đáo (1-5 sao)
  - Phương pháp nghiên cứu (1-5 sao)
  - Kết quả (1-5 sao)
  - Tài liệu tham khảo (1-5 sao)
  - Chất lượng văn bản (1-5 sao)
- Nhận xét chi tiết
- Quyết định cuối: Accept/Revision/Reject

#### 4. Thống kê phản biện
- Số lượng bài đã phản biện
- Thời gian phản biện trung bình
- Tỷ lệ Accept/Reject
- Xếp hạng phản biện viên

### C. QUẢN LÝ SỐ BÁO (ISSUES)

#### 1. Tạo số báo mới
- Chọn tập (Volume)
- Đặt số (Number)
- Năm xuất bản
- Tiêu đề và mô tả
- Upload ảnh bìa
- Thiết lập DOI

#### 2. Quản lý bài viết trong số
- Gán bài vào số báo
- Sắp xếp thứ tự bài
- Thiết lập số trang
- Tạo mục lục

#### 3. Xuất bản số báo
- Thiết lập ngày xuất bản
- Tạo file PDF toàn số
- Public trên website
- Gửi thông báo

#### 4. Thống kê
- Số lượng bài trong số
- Lượt xem và tải về
- Trích dẫn (citations)

### D. KHO DỮ LIỆU BÀI BÁO

#### 1. Tìm kiếm nâng cao
- Tìm theo từ khóa
- Lọc theo tác giả
- Lọc theo chuyên mục
- Lọc theo năm xuất bản
- Lọc theo từ khóa (keywords)

#### 2. Trang chi tiết bài báo
- Hiển thị thông tin đầy đủ
- Xem PDF trực tiếp (embedded viewer)
- Tải về PDF
- Chia sẻ bài báo
- Citation (định dạng APA, MLA, Chicago)

#### 3. Phân quyền truy cập
- Bài công khai: Mọi người xem được
- Bài nội bộ: Chỉ thành viên đăng nhập
- Tải PDF: Yêu cầu đăng nhập
- Ghi nhận audit log khi tải

### E. QUẢN LÝ NGƯỜI DÙNG

#### 1. Đăng ký tài khoản
- Form đăng ký chi tiết:
  - Họ tên, email, số điện thoại
  - Đơn vị công tác
  - Cấp bậc, chức vụ
  - Học hàm, học vị
  - Upload CV và thẻ công tác
- Xác thực email
- Chờ phê duyệt

#### 2. Phê duyệt người dùng
- Danh sách chờ phê duyệt
- Xem hồ sơ chi tiết
- Phê duyệt / Từ chối
- Gán vai trò ban đầu
- Gửi email thông báo

#### 3. Quản lý người dùng
- Danh sách tất cả người dùng
- Tìm kiếm và lọc
- Chỉnh sửa thông tin
- Thay đổi vai trò
- Vô hiệu hóa tài khoản
- Xem hoạt động (audit logs)

#### 4. Yêu cầu nâng quyền
- Người dùng tự yêu cầu
- Admin xem xét
- Phê duyệt / Từ chối
- Ghi lại lý do

### F. BẢO MẬT & AUDIT

#### 1. Xác thực 2 bước (2FA)
- Bật/Tắt 2FA
- Gửi OTP qua email
- Xác thực khi đăng nhập
- Backup codes

#### 2. Quản lý phiên đăng nhập
- Xem phiên đang hoạt động
- Hiển thị IP, thiết bị
- Thời gian đăng nhập
- Kết thúc phiên từ xa

#### 3. Audit Logs
- Ghi lại mọi hành động quan trọng:
  - Đăng nhập/Đăng xuất
  - Nộp bài
  - Phản biện
  - Quyết định biên tập
  - Thay đổi người dùng
  - Thay đổi cấu hình
- Lọc và tìm kiếm logs
- Xuất báo cáo

#### 4. Phát hiện bất thường
- Đăng nhập từ IP lạ
- Nhiều lần đăng nhập thất bại
- Thay đổi quyền bất thường
- Truy cập dữ liệu nhạy cảm

### G. QUẢN LÝ NỘI DUNG (CMS)

#### 1. Quản lý tin tức
- Tạo tin tức mới
- Danh mục tin tức
- Upload ảnh
- Rich text editor
- Xuất bản/Ẩn
- Lên lịch xuất bản

#### 2. Quản lý trang tĩnh
- Tạo trang mới (About, Contact, etc.)
- Chỉnh sửa nội dung
- SEO settings (meta title, description)
- Template selection
- Quản lý URL (slug)

#### 3. Quản lý banner
- Upload ảnh banner
- Thiết lập link
- Thứ tự hiển thị
- Kích hoạt/Vô hiệu hóa
- Lên lịch hiển thị

#### 4. Quản lý navigation
- Tạo menu items
- Sắp xếp thứ tự
- Thiết lập hierarchy
- Link nội bộ/ngoại bộ

### H. THỐNG KÊ & BÁO CÁO

#### 1. Dashboard tổng quan
- Tổng số bài nộp
- Bài đang xử lý
- Bài đã xuất bản
- Số lượng người dùng
- Biểu đồ theo thời gian

#### 2. Thống kê bài viết
- Theo trạng thái
- Theo chuyên mục
- Theo tác giả
- Theo phản biện viên
- Thời gian xử lý trung bình

#### 3. Thống kê lượt truy cập
- Lượt xem trang
- Lượt tải PDF
- Bài được xem nhiều nhất
- Số liệu theo ngày/tuần/tháng

#### 4. Báo cáo xuất
- Báo cáo hoạt động hàng tháng
- Báo cáo chất lượng phản biện
- Báo cáo hiệu suất biên tập
- Xuất Excel/PDF

---

## 🗂️ CẤU TRÚC DATABASE

### Các bảng chính

1. **User** - Người dùng
   - Thông tin cá nhân
   - Vai trò và quyền
   - Trạng thái tài khoản
   - Học hàm, học vị, cấp bậc

2. **Submission** - Bài nộp
   - Thông tin bài báo
   - Trạng thái workflow
   - Tác giả và đồng tác giả
   - Metadata

3. **Review** - Phản biện
   - Phản biện viên
   - Đánh giá và nhận xét
   - Quyết định
   - Deadline

4. **EditorDecision** - Quyết định biên tập
   - Loại quyết định
   - Lý do
   - Thời gian

5. **Article** - Bài báo xuất bản
   - Liên kết đến Submission
   - DOI
   - File PDF cuối cùng
   - Lượt xem/tải

6. **Issue** - Số báo
   - Tập (Volume)
   - Số (Number)
   - Năm
   - Ảnh bìa
   - Trạng thái

7. **Volume** - Tập
   - Năm
   - Tiêu đề

8. **UploadedFile** - File đã tải lên
   - Đường dẫn local
   - Metadata
   - Loại file

9. **AuditLog** - Nhật ký hoạt động
   - Người thực hiện
   - Hành động
   - Thời gian
   - IP address

10. **News** - Tin tức
    - Tiêu đề
    - Nội dung
    - Ảnh
    - Trạng thái

11. **PublicPage** - Trang tĩnh
    - Slug (URL)
    - Tiêu đề
    - Nội dung
    - SEO settings

12. **Category** - Chuyên mục
    - Tên
    - Mô tả

13. **PlagiarismReport** - Báo cáo kiểm tra đạo văn
    - Submission ID
    - Tỷ lệ trùng lặp
    - Chi tiết

---

## 🌐 CẤU TRÚC FRONTEND

### Trang công khai (Public)
- `/` - Trang chủ
- `/news` - Tin tức
- `/news/[id]` - Chi tiết tin tức
- `/issues` - Danh sách số báo
- `/issues/[id]` - Chi tiết số báo
- `/issues/latest` - Số mới nhất
- `/archive` - Lưu trữ
- `/articles/[id]` - Chi tiết bài báo
- `/search` - Tìm kiếm
- `/search/advanced` - Tìm kiếm nâng cao
- `/pages/about` - Giới thiệu
- `/pages/contact` - Liên hệ
- `/pages/publishing-process` - Quy trình xuất bản
- `/pages/[slug]` - Các trang CMS động

### Dashboard (Nội bộ)
- `/dashboard/author` - Dashboard tác giả
- `/dashboard/reviewer` - Dashboard phản biện
- `/dashboard/editor` - Dashboard biên tập viên
- `/dashboard/managing` - Dashboard thư ký tòa soạn
- `/dashboard/eic` - Dashboard tổng biên tập
- `/dashboard/admin` - Dashboard quản trị viên
- `/dashboard/settings` - Cài đặt cá nhân

---

## 📡 CẤU TRÚC API

### Authentication APIs
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/logout` - Đăng xuất
- `POST /api/auth/verify-email` - Xác thực email
- `POST /api/auth/forgot-password` - Quên mật khẩu
- `POST /api/auth/reset-password` - Đặt lại mật khẩu
- `GET /api/auth/me` - Thông tin người dùng hiện tại

### Submission APIs
- `GET /api/submissions` - Danh sách bài nộp
- `POST /api/submissions` - Tạo bài nộp mới
- `GET /api/submissions/[id]` - Chi tiết bài nộp
- `PUT /api/submissions/[id]` - Cập nhật bài nộp
- `DELETE /api/submissions/[id]` - Xóa bài nộp
- `POST /api/submissions/[id]/submit` - Nộp bài
- `POST /api/submissions/[id]/assign-reviewers` - Giao phản biện
- `POST /api/submissions/[id]/editor-decision` - Quyết định biên tập

### Review APIs
- `GET /api/reviews` - Danh sách phản biện
- `POST /api/reviews` - Tạo phản biện mới
- `GET /api/reviews/[id]` - Chi tiết phản biện
- `PUT /api/reviews/[id]` - Cập nhật phản biện
- `POST /api/reviews/[id]/submit` - Nộp phản biện

### Article APIs
- `GET /api/articles` - Danh sách bài báo công khai
- `GET /api/articles/[id]` - Chi tiết bài báo
- `POST /api/articles/[id]/approve` - Phê duyệt xuất bản
- `GET /api/articles/[id]/pdf` - Tải PDF
- `GET /api/articles/[id]/citation` - Lấy citation

### Issue APIs
- `GET /api/issues` - Danh sách số báo
- `POST /api/issues` - Tạo số báo mới
- `GET /api/issues/[id]` - Chi tiết số báo
- `PUT /api/issues/[id]` - Cập nhật số báo
- `DELETE /api/issues/[id]` - Xóa số báo
- `GET /api/issues/latest` - Số mới nhất

### User APIs
- `GET /api/users` - Danh sách người dùng (Admin)
- `GET /api/users/[id]` - Chi tiết người dùng
- `PUT /api/users/[id]` - Cập nhật người dùng
- `POST /api/users/approve` - Phê duyệt người dùng
- `GET /api/users/pending` - Người dùng chờ phê duyệt
- `GET /api/users/sessions` - Phiên đăng nhập

### Admin APIs
- `GET /api/admin/stats` - Thống kê tổng quan
- `GET /api/audit-logs` - Nhật ký hoạt động
- `POST /api/admin/backup` - Sao lưu dữ liệu
- `GET /api/admin/monitor` - Giám sát hệ thống

### CMS APIs
- `GET /api/news` - Danh sách tin tức
- `POST /api/news` - Tạo tin tức
- `GET /api/public-pages` - Danh sách trang
- `POST /api/public-pages` - Tạo trang mới
- `GET /api/navigation` - Menu navigation
- `POST /api/banners` - Quản lý banner

### File APIs
- `POST /api/files/upload` - Upload file
- `GET /api/files/[id]` - Tải file
- `DELETE /api/files/[id]` - Xóa file

---

## 🔒 BẢO MẬT

### Xác thực & Phân quyền
- JWT tokens cho session
- Refresh token mechanism
- Role-based access control (RBAC)
- 2-Factor Authentication (2FA)
- Email verification

### Bảo vệ dữ liệu
- Mã hóa mật khẩu (bcrypt)
- Signed URLs cho download files
- Audit logging cho mọi hành động quan trọng
- IP tracking
- Session management

### Content Security
- XSS protection
- CSRF protection
- SQL injection prevention (Prisma ORM)
- File upload validation
- HTML sanitization

### Phản biện ẩn danh
- Single Blind: Ẩn tên tác giả
- Double Blind: Ẩn cả tác giả và phản biện
- Metadata stripping
- Watermark "TÀI LIỆU TUYỆT MẬT"

---

## 💾 LƯU TRỮ & BACKUP

### Local Storage
- File upload: `./public/uploads`
- Images: `./public/uploads/images`
- Documents: `./public/uploads/documents`
- Videos: `./public/uploads/videos`
- Temp: `./public/uploads/temp`

### Database Backup
- Script: `scripts/backup-db.sh`
- Tự động backup hàng ngày
- Lưu trữ 30 ngày
- Nén file backup (gzip)
- Ghi audit log

### Restore
- Script: `scripts/restore-db.sh`
- Khôi phục từ file backup
- Xác nhận trước khi restore
- Preserve data option

---

## 📧 HỆ THỐNG EMAIL

### Các loại email tự động
1. **Đăng ký & Xác thực**
   - Email xác thực tài khoản
   - Email phê duyệt/từ chối

2. **Quy trình bài báo**
   - Xác nhận nộp bài
   - Thông báo phản biện
   - Nhắc nhở deadline
   - Quyết định biên tập
   - Yêu cầu chỉnh sửa
   - Thông báo xuất bản

3. **Phản biện**
   - Lời mời phản biện
   - Nhắc nhở deadline
   - Xác nhận hoàn thành

4. **Bảo mật**
   - Đăng nhập từ thiết bị mới
   - Thay đổi mật khẩu
   - Mã OTP (2FA)

---

## 🎨 THIẾT KẾ UI/UX

### Design System
- **Colors:** Sky blue gradient (#0ea5e9 to #0284c7)
- **Fonts:** Segoe UI, Roboto
- **Components:** Shadcn UI + Tailwind CSS
- **Icons:** Lucide React
- **Animations:** Framer Motion

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Adaptive navigation
- Touch-friendly buttons

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- High contrast mode
- Focus indicators

---

## 📊 HIỆU NĂNG

### Optimization
- Next.js ISR (Incremental Static Regeneration)
- Image optimization (Next/Image)
- Code splitting
- Lazy loading
- Database indexing

### Caching Strategy
- Static pages: 1 hour
- API responses: 5 minutes
- User sessions: 24 hours
- File CDN: 7 days

---

## 🐛 TESTING & DEBUGGING

### Test Coverage
- Unit tests (Jest)
- Integration tests
- E2E tests (Playwright)
- API tests

### Debugging Tools
- Next.js Dev Tools
- Prisma Studio
- Browser DevTools
- Server logs

### Error Handling
- Global error boundary
- API error responses
- User-friendly error messages
- Sentry integration (optional)

---

## 📱 MOBILE APP (Future)
- React Native
- Offline support
- Push notifications
- Biometric authentication

---

## 🔄 CI/CD (Future)
- GitHub Actions
- Automated testing
- Code quality checks
- Automated deployment

---

## 📞 HỖ TRỢ

### Tài liệu
- Hướng dẫn sử dụng theo vai trò
- Video tutorials
- FAQs
- API documentation

### Liên hệ
- Email: support@tapchi-hcqs.vn
- Hotline: 024.xxxx.xxxx
- Help desk: /pages/contact

---

**Ngày cập nhật:** 08/01/2026
**Phiên bản:** 2.0.0
**Người soạn:** DeepAgent - Abacus.AI
