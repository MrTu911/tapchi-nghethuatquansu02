export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { submitRevision, RevisionError } from '@/lib/services/revision-service'
import { logger } from '@/lib/logger'

/**
 * POST /api/submissions/revise
 * Tác giả nộp bản chỉnh sửa cho bài đang ở trạng thái REVISION.
 *
 * Route chỉ: parse → gọi service → trả response chuẩn { success, data, error }.
 * Toàn bộ nghiệp vụ (versionNo server-side, lưu file, đổi trạng thái, deadline,
 * notification, audit) nằm ở lib/services/revision-service.ts.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.uid) {
      return NextResponse.json({ success: false, data: null, error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const submissionId = formData.get('submissionId') as string
    const manuscriptFile = formData.get('manuscript') as File | null
    const responseFile = formData.get('responseToReviewers') as File | null
    const changelog = (formData.get('changelog') as string) || ''
    const coverLetter = (formData.get('coverLetter') as string) || ''

    if (!submissionId || !manuscriptFile) {
      return NextResponse.json(
        { success: false, data: null, error: 'Thiếu thông tin bắt buộc' },
        { status: 400 },
      )
    }

    // versionNo KHÔNG nhận từ client — service tự tính ở server.
    const result = await submitRevision({
      submissionId,
      authorId: session.uid,
      authorEmail: session.email,
      authorRole: session.role,
      manuscriptFile,
      responseFile,
      changelog,
      coverLetter,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    })

    return NextResponse.json({
      success: true,
      data: {
        version: result.version,
        versionNo: result.versionNo,
        revisionRound: result.revisionRound,
        message: 'Nộp bản chỉnh sửa thành công',
      },
      error: null,
    })
  } catch (error) {
    if (error instanceof RevisionError) {
      return NextResponse.json({ success: false, data: null, error: error.message }, { status: error.status })
    }
    logger.error({ context: 'API_SUBMISSIONS_REVISE', error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { success: false, data: null, error: 'Đã xảy ra lỗi khi nộp bản chỉnh sửa' },
      { status: 500 },
    )
  }
}
