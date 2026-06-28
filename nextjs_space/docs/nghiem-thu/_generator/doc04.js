const B = require("./branding");
const { p, t, b, h1, h2, h3, bullet, bullets, spacer, pageBreak, table, AlignmentType } = B;
const OUT = "/home/kelinton/tapchi-nghethuatquansu02/nextjs_space/docs/nghiem-thu/04_Phuong-an-an-toan-thong-tin.docx";

const body = [
  h1("1. Mục đích và phạm vi"),
  p("Tài liệu trình bày phương án bảo đảm an toàn thông tin (ATTT) của phần mềm “Tạp chí điện tử Nghệ thuật Quân sự Việt Nam”, bao gồm các biện pháp kỹ thuật về xác thực, phân quyền, kiểm soát truy cập, kiểm toán, bảo vệ dữ liệu và tăng cường an ninh cho môi trường vận hành mạng nội bộ/cô lập."),
  p([b("Nguyên tắc cốt lõi: "), t("không tin tưởng giao diện để bảo vệ dữ liệu — mọi kiểm soát bảo mật được thực thi ở backend.")]),

  h1("2. Xác thực và phiên làm việc"),
  table(["Thành phần", "Thiết kế"], [
    ["Đăng nhập", "Email/mật khẩu; mật khẩu băm bcrypt (12 vòng)"],
    ["Phiên đăng nhập", "JWT: access token (8 giờ), refresh token (7 ngày), bí mật riêng cho refresh"],
    ["Xác thực 2 lớp", "TOTP (otplib, dung sai ±1 bước thời gian) và Email OTP qua token tiền-xác thực (TTL 10 phút)"],
    ["Mã dự phòng 2FA", "10 mã, lưu dạng băm SHA-256; khuyến nghị in và cất giữ an toàn"],
    ["Quản lý phiên", "Theo dõi phiên, vô hiệu hóa phiên, cảnh báo an ninh (SecurityAlert)"],
  ], [2600, 6754], { aligns: [AlignmentType.LEFT, AlignmentType.LEFT] }),
  spacer(80),
  p("Đối với mạng cô lập, ưu tiên TOTP; cần đồng bộ thời gian máy chủ qua NTP nội bộ để bảo đảm độ chính xác của mã."),

  h1("3. Phân quyền và kiểm soát truy cập"),
  ...bullets([
    "RBAC 11 vai trò với thứ bậc rõ ràng; thực thi tại middleware và guard route ở backend.",
    "Ma trận quyền theo tài nguyên – hành động (Permission/RolePermission).",
    "Kiểm soát phạm vi dữ liệu (scope): biên tập viên chuyên mục chỉ thấy bản thảo được phân công; độc giả không thấy bài chưa xuất bản.",
    "Bảo vệ phản biện kín hai chiều: ẩn danh tính theo chế độ kín ở tầng dịch vụ.",
    "Quyền nhạy cảm (xuất bản, quản trị người dùng) giới hạn cho vai trò phù hợp.",
  ]),

  h1("4. Bảo vệ tuyến và dữ liệu đầu vào"),
  h2("4.1. Giới hạn tần suất (rate limit)"),
  p("Áp dụng giới hạn tần suất phân tầng theo mức độ nhạy cảm của tuyến (dùng Redis hoặc bộ nhớ trong):"),
  table(["Tuyến", "Giới hạn", "Cửa sổ"], [
    ["Đăng nhập", "5 lần", "15 phút"],
    ["2FA", "5 lần", "10 phút"],
    ["Quên mật khẩu", "3 lần", "1 giờ"],
    ["Đăng ký", "5 lần", "1 giờ"],
    ["Tải tệp", "20 lần", "1 giờ"],
    ["Ghi dữ liệu chung (POST/PUT/PATCH/DELETE)", "120 lần", "1 phút"],
  ], [5354, 2000, 2000], { aligns: [AlignmentType.LEFT, AlignmentType.CENTER, AlignmentType.CENTER] }),
  spacer(80),
  h2("4.2. Kiểm tra tệp tải lên"),
  ...bullets([
    "Danh sách trắng loại MIME (PDF, DOC/DOCX, XLS/XLSX, TXT, ảnh); từ chối tệp thực thi/mã kịch bản.",
    "Kiểm tra chữ ký nhị phân (magic byte) chống giả mạo loại tệp; giới hạn kích thước; từ chối tệp rỗng.",
    "Làm sạch tên tệp, chống path traversal; không tin tên tệp từ client.",
    "Tuyến tải lên có giới hạn tần suất; tệp phục vụ qua tuyến kiểm soát, không lộ đường dẫn trực tiếp.",
  ]),
  h2("4.3. Kiểm tra đầu vào"),
  p("Mọi đầu vào được kiểm tra trước nghiệp vụ (ưu tiên schema Zod), bao gồm tham số phân trang/lọc/sắp xếp."),

  h1("5. Nhật ký kiểm toán"),
  p("Hệ thống ghi nhật ký kiểm toán (AuditLog) cho các nhóm thao tác nhạy cảm, kèm ngữ cảnh: chủ thể, hành động, đối tượng, địa chỉ IP, tác nhân (user agent), thời điểm."),
  table(["Nhóm sự kiện", "Ví dụ"], [
    ["Xác thực", "Đăng nhập thành công/thất bại, đăng xuất, token hết hạn/không hợp lệ"],
    ["Phân quyền", "Từ chối truy cập, từ chối quyền"],
    ["Người dùng", "Tạo/sửa/khóa/mở tài khoản, đổi mật khẩu, nâng quyền"],
    ["Bản thảo & phản biện", "Nộp bài, đổi trạng thái, phân công/nộp phản biện"],
    ["Biên tập & xuất bản", "Quyết định biên tập, xuất bản/thu hồi bài"],
    ["Hệ thống & dữ liệu", "Đổi cấu hình, banner/menu, xuất/nhập dữ liệu, truy cập tệp"],
  ], [3000, 6354], { aligns: [AlignmentType.LEFT, AlignmentType.LEFT] }),
  spacer(80),
  p("Phân biệt nhật ký kiểm toán với nhật ký ứng dụng/lỗi; không ghi bí mật (mật khẩu thô, OTP, token) vào nhật ký."),

  h1("6. Tăng cường an ninh ứng dụng"),
  table(["Biện pháp", "Thiết lập"], [
    ["Chính sách CSP", "default-src 'self'; tự lưu font/JS, không phụ thuộc CDN ngoài (phù hợp mạng cô lập)"],
    ["HSTS", "Bật ở môi trường production"],
    ["Chống dò MIME", "X-Content-Type-Options: nosniff"],
    ["Chống XSS", "X-XSS-Protection; kiểm soát nội dung động"],
    ["Referrer / Permissions", "strict-origin-when-cross-origin; tắt camera/micro/định vị"],
  ], [2900, 6454], { aligns: [AlignmentType.LEFT, AlignmentType.LEFT] }),

  h1("7. Quản lý bí mật và cấu hình"),
  ...bullets([
    "Không lưu cứng bí mật/credential trong mã nguồn; cấu hình qua biến môi trường.",
    "Bí mật (JWT_SECRET, khóa mã hóa ORCID, CRON_SECRET...) sinh tự động khi cài đặt.",
    "Không commit tệp .env vào kho mã nguồn.",
  ]),

  h1("8. Bảo vệ dữ liệu và tách biệt hệ thống"),
  ...bullets([
    "Cơ sở dữ liệu tách biệt hoàn toàn, không dùng chung với hệ thống khác.",
    "Giữ lịch sử và ưu tiên xóa mềm với dữ liệu pháp lý/lịch sử; có chính sách lưu trữ.",
    "Bảo đảm nhất quán nhận diện NTQS; có kiểm thử chống lệch thương hiệu (branding-guard).",
  ]),

  h1("9. Khuyến nghị tăng cường (giai đoạn sau)"),
  ...bullets([
    "Mã hóa dữ liệu khi lưu (at-rest) ở mức hệ điều hành/CSDL theo yêu cầu của đơn vị.",
    "Sao lưu định kỳ và quy trình khôi phục; diễn tập khôi phục.",
    "Giám sát bất thường đăng nhập theo IP; phát hiện thay đổi nhật ký kiểm toán.",
    "Bổ sung kiểm thử thâm nhập (pentest) trước khi mở rộng phạm vi truy cập.",
  ]),
];

B.buildDoc({
  title: "Phương án an toàn thông tin", subtitle: "Bảo đảm ATTT cho hệ thống",
  code: "NTQS-NT-04", version: "1.0", classification: "Lưu hành nội bộ",
  headerTitle: "Phương án an toàn thông tin (ATTT)", body, outFile: OUT,
}).then((f) => console.log("OK", f)).catch((e) => { console.error("ERR 04", e); process.exit(1); });
