import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api-guards'
import { successResponse, errorResponse } from '@/lib/responses'
import type { Role } from '@prisma/client'

const ALL_CRAWL_ROLES: Role[] = ['SYSADMIN', 'EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'SECTION_EDITOR', 'LAYOUT_EDITOR']

// GET /api/crawled-content — danh sách bài đã crawl
export async function GET(req: NextRequest) {
  try {
    await requireRole(ALL_CRAWL_ROLES)

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'))
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status')
    const webSourceId = searchParams.get('webSourceId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const sort = searchParams.get('sort') || 'newest'

    const where: Record<string, unknown> = {}
    if (search) where.rawTitle = { contains: search, mode: 'insensitive' }
    if (status) where.status = status
    if (webSourceId) where.webSourceId = webSourceId
    if (dateFrom || dateTo) {
      where.createdAt = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      }
    }

    const orderBy =
      sort === 'oldest' ? { createdAt: 'asc' as const } : { createdAt: 'desc' as const }

    const [total, contents, stats] = await Promise.all([
      prisma.crawledContent.count({ where }),
      prisma.crawledContent.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          rawTitle: true,
          editedTitle: true,
          sourceUrl: true,
          rawSummary: true,
          editedSummary: true,
          coverImageS3: true,
          rawImageUrls: true,
          category: true,
          status: true,
          createdAt: true,
          reviewedAt: true,
          importedAt: true,
          webSource: { select: { id: true, name: true } },
          reviewer: { select: { id: true, fullName: true } },
        },
      }),
      // Stats tổng hợp (không filter)
      prisma.crawledContent.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
    ])

    const statsMap = Object.fromEntries(stats.map((s) => [s.status, s._count.id]))

    return successResponse({
      contents,
      stats: {
        total: Object.values(statsMap).reduce((a, b) => a + b, 0),
        pending: statsMap['PENDING'] || 0,
        approved: statsMap['APPROVED'] || 0,
        imported: statsMap['IMPORTED'] || 0,
        rejected: statsMap['REJECTED'] || 0,
        duplicate: statsMap['DUPLICATE'] || 0,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi server'
    return errorResponse(msg, msg.includes('quyền') ? 403 : 500)
  }
}
