const B = require("./branding");
const R = require("./requirements");
const { p, t, b, h1, h2, h3, bullet, bullets, spacer, pageBreak, table, AlignmentType } = B;
const OUT = "/home/kelinton/tapchi-nghethuatquansu02/nextjs_space/docs/nghiem-thu/02_Dac-ta-yeu-cau-phan-mem-SRS.docx";

// Bảng FR theo từng phân hệ
const frSections = [];
R.MODULES.forEach((m) => {
  const frs = R.FRS.filter((f) => f.m === m.id);
  if (!frs.length) return;
  frSections.push(h3(`${m.id}. ${m.name}`));
  frSections.push(table(["Mã", "Tên yêu cầu", "Mô tả", "Mức"],
    frs.map((f) => [f.id, f.name, f.desc, f.p]),
    [1450, 1900, 5104, 900],
    { aligns: [AlignmentType.LEFT, AlignmentType.LEFT, AlignmentType.LEFT, AlignmentType.CENTER] }));
  frSections.push(spacer(80));
});

const nfrRows = R.NFRS.map((n) => [n.id, n.cat, n.name, n.desc]);

const body = [
  h1("1. Giới thiệu"),
  h2("1.1. Mục đích tài liệu"),
  p("Tài liệu Đặc tả yêu cầu phần mềm (SRS) mô tả đầy đủ các yêu cầu chức năng và phi chức năng của phần mềm “Tạp chí điện tử Nghệ thuật Quân sự Việt Nam”, làm cơ sở thống nhất giữa các bên về phạm vi sản phẩm, phục vụ thiết kế, kiểm thử và nghiệm thu."),
  h2("1.2. Phạm vi sản phẩm"),
  p("Phần mềm cung cấp: (1) hệ quản trị nội bộ phục vụ toàn trình xuất bản tạp chí khoa học (nộp bài – phản biện – biên tập – dàn trang – xuất bản); (2) cổng đọc công khai và kho lưu trữ số; (3) các công cụ hỗ trợ: phát hiện đạo văn, thống kê – báo cáo, quản trị nội dung và quản trị – kiểm toán hệ thống."),
  h2("1.3. Thuật ngữ và từ viết tắt"),
  table(["Thuật ngữ", "Giải thích"], [
    ["RBAC", "Kiểm soát truy cập theo vai trò (Role-Based Access Control)"],
    ["2FA", "Xác thực hai lớp (Two-Factor Authentication)"],
    ["SRS", "Đặc tả yêu cầu phần mềm (Software Requirements Specification)"],
    ["FR / NFR", "Yêu cầu chức năng / Yêu cầu phi chức năng"],
    ["Air-gapped", "Mạng cô lập, không kết nối Internet"],
    ["EPUB", "Định dạng sách điện tử mở dùng cho thư viện đọc số"],
  ], [2300, 7054], { aligns: [AlignmentType.LEFT, AlignmentType.LEFT] }),
  h2("1.4. Tài liệu tham chiếu"),
  ...bullets([
    "NTQS-NT-03 — Tài liệu thiết kế hệ thống.",
    "NTQS-NT-04 — Phương án bảo đảm an toàn thông tin.",
    "NTQS-NT-05 — Ma trận truy vết yêu cầu.",
    "NTQS-NT-06 — Kế hoạch và kết quả kiểm thử.",
  ]),

  h1("2. Mô tả tổng thể"),
  h2("2.1. Bối cảnh sản phẩm"),
  p("Sản phẩm là ứng dụng web độc lập của Tạp chí Nghệ thuật Quân sự Việt Nam, có cơ sở dữ liệu riêng (PostgreSQL), được thiết kế vận hành trong môi trường mạng nội bộ/cô lập. Hệ thống kế thừa kiến trúc nền tảng quản trị tạp chí khoa học và được cá biệt hóa theo nhận diện và nghiệp vụ của Học viện Quốc phòng."),
  h2("2.2. Lớp người dùng và vai trò"),
  table(["Vai trò", "Mô tả nghiệp vụ"], [
    ["READER — Độc giả", "Đọc bài, tra cứu số/chuyên mục công khai"],
    ["AUTHOR — Tác giả", "Gửi và theo dõi bản thảo, phản hồi chỉnh sửa"],
    ["REVIEWER — Phản biện viên", "Nhận/từ chối, nộp phiếu phản biện"],
    ["SECTION_EDITOR — BTV chuyên mục", "Sàng lọc, phân công phản biện theo chuyên mục"],
    ["MANAGING_EDITOR — Thư ký tòa soạn", "Điều phối quy trình, phân công biên tập"],
    ["DEPUTY_EIC — Phó Tổng biên tập", "Giám sát biên tập, hỗ trợ quyết định"],
    ["EIC — Tổng biên tập", "Quyết định cuối cùng, phê duyệt xuất bản"],
    ["LAYOUT_EDITOR — BTV dàn trang", "Dàn trang, chuẩn bị bản xuất bản"],
    ["SYSADMIN — Quản trị hệ thống", "Quản trị người dùng, cấu hình, vận hành"],
    ["SECURITY_AUDITOR — Kiểm định bảo mật", "Giám sát nhật ký, cảnh báo an ninh"],
    ["COMMANDER — Chỉ huy Học viện", "Xem báo cáo tổng hợp, chỉ số quản lý"],
  ], [3300, 6054], { aligns: [AlignmentType.LEFT, AlignmentType.LEFT] }),
  h2("2.3. Môi trường vận hành"),
  ...bullets([
    "Máy chủ ứng dụng Node.js 20, cơ sở dữ liệu PostgreSQL; chạy dịch vụ qua pm2.",
    "Trình duyệt người dùng hiện đại; giao diện đáp ứng đa thiết bị.",
    "Lưu trữ tệp nội bộ (mặc định) hoặc MinIO/S3; Redis tùy chọn cho rate limit/cache.",
  ]),
  h2("2.4. Ràng buộc thiết kế"),
  ...bullets([
    "Bảo đảm vận hành trong mạng cô lập: không phụ thuộc CDN/dịch vụ ngoài để chạy lõi.",
    "Toàn bộ nhận diện, dữ liệu mẫu, cấu hình theo đúng Tạp chí NTQS – Học viện Quốc phòng.",
    "Cơ sở dữ liệu tách biệt hoàn toàn, không dùng chung với hệ thống khác.",
  ]),
  h2("2.5. Giả định và phụ thuộc"),
  ...bullets([
    "Các tính năng tích hợp Internet (ORCID, Crossref, email SMTP) chỉ hoạt động khi môi trường cho phép và được cấu hình.",
    "Đồng bộ thời gian máy chủ (NTP nội bộ) cần thiết để TOTP hoạt động chính xác.",
  ]),

  h1("3. Yêu cầu chức năng"),
  p([t("Tổng số yêu cầu chức năng: ", {}), b(String(R.METRICS.frTotal)),
    t(` (trong đó ${R.METRICS.frRequired} bắt buộc — ký hiệu “BB”; còn lại nên có — “NC”). Yêu cầu được phân nhóm theo 16 phân hệ:`)]),
  ...frSections,

  h1("4. Yêu cầu phi chức năng"),
  table(["Mã", "Nhóm", "Tên", "Mô tả"], nfrRows, [1100, 1500, 2300, 4454],
    { aligns: [AlignmentType.LEFT, AlignmentType.LEFT, AlignmentType.LEFT, AlignmentType.LEFT] }),
  spacer(120),

  h1("5. Yêu cầu giao diện ngoài"),
  h2("5.1. Giao diện tích hợp"),
  ...bullets([
    "ORCID: xác thực OAuth 2.0, đồng bộ hồ sơ tác giả (tùy chọn).",
    "Crossref: tra cứu DOI và metadata bài báo (tùy chọn).",
    "Email/SMTP: gửi thông báo quy trình (tùy chọn).",
    "Lưu trữ tệp: hệ thống tệp nội bộ hoặc MinIO/S3.",
    "Redis: giới hạn tần suất và bộ nhớ đệm (có phương án thay thế trong bộ nhớ).",
  ]),
  h2("5.2. Giao diện người dùng"),
  ...bullets([
    "Giao diện tiếng Việt, áp dụng bộ nhận diện NTQS (màu xanh quân sự, vàng đồng).",
    "Mỗi vai trò có bảng điều khiển riêng; nút hành động hiển thị theo quyền.",
  ]),
];

B.buildDoc({
  title: "Đặc tả yêu cầu phần mềm", subtitle: "Software Requirements Specification (SRS)",
  code: "NTQS-NT-02", version: "1.0", classification: "Lưu hành nội bộ",
  headerTitle: "Đặc tả yêu cầu phần mềm (SRS)", body, outFile: OUT,
}).then((f) => console.log("OK", f)).catch((e) => { console.error("ERR 02", e); process.exit(1); });
