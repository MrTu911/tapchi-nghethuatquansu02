import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/responses'

/**
 * @route GET /api/analytics/visitors
 * @desc Get visitor statistics aggregated from real article and news view counts
 * @access Public
 */
export async function GET(_request: NextRequest) {
  try {
    const [articleStats, newsStats] = await Promise.all([
      prisma.article.aggregate({
        where: { approvalStatus: 'APPROVED' },
        _sum: { views: true, downloads: true },
        _count: { id: true },
      }),
      prisma.news.aggregate({
        where: { isPublished: true },
        _sum: { views: true },
      }),
    ])

    const totalArticleViews = articleStats._sum.views ?? 0
    const totalNewsViews = newsStats._sum.views ?? 0
    const totalDownloads = articleStats._sum.downloads ?? 0
    const totalArticles = articleStats._count.id

    // Total visits = sum of all real view counts across articles and news
    const totalVisits = totalArticleViews + totalNewsViews

    // Estimate daily visits: spread total views evenly over estimated active days
    // Minimum 1 year of operation assumed; capped to avoid inflated numbers
    const estimatedDays = Math.max(365, totalArticles * 3)
    const todayVisits = Math.max(10, Math.round(totalVisits / estimatedDays))

    return successResponse({
      totalVisits,
      todayVisits,
      totalDownloads,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching visitor stats:', error)
    return errorResponse('Failed to fetch visitor statistics', 500)
  }
}
