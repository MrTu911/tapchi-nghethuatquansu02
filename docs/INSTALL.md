# Hướng dẫn cài đặt — Tạp chí Nghệ thuật Quân sự Việt Nam (NTQS)

Tài liệu này hướng dẫn cài đặt hệ thống trên **máy có kết nối mạng** (môi trường
phát triển hoặc máy chủ thường). Nếu cài cho **máy chủ mạng quân sự không có
internet (air-gapped) bằng USB**, xem [INSTALL-OFFLINE.md](./INSTALL-OFFLINE.md).

Toàn bộ quá trình được tự động hoá bằng `setup.sh`. Bạn chỉ cần trả lời vài câu
hỏi cấu hình; mọi việc còn lại (sinh secret, cài deps, tạo DB, đồng bộ schema,
seed dữ liệu) script tự làm.

---

## 1. Yêu cầu hệ thống

| Thành phần | Phiên bản | Bắt buộc |
|---|---|---|
| Node.js | ≥ 18 (khuyến nghị 20 LTS) | ✅ |
| npm | đi kèm Node | ✅ |
| PostgreSQL | ≥ 14 | ✅ |
| `psql` (postgresql-client) | — | ✅ (để tự tạo DB + vá SQL) |
| Redis / SMTP / S3 | — | ❌ (tùy chọn, mặc định tắt — app vẫn chạy) |

> DB phải **tách riêng** với tapchi-hcqs (gợi ý tên: `tapchi_ntqs`). App chạy
> cổng **3001** để không đụng tapchi-hcqs (3000).

---

## 2. Cài nhanh (một lệnh)

```bash
cd nextjs_space
bash setup.sh
```

Script sẽ lần lượt:

1. **Hỏi cấu hình** (xem mục 4) → ghi `.env` (secret tự sinh).
2. `npm ci` cài dependencies.
3. `prisma generate`.
4. **Tự tạo** database + user (nếu bạn chọn) + bật extension `pg_trgm`, `unaccent`.
5. `prisma db push` đồng bộ schema + áp dụng các vá SQL idempotent
   (`prisma/manual/*.sql`, `prisma/fts_setup.sql`, …).
6. Tạo cây thư mục `public/uploads/`.
7. **Hỏi mức seed** (`full` hoặc `minimal`) rồi seed dữ liệu.

Sau khi xong:

```bash
npm run dev      # mở http://localhost:3001
```

---

## 3. Cài cho production (build + tự khởi động)

```bash
cd nextjs_space
bash setup.sh --with-build --with-pm2
```

- `--with-build` → `npm run build`.
- `--with-pm2` → khởi động qua pm2 (app `tapchi-ntqs`), `pm2 save`, và kiểm tra
  `/api/health`. Để app tự chạy khi khởi động máy: chạy `pm2 startup` (theo lệnh
  pm2 in ra) rồi `pm2 save`.

### Các cờ của `setup.sh`

| Cờ | Ý nghĩa |
|---|---|
| `--with-build` | Build production (`.next`). |
| `--with-pm2` | Khởi động bằng pm2 + health check. |
| `--skip-seed` | Không seed dữ liệu. |
| `--seed=full` / `--seed=minimal` | Chọn sẵn mức seed (không hỏi). |
| `--offline` | Chế độ air-gap (xem INSTALL-OFFLINE.md). |
| `--non-interactive` | Không hỏi; đọc cấu hình từ biến môi trường. |
| `--force` | Ghi đè `.env` đang có. |

---

## 4. Các câu hỏi cấu hình (script sẽ hỏi bạn nhập)

| Nhóm | Hỏi gì | Mặc định |
|---|---|---|
| PostgreSQL | host, port, tên DB, user DB, mật khẩu DB | localhost / 5432 / tapchi_ntqs / tapchi_ntqs / (tự sinh) |
| Quyền admin DB | có tự tạo DB+user không; user/mật khẩu admin (postgres) | có / postgres |
| URL ứng dụng | NEXTAUTH_URL, cổng, NODE_ENV | http://localhost:3001 / 3001 / development |
| Dịch vụ ngoài | bật SMTP? bật Redis? dùng S3? | đều **tắt** (lưu local, rate-limit in-memory) |

**Secret tự sinh** (không cần nhập): `NEXTAUTH_SECRET`, `JWT_SECRET`,
`JWT_REFRESH_SECRET`, `ORCID_ENCRYPTION_KEY`, `CRON_SECRET`.

Cấu hình thủ công (nâng cao): copy `nextjs_space/.env.example` → `.env` và điền tay.

---

## 5. Mức seed dữ liệu

| Mức | Nội dung | Dùng khi |
|---|---|---|
| `full` | Nền + nhận diện + **toàn bộ demo** (11 tài khoản vai trò, bài mẫu, workflow đủ trạng thái, banner/media). | Máy thử nghiệm, demo, UAT. |
| `minimal` | Nền (9 chuyên mục + tài khoản chính thức + khung số) + nhận diện (site-settings, trang tĩnh, măng-sét, pháp lý). | Cài thật, không muốn dữ liệu rác. |

Chạy lại seed bất cứ lúc nào (idempotent):

```bash
npm run setup:seed -- --mode=full      # hoặc --mode=minimal
```

---

## 6. Tài khoản sau khi seed

Mật khẩu chung: **`TapChi@2025`** (tác giả demo luồng: `Tacgia@2026`).

| Vai trò | Email |
|---|---|
| Quản trị hệ thống (SYSADMIN) | admin@tapchintqsvn.edu.vn |
| Tổng biên tập (EIC) | tongbientap@tapchintqsvn.edu.vn |
| Thư ký tòa soạn (MANAGING_EDITOR) | bientapchinh@tapchintqsvn.edu.vn |
| Biên tập chuyên mục (SECTION_EDITOR) | bientap@tapchintqsvn.edu.vn |
| Tác giả (AUTHOR) | tacgia@tapchintqsvn.edu.vn |
| Phản biện (REVIEWER) | phanbien@tapchintqsvn.edu.vn |
| Dàn trang (LAYOUT_EDITOR) | dangtrang@tapchintqsvn.edu.vn |

(Mức `full` còn thêm các vai trò khác: DEPUTY_EIC, SECURITY_AUDITOR, COMMANDER, READER…)

---

## 7. Khắc phục sự cố

- **Lỗi kết nối DB** (`P1001`): kiểm `DATABASE_URL` trong `.env`, PostgreSQL đang
  chạy, và user/mật khẩu đúng. Nếu để installer tự tạo DB, cần `psql` + quyền admin.
- **`psql` không có**: cài `sudo apt install postgresql-client`. Thiếu psql thì
  bước vá SQL bị bỏ qua (FTS/đạo văn/podcast có thể thiếu cột).
- **Trùng cổng 3001**: nếu chạy song song nhiều bản, đổi `PORT` trong `.env` và
  `NEXTAUTH_URL` cho khớp.
- **Schema drift**: bộ cài dùng `prisma db push` nên DB luôn khớp `schema.prisma`
  hiện tại; chạy lại `bash setup.sh` (chọn không ghi đè `.env`) để đồng bộ lại.
- **Đổi DB**: sửa `DATABASE_URL` rồi chạy lại `bash setup.sh --force`.

---

## 8. Lưu ý nhận diện (branding)

Theo `.claude/rules/journal-identity.md`:
- DB **không dùng chung** với tapchi-hcqs.
- Redis (nếu bật) dùng namespace riêng `ntqs:*`.
- `NEXTAUTH_URL` trỏ đúng domain/IP của NTQS.
