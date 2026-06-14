import { NextRequest } from 'next/server'
import { requireRole } from '@/lib/api-guards'
import { successResponse, errorResponse } from '@/lib/responses'
import { crawledContentService } from '@/lib/services/crawled-content.service'
import type { Role } from '@prisma/client'

const ALL_CRAWL_ROLES: Role[] = ['SYSADMIN', 'EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'SECTION_EDITOR', 'LAYOUT_EDITOR']

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole(ALL_CRAWL_ROLES)
    const body = await req.json()

    if (!body.reviewNote?.trim()) {
      return errorResponse('Vui lòng nhập lý do từ chối', 400)
    }

    const updated = await crawledContentService.reject(params.id, session.user.id, body.reviewNote)

    return successResponse(updated, 'Đã từ chối bài viết')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi server'
    if (msg.includes('quyền')) return errorResponse(msg, 403)
    if (msg.includes('Không tìm thấy') || msg.includes('đã được import')) return errorResponse(msg, 400)
    return errorResponse(msg, 500)
  }
}
