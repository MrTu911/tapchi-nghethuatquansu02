/**
 * rebuild-missing-article-pdfs.ts
 *
 * Tái tạo file PDF cho các bài JournalArticle có `articlePdfUrl` trong CSDL nhưng
 * FILE GỐC ĐÃ MẤT trên đĩa (vd Số 1/2026 — so-01-2026: chỉ còn corpus + epub, thiếu
 * thư mục articles_pdf). Nội dung lấy từ "bản đọc số" (corpus.json) — chính là nguồn
 * sinh ra epub/Thư viện số — gồm: chuyên mục, tiêu đề, tác giả, tóm tắt, từ khóa,
 * toàn văn và tài liệu tham khảo.
 *
 * LƯU Ý: Đây là PDF *dựng lại từ văn bản số hoá* (giống nội dung epub), KHÔNG phải
 * bản scan/layout in gốc — vì bản layout gốc không còn tồn tại trên hệ thống. Bài
 * được tái tạo sẽ đánh dấu splitStatus = 'RECONSTRUCTED' để truy vết.
 *
 * File được ghi đúng vào đường dẫn mà `articlePdfUrl` trỏ tới → link tải/đọc hiện có
 * tự động hoạt động, không cần đổi dữ liệu khác.
 *
 * Idempotent: bỏ qua bài đã có file, trừ khi chạy với --replace.
 *
 * Run:
 *   npx tsx --require dotenv/config scripts/journal/rebuild-missing-article-pdfs.ts
 *   ISSUE_SLUG=so-01-2026 npx tsx --require dotenv/config scripts/journal/rebuild-missing-article-pdfs.ts
 *   ... --replace        # ghi đè cả file đang có
 *   ... --dry-run        # chỉ liệt kê, không ghi file/không đổi DB
 */
import { prisma } from '../../lib/db'
import { createArticlePdfDoc, PdfFlow, JOURNAL_NAME, ACCENT, GOLD } from '../../lib/pdf/article-pdf'
import * as fs from 'node:fs'
import * as path from 'node:path'

const PUBLIC_DIR = path.join(process.cwd(), 'public')
const CORPUS_BASE = path.join(PUBLIC_DIR, 'data', 'issues')

const REPLACE = process.argv.includes('--replace')
const DRY_RUN = process.argv.includes('--dry-run')
const ISSUE_FILTER = process.env.ISSUE_SLUG?.trim() || null

// ----------------------------- corpus types -----------------------------
interface CorpusAuthor {
  rank?: string
  degree?: string
  name?: string
  affiliation?: string
}
interface CorpusArticle {
  id: string
  pdf_path?: string
  section?: string
  title?: { main?: string; subtitle?: string }
  authors?: CorpusAuthor[]
  affiliation?: string
  abstract?: { vi?: string; en?: string }
  keywords?: { vi?: string[]; en?: string[] }
  body?: { paragraphs?: { type?: string; text?: string }[] }
  references?: string[]
  page_start?: number
  page_end?: number
}
interface Corpus {
  issue?: { name?: string; title?: string }
  articles: CorpusArticle[]
}

/** Nạp toàn bộ corpus.json, lập chỉ mục theo "issueSlug::<basename pdf_path>". */
function buildCorpusIndex(): Map<string, { issueSlug: string; issueName: string; article: CorpusArticle }> {
  const index = new Map<string, { issueSlug: string; issueName: string; article: CorpusArticle }>()
  if (!fs.existsSync(CORPUS_BASE)) return index
  for (const slug of fs.readdirSync(CORPUS_BASE)) {
    const file = path.join(CORPUS_BASE, slug, 'corpus.json')
    if (!fs.existsSync(file)) continue
    const corpus = JSON.parse(fs.readFileSync(file, 'utf8')) as Corpus
    const issueName = corpus.issue?.name || corpus.issue?.title || slug
    for (const article of corpus.articles ?? []) {
      if (!article.pdf_path) continue
      const key = `${slug}::${path.basename(article.pdf_path)}`
      index.set(key, { issueSlug: slug, issueName, article })
    }
  }
  return index
}

// ----------------------------- PDF rendering -----------------------------
function formatAuthor(a: CorpusAuthor): string {
  const prefix = [a.rank, a.degree].filter(Boolean).join(', ')
  const name = a.name?.trim() || ''
  return prefix ? `${prefix}. ${name}` : name
}

/** Render 1 bài thành Buffer PDF từ dữ liệu corpus. */
async function renderArticlePdf(article: CorpusArticle, issueName: string): Promise<Buffer> {
  const doc = await createArticlePdfDoc()
  const flow = new PdfFlow(doc)

  // ---- Header tạp chí ----
  const pages =
    article.page_start != null
      ? `Tr. ${article.page_start}${article.page_end != null && article.page_end !== article.page_start ? '–' + article.page_end : ''}`
      : ''
  flow.paragraph(`${JOURNAL_NAME}  •  ${issueName}${pages ? '  •  ' + pages : ''}`, {
    size: 8.5,
    style: 'bold',
    color: ACCENT,
    align: 'center',
  })
  flow.hr(GOLD, 0.4)
  flow.gap(5)

  // ---- Chuyên mục ----
  if (article.section?.trim()) {
    flow.paragraph(article.section.trim().toUpperCase(), { size: 9, style: 'bold', color: GOLD, align: 'center' })
    flow.gap(1.5)
  }

  // ---- Tiêu đề ----
  if (article.title?.main?.trim()) {
    flow.paragraph(article.title.main.trim(), { size: 15, style: 'bold', align: 'center', color: ACCENT, lineGap: 1.25 })
  }
  if (article.title?.subtitle?.trim()) {
    flow.gap(0.5)
    flow.paragraph(article.title.subtitle.trim(), { size: 12, style: 'bold', align: 'center', color: ACCENT, lineGap: 1.25 })
  }
  flow.gap(3)

  // ---- Tác giả + đơn vị ----
  const authors = article.authors ?? []
  if (authors.length > 0) {
    const authorLine = authors.map(formatAuthor).filter(Boolean).join('; ')
    if (authorLine) flow.paragraph(authorLine, { size: 10.5, style: 'bold', align: 'center' })
    const affs = Array.from(new Set(authors.map((a) => a.affiliation?.trim()).filter(Boolean) as string[]))
    const affLine = affs.length ? affs.join(' — ') : article.affiliation?.trim() || ''
    if (affLine) flow.paragraph(affLine, { size: 9.5, style: 'normal', align: 'center', color: [80, 80, 80] })
  } else if (article.affiliation?.trim()) {
    flow.paragraph(article.affiliation.trim(), { size: 9.5, style: 'normal', align: 'center', color: [80, 80, 80] })
  }
  flow.gap(4)

  // ---- Tóm tắt ----
  const abstractVi = article.abstract?.vi?.trim()
  if (abstractVi) {
    flow.paragraph(`Tóm tắt: ${abstractVi}`, { size: 10, style: 'normal', align: 'justify', color: [40, 40, 40] })
    flow.gap(1.5)
  }
  // ---- Từ khóa ----
  const kwVi = (article.keywords?.vi ?? []).map((k) => k.trim()).filter(Boolean)
  if (kwVi.length) {
    flow.paragraph(`Từ khóa: ${kwVi.join(', ')}.`, { size: 10, style: 'normal', align: 'justify', color: [40, 40, 40] })
  }
  flow.gap(3)
  flow.hr()
  flow.gap(4)

  // ---- Nội dung ----
  const paragraphs = (article.body?.paragraphs ?? []).map((p) => p.text?.trim()).filter(Boolean) as string[]
  for (const para of paragraphs) {
    flow.paragraph(para, { size: 11.5, style: 'normal', align: 'justify', lineGap: 1.45, indent: 6 })
    flow.gap(2)
  }

  // ---- Tài liệu tham khảo ----
  const refs = (article.references ?? []).map((r) => r.trim()).filter(Boolean)
  if (refs.length) {
    flow.gap(3)
    flow.ensureSpace(8)
    flow.paragraph('TÀI LIỆU THAM KHẢO', { size: 10.5, style: 'bold', color: ACCENT })
    flow.gap(1.5)
    for (const ref of refs) {
      flow.paragraph(ref, { size: 9.5, style: 'normal', align: 'justify', lineGap: 1.35, indent: 4 })
      flow.gap(0.8)
    }
  }

  return flow.finish()
}

// ----------------------------- main -----------------------------
async function main() {
  console.log(`▶ Tái tạo PDF bài báo bị thiếu file${ISSUE_FILTER ? ` (lọc số: ${ISSUE_FILTER})` : ''}${DRY_RUN ? ' [DRY-RUN]' : ''}${REPLACE ? ' [REPLACE]' : ''}\n`)

  const corpusIndex = buildCorpusIndex()

  const articles = await prisma.journalArticle.findMany({
    where: {
      articlePdfUrl: { not: null },
      ...(ISSUE_FILTER ? { issue: { slug: ISSUE_FILTER } } : {}),
    },
    select: {
      id: true,
      title: true,
      articlePdfUrl: true,
      issue: { select: { slug: true, number: true, year: true } },
    },
  })

  let rebuilt = 0
  let skippedExists = 0
  let skippedNoCorpus = 0
  const failures: { title: string; reason: string }[] = []
  const reconstructedIds: string[] = []

  for (const a of articles) {
    const url = a.articlePdfUrl!
    if (url.startsWith('http')) continue // bài liên kết ngoài — bỏ qua
    const diskPath = path.join(PUBLIC_DIR, url.replace(/^\//, ''))

    if (fs.existsSync(diskPath) && !REPLACE) {
      skippedExists++
      continue
    }

    const issueSlug = a.issue?.slug
    if (!issueSlug) {
      failures.push({ title: a.title, reason: 'Bài không gắn số (issue.slug rỗng)' })
      continue
    }
    const key = `${issueSlug}::${path.basename(url)}`
    const match = corpusIndex.get(key)
    if (!match) {
      skippedNoCorpus++
      failures.push({ title: a.title, reason: `Không tìm thấy bài trong corpus: ${key}` })
      continue
    }

    if (DRY_RUN) {
      console.log(`  [DRY] ${issueSlug}  ${path.basename(url)}`)
      rebuilt++
      reconstructedIds.push(a.id)
      continue
    }

    try {
      const pdf = await renderArticlePdf(match.article, match.issueName)
      fs.mkdirSync(path.dirname(diskPath), { recursive: true })
      fs.writeFileSync(diskPath, pdf)
      reconstructedIds.push(a.id)
      rebuilt++
      if (rebuilt % 10 === 0) console.log(`  … đã tạo ${rebuilt} file`)
    } catch (err) {
      failures.push({ title: a.title, reason: (err as Error).message })
    }
  }

  // Đánh dấu provenance: splitStatus = 'RECONSTRUCTED' (không có consumer UI, an toàn)
  if (!DRY_RUN && reconstructedIds.length > 0) {
    await prisma.journalArticle.updateMany({
      where: { id: { in: reconstructedIds } },
      data: { splitStatus: 'RECONSTRUCTED' },
    })
  }

  console.log('\n========================================')
  console.log(`Tái tạo thành công : ${rebuilt}`)
  console.log(`Bỏ qua (đã có file): ${skippedExists}`)
  console.log(`Thiếu corpus       : ${skippedNoCorpus}`)
  console.log(`Lỗi                : ${failures.length}`)
  if (failures.length) {
    console.log('\nChi tiết lỗi (tối đa 30):')
    failures.slice(0, 30).forEach((f) => console.log(`  ✗ ${f.title.slice(0, 60)} — ${f.reason}`))
  }
  console.log('========================================\n')

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
