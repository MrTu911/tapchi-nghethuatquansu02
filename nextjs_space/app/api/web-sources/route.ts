import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api-guards'
import { successResponse, errorResponse } from '@/lib/responses'
import { auditLogger, AuditEventType } from '@/lib/audit-logger'
import { getCrawlScheduler } from '@/lib/services/crawl-scheduler.service'
import type { Role } from '@prisma/client'

const ALL_CRAWL_ROLES: Role[] = ['SYSADMIN', 'EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'SECTION_EDITOR', 'LAYOUT_EDITOR']
const MANAGE_ROLES: Role[] = ['SYSADMIN', 'EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR']

// GET /api/web-sources — danh sách nguồn web
export async function GET(req: NextRequest) {
  try {
    const session = await requireRole(ALL_CRAWL_ROLES)

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'))
    const search = searchParams.get('search') || ''
    const isActive = searchParams.get('isActive')
    const frequency = searchParams.get('frequency')

    const where: Record<string, unknown> = {}
    if (search) where.name = { contains: search, mode: 'insensitive' }
    if (isActive !== null) where.isActive = isActive === 'true'
    if (frequency) where.frequency = frequency

    const [total, webSources] = await Promise.all([
      prisma.webSource.count({ where }),
      prisma.webSource.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          creator: { select: { id: true, fullName: true } },
          _count: { select: { crawlJobs: true, crawledContents: true } },
        },
      }),
    ])

    return successResponse({
      webSources,
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

// POST /api/web-sources — tạo nguồn mới
export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(MANAGE_ROLES)
    const body = await req.json()

    const {
      name,
      url,
      description,
      selectorRules,
      defaultCategory,
      defaultTags,
      frequency,
      isActive,
      delayBetweenRequests,
      maxArticlesPerRun,
    } = body

    if (!name || !url || !selectorRules) {
      return errorResponse('Thiếu thông tin bắt buộc: name, url, selectorRules', 400)
    }

    // Validate URL format
    try { new URL(url) } catch { return errorResponse('URL không hợp lệ', 400) }

    // Validate 2 selector bắt buộc để crawl hoạt động
    const rules = selectorRules as Record<string, string>
    if (!rules.articleListSelector?.trim()) {
      return errorResponse('Cần điền "Article List Selector" — CSS selector cho vùng chứa danh sách bài', 400)
    }
    if (!rules.articleLinkSelector?.trim()) {
      return errorResponse('Cần điền "Article Link Selector" — CSS selector cho link từng bài', 400)
    }
    if (!rules.contentSelector?.trim()) {
      return errorResponse('Cần điền "Content Selector" — CSS selector cho vùng nội dung bài', 400)
    }
    if (!rules.titleSelector?.trim()) {
      return errorResponse('Cần điền "Title Selector" — CSS selector cho tiêu đề bài', 400)
    }

    const webSource = await prisma.webSource.create({
      data: {
        name,
        url,
        description,
        selectorRules,
        defaultCategory: defaultCategory || null,
        defaultTags: defaultTags || [],
        frequency: frequency || 'DAILY',
        isActive: isActive !== false,
        delayBetweenRequests: delayBetweenRequests || 2000,
        maxArticlesPerRun: maxArticlesPerRun || 20,
        createdBy: session.user.id,
      },
    })

    // Đăng ký cron nếu active
    if (webSource.isActive) {
      getCrawlScheduler().registerSource(webSource)
    }

    await auditLogger.logSuccess(AuditEventType.DATA_IMPORT, {
      userId: session.user.id,
      details: { module: 'WebCrawler', action: 'WEB_SOURCE_CREATED', sourceId: webSource.id, name },
    })

    return successResponse(webSource, 'Tạo nguồn web thành công', 201)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi server'
    return errorResponse(msg, msg.includes('quyền') ? 403 : 500)
  }
}
