# 📦 LOCAL STORAGE MIGRATION - COMPLETE GUIDE

**Date**: January 7, 2026  
**System**: Tạp chí Khoa học Quân sự (HCQS Journal)  
**Migration**: AWS S3 → Local Filesystem Storage

---

## 📊 OVERVIEW

Hệ thống đã chuyển từ AWS S3 sang **Local Filesystem Storage** để:
- ✅ **Tự chủ 100%**: Không phụ thuộc Internet/Cloud
- ✅ **Bảo mật cao hơn**: Dữ liệu lưu trên server nội bộ
- ✅ **Kiểm soát tốt hơn**: Quản lý file trực tiếp
- ✅ **Chi phí thấp hơn**: Không tốn phí S3

---

## 🗂️ CẤU TRÚC THƯ MỤC

```
/home/ubuntu/tapchi-hcqs/nextjs_space/upload/
├── images/
│   ├── articles/      # Ảnh bài viết
│   ├── users/         # Avatar người dùng
│   ├── banners/       # Banner trang chủ
│   └── issues/        # Ảnh bìa số tạp chí
├── videos/
│   ├── uploads/       # Video upload
│   └── gallery/       # Video thư viện
├── documents/
│   ├── manuscripts/   # Bản thảo (PRIVATE)
│   ├── reviews/       # Tài liệu phản biện (PRIVATE)
│   └── issues/        # PDF số tạp chí (PUBLIC)
└── temp/              # File tạm (tự động xóa)
```

---

## 🔐 PHÂN QUYỀN TRUY CẬP

### Public Files (Truy cập tự do)
- Ảnh articles, banners, issue covers
- Video gallery
- PDF số tạp chí đã xuất bản
- **URL**: `/api/files/public/[...path]`

### Private Files (Cần xác thực)
- Bản thảo manuscripts
- Tài liệu phản biện
- CV/thẻ công tác khi đăng ký
- **URL**: `/api/files/private/[...path]`
- **Permission Check**: Owner, Admin, hoặc Reviewer được phân công

---

## 🛠️ API USAGE

### 1. Upload File

```typescript
const formData = new FormData();
formData.append('file', file);
formData.append('category', 'article-image'); // or 'manuscript', 'banner', etc.
formData.append('isPublic', 'true'); // or 'false' for private files

const response = await fetch('/api/files/upload', {
  method: 'POST',
  body: formData,
});

const { cloud_storage_path, url } = await response.json();
```

### 2. Get File URL

```typescript
import { getFileUrl } from '@/lib/local-storage';

// Public file
const publicUrl = getFileUrl('images/articles/123-abc.jpg', true);
// → /api/files/public/images/articles/123-abc.jpg

// Private file (requires auth)
const privateUrl = getFileUrl('documents/manuscripts/456-xyz.pdf', false);
// → /api/files/private/documents/manuscripts/456-xyz.pdf
```

### 3. Delete File

```typescript
import { deleteFile } from '@/lib/local-storage';

await deleteFile('images/articles/old-image.jpg');
```

---

## 📝 FILE CATEGORIES

| Category | Path | Public | Max Size | MIME Types |
|----------|------|--------|----------|------------|
| `article-image` | `images/articles/` | ✅ | 5MB | JPEG, PNG, WebP, GIF |
| `user-avatar` | `images/users/` | ✅ | 5MB | JPEG, PNG, WebP |
| `banner` | `images/banners/` | ✅ | 5MB | JPEG, PNG, WebP |
| `issue-cover` | `images/issues/` | ✅ | 5MB | JPEG, PNG, WebP |
| `video` | `videos/uploads/` | ✅ | 100MB | MP4, WebM, OGG |
| `video-gallery` | `videos/gallery/` | ✅ | 100MB | MP4, WebM, OGG |
| `manuscript` | `documents/manuscripts/` | ❌ | 50MB | PDF, DOC, DOCX |
| `review-file` | `documents/reviews/` | ❌ | 50MB | PDF, DOC, DOCX |
| `issue-pdf` | `documents/issues/` | ✅ | 50MB | PDF |
| `temp` | `temp/` | ❌ | 10MB | Any |

---

## 🔄 SAO LƯU & KHÔI PHỤC

### Sao lưu thủ công

```bash
# Backup upload directory
sudo tar -czf /backup/upload_$(date +%Y%m%d_%H%M%S).tar.gz \
  /home/ubuntu/tapchi-hcqs/nextjs_space/upload/

# Backup database
cd /home/ubuntu/tapchi-hcqs/nextjs_space
bash scripts/backup-db.sh
```

### Khôi phục từ backup

```bash
# Restore upload directory
sudo tar -xzf /backup/upload_20260107_120000.tar.gz -C /

# Restore database
cd /home/ubuntu/tapchi-hcqs/nextjs_space
bash scripts/restore-db.sh /backup/db-backup-20260107-120000.sql.gz
```

### Cấu hình tự động sao lưu (Cron)

```bash
# Chỉnh sửa crontab
crontab -e

# Thêm dòng: Sao lưu mỗi ngày lúc 2:00 AM
0 2 * * * /home/ubuntu/tapchi-hcqs/nextjs_space/scripts/backup-db.sh
0 2 * * * tar -czf /backup/upload_$(date +\%Y\%m\%d).tar.gz /home/ubuntu/tapchi-hcqs/nextjs_space/upload/
```

---

## 🚨 TROUBLESHOOTING

### Lỗi: "Permission denied"
```bash
# Fix quyền cho thư mục upload
sudo chown -R ubuntu:ubuntu /home/ubuntu/tapchi-hcqs/nextjs_space/upload
sudo chmod -R 755 /home/ubuntu/tapchi-hcqs/nextjs_space/upload
```

### Lỗi: "File not found"
- Kiểm tra `cloud_storage_path` trong database
- Xác nhận file tồn tại: `ls -lh /home/ubuntu/tapchi-hcqs/nextjs_space/upload/...`
- Check UPLOAD_ROOT trong `.env`

### Lỗi: "File size exceeds limit"
- Kiểm tra `FILE_SIZE_LIMITS` trong `lib/local-storage.ts`
- Tăng giới hạn nếu cần (cân nhắc server capacity)

### Lỗi: "Invalid MIME type"
- Kiểm tra `ALLOWED_MIME_TYPES` trong `lib/local-storage.ts`
- Thêm MIME type mới nếu cần

---

## 📈 MONITORING

### Kiểm tra dung lượng

```bash
# Check upload directory size
du -sh /home/ubuntu/tapchi-hcqs/nextjs_space/upload/*

# Check disk space
df -h /home/ubuntu
```

### Dọn dẹp file tạm

```bash
# Cleanup temp files older than 7 days
find /home/ubuntu/tapchi-hcqs/nextjs_space/upload/temp -type f -mtime +7 -delete
```

### View logs

```bash
# Check application logs
pm2 logs tapchi-hcqs

# Check upload errors
grep "Upload error" /var/log/tapchi-hcqs/app.log
```

---

## 🔧 MAINTENANCE

### Định kỳ (Hàng tháng)
1. ✅ Kiểm tra dung lượng disk
2. ✅ Xóa file tạm (temp/)
3. ✅ Backup toàn bộ upload/
4. ✅ Test khôi phục từ backup

### Khi nâng cấp server
1. ✅ Backup trước khi nâng cấp
2. ✅ Copy upload/ sang server mới
3. ✅ Update UPLOAD_ROOT trong .env
4. ✅ Test upload/download sau nâng cấp

---

## 📞 HỖ TRỢ

- **Technical Lead**: [Your name]
- **Documentation**: `/home/ubuntu/tapchi-hcqs/nextjs_space/LOCAL_STORAGE_GUIDE.md`
- **Migration Report**: `/home/ubuntu/tapchi-hcqs/nextjs_space/PHASE2_COMPLETED.md`

---

**Last Updated**: January 7, 2026  
**Version**: 1.0.0
