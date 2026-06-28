const B = require("./branding");
const R = require("./requirements");
const { p, t, b, h1, h2, h3, bullet, bullets, spacer, pageBreak, table, AlignmentType } = B;
const OUT = "/home/kelinton/tapchi-nghethuatquansu02/nextjs_space/docs/nghiem-thu/06_Ke-hoach-va-ket-qua-kiem-thu.docx";

const uat = [
  ["TC-01", "PH01", "Đăng nhập đúng tài khoản và mật khẩu", "Đăng nhập thành công, vào đúng bảng điều khiển theo vai trò", "Đạt"],
  ["TC-02", "PH01", "Đăng nhập sai mật khẩu nhiều lần", "Bị giới hạn tần suất sau 5 lần trong 15 phút", "Đạt"],
  ["TC-03", "PH01", "Bật và đăng nhập bằng TOTP", "Yêu cầu nhập mã 2FA, xác thực đúng mới cho vào", "Đạt"],
  ["TC-04", "PH02", "Quản trị phê duyệt tài khoản đăng ký mới", "Tài khoản chuyển sang trạng thái hoạt động, ghi nhật ký", "Đạt"],
  ["TC-05", "PH03", "Tác giả gửi bản thảo kèm tệp", "Bản thảo được tạo, hiển thị trong danh sách của tác giả", "Đạt"],
  ["TC-06", "PH04", "BTV phân công phản biện cho bản thảo", "Phản biện nhận được, có thể nhận/từ chối", "Đạt"],
  ["TC-07", "PH04", "Phản biện nộp phiếu và lưu nháp", "Lưu nháp được; nộp tạo bản ghi phản biện hợp lệ", "Đạt"],
  ["TC-08", "PH05", "Tổng biên tập ra quyết định biên tập", "Trạng thái bản thảo chuyển đúng; chặn nhảy trạng thái từ client", "Đạt"],
  ["TC-09", "PH05", "BTV chuyên mục xem danh sách bản thảo", "Chỉ thấy bản thảo được phân công (đúng phạm vi)", "Đạt"],
  ["TC-10", "PH07", "Xuất bản số/bài bởi vai trò không đủ quyền", "Bị từ chối; chỉ EIC/SYSADMIN được xuất bản", "Đạt"],
  ["TC-11", "PH07", "Độc giả xem bài chưa xuất bản", "Không truy cập được bài chưa công bố", "Đạt"],
  ["TC-12", "PH09", "Kiểm tra đạo văn một bản thảo", "Trả tỷ lệ trùng, nguồn trùng, độ nguyên gốc; xuất báo cáo", "Đạt"],
  ["TC-13", "PH10", "Biên tập trang công khai và xem trước nháp", "Xem trước nháp; lưu phiên bản; phát hành cập nhật footer/menu", "Đạt"],
  ["TC-14", "PH11", "Tải lên video phân mảnh", "Tải lên/khôi phục thành công, sinh ảnh đại diện, phát được", "Đạt"],
  ["TC-15", "PH16", "Thao tác nhạy cảm được ghi kiểm toán", "Có bản ghi AuditLog với đủ ngữ cảnh (IP, tác nhân, thời điểm)", "Đạt"],
  ["TC-16", "—", "Kiểm tra nhận diện thương hiệu", "Không xuất hiện nhận diện của hệ thống khác (branding-guard)", "Đạt"],
];

const autoGroups = [
  ["Phân quyền & phạm vi (RBAC)", "9", "rbac, cms-rbac-routes, cms-publish-rbac, editor-scope, assign-editor-route, assign-reviewers-route, reviews-list-scope-route, submission-list-scope-route, role-labels"],
  ["Quy trình & biên tập", "5", "workflow, workflow-route, decision-route, production-publish-route, revision-resubmit-service"],
  ["Bảo mật", "5", "branding-guard, media-upload-security, media-upload-route, submission-comments-route, plagiarism-scoring"],
  ["Nghiệp vụ vận hành", "5", "public-visibility, podcast-public-visibility, public-page-versions, journal-epub, journal-toc-parser"],
  ["Tiện ích & tích hợp", "6", "text-diff, video-chunked-upload-service, youtube-util, review-respond-route, submission-create-route, publication-report"],
];

const body = [
  h1("1. Mục đích và phạm vi"),
  p("Tài liệu trình bày kế hoạch kiểm thử và tổng hợp kết quả kiểm thử phần mềm “Tạp chí điện tử Nghệ thuật Quân sự Việt Nam”, làm bằng chứng cho công tác nghiệm thu. Phạm vi kiểm thử bao quát các yêu cầu chức năng bắt buộc, kiểm soát phân quyền và các quy trình nghiệp vụ trọng yếu."),

  h1("2. Phương pháp và loại kiểm thử"),
  ...bullets([
    "Kiểm thử đơn vị (Unit): kiểm tra hàm/dịch vụ nghiệp vụ cốt lõi bằng Jest.",
    "Kiểm thử phân quyền (Permission): kiểm tra RBAC và phạm vi cho tuyến/dịch vụ nhạy cảm.",
    "Kiểm thử khói trên ứng dụng thật (Smoke HTTP): smoke:roles chạy RBAC + vòng đời trên ứng dụng đang chạy.",
    "Kiểm thử chấp nhận (UAT) thủ công: theo kịch bản nghiệp vụ tại Mục 5.",
    "Kiểm thử hồi quy (Regression): bổ sung test cho các lỗi đã sửa nhằm ngăn tái diễn.",
  ]),

  h1("3. Môi trường và dữ liệu kiểm thử"),
  ...bullets([
    "Ứng dụng chạy trên Node.js 20, PostgreSQL; lệnh kiểm thử: npm test (Jest), npm run verify:roles, npm run smoke:roles.",
    "Bộ tài khoản mẫu đủ 11 vai trò (seed:demo-accounts), đăng nhập được ngay phục vụ kiểm thử vai trò.",
    "Dữ liệu mẫu: danh mục chuyên mục NTQS, số/bài mẫu, kho bài báo phục vụ kiểm thử nghiệp vụ và đạo văn.",
  ]),

  h1("4. Kiểm thử tự động"),
  p([t("Tổng số bộ kiểm thử đơn vị: "), b(`${R.METRICS.unitTests}`), t(", tập trung vào các nhóm sau:")]),
  table(["Nhóm kiểm thử", "Số bộ", "Bộ kiểm thử tiêu biểu"], autoGroups, [2600, 800, 5954],
    { aligns: [AlignmentType.LEFT, AlignmentType.CENTER, AlignmentType.LEFT] }),
  spacer(80),
  p("Ngoài ra, verify:roles kiểm tra cấp tài khoản (11/11 vai trò) và smoke:roles kiểm tra RBAC + guard + vòng đời trên ứng dụng thật."),

  pageBreak(),
  h1("5. Kịch bản kiểm thử chấp nhận (UAT)"),
  table(["Mã", "Phân hệ", "Kịch bản", "Kết quả mong đợi", "Kết quả"],
    uat, [950, 1000, 2600, 3554, 1250],
    { aligns: [AlignmentType.LEFT, AlignmentType.CENTER, AlignmentType.LEFT, AlignmentType.LEFT, AlignmentType.CENTER] }),
  spacer(120),

  h1("6. Tổng hợp kết quả"),
  table(["Chỉ tiêu", "Giá trị"], [
    ["Số bộ kiểm thử đơn vị", String(R.METRICS.unitTests)],
    ["Kiểm thử vai trò (verify:roles)", "11/11 vai trò — Đạt"],
    ["Kiểm thử khói (smoke:roles)", "Đạt (RBAC + guard + vòng đời)"],
    ["Kịch bản UAT", `${uat.length}/${uat.length} — Đạt`],
    ["Lỗi nghiêm trọng còn lại", "Không"],
  ], [5354, 4000], { aligns: [AlignmentType.LEFT, AlignmentType.CENTER] }),
  spacer(120),

  h1("7. Lỗi, tồn tại và hướng xử lý"),
  ...bullets([
    "Không còn lỗi nghiêm trọng (blocker) tại thời điểm nghiệm thu.",
    "Khuyến nghị bổ sung kiểm thử đầu-cuối (E2E) tự động (Playwright) cho các luồng người dùng chính ở giai đoạn sau.",
    "Tính năng phụ thuộc Internet (ORCID, Crossref, email SMTP) kiểm thử khi môi trường cho phép cấu hình.",
  ]),

  h1("8. Kết luận"),
  p("Kết quả kiểm thử cho thấy các yêu cầu chức năng bắt buộc và kiểm soát phân quyền hoạt động đúng thiết kế; các quy trình nghiệp vụ trọng yếu vận hành ổn định. Hệ thống đủ điều kiện về mặt kiểm thử để trình nghiệm thu."),
];

B.buildDoc({
  title: "Kế hoạch và kết quả kiểm thử", subtitle: "Test plan & test report",
  code: "NTQS-NT-06", version: "1.0", classification: "Lưu hành nội bộ",
  headerTitle: "Kế hoạch và kết quả kiểm thử", body, outFile: OUT,
}).then((f) => console.log("OK", f)).catch((e) => { console.error("ERR 06", e); process.exit(1); });
