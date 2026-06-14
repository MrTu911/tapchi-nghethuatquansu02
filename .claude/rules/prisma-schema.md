---
paths:
  - "prisma/schema.prisma"
---

# Prisma Schema Rules — Tạp chí NTQS

## Nguyên tắc chung
- Schema này kế thừa từ tapchi-hcqs — **không tạo lại từ đầu**
- Trước khi thêm model mới, kiểm tra model hiện có đã đủ bản chất nghiệp vụ chưa
- Không thêm field nếu chưa có lý do nghiệp vụ rõ ràng
- Relation phải đặt tên rõ nghĩa, tránh mơ hồ

## Khi thêm model hoặc field
Phải cân nhắc đầy đủ:
- `@id`, `@default`, `@updatedAt`, `@unique`
- `@@index` cho foreign key lớn và trường filter/search phổ biến
- `@@unique` cho composite unique key nghiệp vụ

## Khi relation đến model hiện có
Nếu relation đến `User`, `Submission`, `Issue`, `Category`... mà chưa chắc tên model/field:
1. Đọc schema hiện có trước
2. Mapping đúng model đang tồn tại
3. Nếu vẫn chưa chắc, báo rõ giả định thay vì tự đặt bừa

## Enum
- Ưu tiên định nghĩa enum rõ ràng trong Prisma
- Không hardcode string thay thế enum nếu giá trị có ý nghĩa nghiệp vụ

## Migration an toàn
- Không drop field/model cũ ngay nếu chưa có kế hoạch migrate
- Migration phải có rollback thinking
- Không làm migration phá dữ liệu khi chưa có yêu cầu rõ ràng

## Với bảng workflow tạp chí
Với `Submission`, `Review`, `EditorDecision`, `Production`, `Issue`:
- Ưu tiên `createdAt`, `updatedAt`
- Index ở `submissionId`, `userId`, `status` vì là trường filter chính
- Audit-sensitive: không xóa lịch sử phê duyệt / quyết định biên tập
