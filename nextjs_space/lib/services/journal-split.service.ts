/**
 * journal-split.service.ts
 *
 * Tách PDF số báo gốc thành từng file PDF bài báo riêng + render thumbnail trang đầu,
 * rồi cập nhật `articlePdfUrl`, `thumbnailUrl`, `splitStatus`, `thumbnailStatus`, `pageEnd`
 * cho từng JournalArticle.
 *
 * Ranh giới trang lấy từ chính các bản ghi JournalArticle (pageStart đã có; pageEnd suy
 * từ bài kế tiếp hoặc số trang của số báo). Yêu cầu các bản ghi bài + issue.pdfUrl tồn tại.
 *
 * Idempotent: bỏ qua bài đã có file PDF trừ khi `replace = true`.
 *
 * Tách từ scripts/journal/split-issue-articles.ts để vừa dùng cho CLI vừa dùng cho
 * orchestrator số hóa số báo cũ (journal-issue-ingest.service).
 */

import { promises as fs } from 'fs'
import path from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { PDFDocument } from 'pdf-lib'
import sharp from 'sharp'
import { prisma } from '@/lib/prisma'
import { resolveStoredFileToAbsolute } from '@/lib/storage-path'

const execFileAsync = promisify(execFile)
const PUBLIC_DIR = path.join(process.cwd(), 'public')

export interface SplitIssueOptions {
  /** Bù lệch giữa trang in (số trang trên giấy) và index trang PDF. */
  pageOffset?: number
  /** Tách lại cả bài đã có file PDF. */
  replace?: boolean
  /** Đường dẫn tuyệt đối tới PDF gốc, ghi đè issue.pdfUrl (dùng khi file ở chỗ khác). */
  sourcePdfOverride?: string
  /** Callback tiến trình cho orchestrator cập nhật status. */
  onProgress?: (info: { index: number; total: number; title: string }) => void
}

export interface SplitArticleDetail {
  articleId: string
  title: string
  status: 'done' | 'skipped' | 'error'
  message?: string
}

export interface SplitIssueSummary {
  issueId: string
  slug: string
  total: number
  done: number
  skipped: number
  errors: number
  details: SplitArticleDetail[]
}

function deriveYearFromSlug(issueSlug: string): string {
  const match = issueSlug.match(/(\d{4})/)
  return match ? match[1] : String(new Date().getFullYear())
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

/** Copy các trang [pageStart..pageEnd] (trang IN) từ PDF gốc sang file PDF mới. */
async function splitPdfRange(params: {
  sourcePdf: PDFDocument
  pageStart: number
  pageEnd: number
  pageOffset: number
  outputPath: string
}): Promise<void> {
  const outputPdf = await PDFDocument.create()
  const totalPages = params.sourcePdf.getPageCount()

  for (let printedPage = params.pageStart; printedPage <= params.pageEnd; printedPage++) {
    const pdfIndex = printedPage + params.pageOffset - 1
    if (pdfIndex < 0 || pdfIndex >= totalPages) continue
    const [copiedPage] = await outputPdf.copyPages(params.sourcePdf, [pdfIndex])
    outputPdf.addPage(copiedPage)
  }

  if (outputPdf.getPageCount() === 0) {
    throw new Error(`Không copy được trang nào cho trang in ${params.pageStart}–${params.pageEnd}`)
  }

  const outputBytes = await outputPdf.save()
  await fs.writeFile(params.outputPath, outputBytes)
}

/** Render trang 1 của PDF bài thành thumbnail .webp. Best-effort: ném lỗi nếu thiếu pdftoppm. */
async function renderThumbnail(articlePdfPath: string, outputWebpPath: string): Promise<void> {
  const tempPrefix = outputWebpPath.replace(/\.webp$/, '')
  await execFileAsync('pdftoppm', [
    '-f', '1', '-l', '1', '-singlefile', '-png', '-r', '150',
    articlePdfPath, tempPrefix,
  ])
  const pngPath = `${tempPrefix}.png`
  await sharp(pngPath).resize({ width: 900, withoutEnlargement: true }).webp({ quality: 82 }).toFile(outputWebpPath)
  await fs.rm(pngPath, { force: true })
}

export async function splitIssueArticles(
  issueIdOrSlug: string,
  options: SplitIssueOptions = {},
): Promise<SplitIssueSummary> {
  const pageOffset = options.pageOffset ?? 0
  const replace = options.replace ?? false

  const issue = await prisma.issue.findFirst({
    where: { OR: [{ id: issueIdOrSlug }, { slug: issueIdOrSlug }] },
    include: { journalArticles: { orderBy: { pageStart: 'asc' } } },
  })
  if (!issue) throw new Error(`Không tìm thấy số tạp chí: ${issueIdOrSlug}`)

  const slug = issue.slug ?? `issue-${issue.id}`

  const sourcePdfPath = options.sourcePdfOverride
    ?? (issue.pdfUrl ? resolveStoredFileToAbsolute(issue.pdfUrl) : null)
  if (!sourcePdfPath) {
    throw new Error(`Số "${slug}" chưa có pdfUrl. Cần upload PDF gốc trước khi tách bài.`)
  }
  if (!(await fileExists(sourcePdfPath))) {
    throw new Error(`Không tìm thấy file PDF gốc tại: ${sourcePdfPath}`)
  }

  const year = deriveYearFromSlug(slug)
  const articleDir = path.join(PUBLIC_DIR, 'uploads', 'journals', year, slug, 'articles')
  const thumbDir = path.join(PUBLIC_DIR, 'uploads', 'journals', year, slug, 'thumbnails')
  const urlBase = `/uploads/journals/${year}/${slug}`
  await fs.mkdir(articleDir, { recursive: true })
  await fs.mkdir(thumbDir, { recursive: true })

  const sourcePdf = await PDFDocument.load(await fs.readFile(sourcePdfPath))
  const articles = issue.journalArticles

  const summary: SplitIssueSummary = {
    issueId: issue.id,
    slug,
    total: articles.length,
    done: 0,
    skipped: 0,
    errors: 0,
    details: [],
  }

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i]
    const nextArticle = articles[i + 1]
    options.onProgress?.({ index: i + 1, total: articles.length, title: article.title })

    if (!article.slug) {
      summary.skipped++
      summary.details.push({ articleId: article.id, title: article.title, status: 'skipped', message: 'Thiếu slug' })
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

    if ((await fileExists(articlePdfPath)) && !replace) {
      summary.skipped++
      summary.details.push({ articleId: article.id, title: article.title, status: 'skipped', message: 'Đã tồn tại' })
      continue
    }

    try {
      await splitPdfRange({
        sourcePdf,
        pageStart: article.pageStart,
        pageEnd: computedPageEnd,
        pageOffset,
        outputPath: articlePdfPath,
      })

      // Thumbnail là best-effort: thiếu pdftoppm vẫn coi việc tách PDF là thành công.
      let thumbnailStatus = 'DONE'
      let thumbUrlToSave: string | null = thumbnailUrl
      try {
        await renderThumbnail(articlePdfPath, thumbnailPath)
      } catch {
        thumbnailStatus = 'ERROR'
        thumbUrlToSave = null
      }

      await prisma.journalArticle.update({
        where: { id: article.id },
        data: {
          pageEnd: computedPageEnd,
          articlePdfUrl,
          thumbnailUrl: thumbUrlToSave,
          splitStatus: 'DONE',
          thumbnailStatus,
        },
      })
      summary.done++
      summary.details.push({ articleId: article.id, title: article.title, status: 'done' })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      await prisma.journalArticle.update({
        where: { id: article.id },
        data: { splitStatus: 'ERROR', thumbnailStatus: 'ERROR' },
      }).catch(() => {})
      summary.errors++
      summary.details.push({ articleId: article.id, title: article.title, status: 'error', message })
    }
  }

  return summary
}
