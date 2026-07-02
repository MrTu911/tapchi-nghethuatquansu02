import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/responses'
import { rebuildDigitizedIssue } from '@/lib/services/journal-issue-ingest.service'

/**
 * POST /api/repository/ingest/[slug]/rebuild
 * Dựng lại bản đọc (corpus.json) + EPUB từ nội dung đã biên tập — KHÔNG xuất bản.
 * Dùng cho nút "Lưu & dựng lại" ở bước review.
 */

const ALLOWED_ROLES = ['EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'LAYOUT_EDITOR', 'SYSADMIN']

export async function POST(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const session = await getServerSession()
    if (!session) return errorResponse('Unauthorized', 401)
    if (!ALLOWED_ROLES.includes(session.role)) return errorResponse('Không có quyền thực hiện', 403)

    const result = await rebuildDigitizedIssue(params.slug)
    return successResponse(result, 'Đã dựng lại bản đọc và EPUB')
  } catch (error) {
    console.error('[ingest.rebuild] error:', error)
    return errorResponse(error instanceof Error ? error.message : 'Lỗi khi dựng lại', 500)
  }
}
