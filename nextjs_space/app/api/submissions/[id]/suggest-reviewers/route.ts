export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { can } from '@/lib/rbac'
import { logger } from '@/lib/logger'
import { getTopReviewerRecommendations } from '@/lib/ai/reviewer-match'

interface RouteContext {
  params: { id: string }
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession()

    if (!session || !can.assignReview(session.role as any)) {
      return NextResponse.json(
        { success: false, error: 'Không có quyền xem gợi ý phản biện' },
        { status: 403 }
      )
    }

    const { id: submissionId } = context.params

    // Load submission with keywords and category
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      select: {
        id: true,
        title: true,
        abstractVn: true,
        abstractEn: true,
        keywords: true,
        category: { select: { name: true } },
        reviews: { select: { reviewerId: true } },
      },
    })

    if (!submission) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy bài nộp' },
        { status: 404 }
      )
    }

    // IDs of reviewers already assigned to this submission (any round)
    const assignedReviewerIds = new Set(submission.reviews.map(r => r.reviewerId))

    // Load reviewers with their profile and count of active (pending) reviews
    const reviewerProfiles = await prisma.reviewerProfile.findMany({
      where: {
        isAvailable: true,
        user: {
          role: 'REVIEWER',
          isActive: true,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            org: true,
          },
        },
      },
    })

    if (reviewerProfiles.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'Không có phản biện viên khả dụng',
      })
    }

    // Count active (pending) reviews per reviewer across all submissions
    const activeReviewCounts = await prisma.review.groupBy({
      by: ['reviewerId'],
      where: { submittedAt: null },
      _count: { id: true },
    })
    const activeCountMap = new Map(
      activeReviewCounts.map(r => [r.reviewerId, r._count.id])
    )

    // Build ReviewerExpertise array — exclude already-assigned reviewers
    const reviewerExpertiseList = reviewerProfiles
      .filter(profile => !assignedReviewerIds.has(profile.userId))
      .map(profile => ({
        reviewerId: profile.userId,
        expertise: profile.expertise,
        keywords: profile.keywords,
        previousReviews: activeCountMap.get(profile.userId) ?? 0,
        averageRating: profile.averageRating,
        isAvailable: profile.isAvailable,
      }))

    if (reviewerExpertiseList.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'Tất cả phản biện viên đã được gán cho bài nộp này',
      })
    }

    // Run AI matching
    const topMatches = await getTopReviewerRecommendations(
      {
        title: submission.title,
        abstractVn: submission.abstractVn ?? undefined,
        abstractEn: submission.abstractEn ?? undefined,
        keywords: submission.keywords,
        section: submission.category?.name,
      },
      reviewerExpertiseList,
      5
    )

    // Upsert match scores for audit/cache (fire-and-forget, do not block response)
    const upsertScores = topMatches.map(match =>
      prisma.reviewerMatchScore.upsert({
        where: {
          submissionId_reviewerId: {
            submissionId,
            reviewerId: match.reviewerId,
          },
        },
        create: {
          submissionId,
          reviewerId: match.reviewerId,
          score: match.score,
          expertiseMatch: match.breakdown.expertiseMatch,
          keywordMatch: match.breakdown.keywordMatch,
          availabilityScore: match.breakdown.availabilityScore,
          metadata: { triggeredBy: session.uid } as any,
        },
        update: {
          score: match.score,
          expertiseMatch: match.breakdown.expertiseMatch,
          keywordMatch: match.breakdown.keywordMatch,
          availabilityScore: match.breakdown.availabilityScore,
        },
      })
    )
    prisma.$transaction(upsertScores).catch(err =>
      logger.warn({ message: 'Failed to cache reviewer match scores', error: String(err) })
    )

    // Build user map for response
    const profileMap = new Map(
      reviewerProfiles.map(p => [p.userId, p])
    )

    const suggestions = topMatches.map((match, index) => {
      const profile = profileMap.get(match.reviewerId)
      return {
        rank: index + 1,
        reviewerId: match.reviewerId,
        fullName: profile?.user.fullName ?? '—',
        email: profile?.user.email ?? '—',
        org: profile?.user.org ?? null,
        expertise: profile?.expertise ?? [],
        totalReviews: profile?.totalReviews ?? 0,
        averageRating: profile?.averageRating ?? 0,
        activeReviews: activeCountMap.get(match.reviewerId) ?? 0,
        score: match.score,
        breakdown: match.breakdown,
      }
    })

    return NextResponse.json({ success: true, data: suggestions })
  } catch (error) {
    logger.error({
      message: 'Error suggesting reviewers',
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json(
      { success: false, error: 'Có lỗi xảy ra khi gợi ý phản biện' },
      { status: 500 }
    )
  }
}
