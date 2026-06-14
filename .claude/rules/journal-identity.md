---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
---

# Journal Identity Rules — Tạp chí NTQS

## Mục tiêu
Đảm bảo mọi file trong repo sử dụng đúng identity của Tạp chí Nghệ thuật Quân sự Việt Nam,
không lẫn lộn với codebase nguồn tapchi-hcqs (Học viện Hậu cần).

---

## Thông tin bắt buộc dùng

| Thuộc tính | Giá trị |
|---|---|
| Tên VI | Tạp chí Nghệ thuật Quân sự Việt Nam |
| Tên EN | Journal of Vietnamese Military Art |
| Đơn vị | Học viện Quốc phòng (HVQPh) |
| ISSN | 1859-0454 |
| Email | tapchintqsvn@gmail.com |
| SĐT | (069) 556 635 |
| Địa chỉ | 93 Hoàng Quốc Việt, Nghĩa Đô, Hà Nội |
| Hòm thư | 2EA6 |

---

## Cấm tuyệt đối

Không được xuất hiện trong bất kỳ file nào:
- "Hậu cần Quân sự" / "hậu cần quân sự"
- "Học viện Hậu cần" / "HVHC"
- ISSN không phải 1859-0454
- Địa chỉ / SĐT / email của Học viện Hậu cần

---

## Khi phát hiện branding cũ

1. Grep tìm toàn bộ file bị ảnh hưởng
2. Thay thế đồng bộ theo bảng bên dưới
3. Grep kiểm tra lại sau khi thay
4. Báo cáo danh sách file đã sửa

### Bảng thay thế chuẩn

| Cũ | Mới |
|---|---|
| Tạp chí Nghiên cứu Khoa học Hậu cần Quân sự | Tạp chí Nghệ thuật Quân sự Việt Nam |
| Journal of Military Logistics Science | Journal of Vietnamese Military Art |
| Học viện Hậu cần | Học viện Quốc phòng |
| HVHC | HVQPh |
| hậu cần quân sự | nghệ thuật quân sự |

---

## File ưu tiên kiểm tra branding

- nextjs_space/app/layout.tsx — metadata title/description
- nextjs_space/components/header.tsx — tên tạp chí hiển thị
- nextjs_space/components/footer.tsx — địa chỉ, ISSN, SĐT, email
- nextjs_space/components/modern-footer.tsx
- nextjs_space/lib/site-settings.ts — fallback defaults
- nextjs_space/lib/email.ts — sender name trong email
- nextjs_space/seed_site_settings.ts — seed data
- nextjs_space/seed_public_pages.ts — nội dung trang tĩnh
- nextjs_space/app/auth/login/page.tsx — tên đơn vị trên trang login
- nextjs_space/components/dashboard/header.tsx — tên hệ thống trong dashboard

---

## Database và môi trường

- DATABASE_URL phải trỏ đến database riêng (gợi ý: tapchi_ntqs)
- Không share database với tapchi-hcqs
- Redis key prefix nên có namespace riêng (ntqs:*)
- NEXTAUTH_URL phải trỏ đúng domain của NTQS

---

## Không được làm

- Không copy-paste file từ tapchi-hcqs mà không kiểm tra branding
- Không để alt text ảnh dùng tên cũ
- Không seed dữ liệu với tên tạp chí sai
- Không gửi email thông báo với sender name sai
