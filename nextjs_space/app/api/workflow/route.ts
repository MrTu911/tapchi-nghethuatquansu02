/**
 * @fileoverview API chuyển GIAI ĐOẠN của bài nộp (stage transitions).
 *
 * Route này CHỈ xử lý các bước chuyển giai đoạn không phải "quyết định biên tập":
 *   - send_to_review   NEW        → UNDER_REVIEW
 *   - desk_reject      NEW        → DESK_REJECT
 *   - start_production ACCEPTED   → IN_PRODUCTION
 *   - publish          IN_PRODUCTION → PUBLISHED
 *
 * Quyết định biên tập sau phản biện (chấp nhận / sửa nhỏ / sửa lớn / từ chối)
 * đi qua route DUY NHẤT: POST /api/submissions/[id]/decision. Trước đây route này
 * cũng xử lý accept/reject/request_revision gây ra HAI nguồn sự thật mâu thuẫn
 * (accept→ACCEPTED vs accept→IN_PRODUCTION) và bỏ qua two-person rule cho bài mật.
 *
 * Bảo mật:
 *   - KHÔNG tin `newStatus` từ client — trạng thái đích suy ra ở server theo action.
 *   - Mỗi action ràng buộc trạng thái hiện tại + vai trò + transition hợp lệ.
 *   - Cập nhật atomic (where kèm trạng thái kỳ vọng) chống race.
 */

import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/responses'
import { logAudit } from '@/lib/audit-logger'
import { SubmissionStatus } from '@prisma/client'
import { isValidTransition } from '@/lib/workflow'
import { isClassified, canDecideClassified } from '@/lib/classified-submission'

type StageRole = 'editor' | 'managing' | 'eic'

interface StageAction {
  /** Trạng thái đích (suy ra ở server, không nhận từ client). */
  target: SubmissionStatus
  /** Các trạng thái hiện tại hợp lệ để thực hiện action. */
  from: SubmissionStatus[]
  /** Vai trò tối thiểu được phép. */
  role: StageRole
  auditAction: string
}

const STAGE_ACTIONS: Record<string, StageAction> = {
  send_to_review: {
    target: 'UNDER_REVIEW',
    from: ['NEW'],
    role: 'editor',
    auditAction: 'SUBMISSION_SENT_TO_REVIEW',
  },
  desk_reject: {
    target: 'DESK_REJECT',
    from: ['NEW'],
    role: 'editor',
    auditAction: 'SUBMISSION_DESK_REJECTED',
  },
  start_production: {
    target: 'IN_PRODUCTION',
    from: ['ACCEPTED'],
    role: 'managing',
    auditAction: 'PRODUCTION_STARTED',
  },
  publish: {
    target: 'PUBLISHED',
    from: ['IN_PRODUCTION'],
    role: 'eic',
    auditAction: 'ARTICLE_PUBLISHED',
  },
}

/** Các action quyết định biên tập đã chuyển sang /api/submissions/[id]/decision. */
const DECISION_ACTIONS = new Set(['accept', 'reject', 'request_revision'])

function hasStageRole(userRole: string, required: StageRole): boolean {
  const editor = ['SECTION_EDITOR', 'MANAGING_EDITOR', 'DEPUTY_EIC', 'EIC', 'SYSADMIN']
  const managing = ['MANAGING_EDITOR', 'DEPUTY_EIC', 'EIC', 'SYSADMIN']
  const eic = ['EIC', 'SYSADMIN']
  if (required === 'editor') return editor.includes(userRole)
  if (required === 'managing') return managing.includes(userRole)
  return eic.includes(userRole)
}

const STAGE_NOTIFICATIONS: Record<
  string,
  { type: string; title: string; message: (title: string, note?: string) => string }
> = {
  send_to_review: {
    type: 'SUBMISSION_RECEIVED',
    title: 'Bài nộp đã được chuyển sang phản biện',
    message: (title) => `Bài viết "${title}" của bạn đang được gửi đi phản biện.`,
  },
  desk_reject: {
    type: 'DECISION_MADE',
    title: 'Bài nộp bị từ chối sơ bộ',
    message: (title, note) =>
      `Bài viết "${title}" không đáp ứng yêu cầu cơ bản và đã bị từ chối.${note ? ` Lý do: ${note}` : ''}`,
  },
  start_production: {
    type: 'DECISION_MADE',
    title: 'Bài viết vào giai đoạn dàn trang',
    message: (title) =>
      `Bài viết "${title}" đang được biên tập dàn trang và chuẩn bị xuất bản.`,
  },
  publish: {
    type: 'DECISION_MADE',
    title: 'Bài viết đã được xuất bản',
    message: (title) => `Bài viết "${title}" của bạn đã được xuất bản trên tạp chí.`,
  },
}

/**
 * POST /api/workflow
 * Thực hiện một bước chuyển giai đoạn trên bài nộp.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.uid) {
      return errorResponse('Unauthorized', 401)
    }

    const body = await request.json()
    const { submissionId, action, note } = body as {
      submissionId?: string
      action?: string
      note?: string
    }

    if (!submissionId || !action) {
      return errorResponse('Thiếu thông tin bắt buộc', 400)
    }

    // Action quyết định biên tập không thuộc route này nữa
    if (DECISION_ACTIONS.has(action)) {
      return errorResponse(
        'Quyết định biên tập (chấp nhận/sửa/từ chối) thực hiện qua API quyết định, không qua workflow',
        400,
      )
    }

    const stage = STAGE_ACTIONS[action]
    if (!stage) {
      return errorResponse('Hành động không hợp lệ', 400)
    }

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      select: { id: true, status: true, title: true, createdBy: true, securityLevel: true },
    })
    if (!submission) {
      return errorResponse('Không tìm thấy bài nộp', 404)
    }

    // Bài mật: mọi bước chuyển giai đoạn (kể cả desk_reject) chỉ EIC + Kiểm định bảo mật
    // được thực hiện — đồng bộ nguyên tắc hai người ở route quyết định bài mật.
    if (isClassified(submission.securityLevel) && !canDecideClassified(session.role)) {
      return errorResponse(
        `Chỉ EIC và Kiểm định bảo mật mới được xử lý quy trình bài ${submission.securityLevel}`,
        403,
      )
    }

    // Quyền
    if (!hasStageRole(session.role, stage.role)) {
      return errorResponse('Bạn không có quyền thực hiện hành động này', 403)
    }

    // Trạng thái hiện tại hợp lệ cho action
    const currentStatus = submission.status
    if (!stage.from.includes(currentStatus)) {
      return errorResponse(
        `Không thể thực hiện "${action}" khi bài đang ở trạng thái "${currentStatus}"`,
        409,
      )
    }

    // Transition phải hợp lệ theo state machine
    if (!isValidTransition(currentStatus, stage.target)) {
      return errorResponse(
        `Chuyển trạng thái "${currentStatus}" → "${stage.target}" không hợp lệ`,
        409,
      )
    }

    // Cập nhật atomic — where kèm trạng thái kỳ vọng chống race
    try {
      await prisma.submission.update({
        where: { id: submissionId, status: currentStatus },
        data: { status: stage.target, lastStatusChangeAt: new Date() },
      })
    } catch (err: any) {
      if (err?.code === 'P2025') {
        return errorResponse('Trạng thái bài viết vừa thay đổi, vui lòng tải lại trang', 409)
      }
      throw err
    }

    // Audit
    await logAudit({
      actorId: session.uid,
      action: stage.auditAction,
      object: `SUBMISSION:${submissionId}`,
      before: { status: currentStatus },
      after: { status: stage.target, note },
    })

    // Thông báo cho tác giả
    const notif = STAGE_NOTIFICATIONS[action]
    if (notif && submission.createdBy) {
      await prisma.notification.create({
        data: {
          userId: submission.createdBy,
          type: notif.type as any,
          title: notif.title,
          message: notif.message(submission.title, note),
          link: `/dashboard/author/submissions`,
        },
      })
    }

    // Fire-and-forget: kiểm tra đạo văn lại trên nội dung mới nhất khi bài vào phản biện.
    // Dynamic import: chỉ nạp engine (kèm phụ thuộc nặng) khi thực sự cần, không ở module-load.
    if (action === 'send_to_review') {
      void import('@/lib/plagiarism')
        .then((m) => m.runAutoPlagiarismCheck(submissionId, 'ON_REVIEW'))
        .catch((err) => console.error('[workflow] auto plagiarism check failed:', err))
    }

    return successResponse({
      message: 'Đã thực hiện chuyển giai đoạn',
      status: stage.target,
    })
  } catch (error: any) {
    console.error('Error executing workflow action:', error)
    return errorResponse(error.message || 'Internal server error', 500)
  }
}
