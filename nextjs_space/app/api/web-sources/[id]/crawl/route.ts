import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api-guards'
import { successResponse, errorResponse } from '@/lib/responses'
import { getCrawlScheduler } from '@/lib/services/crawl-scheduler.service'
import type { Role } from '@prisma/client'

const TRIGGER_ROLES: Role[] = ['SYSADMIN', 'EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'SECTION_EDITOR']
const ALL_CRAWL_ROLES: Role[] = ['SYSADMIN', 'EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'SECTION_EDITOR', 'LAYOUT_EDITOR']

// POST /api/web-sources/[id]/crawl — trigger manual crawl
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole(TRIGGER_ROLES)

    const result = await getCrawlScheduler().triggerManual(params.id, session.user.id)

    return successResponse(result, 'Đã khởi tạo tác vụ crawl', 202)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi server'
    if (msg.includes('quyền')) return errorResponse(msg, 403)
    if (msg.includes('đang có') || msg.includes('không tìm thấy') || msg.includes('bị tắt')) {
      return errorResponse(msg, 400)
    }
    return errorResponse(msg, 500)
  }
}

// GET /api/web-sources/[id]/crawl — lịch sử crawl jobs
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole(ALL_CRAWL_ROLES)

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'))

    const [total, jobs] = await Promise.all([
      prisma.crawlJob.count({ where: { webSourceId: params.id } }),
      prisma.crawlJob.findMany({
        where: { webSourceId: params.id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { trigger: { select: { id: true, fullName: true } } },
      }),
    ])

    return successResponse({
      jobs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi server'
    return errorResponse(msg, msg.includes('quyền') ? 403 : 500)
  }
}
