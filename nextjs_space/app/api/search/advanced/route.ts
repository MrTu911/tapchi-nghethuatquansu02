export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/responses'

const querySchema = z.object({
  keyword:     z.string().optional(),
  title:       z.string().optional(),
  author:      z.string().optional(),
  affiliation: z.string().optional(),
  categoryId:  z.string().optional(),
  yearFrom:    z.string().transform(v => (v ? parseInt(v) : undefined)).optional(),
  yearTo:      z.string().transform(v => (v ? parseInt(v) : undefined)).optional(),
  keywords:    z.string().optional(),
  sortBy:      z.enum(['publishedAt', 'views', 'downloads', 'title']).default('publishedAt'),
  order:       z.enum(['asc', 'desc']).default('desc'),
  page:        z.string().transform(v => Math.max(1, parseInt(v) || 1)).default('1'),
  pageSize:    z.string().transform(v => Math.min(50, Math.max(1, parseInt(v) || 20))).default('20'),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parsed = querySchema.safeParse(Object.fromEntries(searchParams.entries()))

    if (!parsed.success) {
      return errorResponse('Tham số không hợp lệ', 400)
    }

    const {
      keyword,
      title,
      author,
      affiliation,
      categoryId,
      yearFrom,
      yearTo,
      keywords: keywordsParam,
      sortBy,
      order,
      page,
      pageSize,
    } = parsed.data

    // ── Build submission sub-filter ─────────────────────────────────────────
    // Gộp tất cả điều kiện lọc trên Submission vào một object duy nhất
    // tránh bug ghi đè khi dùng spread nhiều lần.
    const submissionFilter: Record<string, unknown> = {
      status: 'PUBLISHED',
    }

    if (categoryId && categoryId !== 'all') {
      submissionFilter.categoryId = categoryId
    }

    // Tìm kiếm từ khóa chung trên nhiều trường
    const generalOR: Record<string, unknown>[] = []
    if (keyword) {
      generalOR.push(
        { title:      { contains: keyword, mode: 'insensitive' } },
        { abstractVn: { contains: keyword, mode: 'insensitive' } },
        { abstractEn: { contains: keyword, mode: 'insensitive' } },
      )
    }

    // Tìm kiếm theo tiêu đề riêng
    if (title) {
      submissionFilter.title = { contains: title, mode: 'insensitive' }
    }

    // Tìm kiếm theo từ khóa metadata (array field)
    if (keywordsParam) {
      const kwArray = keywordsParam.split(',').map(k => k.trim()).filter(Boolean)
      if (kwArray.length > 0) {
        // Tìm bài có chứa ít nhất 1 trong các keyword được chỉ định
        submissionFilter.OR = kwArray.map(kw => ({ keywords: { has: kw } }))
      }
    }

    if (generalOR.length > 0) {
      // Gộp OR của keyword chung vào OR level cao hơn
      submissionFilter.OR = [
        ...(submissionFilter.OR as Record<string, unknown>[] ?? []),
        ...generalOR,
      ]
    }

    // Lọc theo tác giả + đơn vị — xây author filter riêng, không ghi đè nhau
    const authorFilter: Record<string, unknown> = {}
    if (author) {
      authorFilter.fullName = { contains: author, mode: 'insensitive' }
    }
    if (affiliation) {
      authorFilter.org = { contains: affiliation, mode: 'insensitive' }
    }
    if (Object.keys(authorFilter).length > 0) {
      submissionFilter.author = authorFilter
    }

    // ── Build issue sub-filter (năm xuất bản) ───────────────────────────────
    const issueFilter: Record<string, unknown> = {}
    if (yearFrom !== undefined || yearTo !== undefined) {
      const yearCondition: Record<string, number> = {}
      if (yearFrom !== undefined) yearCondition.gte = yearFrom
      if (yearTo !== undefined)   yearCondition.lte = yearTo
      issueFilter.year = yearCondition
    }

    // ── Build orderBy ────────────────────────────────────────────────────────
    let orderBy: Record<string, unknown>
    switch (sortBy) {
      case 'views':
        orderBy = { views: order }
        break
      case 'downloads':
        orderBy = { downloads: order }
        break
      case 'title':
        orderBy = { submission: { title: order } }
        break
      case 'publishedAt':
      default:
        orderBy = { publishedAt: order }
        break
    }

    const where: Record<string, unknown> = {
      submission: submissionFilter,
    }
    if (Object.keys(issueFilter).length > 0) {
      where.issue = issueFilter
    }

    const skip = (page - 1) * pageSize

    // ── Query DB ─────────────────────────────────────────────────────────────
    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where: where as any,
        include: {
          submission: {
            include: {
              author: {
                select: { fullName: true, org: true }
              },
              category: {
                select: { id: true, name: true }
              }
            }
          },
          issue: {
            include: {
              volume: { select: { volumeNo: true } }
            }
          },
          // views & downloads là field trực tiếp trên Article, không phải relation
        },
        orderBy: orderBy as any,
        skip,
        take: pageSize,
      }),
      prisma.article.count({ where: where as any }),
    ])

    // ── Transform results ─────────────────────────────────────────────────
    const results = articles.map(article => ({
      id: article.id,
      title: article.submission.title,
      abstract: article.submission.abstractVn || article.submission.abstractEn || '',
      author: {
        fullName: article.submission.author.fullName,
        org: article.submission.author.org ?? null,
      },
      category: article.submission.category ?? null,
      keywords: article.submission.keywords ?? [],
      publishedAt: article.publishedAt ?? null,
      doi: article.doiLocal ?? null,
      pages: article.pages ?? null,
      views: article.views,
      downloads: article.downloads,
      issue: article.issue
        ? {
            volume: article.issue.volume?.volumeNo ?? null,
            number: article.issue.number,
            year: article.issue.year,
          }
        : null,
    }))

    return successResponse({
      results,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }, 'Tìm kiếm thành công')
  } catch (error) {
    console.error('[SEARCH/ADVANCED]', error)
    return errorResponse('Lỗi tìm kiếm', 500)
  }
}
