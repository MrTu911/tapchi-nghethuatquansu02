/**
 * Journal Article Reader Service
 *
 * Đọc toàn văn một bài báo trong kho số đã xuất bản (model `JournalArticle`) để
 * hiển thị công khai. Toàn văn được nhập sẵn vào `contentText` qua
 * `journal-corpus-import.service.ts`; service này tách thân bài và tài liệu tham
 * khảo thành cấu trúc dễ render, không sửa nội dung học thuật gốc.
 *
 * Chỉ trả về bài thuộc số đã PUBLISHED (không rò bài của số nháp).
 */

import { prisma } from '@/lib/prisma'

/** Mốc phân tách "TÀI LIỆU THAM KHẢO" do bước import nối vào cuối contentText. */
const REFERENCES_MARKER = 'TÀI LIỆU THAM KHẢO'

/** Tên tạp chí dùng trong trích dẫn công khai (identity NTQS). */
const JOURNAL_NAME_VI = 'Tạp chí Nghệ thuật Quân sự Việt Nam'

/** Tốc độ đọc trung bình (từ/phút) để ước lượng thời gian đọc tiếng Việt. */
const WORDS_PER_MINUTE = 200

export interface PublicJournalArticleAuthor {
  name: string
  militaryRank: string | null
  academicTitle: string | null
  degree: string | null
  organization: string | null
}

export interface PublicJournalArticleIssue {
  id: string
  slug: string | null
  title: string | null
  number: number
  year: number
  coverImage: string | null
  pdfUrl: string | null
}

export interface PublicJournalArticle {
  id: string
  title: string
  sectionName: string | null
  authors: PublicJournalArticleAuthor[]
  authorsText: string
  pageStart: number
  pageEnd: number | null
  abstract: string | null
  keywords: string[]
  /** URL công khai tới PDF bản gốc của bài (vd /data/issues/<slug>/...), null nếu chưa số hóa. */
  articlePdfUrl: string | null
  /** Các đoạn thân bài (đã loại phần tài liệu tham khảo). */
  paragraphs: string[]
  /** Danh mục tài liệu tham khảo (mỗi dòng kèm số thứ tự gốc). */
  references: string[]
  hasFullText: boolean
  /** Nhãn số báo đã định dạng sẵn, vd "Số 94 (2026)". */
  issueLabel: string
  /** Khoảng trang đã định dạng, vd "12–18" hoặc "12". */
  pageRange: string
  /** Số từ thân bài (phục vụ ước lượng thời gian đọc). */
  wordCount: number
  /** Thời gian đọc ước lượng, tối thiểu 1 phút. */
  readingMinutes: number
  /** Chuỗi trích dẫn chuẩn đã dựng sẵn để hiển thị/sao chép. */
  citation: string
  issue: PublicJournalArticleIssue
}

/** Mục điều hướng nhẹ tới một bài khác trong cùng số. */
export interface JournalArticleNavItem {
  id: string
  title: string
  authorsText: string
  sectionName: string | null
  pageStart: number
}

/** Điều hướng đọc trong một số báo: bài trước/sau + các bài còn lại. */
export interface IssueReadingNavigation {
  prev: JournalArticleNavItem | null
  next: JournalArticleNavItem | null
  /** Các bài khác trong số (đã loại bài đang đọc), theo thứ tự trang. */
  siblings: JournalArticleNavItem[]
}

/**
 * Lấy một bài báo công khai theo id. Trả null nếu không tồn tại, bài chưa
 * PUBLISHED, hoặc số chứa bài chưa PUBLISHED.
 */
export async function getPublicJournalArticle(id: string): Promise<PublicJournalArticle | null> {
  const article = await prisma.journalArticle.findFirst({
    where: {
      id,
      status: 'PUBLISHED',
      issue: { status: 'PUBLISHED' },
    },
    include: {
      section: { select: { name: true } },
      authors: { orderBy: { order: 'asc' } },
      issue: {
        select: {
          id: true,
          slug: true,
          title: true,
          number: true,
          year: true,
          coverImage: true,
          pdfUrl: true,
        },
      },
    },
  })

  if (!article) return null

  const { paragraphs, references } = splitJournalContent(article.contentText)
  const issueLabel = buildIssueLabel(article.issue)
  const pageRange = formatPageRange(article.pageStart, article.pageEnd)
  const wordCount = countWords(paragraphs)
  const readingMinutes = Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE))
  const citation = buildJournalCitation({
    authorsText: article.authorsText,
    title: article.title,
    issueLabel,
    pageRange,
  })

  return {
    id: article.id,
    title: article.title,
    sectionName: article.section?.name ?? null,
    authors: article.authors.map((a) => ({
      name: a.name,
      militaryRank: a.militaryRank,
      academicTitle: a.academicTitle,
      degree: a.degree,
      organization: a.organization,
    })),
    authorsText: article.authorsText,
    pageStart: article.pageStart,
    pageEnd: article.pageEnd,
    abstract: article.abstract,
    keywords: article.keywords,
    articlePdfUrl: article.articlePdfUrl,
    paragraphs,
    references,
    hasFullText: paragraphs.length > 0,
    issueLabel,
    pageRange,
    wordCount,
    readingMinutes,
    citation,
    issue: {
      id: article.issue.id,
      slug: article.issue.slug,
      title: article.issue.title,
      number: article.issue.number,
      year: article.issue.year,
      coverImage: article.issue.coverImage,
      pdfUrl: article.issue.pdfUrl,
    },
  }
}

/**
 * Tách `contentText` thành thân bài + tài liệu tham khảo.
 * Định dạng nguồn (xem buildContentText khi import): các đoạn nối bằng "\n\n",
 * sau đó "\n\nTÀI LIỆU THAM KHẢO\n" rồi mỗi tài liệu một dòng.
 *
 * Export để các service khác (vd repository.service xem nhanh trong dashboard)
 * dùng chung một cách tách nội dung — tránh nhân đôi logic parse.
 */
export function splitJournalContent(contentText: string | null): { paragraphs: string[]; references: string[] } {
  if (!contentText) return { paragraphs: [], references: [] }

  const markerIndex = contentText.indexOf(REFERENCES_MARKER)
  const bodyRaw = markerIndex >= 0 ? contentText.slice(0, markerIndex) : contentText
  const referencesRaw = markerIndex >= 0 ? contentText.slice(markerIndex + REFERENCES_MARKER.length) : ''

  const paragraphs = bodyRaw
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)

  const references = referencesRaw
    .split(/\n+/)
    .map((r) => r.trim())
    .filter(Boolean)

  return { paragraphs, references }
}

/** Nhãn số báo: ưu tiên tiêu đề số, fallback "Số <number> (<year>)". */
function buildIssueLabel(issue: { title: string | null; number: number; year: number }): string {
  return issue.title ?? `Số ${issue.number} (${issue.year})`
}

/** Khoảng trang: "start–end" nếu có trang cuối khác trang đầu, ngược lại "start". */
function formatPageRange(pageStart: number, pageEnd: number | null): string {
  return pageEnd && pageEnd !== pageStart ? `${pageStart}–${pageEnd}` : `${pageStart}`
}

/** Đếm số từ thân bài để ước lượng thời gian đọc. */
function countWords(paragraphs: string[]): number {
  if (paragraphs.length === 0) return 0
  return paragraphs.join(' ').split(/\s+/).filter(Boolean).length
}

/**
 * Dựng chuỗi trích dẫn chuẩn cho bài báo trong kho số NTQS:
 *   <Tác giả>. "<Tiêu đề>". Tạp chí Nghệ thuật Quân sự Việt Nam, <Số (năm)>, tr. <trang>.
 */
function buildJournalCitation(opts: {
  authorsText: string
  title: string
  issueLabel: string
  pageRange: string
}): string {
  const parts: string[] = []
  const author = opts.authorsText?.trim()
  if (author) parts.push(`${author.replace(/\.$/, '')}.`)
  parts.push(`"${opts.title}".`)
  parts.push(`${JOURNAL_NAME_VI}, ${opts.issueLabel}, tr. ${opts.pageRange}.`)
  return parts.join(' ')
}

/**
 * Điều hướng đọc trong cùng một số đã xuất bản: trả bài trước/sau theo thứ tự
 * trang và danh sách các bài còn lại. Chỉ tính bài PUBLISHED của số PUBLISHED để
 * không rò bài thuộc số nháp. Trả về rỗng nếu bài hiện tại không nằm trong số.
 */
export async function getIssueReadingNavigation(
  issueId: string,
  currentArticleId: string,
): Promise<IssueReadingNavigation> {
  const articles = await prisma.journalArticle.findMany({
    where: { issueId, status: 'PUBLISHED', issue: { status: 'PUBLISHED' } },
    orderBy: [{ pageStart: 'asc' }, { title: 'asc' }],
    select: {
      id: true,
      title: true,
      authorsText: true,
      pageStart: true,
      section: { select: { name: true } },
    },
  })

  const items: JournalArticleNavItem[] = articles.map((a) => ({
    id: a.id,
    title: a.title,
    authorsText: a.authorsText,
    sectionName: a.section?.name ?? null,
    pageStart: a.pageStart,
  }))

  const currentIndex = items.findIndex((a) => a.id === currentArticleId)
  if (currentIndex === -1) {
    return { prev: null, next: null, siblings: items }
  }

  return {
    prev: currentIndex > 0 ? items[currentIndex - 1] : null,
    next: currentIndex < items.length - 1 ? items[currentIndex + 1] : null,
    siblings: items.filter((_, i) => i !== currentIndex),
  }
}
