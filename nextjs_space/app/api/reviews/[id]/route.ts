export const dynamic = "force-dynamic"

/**
 * GET /api/reviews/[id]
 * PUT /api/reviews/[id]
 * PATCH /api/reviews/[id]
 * Mô tả: Quản lý review individual
 * Auth: Required
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-guards'
import { prisma } from '@/lib/prisma'
import { can } from '@/lib/rbac'
import { handleError, AuthorizationError, NotFoundError } from '@/lib/error-handler'
import { logger } from '@/lib/logger'
import { createBulkNotifications } from '@/lib/notification-manager'

interface RouteContext {
  params: {
    id: string
  }
}

/**
 * Đã có quyết định biên tập cho vòng phản biện này chưa.
 * Reviewer chỉ được sửa bài phản biện tới khi BTV ra quyết định cho vòng đó.
 */
async function hasDecisionForRound(
  submissionId: string,
  roundNo: number,
): Promise<boolean> {
  const decision = await prisma.editorDecision.findFirst({
    where: { submissionId, roundNo },
    select: { id: true },
  })
  return !!decision
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await requireAuth(request)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Chưa đăng nhập' },
        { status: 401 }
      )
    }

    const { id } = context.params

    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        submission: {
          include: {
            category: true,
            author: {
              select: {
                fullName: true,
                email: true
              }
            }
          }
        },
        reviewer: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    })

    if (!review) {
      return NextResponse.json(
        { error: 'Không tìm thấy phản biện' },
        { status: 404 }
      )
    }

    // Check permission
    if (review.reviewerId !== session.user.id && !can.admin(session.user.role as any)) {
      return NextResponse.json(
        { error: 'Không có quyền xem phản biện này' },
        { status: 403 }
      )
    }

    return NextResponse.json(review)
  } catch (error) {
    logger.error({ message: "Error fetching review:", error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Có lỗi xảy ra' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await requireAuth(request)
    
    if (!session || !can.review(session.user.role as any)) {
      return NextResponse.json(
        { error: 'Không có quyền phản biện' },
        { status: 403 }
      )
    }

    const { id } = context.params
    const body = await request.json()

    const {
      score,
      recommendation,
      novelty,
      methodology,
      results,
      presentation,
      references,
      strengths,
      weaknesses,
      comments,
      confidentialComments
    } = body

    // Validate điểm theo KHOẢNG 0–100 (không dùng truthiness — điểm 0 vẫn hợp lệ)
    const parsedScore = parseInt(score)
    if (
      score === undefined || score === null || score === '' ||
      Number.isNaN(parsedScore) || parsedScore < 0 || parsedScore > 100
    ) {
      return NextResponse.json(
        { error: 'Điểm tổng thể phải nằm trong khoảng 0–100' },
        { status: 400 }
      )
    }

    // Validate các trường bắt buộc còn lại
    if (!recommendation || !novelty || !methodology ||
        !results || !presentation || !references ||
        !strengths || !weaknesses || !comments) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      )
    }

    // Check if review exists and belongs to user
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        submission: { select: { id: true, title: true, code: true } },
        reviewer: { select: { fullName: true } },
      },
    })

    if (!review) {
      return NextResponse.json(
        { error: 'Không tìm thấy phản biện' },
        { status: 404 }
      )
    }

    if (review.reviewerId !== session.user.id && !can.admin(session.user.role as any)) {
      return NextResponse.json(
        { error: 'Không có quyền cập nhật phản biện này' },
        { status: 403 }
      )
    }

    // Đã từ chối lời mời thì không thể nộp/sửa nữa
    if (review.declinedAt) {
      return NextResponse.json(
        { error: 'Bạn đã từ chối lời mời phản biện này' },
        { status: 400 }
      )
    }

    // Quy tắc nghiệp vụ: được nộp lần đầu, và được SỬA LẠI cho tới khi biên tập
    // ra quyết định cho vòng này. Sau khi có quyết định → khóa.
    const wasSubmitted = !!review.submittedAt
    if (wasSubmitted && (await hasDecisionForRound(review.submissionId, review.roundNo))) {
      return NextResponse.json(
        { error: 'Biên tập đã ra quyết định cho vòng này, không thể chỉnh sửa phản biện' },
        { status: 409 }
      )
    }

    // Create form JSON
    const formJson = {
      novelty,
      methodology,
      results,
      presentation,
      references,
      strengths,
      weaknesses,
      comments,
      confidentialComments: confidentialComments || ''
    }

    // Update review
    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        score: parsedScore,
        recommendation: recommendation as any,
        formJson: formJson as any,
        submittedAt: new Date()
      }
    })

    // Create audit log (phân biệt nộp lần đầu vs sửa lại sau khi đã nộp)
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: wasSubmitted ? 'RESUBMIT_REVIEW' : 'SUBMIT_REVIEW',
        object: `review:${id}`,
        after: updatedReview as any,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    // Fire-and-forget: thông báo cho editors khi phản biện hoàn thành
    void (async () => {
      try {
        const editors = await prisma.user.findMany({
          where: { role: { in: ['MANAGING_EDITOR', 'DEPUTY_EIC', 'EIC', 'SECTION_EDITOR'] } },
          select: { id: true },
        })
        if (editors.length > 0) {
          await createBulkNotifications(
            editors.map(e => e.id),
            {
              type: 'REVIEW_COMPLETED',
              title: wasSubmitted ? 'Phản biện đã được cập nhật' : 'Phản biện đã hoàn thành',
              message: `${review.reviewer?.fullName ?? 'Phản biện viên'} đã ${wasSubmitted ? 'cập nhật' : 'hoàn thành'} phản biện bài viết "${review.submission?.title ?? ''}" (${review.submission?.code ?? ''}).`,
              link: `/dashboard/editor/submissions/${review.submissionId}`,
              sendEmail: false,
            }
          )
        }
      } catch (err) {
        logger.error({ context: 'NOTIFICATION_ERROR', action: 'REVIEW_COMPLETED', error: String(err) })
      }
    })()

    return NextResponse.json({
      success: true,
      review: updatedReview,
      message: 'Nộp phản biện thành công'
    })
  } catch (error) {
    logger.error({ message: "Error updating review:", error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi nộp phản biện' },
      { status: 500 }
    )
  }
}

/**
 * ✅ PATCH: Reopen review (chỉ Editor trở lên)
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await requireAuth(request)
    
    // Chỉ Editor/Managing Editor/EIC mới được reopen
    const canReopen = session && (
      session.user.role === 'SECTION_EDITOR' ||
      session.user.role === 'MANAGING_EDITOR' ||
      session.user.role === 'EIC' ||
      session.user.role === 'SYSADMIN'
    )
    
    if (!canReopen) {
      return NextResponse.json(
        { error: 'Không có quyền mở lại phản biện' },
        { status: 403 }
      )
    }

    const { id } = context.params
    const body = await request.json()
    const { reopen, reason } = body

    if (!reopen) {
      return NextResponse.json(
        { error: 'Thiếu thông tin' },
        { status: 400 }
      )
    }

    const review = await prisma.review.findUnique({
      where: { id }
    })

    if (!review) {
      return NextResponse.json(
        { error: 'Không tìm thấy phản biện' },
        { status: 404 }
      )
    }

    if (!review.submittedAt) {
      return NextResponse.json(
        { error: 'Phản biện chưa được nộp' },
        { status: 400 }
      )
    }

    // Reopen review
    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        submittedAt: null // Reset submittedAt để cho phép chỉnh sửa
      }
    })

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: 'REOPEN_REVIEW',
        object: `review:${id}`,
        after: { reason } as any,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    return NextResponse.json({
      success: true,
      review: updatedReview,
      message: 'Đã mở lại phản biện để chỉnh sửa'
    })
  } catch (error) {
    logger.error({ message: "Error reopening review:", error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Có lỗi xảy ra' },
      { status: 500 }
    )
  }
}
