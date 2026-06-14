# Kế hoạch Cải tiến Hệ thống Tạp chí Nghiên cứu Khoa học Hậu cần Quân sự

## Context

**Hệ thống:** Tạp chí Điện tử Nghiên cứu Khoa học Hậu cần Quân sự – Học viện Hậu cần (tapchi-hcqs)

**Vấn đề:** Hệ thống đã được xây dựng với kiến trúc khá hoàn chỉnh, nhưng còn nhiều module chưa được kết nối đầy đủ, thiếu testing, thiếu một số tính năng quan trọng của tạp chí điện tử chuẩn quốc tế, và cần chuẩn bị cho môi trường mạng nội bộ quân đội (intranet, không có internet).

**Mục tiêu:** Nâng cấp hệ thống đạt tiêu chuẩn tạp chí khoa học điện tử quốc tế (tương đương OJS - Open Journal Systems), đảm bảo an toàn vận hành trên mạng nội bộ quân sự.

---

## Phân tích Hiện trạng

### Stack kỹ thuật
- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** Next.js API routes + Prisma ORM + PostgreSQL
- **Auth:** JWT (access 8h / refresh 7d) + bcryptjs + 2FA OTP
- **Storage:** Local filesystem (AWS S3 disabled, intranet mode)
- **Caching:** Redis (Upstash client, nhưng chạy local)
- **Roles:** 9 vai trò (READER, AUTHOR, REVIEWER, SECTION_EDITOR, MANAGING_EDITOR, EIC, LAYOUT_EDITOR, SYSADMIN, SECURITY_AUDITOR)

### Những gì đã có
- Vòng đời bài báo đầy đủ: NEW → DESK_REJECT → UNDER_REVIEW → REVISION → ACCEPTED → IN_PRODUCTION → PUBLISHED
- RBAC với Permission matrix
- Audit log toàn diện
- Plagiarism detection (disabled)
- SLA tracking & deadline automation
- CMS (banner, news, featured articles, navigation)
- Analytics cơ bản
- Email notification templates
- 2FA, ORCID integration, API token
- Copyediting & production pipeline
- Chat nội bộ, messaging
- Repository bài báo

### Những gì còn thiếu / chưa hoàn thiện
1. **Testing** - Không có test nào
2. **State management** - Không có React Query/SWR, fetch nằm rải rác trong useEffect
3. **Real-time notifications** - Chỉ polling, không có WebSocket/SSE
4. **Full-text search** - Backend có nhưng UI chưa expose đầy đủ
5. **Citation export** - Box hiển thị nhưng download BibTeX/RIS chưa rõ
6. **DOI integration** - CrossRef ở test mode
7. **Sitemap/SEO** - Chưa rõ có sitemap.xml, robots.txt không
8. **Accessibility** - Chưa kiểm tra ARIA, keyboard navigation
9. **Mobile optimization** - Header có nhưng dashboard chưa tối ưu mobile
10. **Error boundaries** - Chưa có
11. **Loading skeletons** - Thiếu ở nhiều trang
12. **API documentation** - Chưa có Swagger/OpenAPI
13. **Backup strategy** - Chưa rõ
14. **Deployment config** - Chưa có Docker/production config

---

## Kế hoạch Cải tiến theo Ưu tiên

### PHASE 1: Ổn định nền tảng (Foundation Hardening) — Ưu tiên cao nhất

#### 1.1 Testing Infrastructure
**Mục tiêu:** Có ít nhất test cho business logic cốt lõi

**Việc cần làm:**
- Cài Jest + @testing-library/react + supertest
- Viết unit test cho:
  - `/lib/workflow.ts` — state machine transitions
  - `/lib/rbac.ts` — role permission checking
  - `/lib/sla-manager.ts` — SLA calculation
  - `/lib/deadline-manager.ts` — deadline logic
- Viết integration test cho:
  - `POST /api/submissions` — tạo bài nộp
  - `POST /api/submissions/[id]/decision` — quyết định biên tập
  - Auth flow: login → 2FA → access protected route
- Viết permission test:
  - Reviewer không thấy bài của reviewer khác
  - Author chỉ thấy bài của mình
  - READER không access dashboard

**Files cần tạo:**
- `/tests/unit/workflow.test.ts`
- `/tests/unit/rbac.test.ts`
- `/tests/integration/submissions.test.ts`
- `/tests/integration/auth.test.ts`

#### 1.2 Error Boundaries & Loading States
**Mục tiêu:** UI không bị trắng khi lỗi

**Việc cần làm:**
- Thêm global error boundary ở `app/error.tsx`
- Thêm loading skeleton cho:
  - Trang danh sách bài báo (`/articles/loading.tsx`)
  - Dashboard author (`/dashboard/author/loading.tsx`)
  - Dashboard editor (`/dashboard/editor/loading.tsx`)
- Thêm `not-found.tsx` đúng chuẩn

**Files cần sửa/tạo:**
- `app/error.tsx`
- `app/not-found.tsx`
- `app/(public)/articles/loading.tsx`
- `app/dashboard/author/loading.tsx`
- `app/dashboard/editor/loading.tsx`

#### 1.3 Data Fetching Layer (Client-side)
**Mục tiêu:** Chuẩn hóa fetch ở client, tránh useEffect scatter

**Việc cần làm:**
- Tích hợp TanStack Query (đã có trong package.json nhưng chưa dùng)
- Tạo custom hooks layer:
  - `hooks/useSubmissions.ts`
  - `hooks/useReviews.ts`
  - `hooks/useArticles.ts`
  - `hooks/useNotifications.ts`
- Cấu hình QueryProvider trong `app/providers.tsx`

**Files cần sửa:**
- `app/providers.tsx` — thêm QueryClientProvider
- `app/dashboard/author/page.tsx` — dùng hook thay useEffect
- `app/dashboard/reviewer/page.tsx` — tương tự
- `app/dashboard/editor/page.tsx` — tương tự

---

### PHASE 2: Tính năng Tạp chí Chuẩn quốc tế

#### 2.1 Citation Export đầy đủ
**Mục tiêu:** Download được BibTeX, RIS, APA, Chicago, Vancouver

**Việc cần làm:**
- API `GET /api/articles/[id]/citation?format=bibtex|ris|apa|chicago|vancouver`
- UI button download citation trên trang bài báo
- Format đúng chuẩn cho từng kiểu

**Files cần sửa:**
- `app/api/articles/[id]/citation/route.ts` — thêm các format
- `app/(public)/articles/[id]/page.tsx` — thêm download buttons
- `components/citation-box.tsx` — thêm format selector

#### 2.2 Advanced Search & Filtering
**Mục tiêu:** Tìm kiếm đúng chuẩn tạp chí khoa học

**Việc cần làm:**
- UI search nâng cao:
  - Filter theo: tác giả, năm xuất bản, category, từ khóa, journal issue
  - Sắp xếp theo: ngày mới nhất, số lượt xem, số lượt download, độ liên quan
- Full-text search UI expose endpoint backend đã có
- Search result highlighting
- Lưu lịch sử tìm kiếm (localStorage)

**Files cần sửa:**
- `app/(public)/search/advanced/page.tsx` — hoàn thiện filter UI
- `app/api/articles/route.ts` — đảm bảo filter params đầy đủ
- `components/search-filter.tsx` — thêm advanced filter panel

#### 2.3 DOI Integration hoàn chỉnh
**Mục tiêu:** Register DOI thật với CrossRef

**Việc cần làm:**
- Hoàn thiện `lib/crossref.ts` hoặc tương đương
- Admin UI để trigger DOI registration
- Hiển thị DOI badge trên trang bài báo
- Metadata đầy đủ theo CrossRef schema

**Files cần sửa:**
- `lib/integrations/crossref.ts` — production mode
- `app/dashboard/admin/articles/[id]/page.tsx` — thêm DOI action
- `app/(public)/articles/[id]/page.tsx` — hiển thị DOI với link

#### 2.4 Sitemap & SEO
**Mục tiêu:** Tạp chí indexed đúng chuẩn (dù intranet thì vẫn cần sitemap nội bộ)

**Việc cần làm:**
- `app/sitemap.ts` — dynamic sitemap từ database
- `app/robots.ts` — robots.txt
- Open Graph metadata cho từng bài báo
- Structured data (JSON-LD) cho articles

**Files cần tạo:**
- `app/sitemap.ts`
- `app/robots.ts`
- Cập nhật `app/(public)/articles/[id]/page.tsx` — thêm JSON-LD

#### 2.5 Notification System (SSE/Polling)
**Mục tiêu:** Thông báo real-time cho reviewer, editor khi có bài mới

**Việc cần làm:**
- Server-Sent Events endpoint: `GET /api/notifications/stream`
- Client hook: `hooks/useNotifications.ts` với SSE
- Badge count trên nav
- Mark as read / mark all as read

**Files cần sửa:**
- `app/api/notifications/stream/route.ts` — tạo mới SSE endpoint
- `components/dashboard/notification-panel.tsx` — kết nối SSE
- `components/header.tsx` — notification badge

---

### PHASE 3: Security & Production Readiness

#### 3.1 Security Hardening
**Mục tiêu:** Đạt chuẩn vận hành mạng quân sự

**Việc cần làm:**
- Kiểm tra và enforce rate limiting đủ strict (login, upload, submit)
- CORS policy rõ ràng (intranet only, deny external origins)
- Session invalidation khi đổi password
- Detect concurrent sessions cùng user từ nhiều IP
- File upload: double-check MIME type, quarantine trước khi serve
- Audit log: bổ sung các event còn thiếu (view bài nhạy cảm, export, download)
- Kiểm tra không có hardcoded credentials trong code

**Files cần sửa:**
- `middleware.ts` — tăng cường header + CORS
- `lib/rate-limiter.ts` — config chặt hơn cho môi trường quân sự
- `lib/file-security.ts` — MIME validation strict
- `lib/session-manager.ts` — concurrent session detection
- `lib/audit-logger.ts` — bổ sung event types còn thiếu

#### 3.2 Performance Optimization
**Mục tiêu:** Homepage và trang bài báo load nhanh trên mạng nội bộ

**Việc cần làm:**
- Tối ưu database queries (N+1 query trong listing pages)
- Thêm database index còn thiếu (kiểm tra schema)
- Image optimization với Sharp (đã có package)
- Caching strategy rõ ràng: Redis cho site settings, hot articles
- ISR hoặc on-demand revalidation cho public pages

**Files cần sửa:**
- `prisma/schema.prisma` — thêm index còn thiếu
- `app/(public)/page.tsx` — tối ưu data fetching
- `app/(public)/articles/[id]/page.tsx` — cache strategy
- `lib/cache.ts` — chuẩn hóa cache keys & TTL

#### 3.3 Backup & Recovery Plan
**Mục tiêu:** Có kế hoạch khôi phục dữ liệu rõ ràng

**Việc cần làm:**
- Script backup PostgreSQL tự động (`scripts/backup.sh`)
- Script backup files upload (`scripts/backup-files.sh`)
- Document restore procedure
- Cron job backup hàng ngày

**Files cần tạo:**
- `scripts/backup.sh`
- `scripts/restore.sh`
- `docs/BACKUP_RESTORE.md`

#### 3.4 Docker & Production Deployment
**Mục tiêu:** Deploy được trên server Linux nội bộ

**Việc cần làm:**
- `Dockerfile` cho Next.js production
- `docker-compose.yml` với PostgreSQL + Redis + Next.js app
- Nginx reverse proxy config
- Environment variable documentation
- Health check endpoint: `GET /api/health`

**Files cần tạo:**
- `Dockerfile`
- `docker-compose.yml`
- `nginx.conf`
- `.env.example` đầy đủ
- `app/api/health/route.ts`

---

### PHASE 4: UX & Accessibility

#### 4.1 Mobile Responsiveness
**Mục tiêu:** Dashboard dùng được trên tablet (mobile ít quan trọng hơn với môi trường quân sự)

**Việc cần làm:**
- Kiểm tra và fix responsive cho dashboard sidebar
- Submission form trên tablet
- Table/grid responsive với horizontal scroll fallback
- Touch-friendly action buttons

#### 4.2 Accessibility (WCAG 2.1 AA)
**Mục tiêu:** Đảm bảo keyboard navigation và screen reader

**Việc cần làm:**
- Audit ARIA labels trên form fields
- Keyboard navigation trong modals/dialogs
- Focus management sau modal close
- Color contrast check (army-green theme)
- Skip to main content link

#### 4.3 UX Improvements
**Mục tiêu:** Luồng tác vụ chính mượt hơn

**Việc cần làm:**
- Autosave cho submission form (đã có API, cần kết nối UI)
- Drag-and-drop upload cho file bài báo
- Preview PDF ngay trong submission form trước khi submit
- Progress indicator trong multi-step workflow
- Confirmation dialogs cho các action destructive

**Files cần sửa:**
- `components/dashboard/submission-form-enhanced.tsx` — autosave + preview
- `app/dashboard/editor/submissions/[id]/page.tsx` — workflow progress
- Various dialog components — confirm destructive actions

---

### PHASE 5: Advanced Features (Dài hạn)

#### 5.1 AI-assisted Features
**Mục tiêu:** Tận dụng `/lib/ai/` đã có

**Việc cần làm:**
- Reviewer matching tự động (đã có `reviewer-matcher.ts`, cần UI trigger)
- Keyword suggestion từ abstract
- Summary generation cho abstract dài
- Plagiarism score interpretation helper

#### 5.2 Analytics nâng cao
**Mục tiêu:** Báo cáo cho Ban Biên tập

**Việc cần làm:**
- Dashboard KPI: số bài nộp/tháng, tỷ lệ chấp nhận, thời gian review trung bình
- Báo cáo reviewer performance
- Export báo cáo Excel/PDF
- Trend charts theo thời gian

#### 5.3 Bilingual Support
**Mục tiêu:** Tạp chí có thể dùng cả tiếng Anh và tiếng Việt

**Việc cần làm:**
- i18n với next-intl hoặc react-i18next
- UI switch ngôn ngữ
- Bilingual metadata cho bài báo (schema đã hỗ trợ)

#### 5.4 ORCID & External Profile
**Mục tiêu:** Tích hợp profile tác giả chuẩn quốc tế

**Việc cần làm:**
- ORCID OAuth flow hoàn chỉnh (hiện ở sandbox mode)
- Tự động populate author info từ ORCID
- Hiển thị ORCID badge trên trang tác giả

---

## Thứ tự Triển khai Đề xuất

| Phase | Mức độ ưu tiên | Thời gian ước tính |
|-------|---------------|---------------------|
| 1.2 Error Boundaries & Loading | Cao nhất | 1 ngày |
| 1.3 Data Fetching Layer | Cao | 2-3 ngày |
| 2.5 Notification SSE | Cao | 2 ngày |
| 3.1 Security Hardening | Cao nhất | 3-4 ngày |
| 3.4 Docker & Deployment | Cao | 2 ngày |
| 1.1 Testing | Cao | 3-5 ngày |
| 2.1 Citation Export | Trung bình | 1-2 ngày |
| 2.2 Advanced Search | Trung bình | 2-3 ngày |
| 2.3 DOI Integration | Trung bình | 2 ngày |
| 2.4 Sitemap & SEO | Trung bình | 1 ngày |
| 3.2 Performance | Trung bình | 2-3 ngày |
| 3.3 Backup Strategy | Cao | 1 ngày |
| 4.x UX & A11y | Thấp-trung | 3-5 ngày |
| 5.x Advanced Features | Thấp | Dài hạn |

---

## Files Quan trọng cần Nắm

### Core Business Logic
- [nextjs_space/lib/workflow.ts](nextjs_space/lib/workflow.ts) — State machine bài báo
- [nextjs_space/lib/rbac.ts](nextjs_space/lib/rbac.ts) — RBAC logic
- [nextjs_space/lib/sla-manager.ts](nextjs_space/lib/sla-manager.ts) — SLA tracking
- [nextjs_space/lib/audit-logger.ts](nextjs_space/lib/audit-logger.ts) — Audit logging
- [nextjs_space/lib/deadline-manager.ts](nextjs_space/lib/deadline-manager.ts) — Deadline automation

### API Routes Quan trọng
- [nextjs_space/app/api/submissions/route.ts](nextjs_space/app/api/submissions/route.ts)
- [nextjs_space/app/api/submissions/[id]/decision/route.ts](nextjs_space/app/api/submissions/[id]/decision/route.ts)
- [nextjs_space/app/api/reviews/route.ts](nextjs_space/app/api/reviews/route.ts)
- [nextjs_space/app/api/articles/[id]/citation/route.ts](nextjs_space/app/api/articles/[id]/citation/route.ts)

### Schema & Auth
- [nextjs_space/prisma/schema.prisma](nextjs_space/prisma/schema.prisma)
- [nextjs_space/middleware.ts](nextjs_space/middleware.ts)
- [nextjs_space/lib/auth.ts](nextjs_space/lib/auth.ts)
- [nextjs_space/lib/api-guards.ts](nextjs_space/lib/api-guards.ts)

### UI Pages Quan trọng
- [nextjs_space/app/(public)/page.tsx](nextjs_space/app/(public)/page.tsx) — Homepage
- [nextjs_space/app/(public)/articles/[id]/page.tsx](nextjs_space/app/(public)/articles/[id]/page.tsx)
- [nextjs_space/app/dashboard/editor/submissions/[id]/page.tsx](nextjs_space/app/dashboard/editor/submissions/[id]/page.tsx)
- [nextjs_space/components/dashboard/submission-form-enhanced.tsx](nextjs_space/components/dashboard/submission-form-enhanced.tsx)

---

## Verification Plan

Sau mỗi phase:
1. **Phase 1:** Chạy test suite (`npm test`) — tất cả pass; navigate UI không có trạng thái trắng
2. **Phase 2:** Thử download citation BibTeX/RIS; test search với filter; verify DOI link
3. **Phase 3:** Penetration test cơ bản; `docker-compose up` thành công; backup/restore test
4. **Phase 4:** Tab navigation qua toàn bộ form; test trên tablet 768px; Lighthouse accessibility score
5. **Phase 5:** AI reviewer suggestion trả kết quả; dashboard KPI hiển thị đúng số liệu
