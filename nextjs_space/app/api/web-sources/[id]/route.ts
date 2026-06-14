import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api-guards'
import { successResponse, errorResponse } from '@/lib/responses'
import { auditLogger, AuditEventType } from '@/lib/audit-logger'
import { getCrawlScheduler } from '@/lib/services/crawl-scheduler.service'
import type { Role } from '@prisma/client'

const ALL_CRAWL_ROLES: Role[] = ['SYSADMIN', 'EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'SECTION_EDITOR', 'LAYOUT_EDITOR']
const MANAGE_ROLES: Role[] = ['SYSADMIN', 'EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR']

// GET /api/web-sources/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole(ALL_CRAWL_ROLES)

    const webSource = await prisma.webSource.findUnique({
      where: { id: params.id },
      include: {
        creator: { select: { id: true, fullName: true } },
        updater: { select: { id: true, fullName: true } },
        crawlJobs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { trigger: { select: { id: true, fullName: true } } },
        },
        _count: { select: { crawledContents: true } },
      },
    })

    if (!webSource) return errorResponse('Không tìm thấy nguồn web', 404)

    return successResponse(webSource)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi server'
    return errorResponse(msg, msg.includes('quyền') ? 403 : 500)
  }
}

// PATCH /api/web-sources/[id]
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole(MANAGE_ROLES)
    const body = await req.json()

    const existing = await prisma.webSource.findUnique({ where: { id: params.id } })
    if (!existing) return errorResponse('Không tìm thấy nguồn web', 404)

    // Validate selector bắt buộc nếu body có selectorRules
    if (body.selectorRules) {
      const rules = body.selectorRules as Record<string, string>
      if (rules.articleListSelector !== undefined && !rules.articleListSelector?.trim()) {
        return errorResponse('Article List Selector không được để trống', 400)
      }
      if (rules.articleLinkSelector !== undefined && !rules.articleLinkSelector?.trim()) {
        return errorResponse('Article Link Selector không được để trống', 400)
      }
      if (rules.contentSelector !== undefined && !rules.contentSelector?.trim()) {
        return errorResponse('Content Selector không được để trống', 400)
      }
      if (rules.titleSelector !== undefined && !rules.titleSelector?.trim()) {
        return errorResponse('Title Selector không được để trống', 400)
      }
    }

    const updated = await prisma.webSource.update({
      where: { id: params.id },
      data: {
        ...body,
        updatedBy: session.user.id,
        updatedAt: new Date(),
      },
    })

    // Re-register cron nếu freq hoặc isActive thay đổi
    if (body.frequency !== undefined || body.isActive !== undefined) {
      if (updated.isActive) {
        getCrawlScheduler().registerSource(updated)
      } else {
        getCrawlScheduler().unregisterSource(updated.id)
      }
    }

    await auditLogger.logSuccess(AuditEventType.SETTINGS_CHANGED, {
      userId: session.user.id,
      details: { module: 'WebCrawler', action: 'WEB_SOURCE_UPDATED', sourceId: updated.id },
    })

    return successResponse(updated, 'Cập nhật thành công')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi server'
    return errorResponse(msg, msg.includes('quyền') ? 403 : 500)
  }
}

// DELETE /api/web-sources/[id] — soft delete (set isActive=false)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole(MANAGE_ROLES)

    const existing = await prisma.webSource.findUnique({
      where: { id: params.id },
      include: { _count: { select: { crawledContents: { where: { status: 'IMPORTED' } } } } },
    })
    if (!existing) return errorResponse('Không tìm thấy nguồn web', 404)

    // Nếu có bài đã import: chỉ soft-delete (isActive=false), không xóa hẳn
    const hasImported = existing._count.crawledContents > 0

    if (hasImported) {
      await prisma.webSource.update({
        where: { id: params.id },
        data: { isActive: false, updatedBy: session.user.id },
      })
      getCrawlScheduler().unregisterSource(params.id)
      return successResponse(null, 'Nguồn web đã được tắt (có bài đã import, không xóa hẳn)')
    }

    // Xóa hẳn nếu không có bài imported
    getCrawlScheduler().unregisterSource(params.id)
    await prisma.webSource.delete({ where: { id: params.id } })

    await auditLogger.logSuccess(AuditEventType.DATA_EXPORT, {
      userId: session.user.id,
      details: { module: 'WebCrawler', action: 'WEB_SOURCE_DELETED', sourceId: params.id },
    })

    return successResponse(null, 'Xóa nguồn web thành công')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi server'
    return errorResponse(msg, msg.includes('quyền') ? 403 : 500)
  }
}
