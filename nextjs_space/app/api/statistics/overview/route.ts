import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/responses'
import { getServerSession } from '@/lib/auth'

// Thống kê vận hành — chỉ vai trò quản lý/biên tập mới được xem (không public)
const STATS_VIEWER_ROLES = ['SECTION_EDITOR', 'MANAGING_EDITOR', 'DEPUTY_EIC', 'EIC', 'SYSADMIN', 'COMMANDER']

/**
 * GET /api/statistics/overview
 * Get basic statistics overview for the dashboard
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return errorResponse('Unauthorized', 401)
    }
    if (!STATS_VIEWER_ROLES.includes(session.role)) {
      return errorResponse('Forbidden', 403)
    }

    // Total counts
    const [totalUsers, totalSubmissions, totalReviewers, totalPublished] = await Promise.all([
      prisma.user.count(),
      prisma.submission.count(),
      prisma.user.count({ where: { role: 'REVIEWER' } }),
      prisma.article.count()
    ])

    // Active reviewers (those who have submitted at least one review)
    const activeReviewers = await prisma.review.groupBy({
      by: ['reviewerId'],
      where: {
        submittedAt: { not: null }
      }
    })

    // Average review days
    const completedReviews = await prisma.review.findMany({
      where: {
        submittedAt: { not: null }
      },
      select: {
        invitedAt: true,
        submittedAt: true
      }
    })

    let avgReviewDays = 0
    if (completedReviews.length > 0) {
      const totalDays = completedReviews.reduce((sum, review) => {
        if (review.submittedAt && review.invitedAt) {
          const diff = review.submittedAt.getTime() - review.invitedAt.getTime()
          return sum + Math.floor(diff / (1000 * 60 * 60 * 24))
        }
        return sum
      }, 0)
      avgReviewDays = totalDays / completedReviews.length
    }

    // Submissions by month (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const submissionsByMonth = await prisma.$queryRaw<Array<{ month: string; count: bigint }>>`
      SELECT 
        TO_CHAR("createdAt", 'MM/YYYY') as month,
        COUNT(*) as count
      FROM "Submission"
      WHERE "createdAt" >= ${sixMonthsAgo}
      GROUP BY TO_CHAR("createdAt", 'MM/YYYY'), DATE_TRUNC('month', "createdAt")
      ORDER BY DATE_TRUNC('month', "createdAt") ASC
    `

    // Submissions by status
    const submissionsByStatus = await prisma.submission.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    })

    // Users by role
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        id: true
      }
    })

    const stats = {
      totalUsers,
      totalSubmissions,
      totalReviewers,
      activeReviewers: activeReviewers.length,
      avgReviewDays: Math.round(avgReviewDays * 10) / 10,
      totalPublished,
      submissionsByMonth: submissionsByMonth.map((item) => ({
        month: item.month,
        count: Number(item.count)
      })),
      submissionsByStatus: submissionsByStatus.map((item) => ({
        status: item.status,
        count: item._count.id
      })),
      usersByRole: usersByRole.map((item) => ({
        role: item.role,
        count: item._count.id
      }))
    }

    return successResponse(stats)
  } catch (error) {
    console.error('Error fetching statistics:', error)
    return errorResponse('Failed to fetch statistics', 500)
  }
}
