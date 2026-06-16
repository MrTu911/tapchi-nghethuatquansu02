import { prisma } from '@/lib/prisma'
import { splitJournalContent } from '@/lib/services/journal-article-reader.service'

export type RepositoryArticleSource = 'PEER_REVIEW' | 'JOURNAL_IMPORT'

export interface RepositoryArticleResult {
  id: string
  title: string
  abstractVn: string
  authors: string // Normalized display string
  categoryName: string
  keywords: string[]
  publishedAt: string | null
  views: number
  downloads: number
  issueInfo: string
  pages: string | null
  doiLocal: string | null
  pdfUrl: string | null
  sourceType: RepositoryArticleSource
}

export interface RepositorySearchFilters {
  keyword?: string
  author?: string
  categoryId?: string // Only applies to PEER_REVIEW source
  year?: string
  limit?: number
  offset?: number
  sourceType?: RepositoryArticleSource
}

export interface RepositorySearchResult {
  articles: RepositoryArticleResult[]
  total: number
  limit: number
  offset: number
}

export interface RepositoryStats {
  totalArticles: number
  totalPeerReview: number
  totalJournalImport: number
  totalDownloads: number
  totalViews: number
  thisMonthArticles: number
  thisMonthDownloads: number
  avgDownloadsPerArticle: number
}

function buildIssueInfo(volume: number | null | undefined, issueNumber: number, year: number): string {
  if (volume) return `Tập ${volume}, Số ${issueNumber}/${year}`
  return `Số ${issueNumber}/${year}`
}

async function searchPeerReviewArticles(
  filters: RepositorySearchFilters,
): Promise<{ articles: RepositoryArticleResult[]; total: number }> {
  const { keyword, author, categoryId, year, limit = 50, offset = 0 } = filters

  const where: any = {
    approvalStatus: 'APPROVED',
    publishedAt: { not: null },
  }

  if (keyword) {
    where.submission = {
      OR: [
        { title: { contains: keyword, mode: 'insensitive' } },
        { abstractVn: { contains: keyword, mode: 'insensitive' } },
        { abstractEn: { contains: keyword, mode: 'insensitive' } },
      ],
    }
  }

  if (author) {
    where.submission = {
      ...where.submission,
      author: { fullName: { contains: author, mode: 'insensitive' } },
    }
  }

  if (categoryId && categoryId !== 'all') {
    where.submission = { ...where.submission, categoryId }
  }

  if (year && year !== 'all') {
    where.issue = { year: parseInt(year) }
  }

  const [rows, total] = await Promise.all([
    prisma.article.findMany({
      where,
      include: {
        submission: {
          include: {
            author: { select: { fullName: true, org: true } },
            category: { select: { name: true } },
          },
        },
        issue: { include: { volume: true } },
      },
      orderBy: { publishedAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.article.count({ where }),
  ])

  const articles: RepositoryArticleResult[] = rows.map((a) => {
    const keywords: string[] = Array.isArray(a.submission.keywords)
      ? (a.submission.keywords as string[])
      : []

    return {
      id: a.id,
      title: a.submission.title,
      abstractVn: a.submission.abstractVn || '',
      authors: a.submission.author.fullName,
      categoryName: a.submission.category?.name || 'Chung',
      keywords,
      publishedAt: a.publishedAt?.toISOString() ?? null,
      views: a.views,
      downloads: a.downloads,
      issueInfo: a.issue
        ? buildIssueInfo(a.issue.volume?.volumeNo, a.issue.number, a.issue.year)
        : '',
      pages: a.pages ?? null,
      doiLocal: a.doiLocal ?? null,
      pdfUrl: a.pdfFile ?? null,
      sourceType: 'PEER_REVIEW',
    }
  })

  return { articles, total }
}

async function searchJournalImportArticles(
  filters: RepositorySearchFilters,
): Promise<{ articles: RepositoryArticleResult[]; total: number }> {
  const { keyword, author, year, limit = 50, offset = 0 } = filters

  const where: any = {
    status: 'PUBLISHED',
  }

  if (keyword) {
    where.OR = [
      { title: { contains: keyword, mode: 'insensitive' } },
      { abstract: { contains: keyword, mode: 'insensitive' } },
      { authorsText: { contains: keyword, mode: 'insensitive' } },
    ]
  }

  if (author) {
    where.authorsText = { contains: author, mode: 'insensitive' }
  }

  if (year && year !== 'all') {
    where.issue = { year: parseInt(year) }
  }

  const [rows, total] = await Promise.all([
    prisma.journalArticle.findMany({
      where,
      include: {
        issue: { include: { volume: true } },
        section: true,
        authors: { orderBy: { order: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.journalArticle.count({ where }),
  ])

  const articles: RepositoryArticleResult[] = rows.map((a) => {
    const authorDisplay =
      a.authors.length > 0
        ? a.authors
            .map((au) => {
              const parts = [au.militaryRank, au.degree, au.name].filter(Boolean)
              return parts.join(' ')
            })
            .join('; ')
        : a.authorsText

    return {
      id: a.id,
      title: a.title,
      abstractVn: a.abstract || '',
      authors: authorDisplay,
      categoryName: a.section?.name || 'Chung',
      keywords: a.keywords ?? [],
      publishedAt: a.issue.publishDate?.toISOString() ?? null,
      views: 0,
      downloads: 0,
      issueInfo: buildIssueInfo(a.issue.volume?.volumeNo, a.issue.number, a.issue.year),
      pages:
        a.pageStart && a.pageEnd ? `${a.pageStart}-${a.pageEnd}` : a.pageStart ? `${a.pageStart}` : null,
      doiLocal: null,
      pdfUrl: a.articlePdfUrl ?? null,
      sourceType: 'JOURNAL_IMPORT',
    }
  })

  return { articles, total }
}

export interface PublicRepositoryHeroStats {
  /** Tổng bài báo công khai = bài qua phản biện (Article APPROVED) + bài kho số (JournalArticle PUBLISHED). */
  totalArticles: number
  totalAuthors: number
  totalCategories: number
  /** Bài có ngày xuất bản trong 30 ngày gần nhất, gộp cả hai nguồn. */
  recentArticles: number
}

/**
 * Số liệu cho thẻ thống kê trang công khai /repository.
 * Gộp cả hai nguồn để khớp với danh sách (searchRepository cũng gộp 2 nguồn),
 * tránh tình trạng thẻ "Bài báo" hiện 0 trong khi danh sách có hàng trăm bài.
 */
export async function getPublicRepositoryHeroStats(): Promise<PublicRepositoryHeroStats> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [
    peerReview,
    journalImport,
    totalAuthors,
    totalCategories,
    recentPeerReview,
    recentJournalImport,
  ] = await Promise.all([
    prisma.article.count({ where: { approvalStatus: 'APPROVED', publishedAt: { not: null } } }),
    prisma.journalArticle.count({ where: { status: 'PUBLISHED' } }),
    prisma.user.count({ where: { role: 'AUTHOR', isActive: true } }),
    prisma.category.count(),
    prisma.article.count({
      where: { approvalStatus: 'APPROVED', publishedAt: { gte: thirtyDaysAgo } },
    }),
    prisma.journalArticle.count({
      where: { status: 'PUBLISHED', issue: { publishDate: { gte: thirtyDaysAgo } } },
    }),
  ])

  return {
    totalArticles: peerReview + journalImport,
    totalAuthors,
    totalCategories,
    recentArticles: recentPeerReview + recentJournalImport,
  }
}

export async function searchRepository(
  filters: RepositorySearchFilters,
): Promise<RepositorySearchResult> {
  const { sourceType, limit = 50, offset = 0 } = filters

  if (sourceType === 'PEER_REVIEW') {
    const result = await searchPeerReviewArticles(filters)
    return { ...result, limit, offset }
  }

  if (sourceType === 'JOURNAL_IMPORT') {
    const result = await searchJournalImportArticles(filters)
    return { ...result, limit, offset }
  }

  // Unified: gộp 2 nguồn rồi sắp lại theo ngày xuất bản. Để phân trang đúng ở mọi
  // offset, mỗi nguồn phải nạp đủ (offset + limit) bản ghi đầu — nếu chỉ nạp `limit`
  // thì các trang sau sẽ thiếu bản ghi xếp hạng cao của một nguồn.
  const perSourceCount = offset + limit
  const [prResult, jiResult] = await Promise.all([
    searchPeerReviewArticles({ ...filters, limit: perSourceCount, offset: 0 }),
    searchJournalImportArticles({ ...filters, limit: perSourceCount, offset: 0 }),
  ])

  const merged = [...prResult.articles, ...jiResult.articles].sort((a, b) => {
    const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0
    const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0
    return dateB - dateA
  })

  const paginated = merged.slice(offset, offset + limit)
  const total = prResult.total + jiResult.total

  return { articles: paginated, total, limit, offset }
}

/**
 * Chi tiết một bài báo để hiển thị trực tiếp (inline) trong dashboard CSDL —
 * không cần điều hướng sang trang đọc. Gộp hai nguồn:
 *  - PEER_REVIEW   → metadata + abstract (toàn văn nằm ở file PDF / trang /articles)
 *  - JOURNAL_IMPORT → metadata + abstract + toàn văn (paragraphs/references) từ contentText
 */
export interface RepositoryArticleDetail {
  id: string
  sourceType: RepositoryArticleSource
  title: string
  authors: string
  authorOrg: string | null
  categoryName: string
  issueInfo: string
  pages: string | null
  publishedAt: string | null
  views: number
  downloads: number
  abstractVn: string
  abstractEn: string | null
  keywords: string[]
  doiLocal: string | null
  /** Các đoạn thân bài (chỉ JOURNAL_IMPORT có toàn văn số hóa). */
  paragraphs: string[]
  references: string[]
  hasFullText: boolean
  /** URL tải/đọc PDF gốc: bài kho số phục vụ trực tiếp; bài phản biện qua endpoint download có audit. */
  pdfUrl: string | null
  downloadUrl: string | null
  /** Trang đọc toàn văn công khai tương ứng (mở tab mới khi cần). */
  fullTextHref: string
  /** Chỉ bài PEER_REVIEW mới sửa được metadata qua CRUD repository. */
  editable: boolean
}

/** Ghép tiền tố học hàm/học vị/quân hàm trước tên tác giả. */
function buildAuthorDisplay(parts: (string | null | undefined)[]): string {
  return parts.map((p) => p?.trim()).filter(Boolean).join(', ')
}

async function getPeerReviewDetail(id: string): Promise<RepositoryArticleDetail | null> {
  const article = await prisma.article.findFirst({
    where: { id, approvalStatus: 'APPROVED', publishedAt: { not: null } },
    include: {
      submission: {
        include: {
          author: {
            select: { fullName: true, org: true, academicTitle: true, academicDegree: true },
          },
          category: { select: { name: true } },
        },
      },
      issue: { include: { volume: true } },
    },
  })

  if (!article) return null

  const sub = article.submission
  const keywords: string[] = Array.isArray(sub.keywords) ? (sub.keywords as string[]) : []
  const authorName = buildAuthorDisplay([
    sub.author.academicTitle,
    sub.author.academicDegree,
    sub.author.fullName,
  ])

  return {
    id: article.id,
    sourceType: 'PEER_REVIEW',
    title: sub.title,
    authors: authorName || sub.author.fullName,
    authorOrg: sub.author.org ?? null,
    categoryName: sub.category?.name ?? 'Chung',
    issueInfo: article.issue
      ? buildIssueInfo(article.issue.volume?.volumeNo, article.issue.number, article.issue.year)
      : '',
    pages: article.pages ?? null,
    publishedAt: article.publishedAt?.toISOString() ?? null,
    views: article.views,
    downloads: article.downloads,
    abstractVn: sub.abstractVn ?? '',
    abstractEn: sub.abstractEn ?? null,
    keywords,
    doiLocal: article.doiLocal ?? null,
    paragraphs: [],
    references: [],
    hasFullText: false,
    pdfUrl: null,
    downloadUrl: article.pdfFile ? `/api/repository/download/${article.id}` : null,
    fullTextHref: `/articles/${article.id}`,
    editable: true,
  }
}

async function getJournalImportDetail(id: string): Promise<RepositoryArticleDetail | null> {
  const article = await prisma.journalArticle.findFirst({
    where: { id, status: 'PUBLISHED' },
    include: {
      issue: { include: { volume: true } },
      section: { select: { name: true } },
      authors: { orderBy: { order: 'asc' } },
    },
  })

  if (!article) return null

  const authorDisplay =
    article.authors.length > 0
      ? article.authors
          .map((au) => buildAuthorDisplay([au.militaryRank, au.degree, au.name]))
          .filter(Boolean)
          .join('; ')
      : article.authorsText

  const authorOrg =
    article.authors.find((au) => au.organization)?.organization ?? null

  const { paragraphs, references } = splitJournalContent(article.contentText)

  return {
    id: article.id,
    sourceType: 'JOURNAL_IMPORT',
    title: article.title,
    authors: authorDisplay,
    authorOrg,
    categoryName: article.section?.name ?? 'Chung',
    issueInfo: buildIssueInfo(article.issue.volume?.volumeNo, article.issue.number, article.issue.year),
    pages:
      article.pageStart && article.pageEnd
        ? `${article.pageStart}-${article.pageEnd}`
        : article.pageStart
          ? `${article.pageStart}`
          : null,
    publishedAt: article.issue.publishDate?.toISOString() ?? null,
    views: 0,
    downloads: 0,
    abstractVn: article.abstract ?? '',
    abstractEn: null,
    keywords: article.keywords ?? [],
    doiLocal: null,
    paragraphs,
    references,
    hasFullText: paragraphs.length > 0,
    pdfUrl: article.articlePdfUrl ?? null,
    downloadUrl: null,
    fullTextHref: `/journal-articles/${article.id}`,
    editable: false,
  }
}

/**
 * Lấy chi tiết bài báo theo nguồn. `sourceType` đến từ kết quả search nên dùng để
 * chọn đúng model (id của hai model là không gian riêng). Trả null nếu không tìm thấy.
 */
export async function getRepositoryArticleDetail(
  id: string,
  sourceType: RepositoryArticleSource,
): Promise<RepositoryArticleDetail | null> {
  return sourceType === 'JOURNAL_IMPORT'
    ? getJournalImportDetail(id)
    : getPeerReviewDetail(id)
}

export async function getRepositoryStats(yearFilter?: string): Promise<{
  overview: RepositoryStats
  byYear: { year: number; peerReview: number; journalImport: number; total: number }[]
  byCategory: { name: string; count: number }[]
  topArticles: { id: string; title: string; downloads: number; views: number; sourceType: RepositoryArticleSource }[]
  monthlyTrend: { month: string; peerReview: number; journalImport: number }[]
}> {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const prBaseWhere: any = { approvalStatus: 'APPROVED' }
  const jiBaseWhere: any = { status: 'PUBLISHED' }

  if (yearFilter && yearFilter !== 'all') {
    const year = parseInt(yearFilter)
    prBaseWhere.publishedAt = { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) }
    jiBaseWhere.issue = { year }
  }

  const [
    totalPeerReview,
    totalJournalImport,
    prStats,
    thisMonthPR,
    thisMonthPRDownloads,
  ] = await Promise.all([
    prisma.article.count({ where: prBaseWhere }),
    prisma.journalArticle.count({ where: jiBaseWhere }),
    prisma.article.aggregate({ where: prBaseWhere, _sum: { downloads: true, views: true } }),
    prisma.article.count({ where: { ...prBaseWhere, publishedAt: { gte: startOfMonth } } }),
    prisma.article.aggregate({
      where: { ...prBaseWhere, publishedAt: { gte: startOfMonth } },
      _sum: { downloads: true },
    }),
  ])

  const totalArticles = totalPeerReview + totalJournalImport
  const totalDownloads = prStats._sum.downloads || 0
  const totalViews = prStats._sum.views || 0

  // By Year (5 năm gần nhất)
  const currentYear = now.getFullYear()
  const byYearData: { year: number; peerReview: number; journalImport: number; total: number }[] = []

  for (let year = currentYear - 4; year <= currentYear; year++) {
    const [prCount, jiCount] = await Promise.all([
      prisma.article.count({
        where: {
          approvalStatus: 'APPROVED',
          publishedAt: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) },
        },
      }),
      prisma.journalArticle.count({
        where: { status: 'PUBLISHED', issue: { year } },
      }),
    ])
    byYearData.push({ year, peerReview: prCount, journalImport: jiCount, total: prCount + jiCount })
  }

  // By Category (peer-review articles only, journal articles use section)
  const categories = await prisma.category.findMany({
    include: {
      submissions: {
        where: { article: { approvalStatus: 'APPROVED' } },
        select: { id: true },
      },
    },
  })
  const byCategory = categories
    .map((c) => ({ name: c.name, count: c.submissions.length }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  // Top articles by download (peer-review only, journal import has no download tracking yet)
  const topPR = await prisma.article.findMany({
    where: { approvalStatus: 'APPROVED' },
    orderBy: { downloads: 'desc' },
    take: 10,
    include: { submission: { select: { title: true } } },
  })
  const topArticles = topPR.map((a) => ({
    id: a.id,
    title: a.submission?.title || 'Không có tiêu đề',
    downloads: a.downloads,
    views: a.views,
    sourceType: 'PEER_REVIEW' as RepositoryArticleSource,
  }))

  // Monthly Trend (12 tháng gần nhất)
  const monthlyTrend: { month: string; peerReview: number; journalImport: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
    const monthLabel = monthStart.toLocaleDateString('vi-VN', { month: 'short', year: '2-digit' })

    const [prCount, jiCount] = await Promise.all([
      prisma.article.count({
        where: { approvalStatus: 'APPROVED', publishedAt: { gte: monthStart, lt: monthEnd } },
      }),
      prisma.journalArticle.count({
        where: { status: 'PUBLISHED', issue: { publishDate: { gte: monthStart, lt: monthEnd } } },
      }),
    ])
    monthlyTrend.push({ month: monthLabel, peerReview: prCount, journalImport: jiCount })
  }

  return {
    overview: {
      totalArticles,
      totalPeerReview,
      totalJournalImport,
      totalDownloads,
      totalViews,
      thisMonthArticles: thisMonthPR,
      thisMonthDownloads: thisMonthPRDownloads._sum.downloads || 0,
      avgDownloadsPerArticle: totalPeerReview > 0 ? totalDownloads / totalPeerReview : 0,
    },
    byYear: byYearData,
    byCategory,
    topArticles,
    monthlyTrend,
  }
}
