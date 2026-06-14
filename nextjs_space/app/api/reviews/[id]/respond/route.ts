export const dynamic = "force-dynamic"

/**
 * POST /api/reviews/[id]/respond
 * Mô tả: Phản biện viên ĐỒNG Ý hoặc TỪ CHỐI lời mời phản biện.
 *        body: { action: 'ACCEPT' | 'DECLINE', reason?: string }
 *        - ACCEPT  → set acceptedAt
 *        - DECLINE → set declinedAt + thông báo cho biên tập
 * Auth: Reviewer sở hữu phản biện.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-guards'
import { prisma } from '@/lib/prisma'
import { can } from '@/lib/rbac'
import { logger } from '@/lib/logger'
import { createBulkNotifications } from '@/lib/notification-manager'

interface RouteContext {
  params: { id: string }
}

type RespondAction = 'ACCEPT' | 'DECLINE'

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await requireAuth(request)

    if (!session || !can.review(session.user.role as any)) {
      return NextResponse.json({ error: 'Không có quyền phản biện' }, { status: 403 })
    }

    const { id } = context.params
    const body = await request.json()
    const action = body?.action as RespondAction
    const reason: string | undefined = body?.reason

    if (action !== 'ACCEPT' && action !== 'DECLINE') {
      return NextResponse.json(
        { error: 'Hành động không hợp lệ (ACCEPT hoặc DECLINE)' },
        { status: 400 },
      )
    }

    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        submission: { select: { id: true, title: true, code: true } },
        reviewer: { select: { fullName: true } },
      },
    })

    if (!review) {
      return NextResponse.json({ error: 'Không tìm thấy phản biện' }, { status: 404 })
    }

    if (review.reviewerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Không có quyền phản hồi lời mời này' },
        { status: 403 },
      )
    }

    // Không cho phản hồi lời mời sau khi đã nộp bài phản biện
    if (review.submittedAt) {
      return NextResponse.json(
        { error: 'Phản biện đã được nộp, không thể thay đổi phản hồi lời mời' },
        { status: 409 },
      )
    }

    if (action === 'ACCEPT') {
      if (review.declinedAt) {
        return NextResponse.json(
          { error: 'Bạn đã từ chối lời mời này trước đó' },
          { status: 409 },
        )
      }
      const updated = await prisma.review.update({
        where: { id },
        data: { acceptedAt: new Date(), declinedAt: null },
      })

      await prisma.auditLog.create({
        data: {
          actorId: session.user.id,
          action: 'ACCEPT_REVIEW_INVITE',
          object: `review:${id}`,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        },
      })

      return NextResponse.json({
        success: true,
        review: updated,
        message: 'Đã đồng ý phản biện',
      })
    }

    // DECLINE
    const updated = await prisma.review.update({
      where: { id },
      data: { declinedAt: new Date(), acceptedAt: null },
    })

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: 'DECLINE_REVIEW_INVITE',
        object: `review:${id}`,
        after: { reason: reason ?? null } as any,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      },
    })

    // Thông báo cho biên tập để tìm phản biện thay thế (fire-and-forget).
    void (async () => {
      try {
        const editors = await prisma.user.findMany({
          where: { role: { in: ['MANAGING_EDITOR', 'DEPUTY_EIC', 'EIC', 'SECTION_EDITOR'] } },
          select: { id: true },
        })
        if (editors.length > 0) {
          await createBulkNotifications(
            editors.map((e) => e.id),
            {
              // Tái dùng REVIEW_COMPLETED làm kênh "trạng thái phản biện thay đổi"
              // vì enum NotificationType chưa có REVIEW_DECLINED; title nêu rõ ý nghĩa.
              type: 'REVIEW_COMPLETED',
              title: 'Phản biện viên đã từ chối lời mời',
              message: `${review.reviewer?.fullName ?? 'Phản biện viên'} đã từ chối phản biện bài "${review.submission?.title ?? ''}" (${review.submission?.code ?? ''})${reason ? `. Lý do: ${reason}` : ''}. Vui lòng gán phản biện viên thay thế.`,
              link: `/dashboard/editor/submissions/${review.submissionId}`,
              sendEmail: false,
            },
          )
        }
      } catch (err) {
        logger.error({
          context: 'NOTIFICATION_ERROR',
          action: 'REVIEW_DECLINED',
          error: String(err),
        })
      }
    })()

    return NextResponse.json({
      success: true,
      review: updated,
      message: 'Đã từ chối lời mời phản biện',
    })
  } catch (error) {
    logger.error({
      message: 'Error responding to review invite:',
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi phản hồi lời mời' },
      { status: 500 },
    )
  }
}
