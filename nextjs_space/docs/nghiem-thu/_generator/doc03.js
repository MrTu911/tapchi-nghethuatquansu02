const B = require("./branding");
const R = require("./requirements");
const { p, t, b, h1, h2, h3, bullet, bullets, spacer, pageBreak, table, AlignmentType } = B;
const OUT = "/home/kelinton/tapchi-nghethuatquansu02/nextjs_space/docs/nghiem-thu/03_Tai-lieu-thiet-ke-he-thong.docx";

const body = [
  h1("1. Tổng quan kiến trúc"),
  p("Hệ thống được xây dựng trên nền tảng Next.js 14 (App Router) với TypeScript, cơ sở dữ liệu PostgreSQL truy xuất qua ORM Prisma. Kiến trúc áp dụng nguyên tắc phân lớp rõ ràng, tách biệt trách nhiệm giữa tầng tiếp nhận yêu cầu, tầng nghiệp vụ, tầng dữ liệu và tầng tích hợp."),
  table(["Thành phần", "Công nghệ"], [
    ["Khung ứng dụng", "Next.js 14 (App Router), React 18, TypeScript"],
    ["Cơ sở dữ liệu", "PostgreSQL, ORM Prisma (67 model)"],
    ["Giao diện", "Tailwind CSS, Radix UI / shadcn-ui, TanStack Query, React Hook Form, Zod"],
    ["Xác thực", "JWT + NextAuth (lớp tương thích), 2FA (otplib)"],
    ["Lưu trữ tệp", "Hệ thống tệp nội bộ hoặc MinIO/AWS S3"],
    ["Bộ nhớ đệm / giới hạn", "Redis (Upstash) hoặc bộ nhớ trong"],
    ["Email", "Nodemailer (SMTP)"],
    ["Vận hành", "pm2 (cổng 3001), bản dựng production"],
  ], [3000, 6354], { aligns: [AlignmentType.LEFT, AlignmentType.LEFT] }),
  spacer(120),

  h1("2. Kiến trúc phân lớp"),
  p("Luồng xử lý đi từ giao diện → tầng API → tầng dịch vụ → tầng truy xuất dữ liệu, có sự tham gia của tầng tích hợp khi cần dịch vụ ngoài. Mỗi tầng có trách nhiệm tách bạch:"),
  table(["Tầng", "Trách nhiệm", "Vị trí mã nguồn"], [
    ["API (Route)", "Tiếp nhận yêu cầu, kiểm tra đầu vào, gọi dịch vụ, trả response chuẩn", "app/api/**/route.ts"],
    ["Dịch vụ (Service)", "Quy tắc nghiệp vụ, vòng đời/quy trình, điều phối nhiều nguồn", "lib/services, lib/workflow.ts"],
    ["Truy xuất dữ liệu", "Truy vấn CSDL, ánh xạ dữ liệu, giao dịch", "lib/repositories, Prisma"],
    ["Tích hợp", "ORCID, Crossref, email, lưu trữ, Redis", "lib/integrations, lib/s3.ts"],
    ["Giao diện", "Hiển thị, thu nhận đầu vào, gọi API/hook, quản lý trạng thái UI", "app/(public), app/dashboard, components"],
  ], [2100, 4254, 3000], { aligns: [AlignmentType.LEFT, AlignmentType.LEFT, AlignmentType.LEFT] }),
  spacer(80),
  p([b("Chuẩn response API: "), t("mọi API trả về cấu trúc thống nhất { success, data, error } để giao diện xử lý đồng nhất.")]),

  pageBreak(),
  h1("3. Thiết kế cơ sở dữ liệu"),
  p([t("Lược đồ dữ liệu gồm "), b(`${R.METRICS.models} model`), t(" trên PostgreSQL, tổ chức theo các nhóm nghiệp vụ. Cơ sở dữ liệu của hệ thống "), b("tách biệt hoàn toàn"), t(", không dùng chung với hệ thống khác.")]),
  h2("3.1. Nhóm model theo nghiệp vụ"),
  table(["Nhóm", "Số model", "Model tiêu biểu"], [
    ["Người dùng & xác thực", "9", "User, UserSession, TwoFactorAuth, TwoFactorToken, ORCIDProfile, SecurityAlert"],
    ["Phân quyền (RBAC)", "2", "Permission, RolePermission"],
    ["Nội dung & xuất bản", "15", "Submission, Article, Issue, Volume, JournalArticle, IssueSection, News, Banner"],
    ["Phản biện & quy trình", "6", "Review, EditorDecision, Deadline, WorkflowStepConfig, Message, Chat*"],
    ["Sản xuất & tệp", "4", "Copyedit, Production, PlagiarismReport, UploadedFile"],
    ["Đạo văn & AI", "2", "PlagiarismCheck, ReviewerMatchScore"],
    ["CMS & trang công khai", "9", "PublicPage, PublicPageVersion, PageBlock, NavigationItem, SiteSetting, Media, Video, Podcast"],
    ["Thống kê & thông báo", "2", "ArticleMetrics, Notification"],
    ["Thu thập nội dung web", "3", "WebSource, CrawlJob, CrawledContent"],
    ["Hồ sơ phản biện", "1", "ReviewerProfile"],
    ["Dữ liệu chủ", "4", "Category, CategoryAlias, Keyword, Asset"],
    ["Kiểm toán & cấu hình", "4", "AuditLog, UIConfig, RetentionPolicy, ReportRegistry"],
    ["Khác (email, hàng đợi)", "3", "EmailTemplate, PushSubscription, ScheduledJob"],
  ], [2700, 1100, 5554], { aligns: [AlignmentType.LEFT, AlignmentType.CENTER, AlignmentType.LEFT] }),
  spacer(80),
  h2("3.2. Quan hệ và ràng buộc chính"),
  ...bullets([
    "Submission – SubmissionVersion – Review – EditorDecision: trục dữ liệu của quy trình phản biện – biên tập.",
    "Volume – Issue – IssueSection – (Article, JournalArticle): trục dữ liệu xuất bản số/tập; đếm số bài cộng gộp hai nguồn Article và JournalArticle.",
    "User – UserSession/TwoFactorAuth/AuditLog: trục dữ liệu xác thực, phiên và kiểm toán.",
    "JournalArticle – JournalArticleAuthor – JournalCouncilMember: kho bài báo toàn văn và măng-sét theo số.",
  ]),
  h2("3.3. Chỉ mục, lịch sử và toàn vẹn"),
  ...bullets([
    "Bổ sung chỉ mục cho các trường tìm kiếm/lọc/sắp xếp phổ biến và khóa ngoại lớn; tránh truy vấn N+1.",
    "Lưu lịch sử trạng thái/phiên bản (ArticleStatusHistory, SubmissionVersion, PublicPageVersion) để truy vết.",
    "Ưu tiên xóa mềm với dữ liệu cần lưu vết pháp lý/lịch sử; áp dụng chính sách lưu trữ (RetentionPolicy).",
  ]),

  pageBreak(),
  h1("4. Thiết kế API"),
  p([t("Hệ thống cung cấp "), b(`≈ ${R.METRICS.apiRoutes} tuyến API`), t(" theo chuẩn REST, đặt tên tài nguyên dạng danh từ số nhiều, kèm tuyến hành động khi cần (publish, approve, decision, export...).")]),
  table(["Nhóm tuyến", "Chức năng chính"], [
    ["/api/auth, /api/auth/2fa", "Đăng nhập, đăng ký, 2FA, refresh, khôi phục mật khẩu"],
    ["/api/submissions, /api/reviews", "Nộp bài, phiên bản, phân công – nộp phản biện, quyết định"],
    ["/api/articles, /api/issues", "Bài báo, số/tập, gắn bài vào số, xuất bản"],
    ["/api/plagiarism", "Kiểm tra đạo văn, báo cáo"],
    ["/api/repository, /api/files", "Kho lưu trữ, tải/đọc tệp"],
    ["/api/public-pages, /api/banners, /api/navigation", "Quản trị nội dung công khai"],
    ["/api/videos, /api/podcasts, /api/media", "Đa phương tiện"],
    ["/api/web-sources, /api/crawled-content", "Thu thập và kiểm duyệt nội dung web"],
    ["/api/statistics, /api/reports", "Thống kê và báo cáo"],
    ["/api/admin/*, /api/audit-logs, /api/sessions", "Quản trị, kiểm toán, phiên"],
    ["/api/cron/*", "Tác vụ định kỳ: nhắc hạn, quá hạn, SLA"],
  ], [4000, 5354], { aligns: [AlignmentType.LEFT, AlignmentType.LEFT] }),
  spacer(80),
  h2("4.1. Nguyên tắc thiết kế API"),
  ...bullets([
    "GET đọc; POST tạo/hành động có side-effect; PATCH cập nhật một phần; PUT thay thế; DELETE xóa theo thiết kế.",
    "Mọi đầu vào được kiểm tra trước nghiệp vụ (ưu tiên schema Zod); danh sách lớn hỗ trợ phân trang/lọc/sắp xếp.",
    "Tuyến nhạy cảm kiểm tra chức năng (function code) và phạm vi ở tầng dịch vụ/repository, không chỉ ở giao diện.",
    "Không phá vỡ hợp đồng response của tuyến đang dùng; thay đổi lớn thì tạo tuyến mới hoặc deprecate rõ ràng.",
  ]),

  h1("5. Thiết kế giao diện"),
  h2("5.1. Cổng công khai"),
  ...bullets([
    "Trang chủ, danh sách số mới, đọc bài toàn văn, tra cứu theo chuyên mục, lưu trữ, thư viện đọc số.",
    "Trang nội dung động (giới thiệu, liên hệ, thể lệ, quy trình xuất bản, giấy phép) do CMS quản trị.",
    "Đa phương tiện: video, podcast.",
  ]),
  h2("5.2. Hệ quản trị theo vai trò"),
  p("Mỗi vai trò có bảng điều khiển riêng (ví dụ: /dashboard/eic, /dashboard/managing, /dashboard/editor, /dashboard/reviewer, /dashboard/author, /dashboard/layout, /dashboard/admin, /dashboard/security, /dashboard/commander). Giao diện áp dụng chủ đề (theme) NTQS, phân biệt rõ trạng thái tải/trống/lỗi, nút hành động hiển thị theo quyền."),

  h1("6. Thiết kế tích hợp"),
  table(["Dịch vụ", "Vai trò", "Trạng thái"], [
    ["ORCID", "Định danh và đồng bộ hồ sơ tác giả", "Tùy chọn (cần Internet)"],
    ["Crossref", "Tra cứu DOI/metadata", "Tùy chọn (cần Internet)"],
    ["Email/SMTP", "Thông báo quy trình", "Tùy chọn"],
    ["MinIO/S3", "Lưu trữ tệp", "Tùy chọn (mặc định lưu nội bộ)"],
    ["Redis (Upstash)", "Giới hạn tần suất, cache", "Tùy chọn (mặc định bộ nhớ trong)"],
  ], [2600, 4754, 2000], { aligns: [AlignmentType.LEFT, AlignmentType.LEFT, AlignmentType.LEFT] }),
  spacer(80),
  p("Thiết kế bảo đảm hệ thống vận hành đầy đủ chức năng lõi ngay cả khi các dịch vụ ngoài bị tắt — phù hợp môi trường mạng cô lập."),

  h1("7. Thiết kế triển khai"),
  ...bullets([
    "Chạy bản dựng production qua pm2 (ứng dụng cổng 3001), tự khởi động cùng máy chủ.",
    "Hỗ trợ cài đặt trực tuyến (setup.sh) và ngoại tuyến bằng gói USB (build-usb-package.sh, offline-install.sh).",
    "Cấu hình qua biến môi trường; bí mật sinh tự động khi cài đặt. Chi tiết tại NTQS-NT-07.",
  ]),
];

B.buildDoc({
  title: "Tài liệu thiết kế hệ thống", subtitle: "Kiến trúc, cơ sở dữ liệu, API và tích hợp",
  code: "NTQS-NT-03", version: "1.0", classification: "Lưu hành nội bộ",
  headerTitle: "Tài liệu thiết kế hệ thống", body, outFile: OUT,
}).then((f) => console.log("OK", f)).catch((e) => { console.error("ERR 03", e); process.exit(1); });
