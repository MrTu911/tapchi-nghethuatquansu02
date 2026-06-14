# Checklist kiểm thử — Khu vực Lãnh đạo Biên tập (NTQS)

Phạm vi: 3 vai trò lãnh đạo và ranh giới quyền giữa chúng.

| Chức danh | Role | Dashboard | Tài khoản demo |
|---|---|---|---|
| Biên tập viên chính / Thư ký tòa soạn | `MANAGING_EDITOR` | `/dashboard/managing` | bientapchinh@tapchintqsvn.edu.vn |
| Phó Tổng biên tập | `DEPUTY_EIC` | `/dashboard/deputy` | photongbientap@tapchintqsvn.edu.vn |
| Tổng biên tập | `EIC` | `/dashboard/eic` | tongbientap@tapchintqsvn.edu.vn |

Mật khẩu chung (demo): `TapChi@2025`. (Bộ `@test.com`: `Managing123!@#`, `Deputy123!@#`, `Eic123!@#`.)

---

## A. Định tuyến & giao diện

- [ ] Đăng nhập `DEPUTY_EIC` → tự chuyển vào `/dashboard/deputy` (middleware + login redirect).
- [ ] Đăng nhập `MANAGING_EDITOR` → `/dashboard/managing`; `EIC` → `/dashboard/eic`.
- [ ] Cả 3 dashboard hiển thị brand NTQS (xanh quân sự #1E3924 + vàng đồng #E5C86E) qua `.theme-leadership` — header gradient xanh→vàng đồng.
- [ ] Badge vai trò ở header hiển thị đúng: "Phó Tổng biên tập" / "Thư ký tòa soạn" / "Tổng biên tập" (không còn raw `DEPUTY_EIC`, không còn "Tổng Chủ biên").
- [ ] Loading/empty state rõ ở các hàng chờ (không màn trắng).

## B. Phân quyền điều hành (DEPUTY_EIC ngang EIC, trừ publish)

- [ ] `DEPUTY_EIC` thấy TOÀN BỘ bài nộp (không bị giới hạn theo phân công như SECTION_EDITOR).
- [ ] `DEPUTY_EIC` phân công biên tập viên (`/api/managing-editor/assign`) → OK.
- [ ] `DEPUTY_EIC` gán phản biện (`/api/submissions/[id]/assign-reviewers`) → OK.
- [ ] `DEPUTY_EIC` ra quyết định biên tập accept/revise/reject (`/api/submissions/[id]/decision`) → OK.
- [ ] `DEPUTY_EIC` đẩy bài ACCEPTED → IN_PRODUCTION (`start_production`) → OK.
- [ ] `DEPUTY_EIC` thấy menu quản trị nội dung/CMS (can.admin = true).

## C. Ranh giới PUBLISH (then chốt nghiệp vụ)

- [ ] Dashboard `DEPUTY_EIC`: mục "Trình Tổng biên tập" CHỈ có nút "Theo dõi", KHÔNG có nút Xuất bản.
- [ ] Gọi `POST /api/production/publish` với phiên `DEPUTY_EIC` → **403** ("only EIC or SYSADMIN can publish").
- [ ] Gọi `POST /api/workflow` action `publish` với `DEPUTY_EIC` → bị từ chối (chỉ `EIC`/`SYSADMIN`).
- [ ] Dashboard `EIC`: mục "Chờ ký xuất bản" có nút "Xuất bản" → publish thành công; trạng thái → PUBLISHED; có audit log `ARTICLE_PUBLISHED`.
- [ ] `MANAGING_EDITOR` cũng KHÔNG publish được (regression).

## D. Bảo mật & escalation

- [ ] Bài SECRET/TOP_SECRET: quy tắc 2 người vẫn yêu cầu chữ ký **EIC + SECURITY_AUDITOR**; ACCEPT của `DEPUTY_EIC` không tự hoàn tất two-person rule (chờ EIC thật) — KHÔNG lỗi, hiển thị thông báo chờ.
- [ ] `MANAGING_EDITOR` / `DEPUTY_EIC` KHÔNG thể gán/duyệt người dùng lên vai trò `DEPUTY_EIC` hay `EIC` (chỉ `SYSADMIN`) — `/api/admin/users/approve` chặn escalation.
- [ ] Admin (SYSADMIN) có thể gán role `DEPUTY_EIC` trong trang Người dùng (SelectItem "Phó Tổng biên tập" xuất hiện).

## E. Regression chung

- [ ] `SECTION_EDITOR` vẫn chỉ thấy bài được phân công.
- [ ] Chat: Tác giả/Phản biện chat được với Phó TBT; vẫn giữ blind review (Tác giả ✗ Phản biện).
- [ ] Trang quản lý phân quyền (`/dashboard/admin/permissions`) liệt kê vai trò "Phó Tổng biên tập" (level 6).
- [ ] `npx tsc --noEmit` sạch; `npx jest` xanh; `npm run build` thành công.

---

## Tự động (đã có)
- `tests/unit/rbac.test.ts` — quyền DEPUTY_EIC (decide/assignReview/layout/admin = true, publish = false), hierarchy.
- `tests/unit/role-labels.test.ts` — SSOT nhãn vai trò.
- `tests/unit/workflow-route.test.ts`, `decision-route.test.ts`, `editor-scope.test.ts` — không regression.
- `tests/unit/branding-guard.test.ts` — không rò "Học viện Hậu cần/HVHC".
