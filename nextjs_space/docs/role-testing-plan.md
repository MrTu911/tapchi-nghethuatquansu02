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
