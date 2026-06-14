import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/responses'

/**
 * GET /api/dashboard/summary
 * Get comprehensive dashboard summary for analytics page
 */
export async function GET(req: NextRequest) {
  try {
    // Submissions stats
    const [totalSubmissions, newSubmissions, underReviewSubmissions, acceptedSubmissions, rejectedSubmissions, publishedSubmissions] = await Promise.all([
      prisma.submission.count(),
      prisma.submission.count({ where: { status: 'NEW' } }),
      prisma.submission.count({ where: { status: 'UNDER_REVIEW' } }),
      prisma.submission.count({ where: { status: 'ACCEPTED' } }),
      prisma.submission.count({ where: { status: 'REJECTED' } }),
      prisma.article.count()
    ])

    // Submissions by status with labels
    const submissionsByStatus = await prisma.submission.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    })

    const statusLabels: Record<string, string> = {
      'DRAFT': 'Nháp',
      'SUBMITTED': 'Mới nộp',
      'INITIAL_REVIEW': 'Kiểm tra sơ bộ',
      'UNDER_REVIEW': 'Đang phản biện',
      'REVISION': 'Chỉnh sửa',
      'ACCEPTED': 'Chấp nhận',
      'REJECTED': 'Từ chối',
      'PUBLISHED': 'Xuất bản'
    }

    const byStatusWithLabels = submissionsByStatus.map((item) => ({
      status: item.status,
      label: statusLabels[item.status] || item.status,
      count: item._count.id
    }))

    // Users stats
    const [totalUsers, pendingUsers, activeAuthors, activeReviewers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'PENDING' } }),
      prisma.user.count({ where: { role: 'AUTHOR', status: 'APPROVED' } }),
      prisma.user.count({ where: { role: 'REVIEWER', status: 'APPROVED' } })
    ])

    // Reviews stats
    const [totalReviews, pendingReviews, completedReviews] = await Promise.all([
      prisma.review.count(),
      prisma.review.count({ where: { submittedAt: null } }),
      prisma.review.count({ where: { submittedAt: { not: null } } })
    ])

    const completionRate = totalReviews > 0 
      ? ((completedReviews / totalReviews) * 100).toFixed(1)
      : '0.0'

    // Issues stats
    const [totalIssues, publishedIssues, draftIssues] = await Promise.all([
      prisma.issue.count(),
      prisma.issue.count({ where: { status: 'PUBLISHED' } }),
      prisma.issue.count({ where: { status: 'DRAFT' } })
    ])

    // Articles stats
    const totalArticles = await prisma.article.count()

    // Recent submissions (last 5)
    const recentSubmissions = await prisma.submission.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    })

    // Recent reviews (last 5 completed)
    const recentReviews = await prisma.review.findMany({
      take: 5,
      where: { submittedAt: { not: null } },
      orderBy: { submittedAt: 'desc' },
      include: {
        submission: {
          select: {
            id: true,
            title: true,
            code: true
          }
        }
      }
    })

    // Submission trends (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const submissionTrends = await prisma.$queryRaw<Array<{ month: Date; count: bigint }>>`
      SELECT 
        DATE_TRUNC('month', "createdAt") as month,
        COUNT(*) as count
      FROM "Submission"
      WHERE "createdAt" >= ${sixMonthsAgo}
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month ASC
    `

    const summary = {
      submissions: {
        total: totalSubmissions,
        new: newSubmissions,
        underReview: underReviewSubmissions,
        accepted: acceptedSubmissions,
        rejected: rejectedSubmissions,
        published: publishedSubmissions,
        byStatus: byStatusWithLabels
      },
      users: {
        total: totalUsers,
        pending: pendingUsers,
        activeAuthors,
        activeReviewers
      },
      reviews: {
        total: totalReviews,
        pending: pendingReviews,
        completed: completedReviews,
        completionRate
      },
      issues: {
        total: totalIssues,
        published: publishedIssues,
        draft: draftIssues
      },
      articles: {
        total: totalArticles
      },
      recentActivity: {
        submissions: recentSubmissions,
        reviews: recentReviews
      },
      trends: {
        submissions: submissionTrends.map((item) => ({
          month: item.month.toISOString(),
          count: Number(item.count)
        }))
      }
    }

    return successResponse(summary)
  } catch (error) {
    console.error('Error fetching dashboard summary:', error)
    return errorResponse('Failed to fetch dashboard summary', 500)
  }
}
