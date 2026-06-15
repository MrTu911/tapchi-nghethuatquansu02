# Checklist QA thủ công — Chức năng CMS

**Tạp chí Nghệ thuật Quân sự Việt Nam — Học viện Quốc phòng**

> Tài liệu nghiệm thu thủ công cho lớp quản trị nội dung công khai (CMS). Dùng kèm
> bộ test tự động trong `tests/unit/cms-*.test.ts`, `public-visibility.test.ts`,
> `media-upload-security.test.ts`, `branding-guard.test.ts` (chạy `npm test`).
>
> Phạm vi: module CMS theo ưu tiên P0/P1/P2. Năm khía cạnh: **CRUD**, **RBAC**,
> **Branding NTQS**, **Upload/Input**, **Public**.
>
> Cập nhật lần cuối: 2026-06-15.

---

## Phần 0 — Chuẩn bị môi trường

### 0.1. Chạy app + seed dữ liệu
- App production chạy qua pm2 (`tapchi-ntqs`, cổng **3001**). Muốn test thay đổi mới:
  `pm2 stop tapchi-ntqs` → `npm run dev` (3001) → test → khôi phục `pm2 start tapchi-ntqs && pm2 save`.
- Seed dữ liệu (idempotent — upsert/skip nếu đã có):
  ```bash
  npx prisma db seed                                              # seed tổng (scripts/seed.ts)
  npx tsx --require dotenv/config scripts/seed-cms-data.ts        # banner/menu/page CMS
  npx tsx --require dotenv/config prisma/seed-site-settings.ts    # site-settings identity NTQS
  ```
- DB dùng **db-push** (không migrate). Đổi schema phải dùng `prisma db execute` với SQL idempotent.
- URL công khai: `http://localhost:3001` — Dashboard: `http://localhost:3001/dashboard`.

### 0.2. Tài khoản demo theo vai trò
| Vai trò | Email | Mật khẩu | Quyền CMS |
|---|---|---|---|
| EIC (Tổng biên tập) | `eic@tapchintqsvn.edu.vn` | `EIC@2025` | Toàn quyền CMS + **xuất bản** |
| MANAGING_EDITOR (Thư ký tòa soạn) | `managing@tapchintqsvn.edu.vn` | `Managing@2025` | Quản trị CMS, **không** xuất bản |
| DEPUTY_EIC (Phó TBT) | `photongbientap@tapchintqsvn.edu.vn` | *(theo seed)* | Quản trị CMS + duyệt bài, **không** xuất bản |
| SECTION_EDITOR (BTV chuyên mục) | `bientap@tapchintqsvn.edu.vn` | *(theo seed)* | **Không** quản trị CMS |
| AUTHOR (Tác giả) | `tacgia@tapchintqsvn.edu.vn` | `Author@2025` | Không (chỉ upload media đính kèm bài) |
| READER (Độc giả) | `docgia@tapchintqsvn.edu.vn` | *(theo seed)* | Không |

> Mật khẩu lấy từ các script `scripts/seed-*.ts` / `prisma/seed-*.ts`; xác nhận lại trước khi test.

### 0.3. Cách đọc bảng test case
Cột `Khía cạnh`: **CRUD** (chức năng) · **RBAC** (phân quyền) · **Brand** (branding) ·
**Upload** (bảo mật file/input) · **Public** (hiển thị công khai).
Ghi `Pass`/`Fail` + ghi chú; mọi `Fail` chuyển xuống **§5 Phát hiện**.

---

## Phần 1 — Test case theo module

### 1.1. Số tạp chí & Bài viết — Publish pipeline *(P0)*
UI: `/dashboard/admin/issues`, `/dashboard/admin/articles` · API: `/api/issues`, `/api/issues/publish`, `/api/articles/[id]/approve`, `/api/articles/[id]/assign-issue`

| ID | Tiền điều kiện | Thao tác | Kết quả mong đợi | Khía cạnh | P/F | Ghi chú |
|---|---|---|---|---|---|---|
| ISS-01 | EIC | Tạo số mới (volume/number/title) | Tạo thành công, trạng thái DRAFT | CRUD | | |
| ISS-02 | EIC | Gán bài đã duyệt vào số → bấm **Xuất bản** | Số chuyển PUBLISHED; bài + submission chuyển PUBLISHED | CRUD/Public | | |
| ISS-03 | EIC | Xuất bản số **chưa có bài** | Bị chặn (báo "chưa có bài báo") | CRUD | | |
| ISS-04 | EIC | Xuất bản lại số **đã PUBLISHED** | Bị chặn (đã xuất bản rồi) | CRUD | | |
| ISS-05 | **DEPUTY_EIC** | Mở số DRAFT → thử **Xuất bản** | **Bị chặn (403)** — chỉ EIC ký cuối | RBAC | | regression leadership |
| ISS-06 | MANAGING_EDITOR | Thử **Xuất bản** | Bị chặn (403) | RBAC | | |
| ISS-07 | DEPUTY_EIC | **Duyệt bài** (approve APPROVED) | Được phép (200) — duyệt khác xuất bản | RBAC | | |
| ISS-08 | AUTHOR | Gọi `/api/issues/publish` (DevTools/curl) | 401/403, không đổi trạng thái | RBAC | | backend, không chỉ ẩn nút |
| ISS-09 | READER | Mở `/issues` | Chỉ thấy số PUBLISHED; KHÔNG thấy DRAFT | Public | | |
| ISS-10 | READER | Mở chi tiết số `/issues/[id]` + viewer | TOC + bài hiển thị; PDF/viewer mở được | Public | | |
| ISS-11 | — | Kiểm tra trang chủ `/` sau publish | Bài/số mới xuất hiện (revalidate cache) | Public | | |

### 1.2. Site Settings — Branding/Identity *(P0)*
UI: `/dashboard/admin/cms/settings` · API: `/api/site-settings`, `/api/site-settings/[key]`

| ID | Tiền điều kiện | Thao tác | Kết quả mong đợi | Khía cạnh | P/F | Ghi chú |
|---|---|---|---|---|---|---|
| SET-01 | EIC | Sửa `site_name`, `contact_email`, footer | Lưu thành công + ghi audit (SETTINGS_CHANGED) | CRUD | | |
| SET-02 | — | Mở footer/`/contact` công khai | ISSN **1859-0454**, email `tapchintqsvn@gmail.com`, SĐT `(069) 556 635`, địa chỉ `93 Hoàng Quốc Việt` | Brand | | |
| SET-03 | — | Soát toàn bộ settings | KHÔNG còn HVHC / "Học viện Hậu cần" / ISSN cũ | Brand | | |
| SET-04 | AUTHOR | PATCH `/api/site-settings/[key]` (curl) | Bị chặn (403), không đổi giá trị | RBAC | | |
| SET-05 | MANAGING_EDITOR | Xóa 1 setting (DELETE) | **Bị chặn** — DELETE chỉ SYSADMIN | RBAC | | |
| SET-06 | EIC | Đổi `appearance_primary_color` → reload public | Màu chủ đạo `#1E3924` áp đúng (sau cache ~5') | Public | | |

### 1.3. Public Pages — Trang tĩnh *(P0)*
UI: `/dashboard/admin/cms/pages` · API: `/api/public-pages`, `/api/public-pages/[id]`

| ID | Tiền điều kiện | Thao tác | Kết quả mong đợi | Khía cạnh | P/F | Ghi chú |
|---|---|---|---|---|---|---|
| PG-01 | EIC | Tạo trang (slug, title, content) | Tạo thành công; content được sanitize HTML | CRUD/Upload | | |
| PG-02 | EIC | Tạo trang trùng slug | Bị chặn 409 (slug đã tồn tại) | CRUD | | |
| PG-03 | EIC | Nhúng `<script>` vào content → lưu | Thẻ script bị loại bỏ (sanitize-html) | Upload | | |
| PG-04 | READER | POST `/api/public-pages` (curl) | Bị chặn (403) | RBAC | | |
| PG-05 | — | Mở `/pages/[slug]` đã publish | Hiển thị đúng; bản nháp (isPublished=false) không lộ | Public | | |
| PG-06 | EIC | Điền nội dung song ngữ (VI + EN) | Cả 2 ngôn ngữ lưu/hiển thị đúng | CRUD/Public | | |

### 1.4. Navigation — Menu điều hướng *(P0)*
UI: `/dashboard/admin/cms/navigation` · API: `/api/navigation`, `/api/navigation/bulk-update`

| ID | Tiền điều kiện | Thao tác | Kết quả mong đợi | Khía cạnh | P/F | Ghi chú |
|---|---|---|---|---|---|---|
| NAV-01 | EIC | Tạo menu item (label, url) | Tạo thành công | CRUD | | |
| NAV-02 | EIC | Kéo-thả sắp xếp lại (bulk-update) | Thứ tự `position` cập nhật đúng | CRUD | | |
| NAV-03 | EIC | Tạo menu con (parentId) | Phân cấp hiển thị đúng trên header | CRUD/Public | | |
| NAV-04 | AUTHOR | POST `/api/navigation` (curl) | Bị chặn (403) | RBAC | | |
| NAV-05 | — | Mở trang công khai | Menu khớp cấu hình; item isActive=false bị ẩn | Public | | |

### 1.5. Media — Upload ảnh/PDF/video *(P0)*
UI: `/dashboard/admin/cms/media` · API: `/api/media`, `/api/media/[id]`

| ID | Tiền điều kiện | Thao tác | Kết quả mong đợi | Khía cạnh | P/F | Ghi chú |
|---|---|---|---|---|---|---|
| MED-01 | EIC | Upload ảnh JPG/PNG hợp lệ | Thành công; bản ghi Media + audit (MEDIA_UPLOADED) | CRUD/Upload | | |
| MED-02 | EIC | Upload file `.exe` đổi tên thành `.png` | Bị chặn ("nội dung không khớp định dạng") | Upload | | F2 đã sửa — magic-byte |
| MED-03 | EIC | Upload ảnh > 10MB / video > 100MB | Bị chặn (quá kích thước) | Upload | | |
| MED-04 | READER | POST `/api/media` (curl) | Bị chặn (403) | RBAC | | |
| MED-05 | EIC | Mở thư viện media | List + phân trang + filter type/category | CRUD | | |
| MED-06 | — | Ảnh public dùng signed URL | URL có hiệu lực; hết hạn sau TTL | Upload/Public | | |

### 1.6. Banners / Sliders *(P1)*
UI: `/dashboard/admin/banners`, `/dashboard/admin/cms/sliders` · API: `/api/banners`, `/api/banners/reorder`, `/api/cms/sliders`

| ID | Tiền điều kiện | Thao tác | Kết quả mong đợi | Khía cạnh | P/F | Ghi chú |
|---|---|---|---|---|---|---|
| BAN-01 | EIC | Tạo banner (ảnh + link + lịch hiện) | Tạo thành công + audit | CRUD | | |
| BAN-02 | EIC | Sắp xếp lại banner (reorder) | Thứ tự cập nhật đúng | CRUD | | |
| BAN-03 | EIC | Đặt startDate/endDate ngoài hôm nay | Banner không hiện trên public ngoài khoảng | CRUD/Public | | |
| BAN-04 | AUTHOR | POST `/api/banners` (curl) | Bị chặn (403) | RBAC | | |
| BAN-05 | READER | POST `/api/cms/sliders` (curl) | Bị chặn (**403** — F1 đã chuẩn hóa) | RBAC | | |
| BAN-06 | — | Trang chủ | Banner/slider hiển thị đúng thứ tự, alt text NTQS | Public/Brand | | |

### 1.7. Categories — Chuyên mục *(P1)*
UI: `/dashboard/admin/categories` · API: `/api/categories`, `/api/categories/[id]`, `/api/categories/alias`

| ID | Tiền điều kiện | Thao tác | Kết quả mong đợi | Khía cạnh | P/F | Ghi chú |
|---|---|---|---|---|---|---|
| CAT-01 | EIC | Tạo chuyên mục (code/name/slug) | Tạo thành công; cache invalidate | CRUD | | |
| CAT-02 | EIC | Tạo trùng code/slug | Bị chặn (đã tồn tại) | CRUD | | |
| CAT-03 | — | Kiểm tra 9 chuyên mục NTQS | Đúng danh mục NTQS (Chiến lược, Nghệ thuật tác chiến, …) | Brand | | CLAUDE.md §6 |
| CAT-04 | READER | POST `/api/categories` (curl) | Bị chặn (403) | RBAC | | |
| CAT-05 | — | `/categories/[slug]` | Liệt kê bài PUBLISHED đúng chuyên mục | Public | | |

### 1.8. News / Announcements *(P1)*
UI: `/dashboard/admin/cms/news` · API: `/api/news`, `/api/news/[id]`, `/api/news/upload-image`

| ID | Tiền điều kiện | Thao tác | Kết quả mong đợi | Khía cạnh | P/F | Ghi chú |
|---|---|---|---|---|---|---|
| NEWS-01 | EIC | Tạo tin (announcement/event/CFP) | Tạo thành công | CRUD | | |
| NEWS-02 | EIC | Upload ảnh thumbnail | Ảnh lưu đúng, validate type | CRUD/Upload | | |
| NEWS-03 | EIC | Bật/tắt isPublished | Tin chỉ hiện public khi isPublished=true | CRUD/Public | | |
| NEWS-04 | — | `/news` và `/news/[slug]` | Hiển thị đúng; tag/affiliation không lộ branding cũ | Public/Brand | | |

### 1.9. Featured Articles + Homepage Sections + Page Blocks *(P1)*
UI: `/dashboard/admin/featured-articles`, `/dashboard/admin/cms/homepage` · API: `/api/featured-articles`, `/api/homepage-sections`, `/api/page-blocks`

| ID | Tiền điều kiện | Thao tác | Kết quả mong đợi | Khía cạnh | P/F | Ghi chú |
|---|---|---|---|---|---|---|
| FEA-01 | EIC | Ghim bài nổi bật (position, reason) | Bài lên trang chủ; cờ isFeatured=true | CRUD/Public | | |
| FEA-02 | EIC | Ghim bài chưa publish | Cân nhắc chặn / không lộ public | CRUD | | |
| FEA-03 | AUTHOR | POST `/api/featured-articles` (curl) | Bị chặn (403) | RBAC | | |
| HOME-01 | EIC | Sửa hero/section trang chủ (VI+EN) | Cập nhật hiển thị đúng | CRUD/Public | | |
| HOME-02 | AUTHOR | POST `/api/homepage-sections` (curl) | Bị chặn (403) | RBAC | | |

### 1.10. Videos / Podcasts / Web Crawler / Keywords *(P2 — best effort)*
UI: `/dashboard/admin/cms/videos`, `.../podcasts`, `/dashboard/admin/crawled-content` · API: `/api/videos`, `/api/podcasts`, `/api/crawled-content`, `/api/web-sources`, `/api/keywords`

| ID | Tiền điều kiện | Thao tác | Kết quả mong đợi | Khía cạnh | P/F | Ghi chú |
|---|---|---|---|---|---|---|
| VID-01 | EIC | CRUD video (youtube/upload) | Hoạt động; isActive điều khiển hiển thị | CRUD/Public | | |
| POD-01 | EIC | CRUD podcast (audio + transcript) | Hoạt động; play count tăng khi nghe | CRUD/Public | | |
| CRWL-01 | EIC | Duyệt/Import nội dung đã crawl → News | Import đúng; **rà branding trước khi publish** | CRUD/Brand | | nguồn ngoài |
| KW-01 | EIC | CRUD từ khóa | Hoạt động; không lộ keyword branding cũ | CRUD/Brand | | xem §5-F3 |

---

## Phần 2 — Ma trận RBAC chéo (kỳ vọng)

`✅` = được phép · `⛔` = phải bị chặn ở backend.

| Thao tác CMS | READER | AUTHOR | SECTION_EDITOR | MANAGING_EDITOR | DEPUTY_EIC | EIC | SYSADMIN |
|---|---|---|---|---|---|---|---|
| Sửa site-settings (PATCH) | ⛔ | ⛔ | ⛔ | ✅ | ✅ | ✅ | ✅ |
| Xóa site-setting (DELETE) | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ |
| CRUD navigation / public-pages | ⛔ | ⛔ | ⛔ | ✅ | ✅ | ✅ | ✅ |
| CRUD banner / slider / homepage | ⛔ | ⛔ | ⛔ | ✅ | ✅ | ✅ | ✅ |
| CRUD category / featured / news | ⛔ | ⛔ | ⛔ | ✅ | ✅ | ✅ | ✅ |
| Upload media | ⛔ | ✅¹ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Duyệt bài** (approve) | ⛔ | ⛔ | ⛔ | ✅ | ✅ | ✅ | ✅ |
| **Xuất bản số** (publish) | ⛔ | ⛔ | ⛔ | ⛔ | **⛔** | ✅ | ✅ |

¹ AUTHOR/REVIEWER được upload media (đính kèm bài), không được quản trị CMS khác.

> **Điểm mấu chốt**: DEPUTY_EIC quản trị CMS và **duyệt** bài được, nhưng **KHÔNG xuất bản** —
> chỉ EIC/SYSADMIN ký xuất bản cuối. Đã được khóa bằng `cms-publish-rbac.test.ts`.

---

## Phần 3 — Spot-check Branding NTQS

Duyệt thủ công, xác nhận **không** xuất hiện: HVHC · "Học viện Hậu cần" · ISSN cũ · email/SĐT/địa chỉ cũ.

- [ ] Trang chủ `/` — tên tạp chí, banner, alt text
- [ ] Footer (mọi trang) — ISSN 1859-0454, email, SĐT, địa chỉ, copyright "Học viện Quốc phòng"
- [ ] `/about`, `/journal`, `/contact`, `/guidelines`, `/license`, `/publishing-process`
- [ ] Metadata tab trình duyệt + chia sẻ mạng xã hội (OG image/description)
- [ ] Email mẫu (thông báo nộp bài/quyết định) — sender name + chữ ký
- [ ] Favicon = logo HVQP; màu chủ đạo `#1E3924`, accent `#E5C86E`

> Bổ trợ tự động: `npm test` chạy `branding-guard.test.ts` (quét runtime + seed identity).

---

## Phần 4 — Hiển thị public end-to-end

1. [ ] Đăng nhập AUTHOR → nộp bài mới.
2. [ ] EIC/biên tập → đưa qua phản biện → ACCEPTED → tạo Article (PENDING).
3. [ ] Duyệt bài (approve → APPROVED).
4. [ ] Gán bài vào số → **Xuất bản số** (EIC).
5. [ ] Kiểm tra bài hiện ở: `/issues/[id]`, trang chủ `/`, `/library`, `/categories/[slug]`, `/api/public/articles`.
6. [ ] Xác nhận bài **chưa duyệt / chưa publish KHÔNG lộ** ở các trang trên.
7. [ ] Đổi 1 site-setting → reload public → giá trị mới áp đúng (sau cache ~5').
8. [ ] Kiểm tra song ngữ VI/EN ở trang tĩnh + section trang chủ.

---

## Phần 5 — Phát hiện (từ đợt audit + test 2026-06-15)

> **Đã sửa toàn bộ F1–F5 (2026-06-15).** Toàn bộ project type-check sạch
> (`tsc --noEmit` = 0 lỗi); `npm test` xanh; branding-guard nay khóa cả seed demo.

| ID | Mức | Mô tả | Vị trí | Trạng thái |
|---|---|---|---|---|
| ~~**F1**~~ | ~~Thấp~~ | ✅ **ĐÃ SỬA** — chuẩn hóa status mọi route CMS admin: chưa đăng nhập → **401**, sai role → **403**. (`cms/sliders` không còn trả 401 cho sai role; `navigation`/`public-pages`/`site-settings` không còn trả 403 khi thiếu phiên.) | navigation, public-pages, site-settings/[key], cms/sliders, banners | Hoàn tất |
| ~~**F2**~~ | ~~Trung bình~~ | ✅ **ĐÃ SỬA** — `/api/media`, `/api/banners`, `/api/news/upload-image` đều gọi `validateMediaFile` (lib/file-security.ts): xác thực **magic bytes** (fail-closed), chặn executable / double-extension / path traversal, không còn tin `file.type` từ client. Khóa bằng `media-upload-route.test.ts` + `media-upload-security.test.ts`. | `app/api/media/route.ts`, `app/api/banners/route.ts`, `app/api/news/upload-image/route.ts`, `lib/file-security.ts` | Hoàn tất |
| ~~**F3**~~ | ~~Thấp~~ | ✅ **ĐÃ SỬA** — dọn token cũ trong seed demo: URL `hocvienhaucan.edu.vn`/`themes/hvhc` → asset local `/images/default-article.jpg`; tag/keyword `'học viện hậu cần'`/`'hvhc'` → `'học viện quốc phòng'`/`'hvqp'`; DOI mẫu `10.15625/hvhc` → `10.15625/ntqs`. Giữ nguyên từ "hậu cần" (từ vựng quân sự hợp lệ). Khóa bằng branding-guard (đã thêm 3 file demo vào danh sách quét). | `prisma/seed-news-videos.ts`, `prisma/seed-webcrawler.ts`, `prisma/seed-demo-data.ts` | Hoàn tất |
| ~~**F4**~~ | ~~Thấp~~ | ✅ **ĐÃ SỬA** — 8 route CMS admin dùng chung `can.admin` (lib/rbac.ts) làm SSOT phân quyền, bỏ mảng role nhúng cứng. | navigation, public-pages, site-settings/[key], categories, featured-articles, homepage-sections, cms/sliders, banners | Hoàn tất |
| ~~**F5**~~ | ~~Thấp~~ | ✅ **ĐÃ SỬA** — bỏ role `'ADMIN'` (không hợp lệ) khỏi `cms/sliders`; nay dùng `can.admin`. | `app/api/cms/sliders/route.ts` | Hoàn tất |

---

## Phần 6 — Bộ test tự động liên quan (chạy `npm test`)

| File | Phủ |
|---|---|
| `tests/unit/cms-rbac-routes.test.ts` | RBAC backend cho 9 route mutation CMS (P0/P1): READER/AUTHOR/chưa-đăng-nhập bị chặn + không ghi dữ liệu; vai trò hợp lệ qua guard. |
| `tests/unit/cms-publish-rbac.test.ts` | Quyền xuất bản số (chỉ EIC/SYSADMIN — DEPUTY_EIC bị chặn) và duyệt bài (DEPUTY_EIC được phép). |
| `tests/unit/public-visibility.test.ts` | Filter hiển thị public: `/api/public/articles` (status=PUBLISHED + có Article), `/api/issues/latest` (PUBLISHED + publishDate ≤ now). |
| `tests/unit/media-upload-security.test.ts` | `lib/file-security.ts`: size/MIME/double-ext/executable/magic-byte/path-traversal/scan nội dung + `validateMediaFile`/`verifyMediaSignature` (ảnh + video). |
| `tests/unit/media-upload-route.test.ts` | Tích hợp `/api/media` POST: chặn EXE giả mạo .png/MIME (F2), chấp nhận ảnh hợp lệ. |
| `tests/unit/branding-guard.test.ts` | Quét runtime + seed identity NTQS (mở rộng). |
