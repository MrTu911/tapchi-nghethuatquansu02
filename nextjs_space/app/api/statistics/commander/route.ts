import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth'

const WORKFLOW_ORDER = ['NEW', 'UNDER_REVIEW', 'REVISION', 'ACCEPTED', 'IN_PRODUCTION', 'PUBLISHED', 'DESK_REJECT', 'REJECTED']

const ROLE_LABELS: Record<string, string> = {
  READER: 'Độc giả', AUTHOR: 'Tác giả', REVIEWER: 'Phản biện',
  SECTION_EDITOR: 'BT Chuyên mục', LAYOUT_EDITOR: 'BT Trình bày',
  MANAGING_EDITOR: 'BT Chính', EIC: 'Tổng Biên Tập',
  SECURITY_AUDITOR: 'Kiểm toán', COMMANDER: 'Chỉ huy', SYSADMIN: 'Quản trị',
}

function buildMonthKey(date: Date): string {
  return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const allowedRoles = ['COMMANDER', 'EIC', 'SYSADMIN']
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const days = Math.min(Math.max(parseInt(searchParams.get('days') ?? '365', 10) || 365, 30), 365)

    const now = new Date()
    const periodStart = new Date(now.getTime() - days * 86400000)
    const prevPeriodStart = new Date(periodStart.getTime() - days * 86400000)
    const twentyFourMonthsAgo = new Date(now.getFullYear() - 2, now.getMonth(), 1)
    const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000)

    const [
      totalPublished,
      totalIssues,
      totalAuthors,
      acceptedCount,
      rejectedCount,
      overdueCount,
      // Previous period for comparison
      prevPublished,
      prevAuthors,
      prevAccepted,
      prevRejected,
      prevOverdue,
      allSubmissions,
      workloadRaw,
      categories,
      recentIssuesRaw,
      securityDist,
      plagiarismReports,
      reviews,
      repositoryAggregate,
      topArticlesByDownload,
      articlesForDownloadTrend,
      userEcosystemRaw,
      userGrowthRaw,
      acceptDecisions,
      reviewsForPerformance,
      activeUsersLast30Days,
    ] = await Promise.all([
      // 1. Tổng bài đã xuất bản (all time)
      prisma.article.count(),

      // 2. Số tạp chí đã phát hành
      prisma.issue.count({ where: { status: 'PUBLISHED' } }),

      // 3. Tổng tác giả đã đóng góp
      prisma.user.count({ where: { role: 'AUTHOR', submissions: { some: {} } } }),

      // 4. Accepted count (current period)
      prisma.submission.count({
        where: { status: { in: ['ACCEPTED', 'IN_PRODUCTION', 'PUBLISHED'] }, createdAt: { gte: periodStart } }
      }),

      // 5. Rejected count (current period)
      prisma.submission.count({ where: { status: 'REJECTED', createdAt: { gte: periodStart } } }),

      // 6. Overdue count
      prisma.submission.count({ where: { isOverdue: true } }),

      // 7. Prev period: published articles
      prisma.article.count({ where: { publishedAt: { gte: prevPeriodStart, lt: periodStart } } }),

      // 8. Prev period: authors
      prisma.user.count({
        where: { role: 'AUTHOR', submissions: { some: { createdAt: { gte: prevPeriodStart, lt: periodStart } } } }
      }),

      // 9. Prev period: accepted
      prisma.submission.count({
        where: { status: { in: ['ACCEPTED', 'IN_PRODUCTION', 'PUBLISHED'] }, createdAt: { gte: prevPeriodStart, lt: periodStart } }
      }),

      // 10. Prev period: rejected
      prisma.submission.count({
        where: { status: 'REJECTED', createdAt: { gte: prevPeriodStart, lt: periodStart } }
      }),

      // 11. Prev period: overdue
      prisma.submission.count({
        where: { isOverdue: true, createdAt: { gte: prevPeriodStart, lt: periodStart } }
      }),

      // 12. All submissions for trend analysis (24 months)
      prisma.submission.findMany({
        where: { createdAt: { gte: twentyFourMonthsAgo } },
        select: {
          createdAt: true,
          status: true,
          categoryId: true,
          securityLevel: true,
          keywords: true,
          author: { select: { org: true } },
          category: { select: { name: true } },
          article: { select: { publishedAt: true } },
        },
      }),

      // 13. Workload pipeline — current submissions by status
      prisma.submission.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),

      // 14. All categories with submission counts
      prisma.category.findMany({
        include: { _count: { select: { submissions: true } } },
      }),

      // 15. Recent published issues
      prisma.issue.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { publishDate: 'desc' },
        take: 8,
        include: { _count: { select: { articles: true } } },
      }),

      // 16. Security level distribution
      prisma.submission.groupBy({
        by: ['securityLevel'],
        _count: { _all: true },
      }),

      // 17. Plagiarism scores
      prisma.plagiarismReport.findMany({
        select: { score: true },
        where: { score: { gt: 0 } },
        take: 500,
      }),

      // 18. Review scores
      prisma.review.findMany({
        where: { score: { not: null }, submittedAt: { not: null } },
        select: { score: true },
        take: 500,
      }),

      // 19. Repository aggregate: total views & downloads
      prisma.article.aggregate({
        _sum: { views: true, downloads: true },
        _count: { _all: true },
      }),

      // 20. Top 10 articles by downloads
      prisma.article.findMany({
        orderBy: { downloads: 'desc' },
        take: 10,
        select: {
          downloads: true,
          views: true,
          publishedAt: true,
          submission: { select: { title: true } },
        },
      }),

      // 21. Articles published in last 12 months for download trend
      prisma.article.findMany({
        where: { publishedAt: { gte: twelveMonthsAgo } },
        select: { publishedAt: true, downloads: true, views: true },
      }),

      // 22. Active users by role
      prisma.user.groupBy({
        by: ['role'],
        _count: { _all: true },
        where: { isActive: true },
      }),

      // 23. User registration trend (last 6 months)
      prisma.user.findMany({
        where: { createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true, role: true },
      }),

      // 24. Editor decisions for avgProcessingDays
      prisma.editorDecision.findMany({
        where: { decision: 'ACCEPT' },
        select: {
          decidedAt: true,
          submission: { select: { createdAt: true } },
        },
        take: 200,
      }),

      // 25. Reviews for reviewer performance
      prisma.review.findMany({
        where: { submittedAt: { not: null } },
        select: {
          deadline: true,
          submittedAt: true,
          score: true,
          reviewer: { select: { id: true, fullName: true, org: true } },
        },
        take: 1000,
      }),

      // 26. Active users last 30 days (users registered or updated recently)
      prisma.user.count({
        where: { isActive: true },
      }),
    ])

    // ── Build publication trend (24 months) ──────────────────────────
    const monthlyMap: Record<string, { submitted: number; accepted: number; published: number }> = {}
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      monthlyMap[buildMonthKey(d)] = { submitted: 0, accepted: 0, published: 0 }
    }
    for (const s of allSubmissions) {
      const key = buildMonthKey(new Date(s.createdAt))
      if (monthlyMap[key]) {
        monthlyMap[key].submitted++
        if (['ACCEPTED', 'IN_PRODUCTION', 'PUBLISHED'].includes(s.status)) monthlyMap[key].accepted++
        if (s.article?.publishedAt) {
          const pkey = buildMonthKey(new Date(s.article.publishedAt))
          if (monthlyMap[pkey]) monthlyMap[pkey].published++
        }
      }
    }
    const publicationTrend = Object.entries(monthlyMap).map(([month, counts]) => ({ month, ...counts }))

    // ── Category distribution ────────────────────────────────────────
    const totalSubs = allSubmissions.length || 1
    const byCategory = categories
      .map(cat => ({
        name: cat.name,
        count: cat._count.submissions,
        percentage: Math.round((cat._count.submissions / totalSubs) * 100),
      }))
      .filter(c => c.count > 0)
      .sort((a, b) => b.count - a.count)

    // ── Category by year (last 3 years) ─────────────────────────────
    const categoryByYear: Record<string, Record<string, number>> = {}
    for (const s of allSubmissions) {
      const year = new Date(s.createdAt).getFullYear().toString()
      const catName = s.category?.name || 'Chưa phân loại'
      if (!categoryByYear[catName]) categoryByYear[catName] = {}
      categoryByYear[catName][year] = (categoryByYear[catName][year] || 0) + 1
    }
    const years = [...new Set(allSubmissions.map(s => new Date(s.createdAt).getFullYear().toString()))].sort().slice(-3)
    const categoryByYearArr = Object.entries(categoryByYear).map(([category, yearData]) => ({
      category,
      ...Object.fromEntries(years.map(y => [y, yearData[y] || 0])),
    }))

    // ── Category growth rate (year-over-year) ────────────────────────
    const currentYear = now.getFullYear().toString()
    const prevYear = (now.getFullYear() - 1).toString()
    const categoryGrowthRate = Object.entries(categoryByYear)
      .map(([name, yearData]) => {
        const cur = yearData[currentYear] || 0
        const prev = yearData[prevYear] || 0
        const growthRate = prev > 0 ? Math.round(((cur - prev) / prev) * 100) : (cur > 0 ? 100 : 0)
        return { name, growthRate, currentYear: cur, prevYear: prev }
      })
      .filter(c => c.currentYear > 0 || c.prevYear > 0)
      .sort((a, b) => b.currentYear - a.currentYear)
      .slice(0, 8)

    // ── Top keywords (top 20) ────────────────────────────────────────
    const keywordCount: Record<string, number> = {}
    for (const s of allSubmissions) {
      for (const kw of s.keywords || []) {
        const k = kw.trim().toLowerCase()
        if (k) keywordCount[k] = (keywordCount[k] || 0) + 1
      }
    }
    const topKeywords = Object.entries(keywordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([keyword, count]) => ({ keyword, count }))

    // ── Top orgs ────────────────────────────────────────────────────
    const orgCount: Record<string, number> = {}
    for (const s of allSubmissions) {
      const org = s.author?.org?.trim() || 'Không xác định'
      orgCount[org] = (orgCount[org] || 0) + 1
    }
    const topOrgs = Object.entries(orgCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([org, count]) => ({ org, count }))

    // ── Security distribution ────────────────────────────────────────
    const securityDistribution = securityDist.map(s => ({
      level: s.securityLevel,
      count: s._count._all,
    }))

    // ── Quality metrics ──────────────────────────────────────────────
    const avgPlagiarismScore = plagiarismReports.length > 0
      ? Math.round(plagiarismReports.reduce((sum, r) => sum + r.score, 0) / plagiarismReports.length * 10) / 10
      : 0
    const avgReviewScore = reviews.length > 0
      ? Math.round(reviews.reduce((sum, r) => sum + (r.score || 0), 0) / reviews.length * 10) / 10
      : 0
    const completed = acceptedCount + rejectedCount
    const acceptanceRate = completed > 0 ? Math.round((acceptedCount / completed) * 1000) / 10 : 0
    const prevCompleted = prevAccepted + prevRejected
    const prevAcceptanceRate = prevCompleted > 0 ? Math.round((prevAccepted / prevCompleted) * 1000) / 10 : 0

    // ── Acceptance rate trend (12 months) ───────────────────────────
    const monthlyAcceptance: Record<string, { accepted: number; total: number }> = {}
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      monthlyAcceptance[buildMonthKey(d)] = { accepted: 0, total: 0 }
    }
    for (const s of allSubmissions) {
      const key = buildMonthKey(new Date(s.createdAt))
      if (monthlyAcceptance[key]) {
        monthlyAcceptance[key].total++
        if (['ACCEPTED', 'IN_PRODUCTION', 'PUBLISHED'].includes(s.status)) {
          monthlyAcceptance[key].accepted++
        }
      }
    }
    const acceptanceRateTrend = Object.entries(monthlyAcceptance).map(([month, data]) => ({
      month,
      rate: data.total > 0 ? Math.round((data.accepted / data.total) * 100) : 0,
    }))

    // ── Recent issues formatted ──────────────────────────────────────
    const recentIssues = recentIssuesRaw.map(issue => ({
      id: issue.id,
      code: `${issue.year}-${issue.number}`,
      year: issue.year,
      volume: issue.number,
      articleCount: (issue as any)._count?.articles ?? 0,
      publishedAt: issue.publishDate,
    }))

    // ── Workload pipeline ────────────────────────────────────────────
    const workloadMap = Object.fromEntries(workloadRaw.map(w => [w.status, w._count._all]))
    const workloadPipeline = WORKFLOW_ORDER.map(status => ({
      status,
      count: workloadMap[status] ?? 0,
    }))

    // ── Repository metrics ───────────────────────────────────────────
    const repositoryMetrics = {
      totalViews: repositoryAggregate._sum.views ?? 0,
      totalDownloads: repositoryAggregate._sum.downloads ?? 0,
      totalArticles: repositoryAggregate._count._all,
    }

    const topArticles = topArticlesByDownload.map(a => ({
      title: a.submission?.title ?? 'Không có tiêu đề',
      downloads: a.downloads ?? 0,
      views: a.views ?? 0,
      publishedAt: a.publishedAt?.toISOString() ?? null,
    }))

    // ── Monthly download trend (12 months) ──────────────────────────
    const downloadTrendMap: Record<string, { downloads: number; views: number }> = {}
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      downloadTrendMap[buildMonthKey(d)] = { downloads: 0, views: 0 }
    }
    for (const a of articlesForDownloadTrend) {
      if (!a.publishedAt) continue
      const key = buildMonthKey(new Date(a.publishedAt))
      if (downloadTrendMap[key]) {
        downloadTrendMap[key].downloads += a.downloads ?? 0
        downloadTrendMap[key].views += a.views ?? 0
      }
    }
    const monthlyDownloadTrend = Object.entries(downloadTrendMap).map(([month, data]) => ({ month, ...data }))

    // ── User ecosystem ───────────────────────────────────────────────
    const userEcosystem = userEcosystemRaw.map(u => ({
      role: u.role,
      label: ROLE_LABELS[u.role] || u.role,
      count: u._count._all,
    }))

    // ── User growth trend (6 months) ────────────────────────────────
    const growthMap: Record<string, number> = {}
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      growthMap[buildMonthKey(d)] = 0
    }
    for (const u of userGrowthRaw) {
      const key = buildMonthKey(new Date(u.createdAt))
      if (growthMap[key] !== undefined) growthMap[key]++
    }
    const userGrowthTrend = Object.entries(growthMap).map(([month, count]) => ({ month, count }))

    // ── Average processing days ──────────────────────────────────────
    let avgProcessingDays = 0
    if (acceptDecisions.length > 0) {
      const totalDays = acceptDecisions.reduce((sum, d) => {
        const created = new Date(d.submission.createdAt).getTime()
        const decided = new Date(d.decidedAt).getTime()
        return sum + Math.max(0, (decided - created) / 86400000)
      }, 0)
      avgProcessingDays = Math.round(totalDays / acceptDecisions.length)
    }

    // ── Reviewer performance ─────────────────────────────────────────
    const reviewerMap: Record<string, { name: string; org: string; onTime: number; late: number; total: number; totalScore: number }> = {}
    for (const r of reviewsForPerformance) {
      if (!r.reviewer || !r.submittedAt) continue
      const id = r.reviewer.id
      if (!reviewerMap[id]) {
        reviewerMap[id] = { name: r.reviewer.fullName, org: r.reviewer.org || '', onTime: 0, late: 0, total: 0, totalScore: 0 }
      }
      reviewerMap[id].total++
      if (r.deadline && r.submittedAt) {
        if (new Date(r.submittedAt) <= new Date(r.deadline)) reviewerMap[id].onTime++
        else reviewerMap[id].late++
      }
      if (r.score) reviewerMap[id].totalScore += r.score
    }
    const reviewerPerformance = Object.values(reviewerMap)
      .filter(r => r.total >= 1)
      .map(r => ({
        name: r.name,
        org: r.org,
        completed: r.total,
        onTimeRate: r.onTime + r.late > 0 ? Math.round((r.onTime / (r.onTime + r.late)) * 100) : 100,
        avgScore: r.total > 0 ? Math.round((r.totalScore / r.total) * 10) / 10 : 0,
      }))
      .sort((a, b) => b.completed - a.completed)
      .slice(0, 10)

    // ── KPI comparison (% change vs previous period) ─────────────────
    const currentArticleCount = repositoryAggregate._count._all
    const calcChange = (current: number, prev: number): number => {
      if (prev === 0) return current > 0 ? 100 : 0
      return Math.round(((current - prev) / prev) * 100)
    }
    const comparison = {
      totalPublishedChange: calcChange(currentArticleCount, prevPublished),
      totalIssuesChange: 0,
      totalAuthorsChange: calcChange(totalAuthors, prevAuthors),
      acceptanceRateChange: Math.round(acceptanceRate - prevAcceptanceRate),
      avgProcessingDaysChange: 0,
      overdueCountChange: calcChange(overdueCount, prevOverdue),
    }

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalPublished,
          totalIssues,
          totalAuthors,
          acceptanceRate,
          avgProcessingDays,
          overdueCount,
        },
        comparison,
        publicationTrend,
        byCategory,
        categoryByYear: { years, data: categoryByYearArr },
        categoryGrowthRate,
        topKeywords,
        topOrgs,
        securityDistribution,
        qualityMetrics: { avgPlagiarismScore, avgReviewScore },
        acceptanceRateTrend,
        recentIssues,
        workloadPipeline,
        repositoryMetrics,
        topArticlesByDownload: topArticles,
        monthlyDownloadTrend,
        userEcosystem,
        userGrowthTrend,
        reviewerPerformance,
        activeUsersLast30Days,
      },
    })
  } catch (error) {
    console.error('[/api/statistics/commander]', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
