export const dynamic = "force-dynamic"


import { NextRequest, NextResponse } from 'next/server'
import { Decision } from '@prisma/client'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { can } from '@/lib/rbac'
import {
  canMakeDecision,
  mapDecisionToStatus,
  isValidTransition,
  DECISION_ELIGIBLE_STATUSES,
} from '@/lib/workflow'
import { logger } from '@/lib/logger'
import { createNotification } from '@/lib/notification-manager'
import { getStepConfig } from '@/lib/services/workflow-config.service'
import { canEditorAccessSubmission } from '@/lib/editor-scope'
import {
  isClassified,
  canDecideClassified,
  hasDualSignature,
  CLASSIFIED_DECISION_ROLES,
} from '@/lib/classified-submission'

interface RouteContext {
  params: {
    id: string
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập' }, { status: 401 })
    }

    const { id } = context.params
    const body = await request.json()
    const { decision, note, roundNo } = body

    if (!decision || !roundNo) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      )
    }

    // Check if submission exists
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        reviews: true,
        author: { select: { id: true } },
      }
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Không tìm thấy bài nộp' },
        { status: 404 }
      )
    }

    // Phân quyền theo độ mật của bài.
    // - Bài mật (SECRET/TOP_SECRET): chỉ EIC + Kiểm định bảo mật được ra MỌI quyết định
    //   (bỏ qua scope chuyên mục vì bài mật không giao cho BTV thường).
    // - Bài thường: editor có can.decide và đúng phạm vi phân công.
    const classified = isClassified(submission.securityLevel)
    if (classified) {
      if (!canDecideClassified(session.role)) {
        return NextResponse.json(
          { error: `Chỉ EIC và Kiểm định bảo mật mới có quyền quyết định bài ${submission.securityLevel}` },
          { status: 403 }
        )
      }
    } else {
      if (!can.decide(session.role as any)) {
        return NextResponse.json(
          { error: 'Không có quyền đưa ra quyết định' },
          { status: 403 }
        )
      }
      // Scope chuyên mục: BTV chuyên mục chỉ ra quyết định trên bài được phân công.
      if (!canEditorAccessSubmission(session.role, session.uid, submission.assignedEditorId)) {
        return NextResponse.json(
          { error: 'Bài này không thuộc phạm vi phụ trách của bạn' },
          { status: 403 }
        )
      }
    }

    // Chỉ ra quyết định khi bài đang ở trạng thái hợp lệ (đang/đã phản biện)
    if (!canMakeDecision(submission.status)) {
      return NextResponse.json(
        { error: `Không thể ra quyết định khi bài đang ở trạng thái ${submission.status}` },
        { status: 409 }
      )
    }

    // Create editor decision
    const editorDecision = await prisma.editorDecision.create({
      data: {
        submissionId: id,
        roundNo,
        decision: decision as any,
        note: note || null,
        decidedBy: session.uid
      }
    })

    // Ánh xạ quyết định → trạng thái đích (xem state machine ở lib/workflow.ts)
    const newStatus = mapDecisionToStatus(decision as Decision)

    // Guard chuyển trạng thái: chỉ cho phép transition hợp lệ theo state machine.
    // Vd. trong REVISION chỉ REJECT (→REJECTED) là hợp lệ; ACCEPT/MINOR/MAJOR sẽ bị chặn
    // vì phải chờ tác giả nộp lại (→UNDER_REVIEW) rồi mới ra quyết định.
    if (!isValidTransition(submission.status, newStatus)) {
      return NextResponse.json(
        {
          error: `Không thể chuyển từ "${submission.status}" sang "${newStatus}" với quyết định này`,
        },
        { status: 409 },
      )
    }

    // ✅ Nguyên tắc hai người cho bài SECRET / TOP_SECRET:
    // mọi quyết định CHUNG THẨM (chấp nhận / từ chối) cần đủ 2 chữ ký
    // (EIC + Kiểm định bảo mật) trước khi có hiệu lực.
    if (classified && (decision === 'ACCEPT' || decision === 'REJECT')) {
      const approvals = await prisma.editorDecision.findMany({
        where: {
          submissionId: id,
          roundNo,
          decision: decision as Decision,
          editor: { role: { in: CLASSIFIED_DECISION_ROLES } },
        },
        include: { editor: { select: { role: true } } },
      })

      if (!hasDualSignature(approvals)) {
        // Chưa đủ 2 chữ ký → giữ nguyên status, chờ người còn lại ký
        return NextResponse.json({
          success: true,
          decision: editorDecision,
          message: `Bài ${submission.securityLevel} cần 2 chữ ký (EIC + Kiểm định bảo mật). Chờ người còn lại phê duyệt.`,
          requiresAdditionalApproval: true,
        })
      }
    }

    // Cập nhật trạng thái atomic: where kèm danh sách trạng thái cho phép ra quyết định.
    // Nếu một actor khác vừa đổi trạng thái (vd. tác giả nộp lại) thì Prisma ném P2025
    // và ta trả 409 thay vì ghi đè trạng thái sai.
    try {
      await prisma.submission.update({
        where: { id, status: { in: DECISION_ELIGIBLE_STATUSES } },
        data: { status: newStatus, lastStatusChangeAt: new Date() },
      })
    } catch (err: any) {
      if (err?.code === 'P2025') {
        return NextResponse.json(
          { error: 'Trạng thái bài viết vừa thay đổi, vui lòng tải lại trang' },
          { status: 409 },
        )
      }
      throw err
    }

    // Yêu cầu chỉnh sửa (MINOR/MAJOR) → mở deadline nộp bản chỉnh sửa cho tác giả.
    // Revision-service sẽ đóng deadline này khi tác giả nộp lại. Không tạo trùng nếu
    // đang còn một deadline REVISION_SUBMIT chưa hoàn thành.
    if (newStatus === 'REVISION') {
      try {
        const existingDeadline = await prisma.deadline.findFirst({
          where: { submissionId: id, type: 'REVISION_SUBMIT', completedAt: null },
          select: { id: true },
        })
        if (!existingDeadline) {
          const revisionConfig = await getStepConfig('REVISION_SUBMIT')
          const dueDate = new Date()
          dueDate.setDate(dueDate.getDate() + revisionConfig.deadlineDays)
          await prisma.deadline.create({
            data: {
              submissionId: id,
              assignedTo: submission.author?.id ?? submission.createdBy,
              type: 'REVISION_SUBMIT',
              dueDate,
              note: note || 'Vui lòng nộp bản chỉnh sửa theo góp ý của biên tập',
            },
          })
        }
      } catch (err) {
        // Non-critical: không chặn quyết định nếu tạo deadline lỗi
        logger.error({ context: 'DECISION_DEADLINE_ERROR', submissionId: id, error: String(err) })
      }
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: session.uid,
        action: 'EDITOR_DECISION',
        object: `submission:${id}`,
        after: { decision, roundNo, newStatus } as any,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    // Fire-and-forget: thông báo cho tác giả về quyết định
    void (async () => {
      try {
        const authorId = submission.author?.id ?? submission.createdBy
        if (!authorId) return

        const notificationLink = `/dashboard/author/submissions/${id}`

        if (decision === 'ACCEPT') {
          await createNotification({
            userId: authorId,
            type: 'DECISION_MADE',
            title: 'Bài viết được chấp thuận',
            message: `Bài viết "${submission.title}" (${submission.code}) đã được chấp thuận đăng. Tòa soạn sẽ chuyển sang khâu biên tập dàn trang để xuất bản.`,
            link: notificationLink,
            sendEmail: true,
          })
        } else if (decision === 'MINOR' || decision === 'MAJOR') {
          await createNotification({
            userId: authorId,
            type: 'REVISION_REQUESTED',
            title: 'Bài viết cần sửa đổi',
            message: `Bài viết "${submission.title}" (${submission.code}) cần ${decision === 'MINOR' ? 'sửa đổi nhỏ' : 'sửa đổi lớn'}. Vui lòng xem nhận xét và nộp lại.`,
            link: notificationLink,
            sendEmail: true,
          })
        } else if (decision === 'REJECT') {
          await createNotification({
            userId: authorId,
            type: 'DECISION_MADE',
            title: 'Bài viết bị từ chối',
            message: `Bài viết "${submission.title}" (${submission.code}) đã bị từ chối.${note ? ' Lý do: ' + note : ''}`,
            link: notificationLink,
            sendEmail: true,
          })
        }
      } catch (err) {
        logger.error({ context: 'NOTIFICATION_ERROR', action: 'DECISION_MADE', error: String(err) })
      }
    })()

    return NextResponse.json({
      success: true,
      decision: editorDecision,
      message: 'Quyết định đã được ghi nhận'
    })
  } catch (error) {
    logger.error({ message: 'Error making decision:', error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi đưa ra quyết định' },
      { status: 500 }
    )
  }
}
