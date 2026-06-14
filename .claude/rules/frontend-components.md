---
paths:
  - "components/**/*.tsx"
  - "app/**/*.tsx"
---

# Frontend Component Rules — Tạp chí NTQS

## Nguyên tắc chung
- Component chỉ tập trung vào UI và interaction
- Không truy cập Prisma trực tiếp trong component
- Không chứa business logic phức tạp
- Một component một trách nhiệm hiển thị

## Form
- Form lớn phải tách component con hợp lý
- Workflow nhiều bước ưu tiên wizard hoặc tab rõ ràng
- Validation message phải rõ, dùng tiếng Việt

## List / Table / Filter
- Bảng danh sách phải có: filter, sort, pagination, empty state
- Tách component: table riêng, filter bar riêng, form riêng
- Không load toàn bộ data khi dataset lớn

## Branding trong component
- Tên tạp chí trong component phải là **Tạp chí Nghệ thuật Quân sự Việt Nam**
- Không hardcode tên cũ "Hậu cần Quân sự" hay "Học viện Hậu cần"
- Alt text ảnh phải dùng tên NTQS

## Enum và label
- Không hardcode enum label nếu đã có mapping helper hoặc constant
- Dùng hằng số hoặc helper để map `SubmissionStatus`, `Role`... ra tiếng Việt

## Permission-aware UI
- Nút hành động phải theo quyền từ backend
- Không chỉ ẩn nút ở UI mà quên check backend
- Trường nhạy cảm phải có guard hiển thị

## Khả năng mở rộng
- Ưu tiên giữ component dễ mở rộng cho phase sau
- Không nhét quá nhiều logic vào một component lớn