const B = require("./branding");
const R = require("./requirements");
const { p, t, b, h1, h2, h3, bullet, bullets, spacer, pageBreak, table, centered,
  signatureBlock, AlignmentType } = B;
const OUT = "/home/kelinton/tapchi-nghethuatquansu02/nextjs_space/docs/nghiem-thu/01_Bao-cao-tong-ket-du-an.docx";

const moduleRows = R.MODULES.map((m, i) => [String(i + 1), m.name, m.desc]);

const body = [
  h1("1. Thông tin chung về dự án"),
  table(["Hạng mục", "Nội dung"], [
    ["Tên phần mềm", "Tạp chí điện tử Nghệ thuật Quân sự Việt Nam (Cổng thông tin và Hệ quản trị xuất bản tạp chí khoa học)"],
    ["Tên tiếng Anh", "Journal of Vietnamese Military Art (JVMA)"],
    ["Tên viết tắt", "NTQS / JVMA"],
    ["Đơn vị chủ quản", "Học viện Quốc phòng"],
    ["Chủ đầu tư / Tòa soạn", "Tạp chí Nghệ thuật Quân sự Việt Nam"],
    ["ISSN (bản in)", "1859-0454"],
    ["Giấy phép hoạt động", "619/GP-BTTTT, ngày 23-12-2020"],
    ["Chu kỳ xuất bản", "01 kỳ/tháng"],
    ["Loại sản phẩm", "Ứng dụng web (cổng công khai + hệ quản trị nội bộ)"],
    ["Nền tảng", "Next.js 14, TypeScript, PostgreSQL (Prisma)"],
  ], [3000, 6354], { aligns: [AlignmentType.LEFT, AlignmentType.LEFT] }),
  spacer(120),

  h1("2. Mục tiêu và phạm vi"),
  h2("2.1. Mục tiêu"),
  p("Xây dựng hệ thống phần mềm quản lý toàn trình xuất bản tạp chí khoa học điện tử cho Tạp chí Nghệ thuật Quân sự Việt Nam, phục vụ số hóa quy trình từ tiếp nhận bản thảo đến xuất bản, đồng thời cung cấp cổng đọc công khai và kho lưu trữ số. Hệ thống được thiết kế để vận hành an toàn trong môi trường mạng nội bộ/cô lập của đơn vị quân đội."),
  h2("2.2. Phạm vi chức năng"),
  p("Phạm vi triển khai bao quát 16 phân hệ nghiệp vụ, từ xác thực – phân quyền, nộp bài – phản biện – biên tập – dàn trang – xuất bản, đến kho lưu trữ số, phát hiện đạo văn, quản trị nội dung công khai, đa phương tiện, thống kê – báo cáo và quản trị – kiểm toán hệ thống."),
  h2("2.3. Ngoài phạm vi"),
  ...bullets([
    "Các dịch vụ phụ thuộc Internet (ORCID, Crossref, email ngoài) là tùy chọn, mặc định tắt khi vận hành trong mạng cô lập.",
    "Việc số hóa toàn bộ kho tư liệu giấy lịch sử (ngoài tập mẫu đã nhập) thực hiện theo kế hoạch riêng sau nghiệm thu.",
  ]),

  h1("3. Kết quả thực hiện"),
  p("Hệ thống đã hoàn thành và đưa vào vận hành thử nghiệm đầy đủ các phân hệ chức năng sau:"),
  table(["STT", "Phân hệ", "Nội dung đã thực hiện"], moduleRows, [700, 2500, 6154],
    { aligns: [AlignmentType.CENTER, AlignmentType.LEFT, AlignmentType.LEFT] }),
  spacer(120),

  h2("3.1. Khối lượng sản phẩm"),
  table(["Chỉ tiêu", "Số lượng"], [
    ["Phân hệ nghiệp vụ", String(R.METRICS.modules)],
    ["Yêu cầu chức năng (FR)", `${R.METRICS.frTotal} (trong đó ${R.METRICS.frRequired} bắt buộc)`],
    ["Yêu cầu phi chức năng (NFR)", String(R.METRICS.nfrTotal)],
    ["Tuyến API", `≈ ${R.METRICS.apiRoutes}`],
    ["Model dữ liệu (Prisma)", String(R.METRICS.models)],
    ["Vai trò người dùng (RBAC)", String(R.METRICS.roles)],
    ["Chuyên mục NTQS", String(R.METRICS.categories)],
    ["Bộ kiểm thử đơn vị (Jest)", String(R.METRICS.unitTests)],
    ["Bài báo trong kho mẫu", `≈ ${R.METRICS.journalArticles}`],
  ], [5354, 4000], { aligns: [AlignmentType.LEFT, AlignmentType.CENTER] }),
  spacer(120),

  h1("4. Đánh giá mức độ hoàn thành"),
  p("Đối chiếu với yêu cầu đặt ra, các yêu cầu chức năng bắt buộc và yêu cầu phi chức năng cốt lõi đã được triển khai và kiểm thử. Chi tiết truy vết yêu cầu – thiết kế – kiểm thử được trình bày tại tài liệu Ma trận truy vết yêu cầu (NTQS-NT-05)."),
  table(["Nhóm yêu cầu", "Mức độ đáp ứng", "Ghi chú"], [
    ["Yêu cầu chức năng bắt buộc", "Đáp ứng đầy đủ", "Có bằng chứng kiểm thử tự động/thủ công"],
    ["Yêu cầu chức năng nên có", "Đáp ứng", "Một số phụ thuộc Internet là tùy chọn"],
    ["Yêu cầu phi chức năng", "Đáp ứng", "Bảo mật, hiệu năng, triển khai air-gap, bản địa hóa"],
    ["Nhận diện thương hiệu NTQS", "Đáp ứng", "Có kiểm thử chống lệch thương hiệu (branding-guard)"],
  ], [3300, 2700, 3354], { aligns: [AlignmentType.LEFT, AlignmentType.CENTER, AlignmentType.LEFT] }),
  spacer(120),

  h1("5. Kiến trúc và công nghệ"),
  p("Hệ thống áp dụng kiến trúc phân lớp: tầng API (tiếp nhận, kiểm tra đầu vào) – tầng Dịch vụ (nghiệp vụ, quy trình) – tầng Truy xuất dữ liệu (Prisma) – tầng Tích hợp (ORCID, Crossref, email, lưu trữ, Redis) – tầng Giao diện (Next.js/React). Chi tiết tại tài liệu Thiết kế hệ thống (NTQS-NT-03)."),

  h1("6. Kết quả kiểm thử (tóm tắt)"),
  ...bullets([
    "Kiểm thử đơn vị: 30 bộ test (Jest) tập trung RBAC, quy trình biên tập, bảo mật tải tệp, chấm đạo văn, chống lệch thương hiệu.",
    "Kiểm thử vai trò: verify:roles (kiểm tra cấp tài khoản) và smoke:roles (kiểm tra RBAC + vòng đời trên ứng dụng thật).",
    "Kiểm thử thủ công: theo kế hoạch và bảng kiểm tại tài liệu NTQS-NT-06.",
  ]),

  h1("7. An toàn thông tin (tóm tắt)"),
  ...bullets([
    "Xác thực JWT + 2FA (TOTP/Email OTP); kiểm soát truy cập RBAC và phạm vi ở backend.",
    "Giới hạn tần suất, nhật ký kiểm toán, kiểm tra tệp tải lên, thiết lập tiêu đề an ninh và CSP.",
    "Tối ưu cho mạng cô lập: tự lưu font/JS, dịch vụ ngoài mặc định tắt. Chi tiết tại NTQS-NT-04.",
  ]),

  h1("8. Tồn tại, hạn chế và hướng phát triển"),
  ...bullets([
    "Một số tích hợp ngoài (ORCID, Crossref, email SMTP) phụ thuộc Internet, cần cấu hình khi môi trường cho phép.",
    "Số hóa kho tư liệu giấy lịch sử cần tiếp tục theo lộ trình; chất lượng OCR phụ thuộc bản gốc.",
    "Khuyến nghị bổ sung kiểm thử đầu-cuối (E2E) tự động và giám sát vận hành (metrics) ở giai đoạn sau.",
  ]),

  h1("9. Kết luận và kiến nghị"),
  p("Phần mềm “Tạp chí điện tử Nghệ thuật Quân sự Việt Nam” đã hoàn thành các mục tiêu, phạm vi và yêu cầu đặt ra; đã được kiểm thử và vận hành thử nghiệm ổn định. Tòa soạn kính đề nghị Hội đồng xem xét nghiệm thu và đưa hệ thống vào sử dụng chính thức."),
  spacer(200),
  ...signatureBlock([
    { role: "NGƯỜI LẬP BÁO CÁO", subRole: "(Ký, ghi rõ họ tên)", title: " ", name: "……………………………" },
    { role: "TỔNG BIÊN TẬP", subRole: "(Ký, ghi rõ họ tên, đóng dấu)", stamp: true, title: "Đại tá, TS", name: "Lê Ngọc Bảo" },
  ], null),
];

B.buildDoc({
  title: "Báo cáo tổng kết dự án", subtitle: "Kết quả thực hiện dự án phần mềm",
  code: "NTQS-NT-01", version: "1.0", classification: "Lưu hành nội bộ",
  headerTitle: "Báo cáo tổng kết dự án", body, outFile: OUT,
}).then((f) => console.log("OK", f)).catch((e) => { console.error("ERR 01", e); process.exit(1); });
