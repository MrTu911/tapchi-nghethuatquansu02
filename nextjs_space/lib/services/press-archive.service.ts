import { JournalClassification } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { logAudit, AuditEventType } from '@/lib/audit-logger'
import { buildUnambiguousUserNameMap, matchUserId } from './journal-author-linker'

export interface AuthorInput {
  name: string
  militaryRank?: string
  academicTitle?: string
  degree?: string
  organization?: string
  order: number
}

export interface CreateHistoricalArticleInput {
  issueId: string
  sectionId?: string
  title: string
  authorsText: string // Raw author string for legacy compat
  authors: AuthorInput[]
  abstract?: string
  keywords?: string[]
  pageStart: number
  pageEnd?: number
  articlePdfUrl?: string
  status?: 'DRAFT' | 'PUBLISHED'
  journalType?: JournalClassification
  journalNameOverride?: string | null
}

export interface UpdateHistoricalArticleInput {
  sectionId?: string | null
  title?: string
  authorsText?: string
  authors?: AuthorInput[]
  abstract?: string | null
  keywords?: string[]
  pageStart?: number
  pageEnd?: number | null
  articlePdfUrl?: string | null
  status?: 'DRAFT' | 'PUBLISHED' | 'WITHDRAWN'
  journalType?: JournalClassification
  journalNameOverride?: string | null
}

export interface HistoricalArticleFilters {
  keyword?: string
  year?: string
  issueId?: string
  sectionId?: string
  status?: string
  page?: number
  pageSize?: number
}

export interface HistoricalArticleListItem {
  id: string
  title: string
  authorsText: string
  authors: {
    name: string
    militaryRank?: string | null
    academicTitle?: string | null
    degree?: string | null
    organization?: string | null
    order: number
  }[]
  sectionName: string | null
  issueInfo: string
  issueYear: number
  pageStart: number
  pageEnd: number | null
  status: string
  splitStatus: string
  thumbnailStatus: string
  hasPdf: boolean
  hasThumbnail: boolean
  createdAt: string
  updatedAt: string
}

function buildIssueLabel(volumeNo: number | null | undefined, issueNumber: number, year: number): string {
  if (volumeNo) return `Tập ${volumeNo}, Số ${issueNumber}/${year}`
  return `Số ${issueNumber}/${year}`
}

function buildSlug(title: string, issueId: string): string {
  const base = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 80)
  return `${base}-${Date.now()}`
}

export async function listHistoricalArticles(
  filters: HistoricalArticleFilters,
): Promise<{ articles: HistoricalArticleListItem[]; total: number; page: number; pageSize: number }> {
  const { keyword, year, issueId, sectionId, status, page = 1, pageSize = 20 } = filters
  const skip = (page - 1) * pageSize

  const where: any = {}

  if (status && status !== 'all') {
    where.status = status
  }

  if (issueId) {
    where.issueId = issueId
  }

  if (sectionId) {
    where.sectionId = sectionId
  }

  if (year && year !== 'all') {
    where.issue = { year: parseInt(year) }
  }

  if (keyword) {
    where.OR = [
      { title: { contains: keyword, mode: 'insensitive' } },
      { authorsText: { contains: keyword, mode: 'insensitive' } },
      { abstract: { contains: keyword, mode: 'insensitive' } },
    ]
  }

  const [rows, total] = await Promise.all([
    prisma.journalArticle.findMany({
      where,
      include: {
        issue: { include: { volume: true } },
        section: true,
        authors: { orderBy: { order: 'asc' } },
      },
      orderBy: [{ issue: { year: 'desc' } }, { pageStart: 'asc' }],
      take: pageSize,
      skip,
    }),
    prisma.journalArticle.count({ where }),
  ])

  const articles: HistoricalArticleListItem[] = rows.map((a) => ({
    id: a.id,
    title: a.title,
    authorsText: a.authorsText,
    authors: a.authors.map((au) => ({
      name: au.name,
      militaryRank: au.militaryRank,
      academicTitle: au.academicTitle,
      degree: au.degree,
      organization: au.organization,
      order: au.order,
    })),
    sectionName: a.section?.name ?? null,
    issueInfo: buildIssueLabel(a.issue.volume?.volumeNo, a.issue.number, a.issue.year),
    issueYear: a.issue.year,
    pageStart: a.pageStart,
    pageEnd: a.pageEnd,
    status: a.status,
    splitStatus: a.splitStatus,
    thumbnailStatus: a.thumbnailStatus,
    hasPdf: !!a.articlePdfUrl,
    hasThumbnail: !!a.thumbnailUrl,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }))

  return { articles, total, page, pageSize }
}

export async function getHistoricalArticle(id: string) {
  const article = await prisma.journalArticle.findUnique({
    where: { id },
    include: {
      issue: { include: { volume: true } },
      section: true,
      authors: { orderBy: { order: 'asc' } },
    },
  })
  return article
}

export async function createHistoricalArticle(
  data: CreateHistoricalArticleInput,
  actorId: string,
) {
  const slug = buildSlug(data.title, data.issueId)

  // Khi PDF được upload thủ công (không qua split script),
  // đánh dấu 'MANUAL' để phân biệt với 'PENDING' (chờ script) và 'DONE' (script đã chạy)
  const splitStatus = data.articlePdfUrl ? 'MANUAL' : 'PENDING'
  const thumbnailStatus = 'PENDING' // thumbnail chỉ được tạo bởi split script

  const userMap = await buildUnambiguousUserNameMap()

  const article = await prisma.journalArticle.create({
    data: {
      issueId: data.issueId,
      sectionId: data.sectionId || null,
      title: data.title,
      slug,
      authorsText: data.authorsText,
      abstract: data.abstract || null,
      keywords: data.keywords ?? [],
      pageStart: data.pageStart,
      pageEnd: data.pageEnd || null,
      articlePdfUrl: data.articlePdfUrl || null,
      status: data.status ?? 'PUBLISHED',
      journalType: data.journalType, // undefined => dùng default DOMESTIC_PEER_REVIEWED
      journalNameOverride: data.journalNameOverride ?? null,
      splitStatus,
      thumbnailStatus,
      authors: {
        create: data.authors.map((au) => ({
          name: au.name,
          militaryRank: au.militaryRank || null,
          academicTitle: au.academicTitle || null,
          degree: au.degree || null,
          organization: au.organization || null,
          order: au.order,
          userId: matchUserId(userMap, au.name),
        })),
      },
    },
    include: { authors: true },
  })

  await logAudit({
    actorId,
    action: AuditEventType.ARTICLE_PUBLISHED,
    object: `PressArchive:${article.id}`,
  })

  return article
}

export async function updateHistoricalArticle(
  id: string,
  data: UpdateHistoricalArticleInput,
  actorId: string,
) {
  const updateData: any = {}

  if (data.title !== undefined) updateData.title = data.title
  if (data.authorsText !== undefined) updateData.authorsText = data.authorsText
  if (data.abstract !== undefined) updateData.abstract = data.abstract
  if (data.keywords !== undefined) updateData.keywords = data.keywords
  if (data.pageStart !== undefined) updateData.pageStart = data.pageStart
  if (data.pageEnd !== undefined) updateData.pageEnd = data.pageEnd
  if (data.status !== undefined) updateData.status = data.status
  if ('sectionId' in data) updateData.sectionId = data.sectionId
  if (data.journalType !== undefined) updateData.journalType = data.journalType
  if (data.journalNameOverride !== undefined) updateData.journalNameOverride = data.journalNameOverride

  if (data.articlePdfUrl !== undefined) {
    updateData.articlePdfUrl = data.articlePdfUrl
    // Nếu PDF mới được upload thủ công, đánh dấu MANUAL
    // Nếu PDF bị xóa (null), reset về PENDING để split script có thể xử lý sau
    if (data.articlePdfUrl) {
      updateData.splitStatus = 'MANUAL'
    } else {
      updateData.splitStatus = 'PENDING'
      updateData.thumbnailUrl = null
      updateData.thumbnailStatus = 'PENDING'
    }
  }

  // Replace authors if provided — đồng thời liên kết lại userId theo tên (giữ link sau khi sửa)
  if (data.authors !== undefined) {
    const userMap = await buildUnambiguousUserNameMap()
    await prisma.journalArticleAuthor.deleteMany({ where: { articleId: id } })
    updateData.authors = {
      create: data.authors.map((au) => ({
        name: au.name,
        militaryRank: au.militaryRank || null,
        academicTitle: au.academicTitle || null,
        degree: au.degree || null,
        organization: au.organization || null,
        order: au.order,
        userId: matchUserId(userMap, au.name),
      })),
    }
  }

  const article = await prisma.journalArticle.update({
    where: { id },
    data: updateData,
    include: { authors: { orderBy: { order: 'asc' } } },
  })

  await logAudit({
    actorId,
    action: AuditEventType.ARTICLE_UPDATED,
    object: `PressArchive:${id}`,
  })

  return article
}

export async function withdrawHistoricalArticle(id: string, actorId: string) {
  const article = await prisma.journalArticle.update({
    where: { id },
    data: { status: 'WITHDRAWN' },
  })

  await logAudit({
    actorId,
    action: AuditEventType.ARTICLE_WITHDRAWN,
    object: `PressArchive:${id}`,
  })

  return article
}
