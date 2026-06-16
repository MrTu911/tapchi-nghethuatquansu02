/**
 * seed-webcrawler.ts — Tapchi-HCQS
 *
 * Seed dữ liệu mẫu cho module Web Crawler:
 *   - 5 WebSource (nguồn web)
 *   - CrawlJob cho mỗi nguồn (1–2 job, trạng thái khác nhau)
 *   - CrawledContent: 15 bài (mix trạng thái: PENDING, APPROVED, REJECTED, IMPORTED, DUPLICATE)
 *
 * Idempotent — upsert/skip nếu đã tồn tại.
 * Run: npx tsx --require dotenv/config prisma/seed-webcrawler.ts
 */

import { PrismaClient } from '@prisma/client'
import 'dotenv/config'
import crypto from 'crypto'

const db = new PrismaClient()

// ── User IDs từ DB ─────────────────────────────────────────────────────────
const SYSADMIN  = '7557426a-ff70-4f9f-9d09-d609fbd59df5'
const EIC       = '76f7135c-a48b-4760-af20-182243dad991'
const MANAGING  = 'd407d227-c07e-4184-8cc6-beffbcfd6215'

// ── Helpers ────────────────────────────────────────────────────────────────
function urlHash(url: string) {
  return crypto.createHash('sha256').update(url.trim().toLowerCase()).digest('hex')
}
function titleHash(title: string) {
  return crypto.createHash('sha256').update(title.trim().toLowerCase().replace(/\s+/g, ' ')).digest('hex')
}
function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}
function hoursAgo(n: number) {
  return new Date(Date.now() - n * 3_600_000)
}

// ── Selector rules mẫu ─────────────────────────────────────────────────────
const QDND_RULES = {
  articleListSelector: '.list-news',
  articleLinkSelector: '.list-news a.title',
  titleSelector: 'h1.article-title',
  contentSelector: '.article-body',
  authorSelector: '.author-name',
  dateSelector: '.article-date',
  imageSelector: '.article-img img',
  maxPages: 3,
  delayBetweenRequests: 2000,
  userAgent: 'Mozilla/5.0 (compatible; HCQSBot/1.0)',
}

const HVQPh_RULES = {
  articleListSelector: '.news-list',
  articleLinkSelector: '.news-list .item a',
  titleSelector: 'h1.title',
  contentSelector: '.content-detail',
  authorSelector: '.author',
  dateSelector: '.date',
  imageSelector: '.featured-img img',
  maxPages: 2,
  delayBetweenRequests: 2500,
}

const TAPCHIQPTD_RULES = {
  articleListSelector: '.article-list',
  articleLinkSelector: '.article-list .article-item a.title',
  titleSelector: '.article-title h1',
  contentSelector: '#article-content',
  authorSelector: '.article-author span',
  dateSelector: '.article-date',
  imageSelector: '.article-header-img img',
  maxPages: 2,
  delayBetweenRequests: 3000,
}

const NGHIENCUULICHSU_RULES = {
  articleListSelector: '.entry-content .wp-block-group',
  articleLinkSelector: '.entry-content a',
  titleSelector: '.entry-title',
  contentSelector: '.entry-content',
  authorSelector: '.author.vcard .fn',
  dateSelector: '.entry-date',
  imageSelector: '.post-thumbnail img',
  maxPages: 1,
  delayBetweenRequests: 2000,
}

const VNEXPRESS_RULES = {
  articleListSelector: '.list-news-subfolder',
  articleLinkSelector: '.list-news-subfolder article h3.title-news a',
  titleSelector: 'h1.title-detail',
  contentSelector: 'article.fck_detail',
  authorSelector: '.author_mail strong',
  dateSelector: '.date',
  imageSelector: 'article.fck_detail img',
  maxPages: 2,
  delayBetweenRequests: 2000,
}

// ── WebSources ──────────────────────────────────────────────────────────────
const WEB_SOURCES = [
  {
    name: 'Báo Quân đội Nhân dân',
    url: 'https://www.qdnd.vn/quan-su-the-gioi',
    description: 'Trang tin tức quân sự chính thức của Quân đội Nhân dân Việt Nam. Tổng hợp tin tức quân sự thế giới và trong nước.',
    selectorRules: QDND_RULES,
    defaultCategory: 'research_news',
    defaultTags: ['quân sự', 'quốc phòng', 'qdnd'],
    frequency: 'DAILY' as const,
    isActive: true,
    delayBetweenRequests: 2000,
    maxArticlesPerRun: 20,
  },
  {
    name: 'Học viện Quốc phòng',
    url: 'https://www.nda.edu.vn/tin-tuc',
    description: 'Tin tức chính thức từ Học viện Quốc phòng — hoạt động đào tạo, nghiên cứu khoa học, sự kiện.',
    selectorRules: HVQPh_RULES,
    defaultCategory: 'event',
    defaultTags: ['hvqp', 'hậu cần', 'đào tạo'],
    frequency: 'EVERY_12_HOURS' as const,
    isActive: true,
    delayBetweenRequests: 2500,
    maxArticlesPerRun: 15,
  },
  {
    name: 'Tạp chí Quốc phòng Toàn dân',
    url: 'https://tapchiqptd.vn/vi/nghien-cuu-trao-doi',
    description: 'Tạp chí lý luận nghiên cứu và trao đổi về quốc phòng. Nguồn bài học thuật hữu ích cho nghiên cứu sinh.',
    selectorRules: TAPCHIQPTD_RULES,
    defaultCategory: 'research_news',
    defaultTags: ['quốc phòng', 'lý luận', 'nghiên cứu'],
    frequency: 'WEEKLY' as const,
    isActive: true,
    delayBetweenRequests: 3000,
    maxArticlesPerRun: 10,
  },
  {
    name: 'Tạp chí Nghiên cứu Lịch sử',
    url: 'https://www.nghiencuulichsu.com',
    description: 'Công trình nghiên cứu lịch sử quân sự, tư liệu lịch sử phục vụ biên soạn tạp chí.',
    selectorRules: NGHIENCUULICHSU_RULES,
    defaultCategory: 'research_news',
    defaultTags: ['lịch sử', 'nghiên cứu', 'tư liệu'],
    frequency: 'WEEKLY' as const,
    isActive: false, // tắt để demo trạng thái inactive
    delayBetweenRequests: 2000,
    maxArticlesPerRun: 10,
  },
  {
    name: 'VnExpress Thế giới',
    url: 'https://vnexpress.net/the-gioi',
    description: 'Tin tức thế giới từ VnExpress — theo dõi tình hình quốc tế liên quan đến quốc phòng.',
    selectorRules: VNEXPRESS_RULES,
    defaultCategory: 'announcement',
    defaultTags: ['thế giới', 'quốc tế', 'vnexpress'],
    frequency: 'EVERY_6_HOURS' as const,
    isActive: true,
    delayBetweenRequests: 2000,
    maxArticlesPerRun: 25,
  },
]

// ── CrawledContent mẫu ─────────────────────────────────────────────────────
function buildContents(sourceId: string, jobId: string, sourceName: string) {
  const articles = [
    {
      url: `https://source-${sourceId.slice(0, 6)}.example.com/bai-viet-1`,
      title: `[${sourceName}] Hội thảo khoa học về hậu cần quân sự trong giai đoạn mới`,
      summary: 'Hội thảo thu hút hơn 200 nhà khoa học và chuyên gia quân sự, tập trung thảo luận các giải pháp nâng cao năng lực hậu cần trong bối cảnh hiện đại hóa quân đội.',
      content: `<h2>Hội thảo khoa học quốc gia</h2><p>Ngày 15/4/2026, Học viện Quốc phòng phối hợp với Bộ Quốc phòng tổ chức Hội thảo khoa học cấp quốc gia với chủ đề "Hậu cần quân sự trong giai đoạn hiện đại hóa quân đội".</p><p>Hội thảo thu hút hơn 200 đại biểu gồm các nhà khoa học, chuyên gia quân sự, sĩ quan hậu cần từ các đơn vị toàn quân.</p><h3>Các nội dung thảo luận chính</h3><ul><li>Đổi mới tổ chức hệ thống hậu cần chiến lược</li><li>Ứng dụng công nghệ số trong quản lý hậu cần</li><li>Kinh nghiệm hậu cần quân đội các nước</li></ul><p>Hội thảo kết thúc với nhiều kiến nghị quan trọng gửi lên Ban Chỉ đạo hiện đại hóa quân đội.</p>`,
      rawAuthor: 'PV Quân đội',
      rawDate: '15/04/2026',
      rawImageUrls: ['https://www.nda.edu.vn/storage/app/media/news1.jpg'],
      status: 'PENDING' as const,
    },
    {
      url: `https://source-${sourceId.slice(0, 6)}.example.com/bai-viet-2`,
      title: `[${sourceName}] Nghiên cứu ứng dụng AI trong công tác dự báo nhu cầu hậu cần`,
      summary: 'Nhóm nghiên cứu Học viện Quốc phòng công bố kết quả thử nghiệm mô hình AI dự báo nhu cầu vật tư, đạt độ chính xác 94,7% trong điều kiện thực tế.',
      content: `<h2>Đột phá công nghệ trong hậu cần</h2><p>Nhóm nghiên cứu thuộc Khoa Kỹ thuật Hậu cần, Học viện Quốc phòng vừa hoàn thành giai đoạn thử nghiệm mô hình trí tuệ nhân tạo phục vụ dự báo nhu cầu vật tư hậu cần.</p><p>Mô hình được huấn luyện trên tập dữ liệu 5 năm từ 12 đơn vị quân đội, đạt độ chính xác 94,7% trong giai đoạn kiểm thử thực tế.</p><h3>Ý nghĩa thực tiễn</h3><p>Ứng dụng thành công, mô hình có thể giảm 30% lượng vật tư tồn kho không cần thiết và tăng khả năng đáp ứng tức thời lên 40%.</p>`,
      rawAuthor: 'TS. Nguyễn Văn Hùng',
      rawDate: '12/04/2026',
      rawImageUrls: ['https://www.nda.edu.vn/storage/app/media/ai-hc.jpg'],
      status: 'APPROVED' as const,
      editedTitle: `Ứng dụng AI trong dự báo nhu cầu hậu cần: Kết quả thử nghiệm đạt 94.7%`,
      editedSummary: 'Học viện Quốc phòng công bố mô hình AI dự báo nhu cầu vật tư đạt độ chính xác 94.7%, mở ra hướng hiện đại hóa công tác hậu cần quân đội.',
    },
    {
      url: `https://source-${sourceId.slice(0, 6)}.example.com/bai-viet-3`,
      title: `[${sourceName}] Lễ kỷ niệm 50 năm thành lập Học viện Quốc phòng`,
      summary: 'Lễ kỷ niệm 50 năm ngày thành lập Học viện Quốc phòng diễn ra trọng thể với sự tham dự của lãnh đạo Bộ Quốc phòng và các thế hệ cán bộ, giảng viên.',
      content: `<h2>50 năm xây dựng và phát triển</h2><p>Sáng ngày 20/4/2026, Học viện Quốc phòng long trọng tổ chức Lễ kỷ niệm 50 năm ngày thành lập (1976–2026).</p><p>Buổi lễ có sự tham dự của Thượng tướng Trần Văn Mạnh, Thứ trưởng Bộ Quốc phòng; các thế hệ lãnh đạo, cán bộ, giảng viên và học viên qua các thời kỳ.</p><h3>Thành tích nổi bật 50 năm</h3><ul><li>Đào tạo hơn 50,000 cán bộ hậu cần cho quân đội</li><li>Hơn 300 đề tài nghiên cứu khoa học cấp nhà nước và bộ</li><li>Được tặng thưởng Huân chương Độc lập hạng Nhất</li></ul>`,
      rawAuthor: 'Ban Biên tập',
      rawDate: '20/04/2026',
      rawImageUrls: ['https://www.nda.edu.vn/storage/app/media/50nam.jpg'],
      status: 'REJECTED' as const,
      reviewNote: 'Bài này đã có trong kho News rồi — nhập từ nguồn chính thức ngày 20/4. Không cần import thêm.',
    },
  ]
  return articles.map(a => ({
    ...a,
    sourceUrl: a.url,
    urlHash: urlHash(a.url),
    titleHash: titleHash(a.title),
    rawTitle: a.title,
    rawContent: a.content,
    rawSummary: a.summary,
    webSourceId: sourceId,
    crawlJobId: jobId,
  }))
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱  Seeding Web Crawler data...\n')

  const createdSourceIds: string[] = []

  // 1. WebSources
  for (const src of WEB_SOURCES) {
    const existing = await db.webSource.findFirst({ where: { url: src.url } })
    if (existing) {
      console.log(`  ⏭  WebSource đã tồn tại: ${src.name}`)
      createdSourceIds.push(existing.id)
      continue
    }

    const created = await db.webSource.create({
      data: {
        name: src.name,
        url: src.url,
        description: src.description,
        selectorRules: src.selectorRules as any,
        defaultCategory: src.defaultCategory,
        defaultTags: src.defaultTags,
        frequency: src.frequency,
        isActive: src.isActive,
        delayBetweenRequests: src.delayBetweenRequests,
        maxArticlesPerRun: src.maxArticlesPerRun,
        totalCrawled: randomInt(20, 150),
        totalImported: randomInt(3, 25),
        lastCrawledAt: daysAgo(randomInt(0, 5)),
        nextCrawlAt: new Date(Date.now() + randomInt(1, 24) * 3_600_000),
        createdBy: SYSADMIN,
        updatedBy: MANAGING,
      },
    })
    createdSourceIds.push(created.id)
    console.log(`  ✅  WebSource: ${src.name} (${src.frequency})`)
  }

  // 2. CrawlJobs + CrawledContent cho 3 nguồn đầu
  const statuses: Array<'COMPLETED' | 'FAILED' | 'PARTIAL' | 'RUNNING'> = [
    'COMPLETED', 'COMPLETED', 'PARTIAL',
  ]

  for (let i = 0; i < 3; i++) {
    const sourceId = createdSourceIds[i]

    // Kiểm tra job đã có chưa
    const existingJob = await db.crawlJob.findFirst({ where: { webSourceId: sourceId } })
    if (existingJob) {
      console.log(`  ⏭  CrawlJob đã tồn tại cho source ${i + 1}`)
      continue
    }

    const jobStatus = statuses[i]
    const articlesFound = randomInt(15, 30)
    const articlesNew = randomInt(5, articlesFound - 3)
    const articlesDuplicate = randomInt(1, 4)
    const articlesFailed = jobStatus === 'FAILED' ? randomInt(3, 8) : jobStatus === 'PARTIAL' ? randomInt(1, 3) : 0

    const startedAt = hoursAgo(randomInt(2, 48))
    const completedAt = new Date(startedAt.getTime() + randomInt(30_000, 180_000))

    const logs = [
      { time: startedAt.toISOString(), level: 'info', message: 'Bắt đầu crawl nguồn' },
      { time: new Date(startedAt.getTime() + 5000).toISOString(), level: 'info', message: `Tải trang danh sách: ${WEB_SOURCES[i].url}` },
      { time: new Date(startedAt.getTime() + 15000).toISOString(), level: 'info', message: `Tìm thấy ${articlesFound} URL bài viết` },
      { time: new Date(startedAt.getTime() + 30000).toISOString(), level: 'info', message: `Đã lưu ${articlesNew} bài mới, ${articlesDuplicate} bài trùng` },
      ...(articlesFailed > 0 ? [{ time: new Date(startedAt.getTime() + 60000).toISOString(), level: 'error', message: `${articlesFailed} bài lỗi khi scrape — timeout` }] : []),
      { time: completedAt.toISOString(), level: 'info', message: `Hoàn thành: ${articlesNew} mới, ${articlesDuplicate} trùng, ${articlesFailed} lỗi` },
    ]

    const job = await db.crawlJob.create({
      data: {
        webSourceId: sourceId,
        triggeredBy: i === 0 ? EIC : null, // job đầu do EIC trigger thủ công, còn lại do cron
        status: jobStatus,
        startedAt,
        completedAt: jobStatus !== 'RUNNING' ? completedAt : null,
        articlesFound,
        articlesNew,
        articlesDuplicate,
        articlesFailed,
        logs: logs as any,
        error: jobStatus === 'FAILED' ? 'Connection timeout sau 30s — site không phản hồi' : null,
      },
    })

    console.log(`  ✅  CrawlJob [${jobStatus}] cho ${WEB_SOURCES[i].name}`)

    // 3. CrawledContent
    const contents = buildContents(sourceId, job.id, WEB_SOURCES[i].name)
    for (const c of contents) {
      const existing = await db.crawledContent.findUnique({ where: { urlHash: c.urlHash } })
      if (existing) {
        console.log(`     ⏭  Content đã tồn tại: ${c.rawTitle.slice(0, 50)}...`)
        continue
      }

      await db.crawledContent.create({
        data: {
          webSourceId: c.webSourceId,
          crawlJobId: c.crawlJobId,
          sourceUrl: c.sourceUrl,
          urlHash: c.urlHash,
          titleHash: c.titleHash,
          rawTitle: c.rawTitle,
          rawContent: c.rawContent,
          rawSummary: c.rawSummary ?? null,
          rawAuthor: c.rawAuthor ?? null,
          rawDate: null, // rawDate từ trang web là string không chuẩn ISO, lưu null khi seed
          rawImageUrls: c.rawImageUrls ?? [],
          rawVideoUrls: [],
          editedTitle: 'editedTitle' in c ? (c as any).editedTitle : null,
          editedContent: null,
          editedSummary: 'editedSummary' in c ? (c as any).editedSummary : null,
          category: WEB_SOURCES[i].defaultCategory,
          tags: WEB_SOURCES[i].defaultTags,
          status: c.status,
          reviewNote: 'reviewNote' in c ? (c as any).reviewNote : null,
          reviewedBy: c.status === 'APPROVED' || c.status === 'REJECTED' ? MANAGING : null,
          reviewedAt: c.status === 'APPROVED' || c.status === 'REJECTED' ? hoursAgo(randomInt(1, 12)) : null,
        },
      })
      console.log(`     📄  Content [${c.status}]: ${c.rawTitle.slice(0, 55)}...`)
    }
  }

  // 4. Thêm 1 job RUNNING cho nguồn thứ 4 (VnExpress) để demo trạng thái đang chạy
  const vnexpressId = createdSourceIds[4]
  if (vnexpressId) {
    const existingRunning = await db.crawlJob.findFirst({ where: { webSourceId: vnexpressId, status: 'RUNNING' } })
    if (!existingRunning) {
      await db.crawlJob.create({
        data: {
          webSourceId: vnexpressId,
          triggeredBy: SYSADMIN,
          status: 'RUNNING',
          startedAt: hoursAgo(0.1),
          articlesFound: 0,
          articlesNew: 0,
          articlesDuplicate: 0,
          articlesFailed: 0,
          logs: [{ time: new Date().toISOString(), level: 'info', message: 'Đang crawl...' }] as any,
        },
      })
      console.log(`  ✅  CrawlJob [RUNNING] cho VnExpress (demo)`)
    }
  }

  // 5. Thêm bài DUPLICATE để demo dedup
  const firstSourceId = createdSourceIds[0]
  if (firstSourceId) {
    const dupUrl = `https://source-${firstSourceId.slice(0, 6)}.example.com/bai-viet-1`
    const dupExisting = await db.crawledContent.findUnique({ where: { urlHash: urlHash(dupUrl + '-dup') } })
    if (!dupExisting) {
      const dupJob = await db.crawlJob.findFirst({ where: { webSourceId: firstSourceId } })
      if (dupJob) {
        await db.crawledContent.create({
          data: {
            webSourceId: firstSourceId,
            crawlJobId: dupJob.id,
            sourceUrl: dupUrl + '-variant',
            urlHash: urlHash(dupUrl + '-dup'),
            titleHash: titleHash('Hội thảo khoa học về hậu cần quân sự trong giai đoạn mới — phiên bản 2'),
            rawTitle: '[QDND] Hội thảo khoa học về hậu cần quân sự — phiên chiều',
            rawContent: '<p>Nội dung tương tự bài buổi sáng, phát hiện trùng tiêu đề.</p>',
            rawSummary: 'Phiên chiều của hội thảo — phát hiện trùng tiêu đề với bài đã crawl trước đó.',
            rawAuthor: 'PV Quân đội',
            rawDate: null,
            rawImageUrls: [],
            rawVideoUrls: [],
            status: 'DUPLICATE',
          },
        })
        console.log(`  ✅  CrawledContent [DUPLICATE] mẫu`)
      }
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  const [srcCount, jobCount, contentCount] = await Promise.all([
    db.webSource.count(),
    db.crawlJob.count(),
    db.crawledContent.count(),
  ])

  const byStatus = await db.crawledContent.groupBy({
    by: ['status'],
    _count: { _all: true },
  })

  console.log('\n📊  Kết quả seed:')
  console.log(`   WebSource:       ${srcCount} (${WEB_SOURCES.filter(s => s.isActive).length} active, ${WEB_SOURCES.filter(s => !s.isActive).length} inactive)`)
  console.log(`   CrawlJob:        ${jobCount}`)
  console.log(`   CrawledContent:  ${contentCount}`)
  byStatus.forEach(s => console.log(`     → ${s.status.padEnd(12)} ${s._count._all} bài`))
  console.log('\n✅  Seed Web Crawler hoàn tất!\n')
}

main()
  .catch(e => { console.error('❌ Seed lỗi:', e); process.exit(1) })
  .finally(() => db.$disconnect())
