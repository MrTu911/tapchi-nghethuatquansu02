/**
 * Journal Corpus Import Service
 *
 * Nhập "bản đọc số" của Thư viện số (public/data/issues/<slug>/corpus.json) — đã trích
 * sẵn toàn văn từ epub/PDF — vào CSDL dưới dạng:
 *   Volume → Issue → IssueSection → JournalArticle (+ contentText) → JournalArticleAuthor
 *
 * Mục tiêu: đưa kho tạp chí cũ vào DB để khai thác dữ liệu, đặc biệt phục vụ
 * kiểm tra ĐẠO VĂN / TRÙNG LẶP. Toàn văn được lưu ở `JournalArticle.contentText`
 * để module plagiarism so khớp được với các số đã in.
 *
 * Idempotent: upsert Volume theo volumeNo, Issue theo slug, JournalArticle theo
 * [issueId, slug]. Chạy lại nhiều lần an toàn (cập nhật, không nhân bản).
 *
 * Lưu ý dữ liệu: KHÔNG chuẩn hóa/sửa nội dung học thuật (affiliation, trích dẫn,
 * tên cơ quan...) — giữ nguyên dữ liệu gốc trong corpus.
 */

import { promises as fs } from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { buildUnambiguousUserNameMap, matchUserId } from './journal-author-linker'
import { slugify } from './journal-issue-import.service'
import type { Corpus, CorpusArticle, CorpusAuthor } from '@/types/corpus'

const ISSUES_DATA_DIR = path.join(process.cwd(), 'public', 'data', 'issues')
const JOURNAL_ISSN = '1859-0454'
/** Số đặc biệt nằm ở Volume RIÊNG (volumeNo = base + năm) → number giữ thứ tự thật (1, 4...)
 *  mà vẫn không đụng unique [volumeId, number] với số thường. */
export const SPECIAL_VOLUME_BASE = 900000

// ─── Public API ────────────────────────────────────────────────────────────────

export interface CorpusImportSummary {
  slug: string
  issueId: string
  issueName: string
  totalArticles: number
  articlesUpserted: number
  authorsCreated: number
  authorsLinkedToUser: number
  withFullText: number
  withoutFullText: number
}

/**
 * Nhập một số từ thư mục corpus theo slug (vd: "so-2-2026").
 */
export async function importIssueCorpusBySlug(slug: string): Promise<CorpusImportSummary> {
  const corpusPath = path.join(ISSUES_DATA_DIR, slug, 'corpus.json')
  const raw = await fs.readFile(corpusPath, 'utf-8')
  const corpus = JSON.parse(raw) as Corpus
  return importIssueCorpus(slug, corpus)
}

/**
 * Liệt kê các slug có corpus.json trong public/data/issues.
 */
export async function listCorpusSlugs(): Promise<string[]> {
  const entries = await fs.readdir(ISSUES_DATA_DIR, { withFileTypes: true })
  const slugs: string[] = []
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const corpusPath = path.join(ISSUES_DATA_DIR, entry.name, 'corpus.json')
    try {
      await fs.access(corpusPath)
      slugs.push(entry.name)
    } catch {
      // Bỏ qua thư mục không có corpus.json
    }
  }
  return slugs.sort()
}

/**
 * Nhập một corpus đã parse vào DB. Tách riêng để test được không cần đọc file.
 */
export async function importIssueCorpus(slug: string, corpus: Corpus): Promise<CorpusImportSummary> {
  const meta = parseIssueMeta(slug, corpus)
  const userNameMap = await buildUnambiguousUserNameMap()

  const volume = await upsertVolume(meta.year, meta.isSpecial)
  const issue = await upsertIssue(volume.id, slug, meta)

  // Upsert chuyên mục, ghi nhớ sectionId theo tên để gán cho bài.
  const sectionIdByName = await upsertSections(issue.id, corpus)

  let articlesUpserted = 0
  let authorsCreated = 0
  let authorsLinkedToUser = 0
  let withFullText = 0
  let withoutFullText = 0

  for (const corpusArticle of corpus.articles) {
    const result = await upsertArticle(slug, issue.id, sectionIdByName, corpusArticle, userNameMap)
    articlesUpserted++
    authorsCreated += result.authorsCreated
    authorsLinkedToUser += result.authorsLinked
    if (result.hasFullText) withFullText++
    else withoutFullText++
  }

  return {
    slug,
    issueId: issue.id,
    issueName: meta.displayName,
    totalArticles: corpus.articles.length,
    articlesUpserted,
    authorsCreated,
    authorsLinkedToUser,
    withFullText,
    withoutFullText,
  }
}

// ─── Issue metadata parsing ──────────────────────────────────────────────────

interface IssueMeta {
  number: number
  year: number
  issueCode?: number
  displayName: string
  isSpecial: boolean
  pageCount?: number
  publishDate?: Date
}

/**
 * Suy ra metadata số báo từ tên hiển thị + slug thư mục.
 * Ví dụ tên: "Số 2 (242) — 02/2026", "Số đặc biệt 1 — 01/2026".
 */
function parseIssueMeta(slug: string, corpus: Corpus): IssueMeta {
  const name = corpus.issue?.name ?? slug
  const isSpecial = /đặc\s*biệt/i.test(name)

  const monthYear = name.match(/(\d{1,2})\s*\/\s*(\d{4})/)
  const yearFromSlug = slug.match(/(\d{4})(?:\D*)$/)
  const year = monthYear
    ? parseInt(monthYear[2], 10)
    : yearFromSlug
      ? parseInt(yearFromSlug[1], 10)
      : new Date().getFullYear()
  const month = monthYear ? parseInt(monthYear[1], 10) : undefined

  const issueCodeMatch = name.match(/\((\d+)\)/)
  const issueCode = issueCodeMatch ? parseInt(issueCodeMatch[1], 10) : undefined

  // Số thứ tự "ordinal" trong tên: "Số 2 ..." hoặc "Số đặc biệt 1 ..."
  const ordinalMatch = name.match(/Số(?:\s*đặc\s*biệt)?\s*0*(\d+)/i)
  const ordinal = ordinalMatch ? parseInt(ordinalMatch[1], 10) : (month ?? 1)

  // number = thứ tự thật cho cả số thường lẫn đặc biệt. Số đặc biệt ở volume riêng nên
  // không đụng unique [volumeId, number] với số thường cùng thứ tự.
  const number = ordinal

  const publishDate = month ? new Date(year, month - 1, 1) : undefined

  return {
    number,
    year,
    issueCode: isSpecial ? undefined : issueCode,
    displayName: name,
    isSpecial,
    pageCount: corpus.issue?.total_pages,
    publishDate,
  }
}

// ─── Upsert helpers ──────────────────────────────────────────────────────────

export async function upsertVolume(year: number, isSpecial: boolean) {
  // Số thường: 1 Volume/năm (volumeNo = năm). Số đặc biệt: Volume riêng (volumeNo = base + năm)
  // để number giữ thứ tự thật mà không đụng unique [volumeId, number].
  const volumeNo = isSpecial ? SPECIAL_VOLUME_BASE + year : year
  const title = isSpecial
    ? `Số đặc biệt — Năm ${year}`
    : `Tạp chí Nghệ thuật Quân sự Việt Nam — Năm ${year}`
  return prisma.volume.upsert({
    where: { volumeNo },
    create: { volumeNo, year, title, issn: JOURNAL_ISSN },
    update: { title, issn: JOURNAL_ISSN },
  })
}

async function upsertIssue(volumeId: string, slug: string, meta: IssueMeta) {
  return prisma.issue.upsert({
    where: { slug },
    create: {
      volumeId,
      number: meta.number,
      year: meta.year,
      title: meta.displayName,
      slug,
      issueCode: meta.issueCode,
      pageCount: meta.pageCount,
      publishDate: meta.publishDate,
      status: 'PUBLISHED',
    },
    update: {
      number: meta.number,
      title: meta.displayName,
      issueCode: meta.issueCode,
      pageCount: meta.pageCount,
      publishDate: meta.publishDate,
      status: 'PUBLISHED',
    },
  })
}

/** Upsert chuyên mục theo thứ tự trong corpus; trả map tên chuyên mục -> sectionId. */
async function upsertSections(issueId: string, corpus: Corpus): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  const sections = corpus.sections ?? []
  for (let i = 0; i < sections.length; i++) {
    const name = sections[i].name?.trim()
    if (!name) continue
    const section = await prisma.issueSection.upsert({
      where: { issueId_name: { issueId, name } },
      create: { issueId, name, slug: slugify(name), order: i },
      update: { slug: slugify(name), order: i },
    })
    map.set(name, section.id)
  }
  return map
}

interface ArticleUpsertResult {
  authorsCreated: number
  authorsLinked: number
  hasFullText: boolean
}

async function upsertArticle(
  issueSlug: string,
  issueId: string,
  sectionIdByName: Map<string, string>,
  corpusArticle: CorpusArticle,
  userNameMap: Map<string, string>,
): Promise<ArticleUpsertResult> {
  const title = buildArticleTitle(corpusArticle)
  const slug = `${slugify(title)}-tr${corpusArticle.page_start}`
  const sectionId = corpusArticle.section ? sectionIdByName.get(corpusArticle.section.trim()) ?? null : null
  const authorsText = corpusArticle.authors.map(buildAuthorDisplay).filter(Boolean).join('; ')
  const contentText = buildContentText(corpusArticle)
  const articlePdfUrl = buildArticlePdfUrl(issueSlug, corpusArticle)
  const keywords = dedupeKeywords(corpusArticle)

  const article = await prisma.journalArticle.upsert({
    where: { issueId_slug: { issueId, slug } },
    create: {
      issueId,
      sectionId,
      title,
      slug,
      authorsText,
      pageStart: corpusArticle.page_start,
      pageEnd: corpusArticle.page_end ?? corpusArticle.page_start,
      abstract: corpusArticle.abstract?.vi || null,
      keywords,
      contentText,
      contentSource: 'corpus-import',
      extractionStatus: contentText ? 'DONE' : 'LOW_QUALITY',
      articlePdfUrl,
      status: 'PUBLISHED',
    },
    update: {
      sectionId,
      title,
      authorsText,
      pageStart: corpusArticle.page_start,
      pageEnd: corpusArticle.page_end ?? corpusArticle.page_start,
      abstract: corpusArticle.abstract?.vi || null,
      keywords,
      contentText,
      contentSource: 'corpus-import',
      extractionStatus: contentText ? 'DONE' : 'LOW_QUALITY',
      articlePdfUrl,
    },
  })

  // Đồng bộ tác giả: xoá cũ rồi tạo lại theo thứ tự corpus.
  await prisma.journalArticleAuthor.deleteMany({ where: { articleId: article.id } })

  let authorsLinked = 0
  for (let i = 0; i < corpusArticle.authors.length; i++) {
    const mapped = mapCorpusAuthor(corpusArticle.authors[i], corpusArticle.affiliation)
    const userId = matchUserId(userNameMap, mapped.name)
    if (userId) authorsLinked++
    await prisma.journalArticleAuthor.create({
      data: {
        articleId: article.id,
        name: mapped.name,
        militaryRank: mapped.militaryRank,
        academicTitle: mapped.academicTitle,
        degree: mapped.degree,
        organization: mapped.organization,
        order: i,
        userId,
      },
    })
  }

  return {
    authorsCreated: corpusArticle.authors.length,
    authorsLinked,
    hasFullText: Boolean(contentText),
  }
}

// ─── Field mapping ───────────────────────────────────────────────────────────

function buildArticleTitle(article: CorpusArticle): string {
  const main = article.title?.main?.trim() ?? ''
  const subtitle = article.title?.subtitle?.trim()
  return subtitle ? `${main} — ${subtitle}` : main
}

/**
 * Toàn văn dùng cho khai thác/đạo văn: ghép các đoạn body, đính kèm tài liệu tham khảo.
 * Trả null nếu không có nội dung (PDF font cũ trích ra rỗng).
 */
function buildContentText(article: CorpusArticle): string | null {
  const body = (article.body?.paragraphs ?? [])
    .map((p) => p.text?.trim())
    .filter(Boolean)
    .join('\n\n')
  const references = article.references?.length
    ? `\n\nTÀI LIỆU THAM KHẢO\n${article.references.join('\n')}`
    : ''
  const text = `${body}${references}`.trim()
  return text.length > 0 ? text : null
}

/**
 * Đường dẫn công khai tới PDF bản gốc của từng bài (đã tách sẵn trong thư mục Thư
 * viện số). File nằm ở `public/data/issues/<slug>/<pdf_path>` → URL `/data/issues/...`.
 * KHÔNG đi qua getFileUrl (đó là path tương đối trong /uploads, khác bản chất).
 */
function buildArticlePdfUrl(issueSlug: string, article: CorpusArticle): string | null {
  const pdfPath = article.pdf_path?.trim()
  if (!pdfPath) return null
  return `/data/issues/${issueSlug}/${pdfPath}`
}

function dedupeKeywords(article: CorpusArticle): string[] {
  const all = [...(article.keywords?.vi ?? []), ...(article.keywords?.en ?? [])]
    .map((k) => k.trim())
    .filter(Boolean)
  return Array.from(new Set(all))
}

interface MappedAuthor {
  name: string
  militaryRank: string | null
  academicTitle: string | null
  degree: string | null
  organization: string | null
}

/**
 * Corpus tác giả đã có cấu trúc { rank, degree, name, affiliation }.
 * Tách `degree` (vd "PGS, TS" / "GS.TS" / "TS") thành academicTitle (GS/PGS) + degree còn lại.
 */
function mapCorpusAuthor(author: CorpusAuthor, fallbackAffiliation: string): MappedAuthor {
  const { academicTitle, degree } = splitAcademicTitleAndDegree(author.degree ?? '')
  return {
    name: author.name?.trim() ?? '',
    militaryRank: author.rank?.trim() || null,
    academicTitle,
    degree,
    organization: (author.affiliation?.trim() || fallbackAffiliation?.trim() || '') || null,
  }
}

function splitAcademicTitleAndDegree(raw: string): { academicTitle: string | null; degree: string | null } {
  const tokens = raw.split(/[,\.\s]+/).map((t) => t.trim()).filter(Boolean)
  if (tokens.length === 0) return { academicTitle: null, degree: null }

  const titles: string[] = []
  const degrees: string[] = []
  for (const token of tokens) {
    if (token === 'GS' || token === 'PGS') titles.push(token)
    else degrees.push(token)
  }
  return {
    academicTitle: titles.length ? titles.join(', ') : null,
    degree: degrees.length ? degrees.join(', ') : null,
  }
}

function buildAuthorDisplay(author: CorpusAuthor): string {
  return [author.rank, author.degree, author.name]
    .map((s) => s?.trim())
    .filter(Boolean)
    .join(' ')
}
