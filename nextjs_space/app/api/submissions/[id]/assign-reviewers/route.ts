export const dynamic = "force-dynamic"


import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { can, type Role, REVIEWER_ELIGIBLE_ROLES } from '@/lib/rbac'
import { logger } from '@/lib/logger'
import { createNotification } from '@/lib/notification-manager'
import { getStepConfig } from '@/lib/services/workflow-config.service'
import { canEditorAccessSubmission } from '@/lib/editor-scope'

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
    
    if (!session || !can.assignReview(session.role as Role)) {
      return NextResponse.json(
        { error: 'Không có quyền gán phản biện' },
        { status: 403 }
      )
    }

    const { id } = context.params
    const body = await request.json()
    const { reviewerIds } = body

    if (!reviewerIds || !Array.isArray(reviewerIds) || reviewerIds.length < 2) {
      return NextResponse.json(
        { error: 'Cần chọn ít nhất 2 phản biện viên' },
        { status: 400 }
      )
    }

    // Check if submission exists
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        reviews: true
      }
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Không tìm thấy bài nộp' },
        { status: 404 }
      )
    }

    // Scope chuyên mục: BTV chuyên mục chỉ gán phản biện cho bài được phân công.
    if (!canEditorAccessSubmission(session.role, session.uid, submission.assignedEditorId)) {
      return NextResponse.json(
        { error: 'Bài này không thuộc phạm vi phụ trách của bạn' },
        { status: 403 }
      )
    }

    // Conflict of interest: không cho gán tác giả làm phản biện bài của chính họ
    if ((reviewerIds as string[]).includes(submission.createdBy)) {
      return NextResponse.json(
        { error: 'Không thể gán tác giả làm phản biện cho chính bài của họ' },
        { status: 400 }
      )
    }

    // Vòng phản biện hiện tại gắn với CHU KỲ chỉnh sửa, không phải số lần lưu.
    // revisionRound = 0 ở vòng đầu → round 1; sau mỗi lần tác giả nộp lại tăng 1.
    // (Trước đây dùng maxRound+1 nên mỗi lần "Cập nhật phản biện" lại tạo vòng mới,
    //  nhân đôi phản biện — đã sửa.)
    const currentRound = (submission.revisionRound ?? 0) + 1

    // Phản biện viên hợp lệ: trong danh sách vai trò đủ điều kiện (SSOT), đang hoạt động.
    // Khớp đúng tập mà TRANG chọn phản biện mời (gồm cả biên tập viên), tránh lệch UI↔API.
    const validReviewers = await prisma.user.findMany({
      where: { id: { in: reviewerIds }, role: { in: REVIEWER_ELIGIBLE_ROLES }, isActive: true },
      select: { id: true },
    })
    const validReviewerIds = new Set(validReviewers.map(r => r.id))
    const invalidIds = (reviewerIds as string[]).filter(rid => !validReviewerIds.has(rid))
    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: `Một số người dùng không hợp lệ hoặc không đủ điều kiện phản biện: ${invalidIds.join(', ')}` },
        { status: 400 }
      )
    }

    // Get existing reviewer IDs for this round
    const existingReviewerIds = submission.reviews
      .filter(r => r.roundNo === currentRound)
      .map(r => r.reviewerId)

    // Determine reviewers to add and remove
    const reviewersToAdd = (reviewerIds as string[]).filter(rid => !existingReviewerIds.includes(rid))
    const reviewersToRemove = existingReviewerIds.filter(eid => !(reviewerIds as string[]).includes(eid))

    // After removal, ensure we still have at least 2 reviewers assigned
    const remainingCount = existingReviewerIds.length - reviewersToRemove.length + reviewersToAdd.length
    if (remainingCount < 2) {
      return NextResponse.json(
        { error: 'Cần chọn ít nhất 2 phản biện viên' },
        { status: 400 }
      )
    }

    // Remove reviews that are no longer needed
    if (reviewersToRemove.length > 0) {
      await prisma.review.deleteMany({
        where: {
          submissionId: id,
          roundNo: currentRound,
          reviewerId: {
            in: reviewersToRemove
          },
          submittedAt: null // Only remove pending reviews
        }
      })
    }

    // Hạn phản biện: vòng 1 dùng INITIAL_REVIEW, vòng sau dùng RE_REVIEW.
    const reviewStepType = currentRound === 1 ? 'INITIAL_REVIEW' : 'RE_REVIEW'
    const reviewConfig = await getStepConfig(reviewStepType)
    const reviewDeadline = new Date()
    reviewDeadline.setDate(reviewDeadline.getDate() + reviewConfig.deadlineDays)

    // Create new reviews (kèm hạn phản biện để theo dõi quá hạn/nhắc nhở)
    if (reviewersToAdd.length > 0) {
      await prisma.review.createMany({
        data: reviewersToAdd.map((reviewerId: string) => ({
          submissionId: id,
          reviewerId,
          roundNo: currentRound,
          deadline: reviewDeadline,
        }))
      })
    }

    // Chuyển NEW → UNDER_REVIEW (giữ mốc thời gian đổi trạng thái cho SLA/observability)
    if (submission.status === 'NEW') {
      await prisma.submission.update({
        where: { id, status: 'NEW' },
        data: { status: 'UNDER_REVIEW', lastStatusChangeAt: new Date() }
      })
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: session.uid,
        action: 'ASSIGN_REVIEWERS',
        object: `submission:${id}`,
        after: { reviewerIds, round: currentRound } as any,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    // Get updated reviews
    const updatedReviews = await prisma.review.findMany({
      where: {
        submissionId: id,
        roundNo: currentRound
      },
      include: {
        reviewer: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    })

    // Fire-and-forget: thông báo cho từng reviewer mới được gán.
    // Mỗi reviewer nhận link tới ĐÚNG trang phản biện của họ (theo review.id),
    // không phải submissionId — tránh dẫn tới trang không tồn tại (404).
    const newReviews = updatedReviews.filter(r => reviewersToAdd.includes(r.reviewerId))
    if (newReviews.length > 0) {
      void (async () => {
        try {
          await Promise.all(
            newReviews.map(review =>
              createNotification({
                userId: review.reviewerId,
                type: 'REVIEW_INVITED',
                title: 'Bạn được mời phản biện',
                message: `Bạn được mời phản biện bài viết "${submission.title}" (${submission.code}), vòng ${currentRound}. Vui lòng vào hệ thống để xem và thực hiện phản biện.`,
                link: `/dashboard/reviewer/review/${review.id}`,
                sendEmail: true,
              }),
            ),
          );
        } catch (err) {
          logger.error({ context: 'NOTIFICATION_ERROR', action: 'REVIEW_INVITED', error: String(err) });
        }
      })();
    }

    return NextResponse.json({
      success: true,
      reviews: updatedReviews,
      message: 'Gán phản biện viên thành công'
    })
  } catch (error) {
    logger.error({ message: 'Error assigning reviewers:', error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi gán phản biện' },
      { status: 500 }
    )
  }
}
