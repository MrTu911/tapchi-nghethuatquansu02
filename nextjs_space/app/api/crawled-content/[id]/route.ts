import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api-guards'
import { successResponse, errorResponse } from '@/lib/responses'
import type { Role } from '@prisma/client'

const ALL_CRAWL_ROLES: Role[] = ['SYSADMIN', 'EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'SECTION_EDITOR', 'LAYOUT_EDITOR']
const MANAGE_ROLES: Role[] = ['SYSADMIN', 'EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR']

// GET /api/crawled-content/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole(ALL_CRAWL_ROLES)

    const content = await prisma.crawledContent.findUnique({
      where: { id: params.id },
      include: {
        webSource: { select: { id: true, name: true, url: true } },
        crawlJob: { select: { id: true, status: true, startedAt: true, completedAt: true } },
        reviewer: { select: { id: true, fullName: true } },
        importer: { select: { id: true, fullName: true } },
        importedNews: { select: { id: true, slug: true, title: true, isPublished: true } },
      },
    })

    if (!content) return errorResponse('Không tìm thấy bài đã crawl', 404)

    return successResponse(content)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi server'
    return errorResponse(msg, msg.includes('quyền') ? 403 : 500)
  }
}

// PATCH /api/crawled-content/[id] — chỉnh sửa trước import
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole(ALL_CRAWL_ROLES)

    const content = await prisma.crawledContent.findUnique({ where: { id: params.id } })
    if (!content) return errorResponse('Không tìm thấy bài đã crawl', 404)
    if (content.status === 'IMPORTED') {
      return errorResponse('Không thể sửa bài đã được import', 400)
    }

    const body = await req.json()
    const { editedTitle, editedContent, editedSummary, category, tags } = body

    const updated = await prisma.crawledContent.update({
      where: { id: params.id },
      data: {
        ...(editedTitle !== undefined && { editedTitle }),
        ...(editedContent !== undefined && { editedContent }),
        ...(editedSummary !== undefined && { editedSummary }),
        ...(category !== undefined && { category }),
        ...(tags !== undefined && { tags }),
      },
    })

    return successResponse(updated, 'Cập nhật thành công')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi server'
    return errorResponse(msg, msg.includes('quyền') ? 403 : 500)
  }
}

// DELETE /api/crawled-content/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole(MANAGE_ROLES)

    const content = await prisma.crawledContent.findUnique({ where: { id: params.id } })
    if (!content) return errorResponse('Không tìm thấy bài đã crawl', 404)
    if (content.status === 'IMPORTED') {
      return errorResponse('Không thể xóa bài đã được import vào hệ thống', 400)
    }

    await prisma.crawledContent.delete({ where: { id: params.id } })

    return successResponse(null, 'Xóa thành công')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi server'
    return errorResponse(msg, msg.includes('quyền') ? 403 : 500)
  }
}
