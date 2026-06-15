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
  issue: PublicJournalArticleIssue
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

  const { paragraphs, references } = splitContent(article.contentText)

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
 */
function splitContent(contentText: string | null): { paragraphs: string[]; references: string[] } {
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
