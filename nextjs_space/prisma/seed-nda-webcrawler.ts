/**
 * seed-nda-webcrawler.ts
 *
 * Seed dữ liệu demo cho module Web-crawler từ nguồn THẬT: Cổng TTĐT Học viện Quốc phòng
 * (https://nda.edu.vn) — cơ quan chủ quản Tạp chí Nghệ thuật Quân sự Việt Nam.
 *
 * Tạo: WebSource (nda.edu.vn) + 1 CrawlJob (COMPLETED) + nhiều CrawledContent (PENDING)
 * lấy nội dung THẬT qua HTTP tĩnh (các trang bài của nda.edu.vn render sẵn server-side),
 * KHÔNG cần Puppeteer. Phục vụ demo luồng duyệt → phê duyệt → import tin bài.
 *
 * Idempotent: upsert WebSource theo url; CrawledContent theo urlHash (unique).
 * Run: npx tsx --require dotenv/config prisma/seed-nda-webcrawler.ts
 */

import 'dotenv/config'
import * as crypto from 'crypto'
import { prisma } from '@/lib/prisma'

const NDA_ORIGIN = 'https://nda.edu.vn'
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36'

// Selector THẬT của nda.edu.vn (trang bài render server-side).
const SELECTOR_RULES = {
  articleListSelector: 'body',
  articleLinkSelector: 'a[href*="/tin-tuc/"][href$=".html"]',
  titleSelector: 'h1.pt-0',
  contentSelector: '.post-content',
  summarySelector: '.post-summary',
  imageSelector: '.post-content img',
  maxPages: 1,
}

// Các bài THẬT từ trang chủ nda.edu.vn (đa chuyên mục, đúng lĩnh vực quân sự).
const ARTICLE_PATHS = [
  '/tin-tuc/tin-hoc-vien/hoc-vien-quoc-phong-nang-cao-chat-luong-xay-dung-chinh-quy-thong-qua-kiem-tra-dieu-lenh-nam-2026-2530.html',
  '/tin-tuc/tin-hoc-vien/hoi-dong-khoa-hoc-khoa-chien-dich-thong-qua-e-cuong-luan-an-tien-si-lan-1-cho-nghien-cuu-sinh-khoa-33-2534.html',
  '/tin-tuc/tin-hoc-vien/khoa-chien-dich-thuc-hien-chuong-trinh-huan-luyen-noi-dung-nghien-cuu-dia-hinh-tac-chien-phong-thu-k13-cho-hoc-vien-cao-hoc-khoa-34-2536.html',
  '/tin-tuc/tin-noi-bat/doan-can-bo-giang-vien-hoc-vien-lop-ao-tao-dai-han-chi-huy-tham-muu-chien-dich-chien-luoc-khoa-13-dang-huong-tri-an-tai-nghia-trang-liet-si-quoc-gia-vi-xuyen-va-nghien-cuu-thuc-te-tai-iem-cao-468-2517.html',
  '/tin-tuc/tin-noi-bat/thong-qua-tai-lieu-huong-dan-soan-thao-van-kien-chi-dao-dien-tap-khu-vuc-phong-thu-tinh-thanh-pho-cua-ban-bo-nganh-trung-uong-do-hoc-vien-quoc-phong-chu-tri-bien-soan-2535.html',
  '/tin-tuc/tin-quoc-phong-an-ninh/nang-cao-tu-duy-nhan-thuc-moi-ve-quoc-phong-bao-ve-to-quoc-2455.html',
  '/tin-tuc/tin-trong-nuoc/be-mac-lop-dao-tao-ky-nang-su-dung-cong-nghe-thong-tin-va-chuyen-oi-so-cho-can-bo-nhan-vien-van-thu-bao-mat-luu-tru-toan-quan-nam-2026-2457.html',
  '/tin-tuc/tin-quoc-phong-an-ninh/bo-doi-cong-binh-phat-huy-truyen-thong-mo-uong-thang-loi-2427.html',
]

// ─── HTML helpers (parse tĩnh, không cần Puppeteer) ──────────────────────────

function decodeEntities(input: string): string {
  return input
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
}

function matchFirst(html: string, regex: RegExp): string | null {
  const m = html.match(regex)
  return m ? m[1] : null
}

interface ParsedArticle {
  title: string
  summary: string
  contentHtml: string
  imageUrls: string[]
}

function parseArticle(html: string): ParsedArticle {
  const titleRaw =
    matchFirst(html, /<h1[^>]*class="[^"]*pt-0[^"]*"[^>]*>([\s\S]*?)<\/h1>/i) ??
    matchFirst(html, /<title>([\s\S]*?)<\/title>/i) ??
    'Bài viết'
  const title = stripTags(titleRaw)

  const summary = stripTags(
    matchFirst(html, /<meta name="description" content="([^"]*)"/i) ?? titleRaw,
  )

  // Lấy vùng .post-content rồi gom các đoạn <p>.
  const contentStart = html.search(/class="[^"]*post-content[^"]*"/i)
  const region = contentStart >= 0 ? html.slice(contentStart, contentStart + 20000) : html
  const paragraphs = [...region.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => stripTags(m[1]))
    .filter((t) => t.length > 40)
    .slice(0, 12)
  const contentHtml =
    paragraphs.length > 0
      ? paragraphs.map((p) => `<p>${p}</p>`).join('\n')
      : `<p>${summary}</p>`

  const imageUrls = [...region.matchAll(/<img[^>]+src="([^"]+)"/gi)]
    .map((m) => m[1])
    .filter((src) => /\.(jpg|jpeg|png|webp)/i.test(src))
    .map((src) => (src.startsWith('http') ? src : `${NDA_ORIGIN}${src.startsWith('/') ? '' : '/'}${src}`))
    .filter((src, i, arr) => arr.indexOf(src) === i)
    .slice(0, 5)

  return { title, summary, contentHtml, imageUrls }
}

function sha256(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex')
}

async function fetchHtml(url: string): Promise<string | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 25000)
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: controller.signal })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const admin = await prisma.user.findFirst({
    where: { role: 'SYSADMIN', isActive: true },
    select: { id: true },
  })
  if (!admin) throw new Error('Không tìm thấy tài khoản SYSADMIN để gán createdBy.')

  // 1. Upsert WebSource theo url (url không unique → findFirst rồi tạo).
  let source = await prisma.webSource.findFirst({ where: { url: NDA_ORIGIN } })
  if (!source) {
    source = await prisma.webSource.create({
      data: {
        name: 'Cổng TTĐT Học viện Quốc phòng',
        url: NDA_ORIGIN,
        description: 'Nguồn tin chính thức của Học viện Quốc phòng — cơ quan chủ quản Tạp chí NTQS.',
        selectorRules: SELECTOR_RULES,
        defaultCategory: 'Tin Học viện',
        defaultTags: ['học viện quốc phòng', 'quân sự', 'quốc phòng'],
        frequency: 'DAILY',
        isActive: true,
        createdBy: admin.id,
      },
    })
  } else {
    source = await prisma.webSource.update({
      where: { id: source.id },
      data: { selectorRules: SELECTOR_RULES, updatedBy: admin.id },
    })
  }

  // 2. Tạo 1 CrawlJob (COMPLETED) đại diện cho lần crawl.
  const job = await prisma.crawlJob.create({
    data: {
      webSourceId: source.id,
      status: 'RUNNING',
      triggeredBy: admin.id,
      startedAt: new Date(),
    },
  })

  // 3. Fetch + parse từng bài, tạo CrawledContent (PENDING).
  let found = 0
  let created = 0
  let duplicate = 0
  let failed = 0

  for (const pathName of ARTICLE_PATHS) {
    const url = `${NDA_ORIGIN}${pathName}`
    const html = await fetchHtml(url)
    if (!html) {
      failed++
      console.log(`  ✗ Không tải được: ${url}`)
      continue
    }
    found++
    const parsed = parseArticle(html)
    const urlHash = sha256(url.trim())
    const titleHash = sha256(parsed.title.trim().toLowerCase().replace(/\s+/g, ' '))

    const existing = await prisma.crawledContent.findUnique({ where: { urlHash } })
    if (existing) {
      duplicate++
      console.log(`  ↺ Đã có: ${parsed.title.slice(0, 60)}`)
      continue
    }

    await prisma.crawledContent.create({
      data: {
        webSourceId: source.id,
        crawlJobId: job.id,
        sourceUrl: url,
        urlHash,
        titleHash,
        rawTitle: parsed.title,
        rawContent: parsed.contentHtml,
        rawSummary: parsed.summary,
        rawImageUrls: parsed.imageUrls,
        category: source.defaultCategory,
        tags: source.defaultTags,
        status: 'PENDING',
      },
    })
    created++
    console.log(`  ✓ ${parsed.title.slice(0, 70)}`)
  }

  // 4. Cập nhật job + source counters.
  await prisma.crawlJob.update({
    where: { id: job.id },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      articlesFound: found,
      articlesNew: created,
      articlesDuplicate: duplicate,
      articlesFailed: failed,
    },
  })
  await prisma.webSource.update({
    where: { id: source.id },
    data: {
      lastCrawledAt: new Date(),
      totalCrawled: { increment: found },
      totalImported: { increment: 0 },
    },
  })

  console.log(`\n✅ Web-crawler nda.edu.vn: tìm ${found}, tạo mới ${created}, trùng ${duplicate}, lỗi ${failed}.`)
  console.log(`   Nguồn: ${source.name} (${source.id})`)
  console.log('   → Vào /dashboard/admin/crawled-content để duyệt/import.')
}

main()
  .catch((error) => {
    console.error('❌ Lỗi seed web-crawler:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
