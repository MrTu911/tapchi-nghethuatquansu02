# Phương án kiểm tra chức năng theo vai trò — Tạp chí Nghệ thuật Quân sự Việt Nam

> Mục tiêu: nghiệm thu rằng **mỗi vai trò đăng nhập được, vào đúng dashboard, thấy đúng menu, làm đúng phạm vi nghiệp vụ** và **bị chặn đúng chỗ**. Dùng kèm script kiểm tra tự động `npm run verify:roles`.

## 0. Chuẩn bị môi trường

```bash
cd nextjs_space
npm run seed                 # (tùy chọn) dữ liệu mẫu: chuyên mục, số, submissions
npm run seed:editorial-board # (tùy chọn) tên măng-sét Ban biên tập
npm run seed:demo-accounts   # BẮT BUỘC: 11 tài khoản demo login-được-ngay
npm run verify:roles         # smoke test: 11/11 PASS là đạt
```

- **Mật khẩu chung mọi tài khoản demo:** `TapChi@2025`
- Tất cả tài khoản demo được set sẵn `APPROVED + active + emailVerified` → đăng nhập ngay.
- Trang đăng nhập `/auth/login` có panel **"Tài khoản demo theo vai trò"** (gom 4 nhóm) — bấm để tự điền.
- SSOT: tài khoản ở [lib/demo-accounts.ts](../lib/demo-accounts.ts); route dashboard ở [lib/role-dashboard.ts](../lib/role-dashboard.ts).

## 1. Bảng tổng hợp 11 vai trò

| # | Vai trò | Email demo | Dashboard sau đăng nhập | Cấp bậc |
|---|---|---|---|---|
| 1 | Tổng biên tập (EIC) | tongbientap@tapchintqsvn.edu.vn | `/dashboard/eic` | 7 |
| 2 | Phó Tổng biên tập (DEPUTY_EIC) | photongbientap@tapchintqsvn.edu.vn | `/dashboard/deputy` | 6 |
| 3 | Chỉ huy Học viện (COMMANDER) | chihuy@tapchintqsvn.edu.vn | `/dashboard/commander` | 8 |
| 4 | Thư ký tòa soạn (MANAGING_EDITOR) | bientapchinh@tapchintqsvn.edu.vn | `/dashboard/managing` | 5 |
| 5 | BTV chuyên mục (SECTION_EDITOR) | bientap@tapchintqsvn.edu.vn | `/dashboard/editor` | 4 |
| 6 | BTV dàn trang (LAYOUT_EDITOR) | dangtrang@tapchintqsvn.edu.vn | `/dashboard/layout` → production | 4 |
| 7 | Tác giả (AUTHOR) | tacgia@tapchintqsvn.edu.vn | `/dashboard/author` | 2 |
| 8 | Phản biện viên (REVIEWER) | phanbien@tapchintqsvn.edu.vn | `/dashboard/reviewer` | 3 |
| 9 | Độc giả (READER) | docgia@tapchintqsvn.edu.vn | `/dashboard/author` (xem) | 1 |
| 10 | Quản trị hệ thống (SYSADMIN) | admin@tapchintqsvn.edu.vn | `/dashboard/admin` | 9 |
| 11 | Kiểm định bảo mật (SECURITY_AUDITOR) | baomat@tapchintqsvn.edu.vn | `/dashboard/security` | 5 |

> Nguồn ranh giới quyền: [lib/rbac.ts](../lib/rbac.ts) (`can.*`, `roleHierarchy`), [lib/permissions.ts](../lib/permissions.ts), [lib/workflow.ts](../lib/workflow.ts) (action theo trạng thái), [middleware.ts](../middleware.ts) (chặn truy cập dashboard), [lib/editor-scope.ts](../lib/editor-scope.ts) (scope bài nộp).

## 2. Kiểm tra chung cho MỌI vai trò

- [ ] Bấm nút demo ở `/auth/login` → tự điền email/mật khẩu → **Đăng nhập thành công**.
- [ ] Sau đăng nhập **redirect đúng** dashboard ở bảng mục 1.
- [ ] Sidebar chỉ hiển thị nhóm/menu đúng quyền (không lộ menu admin với vai trò thấp).
- [ ] Gõ tay URL của dashboard **không thuộc quyền** → bị middleware đẩy về dashboard mặc định kèm `?error=access_denied` (ví dụ AUTHOR mở `/dashboard/admin`).
- [ ] Đăng xuất → vào lại `/auth/login`.

---

## 3. Kiểm tra theo từng vai trò

### 3.1. Tác giả (AUTHOR) — `tacgia@`
- **Menu kỳ vọng:** Tổng quan, Nộp bài (Nộp bài mới / Bài đã nộp / Báo cáo công bố của tôi), Hồ sơ, Thông báo, Tin nhắn.
- **CAN:** nộp bài mới; xem tiến trình bài của mình; chỉnh sửa bài khi bị yêu cầu (REVISION); xem lịch sử công bố.
- **CANNOT:** xem bài người khác; gán phản biện; ra quyết định; vào khu biên tập/admin.
- **Ca kiểm thử:**
  1. Vào `/dashboard/author/submit` → nộp 1 bài (chọn chuyên mục) → bài xuất hiện ở "Bài đã nộp" trạng thái `NEW`.
  2. Mở 1 bài đang `REVISION` (nếu có từ seed) → trang revise cho upload bản sửa + phản hồi.
  3. Thử mở `/dashboard/editor/submissions` → bị chặn về `/dashboard/author`.

### 3.2. Phản biện viên (REVIEWER) — `phanbien@`
- **Menu kỳ vọng:** Tổng quan, Nộp bài, **Phản biện** (Bài cần phản biện / Lịch sử phản biện), Kiểm tra trùng lặp, Hồ sơ.
- **CAN:** xem bài được phân công phản biện; chấp nhận/từ chối lời mời; nộp phiếu phản biện (lưu nháp, nộp, sửa tới khi có quyết định); kiểm tra trùng lặp.
- **CANNOT:** thấy danh tính tác giả nếu phản biện kín; chat với tác giả (blind review — [lib/chat-guard.ts](../lib/chat-guard.ts)); ra quyết định biên tập; xuất bản.
- **Ca kiểm thử:**
  1. `/dashboard/reviewer/assignments` → có bài được gán (seed tạo sẵn) → mở phiếu phản biện → lưu nháp → nộp.
  2. KPI dashboard phản biện hiển thị: tổng được gán, chờ phản biện, đã hoàn thành, đúng hạn.
  3. Thử mở trang quyết định của editor → bị chặn.

### 3.3. BTV chuyên mục (SECTION_EDITOR) — `bientap@`
- **Menu kỳ vọng:** Tổng quan, Nộp bài, **Biên tập** (Bài cần xử lý / Gán phản biện / Quy trình & Deadline), Kiểm tra đạo văn & trùng lặp, Kho bài báo.
- **CAN:** xử lý **chỉ những bài được phân công cho mình** (`assignedEditorId == self`); gán phản biện; gửi đi phản biện; yêu cầu chỉnh sửa; ra quyết định ACCEPT/REJECT trong phạm vi bài của mình.
- **CANNOT:** thấy bài KHÔNG được phân công (scope — [lib/editor-scope.ts](../lib/editor-scope.ts)); phân công biên tập cho người khác; ký xuất bản.
- **Ca kiểm thử:**
  1. `/dashboard/editor/submissions` → **chỉ** thấy bài được phân công (đối chiếu với Thư ký thấy tất cả).
  2. Gán phản biện cho 1 bài → trạng thái chuyển `UNDER_REVIEW`.
  3. **Boundary:** xác nhận KHÔNG có nút ký xuất bản.

### 3.4. Thư ký tòa soạn (MANAGING_EDITOR) — `bientapchinh@`
- **Menu kỳ vọng:** như BTV chuyên mục **+** Phân công biên tập, Quản lý số/Tập/Chuyên mục/Từ khóa, Quản lý người dùng & phản biện, CMS, Thống kê/Báo cáo (menu lọc theo quyền cấp ở DB — [components/dashboard/sidebar.tsx](../components/dashboard/sidebar.tsx)).
- **CAN:** thấy **toàn bộ** bài nộp; phân công biên tập viên; ra quyết định; quản lý số tạp chí; điều phối quy trình.
- **CANNOT:** ký xuất bản cuối (EIC-only); đổi vai trò người dùng (`users.role_change` — EIC/SYSADMIN).
- **Ca kiểm thử:**
  1. Dashboard hiển thị KPI: Chờ phân công / Đang phản biện / Cần quyết định / Chờ xuất bản / Đang dàn trang / Số tạp chí.
  2. `/dashboard/managing/assignments` → phân công 1 bài `NEW` cho BTV chuyên mục.
  3. Tạo/sửa 1 số tạp chí ở `/dashboard/managing/issues`.

### 3.5. Phó Tổng biên tập (DEPUTY_EIC) — `photongbientap@`
- **Menu kỳ vọng:** quyền điều hành ngang EIC (biên tập, phân công, dàn trang, CMS, người dùng, phân tích, bảo mật read-only).
- **CAN:** giám sát toàn tòa soạn; ra quyết định biên tập; đẩy bài vào sản xuất; **trình** bài đã dàn trang lên TBT.
- **CANNOT:** **ký xuất bản cuối** (PUBLISHED — EIC-only, [lib/workflow.ts](../lib/workflow.ts)); ghi đè quyết định; đổi vai trò; duyệt nâng quyền.
- **Ca kiểm thử:**
  1. Dashboard có banner nhắc "quyền ký xuất bản thuộc Tổng biên tập".
  2. Khối "Trình Tổng biên tập" chỉ **theo dõi**, **KHÔNG** có nút Xuất bản.
  3. Mở 1 bài `IN_PRODUCTION` → xác nhận không có hành động publish.

### 3.6. Tổng biên tập (EIC) — `tongbientap@`
- **CAN:** **tất cả** quyền điều hành **+ ký xuất bản cuối** (PUBLISHED); xem phân tích chi tiết; quản lý quyền RBAC.
- **Ca kiểm thử:**
  1. Dashboard `/dashboard/eic` có "Hàng chờ ký xuất bản" với **nút Xuất bản**.
  2. Ký xuất bản 1 bài `IN_PRODUCTION` → chuyển `PUBLISHED`, xuất hiện công khai.
  3. So sánh với Phó TBT: cùng bài đó Phó TBT không có nút này.

### 3.7. BTV dàn trang (LAYOUT_EDITOR) — `dangtrang@`
- **Dashboard:** redirect `/dashboard/layout` → `/dashboard/layout/production` (Hàng đợi sản xuất).
- **CAN:** dàn trang bài `IN_PRODUCTION`; kiểm tra đạo văn/trùng lặp; xem kho bài báo.
- **CANNOT:** ra quyết định biên tập; ký xuất bản.
- **Ca kiểm thử:** mở hàng đợi sản xuất → thao tác dàn trang 1 bài; xác nhận không có nút quyết định/publish.

### 3.8. Quản trị hệ thống (SYSADMIN) — `admin@`
- **CAN:** toàn quyền — người dùng, RBAC, nội dung, CMS, số tạp chí, tích hợp, bảo mật, giám sát, ký xuất bản.
- **Ca kiểm thử:**
  1. `/dashboard/admin` mở được; vào được Quản lý người dùng, Quyền (RBAC), Cài đặt website.
  2. Mở `/dashboard/admin/users` → duyệt/khóa 1 tài khoản.
  3. Xem được nhật ký bảo mật/kiểm toán.

### 3.9. Kiểm định bảo mật (SECURITY_AUDITOR) — `baomat@`
- **Menu kỳ vọng:** khu vực **Bảo mật** (bảng kiểm soát) — không thấy menu quản trị nội dung.
- **CAN:** xem cảnh báo bảo mật, phiên đăng nhập, nhật ký kiểm toán; **đồng ký bài mật** (SECRET/TOP_SECRET) theo quy tắc hai người cùng TBT.
- **CANNOT:** quyết định biên tập thường; xuất bản; quản lý nội dung.
- **Ca kiểm thử:**
  1. Dashboard `/dashboard/security` hiển thị KPI: cảnh báo chờ xử lý, phiên hoạt động, sự kiện kiểm toán hôm nay, bài mật đang xử lý.
  2. Khối "Bài mật chờ đồng ký" liệt kê bài SECRET/TOP_SECRET (nếu có).

### 3.10. Chỉ huy Học viện (COMMANDER) — `chihuy@`
- **Menu kỳ vọng:** Trung tâm Chỉ huy (Tổng quan Học viện, Xu hướng, Lĩnh vực NC, Hệ sinh thái tác giả, Chất lượng & Bảo mật, Báo cáo điều hành, Báo cáo công bố).
- **CAN:** xem báo cáo tổng hợp **chỉ đọc**; nộp bài cá nhân.
- **CANNOT:** chỉnh sửa nội dung; quyết định biên tập; xuất bản; quản trị.
- **Ca kiểm thử:** mở `/dashboard/commander` → các báo cáo/biểu đồ hiển thị; không có nút hành động ghi.

### 3.11. Độc giả (READER) — `docgia@`
- **CAN:** xem nội dung công khai; (READER dùng chung không gian `/dashboard/author` ở mức xem).
- **CANNOT:** nộp bài chính thức (quyền submit từ AUTHOR trở lên — kiểm `can.submit`); mọi chức năng biên tập/admin.
- **Ca kiểm thử:** đăng nhập → không truy cập được khu biên tập/admin; xem được trang công khai `/`.

---

## 4. Kịch bản xuyên vai trò (pipeline đầu–cuối)

Chạy tuần tự, mỗi bước đăng nhập bằng tài khoản tương ứng:

1. **AUTHOR** (`tacgia@`) — nộp bài mới → trạng thái `NEW`.
2. **MANAGING_EDITOR** (`bientapchinh@`) — phân công bài cho BTV chuyên mục.
3. **SECTION_EDITOR** (`bientap@`) — gán phản biện → `UNDER_REVIEW`.
4. **REVIEWER** (`phanbien@`) — nộp phiếu phản biện (khuyến nghị ACCEPT/MINOR).
5. **SECTION_EDITOR / MANAGING_EDITOR** — ra quyết định **ACCEPT** → `ACCEPTED`.
6. **LAYOUT_EDITOR** (`dangtrang@`) — dàn trang → `IN_PRODUCTION`.
7. **EIC** (`tongbientap@`) — **ký xuất bản** → `PUBLISHED` → bài hiện công khai.
8. **DEPUTY_EIC** (`photongbientap@`) — kiểm tra: thấy bài suốt pipeline nhưng **không** ký xuất bản được (bước 7 chỉ EIC).
9. **COMMANDER** (`chihuy@`) — mở báo cáo điều hành thấy số liệu cập nhật.

✅ **Đạt** khi mỗi bước chuyển trạng thái đúng và ranh giới publish = EIC-only được giữ.

## 5. Ghi chú vận hành

- Panel demo trên `/auth/login` hiển thị mật khẩu — phù hợp môi trường **LAN/air-gapped**. Nếu triển khai ra Internet công khai, nên ẩn panel sau cờ env (ví dụ `NODE_ENV==='production'` hoặc `ENABLE_DEMO_LOGIN`).
- Script `npm run verify:roles` chỉ kiểm tầng đăng nhập + quyền-route (smoke). Kiểm hành vi UI/workflow theo checklist mục 3–4 (thủ công hoặc bổ sung E2E sau).
- Tài khoản demo idempotent: chạy lại `npm run seed:demo-accounts` an toàn, không ghi đè tên măng-sét Ban biên tập.

---

## 6. Kết quả thực thi (2026-06-27)

### 6.1. Cách chạy bộ kiểm thử

| Lệnh | Tầng kiểm | Kết quả |
|---|---|---|
| `npm run verify:roles` | Đăng nhập DB (11 vai trò) | 11/11 PASS |
| `npm test` | Unit/route-handler (Jest) | 30 suite · 515 test PASS |
| `npm run smoke:roles` | **App thật (HTTP)** — RBAC + guard + bảo mật + vòng đời | 16/16 PASS |

`smoke:roles` (`scripts/smoke/role-flow-smoke.ts`) cần app đang chạy ở `SMOKE_BASE_URL` (mặc định `http://localhost:3001`). Kiểm 5 nhóm trên server thật:
1. Đăng nhập 11 vai trò qua `/api/auth/login` (đặt `X-Forwarded-For` riêng để né rate-limit login localhost).
2. Ma trận RBAC tầng API (nộp bài / phân công / gán phản biện / xuất bản) khớp SSOT `lib/rbac.ts` + `lib/api-guards.ts`.
3. Middleware chặn dashboard chéo vai trò (redirect `?error=access_denied`).
4. Bảo mật danh sách: READER không liệt kê bài chưa xuất bản; AUTHOR/READER không liệt kê phản biện.
5. Vòng đời 1 bản thảo qua HTTP thật: `NEW → UNDER_REVIEW → REVISION →` (guard chặn ACCEPT-từ-REVISION = 409) `→ ACCEPTED`. Fixture prefix `SMOKE-NTQS-`, tự dọn ở `finally`.

### 6.2. Lỗi nghiêm trọng đã phát hiện & sửa

1. **Rò danh sách bài nộp (`GET /api/submissions`).** Trước đây chỉ AUTHOR bị giới hạn `createdBy`; mọi vai trò khác (kể cả READER) nhận TOÀN BỘ bài nộp kèm danh tính tác giả → lộ bài chưa xuất bản + phá phản biện kín. Smoke ban đầu báo READER thấy **33/45 bài chưa xuất bản kèm PII**.
   → Vá: phân phạm vi theo vai trò (AUTHOR=của mình; REVIEWER=được phân công; SECTION_EDITOR=được giao biên tập; LAYOUT_EDITOR=ACCEPTED/IN_PRODUCTION/PUBLISHED; MANAGING/DEPUTY/EIC/SYSADMIN=toàn bộ; READER/COMMANDER/SECURITY_AUDITOR=rỗng). Regression: `tests/unit/submission-list-scope-route.test.ts`.
2. **Rò danh sách phản biện (`GET /api/reviews`).** Tương tự: AUTHOR/READER... nhận mọi review (nhận xét + danh tính phản biện).
   → Vá: `NO_REVIEW_LIST_ROLES` trả rỗng; REVIEWER chỉ thấy review của mình. Regression: `tests/unit/reviews-list-scope-route.test.ts`.
3. **Branding leak trong test guard.** `lib/demo-accounts.ts` chứa chuỗi cấm trong comment → `branding-guard` đỏ. Đã sửa lời comment.
4. **Dọn code chết.** Gỡ `tests/e2e/submission-workflow.test.ts` (Playwright không cài, sai cổng/tài khoản — không chạy được); luồng vòng đời nay được phủ bằng route-test + smoke.

### 6.3. Nâng cấp UI/UX (trong dashboard)

- Dashboard admin: bỏ gradient amber/blue/purple, áp `.theme-leadership` (NTQS) + `BrandStatCard` — nhất quán với khu lãnh đạo. (`app/dashboard/admin/layout.tsx`, `page.tsx`)
- `EmptyState` dùng chung (`components/ui/empty-state.tsx`), rút từ bản inline trong `workflow-deadline-tabs`.
- Bổ sung `loading.tsx` (skeleton dùng chung `dashboard-loading-skeleton.tsx`) cho 7 dashboard còn thiếu: managing, deputy, eic, layout, admin, security, commander.

### 6.4. Quyết định branding còn treo (cần ý kiến chủ quản)

- **Màu chrome trang public** (header + footer) đang dùng tông **đỏ đô (#8B1A1A/#6B1313) + vàng #C8960C** — header/footer đồng bộ với nhau nhưng **khác** palette NTQS bắt buộc trong CLAUDE.md (xanh quân sự #1E3924 + vàng #E5C86E). Lần này **giữ nguyên** (theo yêu cầu "không đụng lớn trang public"). Cần quyết: giữ đỏ đô hay đổi sang xanh NTQS toàn trang public.

### 6.5. Bổ sung & tồn đọng (đợt 2026-06-27, vòng 2)

**Đã làm thêm trong vòng này:**

- Hoàn tất phần code cho mục 6.2#2: **thực sự vá `GET /api/reviews`** (`app/api/reviews/route.ts`) — trước đó báo cáo mô tả nhưng code chưa đổi; smoke đã xác nhận còn rò (AUTHOR/READER thấy 8 review) → sau vá + rebuild = rỗng.
- Test bổ sung: `revision-resubmit-service.test.ts` (ownership, versionNo server-side, REVISION→UNDER_REVIEW), `review-respond-route.test.ts` (nhận/từ chối lời mời, khóa sau khi nộp), `submission-create-route.test.ts`.
- **Smoke nâng cấp**: thêm kiểm tra rò `GET /api/reviews` + **vòng đời đi thật qua HTTP** (Prisma seed fixture `SMOKE-NTQS-`, dọn ở `finally`). Tổng smoke: **16/16 PASS** sau rebuild pm2.
- Sửa branding sót trong **comment `prisma/schema.prisma`** (`HCQS-…`, "Lịch sử Hậu cần") — branding-guard không quét schema nên trước đó lọt.

**Tồn đọng (chưa làm — đề xuất):**

- `prisma/seed-news-batch2.ts` còn URL ảnh `hocvienhaucan.edu.vn` (ảnh thật host ngoài). Đổi sẽ vỡ ảnh seed → cần thay bằng ảnh NTQS trước.
- Có thể siết scope mịn hơn cho **SECTION_EDITOR ở `/api/reviews`** (chỉ bài được phân công) nếu nghiệp vụ yêu cầu.
- **Quy trình deploy**: sửa route/UI phải `npm run build` + `pm2 reload tapchi-ntqs` thì app production ở `:3001` mới phản ánh (smoke chạy vào app đã build, không phải source).
