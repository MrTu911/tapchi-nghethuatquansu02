# 📦 HỆ THỐNG TẠP CHÍ KHOA HỌC HẬU CẦN QUÂN SỰ - BỘ CÀI ĐẶT

## 📑 CẤU TRÚC THƯ MỤC

```
tapchi-hcqs/
├── deployment/              # Bộ cài đặt
│   ├── setup.sh           # Script cài đặt chính ⭐
│   ├── uninstall.sh       # Script gỡ cài đặt
│   ├── update.sh          # Script cập nhật
│   ├── check-requirements.sh  # Kiểm tra yêu cầu
│   ├── README.md          # Hướng dẫn đầy đủ 📚
│   ├── QUICK_START.md    # Hướng dẫn nhanh ⚡
│   ├── .env.example       # Mẫu file cấu hình
│   ├── CHANGELOG.md       # Lịch sử thay đổi
│   └── INDEX.md           # File này
│
├── nextjs_space/           # Mã nguồn ứng dụng
│   ├── app/               # Next.js App Router
│   ├── components/        # React components
│   ├── lib/               # Utilities
│   ├── prisma/            # Database schema
│   ├── public/            # Static files
│   ├── scripts/           # Utility scripts
│   ├── package.json       # Dependencies
│   └── tsconfig.json      # TypeScript config
│
└── docs/                  # Tài liệu
    ├── SYSTEM_REPORT.md   # Báo cáo hệ thống
    ├── USER_GUIDE_SYSADMIN.md  # Hướng dẫn Admin
    └── API_DOCS.md        # Tài liệu API
```

---

## 🚀 BẮT ĐẦU NHANH (5 PHÚT)

### Bước 1: Upload lên server
```bash
scp -r tapchi-hcqs user@server-ip:/home/user/
```

### Bước 2: Kiểm tra yêu cầu
```bash
cd /home/user/tapchi-hcqs/deployment
sudo ./check-requirements.sh
```

### Bước 3: Cài đặt
```bash
sudo ./setup.sh
```

### Bước 4: Truy cập
```
URL: http://your-domain-or-ip:3000
Email: admin@tapchi-hcqs.vn
Password: Admin@123
```

⚠️ **LƯU Ý:** Đọc QUICK_START.md để biết chi tiết!

---

## 📚 TÀI LIỆU

### 1. Hướng Dẫn Cài Đặt
| File | Mô tả | Độ dài |
|------|------|-------|
| **QUICK_START.md** | Hướng dẫn cài đặt nhanh 5 phút | ~200 dòng |
| **README.md** | Hướng dẫn đầy đủ với troubleshooting | ~800 dòng |
| **.env.example** | Mẫu file cấu hình với giải thích | ~100 dòng |

### 2. Tài Liệu Hệ Thống
| File | Mô tả | Độ dài |
|------|------|-------|
| **SYSTEM_REPORT.md** | Báo cáo toàn diện hệ thống | ~8,000 dòng |
| **USER_GUIDE_SYSADMIN.md** | Hướng dẫn quản trị viên | ~5,000 dòng |
| **CHANGELOG.md** | Lịch sử thay đổi phiên bản | ~200 dòng |

---

## 🛠️ SCRIPTS

### Cài Đặt & Bảo Trì

| Script | Mục đích | Cách sử dụng |
|--------|---------|-------------|
| **check-requirements.sh** | Kiểm tra yêu cầu hệ thống | `sudo ./check-requirements.sh` |
| **setup.sh** ⭐ | Cài đặt toàn bộ hệ thống | `sudo ./setup.sh` |
| **update.sh** | Cập nhật phiên bản mới | `sudo ./update.sh` |
| **uninstall.sh** | Gỡ bỏ hệ thống | `sudo ./uninstall.sh` |

### Thời Gian Thực Thi
- **check-requirements.sh:** < 1 phút
- **setup.sh:** 5-10 phút (tùy server)
- **update.sh:** 3-5 phút
- **uninstall.sh:** 1-2 phút

---

## 💻 YÊU CẦU HỆ THỐNG

### Phần Cứng Tối Thiểu
- ✅ CPU: 2 cores
- ✅ RAM: 4GB (tối thiểu 2GB)
- ✅ Disk: 50GB SSD
- ✅ Network: 100Mbps

### Phần Mềm
- ✅ Ubuntu 20.04 LTS / 22.04 LTS
- ✅ Quyền root/sudo
- ✅ Kết nối internet (cho cài đặt)

### Port Cần Mở
- ✅ 22 (SSH)
- ✅ 80 (HTTP)
- ✅ 443 (HTTPS)
- ✅ 3000 (Ứng dụng - có thể thay đổi)

---

## ⚡ QUY TRÌNH CÀI ĐẶT

### Setup Script Sẽ Làm Gì?

1. ✅ **Cập nhật hệ thống**
   - `apt-get update && upgrade`

2. ✅ **Cài đặt phần mềm cơ bản**
   - curl, git, build-essential
   - nginx, ufw, fail2ban

3. ✅ **Cài đặt Node.js 18**
   - Từ NodeSource repository
   - Yarn package manager

4. ✅ **Cài đặt PostgreSQL 14**
   - Tạo database và user
   - Cấu hình permissions

5. ✅ **Tạo user & directories**
   - User: `tapchi`
   - App dir: `/opt/tapchi-hcqs`
   - Uploads: `/opt/tapchi-hcqs/uploads`

6. ✅ **Sao chép ứng dụng**
   - Từ `nextjs_space/` đến `/opt/tapchi-hcqs/`

7. ✅ **Tạo file .env**
   - Database URL
   - NEXTAUTH_URL & SECRET
   - Application settings

8. ✅ **Cài dependencies**
   - `yarn install`
   - `yarn prisma generate`

9. ✅ **Setup database**
   - `yarn prisma migrate deploy`
   - `yarn prisma db seed`

10. ✅ **Build ứng dụng**
    - `yarn build`

11. ✅ **Thiết lập systemd service**
    - Tự động khởi động
    - Quản lý process

12. ✅ **Cấu hình Nginx**
    - Reverse proxy
    - Static files caching

13. ✅ **Thiết lập Firewall**
    - UFW rules
    - Allow necessary ports

14. ✅ **Backup tự động**
    - Cron job hàng ngày
    - Lưu trữ 30 ngày

15. ✅ **Khởi động ứng dụng**
    - `systemctl start tapchi-hcqs`

---

## 📝 THÔNG TIN SAU CÀI ĐẶT

### File Quan Trọng

| File | Đường dẫn | Mục đích |
|------|---------|----------|
| **.env** | `/opt/tapchi-hcqs/.env` | Cấu hình ứng dụng |
| **CREDENTIALS.txt** | `/opt/tapchi-hcqs/CREDENTIALS.txt` | Thông tin đăng nhập |
| **Service file** | `/etc/systemd/system/tapchi-hcqs.service` | Systemd service |
| **Nginx config** | `/etc/nginx/sites-available/tapchi-hcqs` | Reverse proxy |

### Thư Mục Quan Trọng

| Thư mục | Đường dẫn | Mục đích |
|----------|---------|----------|
| **Application** | `/opt/tapchi-hcqs/` | Mã nguồn ứng dụng |
| **Uploads** | `/opt/tapchi-hcqs/uploads/` | File tải lên |
| **Backups** | `/opt/tapchi-hcqs/backups/` | Backup files |
| **Logs** | `/opt/tapchi-hcqs/logs/` | Application logs |

### Lệnh Quản Lý

```bash
# Xem trạng thái
sudo systemctl status tapchi-hcqs

# Khởi động lại
sudo systemctl restart tapchi-hcqs

# Xem logs
sudo journalctl -u tapchi-hcqs -f

# Backup thủ công
sudo /opt/tapchi-hcqs/scripts/auto-backup.sh
```

---

## 🔒 BẢO MẬT

### Tính Năng Bảo Mật

- ✅ Firewall (UFW) đã cấu hình
- ✅ Fail2ban cho brute-force protection
- ✅ Database user riêng biệt
- ✅ Application user không có shell login
- ✅ Secure .env file permissions (600)
- ✅ Audit logging cho mọi hành động

### Khuyến Nghị

1. ✅ Đổi mật khẩu admin ngay sau khi đăng nhập
2. ✅ Cài đặt SSL certificate (Let's Encrypt)
3. ✅ Thiết lập backup ngoại tuyến
4. ✅ Thường xuyên cập nhật hệ thống
5. ✅ Giám sát logs thường xuyên

---

## 🐛 XỬ LÝ SỰ CỐ

### Ứng dụng không khởi động?
```bash
# Xem logs
sudo journalctl -u tapchi-hcqs -n 100

# Kiểm tra port
sudo netstat -tulpn | grep 3000

# Kiểm tra database
sudo systemctl status postgresql
```

### Build errors?
```bash
# Xóa cache và build lại
cd /opt/tapchi-hcqs
sudo -u tapchi rm -rf .next node_modules
sudo -u tapchi yarn install
sudo -u tapchi yarn build
```

### Database issues?
```bash
# Kiểm tra connection
sudo -u postgres psql -c "SELECT 1;"

# Kiểm tra database
sudo -u postgres psql -l | grep tapchi
```

📚 **Đọc README.md để biết chi tiết về troubleshooting!**

---

## 📞 LIÊN HỆ HỖ TRỢ

### Thông Tin
- **Email:** support@tapchi-hcqs.vn
- **Hotline:** 024.xxxx.xxxx

### Tài Liệu Online
- [GitHub Repository](#)
- [Documentation](#)
- [Issue Tracker](#)

---

## 🎓 THÔNG TIN PHÁT TRIỂN

- **Tên dự án:** Tạp chí Khoa học Hậu cần Quân sự
- **Phiên bản:** 2.0.0
- **Ngày:** 08/01/2026
- **Phát triển:** DeepAgent - Abacus.AI
- **Công nghệ:** Next.js 14, TypeScript, Prisma, PostgreSQL
- **License:** Proprietary

---

## ✅ CHECKLIST CÀI ĐẶT

```
☐ Upload source code lên server
☐ Chạy check-requirements.sh
☐ Chạy setup.sh
☐ Ghi lại thông tin DATABASE từ CREDENTIALS.txt
☐ Truy cập ứng dụng
☐ Đăng nhập với admin account
☐ Đổi mật khẩu admin
☐ Kiểm tra các chức năng cơ bản
☐ Cài đặt SSL certificate (nếu có domain)
☐ Cấu hình email SMTP (optional)
☐ Test backup script
☐ Thiết lập monitoring
☐ Đọc hướng dẫn sử dụng
```

---

**CHÚC BẠN TRIỂN KHAI THÀNH CÔNG! 🎉**
