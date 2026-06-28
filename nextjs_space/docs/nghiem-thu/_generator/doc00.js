const path = require("path");
const B = require("./branding");
const { p, t, b, h1, h2, bullet, bullets, spacer, pageBreak, table, centered,
  signatureBlock, nationalMasthead, AlignmentType } = B;
const OUT = "/home/kelinton/tapchi-nghethuatquansu02/nextjs_space/docs/nghiem-thu/00_Danh-muc-ho-so-nghiem-thu.docx";

// Danh mục tài liệu trong bộ hồ sơ
const W = B.CONTENT_W;
const dmW = [900, 1900, 4254, 1100, 1200]; // STT, Mã hiệu, Tên tài liệu, Loại, Ghi chú
const docList = [
  ["1", "NTQS-NT-00", "Danh mục hồ sơ nghiệm thu và Tờ trình đề nghị nghiệm thu", ".docx", "Tài liệu này"],
  ["2", "NTQS-NT-01", "Báo cáo tổng kết kết quả thực hiện dự án", ".docx", "Trình bày"],
  ["3", "NTQS-NT-02", "Đặc tả yêu cầu phần mềm (SRS)", ".docx", "Kỹ thuật"],
  ["4", "NTQS-NT-03", "Tài liệu thiết kế hệ thống (kiến trúc, CSDL, API, tích hợp)", ".docx", "Kỹ thuật"],
  ["5", "NTQS-NT-04", "Phương án bảo đảm an toàn thông tin (ATTT)", ".docx", "Kỹ thuật"],
  ["6", "NTQS-NT-05", "Ma trận truy vết yêu cầu (RTM)", ".docx", "Kỹ thuật"],
  ["7", "NTQS-NT-06", "Kế hoạch và kết quả kiểm thử phần mềm", ".docx", "Kiểm thử"],
  ["8", "NTQS-NT-07", "Hướng dẫn cài đặt và triển khai hệ thống", ".docx", "Vận hành"],
  ["9", "NTQS-NT-08", "Hướng dẫn quản trị và sử dụng theo vai trò", ".docx", "Vận hành"],
  ["10", "NTQS-NT-09", "Bộ biểu mẫu pháp lý — quản lý nghiệm thu (biểu mẫu)", ".docx", "Có chỗ điền"],
];

// Sản phẩm phần mềm bàn giao
const spW = [900, 3200, 5254]; // STT, Hạng mục, Mô tả
const products = [
  ["1", "Mã nguồn phần mềm", "Toàn bộ mã nguồn Next.js 14 + TypeScript (thư mục nextjs_space), quản lý bằng Git, kèm lịch sử commit."],
  ["2", "Lược đồ cơ sở dữ liệu", "Prisma schema (67 model) + script tạo lập/seed dữ liệu (prisma/, scripts/)."],
  ["3", "Gói cài đặt", "Bộ cài trực tuyến (setup.sh) và gói cài ngoại tuyến cho mạng cô lập (build-usb-package.sh, offline-install.sh)."],
  ["4", "Cấu hình môi trường", "Tệp .env.example và công cụ sinh cấu hình tương tác (configure-env.mjs)."],
  ["5", "Dữ liệu khởi tạo", "Bộ seed danh mục, cấu hình tòa soạn, trang công khai, tài khoản mẫu 11 vai trò."],
  ["6", "Bộ kiểm thử", "30 bộ unit test (Jest) + kịch bản kiểm thử vai trò (verify:roles, smoke:roles)."],
  ["7", "Tài liệu hệ thống", "Bộ hồ sơ nghiệm thu (10 tài liệu) và tài liệu hướng dẫn theo vai trò."],
];

const body = [
  // ---- Tờ trình ----
  nationalMasthead(["HỌC VIỆN QUỐC PHÒNG", "TẠP CHÍ NTQS VIỆT NAM"], { docNo: "      /TTr-NTQS" }),
  spacer(160),
  centered("TỜ TRÌNH", { bold: true, size: 30, color: B.GREEN }, 20),
  centered("Về việc đề nghị nghiệm thu dự án phần mềm", { bold: true, size: 26 }, 20),
  centered("“Tạp chí điện tử Nghệ thuật Quân sự Việt Nam”", { italics: true, size: 26 }, 200),
  p([t("Kính gửi: ", { bold: true }), t("Hội đồng nghiệm thu Học viện Quốc phòng.")]),
  p([t("Căn cứ Quyết định số ……/QĐ-… ngày ….. tháng ….. năm ….. của ………………… về việc giao nhiệm vụ xây dựng phần mềm “Tạp chí điện tử Nghệ thuật Quân sự Việt Nam”;")]),
  p([t("Căn cứ kết quả triển khai, kiểm thử và vận hành thử nghiệm hệ thống;")]),
  p("Tòa soạn Tạp chí Nghệ thuật Quân sự Việt Nam kính trình Hội đồng nghiệm thu xem xét, tổ chức nghiệm thu dự án phần mềm với các nội dung chính như sau:"),
  bullet([t("Tên sản phẩm: ", { bold: true }), t("Phần mềm Tạp chí điện tử Nghệ thuật Quân sự Việt Nam (Cổng thông tin và Hệ quản trị xuất bản tạp chí khoa học).")]),
  bullet([t("Đơn vị chủ quản: ", { bold: true }), t("Học viện Quốc phòng; Chủ đầu tư/quản lý: Tòa soạn Tạp chí Nghệ thuật Quân sự Việt Nam.")]),
  bullet([t("Phạm vi: ", { bold: true }), t("Quản lý toàn trình xuất bản tạp chí khoa học (nộp bài – phản biện – biên tập – dàn trang – xuất bản), cổng đọc công khai, kho lưu trữ số và quản trị hệ thống.")]),
  bullet([t("Hồ sơ kèm theo: ", { bold: true }), t("10 tài liệu nghiệm thu (chi tiết tại Mục II) cùng toàn bộ sản phẩm phần mềm bàn giao (Mục III).")]),
  p("Kính đề nghị Hội đồng nghiệm thu xem xét, đánh giá và tổ chức nghiệm thu theo quy định./."),
  spacer(160),
  ...signatureBlock([
    { role: "NƠI NHẬN", subRole: "(như trên)", title: " ", name: " " },
    { role: "TỔNG BIÊN TẬP", subRole: "(Ký, ghi rõ họ tên, đóng dấu)", stamp: true, title: "Đại tá, TS", name: "Lê Ngọc Bảo" },
  ], null),
  pageBreak(),

  // ---- I. Giới thiệu hồ sơ ----
  h1("I. Giới thiệu bộ hồ sơ nghiệm thu"),
  p("Bộ hồ sơ nghiệm thu này tập hợp đầy đủ các tài liệu phục vụ công tác nghiệm thu dự án phần mềm “Tạp chí điện tử Nghệ thuật Quân sự Việt Nam” của Học viện Quốc phòng. Hồ sơ được biên soạn bám sát hiện trạng triển khai thực tế của hệ thống, bao gồm các nhóm: tài liệu pháp lý/quản lý, tài liệu kỹ thuật, tài liệu kiểm thử và tài liệu hướng dẫn vận hành."),
  p([t("Thông tin định danh sản phẩm: ", { bold: true }), t("Tạp chí Nghệ thuật Quân sự Việt Nam (Journal of Vietnamese Military Art), ISSN 1859-0454, cơ quan chủ quản Học viện Quốc phòng, địa chỉ 93 Hoàng Quốc Việt, Nghĩa Đô, Hà Nội.")]),
  h2("Mục đích sử dụng hồ sơ"),
  ...bullets([
    "Làm cơ sở để Hội đồng nghiệm thu đánh giá mức độ hoàn thành so với yêu cầu đặt ra.",
    "Làm tài liệu bàn giao, vận hành và bảo trì hệ thống sau nghiệm thu.",
    "Làm căn cứ truy vết yêu cầu – thiết kế – kiểm thử của phần mềm.",
  ]),

  // ---- II. Danh mục tài liệu ----
  h1("II. Danh mục tài liệu trong hồ sơ"),
  p("Bộ hồ sơ gồm 10 tài liệu, đánh mã hiệu thống nhất theo tiền tố NTQS-NT-xx:"),
  table(["STT", "Mã hiệu", "Tên tài liệu", "Định dạng", "Ghi chú"], docList, dmW,
    { aligns: [AlignmentType.CENTER, AlignmentType.CENTER, AlignmentType.LEFT, AlignmentType.CENTER, AlignmentType.CENTER] }),
  spacer(120),

  // ---- III. Sản phẩm phần mềm bàn giao ----
  h1("III. Danh mục sản phẩm phần mềm bàn giao"),
  p("Cùng với bộ tài liệu, các sản phẩm phần mềm và dữ liệu sau được bàn giao cho đơn vị tiếp nhận:"),
  table(["STT", "Hạng mục", "Mô tả"], products, spW,
    { aligns: [AlignmentType.CENTER, AlignmentType.LEFT, AlignmentType.LEFT] }),
  spacer(120),

  // ---- IV. Thông tin kỹ thuật tóm tắt ----
  h1("IV. Thông tin kỹ thuật tóm tắt"),
  table(["Thành phần", "Công nghệ / Thông số"], [
    ["Nền tảng ứng dụng", "Next.js 14, TypeScript, React 18"],
    ["Cơ sở dữ liệu", "PostgreSQL (ORM Prisma) — 67 model dữ liệu"],
    ["Xác thực & phân quyền", "JWT + NextAuth, xác thực 2 lớp (TOTP/Email OTP), RBAC 11 vai trò"],
    ["Giao diện", "Tailwind CSS, Radix UI / shadcn-ui, TanStack Query"],
    ["Lưu trữ tệp", "Lưu nội bộ (mặc định) hoặc MinIO/S3 (tùy chọn)"],
    ["Quy mô API", "≈ 264 route API theo các phân hệ nghiệp vụ"],
    ["Triển khai", "Hỗ trợ cài đặt trực tuyến và ngoại tuyến cho mạng cô lập (air-gapped)"],
  ], [3000, 6354], { aligns: [AlignmentType.LEFT, AlignmentType.LEFT] }),
  spacer(120),

  // ---- V. Hướng dẫn sử dụng hồ sơ ----
  h1("V. Hướng dẫn sử dụng bộ hồ sơ"),
  ...bullets([
    "Tài liệu NTQS-NT-01 (Báo cáo tổng kết) nên đọc trước để nắm tổng thể kết quả dự án.",
    "Các tài liệu kỹ thuật NTQS-NT-02 đến NTQS-NT-05 phục vụ thẩm định chuyên môn và truy vết yêu cầu.",
    "Tài liệu NTQS-NT-06 cung cấp bằng chứng kiểm thử; NTQS-NT-07 và NTQS-NT-08 phục vụ tiếp nhận, vận hành.",
    "Tài liệu NTQS-NT-09 là bộ biểu mẫu có chỗ điền: đơn vị bổ sung số hiệu văn bản, thành phần hội đồng và ngày tháng trước khi tổ chức nghiệm thu.",
  ]),
];

B.buildDoc({
  title: "Danh mục hồ sơ nghiệm thu", subtitle: "Tờ trình và danh mục tài liệu",
  code: "NTQS-NT-00", version: "1.0", classification: "Lưu hành nội bộ",
  headerTitle: "Danh mục hồ sơ nghiệm thu",
  withToc: false, body, outFile: OUT,
}).then((f) => console.log("OK", f)).catch((e) => { console.error("ERR", e); process.exit(1); });
