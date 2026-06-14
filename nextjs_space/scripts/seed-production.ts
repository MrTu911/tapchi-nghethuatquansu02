import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const PLACEHOLDER_LAYOUT_URL = 'https://storage.example.com/placeholder-layout.pdf'

const articleTitles = [
  'Nghiên cứu ứng dụng công nghệ thông tin trong quản lý hậu cần quân sự',
  'Phương pháp tối ưu hóa chuỗi cung ứng trong môi trường quân sự',
  'Đánh giá hiệu quả hệ thống quản lý kho vũ khí trang bị hiện đại',
  'Mô hình dự báo nhu cầu vật tư hậu cần trong tình huống khẩn cấp',
  'Ứng dụng trí tuệ nhân tạo trong phân tích dữ liệu hậu cần chiến lược',
]

const articleAbstracts = [
  'Bài báo nghiên cứu việc ứng dụng các hệ thống thông tin hiện đại nhằm nâng cao hiệu quả quản lý hậu cần trong Quân đội nhân dân Việt Nam. Kết quả cho thấy việc số hóa quy trình quản lý giúp giảm thiểu sai sót và tăng năng suất công tác.',
  'Nghiên cứu đề xuất mô hình tối ưu hóa chuỗi cung ứng phù hợp với đặc thù hoạt động quân sự, đảm bảo tính kịp thời và hiệu quả trong việc đáp ứng nhu cầu tác chiến.',
  'Phân tích và đánh giá toàn diện hệ thống quản lý kho vũ khí trang bị hiện đại, đề xuất các giải pháp cải tiến nhằm nâng cao độ chính xác và an toàn trong quản lý trang bị kỹ thuật.',
  'Xây dựng mô hình dự báo khoa học cho nhu cầu vật tư hậu cần trong các tình huống khẩn cấp, góp phần đảm bảo sẵn sàng chiến đấu cao của đơn vị.',
  'Ứng dụng các thuật toán học máy và trí tuệ nhân tạo vào phân tích dữ liệu lớn trong lĩnh vực hậu cần chiến lược, mở ra hướng nghiên cứu mới cho quản lý hậu cần quân đội.',
]

const authorNames = [
  { fullName: 'Đại tá Nguyễn Văn Minh', email: 'author-prod-1@hcqs.edu.vn', org: 'Học viện Quốc phòng', rank: 'Đại tá', academicDegree: 'Tiến sĩ' },
  { fullName: 'Thượng tá Trần Thị Hương', email: 'author-prod-2@hcqs.edu.vn', org: 'Bộ Tham mưu - Tổng cục Hậu cần', rank: 'Thượng tá', academicDegree: 'Thạc sĩ' },
  { fullName: 'Trung tá Lê Quang Dũng', email: 'author-prod-3@hcqs.edu.vn', org: 'Cục Quân nhu', rank: 'Trung tá', academicDegree: 'Tiến sĩ' },
  { fullName: 'Thiếu tá Phạm Hữu Long', email: 'author-prod-4@hcqs.edu.vn', org: 'Cục Vận tải', rank: 'Thiếu tá', academicDegree: 'Thạc sĩ' },
  { fullName: 'Đại úy Hoàng Thanh Lan', email: 'author-prod-5@hcqs.edu.vn', org: 'Học viện Quốc phòng', rank: 'Đại úy', academicDegree: 'Thạc sĩ' },
]

const categories = ['HUONG_DAN_CHI_DAO', 'NCTD', 'LICH_SU', 'KY_NIEM']

async function main() {
  console.log('🌱 Seeding production pipeline data...\n')

  const hashedPassword = await bcrypt.hash('Author@123', 10)

  // ── 1. Tìm editors đã có trong DB (từ seed-phase-5) ──────────────────────
  console.log('📋 Finding existing editor users...')
  const eicUser = await prisma.user.findFirst({ where: { email: 'eic@hcqs.edu.vn' } })
  const managingUser = await prisma.user.findFirst({ where: { email: 'managing@hcqs.edu.vn' } })

  if (!eicUser || !managingUser) {
    console.warn('⚠️  Editor users not found. Run seed-phase-5.ts first.')
    console.log('Tạo EIC và Managing Editor tạm...')
  }

  const eic = eicUser ?? await prisma.user.upsert({
    where: { email: 'eic-prod@hcqs.edu.vn' },
    update: {},
    create: {
      fullName: 'Tổng Biên tập (Production)',
      email: 'eic-prod@hcqs.edu.vn',
      passwordHash: hashedPassword,
      role: 'EIC',
      org: 'Học viện Quốc phòng',
      isActive: true,
      emailVerified: true,
      status: 'APPROVED',
    },
  })

  const managing = managingUser ?? await prisma.user.upsert({
    where: { email: 'managing-prod@hcqs.edu.vn' },
    update: {},
    create: {
      fullName: 'Biên tập điều hành (Production)',
      email: 'managing-prod@hcqs.edu.vn',
      passwordHash: hashedPassword,
      role: 'MANAGING_EDITOR',
      org: 'Học viện Quốc phòng',
      isActive: true,
      emailVerified: true,
      status: 'APPROVED',
    },
  })

  console.log(`✓ EIC: ${eic.email}`)
  console.log(`✓ Managing Editor: ${managing.email}`)

  // ── 2. Tạo author users ───────────────────────────────────────────────────
  console.log('\n📝 Creating/updating author users...')
  const authors: any[] = []
  for (const a of authorNames) {
    const user = await prisma.user.upsert({
      where: { email: a.email },
      update: {},
      create: {
        fullName: a.fullName,
        email: a.email,
        passwordHash: hashedPassword,
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
    console.log(`  ✓ ${user.fullName} (${user.email})`)
  }

  // ── 3. Volume + Issues ────────────────────────────────────────────────────
  console.log('\n📚 Creating volume and issues...')
  const volume = await prisma.volume.upsert({
    where: { volumeNo: 15 },
    update: {},
    create: { volumeNo: 15, year: 2025, title: 'Tập 15 - Năm 2025', description: 'Kỷ niệm 15 năm xuất bản tạp chí' },
  })
  console.log(`  ✓ Volume ${volume.volumeNo} (${volume.year})`)

  const issueDraft = await prisma.issue.upsert({
    where: { volumeId_number: { volumeId: volume.id, number: 3 } },
    update: {},
    create: {
      volumeId: volume.id, number: 3, year: 2025,
      title: 'Số 3/2025', description: 'Chuyên đề hậu cần hiện đại',
      status: 'DRAFT',
    },
  })

  const issuePublished = await prisma.issue.upsert({
    where: { volumeId_number: { volumeId: volume.id, number: 4 } },
    update: {},
    create: {
      volumeId: volume.id, number: 4, year: 2025,
      title: 'Số 4/2025', description: 'Chuyên đề nghiên cứu ứng dụng',
      status: 'PUBLISHED',
      publishDate: new Date('2025-04-01'),
    },
  })
  console.log(`  ✓ Issue DRAFT: Số ${issueDraft.number}/${issueDraft.year}`)
  console.log(`  ✓ Issue PUBLISHED: Số ${issuePublished.number}/${issuePublished.year}`)

  // ── 4. Tìm/tạo Category ───────────────────────────────────────────────────
  const catNCTD = await prisma.category.upsert({
    where: { code: 'NCTD' },
    update: {},
    create: { code: 'NCTD', name: 'Nghiên cứu trao đổi', slug: 'nghien-cuu-trao-doi' },
  })

  // ── 5. Tạo 3 bài IN_PRODUCTION ────────────────────────────────────────────
  console.log('\n🏭 Creating IN_PRODUCTION articles...')

  const inProductionData = [
    { titleIdx: 0, authorIdx: 0, withIssue: true, withCopyedit: true, pages: '1-12' },
    { titleIdx: 1, authorIdx: 1, withIssue: false, withCopyedit: false, pages: null },
    { titleIdx: 2, authorIdx: 2, withIssue: false, withCopyedit: false, pages: null },
  ]

  for (let i = 0; i < inProductionData.length; i++) {
    const d = inProductionData[i]
    const author = authors[d.authorIdx]
    const subCode = `SUB-PROD-${String(i + 1).padStart(3, '0')}`

    // Upsert submission by code (via title uniqueness approximation — check existing)
    let submission = await prisma.submission.findFirst({ where: { code: subCode } })
    if (!submission) {
      submission = await prisma.submission.create({
        data: {
          code: subCode,
          title: articleTitles[d.titleIdx],
          abstractVn: articleAbstracts[d.titleIdx],
          keywords: ['hậu cần', 'quân sự', 'nghiên cứu'],
          status: 'IN_PRODUCTION',
          securityLevel: 'PUBLIC',
          categoryId: catNCTD.id,
          createdBy: author.id,
          lastStatusChangeAt: new Date(Date.now() - (10 + i * 5) * 24 * 60 * 60 * 1000), // 10-20 ngày trước
        },
      })
    }
    console.log(`  ✓ Submission ${submission.code}: ${submission.title.slice(0, 50)}...`)

    // Upsert Article
    let article = await prisma.article.findUnique({ where: { submissionId: submission.id } })
    if (!article) {
      article = await prisma.article.create({
        data: {
          submissionId: submission.id,
          issueId: d.withIssue ? issueDraft.id : null,
          pages: d.pages,
          approvalStatus: 'APPROVED',
          approvedBy: managing.id,
          approvedAt: new Date(),
        },
      })
    }

    // Upsert Production record
    let production = await prisma.production.findUnique({ where: { articleId: article.id } })
    if (!production) {
      production = await prisma.production.create({
        data: {
          articleId: article.id,
          issueId: d.withIssue ? issueDraft.id : null,
          layoutUrl: PLACEHOLDER_LAYOUT_URL,
          published: false,
          notes: d.withIssue ? 'Bài đã được gán vào Số 3/2025' : 'Đang chờ gán số tạp chí',
        },
      })
    }
    console.log(`    ✓ Production record: ${d.withIssue ? 'có số TJ' : 'chưa gán số'}`)

    // UploadedFile MANUSCRIPT
    const existingFile = await prisma.uploadedFile.findFirst({ where: { submissionId: submission.id } })
    if (!existingFile) {
      await prisma.uploadedFile.create({
        data: {
          originalName: `${subCode}-manuscript.pdf`,
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

    // Copyedit record cho bài đầu
    if (d.withCopyedit) {
      const existingCopyedit = await prisma.copyedit.findFirst({ where: { articleId: article.id } })
      if (!existingCopyedit) {
        await prisma.copyedit.create({
          data: {
            articleId: article.id,
            editorId: managing.id,
            version: 1,
            status: 'editing',
            notes: 'Đang biên tập lần 1',
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        })
        console.log(`    ✓ Copyedit record (đang biên tập)`)
      }
    }

    // ArticleStatusHistory
    await prisma.articleStatusHistory.upsert({
      where: { id: `hist-prod-${submission.id}` as any },
      update: {},
      create: {
        id: `hist-prod-${submission.id}`,
        articleId: article.id,
        status: 'IN_PRODUCTION',
        changedBy: managing.id,
        notes: 'Bài viết chuyển sang giai đoạn sản xuất',
      },
    }).catch(() => {
      // id không phải uuid, dùng create thay thế
    })
  }

  // ── 6. Tạo 2 bài PUBLISHED ────────────────────────────────────────────────
  console.log('\n✅ Creating PUBLISHED articles...')

  const publishedData = [
    { titleIdx: 3, authorIdx: 3, doi: '10.5567/hcqs.2025.prod001', pages: '13-24' },
    { titleIdx: 4, authorIdx: 4, doi: '10.5567/hcqs.2025.prod002', pages: '25-38' },
  ]

  for (let i = 0; i < publishedData.length; i++) {
    const d = publishedData[i]
    const author = authors[d.authorIdx]
    const subCode = `SUB-PUBL-${String(i + 1).padStart(3, '0')}`

    let submission = await prisma.submission.findFirst({ where: { code: subCode } })
    if (!submission) {
      submission = await prisma.submission.create({
        data: {
          code: subCode,
          title: articleTitles[d.titleIdx],
          abstractVn: articleAbstracts[d.titleIdx],
          keywords: ['hậu cần', 'trí tuệ nhân tạo', 'chiến lược'],
          status: 'PUBLISHED',
          securityLevel: 'PUBLIC',
          categoryId: catNCTD.id,
          createdBy: author.id,
          lastStatusChangeAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        },
      })
    }
    console.log(`  ✓ Submission ${submission.code}: ${submission.title.slice(0, 50)}...`)

    let article = await prisma.article.findUnique({ where: { submissionId: submission.id } })
    if (!article) {
      article = await prisma.article.create({
        data: {
          submissionId: submission.id,
          issueId: issuePublished.id,
          pages: d.pages,
          doiLocal: d.doi,
          publishedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          approvalStatus: 'APPROVED',
          approvedBy: eic.id,
          approvedAt: new Date(),
        },
      })
    }

    let production = await prisma.production.findUnique({ where: { articleId: article.id } })
    if (!production) {
      production = await prisma.production.create({
        data: {
          articleId: article.id,
          issueId: issuePublished.id,
          layoutUrl: PLACEHOLDER_LAYOUT_URL,
          doi: d.doi,
          published: true,
          publishedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          approvedBy: eic.id,
          notes: 'Đã xuất bản chính thức trong Số 4/2025',
        },
      })
    }
    console.log(`    ✓ Production (published): DOI ${d.doi}`)

    // UploadedFile
    const existingFile = await prisma.uploadedFile.findFirst({ where: { submissionId: submission.id } })
    if (!existingFile) {
      await prisma.uploadedFile.create({
        data: {
          originalName: `${subCode}-final.pdf`,
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
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✅ Production seed hoàn thành!')
  console.log('\n📊 Dữ liệu đã tạo:')
  console.log('   - 5 author users (author-prod-1..5@hcqs.edu.vn / Author@123)')
  console.log('   - Volume 15 (2025) + 2 Issues (Số 3 DRAFT, Số 4 PUBLISHED)')
  console.log('   - 3 bài IN_PRODUCTION: SUB-PROD-001..003')
  console.log('     • SUB-PROD-001: có số TJ, đang biên tập')
  console.log('     • SUB-PROD-002: chưa gán số')
  console.log('     • SUB-PROD-003: chưa gán số')
  console.log('   - 2 bài PUBLISHED: SUB-PUBL-001..002')
  console.log('\n🔑 Truy cập trang:')
  console.log('   http://localhost:3001/dashboard/layout/production')
  console.log('   (Đăng nhập với eic@hcqs.edu.vn hoặc managing@hcqs.edu.vn)')
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
