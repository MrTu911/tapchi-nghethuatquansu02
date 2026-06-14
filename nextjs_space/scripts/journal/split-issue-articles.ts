/**
 * split-issue-articles.ts
 *
 * Tách PDF số báo gốc thành từng file PDF bài báo riêng,
 * render trang đầu mỗi bài thành ảnh thumbnail .webp,
 * cập nhật articlePdfUrl, thumbnailUrl, splitStatus, thumbnailStatus vào DB.
 *
 * Idempotent: bỏ qua bài đã xử lý trừ khi chạy với --replace
 *
 * Run:
 *   npx tsx --require dotenv/config scripts/journal/split-issue-articles.ts
 *   npx tsx --require dotenv/config scripts/journal/split-issue-articles.ts --replace
 *
 * Env:
 *   ISSUE_SLUG       — slug của Issue cần xử lý (default: so-1-231-2025)
 *   PDF_PAGE_OFFSET  — bù lệch trang PDF vs trang in (default: 0)
 *                      Ví dụ: bìa trước là trang 1 PDF nhưng không có số trang in → offset = 0
 *                      Nếu trang in 1 = trang PDF 3 → offset = 2
 *   SOURCE_PDF_PATH  — đường dẫn tuyệt đối đến file PDF gốc (override issue.pdfUrl)
 *                      Dùng khi file PDF đặt ở chỗ khác chưa khớp với pdfUrl trong DB
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PDFDocument } from 'pdf-lib'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import sharp from 'sharp'

const execFileAsync = promisify(execFile)

const prisma = new PrismaClient()

const ISSUE_SLUG = process.env.ISSUE_SLUG ?? 'so-1-231-2025'
const PDF_PAGE_OFFSET = Number(process.env.PDF_PAGE_OFFSET ?? '0')
const SHOULD_REPLACE = process.argv.includes('--replace')
const SOURCE_PDF_OVERRIDE = process.env.SOURCE_PDF_PATH ?? null

const PUBLIC_DIR = path.join(process.cwd(), 'public')

function buildArticleDir(issueSlug: string): string {
  const yearMatch = issueSlug.match(/(\d{4})/)
  const year = yearMatch ? yearMatch[1] : '2025'
  return path.join(PUBLIC_DIR, 'uploads', 'journals', year, issueSlug, 'articles')
}

function buildThumbDir(issueSlug: string): string {
  const yearMatch = issueSlug.match(/(\d{4})/)
  const year = yearMatch ? yearMatch[1] : '2025'
  return path.join(PUBLIC_DIR, 'uploads', 'journals', year, issueSlug, 'thumbnails')
}

function buildUrlBase(issueSlug: string): string {
  const yearMatch = issueSlug.match(/(\d{4})/)
  const year = yearMatch ? yearMatch[1] : '2025'
  return `/uploads/journals/${year}/${issueSlug}`
}

function sanitizeFileSlug(slug: string): string {
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function fileExists(filePath: string): Promise<boolean> {
  return fs.access(filePath).then(() => true).catch(() => false)
}

async function splitPdfRange(params: {
  sourcePdfBytes: Uint8Array
  pageStart: number
  pageEnd: number
  outputPath: string
}): Promise<void> {
  const sourcePdf = await PDFDocument.load(params.sourcePdfBytes)
  const outputPdf = await PDFDocument.create()
  const totalPages = sourcePdf.getPageCount()

  for (let printedPage = params.pageStart; printedPage <= params.pageEnd; printedPage++) {
    // pdf-lib uses 0-based index; PDF_PAGE_OFFSET accounts for pages before the printed numbering starts
    const pdfIndex = printedPage + PDF_PAGE_OFFSET - 1

    if (pdfIndex < 0 || pdfIndex >= totalPages) {
      console.warn(`  ⚠ Trang ngoài phạm vi PDF: trang in ${printedPage} → index ${pdfIndex} (tổng ${totalPages} trang)`)
      continue
    }

    const [copiedPage] = await outputPdf.copyPages(sourcePdf, [pdfIndex])
    outputPdf.addPage(copiedPage)
  }

  if (outputPdf.getPageCount() === 0) {
    throw new Error(`Không có trang nào được copy cho trang in ${params.pageStart}–${params.pageEnd}`)
  }

  const outputBytes = await outputPdf.save()
  await fs.writeFile(params.outputPath, outputBytes)
}

async function renderThumbnailFromPdf(params: {
  articlePdfPath: string
  outputWebpPath: string
}): Promise<void> {
  // Dùng pdftoppm (poppler-utils) để render trang 1 thành PNG, sau đó sharp convert sang webp
  const tempPrefix = params.outputWebpPath.replace(/\.webp$/, '')

  await execFileAsync('pdftoppm', [
    '-f', '1',
    '-l', '1',
    '-singlefile',
    '-png',
    '-r', '150',
    params.articlePdfPath,
    tempPrefix,
  ])

  const pngPath = `${tempPrefix}.png`

  await sharp(pngPath)
    .resize({ width: 900, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(params.outputWebpPath)

  await fs.rm(pngPath, { force: true })
}

async function main(): Promise<void> {
  console.log(`\n=== Tách PDF bài báo — Issue: ${ISSUE_SLUG} ===`)
  console.log(`PDF_PAGE_OFFSET: ${PDF_PAGE_OFFSET} | REPLACE: ${SHOULD_REPLACE}`)
  if (SOURCE_PDF_OVERRIDE) console.log(`SOURCE_PDF_OVERRIDE: ${SOURCE_PDF_OVERRIDE}`)
  console.log()

  const issue = await prisma.issue.findUnique({
    where: { slug: ISSUE_SLUG },
    include: {
      journalArticles: {
        orderBy: { pageStart: 'asc' },
      },
    },
  })

  if (!issue) {
    throw new Error(`Không tìm thấy Issue với slug="${ISSUE_SLUG}"`)
  }

  if (!issue.pdfUrl && !SOURCE_PDF_OVERRIDE) {
    throw new Error(`Issue "${ISSUE_SLUG}" chưa có pdfUrl trong DB. Dùng env SOURCE_PDF_PATH để chỉ đường dẫn file PDF gốc.`)
  }

  const sourcePdfPath = SOURCE_PDF_OVERRIDE
    ?? path.join(PUBLIC_DIR, issue.pdfUrl!.replace(/^\//, ''))

  if (!(await fileExists(sourcePdfPath))) {
    throw new Error(`Không tìm thấy file PDF gốc tại: ${sourcePdfPath}`)
  }

  const articleDir = buildArticleDir(ISSUE_SLUG)
  const thumbDir = buildThumbDir(ISSUE_SLUG)
  const urlBase = buildUrlBase(ISSUE_SLUG)

  await fs.mkdir(articleDir, { recursive: true })
  await fs.mkdir(thumbDir, { recursive: true })

  const sourcePdfBytes = await fs.readFile(sourcePdfPath)
  const articles = issue.journalArticles

  console.log(`Tìm thấy ${articles.length} bài báo trong issue.\n`)

  let doneCount = 0
  let skippedCount = 0
  let errorCount = 0

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i]
    const nextArticle = articles[i + 1]

    if (!article.slug) {
      console.warn(`[${i + 1}/${articles.length}] Bỏ qua — chưa có slug: "${article.title}"`)
      skippedCount++
      continue
    }

    const computedPageEnd =
      article.pageEnd ??
      (nextArticle ? nextArticle.pageStart - 1 : issue.pageCount ?? article.pageStart)

    const fileSlug = sanitizeFileSlug(article.slug)
    const articlePdfPath = path.join(articleDir, `${fileSlug}.pdf`)
    const thumbnailPath = path.join(thumbDir, `${fileSlug}.webp`)
    const articlePdfUrl = `${urlBase}/articles/${fileSlug}.pdf`
    const thumbnailUrl = `${urlBase}/thumbnails/${fileSlug}.webp`

    const alreadyExists = await fileExists(articlePdfPath)

    if (alreadyExists && !SHOULD_REPLACE) {
      console.log(`[${i + 1}/${articles.length}] Bỏ qua (đã tồn tại): ${fileSlug}`)
      skippedCount++
      continue
    }

    console.log(`[${i + 1}/${articles.length}] Xử lý: ${article.title}`)
    console.log(`  Trang in: ${article.pageStart}–${computedPageEnd} | slug: ${fileSlug}`)

    try {
      await splitPdfRange({
        sourcePdfBytes,
        pageStart: article.pageStart,
        pageEnd: computedPageEnd,
        outputPath: articlePdfPath,
      })
      console.log(`  ✓ PDF tách xong`)

      await renderThumbnailFromPdf({
        articlePdfPath,
        outputWebpPath: thumbnailPath,
      })
      console.log(`  ✓ Thumbnail tạo xong`)

      await prisma.journalArticle.update({
        where: { id: article.id },
        data: {
          pageEnd: computedPageEnd,
          articlePdfUrl,
          thumbnailUrl,
          splitStatus: 'DONE',
          thumbnailStatus: 'DONE',
        },
      })
      console.log(`  ✓ DB cập nhật\n`)
      doneCount++
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`  ✗ Lỗi: ${message}\n`)

      await prisma.journalArticle.update({
        where: { id: article.id },
        data: {
          splitStatus: 'ERROR',
          thumbnailStatus: 'ERROR',
        },
      })
      errorCount++
    }
  }

  console.log('=== Kết quả ===')
  console.log(`  Thành công: ${doneCount}`)
  console.log(`  Bỏ qua:    ${skippedCount}`)
  console.log(`  Lỗi:       ${errorCount}`)
  console.log(`  Tổng:      ${articles.length}\n`)
}

main()
  .catch((err) => {
    console.error('Fatal:', err instanceof Error ? err.message : err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
