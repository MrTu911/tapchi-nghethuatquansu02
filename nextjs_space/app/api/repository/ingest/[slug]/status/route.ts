import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { successResponse, errorResponse, notFoundResponse } from '@/lib/responses'
import { getIngestStatus } from '@/lib/services/journal-issue-ingest.service'

/**
 * GET /api/repository/ingest/[slug]/status
 * Trả tiến trình số hóa của một số (UI poll). Đọc public/data/issues/<slug>/ingest-status.json.
 */

const ALLOWED_ROLES = ['EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'LAYOUT_EDITOR', 'SYSADMIN']

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const session = await getServerSession()
    if (!session) return errorResponse('Unauthorized', 401)
    if (!ALLOWED_ROLES.includes(session.role)) return errorResponse('Không có quyền thực hiện', 403)

    const status = await getIngestStatus(params.slug)
    if (!status) return notFoundResponse('Chưa có tiến trình số hóa cho số này')

    return successResponse(status)
  } catch (error) {
    console.error('[ingest.status] error:', error)
    return errorResponse('Lỗi khi đọc tiến trình số hóa', 500)
  }
}
