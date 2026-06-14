# Thư mục Upload - Hệ thống Lưu trữ File Nội bộ

## Cấu trúc Thư mục

```
upload/
├── images/                  # Ảnh
│   ├── articles/           # Ảnh bài viết
│   ├── users/              # Avatar người dùng
│   ├── banners/            # Banner trang chủ
│   └── issues/             # Ảnh bìa số báo
├── videos/                 # Video
│   └── gallery/            # Video gallery
├── documents/              # Tài liệu
│   ├── manuscripts/        # Bản thảo PDF
│   ├── reviews/            # File phản biện
│   └── issues/             # PDF số báo
└── temp/                   # File tạm thời
```

## Nguyên tắc Lưu trữ

### 1. Phân loại Rõ ràng
- Mỗi loại file có thư mục riêng biệt
- Không trộn lẫn các loại file khác nhau
- Dễ dàng tìm kiếm và quản lý

### 2. Database và Filesystem
- **Filesystem**: Lưu file thực tế
- **Database**: Chỉ lưu metadata (tên, đường dẫn, loại, kích thước)
- **Quyền truy cập**: Kiểm soát ở backend API

### 3. Public vs Private

#### Public Files (isPublic = true)
- **Loại**: Ảnh bài viết, banner, ảnh bìa số báo
- **Truy cập**: `/api/files/public/{path}`
- **Không cần authentication**
- **Cache**: Lâu dài (1 năm)

#### Private Files (isPublic = false)
- **Loại**: Bản thảo, file phản biện, tài liệu nhạy cảm
- **Truy cập**: `/api/files/private/{path}`
- **Yêu cầu authentication + kiểm tra quyền**
- **Cache**: Không cache
- **Audit log**: Ghi lại mọi lần truy cập

## Giới hạn Kỹ thuật

### Kích thước File
- **Ảnh**: Tối đa 5MB (JPEG, PNG, WebP, GIF)
- **Video**: Tối đa 100MB (MP4, WebM)
- **Tài liệu**: Tối đa 50MB (PDF, Word)

### Đặt tên File
- Format: `{timestamp}-{random}-{original-name}.{ext}`
- Ví dụ: `1735551234567-a8f3c2-manuscript.pdf`
- **Lý do**: Tránh trùng lặp, dễ sắp xếp theo thời gian

## Bảo mật

### 1. Kiểm soát Quyền
```typescript
// Owner: Tác giả của submission
const isOwner = fileRecord.uploaderId === session.uid;

// Admin: SYSADMIN, EIC, MANAGING_EDITOR
const isAdmin = ['SYSADMIN', 'EIC', 'MANAGING_EDITOR'].includes(session.role);

// Reviewer: Phản biện được phân công
const isReviewer = submission.reviews.some(r => r.reviewerId === session.uid);
```

### 2. Audit Log
Mọi lần truy cập file private đều được ghi lại:
- Người truy cập
- Thời gian
- File nào
- Kết quả (thành công / từ chối)

## Sao lưu (Backup)

### Cách sao lưu
```bash
# Backup thư mục upload
tar czf backup-upload-$(date +%Y%m%d).tar.gz upload/

# Sao chép sang ổ rời / NAS
cp backup-upload-*.tar.gz /mnt/backup/
```

### Tần suất khuyến nghị
- **Hàng ngày**: Backup incremental
- **Hàng tuần**: Backup full
- **Lưu trữ**: Ít nhất 3 tháng

## Quản lý & Bảo trì

### 1. Dọn dẹp File Tạm
Chạy hàng ngày để xóa file cũ trong `temp/`:

```typescript
import { cleanupTempFiles } from '@/lib/local-storage';

// Xóa file cũ hơn 24 giờ
await cleanupTempFiles(24);
```

### 2. Kiểm tra Dung lượng
```bash
# Kiểm tra tổng dung lượng
du -sh upload/

# Kiểm tra theo thư mục
du -h --max-depth=2 upload/
```

### 3. Kiểm tra Toàn vẹn
```bash
# Kiểm tra file bị hỏng
find upload/ -type f -name '*.pdf' -exec pdfinfo {} \; > /dev/null

# Kiểm tra quyền
find upload/ -type f ! -perm 644 -ls
```

## Lưu ý Deployment

### 1. Persistence
⚠️ **QUAN TRỌNG**: Thư mục `upload/` **KHÔNG ĐƯỢC** nằm trong source code.

**Đúng**:
```
/var/data/app_uploads/    <- Mount ở đây
/var/www/app/             <- Source code
```

**Sai**:
```
/var/www/app/upload/      <- Sẽ bị xóa khi redeploy!
```

### 2. Environment Variable
Trong production, set `UPLOAD_ROOT` đến persistent storage:

```bash
UPLOAD_ROOT=/var/data/app_uploads
```

### 3. Quyền Truy cập
```bash
# Đảm bảo Node.js process có quyền ghi
chown -R www-data:www-data /var/data/app_uploads
chmod -R 755 /var/data/app_uploads
```

## Troubleshooting

### Lỗi: "File not found"
1. Kiểm tra `UPLOAD_ROOT` trong `.env`
2. Kiểm tra quyền thư mục: `ls -la upload/`
3. Kiểm tra path trong database khớp với filesystem

### Lỗi: "Permission denied"
1. Kiểm tra quyền file: `ls -l upload/images/articles/`
2. Chạy: `chmod 644 upload/**/*`
3. Kiểm tra owner: `chown -R $USER:$USER upload/`

### Lỗi: "Disk full"
1. Kiểm tra dung lượng: `df -h`
2. Dọn dẹp temp: `rm -rf upload/temp/*`
3. Nén file cũ: `gzip upload/documents/**/*.pdf`

## Liên hệ

Nếu có vấn đề, liên hệ:
- **Kỹ thuật**: support@tapchinckhhcqs.vn
- **Hệ thống**: admin@tapchinckhhcqs.vn
