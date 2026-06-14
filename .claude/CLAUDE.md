# CLAUDE SYSTEM GUIDE
# TẠP CHÍ NGHỆ THUẬT QUÂN SỰ VIỆT NAM — SOFTWARE ENGINEERING OPERATING MANUAL

Tài liệu này là hướng dẫn vận hành bắt buộc cho Claude khi làm việc trong repo này.

Mục tiêu:
- giúp Claude hành xử như một chuyên gia phát triển phần mềm,
- bám đúng kiến trúc hệ thống tạp chí điện tử,
- tôn trọng identity và nghiệp vụ của Tạp chí Nghệ thuật Quân sự Việt Nam,
- triển khai code theo phase rõ ràng,
- giảm tối đa lỗi lệch branding, lệch nghiệp vụ, lệch data model.

Claude phải coi tài liệu này là luật vận hành trung tâm của repo.

---

# 0. THÔNG TIN TẠP CHÍ — NGUỒN SỰ THẬT

## 0.1. Thông tin nhận dạng bắt buộc

| Thuộc tính | Giá trị |
|---|---|
| Tên tiếng Việt | Tạp chí Nghệ thuật Quân sự Việt Nam |
| Tên tiếng Anh | Journal of Vietnamese Military Art |
| Tên viết tắt | NTQS / JVMA |
| Đơn vị chủ quản | Học viện Quốc phòng (HVQPh) |
| ISSN (in) | 1859-0454 |
| Chu kỳ xuất bản | 1 kỳ/tháng |
| Năm hoạt động | Năm thứ 39 (từ năm 1987) |
| Địa chỉ | 93 Hoàng Quốc Việt, Nghĩa Đô, Hà Nội |
| Hòm thư | 2EA6 |
| Điện thoại | (069) 556 635 |
| Email tòa soạn | tapchintqsvn@gmail.com |
| Website liên quan | nda.edu.vn |
| Giấy phép hoạt động | 619/GP-BTTTT — 23-12-2020 |
| In tại | Xưởng in Học viện Quốc phòng |

## 0.2. Ban biên tập (tính đến số 4-2026)

| Chức danh | Họ tên |
|---|---|
| Tổng biên tập | Đại tá, TS Lê Ngọc Bảo |
| Thư ký tòa soạn | PGS, TS Trần Việt Khoa; Đại tá TS Phan Minh Đức |
| Phó Thư ký tòa soạn | Trung tá QNCN Nguyễn Thảo Lan Oanh |
| Biên tập viên | Thượng tá QNCN Phạm Thị Thanh Thủy |
| Biên tập viên | Trung tá QNCN Nguyễn Thị Khánh |
| Biên tập viên | Trường Giang |
| Biên tập viên | Thượng ủy QNCN Nguyễn Thu Trang |

## 0.3. Màu sắc và identity thương hiệu

- Màu nền chủ đạo: **#1E3924** (xanh quân sự đậm)
- Màu điểm nhấn: **#E5C86E** (vàng đồng)
- Màu text phụ: **#F9F9F9** (trắng nhẹ)
- Logo: huy hiệu Học viện Quốc phòng (HVQP — ngôi sao, quyển sách, bút lông)
- Không dùng màu palette hoặc logo của Học viện Hậu cần

## 0.4. Quy tắc TUYỆT ĐỐI về branding

Claude **không được** sử dụng trong bất kỳ file nào của repo này:
- "Hậu cần Quân sự" hoặc "hậu cần quân sự"
- "Học viện Hậu cần" hoặc "HVHC"
- ISSN cũ thuộc tapchi-hcqs
- Địa chỉ, SĐT, email của Học viện Hậu cần

Luôn thay bằng thông tin ở mục 0.1 và 0.2.

---

# 1. BỐI CẢNH KỸ THUẬT

## 1.1. Nguồn gốc codebase

Repo này được fork từ **tapchi-hcqs** (Tạp chí Nghiên cứu Khoa học Hậu cần Quân sự).

- Schema Prisma: giống hệt tapchi-hcqs — **không cần tạo lại từ đầu**
- Kiến trúc Next.js 14: đầy đủ — **reuse toàn bộ**
- Database: **tách biệt hoàn toàn** — DATABASE_URL khác, không share với tapchi-hcqs

## 1.2. Nguyên tắc kế thừa

- **Reuse 100%** kiến trúc: API layer, service, repository, auth, RBAC, CMS, workflow
- **Thay đổi** identity: branding, metadata, site-settings, seed data, public images
- **Mở rộng** nếu cần: chuyên mục đặc thù NTQS, cấu hình riêng Học viện Quốc phòng
- **Không tạo** model mới khi model cũ đã đủ bản chất nghiệp vụ

## 1.3. Stack kỹ thuật

- Next.js 14, TypeScript, Prisma, PostgreSQL
- Tailwind CSS, Radix UI, shadcn/ui
- TanStack Query v5, React Hook Form, Zod
- NextAuth.js 4 (ORCID integration)
- MinIO / AWS S3 cho file upload
- Nodemailer cho email notification
- Redis (Upstash) cho cache và rate limiting

---

# 2. TRIẾT LÝ LÀM VIỆC

Claude trong repo này phải làm việc như:
- software architect khi phân tích hệ thống,
- technical lead khi chia phase triển khai,
- senior engineer khi code,
- reviewer khi kiểm tra lệch kiến trúc,
- migration engineer khi rebrand / refactor.

Claude phải ưu tiên:
1. đúng kiến trúc
2. đúng nghiệp vụ tạp chí điện tử
3. đúng branding (identity NTQS — Học viện Quốc phòng)
4. đúng dữ liệu
5. đúng bảo mật
6. rollout an toàn

Không ưu tiên "code nhanh" hơn "code đúng".

---

# 3. CẤU TRÚC REPO

```
nextjs_space/
├── app/
│   ├── api/               # API routes (auth, articles, issues, submissions...)
│   ├── (auth)/            # Auth pages (2FA)
│   ├── auth/              # Login, register, forgot-password, verify-email
│   ├── dashboard/         # Dashboard theo role (admin, editor, reviewer, author...)
│   └── (public)/          # Public pages (trang chủ, bài viết, số mới, lưu trữ...)
├── components/
│   ├── dashboard/         # Dashboard-specific components
│   └── ui/                # shadcn/ui primitives
├── hooks/                  # Custom React hooks
├── lib/
│   ├── services/          # Business logic layer
│   ├── integrations/      # ORCID, Crossref, email
│   ├── auth/              # Auth helpers
│   └── security/          # Security utilities
├── prisma/                 # Schema + migrations + seed
├── public/                 # Static assets
│   └── images/            # Banner, footer, cover, favicon
├── types/                  # TypeScript types
└── .claude/               # Claude config (rules, skills)
```

Project **không dùng `src/`**.

---

# 4. TRÁCH NHIỆM TỪNG LỚP

## 4.1. Route/API layer
Chỉ được:
- parse request, validate input, gọi service, trả response chuẩn

Không được:
- chứa business logic nặng
- truy cập DB trực tiếp nếu đã có service/repository

## 4.2. Service layer
Chứa:
- business rules, workflow/lifecycle logic, orchestration, permission-aware checks

## 4.3. Repository layer
Chỉ làm:
- truy vấn DB, mapping dữ liệu, transaction support khi cần

## 4.4. UI layer
Chỉ nên:
- hiển thị, thu input, gọi API/hook, quản lý UI state

Không được:
- nhét business logic phức tạp
- duplicate validation/rule từ backend

---

# 5. ROLES VÀ RBAC

Hệ thống kế thừa 10 roles — phù hợp nghiệp vụ NTQS:

| Role | Ánh xạ nghiệp vụ NTQS |
|---|---|
| READER | Độc giả công khai |
| AUTHOR | Tác giả gửi bài nghiên cứu |
| REVIEWER | Phản biện khoa học độc lập |
| SECTION_EDITOR | Biên tập viên chuyên mục |
| MANAGING_EDITOR | Thư ký tòa soạn |
| EIC | Tổng biên tập |
| LAYOUT_EDITOR | Biên tập dàn trang / layout |
| SYSADMIN | Quản trị hệ thống |
| SECURITY_AUDITOR | Kiểm soát bảo mật |
| COMMANDER | Lãnh đạo Học viện xem báo cáo tổng hợp |

Với đặc thù NTQS:
- EIC → Tổng biên tập: Đại tá TS Lê Ngọc Bảo
- MANAGING_EDITOR → Thư ký tòa soạn: PGS TS Trần Việt Khoa
- SECTION_EDITOR → các Biên tập viên chuyên mục

---

# 6. CHUYÊN MỤC ĐẶC THÙ NTQS

Seed categories đúng lĩnh vực của tạp chí:

1. **Chiến lược quân sự** — Nghiên cứu tầm chiến lược, quốc phòng quốc gia
2. **Nghệ thuật tác chiến** — Lý luận và thực tiễn tác chiến
3. **Chiến dịch học** — Nghiên cứu lý luận và thực tiễn chiến dịch
4. **Chiến thuật học** — Chiến thuật cấp chiến đấu
5. **Lịch sử quân sự** — Lịch sử chiến tranh, truyền thống quân sự
6. **Khoa học quân sự** — Nghiên cứu lý luận quân sự tổng hợp
7. **Giáo dục quân sự** — Đào tạo cán bộ, học thuật quốc phòng
8. **Hợp tác quốc phòng** — Quan hệ quốc tế, an ninh khu vực
9. **Tin tức Học viện** — Hoạt động của Học viện Quốc phòng

---

# 7. QUY TRÌNH REBRAND BẮT BUỘC

Khi chỉnh sửa file liên quan đến identity tạp chí:

1. **Grep tìm** tất cả cụm từ cũ trước khi sửa
2. **Thay thế đồng bộ**, không bỏ sót
3. **Grep kiểm tra** sau khi thay
4. **Báo cáo** file đã sửa

Bảng thay thế chuẩn:

| Cũ (tapchi-hcqs) | Mới (NTQS) |
|---|---|
| Tạp chí Nghiên cứu Khoa học Hậu cần Quân sự | Tạp chí Nghệ thuật Quân sự Việt Nam |
| Journal of Military Logistics Science | Journal of Vietnamese Military Art |
| Học viện Hậu cần | Học viện Quốc phòng |
| HVHC | HVQPh |
| hậu cần quân sự | nghệ thuật quân sự |
| ISSN placeholder cũ | 1859-0454 |
| Email cũ | tapchintqsvn@gmail.com |
| SĐT cũ | (069) 556 635 |
| Địa chỉ cũ | 93 Hoàng Quốc Việt, Nghĩa Đô, Hà Nội |

---

# 8. QUY TẮC DATABASE

## 8.1. Database tách biệt hoàn toàn
- DATABASE_URL của repo này **phải** khác DATABASE_URL của tapchi-hcqs
- Không share database, không share Redis namespace
- Database name gợi ý: `tapchi_ntqs`

## 8.2. Schema không cần thay đổi lõi
- Không tạo model mới khi model hiện có đủ bản chất nghiệp vụ
- Nếu cần mở rộng, ưu tiên thêm field vào model cũ
- Chỉ tạo model mới khi bản chất nghiệp vụ thật sự khác

## 8.3. Seed data phải đúng identity NTQS
- `seed_site_settings.ts` → tên tạp chí, ISSN, địa chỉ, email, SĐT của NTQS
- `seed_public_pages.ts` → nội dung phù hợp Học viện Quốc phòng
- Categories → theo mục 6 (chuyên mục NTQS)
- Navigation → menu phù hợp tạp chí quân sự học thuật

---

# 9. QUY TẮC IMAGE VÀ ASSETS

## 9.1. Vị trí assets chuẩn
- Banner header: `public/images/banner-desktop.png`, `banner-tablet.png`, `banner-mobile.png`
- Footer: `public/images/footer-desktop.png`, `footer-tablet.png`, `footer-mobile.png`
- Favicon: `public/favicon.svg` — logo HVQP
- Cover mặc định: `public/default-cover.jpg`

## 9.2. Quy tắc khi làm việc với images
- Không reference ảnh từ tapchi-hcqs
- Alt text của ảnh phải dùng tên NTQS, không dùng tên cũ
- Khi user cung cấp ảnh mới, lưu đúng vào `public/images/`

---

# 10. QUY TRÌNH LÀM VIỆC CHUẨN

## 10.1. Khi nhận task mới
Phải xác định:
1. Task thuộc loại: rebrand / thêm tính năng / fix bug / seed data / UI / bảo mật
2. File nào bị ảnh hưởng
3. Có nguy cơ sót branding cũ không
4. Phase triển khai nào

## 10.2. Trước khi code
Phải trả lời được:
1. Mục tiêu task là gì
2. File sẽ tạo mới / sửa
3. Giả định kỹ thuật nếu có
4. Rủi ro branding hoặc dữ liệu

## 10.3. Sau khi code
Phải báo rõ:
1. File tạo mới
2. File sửa
3. Nội dung chính đã làm
4. Phần còn thiếu
5. Bước tiếp theo

---

# 11. QUY TẮC BẢO MẬT

- Không hard-code credentials hay secrets
- Không commit `.env` vào git
- Secrets phải đi qua biến môi trường
- Auth routes phải có rate limiting
- Upload file: validate type và size, không tin tên file từ client
- Audit log bắt buộc với: login, submit bài, quyết định biên tập, publish số tạp chí
- Không dựa vào frontend để bảo vệ dữ liệu — backend phải check đủ

---

# 12. KHI NÀO DÙNG SKILL NÀO

| Task | Skill cần dùng |
|---|---|
| Phân tích module / tính năng mới | `analyze-module` |
| Code theo thiết kế đã có | `implement-from-design` |
| Thiết kế API | `design-api` |
| Thêm / sửa schema | `design-database` |
| Build UI page / component | `build-ui-module` |
| Review code | `review-code` |
| Debug lỗi thực tế | `debug-production-issue` |
| Refactor an toàn | `refactor-safely` |
| Viết test | `write-tests` |
| Tích hợp module | `integrate-module` |
| Di chuyển / migrate code cũ | `migrate-legacy-code` |
| Hardening bảo mật | `security-hardening` |

---

# 13. KHÔNG ĐƯỢC LÀM

- Không dùng bất kỳ identity nào của tapchi-hcqs trong code mới
- Không share database hoặc Redis với tapchi-hcqs
- Không tạo model mới khi model cũ đủ dùng
- Không hard-code secrets
- Không bỏ qua validation input
- Không đặt business logic nặng trong route hoặc UI layer
- Không drop field / model cũ ngay khi chưa có kế hoạch migrate
- Không trả lời mơ hồ "đã sửa xong" mà không liệt kê file affected

---

# 14. MỤC TIÊU CUỐI CÙNG

Claude phải giúp repo này đạt được:
- Identity đúng và nhất quán của Tạp chí Nghệ thuật Quân sự Việt Nam — Học viện Quốc phòng
- Kiến trúc sạch, kế thừa tốt từ nền tapchi-hcqs
- Workflow phản biện phù hợp đặc thù tạp chí quân sự học thuật
- Database tách biệt, không trùng lẫn với tapchi-hcqs
- Sẵn sàng production với thông tin tòa soạn chính xác
- Dễ mở rộng thêm tính năng đặc thù trong tương lai
