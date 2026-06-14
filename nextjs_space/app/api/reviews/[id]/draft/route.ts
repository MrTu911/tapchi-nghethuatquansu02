export const dynamic = "force-dynamic"

/**
 * PUT /api/reviews/[id]/draft
 * Mô tả: Lưu NHÁP bài phản biện — cho phép lưu dữ liệu chưa đầy đủ và quay lại
 *        hoàn thiện sau. KHÔNG set `submittedAt` (chưa coi là đã nộp).
 * Auth: Reviewer sở hữu phản biện (hoặc admin).
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-guards'
import { prisma } from '@/lib/prisma'
import { can } from '@/lib/rbac'
import { logger } from '@/lib/logger'

interface RouteContext {
  params: { id: string }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await requireAuth(request)

    if (!session || !can.review(session.user.role as any)) {
      return NextResponse.json({ error: 'Không có quyền phản biện' }, { status: 403 })
    }

    const { id } = context.params
    const body = await request.json()

    const review = await prisma.review.findUnique({
      where: { id },
      select: {
        id: true,
        reviewerId: true,
        submittedAt: true,
        declinedAt: true,
      },
    })

    if (!review) {
      return NextResponse.json({ error: 'Không tìm thấy phản biện' }, { status: 404 })
    }

    if (review.reviewerId !== session.user.id && !can.admin(session.user.role as any)) {
      return NextResponse.json(
        { error: 'Không có quyền cập nhật phản biện này' },
        { status: 403 },
      )
    }

    if (review.declinedAt) {
      return NextResponse.json(
        { error: 'Bạn đã từ chối lời mời phản biện này' },
        { status: 400 },
      )
    }

    // Lưu nháp: gom các trường form vào formJson, KHÔNG bắt buộc đầy đủ.
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
      confidentialComments,
    } = body

    const formJson = {
      novelty: novelty ?? '',
      methodology: methodology ?? '',
      results: results ?? '',
      presentation: presentation ?? '',
      references: references ?? '',
      strengths: strengths ?? '',
      weaknesses: weaknesses ?? '',
      comments: comments ?? '',
      confidentialComments: confidentialComments ?? '',
    }

    const parsedScore =
      score === '' || score == null || Number.isNaN(parseInt(score))
        ? null
        : parseInt(score)

    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        score: parsedScore,
        recommendation: recommendation ? (recommendation as any) : null,
        formJson: formJson as any,
        // submittedAt giữ nguyên (null nếu chưa nộp) — nháp không phải là nộp.
      },
    })

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: 'SAVE_REVIEW_DRAFT',
        object: `review:${id}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      },
    })

    return NextResponse.json({
      success: true,
      review: updatedReview,
      message: 'Đã lưu nháp phản biện',
    })
  } catch (error) {
    logger.error({
      message: 'Error saving review draft:',
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lưu nháp' },
      { status: 500 },
    )
  }
}
