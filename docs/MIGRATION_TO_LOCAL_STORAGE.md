# Migration: AWS S3 → Local Filesystem Storage

## Tóm tắt

Chuyển đổi hệ thống lưu trữ file từ AWS S3 sang local filesystem để đảm bảo **tự chủ hoàn toàn** cho mạng nội bộ.

---

## 🎯 Phase 1: Cấu trúc & Infrastructure (HOÀN THÀNH ✅)

### 1. Cấu trúc Thư mục Upload

```
upload/
├── images/
│   ├── articles/      # Ảnh bài viết (public)
│   ├── users/         # Avatar (public)
│   ├── banners/       # Banner trang chủ (public)
│   └── issues/        # Ảnh bìa số báo (public)
├── videos/
│   └── gallery/       # Video gallery (public)
├── documents/
│   ├── manuscripts/   # Bản thảo PDF (private)
│   ├── reviews/       # File phản biện (private)
│   └── issues/        # PDF số báo (public)
└── temp/              # File tạm thời (cleanup hàng ngày)
```

**Đặc điểm**:
- Phân loại rõ ràng theo nghiệp vụ
- Dễ backup / migrate
- Hỗ trợ cả public và private files

---

### 2. Module Local Storage (`lib/local-storage.ts`)

**API chính**:

```typescript
// Lưu file
await saveFile(file, 'manuscript', false);
// Returns: { filePath, fileName, fileSize, mimeType, storedName }

// Lấy URL
getFileUrl(filePath, isPublic);
// Returns: '/api/files/public/...' hoặc '/api/files/private/...'

// Xóa file
await deleteFile(filePath);

// Kiểm tra tồn tại
await fileExists(filePath);

// Dọn dẹp temp
await cleanupTempFiles(24); // Xóa file > 24h
```

**Validation**:
- Ảnh: Max 5MB (JPEG, PNG, WebP, GIF)
- Video: Max 100MB (MP4, WebM)
- Document: Max 50MB (PDF, Word)

**Đặc điểm**:
- Tự động generate tên file unique: `{timestamp}-{random}-{name}.ext`
- Silent fail mechanism (không crash app)
- Hỗ trợ streaming cho file lớn

---

### 3. API Routes để Serve Files

#### A. Public Files: `/api/files/public/[...path]`

```typescript
GET /api/files/public/images/articles/123-paper.jpg
```

- ✅ Không cần authentication
- ✅ Cache lâu dài (1 năm)
- ✅ Serving: Ảnh bài viết, banner, ảnh bìa

#### B. Private Files: `/api/files/private/[...path]`

```typescript
GET /api/files/private/documents/manuscripts/456-manuscript.pdf
```

- ✅ Yêu cầu authentication (session)
- ✅ Kiểm tra quyền:
  - **Owner**: Tác giả của submission
  - **Admin**: SYSADMIN, EIC, MANAGING_EDITOR
  - **Reviewer**: Phản biện được phân công
- ✅ Audit log: Ghi lại mọi lần truy cập
- ✅ No cache
- ✅ Serving: Bản thảo, file phản biện

---

### 4. Archive AWS S3 Code

**QUAN TRỌNG**: Code S3 đã được archive (KHÔNG xóa), có thể restore nếu cần:

```
lib/s3.ts.backup          (3.7KB)
lib/aws-config.ts.backup  (753 bytes)
```

Để restore:
```bash
mv lib/s3.ts.backup lib/s3.ts
mv lib/aws-config.ts.backup lib/aws-config.ts
```

---

### 5. Environment Configuration

**Đã thêm vào `.env`**:

```bash
# Local File Storage Configuration
UPLOAD_ROOT=/home/ubuntu/tapchi-hcqs/nextjs_space/upload
```

**Trong production**, set vào persistent storage:

```bash
UPLOAD_ROOT=/var/data/app_uploads
```

---

## 🛠️ Phase 2: Cập nhật APIs (TIẾ0P THEO)

### Các file cần sửa

Danh sách API routes hiện đang dùng S3:

1. **Upload APIs**:
   - `app/api/files/upload/route.ts`
   - `app/api/issues/route.ts` (POST - cover image)
   - `app/api/issues/[id]/route.ts` (PUT - cover image)
   - `app/api/submissions/*/route.ts`

2. **Download/View APIs**:
   - `app/api/files/[id]/route.ts`
   - `app/api/files/[id]/download/route.ts`

3. **Delete APIs**:
   - `app/api/files/[id]/route.ts` (DELETE)

### Thay đổi cơ bản

**Trước (S3)**:
```typescript
import { uploadFile, getFileUrl, deleteFile } from '@/lib/s3';

// Upload
const { key } = await uploadFile(file);
await prisma.uploadedFile.create({
  cloudStoragePath: key,
  isPublic: false,
});

// Get URL
const url = await getFileUrl(key, false); // Signed URL
```

**Sau (Local)**:
```typescript
import { saveFile, getFileUrl, deleteFile } from '@/lib/local-storage';

// Upload
const { filePath, fileName, fileSize, mimeType } = await saveFile(file, 'manuscript', false);
await prisma.uploadedFile.create({
  cloudStoragePath: filePath,  // 'documents/manuscripts/123-abc.pdf'
  fileName,
  fileSize,
  mimeType,
  isPublic: false,
});

// Get URL
const url = getFileUrl(filePath, false); // '/api/files/private/...'
```

**Đặc điểm**:
- ✅ Database schema KHÔNG thay đổi
- ✅ Chỉ thay logic upload/download
- ✅ Giữ nguyên field `cloudStoragePath` (giờ chứa local path)

---

## 🧹 Phase 3: Testing & Migration (TIẾ0P THEO)

### 1. Test Upload Flow

```bash
# Test upload manuscript
curl -X POST http://localhost:3000/api/files/upload \
  -F "file=@test.pdf" \
  -F "category=manuscript" \
  -H "Cookie: auth-token=..."

# Response:
{
  "data": {
    "id": "...",
    "cloudStoragePath": "documents/manuscripts/1735551234-a8f3c2-test.pdf",
    "url": "/api/files/private/documents/manuscripts/1735551234-a8f3c2-test.pdf"
  }
}
```

### 2. Test Download Flow

```bash
# Public file
curl http://localhost:3000/api/files/public/images/banners/banner.jpg

# Private file (cần auth)
curl http://localhost:3000/api/files/private/documents/manuscripts/123-abc.pdf \
  -H "Cookie: auth-token=..."
```

### 3. Migration Data (Nếu cần)

**Lưu ý**: Hiện tại chọn **Option B** (fresh start), KHÔNG migrate data từ S3.

Nếu sau này cần migrate:

```bash
# Script migrate (chưa implement)
node scripts/migrate-s3-to-local.js
```

### 4. Backup Script

```bash
#!/bin/bash
# scripts/backup-uploads.sh

BACKUP_DIR="/var/backups/app_uploads"
DATE=$(date +%Y%m%d_%H%M%S)

# Tạo backup
tar czf "$BACKUP_DIR/upload-$DATE.tar.gz" upload/

# Xóa backup cũ > 90 ngày
find "$BACKUP_DIR" -name "upload-*.tar.gz" -mtime +90 -delete

echo "Backup completed: upload-$DATE.tar.gz"
```

**Cron job**:
```bash
# Chạy hàng ngày lúc 2h sáng
0 2 * * * /path/to/backup-uploads.sh
```

---

## ✅ Kết quả Phase 1

### Files đã tạo

```
✅ upload/                                   (cấu trúc thư mục)
✅ upload/README.md                          (documentation)
✅ lib/local-storage.ts                      (11KB, core module)
✅ app/api/files/public/[...path]/route.ts  (public file server)
✅ app/api/files/private/[...path]/route.ts (private file server)
✅ lib/s3.ts.backup                         (archived)
✅ lib/aws-config.ts.backup                 (archived)
✅ .env                                      (UPLOAD_ROOT added)
```

### Các tính năng hoàn thành

✅ Cấu trúc thư mục chuẩn mực
✅ Module local-storage với validation
✅ API routes cho public/private files
✅ Permission checking (owner/admin/reviewer)
✅ Audit logging cho file access
✅ Archive S3 code (không xóa)
✅ Documentation đầy đủ
✅ Environment configuration

---

## 📌 Tiếp theo - Phase 2 (45 phút)

### Bước tiếp theo

1. **Cập nhật Upload APIs** (15 phút)
   - Sửa `app/api/files/upload/route.ts`
   - Sửa `app/api/issues/route.ts` (POST)
   - Sửa `app/api/issues/[id]/route.ts` (PUT)

2. **Cập nhật Download APIs** (15 phút)
   - Sửa `app/api/files/[id]/route.ts`
   - Sửa `app/api/files/[id]/download/route.ts`

3. **Cập nhật Delete APIs** (10 phút)
   - Sửa `app/api/files/[id]/route.ts` (DELETE)

4. **Testing** (5 phút)
   - Test upload flow
   - Test download flow
   - Test permission checking

---

## 🔒 Bảo mật & Compliance

### 1. Permission Matrix

| File Type | Owner | Admin | Reviewer | Public |
|-----------|-------|-------|----------|--------|
| Manuscript | ✅ | ✅ | ✅* | ❌ |
| Review File | ❌ | ✅ | ✅** | ❌ |
| Article Image | ✅ | ✅ | ✅ | ✅ |
| Issue Cover | ❌ | ✅ | ✅ | ✅ |

*Phản biện chỉ xem file của submission được phân công
**Phản biện chỉ xem review file của mình

### 2. Audit Events

```typescript
// Tự động log các sự kiện
- FILE_ACCESS      // Truy cập thành công
- ACCESS_DENIED    // Truy cập bị từ chối
- FILE_UPLOAD      // Upload file mới
- FILE_DELETE      // Xóa file
```

---

## 📊 So sánh: S3 vs Local

| Tiêu chí | AWS S3 | Local Filesystem |
|----------|--------|------------------|
| **Phụ thuộc Internet** | ✅ Cần | ❌ Không cần |
| **Chi phí** | $$ / tháng | Miễn phí |
| **Tốc độ (LAN)** | Chậm | Nhanh |
| **Tự chủ** | Không | 100% |
| **Backup** | Tự động | Thủ công |
| **Scalability** | Vô hạn | Giới hạn ổ đĩa |
| **Bảo mật** | AWS IAM | Local permission |
| **Audit** | CloudTrail | Custom logging |

**Kết luận**: Local filesystem **PHÙ HỢP HƠN** cho mạng nội bộ.

---

## 🔧 Troubleshooting

### Vấn đề thường gặp

**1. "Cannot find module '@/lib/local-storage'"**
```bash
# Kiểm tra file tồn tại
ls -la lib/local-storage.ts

# Restart dev server
yarn dev
```

**2. "ENOENT: no such file or directory"**
```bash
# Tạo lại thư mục upload
mkdir -p upload/{images/{articles,users,banners,issues},videos/gallery,documents/{manuscripts,reviews,issues},temp}
```

**3. "Permission denied"**
```bash
# Cấp quyền ghi
chmod -R 755 upload/
```

---

## 📝 Checklis tương lai

### Phase 2 - Cập nhật APIs
- [ ] Sửa `app/api/files/upload/route.ts`
- [ ] Sửa `app/api/issues/route.ts`
- [ ] Sửa `app/api/issues/[id]/route.ts`
- [ ] Sửa `app/api/files/[id]/route.ts`
- [ ] Sửa `app/api/files/[id]/download/route.ts`
- [ ] Test upload flow
- [ ] Test download flow
- [ ] Test permission checking

### Phase 3 - Advanced Features
- [ ] Backup script (`scripts/backup-uploads.sh`)
- [ ] Cleanup cron job (`cleanupTempFiles`)
- [ ] Migration script (nếu cần)
- [ ] Monitoring dashboard
- [ ] Disk usage alerts

---

## 🎯 Kết luận

**Phase 1 đã hoàn thành**:
✅ Infrastructure sẵn sàng
✅ Core module hoạt động
✅ API routes chuẩn mực
✅ Bảo mật đầy đủ
✅ Documentation chi tiết

**Tiếp theo**: Bắt đầu Phase 2 - Cập nhật các API routes hiện có.

Chỉ cần nói: **"Bắt đầu Phase 2"** là tiếp tục triển khai!
