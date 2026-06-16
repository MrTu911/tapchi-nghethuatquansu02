/**
 * generate-demo-article-pdfs.ts
 *
 * Dựng file PDF toàn văn cho các bài xuất bản từ submission (`Article`) chưa có
 * `pdfFile`, lấy nội dung từ `htmlBody` + metadata của Submission (tiêu đề, tóm tắt
 * VI/EN, từ khoá, tác giả, chuyên mục). Đây là các bài hiện chỉ có HTML, chưa đính
 * kèm bản PDF gốc.
 *
 * File ghi vào `public/uploads/articles/<code>.pdf`; cập nhật `Article.pdfFile` =
 * `/uploads/articles/<code>.pdf` (URL tuyệt đối — trang công khai /articles/[id] dùng
 * trực tiếp làm href, không qua getFileUrl).
 *
 * Idempotent: bỏ qua bài đã có pdfFile + file tồn tại, trừ khi chạy với --replace.
 *
 * Run:
 *   npx tsx --require dotenv/config scripts/journal/generate-demo-article-pdfs.ts
 *   ... --replace
 *   ... --dry-run
 */
import { prisma } from '../../lib/db'
import { createArticlePdfDoc, PdfFlow, JOURNAL_NAME, ACCENT, GOLD } from '../../lib/pdf/article-pdf'
import * as fs from 'node:fs'
import * as path from 'node:path'

const PUBLIC_DIR = path.join(process.cwd(), 'public')
const OUTPUT_SUBDIR = path.join('uploads', 'articles') // dưới public/
const REPLACE = process.argv.includes('--replace')
const DRY_RUN = process.argv.includes('--dry-run')

/** Giải mã các entity HTML phổ biến. */
function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
}

/** Bỏ thẻ HTML, gộp khoảng trắng. */
function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
}

/**
 * Trích các đoạn nội dung chính từ htmlBody. Ưu tiên `<div class="content">` (phần
 * thân bài, tách khỏi tóm tắt/từ khoá). Nếu không có, lấy mọi <p> trừ đoạn trùng
 * abstract đã in riêng.
 */
function extractBodyParagraphs(html: string | null, excluded: string[]): string[] {
  if (!html) return []
  const contentIdx = html.indexOf('class="content"')
  const region = contentIdx >= 0 ? html.slice(contentIdx) : html
  const matches = [...region.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
  const excludedNorm = new Set(excluded.map((e) => stripTags(e)))
  const paras = matches
    .map((m) => stripTags(m[1]))
    .filter((t) => t.length > 0 && !excludedNorm.has(t))
  return paras
}

interface DemoArticle {
  id: string
  pdfFile: string | null
  pages: string | null
  htmlBody: string | null
  submission: {
    code: string
    title: string
    abstractVn: string | null
    abstractEn: string | null
    keywords: string[]
    section: string | null
    author: { fullName: string | null; org: string | null } | null
    category: { name: string | null } | null
  } | null
}

async function renderDemoArticlePdf(a: DemoArticle): Promise<Buffer> {
  const s = a.submission!
  const doc = await createArticlePdfDoc()
  const flow = new PdfFlow(doc)

  // ---- Header ----
  const pages = a.pages ? `Tr. ${a.pages}` : ''
  flow.paragraph(`${JOURNAL_NAME}${pages ? '  •  ' + pages : ''}`, { size: 8.5, style: 'bold', color: ACCENT, align: 'center' })
  flow.hr(GOLD, 0.4)
  flow.gap(5)

  // ---- Chuyên mục ----
  const sectionLabel = s.category?.name || s.section
  if (sectionLabel?.trim()) {
    flow.paragraph(sectionLabel.trim().toUpperCase(), { size: 9, style: 'bold', color: GOLD, align: 'center' })
    flow.gap(1.5)
  }

  // ---- Tiêu đề ----
  flow.paragraph(s.title.trim(), { size: 15, style: 'bold', align: 'center', color: ACCENT, lineGap: 1.25 })
  flow.gap(3)

  // ---- Tác giả ----
  if (s.author?.fullName?.trim()) {
    flow.paragraph(s.author.fullName.trim(), { size: 10.5, style: 'bold', align: 'center' })
  }
  if (s.author?.org?.trim()) {
    flow.paragraph(s.author.org.trim(), { size: 9.5, style: 'normal', align: 'center', color: [80, 80, 80] })
  }
  flow.gap(4)

  // ---- Tóm tắt (VI) ----
  if (s.abstractVn?.trim()) {
    flow.paragraph(`Tóm tắt: ${s.abstractVn.trim()}`, { size: 10, style: 'normal', align: 'justify', color: [40, 40, 40] })
    flow.gap(1.5)
  }
  // ---- Abstract (EN) ----
  if (s.abstractEn?.trim()) {
    flow.paragraph(`Abstract: ${s.abstractEn.trim()}`, { size: 10, style: 'normal', align: 'justify', color: [90, 90, 90] })
    flow.gap(1.5)
  }
  // ---- Từ khoá ----
  const kw = (s.keywords ?? []).map((k) => k.trim()).filter(Boolean)
  if (kw.length) {
    flow.paragraph(`Từ khóa: ${kw.join(', ')}.`, { size: 10, style: 'normal', align: 'justify', color: [40, 40, 40] })
  }
  flow.gap(3)
  flow.hr()
  flow.gap(4)

  // ---- Nội dung (từ htmlBody) ----
  const paragraphs = extractBodyParagraphs(a.htmlBody, [s.abstractVn ?? '', s.abstractEn ?? ''])
  if (paragraphs.length === 0) {
    flow.paragraph('(Bài chưa có nội dung toàn văn.)', { size: 11, style: 'normal', align: 'left', color: [120, 120, 120] })
  }
  for (const para of paragraphs) {
    flow.paragraph(para, { size: 11.5, style: 'normal', align: 'justify', lineGap: 1.45, indent: 6 })
    flow.gap(2)
  }

  return flow.finish()
}

async function main() {
  console.log(`▶ Dựng PDF cho bài xuất bản chưa có pdfFile${DRY_RUN ? ' [DRY-RUN]' : ''}${REPLACE ? ' [REPLACE]' : ''}\n`)

  const articles = (await prisma.article.findMany({
    select: {
      id: true,
      pdfFile: true,
      pages: true,
      htmlBody: true,
      submission: {
        select: {
          code: true,
          title: true,
          abstractVn: true,
          abstractEn: true,
          keywords: true,
          section: true,
          author: { select: { fullName: true, org: true } },
          category: { select: { name: true } },
        },
      },
    },
  })) as DemoArticle[]

  const outDirAbs = path.join(PUBLIC_DIR, OUTPUT_SUBDIR)
  if (!DRY_RUN) fs.mkdirSync(outDirAbs, { recursive: true })

  let built = 0
  let skipped = 0
  const failures: { title: string; reason: string }[] = []

  for (const a of articles) {
    if (!a.submission) {
      failures.push({ title: a.id, reason: 'Article không gắn Submission' })
      continue
    }
    const relPath = `/${OUTPUT_SUBDIR.replace(/\\/g, '/')}/${a.submission.code}.pdf` // /uploads/articles/<code>.pdf
    const diskPath = path.join(PUBLIC_DIR, relPath.replace(/^\//, ''))

    const alreadyDone = a.pdfFile && fs.existsSync(diskPath)
    if (alreadyDone && !REPLACE) {
      skipped++
      continue
    }

    if (DRY_RUN) {
      console.log(`  [DRY] ${a.submission.code}  "${a.submission.title.slice(0, 50)}"  → ${relPath}`)
      built++
      continue
    }

    try {
      const pdf = await renderDemoArticlePdf(a)
      fs.writeFileSync(diskPath, pdf)
      await prisma.article.update({ where: { id: a.id }, data: { pdfFile: relPath } })
      built++
      console.log(`  ✓ ${a.submission.code}  "${a.submission.title.slice(0, 50)}"`)
    } catch (err) {
      failures.push({ title: a.submission.title, reason: (err as Error).message })
    }
  }

  console.log('\n========================================')
  console.log(`Dựng thành công : ${built}`)
  console.log(`Bỏ qua (đã có)  : ${skipped}`)
  console.log(`Lỗi             : ${failures.length}`)
  failures.forEach((f) => console.log(`  ✗ ${f.title.slice(0, 60)} — ${f.reason}`))
  console.log('========================================\n')

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
