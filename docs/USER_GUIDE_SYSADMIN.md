# HƯỚNG DẪN SỬ DỤNG - QUẢN TRỊ VIÊN HỆ THỐNG (SYSADMIN)

## 📋 MỤC LỤC

1. [Giới thiệu vai trò](#giới-thiệu-vai-trò)
2. [Đăng nhập hệ thống](#đăng-nhập-hệ-thống)
3. [Dashboard tổng quan](#dashboard-tổng-quan)
4. [Quản lý người dùng](#quản-lý-người-dùng)
5. [Phê duyệt tài khoản](#phê-duyệt-tài-khoản)
6. [Quản lý vai trò và quyền](#quản-lý-vai-trò-và-quyền)
7. [Quản lý phiên đăng nhập](#quản-lý-phiên-đăng-nhập)
8. [Audit Logs - Nhật ký hoạt động](#audit-logs)
9. [Quản lý cấu hình](#quản-lý-cấu-hình)
10. [Backup và Restore](#backup-và-restore)
11. [Quản lý CMS](#quản-lý-cms)
12. [Thống kê và báo cáo](#thống-kê-và-báo-cáo)
13. [Bảo mật](#bảo-mật)
14. [Xử lý sự cố](#xử-lý-sự-cố)

---

## 1. GIỚI THIỆU VAI TRÒ

### Quyền hạn của SYSADMIN

Quản trị viên hệ thống (SYSADMIN) có quyền cao nhất trong hệ thống, bao gồm:

✅ **Quản lý người dùng:**
- Xem danh sách tất cả người dùng
- Tạo, sửa, xóa tài khoản
- Phê duyệt đăng ký mới
- Thay đổi vai trò và quyền
- Vô hiệu hóa/kích hoạt tài khoản

✅ **Quản lý hệ thống:**
- Xem và quản lý phiên đăng nhập
- Truy cập Audit Logs
- Cấu hình hệ thống
- Backup và Restore database
- Giám sát hiệu suất

✅ **Quản lý nội dung:**
- Toàn quyền với CMS (Tin tức, Trang tĩnh, Banner, Menu)
- Quản lý số báo và bài viết
- Phê duyệt xuất bản

✅ **Bảo mật:**
- Phát hiện hành vi bất thường
- Quản lý 2FA
- Kết thúc phiên từ xa
- Xem lịch sử đăng nhập

### Trách nhiệm

⚠️ **Lưu ý quan trọng:**
- Là vai trò có quyền cao nhất, mọi hành động đều được ghi audit log
- Cẩn thận khi xóa/thay đổi dữ liệu quan trọng
- Thường xuyên kiểm tra bảo mật và backup
- Không chia sẻ mật khẩu với bất kỳ ai

---

## 2. ĐĂNG NHẬP HỆ THỐNG

### Bước 1: Truy cập trang đăng nhập
```
URL: https://tapchinckhhcqs.abacusai.app/login
```

### Bước 2: Nhập thông tin đăng nhập
- **Email:** địa chỉ email đã đăng ký
- **Mật khẩu:** mật khẩu tài khoản admin

### Bước 3: Xác thực 2 bước (nếu đã bật)
- Kiểm tra email để nhận mã OTP
- Nhập mã OTP vào form
- Có hiệu lực trong 10 phút

### Bước 4: Chuyển đến Dashboard
Sau khi đăng nhập thành công, bạn sẽ được chuyển đến:
```
/dashboard/admin
```

---

## 3. DASHBOARD TỔNG QUAN

### Giao diện chính

Dashboard admin hiển thị:

**📊 Thống kê tổng quan:**
- Tổng số người dùng
- Người dùng chờ phê duyệt
- Bài nộp mới
- Bài đang phản biện
- Bài đã xuất bản

**📈 Biểu đồ:**
- Biểu đồ bài nộp theo thời gian
- Biểu đồ người dùng mới
- Biểu đồ lượt truy cập

**⚡ Hoạt động gần đây:**
- Đăng nhập mới
- Bài nộp mới
- Phê duyệt mới
- Cảnh báo bảo mật

**🔔 Thông báo:**
- Người dùng chờ phê duyệt
- Yêu cầu nâng quyền
- Cảnh báo hệ thống

---

## 4. QUẢN LÝ NGƯỜI DÙNG

### 4.1. Xem danh sách người dùng

**Đường dẫn:** `/dashboard/admin/users`

**Tính năng:**
- ✅ Xem danh sách tất cả người dùng
- ✅ Tìm kiếm theo tên, email
- ✅ Lọc theo vai trò
- ✅ Lọc theo trạng thái (Active/Inactive)
- ✅ Sắp xếp theo tên, ngày tạo

**Thông tin hiển thị:**
- Họ tên
- Email
- Vai trò
- Đơn vị công tác
- Trạng thái
- Ngày đăng ký

### 4.2. Tạo người dùng mới

**Bước 1:** Click nút "Tạo người dùng mới"

**Bước 2:** Điền thông tin:
```
Thông tin bắt buộc:
- Họ tên *
- Email *
- Mật khẩu *
- Xác nhận mật khẩu *
- Vai trò *

Thông tin bổ sung:
- Số điện thoại
- Đơn vị công tác
- Cấp bậc
- Chức vụ
- Học hàm
- Học vị
- Bio
```

**Bước 3:** Click "Tạo tài khoản"

**Kết quả:**
- Tài khoản được tạo ngay lập tức
- Trạng thái: Active
- Email xác thực được gửi tự động

### 4.3. Chỉnh sửa thông tin người dùng

**Bước 1:** Tìm người dùng cần sửa

**Bước 2:** Click nút "Sửa" (biểu tượng bút)

**Bước 3:** Cập nhật thông tin:
- Có thể sửa tất cả thông tin
- **Lưu ý:** Không thể sửa email (dùng để đăng nhập)

**Bước 4:** Click "Lưu thay đổi"

**Kết quả:**
- Thông tin được cập nhật ngay
- Ghi audit log
- Email thông báo nếu có thay đổi quan trọng

### 4.4. Thay đổi vai trò người dùng

**Các vai trò có thể gán:**
- READER (Độc giả)
- AUTHOR (Tác giả)
- REVIEWER (Phản biện viên)
- SECTION_EDITOR (Biên tập viên)
- MANAGING_EDITOR (Thư ký tòa soạn)
- EIC (Tổng biên tập)
- LAYOUT_EDITOR (Biên tập bố cục)
- SYSADMIN (Quản trị viên)
- SECURITY_AUDITOR (Kiểm toán viên)

**Cách thay đổi:**
1. Vào trang chi tiết người dùng
2. Click "Thay đổi vai trò"
3. Chọn vai trò mới
4. Nhập lý do thay đổi (bắt buộc)
5. Xác nhận

**⚠️ Lưu ý quan trọng:**
- Thay đổi vai trò ảnh hưởng đến quyền truy cập
- Được ghi audit log chi tiết
- Email thông báo sẽ được gửi cho người dùng

### 4.5. Vô hiệu hóa tài khoản

**Khi nào cần vô hiệu hóa:**
- Vi phạm quy định
- Yêu cầu từ chối
- Tài khoản không còn sử dụng
- Phát hiện hành vi bất thường

**Cách vô hiệu hóa:**
1. Click nút "Vô hiệu hóa" ở trang chi tiết
2. Nhập lý do (bắt buộc)
3. Xác nhận

**Hệ quả:**
- ❌ Không thể đăng nhập
- ❌ Tất cả phiên hiện tại bị kết thúc
- ❌ Không thể thực hiện bất kỳ hành động nào
- ✅ Dữ liệu vẫn được lưu trữ
- ✅ Có thể kích hoạt lại sau

### 4.6. Xóa người dùng

**⚠️ CẢNH BÁO: Hành động này không thể hoàn tác!**

**Khi nào có thể xóa:**
- Tài khoản spam/giả mạo
- Yêu cầu chính thức từ người dùng
- Theo quy định pháp luật (GDPR)

**Cách xóa:**
1. Click nút "Xóa" (biểu tượng thùng rác)
2. Nhập lý do xóa
3. **Nhập mật khẩu admin để xác nhận**
4. Confirm "XÓA VĨNH VIỄN"

**Dữ liệu bị xóa:**
- ❌ Thông tin cá nhân
- ❌ Phiên đăng nhập
- ✅ Audit logs được giữ lại (anonymized)
- ✅ Bài viết/phản biện được chuyển về "Deleted User"

---

## 5. PHÊ DUYỆT TÀI KHOẢN

### 5.1. Xem danh sách chờ phê duyệt

**Đường dẫn:** `/dashboard/admin/users/pending`

**Hiển thị:**
- Danh sách người dùng mới đăng ký
- Trạng thái: PENDING
- Thông tin đầy đủ
- File đính kèm (CV, thẻ công tác)

### 5.2. Xem hồ sơ chi tiết

**Click vào từng hồ sơ để xem:**

**Thông tin cơ bản:**
- Họ tên
- Email
- Số điện thoại
- Đơn vị công tác

**Thông tin chuyên môn:**
- Cấp bậc
- Chức vụ
- Học hàm
- Học vị
- Lĩnh vực nghiên cứu

**File đính kèm:**
- CV (click để xem/tải)
- Thẻ công tác (click để xem/tải)

**Vai trò yêu cầu:**
- Vai trò mong muốn
- Lý do đăng ký

### 5.3. Phê duyệt tài khoản

**Bước 1:** Xem xét hồ sơ kỹ lưỡng

**Bước 2:** Quyết định phê duyệt

**Nếu CHẤP NHẬN:**
1. Click nút "Phê duyệt"
2. Xác nhận vai trò (có thể thay đổi)
3. Nhập ghi chú (optional)
4. Click "Xác nhận"

**Kết quả:**
- ✅ Tài khoản được kích hoạt
- ✅ Email thông báo chấp nhận
- ✅ Người dùng có thể đăng nhập
- ✅ Ghi audit log

**Nếu TỪ CHỐI:**
1. Click nút "Từ chối"
2. **Bắt buộc nhập lý do từ chối**
3. Click "Xác nhận"

**Kết quả:**
- ❌ Tài khoản bị từ chối
- ❌ Email thông báo từ chối (kèm lý do)
- ❌ Không thể đăng nhập
- ✅ Có thể đăng ký lại sau

### 5.4. Lưu ý khi phê duyệt

**Kiểm tra:**
- ✅ Email có đúng định dạng
- ✅ Đơn vị công tác hợp lệ
- ✅ File CV và thẻ công tác rõ ràng
- ✅ Vai trò phù hợp với chức danh
- ✅ Không trùng email với tài khoản khác

**Từ chối nếu:**
- ❌ Thông tin không đầy đủ
- ❌ File không hợp lệ
- ❌ Không liên quan đến lĩnh vực quân sự
- ❌ Nghi ngờ giả mạo

---

## 6. QUẢN LÝ VAI TRÒ VÀ QUYỀN

### 6.1. Yêu cầu nâng quyền

**Đường dẫn:** `/dashboard/admin/role-escalation`

**Xem danh sách yêu cầu:**
- Người dùng yêu cầu
- Vai trò hiện tại
- Vai trò mong muốn
- Lý do
- Ngày yêu cầu

### 6.2. Xử lý yêu cầu nâng quyền

**Phê duyệt:**
1. Xem chi tiết yêu cầu
2. Kiểm tra hồ sơ người dùng
3. Đánh giá lý do
4. Click "Phê duyệt"
5. Xác nhận

**Kết quả:**
- ✅ Vai trò được cập nhật
- ✅ Email thông báo
- ✅ Ghi audit log

**Từ chối:**
1. Click "Từ chối"
2. Nhập lý do từ chối
3. Xác nhận

**Kết quả:**
- ❌ Vai trò không thay đổi
- ❌ Email thông báo từ chối
- ✅ Có thể yêu cầu lại sau

---

## 7. QUẢN LÝ PHIÊN ĐĂNG NHẬP

### 7.1. Xem phiên đang hoạt động

**Đường dẫn:** `/dashboard/admin/sessions`

**Hiển thị:**
- Danh sách phiên đăng nhập hiện tại
- Thông tin người dùng
- IP address
- Thời gian đăng nhập
- Thời gian hoạt động
- Trạng thái

**Tự động làm mới:** Mỗi 30 giây

### 7.2. Thống kê phiên

**Tổng số phiên:**
- Hiển thị tổng số phiên đang hoạt động

**Phiên admin:**
- Số lượng phiên của SYSADMIN và EIC

**Thời gian trung bình:**
- Thời gian hoạt động trung bình

### 7.3. Kết thúc phiên từ xa

**Khi nào cần kết thúc phiên:**
- Phát hiện hoạt động bất thường
- Yêu cầu từ người dùng
- Đăng nhập từ nhiều nơi
- Bảo mật

**Cách kết thúc:**
1. Tìm phiên cần kết thúc
2. Click nút "Kết thúc"
3. Xác nhận trong dialog
4. Phiên bị ngắt ngay lập tức

**Hệ quả:**
- ❌ Người dùng bị đăng xuất ngay
- ❌ Cần đăng nhập lại
- ✅ Ghi audit log
- ✅ Email thông báo (nếu do admin)

**⚠️ Lưu ý:**
- Không thể kết thúc phiên của chính mình
- Hành động này được ghi log chi tiết

---

## 8. AUDIT LOGS - NHẬT KÝ HOẠT ĐỘNG

### 8.1. Xem Audit Logs

**Đường dẫn:** `/dashboard/admin/audit-logs`

**Hiển thị:**
- Tất cả hoạt động trong hệ thống
- Người thực hiện
- Hành động
- Đối tượng
- Thời gian
- IP address
- Kết quả

### 8.2. Lọc và tìm kiếm

**Lọc theo:**
- **Người dùng:** Chọn người dùng cụ thể
- **Hành động:** LOGIN, LOGOUT, CREATE, UPDATE, DELETE, etc.
- **Đối tượng:** User, Submission, Review, Article, etc.
- **Khoảng thời gian:** Từ ngày - đến ngày
- **IP address:** Lọc theo IP

**Tìm kiếm:**
- Tìm theo từ khóa
- Tìm theo email người dùng
- Tìm theo ID đối tượng

### 8.3. Các loại Audit Log quan trọng

**Authentication:**
- `LOGIN_SUCCESS` - Đăng nhập thành công
- `LOGIN_FAILED` - Đăng nhập thất bại
- `LOGOUT` - Đăng xuất
- `PASSWORD_CHANGE` - Đổi mật khẩu
- `2FA_ENABLED` - Bật 2FA
- `2FA_DISABLED` - Tắt 2FA

**User Management:**
- `USER_CREATE` - Tạo người dùng
- `USER_UPDATE` - Cập nhật người dùng
- `USER_DELETE` - Xóa người dùng
- `USER_APPROVE` - Phê duyệt người dùng
- `USER_REJECT` - Từ chối người dùng
- `ROLE_CHANGE` - Thay đổi vai trò

**Content:**
- `SUBMISSION_CREATE` - Nộp bài mới
- `SUBMISSION_UPDATE` - Cập nhật bài
- `REVIEW_SUBMIT` - Nộp phản biện
- `EDITOR_DECISION` - Quyết định biên tập
- `ARTICLE_PUBLISH` - Xuất bản bài

**System:**
- `CONFIG_CHANGE` - Thay đổi cấu hình
- `BACKUP_CREATE` - Tạo backup
- `BACKUP_RESTORE` - Khôi phục backup
- `SESSION_TERMINATE` - Kết thúc phiên

### 8.4. Xuất báo cáo

**Xuất Excel:**
1. Thiết lập bộ lọc
2. Click "Xuất Excel"
3. File .xlsx được tải về

**Xuất PDF:**
1. Thiết lập bộ lọc
2. Click "Xuất PDF"
3. File .pdf được tải về

**Nội dung báo cáo:**
- Tất cả logs theo bộ lọc
- Thống kê tóm tắt
- Biểu đồ (nếu có)

---

## 9. QUẢN LÝ CẤU HÌNH

### 9.1. Cấu hình chung

**Đường dẫn:** `/dashboard/admin/settings/general`

**Các thiết lập:**

**Thông tin tạp chí:**
- Tên tạp chí (tiếng Việt/English)
- ISSN
- Publisher
- Địa chỉ
- Email liên hệ
- Số điện thoại

**Thiết lập website:**
- Logo
- Favicon
- Màu chủ đạo
- Ngôn ngữ mặc định

### 9.2. Cấu hình phản biện

**Đường dẫn:** `/dashboard/admin/review-settings`

**Blind Review Mode:**
- **Không ẩn danh (Open Review):**
  - Phản biện biết tác giả
  - Tác giả biết phản biện
  
- **Ẩn danh đơn (Single Blind):**
  - Phản biện biết tác giả
  - Tác giả KHÔNG biết phản biện
  
- **Ẩn danh kép (Double Blind):**
  - Phản biện KHÔNG biết tác giả
  - Tác giả KHÔNG biết phản biện

**Cài đặt quy trình:**
- Số phản biện tối thiểu: 2-3
- Thời hạn phản biện: 20-30 ngày
- Tự động giao phản biện: Bật/Tắt
- Cho phép phản biện trao đổi: Bật/Tắt

### 9.3. Cấu hình email

**Đường dẫn:** `/dashboard/admin/settings/email`

**SMTP Settings:**
- SMTP Host
- SMTP Port
- SMTP User
- SMTP Password
- From Email
- From Name

**Email Templates:**
- Welcome email
- Verification email
- Password reset
- Review invitation
- Decision notification

### 9.4. Cấu hình bảo mật

**Đường dẫn:** `/dashboard/admin/settings/security`

**Password Policy:**
- Độ dài tối thiểu: 8 ký tự
- Yêu cầu chữ hoa: Bật/Tắt
- Yêu cầu chữ thường: Bật/Tắt
- Yêu cầu số: Bật/Tắt
- Yêu cầu ký tự đặc biệt: Bật/Tắt
- Hết hạn sau: X ngày

**Session Settings:**
- Timeout: 24 giờ
- Remember me: 30 ngày
- Max concurrent sessions: 3

**2FA Settings:**
- Bắt buộc 2FA cho admin: Bật/Tắt
- OTP expiry: 10 phút

---

## 10. BACKUP VÀ RESTORE

### 10.1. Tạo Backup thủ công

**Đường dẫn:** `/dashboard/admin/backup`

**Cách tạo backup:**
1. Click nút "Tạo Backup ngay"
2. Chọn loại backup:
   - ✅ Database only
   - ✅ Files only
   - ✅ Full backup (Database + Files)
3. Nhập mô tả (optional)
4. Click "Tạo"

**Quá trình:**
- Hiển thị progress bar
- Thời gian: 2-10 phút tùy kích thước
- File được lưu tại: `/backups`

**Kết quả:**
- ✅ File backup .tar.gz
- ✅ Metadata file .json
- ✅ Ghi audit log
- ✅ Email thông báo admin

### 10.2. Backup tự động

**Cấu hình:**
- Tự động backup hàng ngày lúc 2:00 AM
- Lưu trữ 30 ngày
- Tự động xóa backup cũ
- Email báo cáo

**Quản lý:**
- Xem lịch sử backup
- Tải về backup
- Xóa backup cũ

### 10.3. Restore từ Backup

**⚠️ CẢNH BÁO CỰC KỲ QUAN TRỌNG:**
```
Restore sẽ GHI ĐÈ toàn bộ dữ liệu hiện tại!
Mọi thay đổi sau thời điểm backup sẽ MẤT!
Hãy tạo backup hiện tại trước khi restore!
```

**Cách restore:**

**Bước 1:** Tạo backup hiện tại
1. Vào trang Backup
2. Click "Tạo Backup ngay"
3. Đợi hoàn thành

**Bước 2:** Chọn file backup để restore
1. Vào tab "Lịch sử Backup"
2. Tìm backup cần restore
3. Click "Xem chi tiết"
4. Kiểm tra thông tin:
   - Ngày tạo
   - Kích thước
   - Loại backup
   - Mô tả

**Bước 3:** Xác nhận restore
1. Click nút "Restore"
2. Đọc cảnh báo
3. ✅ Check "Tôi đã backup dữ liệu hiện tại"
4. ✅ Check "Tôi hiểu rủi ro"
5. **Nhập mật khẩu admin**
6. Nhập chữ "RESTORE" (chữ hoa)
7. Click "Xác nhận RESTORE"

**Bước 4:** Đợi quá trình hoàn thành
- Thời gian: 5-20 phút
- **KHÔNG TẮT trình duyệt**
- **KHÔNG reload trang**

**Bước 5:** Kiểm tra sau restore
1. Đăng xuất và đăng nhập lại
2. Kiểm tra dữ liệu
3. Xác nhận mọi thứ hoạt động

**Nếu có vấn đề:**
- Liên hệ IT support ngay
- Cung cấp file log
- Không thử restore lại

### 10.4. Lưu ý về Backup/Restore

**Best Practices:**
- ✅ Backup trước mọi thay đổi lớn
- ✅ Test restore định kỳ
- ✅ Lưu backup ngoại tuyến
- ✅ Mã hóa file backup
- ✅ Kiểm tra backup sau khi tạo

**Không nên:**
- ❌ Restore trong giờ cao điểm
- ❌ Restore không có backup hiện tại
- ❌ Chia sẻ file backup
- ❌ Lưu backup trên cùng máy chủ

---

## 11. QUẢN LÝ CMS

### 11.1. Quản lý Tin tức

**Đường dẫn:** `/dashboard/admin/cms/news`

**Tạo tin tức mới:**
1. Click "Tạo tin mới"
2. Nhập tiêu đề (Việt/English)
3. Chọn danh mục
4. Upload ảnh đại diện
5. Soạn nội dung (Rich text editor)
6. Thiết lập SEO:
   - Meta title
   - Meta description
   - OG image
7. Chọn trạng thái:
   - Nháp (Draft)
   - Xuất bản ngay
   - Lên lịch xuất bản
8. Click "Lưu"

**Chỉnh sửa tin:**
- Click icon "Sửa"
- Cập nhật thông tin
- Lưu thay đổi

**Xóa tin:**
- Click icon "Xóa"
- Xác nhận

### 11.2. Quản lý Trang tĩnh

**Đường dẫn:** `/dashboard/admin/cms/pages`

**Giao diện giống WordPress:**
- Danh sách dạng bảng
- Hiển thị tiêu đề, slug, template, trạng thái
- Tìm kiếm nhanh
- Actions: Sửa, Xuất bản/Ẩn, Xóa

**Tạo trang mới:**
1. Click "Tạo trang mới"
2. Nhập slug (URL): `gioi-thieu`
3. Nhập tiêu đề
4. Soạn nội dung với Rich Text Editor
5. Chọn template
6. Thiết lập SEO
7. Xuất bản hoặc để nháp

**Chỉnh sửa trang:**
1. Click "Sửa"
2. Giao diện 2 cột:
   - **Main content:** 3 tabs
     - Nội dung tiếng Việt
     - Nội dung tiếng Anh
     - SEO Settings
   - **Sidebar:**
     - Publish settings
     - Page settings (slug, template, order)
     - Quick links
     - Page info
3. Auto-save mỗi 30 giây
4. Warning khi thoát chưa lưu
5. Click "Lưu thay đổi"

**Tính năng đặc biệt:**
- Preview trước khi xuất bản
- Version history
- Duplicate page
- Bulk actions

### 11.3. Quản lý Banner/Slider

**Đường dẫn:** `/dashboard/admin/cms/banners`

**Tạo banner:**
1. Upload ảnh (khuyến nghị 1920x600px)
2. Nhập tiêu đề
3. Nhập link (optional)
4. Thiết lập thứ tự hiển thị
5. Chọn vị trí: Homepage, Articles, etc.
6. Lên lịch (optional):
   - Từ ngày
   - Đến ngày
7. Kích hoạt

**Quản lý banner:**
- Drag & drop để sắp xếp
- Bật/Tắt nhanh
- Xem thống kê clicks
- Xóa banner cũ

### 11.4. Quản lý Navigation Menu

**Đường dẫn:** `/dashboard/admin/cms/navigation`

**Tạo menu item:**
1. Nhập label (Việt/English)
2. Nhập URL:
   - Internal: `/about`, `/news`
   - External: `https://example.com`
3. Chọn target:
   - `_self`: Cùng tab
   - `_blank`: Tab mới
4. Thiết lập order
5. Kích hoạt

**Sắp xếp menu:**
- Drag & drop để sắp xếp
- Tạo submenu (nested)
- Bulk edit

---

## 12. THỐNG KÊ VÀ BÁO CÁO

### 12.1. Dashboard Analytics

**Đường dẫn:** `/dashboard/admin/analytics`

**Thống kê tổng quan:**
- 📊 Lượt truy cập (theo ngày/tuần/tháng)
- 📊 Bài nộp mới
- 📊 Bài đã xuất bản
- 📊 Người dùng mới

**Biểu đồ:**
- Line chart: Xu hướng theo thời gian
- Bar chart: So sánh giữa các loại
- Pie chart: Phân bố tỷ lệ

### 12.2. Báo cáo hoạt động

**Báo cáo hàng tháng:**
1. Chọn tháng/năm
2. Click "Tạo báo cáo"
3. Nội dung:
   - Tổng quan số liệu
   - Bài nộp và xử lý
   - Phản biện
   - Xuất bản
   - Người dùng
4. Xuất PDF/Excel

### 12.3. Thống kê chi tiết

**Theo bài viết:**
- Bài xem nhiều nhất
- Bài tải nhiều nhất
- Bài được trích dẫn
- Thời gian xử lý trung bình

**Theo người dùng:**
- Tác giả tích cực nhất
- Phản biện hiệu quả nhất
- Biên tập viên năng suất

**Theo chuyên mục:**
- Phân bố bài theo chuyên mục
- Tỷ lệ chấp nhận/từ chối
- Thời gian phản biện trung bình

---

## 13. BẢO MẬT

### 13.1. Giám sát bảo mật

**Dashboard bảo mật:**
- Số lần đăng nhập thất bại
- Truy cập từ IP lạ
- Thay đổi quyền bất thường
- Hoạt động đáng ngờ

**Cảnh báo tự động:**
- Email khi phát hiện bất thường
- Tự động khóa sau 5 lần đăng nhập sai
- Cảnh báo truy cập tài nguyên nhạy cảm

### 13.2. Quản lý 2FA

**Bật 2FA cho admin:**
1. Vào Settings > Security
2. Bật "Require 2FA for Admins"
3. Tất cả admin phải enable 2FA trong 7 ngày

**Quản lý 2FA người dùng:**
- Xem danh sách đã bật 2FA
- Reset 2FA cho người dùng
- Bắt buộc bật cho vai trò cụ thể

### 13.3. IP Whitelist/Blacklist

**Whitelist:**
- Chỉ cho phép IP cụ thể truy cập admin
- Thêm/Xóa IP
- Bypass cho emergency

**Blacklist:**
- Chặn IP có hành vi xấu
- Auto-ban sau X lần failed login
- Thời gian ban: Vĩnh viễn hoặc tạm thời

### 13.4. Security Audit

**Kiểm tra định kỳ:**
- [ ] Xem audit logs hàng ngày
- [ ] Kiểm tra người dùng không hoạt động
- [ ] Review quyền và vai trò
- [ ] Kiểm tra phiên đăng nhập lạ
- [ ] Update password admin 3 tháng/lần
- [ ] Test backup và restore

---

## 14. XỬ LÝ SỰ CỐ

### 14.1. Người dùng quên mật khẩu

**Admin reset password:**
1. Vào trang quản lý người dùng
2. Tìm người dùng
3. Click "Reset mật khẩu"
4. Chọn phương thức:
   - Gửi email reset link
   - Tạo mật khẩu tạm
5. Gửi cho người dùng

### 14.2. Tài khoản bị hack

**Xử lý ngay:**
1. Kết thúc tất cả phiên đăng nhập
2. Vô hiệu hóa tài khoản tạm thời
3. Reset mật khẩu
4. Kiểm tra audit logs
5. Kiểm tra hoạt động bất thường
6. Thông báo cho người dùng
7. Yêu cầu đổi mật khẩu và bật 2FA
8. Kích hoạt lại tài khoản

### 14.3. Mất dữ liệu

**Restore từ backup:**
1. Xác định thời điểm mất dữ liệu
2. Tìm backup gần nhất
3. Thông báo tất cả người dùng
4. Thực hiện restore (xem mục 10.3)
5. Kiểm tra dữ liệu sau restore
6. Phân tích nguyên nhân
7. Ngăn chặn tái diễn

### 14.4. Lỗi hệ thống

**Các bước xử lý:**
1. **Xác định vấn đề:**
   - Kiểm tra error logs
   - Kiểm tra database connection
   - Kiểm tra disk space
   - Kiểm tra memory/CPU

2. **Thông báo:**
   - Đăng announcement
   - Email người dùng
   - Ước tính thời gian sửa

3. **Khắc phục:**
   - Fix bug
   - Restart services
   - Clear cache
   - Test thoroughly

4. **Theo dõi:**
   - Monitor sau fix
   - Document issue
   - Update runbook

### 14.5. Liên hệ hỗ trợ

**Khi cần hỗ trợ kỹ thuật:**

**Chuẩn bị thông tin:**
- Mô tả vấn đề chi tiết
- Steps to reproduce
- Screenshots/Videos
- Error logs
- System info

**Liên hệ:**
- Email: support@tapchi-hcqs.vn
- Hotline: 024.xxxx.xxxx
- Mức độ: URGENT/HIGH/MEDIUM/LOW

---

## 📞 HỖ TRỢ

### Tài liệu bổ sung
- [Hướng dẫn tác giả](USER_GUIDE_AUTHOR.md)
- [Hướng dẫn phản biện](USER_GUIDE_REVIEWER.md)
- [Hướng dẫn biên tập viên](USER_GUIDE_EDITOR.md)
- [API Documentation](API_DOCS.md)

### Video hướng dẫn
- Quản lý người dùng
- Phê duyệt tài khoản
- Backup và Restore
- Cấu hình hệ thống

### FAQs
Xem [FAQs.md](FAQs.md) cho các câu hỏi thường gặp.

---

**Cập nhật lần cuối:** 08/01/2026
**Phiên bản:** 2.0
**Liên hệ:** support@tapchi-hcqs.vn
