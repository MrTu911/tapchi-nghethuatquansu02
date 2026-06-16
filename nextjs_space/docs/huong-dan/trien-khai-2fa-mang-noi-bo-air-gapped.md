# Triển khai Xác thực 2 lớp (2FA) & chạy air-gapped trên mạng truyền số liệu quân sự (LAN)

> Tài liệu vận hành cho việc cài đặt hệ thống Tạp chí Nghệ thuật Quân sự Việt Nam
> trên **mạng nội bộ quân sự, không có internet (air-gapped)**.

## 1. Google Authenticator có dùng được không?

**Có về kỹ thuật, nhưng không khuyến nghị dùng đúng app của Google.**

- Google Authenticator dùng chuẩn **TOTP (RFC 6238)**: mã 6 số được sinh hoàn toàn
  **offline** từ *khóa bí mật + đồng hồ thiết bị*, không cần internet để sinh mã hay
  để máy chủ xác minh.
- Tuy nhiên, **không nên** bắt buộc đúng app Google trên mạng nghiệp vụ quân sự vì:
  chính sách hạn chế phần mềm nước ngoài; app phải tải từ store (cần internet 1 lần);
  không kiểm toán được mã nguồn.

**Khuyến nghị:** giữ chuẩn TOTP (hệ thống đã hỗ trợ sẵn), nhưng dùng **ứng dụng xác
thực mã nguồn mở / nội bộ** — ví dụ **FreeOTP** (Red Hat) hoặc **Aegis Authenticator**,
hoặc ứng dụng do đơn vị tự xây. Mọi app TOTP chuẩn đều tương thích với máy chủ.

## 2. Phương thức 2FA trong hệ thống

| Phương thức | Trạng thái | Ghi chú |
|---|---|---|
| **TOTP** (ứng dụng xác thực) | ✅ Phương thức chính | Offline 100%; thiết lập bằng quét QR hiển thị tại chỗ |
| **Backup codes** | ✅ Dự phòng bắt buộc | 10 mã, mỗi mã dùng 1 lần; cứu khi mất/hỏng điện thoại |
| Email OTP | ⛔ Đã ẩn | Cần SMTP gửi email — không khả dụng trên LAN không internet |

Người dùng thiết lập 2FA tại: **Dashboard → Cài đặt bảo mật → Quản lý 2FA**.

## 3. Điều kiện hạ tầng BẮT BUỘC

### 3.1. Đồng bộ thời gian (NTP) — điều kiện sống còn của TOTP
TOTP dựa trên thời gian Unix tuyệt đối. Nếu đồng hồ máy chủ trôi, **toàn bộ** mã TOTP
sẽ sai và mọi người không đăng nhập được.

- Dựng **NTP server nội bộ** trên LAN (nguồn GPS hoặc máy chủ thời gian chuẩn của đơn vị).
- Cấu hình máy chủ ứng dụng đồng bộ về NTP nội bộ (ví dụ `chrony`):
  ```
  # /etc/chrony/chrony.conf
  server <IP-NTP-noi-bo> iburst
  ```
  Kiểm tra: `chronyc tracking` (độ lệch phải < vài giây).
- **Điện thoại làm authenticator:** đặt giờ tự động/đúng giờ. Nếu điện thoại cũng
  air-gapped, phải đồng bộ giờ định kỳ thủ công.
- Dung sai phía máy chủ hiện đặt `window = 1` (±30s) trong
  `lib/two-factor.ts`. Khi đã có NTP, **giữ nguyên** (an toàn hơn). Chỉ nâng lên `2`
  (±60s) nếu thực tế đo được lệch lớn — đây là đánh đổi bảo mật.

### 3.2. Quy trình backup codes
Offline **không có** kênh email/SMS để khôi phục. Mất điện thoại mà không có backup
code = mất quyền truy cập. Vì vậy:
- Khi cấp tài khoản / bật 2FA: **in và niêm phong** backup codes, lưu nơi an toàn (két).
- Quản trị viên cần quy trình reset 2FA an toàn (xác minh danh tính trực tiếp) cho
  trường hợp người dùng mất cả điện thoại lẫn backup codes.

## 4. Đã gỡ phụ thuộc internet (air-gapped hardening)

- **Font:** self-host tại `public/fonts/` (`fonts.css` + thư mục `files/`). Không còn
  gọi Google Fonts. Các reader (`KindleReader`, `EpubReader`, HTML tĩnh) đã trỏ về local.
- **Thư viện JS reader:** `jszip`, `epubjs` self-host tại `public/vendor/`. Không còn
  gọi `cdn.jsdelivr.net`.
- **CSP:** `middleware.ts` đã siết về `'self'` — chặn mọi origin ngoài (không còn
  whitelist Google Fonts/CDN, không còn ngoại lệ cho `/library` và `/data/issues`).
- **Cờ môi trường (`.env`):** `USE_AWS=false` (lưu file local), `SMTP_ENABLED=false`
  (không gửi email), không cấu hình Upstash → rate-limit dùng in-memory fallback.
- **ORCID / Crossref:** không tự gọi ra ngoài khi duyệt trang; chỉ kích hoạt qua thao
  tác quản trị — bỏ qua trong môi trường offline.

## 5. ⚠️ Lưu ý khi BUILD

`app/layout.tsx` dùng `next/font/google` (Lora). `next/font` **tải font lúc BUILD** rồi
self-host vào bản build → **runtime không cần internet**. Vì vậy:

- **Build trên máy có internet**, sau đó copy bản build (`.next`) sang máy chủ air-gapped
  và chạy `npm start` (mô hình hiện tại: pm2 production build).
- Nếu bắt buộc build *trên* máy air-gapped, cần chuyển Lora sang `next/font/local` dùng
  file woff2 đã có trong `public/fonts/files/`.

## 6. Kiểm thử nghiệm thu (offline)

1. Ngắt internet máy chủ. Thiết lập 2FA bằng FreeOTP/Aegis: quét QR → nhập mã → bật
   thành công → nhận backup codes. Đăng xuất, đăng nhập lại bằng mã TOTP. Thử 1 backup
   code (vào được, code đó bị vô hiệu lần sau).
2. DevTools → Network khi duyệt trang chủ, `/library`, đọc số báo, dashboard:
   **0 request** tới `fonts.googleapis.com`, `gstatic`, `jsdelivr`, `orcid.org`,
   `crossref`, S3, Upstash. Header `Content-Security-Policy` chỉ còn `'self'`.
3. `chronyc tracking`: đồng bộ NTP nội bộ, lệch < vài giây.
4. UI thiết lập 2FA không còn lựa chọn Email OTP.
5. Sai mã TOTP > 5 lần/10 phút → bị chặn 429 (rate-limit in-memory).

## 7. Hướng mở rộng tương lai

Nếu sau này **cấm điện thoại** trong khu vực bảo mật → chuyển sang **token phần cứng
FIDO2/U2F** (cần bổ sung WebAuthn vào hệ thống) — là một phase phát triển riêng.
