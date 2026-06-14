
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PermissionCategory, Role } from '@prisma/client'
import { clearPermissionsCache } from '@/lib/rbac-dynamic'

// ─── Bộ quyền đầy đủ toàn hệ thống ──────────────────────────────────────────

const DEFAULT_PERMISSIONS: { code: string; name: string; description: string; category: PermissionCategory }[] = [

  // ── CONTENT: Nội dung & Bài báo ──────────────────────────────────────────
  { code: 'submissions.view', name: 'Xem bài nộp', description: 'Xem danh sách và chi tiết bài nộp', category: 'CONTENT' },
  { code: 'submissions.create', name: 'Nộp bài mới', description: 'Tác giả nộp bài viết mới', category: 'CONTENT' },
  { code: 'submissions.edit', name: 'Chỉnh sửa bài nộp', description: 'Sửa nội dung bài nộp (tác giả/biên tập)', category: 'CONTENT' },
  { code: 'submissions.delete', name: 'Xóa bài nộp', description: 'Xóa bài nộp khỏi hệ thống', category: 'CONTENT' },
  { code: 'submissions.withdraw', name: 'Rút bài nộp', description: 'Tác giả rút lại bài đã nộp', category: 'CONTENT' },
  { code: 'articles.view', name: 'Xem bài báo đã xuất bản', description: 'Xem danh sách bài đã được chấp thuận', category: 'CONTENT' },
  { code: 'articles.publish', name: 'Xuất bản bài báo', description: 'Đưa bài lên trạng thái Published', category: 'CONTENT' },
  { code: 'articles.unpublish', name: 'Hủy xuất bản bài', description: 'Thu hồi bài đã xuất bản', category: 'CONTENT' },
  { code: 'articles.archive', name: 'Lưu trữ bài báo', description: 'Đưa bài vào trạng thái archive', category: 'CONTENT' },
  { code: 'articles.doi', name: 'Quản lý DOI', description: 'Gán/sửa DOI cho bài báo', category: 'CONTENT' },
  { code: 'issues.view', name: 'Xem số tạp chí', description: 'Xem danh sách và chi tiết số phát hành', category: 'CONTENT' },
  { code: 'issues.manage', name: 'Quản lý số tạp chí', description: 'Tạo, sửa, xóa số tạp chí', category: 'CONTENT' },
  { code: 'issues.publish', name: 'Xuất bản số tạp chí', description: 'Chuyển số sang trạng thái Published', category: 'CONTENT' },
  { code: 'volumes.manage', name: 'Quản lý tập (Volumes)', description: 'Tạo và quản lý tập tạp chí theo năm', category: 'CONTENT' },
  { code: 'keywords.manage', name: 'Quản lý từ khóa', description: 'Thêm, sửa, xóa từ khóa hệ thống', category: 'CONTENT' },
  { code: 'metadata.manage', name: 'Quản lý metadata & xuất bản', description: 'Chỉnh sửa metadata, indexing, xuất bản lên OpenAccess', category: 'CONTENT' },
  { code: 'plagiarism.check', name: 'Kiểm tra đạo văn', description: 'Chạy kiểm tra đạo văn cho bài nộp', category: 'CONTENT' },
  { code: 'plagiarism.view', name: 'Xem kết quả kiểm tra đạo văn', description: 'Đọc báo cáo đạo văn', category: 'CONTENT' },
  { code: 'copyedit.manage', name: 'Biên tập bản thảo (Copyediting)', description: 'Quản lý quy trình hiệu đính bản thảo', category: 'CONTENT' },
  { code: 'production.manage', name: 'Quản lý dàn trang (Production)', description: 'Quản lý hàng đợi sản xuất và dàn trang', category: 'CONTENT' },

  // ── WORKFLOW: Quy trình biên tập ─────────────────────────────────────────
  { code: 'reviews.assign', name: 'Gán phản biện viên', description: 'Phân công phản biện cho bài nộp', category: 'WORKFLOW' },
  { code: 'reviews.submit', name: 'Nộp phản biện', description: 'Phản biện viên nộp kết quả đánh giá', category: 'WORKFLOW' },
  { code: 'reviews.view', name: 'Xem phản biện', description: 'Đọc kết quả và nhận xét phản biện', category: 'WORKFLOW' },
  { code: 'reviews.edit', name: 'Chỉnh sửa phản biện', description: 'Sửa phản biện sau khi đã nộp (quản trị)', category: 'WORKFLOW' },
  { code: 'reviews.delete', name: 'Xóa phản biện', description: 'Xóa kết quả phản biện', category: 'WORKFLOW' },
  { code: 'decisions.make', name: 'Ra quyết định biên tập', description: 'Chấp nhận, yêu cầu sửa, từ chối bài nộp', category: 'WORKFLOW' },
  { code: 'decisions.override', name: 'Ghi đè quyết định biên tập', description: 'Tổng biên tập ghi đè quyết định cấp dưới', category: 'WORKFLOW' },
  { code: 'workflow.manage', name: 'Quản lý trạng thái workflow', description: 'Điều phối toàn bộ workflow biên tập', category: 'WORKFLOW' },
  { code: 'workflow.assign_section', name: 'Phân công chuyên mục', description: 'Gán bài nộp vào chuyên mục biên tập', category: 'WORKFLOW' },
  { code: 'deadlines.manage', name: 'Quản lý thời hạn', description: 'Đặt và gia hạn deadline phản biện, biên tập', category: 'WORKFLOW' },
  { code: 'notifications.send', name: 'Gửi thông báo nội bộ', description: 'Gửi email/thông báo cho tác giả, phản biện', category: 'WORKFLOW' },

  // ── USERS: Người dùng & Phản biện viên ──────────────────────────────────
  { code: 'users.view', name: 'Xem người dùng', description: 'Xem danh sách và hồ sơ người dùng', category: 'USERS' },
  { code: 'users.create', name: 'Tạo người dùng', description: 'Tạo tài khoản người dùng mới', category: 'USERS' },
  { code: 'users.edit', name: 'Sửa người dùng', description: 'Cập nhật thông tin người dùng', category: 'USERS' },
  { code: 'users.delete', name: 'Xóa người dùng', description: 'Xóa hoặc vô hiệu hóa tài khoản', category: 'USERS' },
  { code: 'users.approve', name: 'Duyệt đăng ký người dùng', description: 'Xét duyệt yêu cầu tạo tài khoản mới', category: 'USERS' },
  { code: 'users.role_change', name: 'Đổi vai trò người dùng', description: 'Thay đổi vai trò/quyền hạn của tài khoản', category: 'USERS' },
  { code: 'users.impersonate', name: 'Đăng nhập thay người dùng', description: 'SYSADMIN đăng nhập với tư cách người dùng khác', category: 'USERS' },
  { code: 'reviewers.manage', name: 'Quản lý phản biện viên', description: 'Xem, thêm, sửa hồ sơ phản biện viên', category: 'USERS' },
  { code: 'reviewers.invite', name: 'Mời phản biện viên', description: 'Gửi lời mời phản biện qua email', category: 'USERS' },
  { code: 'role_escalation.view', name: 'Xem yêu cầu nâng cấp vai trò', description: 'Xem danh sách yêu cầu nâng quyền', category: 'USERS' },
  { code: 'role_escalation.approve', name: 'Duyệt yêu cầu nâng cấp vai trò', description: 'Phê duyệt hoặc từ chối yêu cầu nâng quyền', category: 'USERS' },

  // ── CMS: Quản lý nội dung website ────────────────────────────────────────
  { code: 'cms.homepage.manage', name: 'Quản lý trang chủ', description: 'Cấu hình nội dung và bố cục trang chủ', category: 'CMS' },
  { code: 'cms.news.manage', name: 'Quản lý tin tức', description: 'Viết, sửa, xóa tin tức trên website', category: 'CMS' },
  { code: 'cms.news.publish', name: 'Xuất bản tin tức', description: 'Đăng tin tức lên trang công khai', category: 'CMS' },
  { code: 'cms.banners.manage', name: 'Quản lý banner quảng cáo', description: 'Tạo và quản lý banner, slider trang chủ', category: 'CMS' },
  { code: 'cms.pages.manage', name: 'Quản lý trang tĩnh', description: 'Tạo và sửa các trang nội dung tĩnh', category: 'CMS' },
  { code: 'cms.navigation.manage', name: 'Quản lý menu điều hướng', description: 'Cấu hình menu và navigation toàn site', category: 'CMS' },
  { code: 'cms.media.manage', name: 'Quản lý thư viện media', description: 'Upload và quản lý file, hình ảnh, tài liệu', category: 'CMS' },
  { code: 'cms.videos.manage', name: 'Quản lý video', description: 'Quản lý video nhúng và thư viện video', category: 'CMS' },
  { code: 'cms.announcements.manage', name: 'Quản lý thông báo trang', description: 'Tạo thông báo và cảnh báo hiển thị trên website', category: 'CMS' },
  { code: 'cms.web_sources.manage', name: 'Quản lý nguồn thu thập web', description: 'Cấu hình crawler và nguồn nội dung tự động', category: 'CMS' },
  { code: 'cms.crawled_content.manage', name: 'Quản lý nội dung thu thập', description: 'Xem xét và xử lý nội dung đã thu thập từ web', category: 'CMS' },

  // ── SYSTEM: Quản trị hệ thống ─────────────────────────────────────────────
  { code: 'system.settings', name: 'Cài đặt hệ thống & website', description: 'Cấu hình toàn bộ thông số hệ thống', category: 'SYSTEM' },
  { code: 'system.integrations', name: 'Tích hợp bên thứ ba', description: 'Kết nối API bên ngoài, CrossRef, ORCID...', category: 'SYSTEM' },
  { code: 'system.categories', name: 'Quản lý chuyên mục tạp chí', description: 'Tạo và quản lý cây chuyên mục', category: 'SYSTEM' },
  { code: 'permissions.manage', name: 'Quản lý phân quyền RBAC', description: 'Cấu hình quyền hạn cho từng vai trò', category: 'SYSTEM' },
  { code: 'review.settings', name: 'Cài đặt quy trình phản biện', description: 'Cấu hình loại, thời hạn, tiêu chí phản biện', category: 'SYSTEM' },
  { code: 'ui.config', name: 'Giao diện & theme', description: 'Tùy chỉnh giao diện, màu sắc, logo website', category: 'SYSTEM' },
  { code: 'system.email_templates', name: 'Quản lý mẫu email', description: 'Tạo và sửa mẫu email hệ thống', category: 'SYSTEM' },
  { code: 'system.backup', name: 'Sao lưu & phục hồi', description: 'Thực hiện backup và restore dữ liệu', category: 'SYSTEM' },
  { code: 'system.maintenance', name: 'Chế độ bảo trì', description: 'Bật/tắt chế độ maintenance mode', category: 'SYSTEM' },
  { code: 'system.api_keys', name: 'Quản lý API keys', description: 'Tạo và quản lý API keys tích hợp', category: 'SYSTEM' },

  // ── SECURITY: Bảo mật & Kiểm toán ───────────────────────────────────────
  { code: 'security.logs', name: 'Xem log bảo mật & kiểm toán', description: 'Đọc audit log, access log toàn hệ thống', category: 'SECURITY' },
  { code: 'security.alerts', name: 'Xem cảnh báo bảo mật', description: 'Nhận và xem cảnh báo xâm nhập, bất thường', category: 'SECURITY' },
  { code: 'security.sessions', name: 'Quản lý phiên đăng nhập', description: 'Xem và thu hồi phiên đăng nhập', category: 'SECURITY' },
  { code: 'security.audit_export', name: 'Xuất báo cáo kiểm toán', description: 'Export log kiểm toán ra file CSV/PDF', category: 'SECURITY' },
  { code: 'security.ip_block', name: 'Chặn IP / bảo vệ rate limit', description: 'Cấu hình IP block list và rate limiting', category: 'SECURITY' },
  { code: 'security.2fa_manage', name: 'Quản lý xác thực 2 yếu tố', description: 'Bật/tắt bắt buộc 2FA cho vai trò', category: 'SECURITY' },

  // ── ANALYTICS: Thống kê & Báo cáo ───────────────────────────────────────
  { code: 'analytics.view', name: 'Xem phân tích chi tiết', description: 'Truy cập dashboard phân tích chuyên sâu', category: 'ANALYTICS' },
  { code: 'statistics.view', name: 'Xem thống kê tổng quan', description: 'Xem KPI và số liệu tổng quan hệ thống', category: 'ANALYTICS' },
  { code: 'reports.view', name: 'Xem báo cáo', description: 'Xem báo cáo định kỳ và tổng hợp', category: 'ANALYTICS' },
  { code: 'reports.export', name: 'Xuất báo cáo (Excel/PDF)', description: 'Export báo cáo ra file đính kèm', category: 'ANALYTICS' },
  { code: 'analytics.submissions', name: 'Thống kê bài nộp', description: 'Báo cáo số lượng, trạng thái bài nộp theo kỳ', category: 'ANALYTICS' },
  { code: 'analytics.reviews', name: 'Thống kê phản biện', description: 'Báo cáo hiệu suất và tiến độ phản biện', category: 'ANALYTICS' },
  { code: 'analytics.authors', name: 'Thống kê tác giả', description: 'Báo cáo tác giả theo tổ chức, quốc gia', category: 'ANALYTICS' },
  { code: 'analytics.readership', name: 'Thống kê lượt đọc & tải', description: 'Báo cáo traffic, download theo bài/số', category: 'ANALYTICS' },
]

// ─── Ma trận phân quyền cho từng vai trò ──────────────────────────────────────

// SYSADMIN xử lý riêng bằng grantAllToRole — không cần liệt kê ở đây
type SeedableRole = Exclude<Role, 'SYSADMIN'>

const ROLE_PERMISSION_MATRIX: Record<SeedableRole, string[]> = {

  // Độc giả: chỉ xem nội dung công khai, không có quyền quản trị
  READER: [
    'statistics.view',
  ],

  // Tác giả: nộp bài, quản lý bài của mình, xem phản hồi
  AUTHOR: [
    'submissions.view',
    'submissions.create',
    'submissions.edit',
    'submissions.withdraw',
    'plagiarism.view',
    'statistics.view',
  ],

  // Phản biện viên: nhận và nộp phản biện
  REVIEWER: [
    'submissions.view',
    'reviews.submit',
    'reviews.view',
    'statistics.view',
  ],

  // Biên tập chuyên mục: quản lý bài trong chuyên mục của mình
  SECTION_EDITOR: [
    'submissions.view',
    'submissions.edit',
    'articles.view',
    'reviews.assign',
    'reviews.view',
    'decisions.make',
    'workflow.assign_section',
    'deadlines.manage',
    'notifications.send',
    'plagiarism.check',
    'plagiarism.view',
    'copyedit.manage',
    'production.manage',
    'users.view',
    'reviewers.manage',
    'reviewers.invite',
    'statistics.view',
    'analytics.submissions',
    'analytics.reviews',
  ],

  // Biên tập dàn trang: tập trung vào production/layout
  LAYOUT_EDITOR: [
    'submissions.view',
    'articles.view',
    'issues.view',
    'production.manage',
    'copyedit.manage',
    'metadata.manage',
    'articles.doi',
    'statistics.view',
  ],

  // Tổng biên tập điều hành (Managing Editor): quyền quản lý toàn bộ workflow
  MANAGING_EDITOR: [
    // Bài nộp & bài báo
    'submissions.view', 'submissions.create', 'submissions.edit',
    'articles.view', 'articles.publish', 'articles.unpublish', 'articles.doi',
    // Số & tập
    'issues.view', 'issues.manage', 'issues.publish',
    'volumes.manage', 'keywords.manage', 'metadata.manage',
    // Workflow
    'reviews.assign', 'reviews.submit', 'reviews.view', 'reviews.edit',
    'decisions.make', 'workflow.manage', 'workflow.assign_section',
    'deadlines.manage', 'notifications.send',
    'copyedit.manage', 'production.manage',
    // Đạo văn
    'plagiarism.check', 'plagiarism.view',
    // Cài đặt phản biện
    'review.settings',
    // Người dùng
    'users.view', 'users.create', 'users.edit', 'users.approve',
    'reviewers.manage', 'reviewers.invite',
    'role_escalation.view',
    // CMS & Website
    'cms.homepage.manage', 'cms.pages.manage', 'cms.news.manage', 'cms.news.publish',
    'cms.banners.manage', 'cms.media.manage', 'cms.videos.manage',
    'cms.navigation.manage', 'cms.announcements.manage',
    'system.settings', 'system.categories', 'system.email_templates',
    // Thống kê & báo cáo
    'statistics.view', 'analytics.view', 'reports.view', 'reports.export',
    'analytics.submissions', 'analytics.reviews', 'analytics.authors', 'analytics.readership',
    // Bảo mật (mức quan sát)
    'security.sessions', 'security.alerts', 'security.logs',
  ],

  // Kiểm định bảo mật: chuyên về audit và security, không có quyền biên tập
  SECURITY_AUDITOR: [
    'security.logs',
    'security.alerts',
    'security.sessions',
    'security.audit_export',
    'security.ip_block',
    'security.2fa_manage',
    'users.view',
    'statistics.view',
    'analytics.view',
    'reports.view',
    'reports.export',
    'role_escalation.view',
  ],

  // Phó Tổng biên tập (Deputy EIC): giám sát toàn tòa soạn ngang Tổng biên tập,
  // NHƯNG không có quyền ký xuất bản cuối, ghi đè quyết định, đổi vai trò hay
  // duyệt nâng quyền (những quyền đó dành riêng cho Tổng biên tập / SYSADMIN).
  DEPUTY_EIC: [
    // Nội dung (không có articles.publish/unpublish/archive, issues.publish)
    'submissions.view', 'submissions.create', 'submissions.edit', 'submissions.delete',
    'articles.view', 'articles.doi',
    'issues.view', 'issues.manage',
    'volumes.manage', 'keywords.manage', 'metadata.manage',
    // Workflow (không có decisions.override)
    'reviews.assign', 'reviews.submit', 'reviews.view', 'reviews.edit', 'reviews.delete',
    'decisions.make', 'workflow.manage', 'workflow.assign_section',
    'deadlines.manage', 'notifications.send',
    'copyedit.manage', 'production.manage',
    // Đạo văn
    'plagiarism.check', 'plagiarism.view',
    // Người dùng (không có users.role_change, role_escalation.approve)
    'users.view', 'users.create', 'users.edit', 'users.approve',
    'reviewers.manage', 'reviewers.invite',
    'role_escalation.view',
    // CMS đầy đủ
    'cms.homepage.manage', 'cms.pages.manage', 'cms.news.manage', 'cms.news.publish',
    'cms.banners.manage', 'cms.media.manage', 'cms.videos.manage',
    'cms.navigation.manage', 'cms.announcements.manage',
    'cms.web_sources.manage', 'cms.crawled_content.manage',
    // Hệ thống
    'system.settings', 'system.categories', 'system.email_templates',
    'review.settings', 'ui.config',
    // Thống kê toàn bộ
    'statistics.view', 'analytics.view', 'reports.view', 'reports.export',
    'analytics.submissions', 'analytics.reviews', 'analytics.authors', 'analytics.readership',
    // Bảo mật (mức quan sát)
    'security.sessions', 'security.alerts', 'security.logs', 'security.audit_export',
  ],

  // Tổng biên tập (EIC): quyền tối cao về nội dung và biên tập
  EIC: [
    // Toàn bộ nội dung
    'submissions.view', 'submissions.create', 'submissions.edit', 'submissions.delete',
    'articles.view', 'articles.publish', 'articles.unpublish', 'articles.archive', 'articles.doi',
    'issues.view', 'issues.manage', 'issues.publish',
    'volumes.manage', 'keywords.manage', 'metadata.manage',
    // Toàn bộ workflow
    'reviews.assign', 'reviews.submit', 'reviews.view', 'reviews.edit', 'reviews.delete',
    'decisions.make', 'decisions.override', 'workflow.manage', 'workflow.assign_section',
    'deadlines.manage', 'notifications.send',
    'copyedit.manage', 'production.manage',
    // Đạo văn
    'plagiarism.check', 'plagiarism.view',
    // Người dùng
    'users.view', 'users.create', 'users.edit', 'users.approve', 'users.role_change',
    'reviewers.manage', 'reviewers.invite',
    'role_escalation.view', 'role_escalation.approve',
    // CMS đầy đủ
    'cms.homepage.manage', 'cms.pages.manage', 'cms.news.manage', 'cms.news.publish',
    'cms.banners.manage', 'cms.media.manage', 'cms.videos.manage',
    'cms.navigation.manage', 'cms.announcements.manage',
    'cms.web_sources.manage', 'cms.crawled_content.manage',
    // Hệ thống
    'system.settings', 'system.categories', 'system.email_templates',
    'review.settings', 'ui.config',
    // Thống kê toàn bộ
    'statistics.view', 'analytics.view', 'reports.view', 'reports.export',
    'analytics.submissions', 'analytics.reviews', 'analytics.authors', 'analytics.readership',
    // Bảo mật
    'security.sessions', 'security.alerts', 'security.logs', 'security.audit_export',
  ],

  // SYSADMIN: được xử lý riêng bằng grantAllToRole() — nhận toàn bộ quyền active

  // Commander (Chỉ huy / Giám sát): xem toàn cảnh, không can thiệp biên tập
  COMMANDER: [
    'statistics.view',
    'analytics.view',
    'reports.view',
    'reports.export',
    'analytics.submissions',
    'analytics.reviews',
    'analytics.authors',
    'analytics.readership',
    'users.view',
    'security.alerts',
    'security.logs',
  ],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function grantByCode(role: Role, codes: string[]): Promise<number> {
  if (codes.length === 0) return 0
  const perms = await prisma.permission.findMany({
    where: { code: { in: codes }, isActive: true },
  })
  for (const p of perms) {
    await prisma.rolePermission.upsert({
      where: { role_permissionId: { role, permissionId: p.id } },
      update: { isGranted: true },
      create: { role, permissionId: p.id, isGranted: true },
    })
  }
  return perms.length
}

async function grantAllToRole(role: Role): Promise<number> {
  const perms = await prisma.permission.findMany({ where: { isActive: true } })
  for (const p of perms) {
    await prisma.rolePermission.upsert({
      where: { role_permissionId: { role, permissionId: p.id } },
      update: { isGranted: true },
      create: { role, permissionId: p.id, isGranted: true },
    })
  }
  return perms.length
}

// ─── POST /api/permissions/seed ─────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session || session.role !== 'SYSADMIN') {
      return NextResponse.json(
        { error: 'Chỉ SYSADMIN mới có quyền seed permissions' },
        { status: 403 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const resetGrants = body?.resetGrants === true

    // 1. Upsert permissions — thêm mới, cập nhật description nếu thiếu
    let added = 0
    for (const perm of DEFAULT_PERMISSIONS) {
      const existing = await prisma.permission.findUnique({ where: { code: perm.code } })
      if (!existing) {
        await prisma.permission.create({ data: perm })
        added++
      } else if (!existing.description && perm.description) {
        await prisma.permission.update({
          where: { id: existing.id },
          data: { description: perm.description },
        })
      }
    }

    const totalCount = await prisma.permission.count({ where: { isActive: true } })

    // 2. resetGrants: thu hồi tất cả rồi cấp lại sạch theo ma trận
    if (resetGrants) {
      await prisma.rolePermission.deleteMany({})
    }

    // 3. Grant theo ma trận — SYSADMIN luôn nhận toàn bộ quyền active
    const grants: Record<string, number> = {}
    for (const [role, codes] of Object.entries(ROLE_PERMISSION_MATRIX)) {
      grants[role] = await grantByCode(role as Role, codes)
    }
    grants['SYSADMIN'] = await grantAllToRole('SYSADMIN' as Role)

    clearPermissionsCache()

    return NextResponse.json({
      success: true,
      message: added > 0
        ? `Đã thêm ${added} permission mới, tổng ${totalCount} quyền`
        : `Tất cả ${totalCount} permissions đã tồn tại — đã cập nhật phân quyền`,
      added,
      total: totalCount,
      resetGrants,
      grants,
    })
  } catch (error: any) {
    console.error('Error seeding permissions:', error)
    return NextResponse.json(
      { error: error.message || 'Có lỗi xảy ra khi seed permissions' },
      { status: 500 }
    )
  }
}
