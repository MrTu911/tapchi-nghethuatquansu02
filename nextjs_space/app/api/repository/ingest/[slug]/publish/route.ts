import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/responses'
import { logAudit } from '@/lib/audit-logger'
import { publishDigitizedIssue } from '@/lib/services/journal-issue-ingest.service'

/**
 * POST /api/repository/ingest/[slug]/publish
 *
 * XUẤT BẢN số đã số hóa SAU khi biên tập viên kiểm tra/sửa ở bước review.
 * Dựng lại corpus (dùng contentText đã sửa) + EPUB kèm ảnh, rồi chuyển Issue + bài → PUBLISHED.
 */

const ALLOWED_ROLES = ['EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'LAYOUT_EDITOR', 'SYSADMIN']

export async function POST(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const session = await getServerSession()
    if (!session) return errorResponse('Unauthorized', 401)
    if (!ALLOWED_ROLES.includes(session.role)) return errorResponse('Không có quyền xuất bản', 403)

    const result = await publishDigitizedIssue(params.slug)

    await logAudit({
      actorId: session.uid,
      action: 'JOURNAL_ISSUE_PUBLISH',
      object: `Issue:${result.issueId}`,
      after: { slug: params.slug, totalArticles: result.totalArticles },
    })

    return successResponse(result, 'Đã xuất bản số báo')
  } catch (error) {
    console.error('[ingest.publish] error:', error)
    return errorResponse(error instanceof Error ? error.message : 'Lỗi khi xuất bản số báo', 500)
  }
}
