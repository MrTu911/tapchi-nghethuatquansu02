/**
 * journal-issue-ingest.service.ts
 *
 * Orchestrator SỐ HÓA SỐ BÁO CŨ: từ PDF số báo + danh sách bài đã xác nhận (draft)
 * → tạo bản ghi → tách PDF → trích/OCR toàn văn → corpus.json → EPUB → đối chiếu trùng
 * → xuất bản. Tái dùng tối đa các service đã có (split, corpus, epub, plagiarism).
 *
 * Nguồn sự thật làm sạch là corpus.json; cả contentText (CSDL bài báo, phục vụ tra cứu +
 * đạo văn) lẫn issue.epub đều dẫn xuất từ DB → corpus.json.
 *
 * Tiến trình ghi ra public/data/issues/<slug>/ingest-status.json (không thêm bảng DB —
 * DB dùng chung, tránh db push). UI poll file này. Job chạy nền (fire-and-forget).
 */

import { promises as fs } from 'fs'
import path from 'path'
import { PDFDocument } from 'pdf-lib'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { resolveStoredFileToAbsolute } from '@/lib/storage-path'
import { slugify } from '@/lib/services/journal-issue-import.service'
import { upsertVolume } from '@/lib/services/journal-corpus-import.service'
import { buildUnambiguousUserNameMap, matchUserId } from '@/lib/services/journal-author-linker'
import { splitIssueArticles } from '@/lib/services/journal-split.service'
import { buildIssueCorpus } from '@/lib/services/journal-corpus.service'
import { buildIssueEpub } from '@/lib/services/journal-epub.service'
import { checkTextsAgainstCorpus } from '@/lib/plagiarism'
import { matchSeverity, type PlagiarismMatch } from '@/lib/plagiarism/scoring'
import type { DraftArticle } from '@/lib/services/journal-toc-parser.service'

const ISSUES_DATA_DIR = path.join(process.cwd(), 'public', 'data', 'issues')
const STATUS_FILE = 'ingest-status.json'
// Mức nghiêm trọng coi là "trùng" với bài đã có trong CSDL (cảnh báo, vẫn nhập).
const DUP_SEVERITY_THRESHOLD = 60
// Nguồn coi là "đã có trong CSDL bài báo": kho số đã in + bài xuất bản qua phản biện.
const DUP_SOURCE_TYPES: PlagiarismMatch['type'][] = ['journal', 'article']

// ─── Kiểu dữ liệu ────────────────────────────────────────────────────────────

export type IngestPhase =
  | 'CREATED'
  | 'SPLITTING'
  | 'EXTRACTING'
  | 'EPUB'
  | 'DUPLICATE_CHECK'
  | 'PUBLISHING'
  | 'DONE'
  | 'FAILED'

export interface DuplicateFlag {
  articleId: string
  title: string
  slug: string
  severity: number
  matches: { id: string; title: string; type: string; severity: number }[]
}

export interface IngestStatus {
  slug: string
  issueId: string
  status: 'processing' | 'done' | 'failed'
  phase: IngestPhase
  message: string
  totalArticles: number
  splitDone: number
  splitErrors: number
  extractedFromPdf: number
  ocrApplied: number
  lowQuality: number
  duplicatesFlagged: DuplicateFlag[]
  errors: string[]
  startedAt: string
  finishedAt?: string
  epubUrl?: string
  libraryUrl?: string
}

export interface IngestDraftInput {
  /** Slug số báo; mặc định suy từ number/issueCode/year. */
  slug?: string
  number: number
  year: number
  month?: number
  title?: string
  issueCode?: number
  isSpecial?: boolean
  /** Đường dẫn cover đã upload (dạng lưu trong DB, vd '/uploads/...'); tuỳ chọn. */
  coverImage?: string | null
  /** Đường dẫn PDF số báo đã upload (dạng lưu trong DB, vd '/uploads/...'). */
  pdfUrl: string
  pageOffset?: number
  articles: DraftArticle[]
}

export interface IngestRunOptions {
  pageOffset?: number
  ocr?: boolean
}

// ─── Status file ─────────────────────────────────────────────────────────────

function statusPath(slug: string): string {
  return path.join(ISSUES_DATA_DIR, slug, STATUS_FILE)
}

async function writeStatus(status: IngestStatus): Promise<void> {
  const dir = path.join(ISSUES_DATA_DIR, status.slug)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(statusPath(status.slug), JSON.stringify(status, null, 2), 'utf-8')
}

export async function getIngestStatus(slug: string): Promise<IngestStatus | null> {
  try {
    const raw = await fs.readFile(statusPath(slug), 'utf-8')
    return JSON.parse(raw) as IngestStatus
  } catch {
    return null
  }
}

// ─── Slug / meta ─────────────────────────────────────────────────────────────

function buildIssueSlug(input: IngestDraftInput): string {
  if (input.slug) return slugify(input.slug)
  const special = input.isSpecial ? 'dac-biet-' : ''
  const code = input.issueCode ? `-${input.issueCode}` : ''
  return slugify(`so-${special}${input.number}${code}-${input.year}`)
}

function buildIssueDisplayName(input: IngestDraftInput): string {
  if (input.title) return input.title
  const base = input.isSpecial ? `Số đặc biệt ${input.number}` : `Số ${input.number}`
  const code = input.issueCode ? ` (${input.issueCode})` : ''
  const monthYear = input.month ? ` — ${String(input.month).padStart(2, '0')}/${input.year}` : ` — ${input.year}`
  return `${base}${code}${monthYear}`
}

/** Tách chuỗi tác giả tự do thành từng tác giả (best-effort; biên tập viên có thể sửa sau). */
function splitAuthors(authorsText: string): string[] {
  if (!authorsText?.trim()) return []
  const parts = authorsText.includes(';')
    ? authorsText.split(';')
    : authorsText.split(/\s+và\s+|,(?=\s*(?:Đại|Thượng|Trung|Thiếu|GS|PGS|TS|ThS|CN)\b)/)
  return parts.map((p) => p.trim()).filter(Boolean)
}

// ─── Bước 1: tạo bản ghi từ draft ────────────────────────────────────────────

/**
 * Tạo Volume/Issue/IssueSection/JournalArticle (status DRAFT) từ danh sách draft.
 * Giữ DRAFT trong suốt quá trình xử lý → đối chiếu trùng không tự khớp với chính nó;
 * cuối pipeline mới chuyển PUBLISHED.
 */
export async function createIssueFromDraft(input: IngestDraftInput): Promise<{ issueId: string; slug: string }> {
  if (!input.articles?.length) throw new Error('Danh sách bài trống — không thể tạo số.')
  if (!input.pdfUrl) throw new Error('Thiếu PDF số báo.')

  const slug = buildIssueSlug(input)
  const pageOffset = input.pageOffset ?? 0

  // pageCount = trang in lớn nhất = tổng trang PDF - offset (để bài cuối kéo tới hết số).
  const pdfAbs = resolveStoredFileToAbsolute(input.pdfUrl)
  const totalPdfPages = (await PDFDocument.load(await fs.readFile(pdfAbs))).getPageCount()
  const pageCount = Math.max(1, totalPdfPages - pageOffset)

  const volume = await upsertVolume(input.year, Boolean(input.isSpecial))
  const publishDate = input.month ? new Date(input.year, input.month - 1, 1) : undefined

  const issue = await prisma.issue.upsert({
    where: { slug },
    create: {
      volumeId: volume.id,
      number: input.number,
      year: input.year,
      title: buildIssueDisplayName(input),
      slug,
      issueCode: input.isSpecial ? undefined : input.issueCode,
      coverImage: input.coverImage ?? undefined,
      pdfUrl: input.pdfUrl,
      pageCount,
      publishDate,
      status: 'DRAFT',
    },
    update: {
      number: input.number,
      title: buildIssueDisplayName(input),
      issueCode: input.isSpecial ? undefined : input.issueCode,
      coverImage: input.coverImage ?? undefined,
      pdfUrl: input.pdfUrl,
      pageCount,
      publishDate,
      status: 'DRAFT',
    },
  })

  // Chuyên mục: theo thứ tự xuất hiện trong draft.
  const sectionIdByName = new Map<string, string>()
  const orderedSections = Array.from(
    new Set(input.articles.map((a) => a.section?.trim()).filter((s): s is string => Boolean(s))),
  )
  for (let i = 0; i < orderedSections.length; i++) {
    const name = orderedSections[i]
    const section = await prisma.issueSection.upsert({
      where: { issueId_name: { issueId: issue.id, name } },
      create: { issueId: issue.id, name, slug: slugify(name), order: i },
      update: { slug: slugify(name), order: i },
    })
    sectionIdByName.set(name, section.id)
  }

  const userNameMap = await buildUnambiguousUserNameMap()

  for (const draft of input.articles) {
    const title = draft.title.trim()
    if (!title) continue
    const articleSlug = `${slugify(title)}-tr${draft.pageStart}`
    const sectionId = draft.section ? sectionIdByName.get(draft.section.trim()) ?? null : null

    const article = await prisma.journalArticle.upsert({
      where: { issueId_slug: { issueId: issue.id, slug: articleSlug } },
      create: {
        issueId: issue.id,
        sectionId,
        title,
        slug: articleSlug,
        authorsText: draft.authorsText ?? '',
        pageStart: draft.pageStart,
        status: 'DRAFT',
        extractionStatus: 'PENDING',
        splitStatus: 'PENDING',
        contentSource: 'pdf-ingest',
      },
      update: {
        sectionId,
        title,
        authorsText: draft.authorsText ?? '',
        pageStart: draft.pageStart,
        status: 'DRAFT',
      },
    })

    // Đồng bộ tác giả structured (best-effort) để corpus/EPUB hiển thị tên.
    await prisma.journalArticleAuthor.deleteMany({ where: { articleId: article.id } })
    const authorNames = splitAuthors(draft.authorsText ?? '')
    for (let i = 0; i < authorNames.length; i++) {
      const name = authorNames[i]
      await prisma.journalArticleAuthor.create({
        data: {
          articleId: article.id,
          name,
          order: i,
          userId: matchUserId(userNameMap, name),
        },
      })
    }
  }

  await writeStatus({
    slug,
    issueId: issue.id,
    status: 'processing',
    phase: 'CREATED',
    message: 'Đã tạo bản ghi số báo và danh sách bài. Chuẩn bị xử lý...',
    totalArticles: input.articles.length,
    splitDone: 0,
    splitErrors: 0,
    extractedFromPdf: 0,
    ocrApplied: 0,
    lowQuality: 0,
    duplicatesFlagged: [],
    errors: [],
    startedAt: new Date().toISOString(),
  })

  return { issueId: issue.id, slug }
}

// ─── Bước 2-7: chạy pipeline nền ─────────────────────────────────────────────

/**
 * Chạy toàn bộ pipeline số hóa cho một số đã tạo. Thiết kế fire-and-forget:
 * tự ghi trạng thái FAILED khi lỗi, KHÔNG ném ra ngoài để chặn luồng API.
 */
export async function runIssueIngest(issueId: string, options: IngestRunOptions = {}): Promise<void> {
  const issue = await prisma.issue.findUnique({ where: { id: issueId }, select: { slug: true } })
  const slug = issue?.slug
  if (!slug) {
    logger.error({ context: 'ingest.runIssueIngest', issueId, error: 'Issue hoặc slug không tồn tại' })
    return
  }

  const status = (await getIngestStatus(slug)) ?? {
    slug,
    issueId,
    status: 'processing' as const,
    phase: 'CREATED' as IngestPhase,
    message: '',
    totalArticles: 0,
    splitDone: 0,
    splitErrors: 0,
    extractedFromPdf: 0,
    ocrApplied: 0,
    lowQuality: 0,
    duplicatesFlagged: [],
    errors: [],
    startedAt: new Date().toISOString(),
  }

  const fail = async (message: string, error: unknown) => {
    status.status = 'failed'
    status.phase = 'FAILED'
    status.message = message
    status.errors.push(error instanceof Error ? error.message : String(error))
    status.finishedAt = new Date().toISOString()
    await writeStatus(status)
    logger.error({ context: 'ingest.runIssueIngest', issueId, slug, phase: status.phase, error: String(error) })
  }

  try {
    // 2. Tách PDF từng bài + thumbnail
    status.phase = 'SPLITTING'
    status.message = 'Đang tách PDF từng bài báo...'
    await writeStatus(status)
    const splitSummary = await splitIssueArticles(issueId, {
      pageOffset: options.pageOffset ?? 0,
      replace: true,
      onProgress: async ({ index, total, title }) => {
        status.message = `Đang tách bài ${index}/${total}: ${title}`
        await writeStatus(status).catch(() => {})
      },
    })
    status.splitDone = splitSummary.done
    status.splitErrors = splitSummary.errors

    // 3 + 4. Trích/OCR toàn văn + ghi corpus.json (cache contentText vào DB)
    status.phase = 'EXTRACTING'
    status.message = 'Đang trích toàn văn (OCR nếu cần) và dựng bản đọc số...'
    await writeStatus(status)
    const corpusSummary = await buildIssueCorpus(issueId, { ocr: options.ocr ?? true })
    status.extractedFromPdf = corpusSummary.extractedFromPdf
    status.ocrApplied = corpusSummary.ocrApplied
    status.lowQuality = corpusSummary.lowQualityText

    // 5. Sinh EPUB từ corpus
    status.phase = 'EPUB'
    status.message = 'Đang sinh file EPUB...'
    await writeStatus(status)
    const epub = await buildIssueEpub(slug)
    status.epubUrl = epub.epubUrl

    // 6. Đối chiếu trùng với CSDL (bài DRAFT chưa publish → không tự khớp chính nó)
    status.phase = 'DUPLICATE_CHECK'
    status.message = 'Đang đối chiếu trùng lặp với kho bài báo...'
    await writeStatus(status)
    status.duplicatesFlagged = await detectDuplicates(issueId)

    // 7. Xuất bản (số + tất cả bài của số)
    status.phase = 'PUBLISHING'
    status.message = 'Đang xuất bản số báo...'
    await writeStatus(status)
    await prisma.$transaction([
      prisma.issue.update({ where: { id: issueId }, data: { status: 'PUBLISHED' } }),
      prisma.journalArticle.updateMany({ where: { issueId }, data: { status: 'PUBLISHED' } }),
    ])

    status.status = 'done'
    status.phase = 'DONE'
    status.message = 'Hoàn tất số hóa số báo.'
    status.libraryUrl = `/library/${slug}`
    status.finishedAt = new Date().toISOString()
    await writeStatus(status)
  } catch (error) {
    await fail('Số hóa thất bại — xem chi tiết lỗi.', error)
  }
}

/** Đối chiếu toàn văn từng bài của số với kho; trả các bài trùng cao với CSDL bài báo. */
async function detectDuplicates(issueId: string): Promise<DuplicateFlag[]> {
  const articles = await prisma.journalArticle.findMany({
    where: { issueId, contentText: { not: null } },
    select: { id: true, title: true, slug: true, contentText: true },
  })
  if (articles.length === 0) return []

  const results = await checkTextsAgainstCorpus(
    articles.map((a) => ({ key: a.id, text: a.contentText ?? '' })),
  )
  const byKey = new Map(results.map((r) => [r.key, r.result]))

  const flags: DuplicateFlag[] = []
  for (const article of articles) {
    const result = byKey.get(article.id)
    if (!result) continue
    const dupMatches = result.matches
      .filter((m) => DUP_SOURCE_TYPES.includes(m.type) && matchSeverity(m) >= DUP_SEVERITY_THRESHOLD)
      .map((m) => ({ id: m.id, title: m.title, type: m.type, severity: matchSeverity(m) }))
    if (dupMatches.length === 0) continue
    flags.push({
      articleId: article.id,
      title: article.title,
      slug: article.slug,
      severity: Math.max(...dupMatches.map((m) => m.severity)),
      matches: dupMatches.slice(0, 5),
    })
  }
  return flags
}
