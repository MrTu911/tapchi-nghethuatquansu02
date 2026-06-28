const B = require("./branding");
const { p, t, b, h1, h2, h3, bullet, bullets, spacer, pageBreak, table, AlignmentType } = B;
const OUT = "/home/kelinton/tapchi-nghethuatquansu02/nextjs_space/docs/nghiem-thu/07_Huong-dan-cai-dat-trien-khai.docx";

const code = (line) => new B.Paragraph({
  shading: { fill: "F2F3F1", type: B.ShadingType.CLEAR },
  spacing: { after: 40, line: 264 },
  indent: { left: 200 },
  children: [new B.TextRun({ text: line, font: "Consolas", size: 22 })],
});

const body = [
  h1("1. Yêu cầu hệ thống"),
  table(["Hạng mục", "Yêu cầu tối thiểu"], [
    ["Hệ điều hành máy chủ", "Linux (Ubuntu server khuyến nghị)"],
    ["Node.js", "Phiên bản 20.x"],
    ["Cơ sở dữ liệu", "PostgreSQL (bản ổn định)"],
    ["Bộ nhớ / CPU", "Khuyến nghị tối thiểu 4 GB RAM, 2 vCPU (tùy quy mô)"],
    ["Dung lượng", "Đủ cho mã nguồn, CSDL và kho tệp/PDF/EPUB"],
    ["Mạng", "Hỗ trợ vận hành mạng nội bộ/cô lập (không bắt buộc Internet)"],
  ], [3000, 6354], { aligns: [AlignmentType.LEFT, AlignmentType.LEFT] }),
  spacer(80),
  p("Hệ thống được thiết kế chạy được hoàn toàn trong mạng cô lập; các dịch vụ phụ thuộc Internet là tùy chọn và mặc định tắt."),

  h1("2. Cài đặt trực tuyến"),
  p("Sử dụng script cài đặt tổng hợp. Tại thư mục nextjs_space, chạy:"),
  code("bash setup.sh"),
  p("Script sẽ hỏi thông tin kết nối PostgreSQL, URL/cổng ứng dụng, môi trường (dev/prod), dịch vụ ngoài (SMTP, Redis, S3) và mức seed dữ liệu; tự sinh các bí mật cần thiết. Một số tham số hỗ trợ:"),
  table(["Tham số", "Ý nghĩa"], [
    ["--with-build", "Chạy bản dựng production sau khi cài"],
    ["--with-pm2", "Đăng ký chạy dịch vụ qua pm2"],
    ["--seed=full|minimal", "Mức seed dữ liệu: đầy đủ (demo) hoặc tối thiểu (production)"],
    ["--skip-seed", "Bỏ qua bước seed dữ liệu"],
    ["--offline", "Chế độ cài ngoại tuyến (mạng cô lập)"],
    ["--non-interactive", "Cài tự động theo biến môi trường, không hỏi"],
  ], [2700, 6654], { aligns: [AlignmentType.LEFT, AlignmentType.LEFT] }),

  h1("3. Cấu hình môi trường"),
  p("Cấu hình qua tệp .env (tham khảo .env.example). Có thể dùng công cụ tương tác:"),
  code("node scripts/setup/configure-env.mjs"),
  p("Các nhóm biến môi trường chính:"),
  table(["Nhóm", "Biến tiêu biểu", "Bắt buộc"], [
    ["Cơ sở dữ liệu", "DATABASE_URL (riêng, không dùng chung)", "Bắt buộc"],
    ["Xác thực & URL", "NEXTAUTH_URL, JWT_SECRET, JWT_REFRESH_SECRET", "Bắt buộc (tự sinh)"],
    ["Lưu trữ tệp", "Thư mục upload nội bộ hoặc cấu hình S3, MAX_VIDEO_UPLOAD_MB", "Bắt buộc"],
    ["Hệ thống", "NODE_ENV, PORT (3001)", "Bắt buộc"],
    ["Dịch vụ ngoài", "ORCID, Crossref, SMTP, Redis, VAPID", "Tùy chọn (mặc định tắt)"],
  ], [2400, 4954, 2000], { aligns: [AlignmentType.LEFT, AlignmentType.LEFT, AlignmentType.LEFT] }),
  spacer(80),
  p([b("Lưu ý bảo mật: "), t("không lưu cứng bí mật trong mã nguồn; không commit tệp .env; DATABASE_URL phải tách biệt, không dùng chung với hệ thống khác.")]),

  h1("4. Khởi tạo cơ sở dữ liệu và dữ liệu mẫu"),
  ...bullets([
    "Khởi tạo lược đồ: dùng cơ chế db push của Prisma (không dùng migrate dev trên môi trường thật).",
    "Seed dữ liệu nền và nhận diện NTQS: seed:site-settings, seed:public-pages, seed:navigation, seed:homepage.",
    "Seed nội dung và tài khoản: seed:content, seed:editorial-board, seed:demo-accounts (hoặc gói seed:all/seed-full).",
  ]),
  p("Có thể chạy nhanh qua npm: npm run setup:seed (mức full hoặc minimal)."),

  pageBreak(),
  h1("5. Cài đặt ngoại tuyến (mạng cô lập / air-gapped)"),
  h2("5.1. Đóng gói trên máy có mạng"),
  p("Tạo gói cài đặt mang theo (USB) gồm Node, PostgreSQL, bản dựng ứng dụng và thư viện:"),
  code("bash scripts/setup/build-usb-package.sh"),
  p("Gói đầu ra gồm tarball, manifest và mã kiểm tra toàn vẹn (SHA-256)."),
  h2("5.2. Triển khai trên máy chủ cô lập"),
  p("Chép gói sang máy chủ đích và chạy:"),
  code("bash scripts/setup/offline-install.sh --seed=minimal --with-pm2"),
  ...bullets([
    "Script cài Node và PostgreSQL từ gói, kiểm tra toàn vẹn, sao chép ứng dụng và gọi setup.sh ở chế độ --offline.",
    "Tham số --install-dir chỉ định thư mục cài; --skip-verify bỏ qua kiểm tra (không khuyến nghị).",
  ]),

  h1("6. Vận hành"),
  ...bullets([
    "Chạy bản dựng production: npm run build, sau đó npm start (mặc định cổng 3001).",
    "Khuyến nghị chạy dịch vụ qua pm2 và lưu cấu hình (pm2 save) để tự khởi động cùng máy chủ.",
    "Đồng bộ thời gian máy chủ (NTP nội bộ) để bảo đảm xác thực TOTP chính xác.",
  ]),

  h1("7. Sao lưu, cập nhật và xử lý sự cố"),
  ...bullets([
    "Sao lưu định kỳ cơ sở dữ liệu PostgreSQL và thư mục kho tệp (uploads).",
    "Cập nhật mã nguồn: dừng dịch vụ → cập nhật → npm ci → prisma generate → db push → build → khởi động lại.",
    "Xử lý sự cố: kiểm tra log ứng dụng/pm2; xác minh DATABASE_URL và biến môi trường; kiểm tra cổng 3001.",
  ]),
  p("Chi tiết bổ sung tham khảo các tài liệu INSTALL.md, INSTALL-OFFLINE.md và DEPLOYMENT_GUIDE.md trong mã nguồn."),
];

B.buildDoc({
  title: "Hướng dẫn cài đặt và triển khai", subtitle: "Cài đặt trực tuyến và ngoại tuyến (air-gapped)",
  code: "NTQS-NT-07", version: "1.0", classification: "Lưu hành nội bộ",
  headerTitle: "Hướng dẫn cài đặt và triển khai", body, outFile: OUT,
}).then((f) => console.log("OK", f)).catch((e) => { console.error("ERR 07", e); process.exit(1); });
