import { NextRequest } from 'next/server'
import { requireRole } from '@/lib/api-guards'
import { successResponse, errorResponse } from '@/lib/responses'
import { crawledContentService } from '@/lib/services/crawled-content.service'
import type { Role } from '@prisma/client'

const ALL_CRAWL_ROLES: Role[] = ['SYSADMIN', 'EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'SECTION_EDITOR', 'LAYOUT_EDITOR']

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole(ALL_CRAWL_ROLES)
    const body = await req.json().catch(() => ({}))

    const news = await crawledContentService.importToNews(params.id, session.user.id, body.overrides)

    return successResponse(
      { newsId: news.id, newsSlug: news.slug, title: news.title },
      'Import thành công. Bài viết đã được tạo ở trạng thái nháp.'
    )
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi server'
    if (msg.includes('quyền')) return errorResponse(msg, 403)
    if (msg.includes('Không tìm thấy') || msg.includes('APPROVED') || msg.includes('đã được import')) {
      return errorResponse(msg, 400)
    }
    return errorResponse(msg, 500)
  }
}
