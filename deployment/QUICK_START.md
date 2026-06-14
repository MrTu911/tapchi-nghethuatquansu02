# 🚀 HƯỚNG DẪN CÀI ĐẶT NHANH

## BƯớc 1: Chuẩn Bị (2 phút)

### 1.1 Yêu cầu server
- Ubuntu 20.04/22.04 LTS
- 4GB RAM (tối thiểu 2GB)
- 50GB disk space
- Quyền root/sudo

### 1.2 Upload source code

```bash
# SSH vào server
ssh root@your-server-ip

# Upload file từ local (trên máy local)
scp -r /path/to/tapchi-hcqs root@your-server-ip:/root/

# Hoặc clone từ git
git clone <repo-url> /root/tapchi-hcqs
```

## BƯớc 2: Chạy Script Cài Đặt (3 phút)

```bash
# Di chuyển vào thư mục
cd /root/tapchi-hcqs/deployment

# Cấp quyền
chmod +x setup.sh

# Chạy cài đặt
sudo ./setup.sh
```

## BƯớc 3: Nhập Thông Tin

Script sẽ hỏi:

### Database:
```
Tên database [tapchi_hcqs]: ↵ (Enter để dùng mặc định)
Tên user [tapchi_user]: ↵
Mật khẩu: ↵ (Enter để tự động tạo)
```

### Application:
```
Domain name: tapchi.example.com
(hoặc để trống nếu chạy local)

Sử dụng HTTPS? [y]: y
Port [3000]: 3000
```

## BƯớc 4: Chờ Cài Đặt Hoàn Tất

Script sẽ tự động:
1. ✅ Cài Node.js, PostgreSQL, Nginx
2. ✅ Tạo database
3. ✅ Cài dependencies
4. ✅ Build ứng dụng
5. ✅ Khởi động service

**Thời gian:** 5-10 phút tùy tốc độ server

## BƯớc 5: Truy Cập Hệ Thống

### Nếu có domain:
```
https://your-domain.com
```

### Nếu localhost:
```
http://server-ip:3000
```

### Tài khoản đăng nhập:
```
Email: admin@tapchi-hcqs.vn
Password: Admin@123

⚠️ Đổi mật khẩu ngay!
```

## BƯớc 6: Cài Đặt SSL (Nếu có domain)

```bash
# Cài Certbot
sudo apt-get install certbot python3-certbot-nginx

# Lấy SSL certificate
sudo certbot --nginx -d your-domain.com

# Test auto-renew
sudo certbot renew --dry-run
```

## Kiểm Tra Cài Đặt

```bash
# Xem service đang chạy
sudo systemctl status tapchi-hcqs

# Xem logs
sudo journalctl -u tapchi-hcqs -f

# Test API
curl http://localhost:3000/api/health
```

## Xử Lý Lỗi Thường Gặp

### Lỗi 1: Port 3000 đã bị chiếm
```bash
# Tìm process đang dùng port
sudo lsof -i :3000

# Kill process
sudo kill -9 <PID>

# Hoặc đổi port trong .env
sudo nano /opt/tapchi-hcqs/.env
# Sửa: PORT=3001

# Khởi động lại
sudo systemctl restart tapchi-hcqs
```

### Lỗi 2: Database connection failed
```bash
# Kiểm tra PostgreSQL
sudo systemctl status postgresql
sudo systemctl start postgresql

# Test connection
sudo -u postgres psql -c "SELECT 1;"
```

### Lỗi 3: Build failed - Out of memory
```bash
# Tạo swap file
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Build lại
cd /opt/tapchi-hcqs
sudo -u tapchi NODE_OPTIONS="--max-old-space-size=4096" yarn build
sudo systemctl restart tapchi-hcqs
```

### Lỗi 4: Nginx 502 Bad Gateway
```bash
# Kiểm tra app đang chạy
sudo systemctl status tapchi-hcqs

# Xem logs
sudo journalctl -u tapchi-hcqs -n 50

# Khởi động lại
sudo systemctl restart tapchi-hcqs
```

## Các Lệnh Hữu Ích

```bash
# Xem mật khẩu đã tạo
sudo cat /opt/tapchi-hcqs/CREDENTIALS.txt

# Khởi động lại
sudo systemctl restart tapchi-hcqs

# Dừng
sudo systemctl stop tapchi-hcqs

# Xem logs realtime
sudo journalctl -u tapchi-hcqs -f

# Backup manual
sudo /opt/tapchi-hcqs/scripts/auto-backup.sh
```

## Tiếp Theo

1. 🔒 Đổi mật khẩu admin
2. ⚙️ Cấu hình email SMTP (nếu cần)
3. 📊 Kiểm tra dashboard analytics
4. 📋 Đọc hướng dẫn sử dụng: `../USER_GUIDE_SYSADMIN.md`
5. 📦 Thiết lập backup ngoại tuyến

---

**Cần trợ giúp?**
- 📝 Đọc README.md đầy đủ
- 📧 Email: support@tapchi-hcqs.vn
