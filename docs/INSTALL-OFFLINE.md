# Cài đặt OFFLINE từ USB — Máy chủ mạng quân sự (air-gapped)

Tài liệu này hướng dẫn tạo **gói cài đặt USB tự chứa** và cài vào **máy chủ
Ubuntu x64 trắng, không có internet**. Mọi thành phần (Node, PostgreSQL, app đã
build sẵn, dữ liệu seed) nằm trong gói — quá trình cài **không chạm internet**.

Quy trình gồm **2 giai đoạn**:

```
[A] Máy STAGING có internet                 [B] Máy chủ AIR-GAPPED (trắng)
    build-usb-package.sh         ──USB──►       offline-install.sh
    → tarball tự chứa                            → Node + PostgreSQL + app + seed
```

---

## 0. Điều kiện bắt buộc: KHỚP MÔI TRƯỜNG

Máy staging (đóng gói) phải **khớp với máy chủ đích**:

- **Cùng kiến trúc**: `x86_64` (x64).
- **Cùng dòng Ubuntu/Debian** (để gói `.deb` PostgreSQL và native module chạy được).

> Vì sao? Native module (`sharp`, `canvas`, `tesseract.js`, `@sparticuz/chromium`)
> biên dịch theo glibc/ABI của máy build; gói `.deb` PostgreSQL phụ thuộc release.
> Sai release → cài `.deb` thiếu phụ thuộc hoặc app lỗi nhị phân.

Nếu staging **khác** release với máy chủ đích: dùng Docker (mục 1) để lấy đúng
closure `.deb` cho release đích.

---

## 1. Giai đoạn A — Đóng gói trên máy staging (có internet)

```bash
cd nextjs_space
bash scripts/setup/build-usb-package.sh --ubuntu-codename jammy
```

Thay `jammy` bằng codename của **máy chủ đích** (`focal` = 20.04, `jammy` = 22.04,
`noble` = 24.04…). Lệnh `lsb_release -cs` trên máy chủ cho biết codename.

Script sẽ:

1. `npm ci` + `prisma generate` + `npm run build` (build sẵn `.next` production).
2. Tải **Node** (đúng phiên bản đang chạy trên staging) bản `linux-x64`.
3. Tải **closure `.deb` PostgreSQL** — ưu tiên qua Docker image `ubuntu:<codename>`
   để lấy đầy đủ phụ thuộc đúng release.
4. Copy app kèm `node_modules` + `.next` (KHÔNG prune — cần `tsx`/`prisma`/chromium
   khi cài offline).
5. Sinh `offline-install.sh`, `MANIFEST.txt`, `SHA256SUMS`.
6. Nén thành `ntqs-offline-<ngày>.tar.gz`.

### Cờ build-usb-package.sh

| Cờ | Ý nghĩa |
|---|---|
| `--ubuntu-codename <name>` | Release Ubuntu của máy chủ đích (để lấy `.deb`). |
| `--node-version <vX.Y.Z>` | Phiên bản Node bundle (mặc định = node staging). |
| `--out <dir>` | Thư mục xuất (mặc định `<repo>/ntqs-offline-build`). |
| `--skip-build` | Dùng lại `.next`/`node_modules` có sẵn. |
| `--skip-postgres` | Không tải `.deb` (máy chủ đã có PostgreSQL). |

**Kết quả**: copy file `ntqs-offline-<ngày>.tar.gz` ra USB. Ghi lại dòng `SHA256`
mà script in ra để đối chiếu ở giai đoạn B.

> Yêu cầu staging: `npm`, `rsync`, `curl`, `sha256sum`, và (khuyến nghị) `docker`.

---

## 2. Giai đoạn B — Cài trên máy chủ air-gapped (trắng)

Cắm USB, copy & giải nén gói, rồi chạy installer bằng **root**:

```bash
mkdir -p /opt/ntqs-usb && tar -xzf /media/usb/ntqs-offline-*.tar.gz -C /opt/ntqs-usb
cd /opt/ntqs-usb
sudo bash offline-install.sh
```

`offline-install.sh` sẽ:

1. Kiểm tra `SHA256SUMS` (toàn vẹn gói) + arch x64.
2. Cài **Node** từ gói (giải nén vào `/usr/local`) nếu máy chưa có.
3. Cài **PostgreSQL** từ `.deb` (nếu chưa có) và khởi động dịch vụ.
4. Copy app vào `/opt/tapchi-ntqs`.
5. Gọi `setup.sh --offline --with-pm2`:
   - **Hỏi cấu hình** (hồ sơ air-gap — mọi dịch vụ internet TẮT sẵn): kết nối DB,
     URL/IP nội bộ, cổng.
   - **Tự tạo DB + user** (PostgreSQL mới cài dùng quyền `postgres` qua peer auth —
     khi hỏi mật khẩu admin, cứ Enter để trống).
   - `prisma db push` + vá SQL + tạo thư mục upload.
   - **Hỏi mức seed** (`full`/`minimal`).
   - Khởi động bằng pm2 + kiểm tra `/api/health`.

### Cờ offline-install.sh

| Cờ | Ý nghĩa |
|---|---|
| `--install-dir <dir>` | Thư mục cài app (mặc định `/opt/tapchi-ntqs`). |
| `--seed=full` / `--seed=minimal` | Chọn sẵn mức seed. |
| `--skip-verify` | Bỏ qua kiểm checksum. |
| `--non-interactive` | Không hỏi (đọc cấu hình từ biến môi trường). |

Bật chạy cùng máy: làm theo lệnh `pm2 startup` in ra, rồi `pm2 save`.

---

## 3. Vận hành air-gap — lưu ý quan trọng

- **Đồng bộ thời gian (NTP nội bộ)**: TOTP/2FA phụ thuộc đồng hồ. Máy chủ air-gap
  cần một nguồn NTP nội bộ; lệch giờ → mã 2FA sai.
- **Không dịch vụ internet**: ORCID, Crossref, iThenticate, S3, SMTP đều TẮT. Lưu
  trữ file dùng local (`public/uploads`), rate-limit dùng in-memory, đạo văn dùng
  engine nội bộ.
- **Font/JS self-host + CSP `'self'`**: app đã đóng gói tài nguyên tĩnh, không gọi
  CDN. Xuất PDF tiếng Việt dùng chromium bundled (`@sparticuz/chromium`) — không tải mạng.
- **Backup codes 2FA**: in/lưu mã dự phòng khi bật 2FA (không có email khôi phục).

---

## 4. Khắc phục sự cố offline

| Triệu chứng | Nguyên nhân & xử lý |
|---|---|
| `dpkg` báo thiếu phụ thuộc khi cài PostgreSQL | Sai Ubuntu codename khi đóng gói. Đóng gói lại với `--ubuntu-codename` đúng (dùng Docker). |
| App lỗi nhị phân (`invalid ELF`, `cannot open shared object`) | Native module sai arch/release. Build lại trên staging khớp máy chủ; nếu có toolchain: `cd /opt/tapchi-ntqs && npm rebuild`. |
| Xuất PDF lỗi | Chromium bundled không chạy được — kiểm thư viện hệ thống tối thiểu (fontconfig, libnss3…); cân nhắc bundle thêm gói `.deb` phụ thuộc chromium. |
| Không tạo được DB | PostgreSQL chưa chạy. `systemctl status postgresql`; khởi động rồi chạy lại `offline-install.sh` (hoặc `bash setup.sh --offline`). |
| Checksum không khớp | Gói hỏng khi copy USB. Copy lại; nếu chắc chắn, `--skip-verify`. |

---

## 5. Cập nhật phiên bản (re-deploy offline)

1. Trên staging: kéo code mới, chạy lại `build-usb-package.sh` → tarball mới.
2. Trên máy chủ: giải nén gói mới, `sudo bash offline-install.sh` (cùng
   `--install-dir`). Seed idempotent nên dữ liệu không bị nhân đôi; chọn `minimal`
   nếu chỉ muốn cập nhật nhận diện, không đụng dữ liệu nghiệp vụ.
