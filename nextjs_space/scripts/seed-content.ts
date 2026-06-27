/**
 * Seed NỘI DUNG & VẬN HÀNH end-to-end — Tạp chí Nghệ thuật Quân sự Việt Nam.
 *
 * Lấp các "khoảng trống" còn lại để test TOÀN BỘ hệ thống (bổ sung cho
 * seed:production + seed:workflow vốn chỉ phủ vòng đời bài nộp). Seed các module
 * user-facing đang trống nhưng có route/UI tiêu thụ thật:
 *
 *   Trang công khai : Banner (slider trang chủ), Media (thư viện ảnh),
 *                     HomepageSection, FeaturedArticle, ArticleComment, ArticleMetrics
 *   Tra cứu/biên tập: Keyword (taxonomy), Deadline (mốc hạn quy trình),
 *                     SubmissionComment (trao đổi BTV↔tác giả)
 *   Bảo mật         : SecurityAlert (dashboard Kiểm soát bảo mật)
 *
 * KHÔNG seed NavigationItem: header công khai render menu phẳng từ /api/navigation,
 * trong khi fallbackMenuItems (components/header.tsx) có dropdown phong phú hơn —
 * seed phẳng sẽ làm mất dropdown (regression). Giữ fallback.
 *
 * Nguyên tắc: tái sử dụng bài/tài khoản/ảnh NTQS đã có; idempotent (upsert theo
 * unique hoặc check tồn tại); toàn bộ nội dung đúng thương hiệu NTQS — HVQPh.
 *
 * Yêu cầu trước: seed:demo-accounts, và nên có seed:production (để có Article đã
 * xuất bản cho FeaturedArticle/ArticleComment/ArticleMetrics) + seed:workflow
 * (để có submission NTQS-FLOW cho Deadline/SubmissionComment).
 *
 * Chạy: npm run seed:content
 */
import { PrismaClient, type DeadlineType } from '@prisma/client'

const prisma = new PrismaClient()
const DAY_MS = 24 * 60 * 60 * 1000

// ── Tài khoản demo theo vai trò ───────────────────────────────────────────────
const EMAILS = {
  admin: 'admin@tapchintqsvn.edu.vn',
  eic: 'tongbientap@tapchintqsvn.edu.vn',
  sectionEditor: 'bientap@tapchintqsvn.edu.vn',
  author: 'tacgia@tapchintqsvn.edu.vn',
  reviewer: 'phanbien@tapchintqsvn.edu.vn',
  reader: 'docgia@tapchintqsvn.edu.vn',
  securityAuditor: 'baomat@tapchintqsvn.edu.vn',
} as const

async function findUser(email: string) {
  return prisma.user.findFirst({ where: { email }, select: { id: true } })
}

// ── 1. Banner: slider trang chủ (HOME_SLIDER) + banner khuyến mại ─────────────
async function seedBanners(adminId: string | null) {
  const sliders = [
    {
      title: 'Tạp chí Nghệ thuật Quân sự Việt Nam',
      subtitle: 'Diễn đàn khoa học về nghệ thuật quân sự — Học viện Quốc phòng',
      imageUrl: '/banner-pc.png', buttonText: 'Khám phá số mới', linkUrl: '/issues/latest',
    },
    {
      title: 'Năm thứ 39 — Tiếp nối truyền thống học thuật',
      subtitle: 'Nghiên cứu chiến lược, chiến dịch, chiến thuật và lịch sử quân sự',
      imageUrl: '/banner-new.png', buttonText: 'Đọc các số tạp chí', linkUrl: '/archive',
    },
    {
      title: 'Kho tư liệu nghệ thuật quân sự',
      subtitle: 'Hơn 500 bài nghiên cứu, tra cứu toàn văn trên Thư viện số',
      imageUrl: '/banner-tablet.png', buttonText: 'Vào Thư viện', linkUrl: '/library',
    },
  ]
  let created = 0
  for (let i = 0; i < sliders.length; i++) {
    const s = sliders[i]
    const existing = await prisma.banner.findFirst({ where: { title: s.title, targetRole: 'HOME_SLIDER' } })
    if (existing) continue
    await prisma.banner.create({
      data: {
        ...s, altText: s.title, deviceType: 'all', position: i, isActive: true,
        targetRole: 'HOME_SLIDER', linkTarget: '_self', createdBy: adminId ?? undefined,
      },
    })
    created++
  }

  // Banner khuyến mại chung (không gắn HOME_SLIDER) — hiển thị ở dải banner phụ.
  const promos = [
    { title: 'Mời viết bài số chuyên đề Nghệ thuật chiến dịch', subtitle: 'Hạn nhận bài: 30/9/2026', imageUrl: '/images/hero/hero_1.jpg', linkUrl: '/pages/author-guidelines', position: 10 },
    { title: 'Hướng dẫn quy trình phản biện khoa học', subtitle: 'Quy trình phản biện kín hai chiều', imageUrl: '/images/hero/hero_2.jpg', linkUrl: '/pages/review-policy', position: 11 },
  ]
  for (const p of promos) {
    const existing = await prisma.banner.findFirst({ where: { title: p.title } })
    if (existing) continue
    await prisma.banner.create({
      data: {
        title: p.title, subtitle: p.subtitle, imageUrl: p.imageUrl, altText: p.title,
        linkUrl: p.linkUrl, buttonText: 'Xem chi tiết', deviceType: 'all', position: p.position,
        isActive: true, linkTarget: '_self', createdBy: adminId ?? undefined,
        startDate: new Date(Date.now() - 5 * DAY_MS), endDate: new Date(Date.now() + 60 * DAY_MS),
      },
    })
    created++
  }
  return created
}

// ── 2. Media: thư viện ảnh (gallery trang chủ + CMS media) ────────────────────
async function seedMedia(adminId: string | null) {
  const items = [
    { path: '/images/hvqp/hvqp-01.jpg', title: 'Học viện Quốc phòng', cat: 'general' },
    { path: '/images/hvqp/hvqp-02.jpg', title: 'Hội thảo khoa học quân sự', cat: 'general' },
    { path: '/images/hvqp/hvqp-03.jpg', title: 'Hoạt động nghiên cứu', cat: 'general' },
    { path: '/images/hvqp/hvqp-04.jpg', title: 'Lễ kỷ niệm truyền thống', cat: 'general' },
    { path: '/images/articles/research_1.jpg', title: 'Nghiên cứu nghệ thuật tác chiến', cat: 'article' },
    { path: '/images/articles/research_2.jpg', title: 'Tọa đàm chiến lược quốc phòng', cat: 'article' },
    { path: '/images/articles/conference_2.jpg', title: 'Hội nghị khoa học', cat: 'article' },
    { path: '/images/hero/hero_1.jpg', title: 'Diễn tập hiệp đồng quân binh chủng', cat: 'banner' },
  ]
  let created = 0
  for (const m of items) {
    const existing = await prisma.media.findUnique({ where: { cloudStoragePath: m.path } })
    if (existing) continue
    await prisma.media.create({
      data: {
        fileName: m.path.split('/').pop()!,
        fileType: 'image/jpeg',
        fileSize: 1024 * 220,
        cloudStoragePath: m.path,
        altText: `${m.title} — Tạp chí Nghệ thuật Quân sự Việt Nam`,
        title: m.title,
        description: `Hình ảnh tư liệu: ${m.title}`,
        category: m.cat,
        width: 1280, height: 800, isPublic: true,
        uploadedBy: adminId ?? undefined,
        usageCount: 0,
      },
    })
    created++
  }
  return created
}

// ── 3. HomepageSection: cấu trúc trang chủ ────────────────────────────────────
async function seedHomepageSections() {
  const sections = [
    { key: 'hero', type: 'hero', title: 'Tạp chí Nghệ thuật Quân sự Việt Nam', subtitle: 'Journal of Vietnamese Military Art — Học viện Quốc phòng', order: 0 },
    { key: 'featured_articles', type: 'articles', title: 'Bài viết tiêu biểu', subtitle: 'Những nghiên cứu nổi bật về nghệ thuật quân sự', order: 1, settings: { limit: 6, layout: 'grid' } },
    { key: 'latest_issues', type: 'issues', title: 'Số mới nhất', subtitle: 'Các số tạp chí vừa xuất bản', order: 2, settings: { limit: 4 } },
    { key: 'stats', type: 'stats', title: 'Tạp chí qua những con số', subtitle: 'Năm thứ 39 — kể từ 1987', order: 3, content: JSON.stringify({ issues: 39, articles: 520, authors: 350 }) },
    { key: 'about_snippet', type: 'text', title: 'Về Tạp chí', subtitle: null, order: 4, content: 'Tạp chí Nghệ thuật Quân sự Việt Nam là diễn đàn khoa học của Học viện Quốc phòng, công bố các nghiên cứu về chiến lược, chiến dịch, chiến thuật và lịch sử quân sự.', linkText: 'Tìm hiểu thêm', linkUrl: '/pages/about' },
    { key: 'cta', type: 'newsletter', title: 'Gửi bài nghiên cứu', subtitle: 'Mời các nhà khoa học, cán bộ nghiên cứu gửi bài cộng tác', order: 5, linkText: 'Hướng dẫn gửi bài', linkUrl: '/pages/author-guidelines' },
  ]
  let n = 0
  for (const s of sections) {
    await prisma.homepageSection.upsert({
      where: { key: s.key },
      update: {}, // idempotent: không ghi đè chỉnh sửa thủ công sau này
      create: {
        key: s.key, type: s.type, title: s.title, subtitle: s.subtitle ?? null,
        content: s.content ?? null, linkText: s.linkText ?? null, linkUrl: s.linkUrl ?? null,
        settings: (s.settings as any) ?? undefined, order: s.order, isActive: true,
      },
    })
    n++
  }
  return n
}

// ── 3b. Chuẩn hóa: bài ĐÃ XUẤT BẢN phải APPROVED để hiển thị công khai ────────
// Trang chủ & danh sách công khai lọc approvalStatus='APPROVED'. Một số bài seed
// cũ có publishedAt + submission PUBLISHED nhưng approvalStatus còn PENDING → bị
// ẩn khỏi công khai. Đây là sửa lệch dữ liệu an toàn (bài vốn đã xuất bản rồi).
async function normalizePublishedApproval(eicId: string | null) {
  const targets = await prisma.article.findMany({
    where: {
      publishedAt: { not: null },
      approvalStatus: { not: 'APPROVED' },
      submission: { status: 'PUBLISHED' },
    },
    select: { id: true },
  })
  if (!targets.length) return 0
  await prisma.article.updateMany({
    where: { id: { in: targets.map((t) => t.id) } },
    data: { approvalStatus: 'APPROVED', approvedBy: eicId ?? undefined, approvedAt: new Date() },
  })
  return targets.length
}

// ── 4. FeaturedArticle: chọn bài tiêu biểu (từ bài đã xuất bản) ───────────────
// Cap ở TARGET bài; ổn định khi chạy lại (không tích lũy): chỉ bổ sung khi còn
// thiếu, chọn bài chưa được feature. Không xóa featured đã có (có thể do người
// dùng tự chọn) — chỉ thêm cho đủ.
const FEATURED_TARGET = 4
async function seedFeaturedArticles() {
  const current = await prisma.featuredArticle.count({ where: { isActive: true } })
  if (current >= FEATURED_TARGET) return 0

  const featuredIds = (await prisma.featuredArticle.findMany({ select: { articleId: true } })).map((f) => f.articleId)
  const candidates = await prisma.article.findMany({
    where: {
      publishedAt: { not: null },
      approvalStatus: 'APPROVED',
      id: { notIn: featuredIds.length ? featuredIds : undefined },
    },
    orderBy: { publishedAt: 'desc' },
    take: FEATURED_TARGET - current,
    select: { id: true },
  })
  const reasons = [
    'Nghiên cứu tiêu biểu về nghệ thuật tác chiến hiện đại',
    'Bài có giá trị lý luận và thực tiễn cao',
    'Được hội đồng biên tập đánh giá xuất sắc',
    'Chủ đề thời sự, thu hút nhiều bạn đọc',
  ]
  let n = 0
  for (let i = 0; i < candidates.length; i++) {
    await prisma.featuredArticle.upsert({
      where: { articleId: candidates[i].id },
      update: {},
      create: { articleId: candidates[i].id, position: current + i, reason: reasons[(current + i) % reasons.length], isActive: true },
    })
    n++
  }
  return n
}

// ── 5. Keyword: taxonomy từ khóa nghệ thuật quân sự ──────────────────────────
async function seedKeywords() {
  const keywords: Array<{ term: string; category: string; usage: number; synonyms?: string[]; related?: string[] }> = [
    { term: 'nghệ thuật quân sự', category: 'Khoa học quân sự', usage: 42, related: ['nghệ thuật tác chiến', 'chiến lược quân sự'] },
    { term: 'chiến lược quân sự', category: 'Chiến lược', usage: 35, synonyms: ['chiến lược quốc phòng'] },
    { term: 'nghệ thuật tác chiến', category: 'Tác chiến', usage: 38, related: ['chiến dịch', 'chiến thuật'] },
    { term: 'chiến dịch', category: 'Chiến dịch học', usage: 29, synonyms: ['nghệ thuật chiến dịch'] },
    { term: 'chiến thuật', category: 'Chiến thuật học', usage: 27 },
    { term: 'phòng thủ', category: 'Tác chiến', usage: 21, related: ['tác chiến phòng ngự'] },
    { term: 'tiến công', category: 'Tác chiến', usage: 24, related: ['chiến dịch tiến công'] },
    { term: 'hiệp đồng quân binh chủng', category: 'Tác chiến', usage: 18 },
    { term: 'chiến tranh nhân dân', category: 'Lý luận quân sự', usage: 31, related: ['quốc phòng toàn dân'] },
    { term: 'quốc phòng toàn dân', category: 'Quốc phòng', usage: 26, related: ['thế trận quốc phòng'] },
    { term: 'Bộ đội Cụ Hồ', category: 'Giáo dục quân sự', usage: 15 },
    { term: 'tác chiến điện tử', category: 'Công nghệ quân sự', usage: 12, related: ['vũ khí công nghệ cao'] },
    { term: 'vũ khí công nghệ cao', category: 'Công nghệ quân sự', usage: 14 },
    { term: 'lịch sử quân sự', category: 'Lịch sử quân sự', usage: 33, related: ['truyền thống quân đội'] },
    { term: 'hợp tác quốc phòng', category: 'Đối ngoại quốc phòng', usage: 19, synonyms: ['đối ngoại quốc phòng'] },
    { term: 'bảo vệ Tổ quốc', category: 'Quốc phòng', usage: 28 },
  ]
  let n = 0
  for (const k of keywords) {
    await prisma.keyword.upsert({
      where: { term: k.term },
      update: { usage: k.usage, category: k.category },
      create: {
        term: k.term, category: k.category, usage: k.usage,
        synonyms: k.synonyms ?? [], relatedTerms: k.related ?? [],
      },
    })
    n++
  }
  return n
}

// ── 6. ArticleComment: bình luận bạn đọc (có duyệt + chờ duyệt) ───────────────
async function seedArticleComments(readerId: string | null) {
  const articles = await prisma.article.findMany({
    where: { publishedAt: { not: null } },
    orderBy: { publishedAt: 'desc' },
    take: 4,
    select: { id: true },
  })
  if (!articles.length) return 0
  // [content, isApproved, dùng tài khoản bạn đọc?]
  const templates: Array<[string, boolean, boolean]> = [
    ['Bài viết rất sâu sắc, làm rõ nhiều vấn đề lý luận về nghệ thuật tác chiến. Cảm ơn tòa soạn.', true, true],
    ['Mong tạp chí có thêm các nghiên cứu so sánh với kinh nghiệm quân sự quốc tế.', true, false],
    ['Phần phân tích thực tiễn rất thuyết phục, có giá trị tham khảo cho công tác huấn luyện.', true, true],
    ['Bình luận đang chờ kiểm duyệt — nội dung góp ý về tài liệu tham khảo.', false, false],
  ]
  let n = 0
  for (let i = 0; i < articles.length; i++) {
    const [content, isApproved, useReader] = templates[i % templates.length]
    const exists = await prisma.articleComment.findFirst({ where: { articleId: articles[i].id, content } })
    if (exists) continue
    await prisma.articleComment.create({
      data: {
        articleId: articles[i].id,
        userId: useReader ? readerId ?? undefined : undefined, // undefined = ẩn danh
        content, isApproved,
        createdAt: new Date(Date.now() - (i + 1) * 2 * DAY_MS),
      },
    })
    n++
  }
  return n
}

// ── 7. ArticleMetrics: chỉ số lượt xem/tải + đồng bộ Article.views/downloads ──
async function seedArticleMetrics() {
  const articles = await prisma.article.findMany({
    where: { publishedAt: { not: null } },
    select: { id: true },
  })
  let n = 0
  for (let i = 0; i < articles.length; i++) {
    // Số liệu giảm dần để có "bài xem nhiều nhất" rõ ràng.
    const views = 1200 - i * 70 + ((i * 37) % 50)
    const downloads = Math.round(views * 0.35)
    const citations = Math.max(0, 12 - i)
    await prisma.articleMetrics.upsert({
      where: { articleId: articles[i].id },
      update: { views, downloads, citations },
      create: {
        articleId: articles[i].id, views, downloads, citations,
        viewsByCountry: { VN: Math.round(views * 0.8), US: Math.round(views * 0.08), Other: Math.round(views * 0.12) },
        viewsByMonth: { '2026-04': Math.round(views * 0.3), '2026-05': Math.round(views * 0.35), '2026-06': Math.round(views * 0.35) },
        lastViewedAt: new Date(Date.now() - (i % 5) * DAY_MS),
        lastDownloadedAt: new Date(Date.now() - (i % 7) * DAY_MS),
      },
    })
    // Đồng bộ counter trên Article (trang chủ "xem nhiều nhất" sắp theo Article.views).
    await prisma.article.update({ where: { id: articles[i].id }, data: { views, downloads } })
    n++
  }
  return n
}

// ── 8. Deadline: mốc hạn quy trình cho bài NTQS-FLOW ──────────────────────────
async function seedDeadlines(actors: { reviewer: string | null; sectionEditor: string | null; author: string | null }) {
  // [code bài, loại hạn, lệch ngày so với hôm nay (âm = quá hạn), người phụ trách]
  const plan: Array<[string, DeadlineType, number, string | null]> = [
    ['NTQS-FLOW-003', 'INITIAL_REVIEW', 5, actors.reviewer],
    ['NTQS-FLOW-004', 'INITIAL_REVIEW', -2, actors.reviewer], // quá hạn
    ['NTQS-FLOW-005', 'EDITOR_DECISION', 3, actors.sectionEditor],
    ['NTQS-FLOW-006', 'REVISION_SUBMIT', 7, actors.author],
    ['NTQS-FLOW-007', 'PRODUCTION', 10, actors.sectionEditor],
  ]
  let n = 0
  for (const [code, type, offsetDays, assignedTo] of plan) {
    const sub = await prisma.submission.findFirst({ where: { code }, select: { id: true } })
    if (!sub) continue
    const exists = await prisma.deadline.findFirst({ where: { submissionId: sub.id, type } })
    if (exists) continue
    const dueDate = new Date(Date.now() + offsetDays * DAY_MS)
    await prisma.deadline.create({
      data: {
        submissionId: sub.id, type, dueDate,
        assignedTo: assignedTo ?? undefined,
        isOverdue: offsetDays < 0,
        remindersSent: offsetDays < 0 ? 1 : 0,
        note: offsetDays < 0 ? 'Đã quá hạn — cần nhắc người phụ trách.' : 'Mốc hạn theo quy trình biên tập.',
      },
    })
    n++
  }
  return n
}

// ── 9. SubmissionComment: trao đổi biên tập viên ↔ tác giả ────────────────────
async function seedSubmissionComments(editorId: string | null, authorId: string | null) {
  if (!editorId || !authorId) return 0
  // [code bài, người bình luận, trang, nội dung, đã giải quyết]
  const plan: Array<[string, string, number, string, boolean]> = [
    ['NTQS-FLOW-005', editorId, 1, 'Đề nghị tác giả làm rõ tính mới ở phần mở đầu so với các nghiên cứu đã công bố.', false],
    ['NTQS-FLOW-005', authorId, 1, 'Cảm ơn biên tập viên, tôi sẽ bổ sung đoạn so sánh và trích dẫn nguồn.', false],
    ['NTQS-FLOW-006', editorId, 3, 'Phần phân tích số liệu trang 3 cần bổ sung dẫn chứng cụ thể.', false],
    ['NTQS-FLOW-006', editorId, 1, 'Đã thống nhất chỉnh sửa tiêu đề mục 1 cho súc tích hơn.', true],
  ]
  let n = 0
  for (const [code, commenterId, pageNumber, content, resolved] of plan) {
    const sub = await prisma.submission.findFirst({ where: { code }, select: { id: true } })
    if (!sub) continue
    const exists = await prisma.submissionComment.findFirst({ where: { submissionId: sub.id, content } })
    if (exists) continue
    await prisma.submissionComment.create({
      data: { submissionId: sub.id, authorId: commenterId, pageNumber, content, resolved },
    })
    n++
  }
  return n
}

// ── 10. SecurityAlert: cảnh báo cho dashboard Kiểm soát bảo mật ───────────────
async function seedSecurityAlerts(actors: {
  reader: string | null; author: string | null; reviewer: string | null; securityAuditor: string | null
}) {
  const alerts = [
    { type: 'BRUTE_FORCE', severity: 'HIGH', status: 'PENDING', userId: null as string | null, ip: '203.0.113.45', desc: 'Phát hiện 12 lần đăng nhập thất bại liên tiếp trong 5 phút từ một địa chỉ IP.', reviewedBy: null as string | null },
    { type: 'SUSPICIOUS_IP', severity: 'MEDIUM', status: 'REVIEWED', userId: actors.reviewer, ip: '198.51.100.7', desc: 'Đăng nhập từ địa chỉ IP lạ, khác vùng địa lý thường dùng.', reviewedBy: actors.securityAuditor },
    { type: 'UNUSUAL_ACTIVITY', severity: 'LOW', status: 'RESOLVED', userId: actors.reader, ip: '10.0.12.5', desc: 'Truy cập nhiều trang quản trị trong thời gian ngắn (đã xác minh hợp lệ).', reviewedBy: actors.securityAuditor },
    { type: 'ROLE_ESCALATION', severity: 'CRITICAL', status: 'PENDING', userId: actors.author, ip: '10.0.12.31', desc: 'Tài khoản tác giả gửi yêu cầu nâng quyền bất thường — cần kiểm tra.', reviewedBy: null },
    { type: 'DATA_ACCESS', severity: 'MEDIUM', status: 'PENDING', userId: actors.reviewer, ip: '10.0.12.9', desc: 'Tải xuống số lượng lớn bản thảo trong một phiên làm việc.', reviewedBy: null },
  ] as const
  let n = 0
  for (const a of alerts) {
    const exists = await prisma.securityAlert.findFirst({ where: { type: a.type as any, description: a.desc } })
    if (exists) continue
    await prisma.securityAlert.create({
      data: {
        type: a.type as any, severity: a.severity as any, status: a.status as any,
        userId: a.userId ?? undefined, ipAddress: a.ip,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        description: a.desc,
        metadata: { source: 'seed:content', detectedAt: new Date().toISOString() },
        reviewedBy: a.reviewedBy ?? undefined,
        reviewedAt: a.status !== 'PENDING' ? new Date(Date.now() - 1 * DAY_MS) : undefined,
        notes: a.status === 'RESOLVED' ? 'Đã xác minh, không phải sự cố thật.' : undefined,
      },
    })
    n++
  }
  return n
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Seeding NỘI DUNG & VẬN HÀNH (toàn hệ thống) — Tạp chí Nghệ thuật Quân sự Việt Nam\n')

  const [admin, eic, sectionEditor, author, reviewer, reader, securityAuditor] = await Promise.all([
    findUser(EMAILS.admin), findUser(EMAILS.eic), findUser(EMAILS.sectionEditor),
    findUser(EMAILS.author), findUser(EMAILS.reviewer), findUser(EMAILS.reader),
    findUser(EMAILS.securityAuditor),
  ])
  const adminId = admin?.id ?? eic?.id ?? null
  if (!adminId) console.warn('  ⚠️  Không thấy tài khoản admin/EIC — Banner/Media sẽ không gắn người tạo.')

  const normalizedApproval = await normalizePublishedApproval(eic?.id ?? null)
  const r = {
    banners: await seedBanners(adminId),
    media: await seedMedia(adminId),
    homepage: await seedHomepageSections(),
    featured: await seedFeaturedArticles(),
    keywords: await seedKeywords(),
    comments: await seedArticleComments(reader?.id ?? null),
    metrics: await seedArticleMetrics(),
    deadlines: await seedDeadlines({ reviewer: reviewer?.id ?? null, sectionEditor: sectionEditor?.id ?? null, author: author?.id ?? null }),
    subComments: await seedSubmissionComments(sectionEditor?.id ?? null, author?.id ?? null),
    alerts: await seedSecurityAlerts({ reader: reader?.id ?? null, author: author?.id ?? null, reviewer: reviewer?.id ?? null, securityAuditor: securityAuditor?.id ?? null }),
  }

  console.log(`🔧 Chuẩn hóa bài đã xuất bản → APPROVED: ${normalizedApproval} (để hiển thị công khai)`)
  console.log('🖼️  Trang công khai:')
  console.log(`   • Banner slider/khuyến mại : +${r.banners}`)
  console.log(`   • Media (thư viện ảnh)      : +${r.media}`)
  console.log(`   • HomepageSection           : ${r.homepage} (upsert)`)
  console.log(`   • FeaturedArticle           : ${r.featured} (upsert)`)
  console.log(`   • ArticleComment            : +${r.comments}`)
  console.log(`   • ArticleMetrics            : ${r.metrics} (upsert + sync Article.views)`)
  console.log('🔎 Tra cứu / biên tập:')
  console.log(`   • Keyword (taxonomy)        : ${r.keywords} (upsert)`)
  console.log(`   • Deadline (mốc hạn)        : +${r.deadlines}`)
  console.log(`   • SubmissionComment         : +${r.subComments}`)
  console.log('🛡️  Bảo mật:')
  console.log(`   • SecurityAlert             : +${r.alerts}`)

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✅ Seed nội dung & vận hành (NTQS) hoàn thành!')
  console.log('\n🔗 Gợi ý kiểm thử:')
  console.log('   • Trang chủ      : http://localhost:3001/            (slider, bài tiêu biểu, xem nhiều, gallery)')
  console.log('   • Bài + bình luận: mở 1 bài đã xuất bản → phần bình luận bạn đọc')
  console.log('   • Từ khóa        : /dashboard/admin/keywords')
  console.log('   • Deadline       : /dashboard/editor/workflow  (đăng nhập bientap@)')
  console.log('   • Bảo mật        : /dashboard/security          (đăng nhập baomat@)')
  console.log('   • Trang chủ CMS  : /dashboard/admin/cms/homepage (section + featured + slider)')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch((e) => { console.error('❌ Seed error:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
