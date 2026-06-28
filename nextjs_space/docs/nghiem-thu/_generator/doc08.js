const B = require("./branding");
const { p, t, b, h1, h2, h3, bullet, bullets, spacer, pageBreak, table, AlignmentType } = B;
const OUT = "/home/kelinton/tapchi-nghethuatquansu02/nextjs_space/docs/nghiem-thu/08_Huong-dan-quan-tri-va-su-dung.docx";

const roleGuides = [
  ["Độc giả (READER)", "/", "Đọc bài toàn văn, tra cứu số/chuyên mục, thư viện đọc số, tải tài liệu công khai."],
  ["Tác giả (AUTHOR)", "/dashboard/author", "Gửi bản thảo, đính kèm tệp, theo dõi trạng thái, nộp bản sửa, trao đổi với biên tập."],
  ["Phản biện viên (REVIEWER)", "/dashboard/reviewer", "Nhận/từ chối phản biện, đọc bản thảo, nộp phiếu phản biện, lưu nháp, phản biện vòng 2."],
  ["BTV chuyên mục (SECTION_EDITOR)", "/dashboard/editor", "Sàng lọc bản thảo được phân công, phân công phản biện, đề xuất quyết định."],
  ["Thư ký tòa soạn (MANAGING_EDITOR)", "/dashboard/managing", "Điều phối quy trình, phân công biên tập viên, theo dõi tiến độ và thời hạn."],
  ["Phó Tổng biên tập (DEPUTY_EIC)", "/dashboard/deputy", "Giám sát biên tập, hỗ trợ quyết định (quyền xuất bản vẫn thuộc Tổng biên tập)."],
  ["Tổng biên tập (EIC)", "/dashboard/eic", "Ra quyết định cuối cùng, phê duyệt và xuất bản số/bài."],
  ["BTV dàn trang (LAYOUT_EDITOR)", "/dashboard/layout", "Dàn trang, chuẩn bị bản xuất bản, xử lý hàng đợi sản xuất."],
  ["Quản trị hệ thống (SYSADMIN)", "/dashboard/admin", "Quản trị người dùng, cấu hình, CMS, danh mục, kiểm toán, tích hợp."],
  ["Kiểm định bảo mật (SECURITY_AUDITOR)", "/dashboard/security", "Giám sát nhật ký kiểm toán, cảnh báo an ninh, phiên đăng nhập."],
  ["Chỉ huy Học viện (COMMANDER)", "/dashboard/commander", "Xem báo cáo tổng hợp và chỉ số quản lý."],
];

const body = [
  h1("1. Hướng dẫn chung"),
  h2("1.1. Đăng nhập và xác thực hai lớp"),
  ...bullets([
    "Truy cập trang đăng nhập, nhập email và mật khẩu được cấp.",
    "Nếu tài khoản bật 2FA: nhập mã TOTP (ứng dụng sinh mã) hoặc mã OTP gửi qua email.",
    "Lần đầu nên đổi mật khẩu và thiết lập 2FA; cất giữ an toàn mã dự phòng.",
  ]),
  h2("1.2. Bảng điều khiển theo vai trò"),
  p("Sau khi đăng nhập, hệ thống tự điều hướng người dùng tới bảng điều khiển tương ứng với vai trò. Nút hành động hiển thị theo quyền của người dùng."),

  h1("2. Tổng quan vai trò và đường dẫn"),
  table(["Vai trò", "Bảng điều khiển", "Chức năng chính"], roleGuides, [2900, 2100, 4354],
    { aligns: [AlignmentType.LEFT, AlignmentType.LEFT, AlignmentType.LEFT] }),
  spacer(120),

  h1("3. Quy trình nghiệp vụ xuất bản (tổng quan)"),
  p("Một bản thảo đi qua các bước chính sau:"),
  table(["Bước", "Vai trò chính", "Hoạt động"], [
    ["1. Nộp bài", "Tác giả", "Gửi bản thảo, đính kèm tệp, chọn chuyên mục"],
    ["2. Tiếp nhận & phân công", "Thư ký / BTV chuyên mục", "Sàng lọc, kiểm tra đạo văn, phân công phản biện"],
    ["3. Phản biện", "Phản biện viên", "Đánh giá, khuyến nghị (phản biện kín hai chiều)"],
    ["4. Quyết định biên tập", "BTV chuyên mục / Tổng biên tập", "Chấp nhận / yêu cầu sửa / từ chối"],
    ["5. Sửa & hoàn thiện", "Tác giả", "Nộp bản sửa theo góp ý"],
    ["6. Chế bản & dàn trang", "BTV dàn trang", "Biên tập chế bản, dàn trang, tạo bản xuất bản"],
    ["7. Xuất bản", "Tổng biên tập / Quản trị", "Gắn bài vào số, công bố ra cổng công khai"],
  ], [2300, 3000, 4054], { aligns: [AlignmentType.LEFT, AlignmentType.LEFT, AlignmentType.LEFT] }),

  pageBreak(),
  h1("4. Hướng dẫn quản trị hệ thống (SYSADMIN)"),
  h2("4.1. Quản lý người dùng và phân quyền"),
  ...bullets([
    "Phê duyệt tài khoản đăng ký mới; khóa/mở tài khoản; đặt lại mật khẩu.",
    "Gán vai trò; xử lý yêu cầu nâng quyền; theo dõi phiên đăng nhập.",
  ]),
  h2("4.2. Cấu hình và nội dung công khai"),
  ...bullets([
    "Cấu hình thông tin tòa soạn (tên, ISSN, địa chỉ, email, điện thoại), danh mục chuyên mục.",
    "Quản trị trang công khai, khối trang chủ, điều hướng (menu), banner, tin tức; xem trước nháp và lịch sử phiên bản.",
    "Quản lý hiển thị giao diện (UIConfig).",
  ]),
  h2("4.3. Kiểm toán và an ninh"),
  ...bullets([
    "Xem nhật ký kiểm toán theo thao tác nhạy cảm; xuất nhật ký.",
    "Theo dõi cảnh báo an ninh và phiên bất thường (phối hợp vai trò Kiểm định bảo mật).",
  ]),

  h1("5. Hướng dẫn vận hành theo vai trò biên tập"),
  h3("5.1. Tác giả"),
  ...bullets([
    "Tạo bản thảo mới, điền thông tin, chọn chuyên mục, đính kèm tệp và gửi.",
    "Theo dõi trạng thái; khi có yêu cầu sửa, tải góp ý, chỉnh sửa và nộp lại bản mới (giữ lịch sử phiên bản).",
  ]),
  h3("5.2. Phản biện viên"),
  ...bullets([
    "Nhận hoặc từ chối lời mời phản biện; đọc bản thảo (ẩn danh tính tác giả nếu phản biện kín).",
    "Nhập đánh giá, khuyến nghị; lưu nháp và nộp; có thể sửa cho tới khi có quyết định; hỗ trợ vòng phản biện 2.",
  ]),
  h3("5.3. Biên tập viên chuyên mục / Thư ký tòa soạn"),
  ...bullets([
    "Sàng lọc bản thảo, chạy kiểm tra đạo văn, phân công phản biện phù hợp chuyên môn.",
    "Theo dõi tiến độ, mốc thời hạn; tổng hợp ý kiến và đề xuất/ra quyết định biên tập.",
  ]),
  h3("5.4. Tổng biên tập / Phó Tổng biên tập"),
  ...bullets([
    "Xem xét hồ sơ phản biện, ra quyết định cuối cùng.",
    "Phê duyệt và xuất bản số/bài (quyền xuất bản thuộc Tổng biên tập/Quản trị).",
  ]),
  h3("5.5. Biên tập viên dàn trang"),
  ...bullets([
    "Thực hiện biên tập chế bản, dàn trang, tạo bản xuất bản và đưa vào hàng đợi sản xuất.",
  ]),

  h1("6. Lưu ý sử dụng"),
  ...bullets([
    "Đăng xuất khi rời máy; không chia sẻ tài khoản; bảo mật mã 2FA và mã dự phòng.",
    "Tuân thủ quy trình; các thao tác nhạy cảm đều được ghi nhật ký kiểm toán.",
    "Khi gặp lỗi giao diện, liên hệ Quản trị hệ thống kèm mô tả thao tác và thời điểm.",
  ]),
];

B.buildDoc({
  title: "Hướng dẫn quản trị và sử dụng", subtitle: "Theo 11 vai trò nghiệp vụ",
  code: "NTQS-NT-08", version: "1.0", classification: "Lưu hành nội bộ",
  headerTitle: "Hướng dẫn quản trị và sử dụng", body, outFile: OUT,
}).then((f) => console.log("OK", f)).catch((e) => { console.error("ERR 08", e); process.exit(1); });
