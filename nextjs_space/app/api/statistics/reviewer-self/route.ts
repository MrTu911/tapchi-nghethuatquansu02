import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const reviewerId = session.uid
    const now = new Date()
    const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1)

    const [allReviews, upcomingDeadlines] = await Promise.all([
      prisma.review.findMany({
        where: { reviewerId },
        include: {
          submission: {
            select: {
              title: true,
              code: true,
              category: { select: { name: true } },
            },
          },
        },
        orderBy: { invitedAt: 'desc' },
      }),

      prisma.deadline.findMany({
        where: {
          assignedTo: reviewerId,
          dueDate: { gte: now },
          completedAt: null,
        },
        include: {
          submission: { select: { title: true, code: true } },
        },
        orderBy: { dueDate: 'asc' },
        take: 10,
      }),
    ])

    const totalInvited = allReviews.length
    const totalSubmitted = allReviews.filter(r => r.submittedAt).length
    const completionRate = totalInvited > 0 ? Math.round((totalSubmitted / totalInvited) * 100) : 0

    const completedReviews = allReviews.filter(r => r.submittedAt && r.invitedAt)
    const avgReviewDays = completedReviews.length > 0
      ? Math.round(
          completedReviews.reduce((sum, r) => {
            const days = (new Date(r.submittedAt!).getTime() - new Date(r.invitedAt!).getTime()) / (1000 * 60 * 60 * 24)
            return sum + days
          }, 0) / completedReviews.length
        )
      : 0

    const scoredReviews = allReviews.filter(r => r.score != null)
    const avgScoreGiven = scoredReviews.length > 0
      ? Math.round(scoredReviews.reduce((sum, r) => sum + (r.score || 0), 0) / scoredReviews.length * 10) / 10
      : 0

    const byRecommendation = {
      ACCEPT: allReviews.filter(r => r.recommendation === 'ACCEPT').length,
      MINOR: allReviews.filter(r => r.recommendation === 'MINOR').length,
      MAJOR: allReviews.filter(r => r.recommendation === 'MAJOR').length,
      REJECT: allReviews.filter(r => r.recommendation === 'REJECT').length,
    }

    // Monthly trend (last 12 months)
    const monthlyMap: Record<string, number> = {}
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
      monthlyMap[key] = 0
    }
    for (const r of allReviews) {
      if (!r.submittedAt) continue
      const d = new Date(r.submittedAt)
      const key = `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
      if (monthlyMap[key] !== undefined) monthlyMap[key]++
    }
    const monthlyTrend = Object.entries(monthlyMap).map(([month, count]) => ({ month, count }))

    // Upcoming deadlines formatted
    const upcomingDeadlinesFormatted = upcomingDeadlines.map(d => ({
      submissionTitle: d.submission?.title || 'Bài viết không xác định',
      submissionCode: d.submission?.code || '',
      deadline: d.dueDate,
      daysLeft: Math.ceil((new Date(d.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      type: d.type,
    }))

    // Pending reviews (not yet submitted)
    const pendingReviews = (allReviews as any[])
      .filter((r: any) => !r.submittedAt && !r.declinedAt)
      .map((r: any) => ({
        id: r.id,
        submissionTitle: r.submission?.title || 'Bài viết không xác định',
        submissionCode: r.submission?.code || '',
        category: r.submission?.category?.name || null,
        roundNo: r.roundNo,
        invitedAt: r.invitedAt,
        daysWaiting: r.invitedAt
          ? Math.floor((now.getTime() - new Date(r.invitedAt).getTime()) / (1000 * 60 * 60 * 24))
          : 0,
      }))

    return NextResponse.json({
      success: true,
      data: {
        completionRate,
        avgReviewDays,
        avgScoreGiven,
        totalInvited,
        totalSubmitted,
        byRecommendation,
        monthlyTrend,
        upcomingDeadlines: upcomingDeadlinesFormatted,
        pendingReviews,
      },
    })
  } catch (error) {
    console.error('[/api/statistics/reviewer-self]', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
