/**
 * journal-corpus.service.ts
 *
 * Sinh "bản đọc số" cho Thư viện (KindleReader) từ dữ liệu số hóa trong DB.
 * Đọc Issue → IssueSection → JournalArticle → JournalArticleAuthor, trích toàn văn
 * từ PDF từng bài (pdf-parse), rồi ghi gói tĩnh:
 *
 *   public/data/issues/<slug>/
 *     ├── corpus.json
 *     ├── cover.jpg
 *     └── articles_pdf/<article-slug>.pdf
 *
 * Gói này khớp interface `Corpus` trong types/corpus.ts, được
 * app/(public)/library đọc trực tiếp.
 *
 * Lưu ý dữ liệu: KHÔNG chuẩn hóa/sửa nội dung bài (affiliation, trích dẫn...) —
 * đó là dữ liệu học thuật thật.
 */

import { promises as fs } from 'fs'
import path from 'path'
import sharp from 'sharp'
import { prisma } from '@/lib/prisma'
import { resolveStoredFileToAbsolute } from '@/lib/storage-path'
import { extractVietnameseText } from '@/lib/services/journal-text-extract.service'
import { readImagesLayout } from '@/lib/services/journal-images-layout.service'
import { slugify } from '@/lib/services/journal-issue-import.service'
import type {
  Corpus,
  CorpusArticle,
  CorpusAuthor,
  CorpusParagraph,
  CorpusSection,
} from '@/types/corpus'

const JOURNAL_TITLE = 'Tạp chí Nghệ thuật Quân sự Việt Nam'
const PUBLIC_DIR = path.join(process.cwd(), 'public')
const ISSUES_DATA_DIR = path.join(PUBLIC_DIR, 'data', 'issues')
const REFERENCES_HEADING = /(TÀI LIỆU THAM KHẢO|DANH MỤC TÀI LIỆU THAM KHẢO)/i

export interface BuildCorpusOptions {
  /** Bật OCR tiếng Việt cho PDF font cũ khi trích text trực tiếp ra rác (chậm hơn nhiều). */
  ocr?: boolean
}

export interface CorpusBuildSummary {
  issueId: string
  slug: string
  totalArticles: number
  generated: number
  skipped: { title: string; reason: string }[]
  extractedFromPdf: number
  /** Bài lấy được toàn văn nhờ OCR (PDF scan/ảnh). */
  ocrApplied: number
  /** Bài lấy được toàn văn nhờ chuyển mã TCVN3 (font cũ có lớp text). */
  tcvn3Applied: number
  /** Bài có PDF nhưng text trích ra không đọc được (kể cả OCR) → body để trống, vẫn có nút Tải PDF. */
  lowQualityText: number
  coverGenerated: boolean
}

/**
 * Sinh gói corpus cho một số tạp chí (nhận id hoặc slug).
 */
export async function buildIssueCorpus(
  issueIdOrSlug: string,
  options: BuildCorpusOptions = {},
): Promise<CorpusBuildSummary> {
  const issue = await loadIssueForCorpus(issueIdOrSlug)
  if (!issue) {
    throw new Error(`Không tìm thấy số tạp chí: ${issueIdOrSlug}`)
  }

  const slug = issue.slug ?? slugify(`so-${issue.number}-${issue.year}`)
  const outDir = path.join(ISSUES_DATA_DIR, slug)
  const pdfOutDir = path.join(outDir, 'articles_pdf')
  await fs.mkdir(pdfOutDir, { recursive: true })

  const skipped: CorpusBuildSummary['skipped'] = []
  let extractedFromPdf = 0
  let ocrApplied = 0
  let tcvn3Applied = 0
  let lowQualityText = 0

  // Map article -> id corpus (art_001...) theo thứ tự pageStart
  const articleIdByDbId = new Map<string, string>()
  issue.journalArticles.forEach((a, idx) => {
    articleIdByDbId.set(a.id, `art_${String(idx + 1).padStart(3, '0')}`)
  })

  // Bố cục ảnh do BTV quyết (ảnh trong bài + ảnh đầu/cuối số) — sống sót qua rebuild.
  const imagesLayout = await readImagesLayout(slug)

  const corpusArticles: CorpusArticle[] = []

  for (const article of issue.journalArticles) {
    const corpusId = articleIdByDbId.get(article.id)!

    if (!article.articlePdfUrl || !article.slug) {
      skipped.push({
        title: article.title,
        reason: !article.slug ? 'Thiếu slug bài viết' : 'Chưa tách PDF (articlePdfUrl rỗng)',
      })
      continue
    }

    // Copy PDF bài viết vào gói
    const pdfSrc = resolveStoredFileToAbsolute(article.articlePdfUrl)
    const pdfFileName = `${article.slug}.pdf`
    try {
      await fs.copyFile(pdfSrc, path.join(pdfOutDir, pdfFileName))
    } catch {
      skipped.push({ title: article.title, reason: `Không đọc được PDF: ${article.articlePdfUrl}` })
      continue
    }

    // Toàn văn: ưu tiên contentHtml/contentText; nếu chưa có thì trích từ PDF (và OCR nếu bật)
    const body = await resolveArticleBody(article, pdfSrc, options.ocr ?? false)
    const { references } = body
    if (body.didExtract) extractedFromPdf++
    if (body.ocrApplied) ocrApplied++
    if (body.tcvn3Applied) tcvn3Applied++
    if (body.lowQuality) lowQualityText++

    // Chèn ảnh minh họa (đã bật) vào cuối thân bài.
    const enabledImages = (imagesLayout.articles[article.slug]?.images ?? []).filter((img) => img.enabled)
    const paragraphs: CorpusParagraph[] = [
      ...body.paragraphs,
      ...enabledImages.map((img): CorpusParagraph => ({ type: 'image', text: '', src: img.file, caption: img.caption })),
    ]

    corpusArticles.push(
      buildCorpusArticle(article, corpusId, pdfFileName, paragraphs, references),
    )
  }

  const corpus: Corpus = {
    issue: {
      title: JOURNAL_TITLE,
      name: buildIssueName(issue),
      total_pages: issue.pageCount ?? maxPageEnd(issue.journalArticles),
      total_articles: corpusArticles.length,
    },
    sections: buildSections(issue.sections, issue.journalArticles, articleIdByDbId),
    articles: corpusArticles,
    frontMatter: imagesLayout.frontMatter.map((m) => ({ src: m.file, caption: m.caption })),
    backMatter: imagesLayout.backMatter.map((m) => ({ src: m.file, caption: m.caption })),
  }

  await fs.writeFile(
    path.join(outDir, 'corpus.json'),
    JSON.stringify(corpus, null, 2),
    'utf-8',
  )

  const coverGenerated = await writeCover(issue.coverImage, outDir)

  return {
    issueId: issue.id,
    slug,
    totalArticles: issue.journalArticles.length,
    generated: corpusArticles.length,
    skipped,
    extractedFromPdf,
    ocrApplied,
    tcvn3Applied,
    lowQualityText,
    coverGenerated,
  }
}

// ─── Data loading ───────────────────────────────────────────────────────────

type IssueWithCorpusData = NonNullable<Awaited<ReturnType<typeof loadIssueForCorpus>>>
type JournalArticleWithRelations = IssueWithCorpusData['journalArticles'][number]

async function loadIssueForCorpus(issueIdOrSlug: string) {
  return prisma.issue.findFirst({
    where: { OR: [{ id: issueIdOrSlug }, { slug: issueIdOrSlug }] },
    include: {
      volume: true,
      sections: { orderBy: { order: 'asc' } },
      journalArticles: {
        orderBy: { pageStart: 'asc' },
        include: {
          authors: { orderBy: { order: 'asc' } },
          section: true,
        },
      },
    },
  })
}

// ─── Mapping helpers ──────────────────────────────────────────────────────────

function buildIssueName(issue: IssueWithCorpusData): string {
  const month = String(issue.number).padStart(2, '0')
  const base = issue.issueCode ? `Số ${issue.number} (${issue.issueCode})` : `Số ${issue.number}`
  return `${base} — ${month}/${issue.year}`
}

function maxPageEnd(articles: JournalArticleWithRelations[]): number {
  return articles.reduce((max, a) => Math.max(max, a.pageEnd ?? a.pageStart), 0)
}

function buildSections(
  sections: IssueWithCorpusData['sections'],
  articles: JournalArticleWithRelations[],
  articleIdByDbId: Map<string, string>,
): CorpusSection[] {
  const result: CorpusSection[] = sections.map((section) => ({
    name: section.name,
    article_ids: articles
      .filter((a) => a.sectionId === section.id && articleIdByDbId.has(a.id))
      .map((a) => articleIdByDbId.get(a.id)!),
  }))

  // Bài chưa gán chuyên mục → gom vào nhóm cuối để vẫn xuất hiện trong mục lục
  const unsectioned = articles
    .filter((a) => !a.sectionId && articleIdByDbId.has(a.id))
    .map((a) => articleIdByDbId.get(a.id)!)
  if (unsectioned.length > 0) {
    result.push({ name: 'Bài viết khác', article_ids: unsectioned })
  }

  return result.filter((s) => s.article_ids.length > 0)
}

function buildCorpusArticle(
  article: JournalArticleWithRelations,
  corpusId: string,
  pdfFileName: string,
  paragraphs: CorpusParagraph[],
  references: string[],
): CorpusArticle {
  const pageEnd = article.pageEnd ?? article.pageStart
  return {
    id: corpusId,
    page_start: article.pageStart,
    page_end: pageEnd,
    page_count: Math.max(1, pageEnd - article.pageStart + 1),
    pdf_path: `articles_pdf/${pdfFileName}`,
    section: article.section?.name ?? '',
    title: { main: article.title, subtitle: '' },
    authors: article.authors.map(mapAuthor),
    affiliation: article.authors[0]?.organization ?? '',
    abstract: { vi: article.abstract ?? '', en: '' },
    keywords: { vi: article.keywords ?? [], en: [] },
    body: { paragraphs },
    references,
  }
}

function mapAuthor(author: JournalArticleWithRelations['authors'][number]): CorpusAuthor {
  const degree = [author.academicTitle, author.degree].filter(Boolean).join(', ')
  return {
    rank: author.militaryRank ?? '',
    degree,
    name: author.name,
    affiliation: author.organization ?? '',
  }
}

// ─── Body / references extraction ─────────────────────────────────────────────

interface ArticleBodyResult {
  paragraphs: CorpusParagraph[]
  references: string[]
  /** Lấy được toàn văn từ lớp text PDF (pdftotext/pdf-parse/chuyển mã TCVN3). */
  didExtract: boolean
  ocrApplied: boolean
  tcvn3Applied: boolean
  lowQuality: boolean
}

async function resolveArticleBody(
  article: JournalArticleWithRelations,
  pdfAbsPath: string,
  ocr: boolean,
): Promise<ArticleBodyResult> {
  // 1. Đã có nội dung số hóa trong DB → dùng luôn (đã được biên tập/duyệt).
  //    QUAN TRỌNG: nhờ đây, bản BTV sửa tay (lưu vào contentText) được rebuild dùng lại,
  //    không trích/OCR lại.
  if (article.contentHtml && article.contentHtml.trim()) {
    return { ...splitBodyAndReferences(htmlToText(article.contentHtml)), didExtract: false, ocrApplied: false, tcvn3Applied: false, lowQuality: false }
  }
  if (article.contentText && article.contentText.trim()) {
    return { ...splitBodyAndReferences(article.contentText), didExtract: false, ocrApplied: false, tcvn3Applied: false, lowQuality: false }
  }

  // 2. Trích tự chọn engine: pdftotext → chuyển mã TCVN3 → OCR.
  const res = await extractVietnameseText(pdfAbsPath, { ocr })
  if (res.lowQuality) {
    // Không đọc được (kể cả OCR) → body để trống; reader vẫn có tóm tắt + nút Tải PDF.
    await markExtractionStatus(article.id, ocr ? 'OCR_FAILED' : 'LOW_QUALITY')
    return { paragraphs: [], references: [], didExtract: false, ocrApplied: false, tcvn3Applied: false, lowQuality: true }
  }
  await persistExtractedText(article.id, res.text, res.source)
  return {
    ...splitBodyAndReferences(res.text),
    didExtract: !res.ocrApplied,
    ocrApplied: res.ocrApplied,
    tcvn3Applied: res.tcvn3Applied,
    lowQuality: false,
  }
}

async function persistExtractedText(articleId: string, text: string, source: string): Promise<void> {
  try {
    const status = source.startsWith('ocr') ? 'OCR_DONE' : 'DONE'
    await prisma.journalArticle.update({
      where: { id: articleId },
      data: { contentText: text, contentSource: source, extractionStatus: status },
    })
  } catch (error) {
    // Không chặn việc sinh corpus nếu ghi cache thất bại
    console.warn(`[corpus] Không ghi được contentText cho bài ${articleId}:`, error)
  }
}

async function markExtractionStatus(articleId: string, status: string): Promise<void> {
  try {
    await prisma.journalArticle.update({ where: { id: articleId }, data: { extractionStatus: status } })
  } catch {
    /* không chặn việc sinh corpus */
  }
}

/** Tách phần "TÀI LIỆU THAM KHẢO" khỏi thân bài; trả về body + references. */
function splitBodyAndReferences(raw: string): {
  paragraphs: CorpusParagraph[]
  references: string[]
} {
  const text = raw.replace(/\r/g, '')
  const headingMatch = text.match(REFERENCES_HEADING)

  if (!headingMatch || headingMatch.index === undefined) {
    return { paragraphs: buildParagraphs(text), references: [] }
  }

  const bodyText = text.slice(0, headingMatch.index)
  const refsText = text.slice(headingMatch.index + headingMatch[0].length)
  return {
    paragraphs: buildParagraphs(bodyText),
    references: parseReferences(refsText),
  }
}

/** Tách danh mục tham khảo theo các mục đánh số "1." "2." ... */
function parseReferences(refsText: string): string[] {
  const normalized = refsText.replace(/\s+/g, ' ').trim()
  if (!normalized) return []
  const parts = normalized.split(/(?=(?:^|\s)\d{1,3}\.\s)/).map((p) => p.trim()).filter(Boolean)
  // Nếu không tách được theo số thứ tự, trả về từng dòng không rỗng
  if (parts.length <= 1) {
    return refsText.split(/\n+/).map((l) => l.trim()).filter((l) => l.length > 3)
  }
  return parts
}

/**
 * Chia text PDF thô thành các đoạn đọc được.
 * pdf-parse thường trả 1 dòng/`\n` nên ưu tiên gom dòng theo ranh giới câu.
 */
function buildParagraphs(raw: string): CorpusParagraph[] {
  const text = raw.replace(/[ \t]+/g, ' ').trim()
  if (!text) return []

  // Trường hợp tốt: PDF có dòng trống ngăn đoạn
  const byBlankLine = text
    .split(/\n[ \t]*\n+/)
    .map((b) => b.replace(/\n/g, ' ').trim())
    .filter(Boolean)
  if (byBlankLine.length >= 3) {
    return byBlankLine.map((t) => ({ type: 'p', text: t }))
  }

  // Trường hợp phổ biến: gom dòng đơn thành đoạn theo ranh giới câu
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean)
  return groupLinesIntoParagraphs(lines)
}

function groupLinesIntoParagraphs(lines: string[]): CorpusParagraph[] {
  const paragraphs: CorpusParagraph[] = []
  let buffer = ''

  const flush = () => {
    const trimmed = buffer.trim()
    if (trimmed) paragraphs.push({ type: 'p', text: trimmed })
    buffer = ''
  }

  for (const line of lines) {
    if (isHeadingLine(line)) {
      flush()
      paragraphs.push({ type: 'h2', text: line })
      continue
    }
    buffer = buffer ? `${buffer} ${line}` : line
    const endsSentence = /[.!?…]["”)]?$/.test(line)
    if (endsSentence && buffer.length >= 280) flush()
  }
  flush()
  return paragraphs
}

/** Dòng tiêu đề mục: ngắn, viết hoa phần lớn, không kết câu. */
function isHeadingLine(line: string): boolean {
  if (line.length < 4 || line.length > 90) return false
  if (/[.!?…]$/.test(line)) return false
  const letters = line.replace(/[^A-Za-zÀ-ỹ]/g, '')
  if (letters.length < 4) return false
  const upper = letters.replace(/[^A-ZÀ-Ỹ]/g, '')
  return upper.length / letters.length > 0.7
}

function htmlToText(html: string): string {
  return html
    .replace(/<\/(p|div|h[1-6]|li|br)>/gi, '\n')
    .replace(/<br\s*\/?>(?=)/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
}

// ─── File helpers ──────────────────────────────────────────────────────────────

async function writeCover(coverImage: string | null, outDir: string): Promise<boolean> {
  if (!coverImage) return false
  try {
    const src = resolveStoredFileToAbsolute(coverImage)
    const buffer = await fs.readFile(src)
    await sharp(buffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toFile(path.join(outDir, 'cover.jpg'))
    return true
  } catch (error) {
    console.warn('[corpus] Không tạo được cover.jpg:', error)
    return false
  }
}
