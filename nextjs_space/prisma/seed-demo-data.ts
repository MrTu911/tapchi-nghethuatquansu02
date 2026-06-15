/**
 * seed-demo-data.ts — Tapchi-HCQS
 *
 * Tạo dữ liệu mẫu cho các bảng còn thiếu để test đầy đủ quy trình biên tập:
 *  1. Keyword         — từ khóa chuyên ngành
 *  2. ReviewerProfile — hồ sơ phản biện đầy đủ
 *  3. Volume/Issue    — thêm tập/số năm 2025
 *  4. Copyedit        — giai đoạn biên tập bài đã published
 *  5. Production      — giai đoạn dàn trang
 *  6. EmailTemplate   — mẫu email thông báo
 *
 * Idempotent — xóa rồi insert lại
 * Run: npx tsx --require dotenv/config prisma/seed-demo-data.ts
 */

import { PrismaClient, IssueStatus } from '@prisma/client'
import 'dotenv/config'

const db = new PrismaClient()

async function main() {
  console.log('📰 seed-demo-data.ts — Tapchi-HCQS demo data')

  // ── 1. Keywords ──────────────────────────────────────────────────────────────
  await db.keyword.deleteMany({})

  const keywords = [
    // Nghệ thuật quân sự
    { term: 'hậu cần quân sự', category: 'Nghệ thuật quân sự', usage: 45 },
    { term: 'logistics quân sự', category: 'Nghệ thuật quân sự', usage: 38 },
    { term: 'quản lý vật tư kỹ thuật', category: 'Nghệ thuật quân sự', usage: 27 },
    { term: 'chuỗi cung ứng quốc phòng', category: 'Nghệ thuật quân sự', usage: 22 },
    { term: 'bảo đảm hậu cần chiến dịch', category: 'Nghệ thuật quân sự', usage: 31 },
    { term: 'hậu cần chiến lược', category: 'Nghệ thuật quân sự', usage: 19 },
    { term: 'tổ chức hậu cần phân đội', category: 'Nghệ thuật quân sự', usage: 15 },
    // Kỹ thuật / Công nghệ
    { term: 'trí tuệ nhân tạo', category: 'Công nghệ', usage: 52 },
    { term: 'machine learning', category: 'Công nghệ', usage: 41 },
    { term: 'dữ liệu lớn', category: 'Công nghệ', usage: 35 },
    { term: 'internet of things', category: 'Công nghệ', usage: 28 },
    { term: 'blockchain', category: 'Công nghệ', usage: 17 },
    { term: 'GIS quân sự', category: 'Công nghệ', usage: 24 },
    { term: 'hệ thống thông tin quản lý', category: 'Công nghệ', usage: 30 },
    // Chính trị - Lý luận
    { term: 'bảo vệ tổ quốc', category: 'Chính trị', usage: 63 },
    { term: 'quân đội nhân dân', category: 'Chính trị', usage: 58 },
    { term: 'nghị quyết trung ương', category: 'Chính trị', usage: 47 },
    { term: 'tư tưởng Hồ Chí Minh', category: 'Chính trị', usage: 55 },
    { term: 'đường lối quân sự Đảng', category: 'Chính trị', usage: 43 },
    // Đào tạo - Giáo dục
    { term: 'đào tạo sĩ quan', category: 'Giáo dục', usage: 29 },
    { term: 'giáo dục quốc phòng', category: 'Giáo dục', usage: 33 },
    { term: 'phương pháp giảng dạy', category: 'Giáo dục', usage: 21 },
    { term: 'học viện quốc phòng', category: 'Giáo dục', usage: 37 },
    // Nghiên cứu - Khoa học
    { term: 'nghiên cứu khoa học quân sự', category: 'NCKH', usage: 44 },
    { term: 'đề tài cấp bộ', category: 'NCKH', usage: 18 },
    { term: 'công bố khoa học', category: 'NCKH', usage: 26 },
    { term: 'phương pháp nghiên cứu', category: 'NCKH', usage: 20 },
  ]

  for (const kw of keywords) {
    await db.keyword.create({ data: kw })
  }
  console.log(`  ✅ Đã tạo ${keywords.length} keywords`)

  // ── 2. ReviewerProfile đầy đủ ────────────────────────────────────────────────
  const reviewerUsers = await db.user.findMany({
    where: { role: 'REVIEWER', isActive: true },
    select: { id: true, fullName: true },
  })

  // Xóa profiles cũ và tạo lại đầy đủ
  await db.reviewerProfile.deleteMany({})

  const reviewerProfiles = [
    {
      expertise: ['Nghệ thuật quân sự', 'Chiến lược', 'Chiến dịch học'],
      keywords: ['hậu cần quân sự', 'logistics quân sự', 'chuỗi cung ứng quốc phòng'],
      totalReviews: 24,
      completedReviews: 22,
      declinedReviews: 2,
      avgCompletionDays: 8.5,
      averageRating: 4.7,
      maxConcurrentReviews: 4,
    },
    {
      expertise: ['Trí tuệ nhân tạo', 'Machine learning', 'Hệ thống thông tin quân sự'],
      keywords: ['trí tuệ nhân tạo', 'machine learning', 'hệ thống thông tin quản lý'],
      totalReviews: 18,
      completedReviews: 17,
      declinedReviews: 1,
      avgCompletionDays: 7.2,
      averageRating: 4.5,
      maxConcurrentReviews: 3,
    },
  ]

  for (let i = 0; i < Math.min(reviewerUsers.length, reviewerProfiles.length); i++) {
    await db.reviewerProfile.create({
      data: {
        userId: reviewerUsers[i].id,
        ...reviewerProfiles[i],
      },
    })
  }

  // Thêm reviewer profiles cho các editors có thể review
  const additionalReviewers = await db.user.findMany({
    where: { role: { in: ['SECTION_EDITOR', 'MANAGING_EDITOR'] }, isActive: true },
    select: { id: true },
    take: 2,
  })
  for (const u of additionalReviewers) {
    const existing = await db.reviewerProfile.findFirst({ where: { userId: u.id } })
    if (!existing) {
      await db.reviewerProfile.create({
        data: {
          userId: u.id,
          expertise: ['Lý luận chính trị quân sự', 'Khoa học xã hội nhân văn'],
          keywords: ['bảo vệ tổ quốc', 'nghiên cứu khoa học quân sự'],
          totalReviews: 8,
          completedReviews: 8,
          declinedReviews: 0,
          avgCompletionDays: 10.0,
          averageRating: 4.3,
          maxConcurrentReviews: 2,
        },
      })
    }
  }
  const reviewerCount = await db.reviewerProfile.count()
  console.log(`  ✅ Đã tạo/cập nhật ${reviewerCount} reviewer profiles`)

  // ── 3. Volume & Issue năm 2025 ───────────────────────────────────────────────
  const existingVol2025 = await db.volume.findFirst({ where: { year: 2025 } })
  let vol2025Id: string

  if (!existingVol2025) {
    const vol = await db.volume.create({
      data: {
        volumeNo: 2,
        year: 2025,
        title: 'Tập 2 - Năm 2025',
        description: 'Tập thứ hai của Tạp chí Nghệ thuật Quân sự Việt Nam năm 2025',
      },
    })
    vol2025Id = vol.id
    console.log('  ✅ Đã tạo Volume 2 - 2025')
  } else {
    vol2025Id = existingVol2025.id
    console.log('  ℹ️  Volume 2025 đã tồn tại')
  }

  // Issues 2025
  const issues2025: Array<{ number: number; year: number; title: string; publishDate: Date; status: IssueStatus }> = [
    { number: 1, year: 2025, title: 'Số 1 - Tháng 3/2025', publishDate: new Date('2025-03-01'), status: IssueStatus.PUBLISHED },
    { number: 2, year: 2025, title: 'Số 2 - Tháng 6/2025', publishDate: new Date('2025-06-01'), status: IssueStatus.PUBLISHED },
    { number: 3, year: 2025, title: 'Số 3 - Tháng 9/2025', publishDate: new Date('2025-09-01'), status: IssueStatus.PUBLISHED },
    { number: 4, year: 2025, title: 'Số 4 - Tháng 12/2025', publishDate: new Date('2025-12-01'), status: IssueStatus.DRAFT },
  ]

  for (const issue of issues2025) {
    const existing = await db.issue.findFirst({
      where: { volumeId: vol2025Id, number: issue.number },
    })
    if (!existing) {
      await db.issue.create({
        data: {
          volumeId: vol2025Id,
          number: issue.number,
          year: issue.year,
          title: issue.title,
          publishDate: issue.publishDate,
          status: issue.status,
        },
      })
    }
  }
  const issueCount = await db.issue.count()
  console.log(`  ✅ Issues tổng cộng: ${issueCount}`)

  // ── 4. Copyedit cho bài đã published ─────────────────────────────────────────
  const managingEditor = await db.user.findFirst({
    where: { role: 'MANAGING_EDITOR', isActive: true },
    select: { id: true },
  })
  const sectionEditor = await db.user.findFirst({
    where: { role: 'SECTION_EDITOR', isActive: true },
    select: { id: true },
  })

  if (!managingEditor || !sectionEditor) {
    console.log('  ⚠️  Thiếu editor users, bỏ qua Copyedit/Production seed')
  } else {
    // Lấy một số articles đã published để tạo copyedit history
    const publishedArticles = await db.article.findMany({
      where: { approvalStatus: 'APPROVED' },
      select: { id: true, submissionId: true },
      take: 8,
    })

    let copyeditCount = 0
    for (let i = 0; i < publishedArticles.length; i++) {
      const article = publishedArticles[i]
      const existing = await db.copyedit.findFirst({ where: { articleId: article.id } })
      if (existing) continue

      const isCompleted = i < 6  // 6 completed, 2 in progress
      const deadline = new Date()
      deadline.setDate(deadline.getDate() + (isCompleted ? -5 : 7))

      await db.copyedit.create({
        data: {
          articleId: article.id,
          editorId: i % 2 === 0 ? managingEditor.id : sectionEditor.id,
          version: 1,
          notes: isCompleted
            ? 'Biên tập hoàn thành. Đã sửa lỗi chính tả, chuẩn hóa trích dẫn theo APA 7th.'
            : 'Đang biên tập. Cần làm rõ phần tài liệu tham khảo.',
          fileUrl: isCompleted
            ? `/uploads/copyedit/${article.id}-v1-final.docx`
            : null,
          status: isCompleted ? 'approved' : 'editing',
          tags: isCompleted ? ['chinh-ta', 'trich-dan', 'hinh-anh'] : ['dang-xu-ly'],
          deadline,
        },
      })
      copyeditCount++
    }
    console.log(`  ✅ Đã tạo ${copyeditCount} copyedit records`)

    // ── 5. Production (dàn trang) ─────────────────────────────────────────────
    const issue2024No2 = await db.issue.findFirst({
      where: { year: 2024, number: 2 },
      select: { id: true },
    })

    const articlesForProduction = await db.article.findMany({
      where: { approvalStatus: 'APPROVED', production: null },
      select: { id: true },
      take: 5,
    })

    let productionCount = 0
    const eic = await db.user.findFirst({
      where: { role: 'EIC', isActive: true },
      select: { id: true },
    })

    for (let i = 0; i < articlesForProduction.length; i++) {
      const article = articlesForProduction[i]
      const isPublished = i < 3

      await db.production.create({
        data: {
          articleId: article.id,
          issueId: issue2024No2?.id ?? null,
          layoutUrl: isPublished
            ? `/uploads/production/${article.id}-layout-final.pdf`
            : `/uploads/production/${article.id}-layout-draft.pdf`,
          doi: isPublished
            ? `10.15625/ntqs.2024.02.${String(i + 1).padStart(3, '0')}`
            : null,
          published: isPublished,
          publishedAt: isPublished ? new Date('2024-12-01') : null,
          approvedBy: isPublished ? (eic?.id ?? null) : null,
          notes: isPublished
            ? 'Dàn trang hoàn chỉnh, đã gán DOI và đưa vào số phát hành.'
            : 'Đang dàn trang, chờ tác giả xác nhận bản galley proof.',
        },
      })
      productionCount++
    }
    console.log(`  ✅ Đã tạo ${productionCount} production records`)
  }

  // ── 6. EmailTemplate ─────────────────────────────────────────────────────────
  await db.emailTemplate.deleteMany({})

  const emailTemplates = [
    {
      code: 'SUBMISSION_RECEIVED',
      subject: 'Xác nhận nhận bài: {{submissionCode}} - {{submissionTitle}}',
      bodyHtml: `<p>Kính gửi {{authorName}},</p>
<p>Ban biên tập Tạp chí Nghệ thuật Quân sự Việt Nam đã nhận được bài nộp của quý tác giả:</p>
<ul>
  <li><strong>Mã bài:</strong> {{submissionCode}}</li>
  <li><strong>Tiêu đề:</strong> {{submissionTitle}}</li>
  <li><strong>Ngày nộp:</strong> {{submittedAt}}</li>
</ul>
<p>Bài viết sẽ được xem xét sơ bộ trong vòng <strong>5 ngày làm việc</strong>.</p>
<p>Trân trọng,<br/>Ban biên tập</p>`,
      bodyText: 'Xác nhận nhận bài: {{submissionCode}} - {{submissionTitle}}',
      variables: ['authorName', 'submissionCode', 'submissionTitle', 'submittedAt'],
    },
    {
      code: 'REVIEW_INVITATION',
      subject: 'Mời phản biện bài báo: {{submissionCode}}',
      bodyHtml: `<p>Kính gửi {{reviewerName}},</p>
<p>Ban biên tập trân trọng kính mời {{reviewerName}} tham gia phản biện bài báo sau:</p>
<ul>
  <li><strong>Tiêu đề:</strong> {{submissionTitle}}</li>
  <li><strong>Lĩnh vực:</strong> {{category}}</li>
  <li><strong>Hạn phản biện:</strong> {{reviewDeadline}}</li>
</ul>
<p>Vui lòng trả lời email này để xác nhận hoặc từ chối lời mời.</p>
<p>Trân trọng,<br/>Ban biên tập</p>`,
      bodyText: 'Mời phản biện: {{submissionCode}} - hạn {{reviewDeadline}}',
      variables: ['reviewerName', 'submissionTitle', 'category', 'reviewDeadline'],
    },
    {
      code: 'REVIEW_REMINDER',
      subject: '[Nhắc nhở] Phản biện sắp đến hạn: {{submissionCode}}',
      bodyHtml: `<p>Kính gửi {{reviewerName}},</p>
<p>Đây là thông báo nhắc nhở: phản biện cho bài báo <strong>{{submissionTitle}}</strong> sẽ đến hạn vào <strong>{{reviewDeadline}}</strong>.</p>
<p>Còn <strong>{{daysRemaining}} ngày</strong> để hoàn thành phản biện.</p>
<p>Trân trọng,<br/>Ban biên tập</p>`,
      bodyText: 'Nhắc phản biện: {{submissionCode}} - còn {{daysRemaining}} ngày',
      variables: ['reviewerName', 'submissionTitle', 'reviewDeadline', 'daysRemaining'],
    },
    {
      code: 'DECISION_ACCEPTED',
      subject: 'Bài báo được chấp nhận đăng: {{submissionCode}}',
      bodyHtml: `<p>Kính gửi {{authorName}},</p>
<p>Ban biên tập vui mừng thông báo bài báo của quý tác giả đã được <strong>chấp nhận đăng</strong>:</p>
<ul>
  <li><strong>Tiêu đề:</strong> {{submissionTitle}}</li>
  <li><strong>Quyết định:</strong> Chấp nhận đăng</li>
</ul>
<p>Bài viết sẽ được dàn trang và xuất bản trong số sắp tới.</p>
<p>Trân trọng,<br/>Tổng biên tập</p>`,
      bodyText: 'Chúc mừng! Bài báo {{submissionCode}} được chấp nhận đăng.',
      variables: ['authorName', 'submissionTitle'],
    },
    {
      code: 'DECISION_REJECTED',
      subject: 'Thông báo kết quả bài báo: {{submissionCode}}',
      bodyHtml: `<p>Kính gửi {{authorName}},</p>
<p>Sau khi xem xét kỹ lưỡng, Ban biên tập rất tiếc phải thông báo bài báo <strong>{{submissionTitle}}</strong> chưa đủ điều kiện đăng tải ở thời điểm hiện tại.</p>
<p><strong>Lý do:</strong> {{rejectionReason}}</p>
<p>Chúng tôi khuyến khích quý tác giả tiếp tục nghiên cứu và gửi bài ở lần sau.</p>
<p>Trân trọng,<br/>Ban biên tập</p>`,
      bodyText: 'Thông báo kết quả bài {{submissionCode}}: Chưa đủ điều kiện đăng.',
      variables: ['authorName', 'submissionTitle', 'rejectionReason'],
    },
    {
      code: 'REVISION_REQUESTED',
      subject: 'Yêu cầu sửa bài: {{submissionCode}}',
      bodyHtml: `<p>Kính gửi {{authorName}},</p>
<p>Ban biên tập đã nhận được kết quả phản biện và yêu cầu quý tác giả <strong>chỉnh sửa bổ sung</strong> bài báo:</p>
<ul>
  <li><strong>Tiêu đề:</strong> {{submissionTitle}}</li>
  <li><strong>Hạn nộp bản sửa:</strong> {{revisionDeadline}}</li>
</ul>
<p>Ý kiến phản biện chi tiết đã được đính kèm. Vui lòng nộp lại bản sửa qua hệ thống.</p>
<p>Trân trọng,<br/>Ban biên tập</p>`,
      bodyText: 'Yêu cầu sửa bài {{submissionCode}} — hạn {{revisionDeadline}}',
      variables: ['authorName', 'submissionTitle', 'revisionDeadline'],
    },
    {
      code: 'ARTICLE_PUBLISHED',
      subject: 'Bài báo đã được xuất bản: {{submissionCode}}',
      bodyHtml: `<p>Kính gửi {{authorName}},</p>
<p>Bài báo của quý tác giả đã chính thức được <strong>xuất bản</strong>:</p>
<ul>
  <li><strong>Tiêu đề:</strong> {{submissionTitle}}</li>
  <li><strong>Số tạp chí:</strong> {{issueTitle}}</li>
  <li><strong>DOI:</strong> <a href="https://doi.org/{{doi}}">{{doi}}</a></li>
  <li><strong>Trang:</strong> {{pages}}</li>
</ul>
<p>Cảm ơn quý tác giả đã đóng góp cho Tạp chí!</p>
<p>Trân trọng,<br/>Ban biên tập</p>`,
      bodyText: 'Bài báo {{submissionCode}} đã xuất bản tại {{issueTitle}}',
      variables: ['authorName', 'submissionTitle', 'issueTitle', 'doi', 'pages'],
    },
    {
      code: 'ACCOUNT_APPROVED',
      subject: 'Tài khoản của bạn đã được kích hoạt',
      bodyHtml: `<p>Kính gửi {{fullName}},</p>
<p>Tài khoản của bạn trên hệ thống Tạp chí Nghệ thuật Quân sự Việt Nam đã được <strong>phê duyệt và kích hoạt</strong>.</p>
<p>Bạn có thể đăng nhập tại: <a href="{{loginUrl}}">{{loginUrl}}</a></p>
<p>Vai trò: <strong>{{role}}</strong></p>
<p>Trân trọng,<br/>Ban quản trị</p>`,
      bodyText: 'Tài khoản {{fullName}} đã được kích hoạt. Đăng nhập tại {{loginUrl}}',
      variables: ['fullName', 'loginUrl', 'role'],
    },
  ]

  for (const tpl of emailTemplates) {
    await db.emailTemplate.create({ data: tpl })
  }
  console.log(`  ✅ Đã tạo ${emailTemplates.length} email templates`)

  // ── Tóm tắt ──────────────────────────────────────────────────────────────────
  console.log('\n  📊 Tổng kết:')
  console.log(`     Keywords: ${await db.keyword.count()}`)
  console.log(`     ReviewerProfiles: ${await db.reviewerProfile.count()}`)
  console.log(`     Volumes: ${await db.volume.count()} | Issues: ${await db.issue.count()}`)
  console.log(`     Copyedit: ${await db.copyedit.count()}`)
  console.log(`     Production: ${await db.production.count()}`)
  console.log(`     EmailTemplates: ${await db.emailTemplate.count()}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
