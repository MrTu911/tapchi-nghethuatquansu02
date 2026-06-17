/**
 * Seed dữ liệu DÀN TRANG & XUẤT BẢN — Tạp chí Nghệ thuật Quân sự Việt Nam.
 *
 * Tạo dữ liệu kiểm thử end-to-end cho:
 *   - Hàng đợi sản xuất / dàn trang  → /dashboard/layout/production
 *   - Quản lý & xuất bản số tạp chí   → /dashboard/managing/issues
 *
 * Nguyên tắc:
 *   - Tái sử dụng biên tập viên NTQS đã có (tongbientap@, bientapchinh@,
 *     dangtrang@tapchintqsvn.edu.vn). Chỉ tạo mới nếu thiếu (đúng branding NTQS).
 *   - Tái sử dụng 9 chuyên mục NTQS đã seed (CLQS, NTTC, CDH, CTH, LSQS, HTQP,
 *     GDQS...). Không tạo danh mục trùng.
 *   - Idempotent: chạy lại không nhân đôi dữ liệu.
 *   - Toàn bộ định danh, nội dung đúng thương hiệu NTQS — Học viện Quốc phòng.
 *
 * Chạy: npm run seed:production
 */
import { PrismaClient, type SubmissionStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// File layout/PDF chỉ là placeholder cho dữ liệu demo (chưa có file thật).
const PLACEHOLDER_LAYOUT_URL = '/uploads/demo/ntqs-layout-placeholder.pdf'
const AUTHOR_PASSWORD = 'Tacgia@2026'

// ── Biên tập viên NTQS (theo seed lãnh đạo đã có) ─────────────────────────────
const EIC_EMAIL = 'tongbientap@tapchintqsvn.edu.vn'
const MANAGING_EMAIL = 'bientapchinh@tapchintqsvn.edu.vn'

// ── Tác giả demo (định danh quân sự NTQS) ─────────────────────────────────────
const authorSeeds = [
  { fullName: 'Đại tá, TS Nguyễn Mạnh Hùng', email: 'demo-author-1@tacgia.ntqs.local', org: 'Học viện Quốc phòng', rank: 'Đại tá', academicDegree: 'Tiến sĩ' },
  { fullName: 'Thượng tá, TS Trần Quang Vinh', email: 'demo-author-2@tacgia.ntqs.local', org: 'Viện Chiến lược Quốc phòng', rank: 'Thượng tá', academicDegree: 'Tiến sĩ' },
  { fullName: 'Trung tá, ThS Lê Đức Anh', email: 'demo-author-3@tacgia.ntqs.local', org: 'Học viện Lục quân', rank: 'Trung tá', academicDegree: 'Thạc sĩ' },
  { fullName: 'Đại tá, PGS.TS Phạm Văn Thành', email: 'demo-author-4@tacgia.ntqs.local', org: 'Bộ Tổng Tham mưu', rank: 'Đại tá', academicDegree: 'Tiến sĩ' },
  { fullName: 'Thiếu tá, ThS Hoàng Minh Tuấn', email: 'demo-author-5@tacgia.ntqs.local', org: 'Học viện Quốc phòng', rank: 'Thiếu tá', academicDegree: 'Thạc sĩ' },
]

// ── Chuyên mục NTQS dùng cho bài demo (fallback nếu chưa có trong DB) ──────────
const categoryFallback: Record<string, { name: string; slug: string }> = {
  NTTC: { name: 'Nghệ thuật tác chiến', slug: 'nghe-thuat-tac-chien' },
  CDH: { name: 'Chiến dịch học', slug: 'chien-dich-hoc' },
  CLQS: { name: 'Chiến lược quân sự', slug: 'chien-luoc-quan-su' },
  CTH: { name: 'Chiến thuật học', slug: 'chien-thuat-hoc' },
  LSQS: { name: 'Lịch sử quân sự', slug: 'lich-su-quan-su' },
  HTQP: { name: 'Hợp tác quốc phòng', slug: 'hop-tac-quoc-phong' },
  GDQS: { name: 'Giáo dục quân sự', slug: 'giao-duc-quan-su' },
}

// ── Bài viết demo (nội dung nghệ thuật quân sự) ───────────────────────────────
interface ArticleSeed {
  title: string
  abstract: string
  categoryCode: string
  keywords: string[]
}

const inProductionArticles: Array<ArticleSeed & { authorIdx: number; assignToDraft: boolean; pages: string | null; withCopyedit: boolean; daysAgo: number }> = [
  {
    title: 'Nghệ thuật tạo và nắm thời cơ trong chiến dịch tiến công của Quân đội nhân dân Việt Nam',
    abstract: 'Bài viết phân tích nghệ thuật tạo lập, phát hiện và chớp thời cơ trong các chiến dịch tiến công, từ thực tiễn lịch sử đến yêu cầu tác chiến hiện đại, đề xuất giải pháp vận dụng vào huấn luyện và sẵn sàng chiến đấu.',
    categoryCode: 'NTTC',
    keywords: ['nghệ thuật quân sự', 'chiến dịch tiến công', 'thời cơ'],
    authorIdx: 0, assignToDraft: true, pages: '5-18', withCopyedit: true, daysAgo: 12,
  },
  {
    title: 'Phát triển lý luận nghệ thuật chiến dịch trong điều kiện chiến tranh sử dụng vũ khí công nghệ cao',
    abstract: 'Nghiên cứu làm rõ những phát triển mới của lý luận nghệ thuật chiến dịch khi đối phương sử dụng vũ khí công nghệ cao, nhấn mạnh yêu cầu về tổ chức thế trận, hiệp đồng quân binh chủng và bảo đảm tác chiến.',
    categoryCode: 'CDH',
    keywords: ['nghệ thuật chiến dịch', 'vũ khí công nghệ cao', 'hiệp đồng'],
    authorIdx: 1, assignToDraft: true, pages: '19-32', withCopyedit: false, daysAgo: 22,
  },
  {
    title: 'Vận dụng tư tưởng quân sự Hồ Chí Minh trong xây dựng thế trận quốc phòng toàn dân thời kỳ mới',
    abstract: 'Bài viết hệ thống hóa giá trị cốt lõi trong tư tưởng quân sự Hồ Chí Minh và đề xuất hướng vận dụng vào xây dựng thế trận quốc phòng toàn dân gắn với thế trận an ninh nhân dân trong tình hình mới.',
    categoryCode: 'CLQS',
    keywords: ['tư tưởng quân sự Hồ Chí Minh', 'quốc phòng toàn dân', 'thế trận'],
    authorIdx: 3, assignToDraft: false, pages: null, withCopyedit: false, daysAgo: 35,
  },
  {
    title: 'Nghệ thuật nghi binh, lừa địch trong chiến thuật tiến công của phân đội bộ binh',
    abstract: 'Nghiên cứu các hình thức nghi binh, lừa địch ở cấp phân đội bộ binh trong chiến thuật tiến công; rút ra bài học và đề xuất nội dung huấn luyện phù hợp với trang bị, địa hình tác chiến hiện nay.',
    categoryCode: 'CTH',
    keywords: ['nghi binh', 'chiến thuật tiến công', 'phân đội bộ binh'],
    authorIdx: 2, assignToDraft: false, pages: null, withCopyedit: false, daysAgo: 6,
  },
]

const publishedArticles: Array<ArticleSeed & { authorIdx: number; pages: string; doi: string }> = [
  {
    title: 'Bài học về tổ chức và sử dụng lực lượng trong Chiến dịch Hồ Chí Minh năm 1975',
    abstract: 'Bài viết khái quát nghệ thuật tổ chức, sử dụng lực lượng trong Chiến dịch Hồ Chí Minh, làm rõ bài học về tập trung binh lực, chia cắt chiến lược và phát triển tiến công, có ý nghĩa vận dụng đến hôm nay.',
    categoryCode: 'LSQS',
    keywords: ['Chiến dịch Hồ Chí Minh', 'sử dụng lực lượng', 'lịch sử quân sự'],
    authorIdx: 0, pages: '33-46', doi: 'NTQS.2026.04.001',
  },
  {
    title: 'Tăng cường hợp tác quốc phòng song phương góp phần bảo vệ chủ quyền biển, đảo',
    abstract: 'Nghiên cứu vai trò của hợp tác quốc phòng song phương trong bảo vệ chủ quyền biển, đảo; đề xuất giải pháp nâng cao hiệu quả đối ngoại quốc phòng phù hợp đường lối độc lập, tự chủ.',
    categoryCode: 'HTQP',
    keywords: ['hợp tác quốc phòng', 'chủ quyền biển đảo', 'đối ngoại quốc phòng'],
    authorIdx: 4, pages: '47-58', doi: 'NTQS.2026.04.002',
  },
  {
    title: 'Đổi mới phương pháp huấn luyện chiến thuật tại các học viện, nhà trường quân đội',
    abstract: 'Bài viết đánh giá thực trạng và đề xuất đổi mới phương pháp huấn luyện chiến thuật tại các học viện, nhà trường quân đội theo hướng sát thực tế chiến đấu, ứng dụng mô phỏng và công nghệ mô hình hóa.',
    categoryCode: 'GDQS',
    keywords: ['huấn luyện chiến thuật', 'nhà trường quân đội', 'đổi mới giáo dục'],
    authorIdx: 1, pages: '59-70', doi: 'NTQS.2026.04.003',
  },
]

const DAY_MS = 24 * 60 * 60 * 1000

async function findOrCreateEditor(email: string, role: 'EIC' | 'MANAGING_EDITOR', fullName: string, passwordHash: string) {
  const existing = await prisma.user.findFirst({ where: { email } })
  if (existing) return existing
  console.warn(`  ⚠️  Không thấy ${role} (${email}) — tạo tạm theo branding NTQS.`)
  return prisma.user.create({
    data: {
      fullName,
      email,
      passwordHash,
      role,
      org: 'Học viện Quốc phòng',
      isActive: true,
      emailVerified: true,
      status: 'APPROVED',
    },
  })
}

async function ensureCategory(code: string) {
  const existing = await prisma.category.findUnique({ where: { code } })
  if (existing) return existing
  const fb = categoryFallback[code]
  if (!fb) throw new Error(`Thiếu cấu hình fallback cho chuyên mục ${code}`)
  console.warn(`  ⚠️  Tạo chuyên mục NTQS thiếu: ${code} — ${fb.name}`)
  return prisma.category.create({ data: { code, name: fb.name, slug: fb.slug } })
}

async function recordStatusHistory(articleId: string, status: SubmissionStatus, changedBy: string, notes: string) {
  const existing = await prisma.articleStatusHistory.findFirst({ where: { articleId, status } })
  if (existing) return
  await prisma.articleStatusHistory.create({ data: { articleId, status, changedBy, notes } })
}

async function main() {
  console.log('🌱 Seeding dữ liệu Dàn trang & Xuất bản — Tạp chí Nghệ thuật Quân sự Việt Nam\n')

  const passwordHash = await bcrypt.hash(AUTHOR_PASSWORD, 10)

  // ── 1. Biên tập viên ───────────────────────────────────────────────────────
  console.log('📋 Tìm biên tập viên NTQS...')
  const eic = await findOrCreateEditor(EIC_EMAIL, 'EIC', 'Tổng Biên Tập', passwordHash)
  const managing = await findOrCreateEditor(MANAGING_EMAIL, 'MANAGING_EDITOR', 'Biên Tập Chính', passwordHash)
  console.log(`  ✓ EIC: ${eic.email}`)
  console.log(`  ✓ Thư ký tòa soạn: ${managing.email}`)

  // ── 2. Tác giả demo ────────────────────────────────────────────────────────
  console.log('\n📝 Tạo/cập nhật tác giả demo (định danh quân sự NTQS)...')
  const authors = []
  for (const a of authorSeeds) {
    const user = await prisma.user.upsert({
      where: { email: a.email },
      update: {},
      create: {
        fullName: a.fullName,
        email: a.email,
        passwordHash,
        role: 'AUTHOR',
        org: a.org,
        rank: a.rank,
        academicDegree: a.academicDegree,
        isActive: true,
        emailVerified: true,
        status: 'APPROVED',
      },
    })
    authors.push(user)
    console.log(`  ✓ ${user.fullName}`)
  }

  // ── 3. Volume + Issues ───────────────────────────────────────────────────────
  console.log('\n📚 Tạo tập (volume) và các số...')
  const volume = await prisma.volume.upsert({
    where: { volumeNo: 39 },
    update: {},
    create: {
      volumeNo: 39,
      year: 2026,
      title: 'Tập 39 (Năm thứ 39) — 2026',
      description: 'Tạp chí Nghệ thuật Quân sự Việt Nam — Học viện Quốc phòng',
      issn: '1859-0454',
      publicationPeriod: 'Một kỳ/tháng',
    },
  })
  console.log(`  ✓ Tập ${volume.volumeNo} (${volume.year})`)

  const issueDraft = await prisma.issue.upsert({
    where: { volumeId_number: { volumeId: volume.id, number: 5 } },
    update: {},
    create: {
      volumeId: volume.id, number: 5, year: 2026,
      title: 'Số 5/2026 — Chuyên đề Nghệ thuật chiến dịch',
      description: 'Số chuyên đề về nghệ thuật chiến dịch và tác chiến hiệp đồng quân binh chủng.',
      status: 'DRAFT',
    },
  })

  const issuePublished = await prisma.issue.upsert({
    where: { volumeId_number: { volumeId: volume.id, number: 4 } },
    update: {},
    create: {
      volumeId: volume.id, number: 4, year: 2026,
      title: 'Số 4/2026 — Nghệ thuật tác chiến hiện đại',
      description: 'Số tạp chí đã xuất bản, tập hợp các nghiên cứu về nghệ thuật tác chiến hiện đại.',
      status: 'PUBLISHED',
      publishDate: new Date('2026-04-15'),
    },
  })
  console.log(`  ✓ Số DRAFT: Số ${issueDraft.number}/${issueDraft.year} (mục tiêu dàn trang & xuất bản thử)`)
  console.log(`  ✓ Số PUBLISHED: Số ${issuePublished.number}/${issuePublished.year}`)

  // ── 4. Bài IN_PRODUCTION ──────────────────────────────────────────────────────
  console.log('\n🏭 Tạo bài đang sản xuất (IN_PRODUCTION)...')
  for (let i = 0; i < inProductionArticles.length; i++) {
    const d = inProductionArticles[i]
    const author = authors[d.authorIdx]
    const category = await ensureCategory(d.categoryCode)
    const subCode = `NTQS-PROD-${String(i + 1).padStart(3, '0')}`

    let submission = await prisma.submission.findFirst({ where: { code: subCode } })
    if (!submission) {
      submission = await prisma.submission.create({
        data: {
          code: subCode,
          title: d.title,
          abstractVn: d.abstract,
          keywords: d.keywords,
          status: 'IN_PRODUCTION',
          securityLevel: 'PUBLIC',
          categoryId: category.id,
          createdBy: author.id,
          assignedEditorId: managing.id,
          lastStatusChangeAt: new Date(Date.now() - d.daysAgo * DAY_MS),
        },
      })
    }

    let article = await prisma.article.findUnique({ where: { submissionId: submission.id } })
    if (!article) {
      article = await prisma.article.create({
        data: {
          submissionId: submission.id,
          issueId: d.assignToDraft ? issueDraft.id : null,
          pages: d.pages,
          approvalStatus: 'APPROVED',
          approvedBy: managing.id,
          approvedAt: new Date(),
        },
      })
    }

    const existingProduction = await prisma.production.findUnique({ where: { articleId: article.id } })
    if (!existingProduction) {
      await prisma.production.create({
        data: {
          articleId: article.id,
          issueId: d.assignToDraft ? issueDraft.id : null,
          layoutUrl: PLACEHOLDER_LAYOUT_URL,
          published: false,
          notes: d.assignToDraft ? `Đã gán vào Số ${issueDraft.number}/${issueDraft.year}` : 'Đang chờ gán số tạp chí',
        },
      })
    }

    const existingFile = await prisma.uploadedFile.findFirst({ where: { submissionId: submission.id } })
    if (!existingFile) {
      await prisma.uploadedFile.create({
        data: {
          originalName: `${subCode}-ban-thao.pdf`,
          cloudStoragePath: `production/${subCode}/manuscript.pdf`,
          fileType: 'MANUSCRIPT',
          mimeType: 'application/pdf',
          fileSize: 1024 * 512,
          submissionId: submission.id,
          uploadedBy: author.id,
          description: 'Bản thảo gốc của tác giả',
        },
      })
    }

    if (d.withCopyedit) {
      const existingCopyedit = await prisma.copyedit.findFirst({ where: { articleId: article.id } })
      if (!existingCopyedit) {
        await prisma.copyedit.create({
          data: {
            articleId: article.id,
            editorId: managing.id,
            version: 1,
            status: 'editing',
            notes: 'Đang biên tập, chuẩn hóa thuật ngữ quân sự và tài liệu tham khảo.',
            tags: ['sửa chính tả', 'chuẩn hóa thuật ngữ'],
            deadline: new Date(Date.now() + 7 * DAY_MS),
          },
        })
      }
    }

    await recordStatusHistory(article.id, 'IN_PRODUCTION', managing.id, 'Bài chuyển sang giai đoạn sản xuất/dàn trang')
    console.log(`  ✓ ${subCode} — ${d.assignToDraft ? 'đã gán số' : 'chưa gán số'}${d.withCopyedit ? ', có biên tập' : ''} (${d.daysAgo} ngày)`)
  }

  // ── 5. Bài PUBLISHED ──────────────────────────────────────────────────────────
  console.log('\n✅ Tạo bài đã xuất bản (PUBLISHED)...')
  for (let i = 0; i < publishedArticles.length; i++) {
    const d = publishedArticles[i]
    const author = authors[d.authorIdx]
    const category = await ensureCategory(d.categoryCode)
    const subCode = `NTQS-PUBL-${String(i + 1).padStart(3, '0')}`
    const publishedAt = new Date('2026-04-15')

    let submission = await prisma.submission.findFirst({ where: { code: subCode } })
    if (!submission) {
      submission = await prisma.submission.create({
        data: {
          code: subCode,
          title: d.title,
          abstractVn: d.abstract,
          keywords: d.keywords,
          status: 'PUBLISHED',
          securityLevel: 'PUBLIC',
          categoryId: category.id,
          createdBy: author.id,
          assignedEditorId: managing.id,
          lastStatusChangeAt: publishedAt,
        },
      })
    }

    let article = await prisma.article.findUnique({ where: { submissionId: submission.id } })
    if (!article) {
      article = await prisma.article.create({
        data: {
          submissionId: submission.id,
          issueId: issuePublished.id,
          pages: d.pages,
          doiLocal: d.doi,
          publishedAt,
          approvalStatus: 'APPROVED',
          approvedBy: eic.id,
          approvedAt: publishedAt,
        },
      })
    }

    const existingProduction = await prisma.production.findUnique({ where: { articleId: article.id } })
    if (!existingProduction) {
      await prisma.production.create({
        data: {
          articleId: article.id,
          issueId: issuePublished.id,
          layoutUrl: PLACEHOLDER_LAYOUT_URL,
          doi: d.doi,
          published: true,
          publishedAt,
          approvedBy: eic.id,
          notes: `Đã xuất bản chính thức trong Số ${issuePublished.number}/${issuePublished.year}`,
        },
      })
    }

    const existingFile = await prisma.uploadedFile.findFirst({ where: { submissionId: submission.id } })
    if (!existingFile) {
      await prisma.uploadedFile.create({
        data: {
          originalName: `${subCode}-ban-cuoi.pdf`,
          cloudStoragePath: `production/${subCode}/final.pdf`,
          fileType: 'FINAL_VERSION',
          mimeType: 'application/pdf',
          fileSize: 1024 * 768,
          submissionId: submission.id,
          uploadedBy: managing.id,
          description: 'Phiên bản cuối đã xuất bản',
        },
      })
    }

    await recordStatusHistory(article.id, 'PUBLISHED', eic.id, 'Bài đã xuất bản công khai')
    console.log(`  ✓ ${subCode} — DOI ${d.doi} (tr. ${d.pages})`)
  }

  // ── Tổng kết ───────────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✅ Seed Dàn trang & Xuất bản (NTQS) hoàn thành!')
  console.log('\n📊 Dữ liệu đã tạo:')
  console.log('   • 5 tác giả demo (demo-author-1..5@tacgia.ntqs.local)')
  console.log('   • Tập 39 (2026) + 2 số: Số 5 (DRAFT, để dàn trang/xuất bản thử), Số 4 (PUBLISHED)')
  console.log('   • 4 bài IN_PRODUCTION (NTQS-PROD-001..004): 2 đã gán số, 2 chưa gán, 1 quá hạn >30 ngày')
  console.log('   • 3 bài PUBLISHED (NTQS-PUBL-001..003) trong Số 4/2026')
  console.log(`\n🔑 Mật khẩu tác giả demo: ${AUTHOR_PASSWORD}`)
  console.log('\n🔗 Kiểm thử:')
  console.log('   • Dàn trang : http://localhost:3001/dashboard/layout/production  (đăng nhập dangtrang@tapchintqsvn.edu.vn)')
  console.log('   • Xuất bản  : http://localhost:3001/dashboard/managing/issues   (đăng nhập tongbientap@/bientapchinh@tapchintqsvn.edu.vn)')
  console.log('   → Vào Số 5/2026 (DRAFT) để thử nút "Xuất bản số" (chỉ EIC/SYSADMIN)')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
