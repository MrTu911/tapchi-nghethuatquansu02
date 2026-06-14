import { getServerSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
  FileText, Users, BookOpen, TrendingUp, TrendingDown,
  Clock, CheckCircle, AlertTriangle, BarChart3, ArrowRight,
  UserCheck, Minus, Target, Zap, Star, Building2
} from 'lucide-react'
import EicChartsSection from './charts-section'

export default async function EICDashboardPage() {
  const session = await getServerSession()
  if (!session) redirect('/auth/login')

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1)

  const [
    totalSubmissions,
    thisMonthCount,
    lastMonthCount,
    totalPublishedIssues,
    activeReviewers,
    pendingDecisions,
    overdueSubmissions,
    acceptedCount,
    rejectedCount,
    urgentSubmissions,
    categories,
    recentSubmissions12,
    topReviewers,
    topOrgs,
    inProductionCount,
  ] = await Promise.all([
    prisma.submission.count(),
    prisma.submission.count({ where: { createdAt: { gte: thisMonthStart } } }),
    prisma.submission.count({ where: { createdAt: { gte: lastMonthStart, lt: thisMonthStart } } }),
    prisma.issue.count({ where: { status: 'PUBLISHED' } }),
    prisma.user.count({ where: { role: 'REVIEWER', isActive: true } }),
    prisma.submission.count({
      where: { status: 'UNDER_REVIEW', reviews: { every: { submittedAt: { not: null } } } },
    }),
    prisma.submission.count({
      where: {
        status: 'UNDER_REVIEW',
        createdAt: { lt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.submission.count({ where: { status: { in: ['ACCEPTED', 'PUBLISHED'] } } }),
    prisma.submission.count({ where: { status: 'REJECTED' } }),
    prisma.submission.findMany({
      where: {
        status: 'UNDER_REVIEW',
        reviews: { every: { submittedAt: { not: null } } },
      },
      select: {
        id: true, title: true, code: true, createdAt: true,
        reviews: { select: { submittedAt: true } },
        category: { select: { name: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: 5,
    }),
    // Categories with submission counts
    prisma.category.findMany({
      include: { _count: { select: { submissions: true } } },
    }),
    // Recent 12-month submissions for trend
    prisma.submission.findMany({
      where: { createdAt: { gte: twelveMonthsAgo } },
      select: { createdAt: true, status: true },
    }),
    // Top reviewers
    prisma.user.findMany({
      where: { role: 'REVIEWER' },
      select: {
        id: true, fullName: true, org: true,
        reviews: {
          select: { submittedAt: true, invitedAt: true, score: true },
        },
      },
      take: 20,
    }),
    // Top author orgs
    prisma.user.findMany({
      where: { role: 'AUTHOR', submissions: { some: {} } },
      select: { org: true },
    }),
    prisma.submission.count({ where: { status: 'IN_PRODUCTION' } }),
  ])

  // Hàng chờ KÝ XUẤT BẢN — bài đã dàn trang (IN_PRODUCTION), chờ Tổng biên tập
  // ký xuất bản cuối. Đây là thao tác RIÊNG của EIC (Phó TBT không có quyền này).
  const readyToPublish = await prisma.submission.findMany({
    where: { status: 'IN_PRODUCTION' },
    select: {
      id: true, title: true, code: true, lastStatusChangeAt: true,
      category: { select: { name: true } },
    },
    orderBy: { lastStatusChangeAt: 'asc' },
    take: 5,
  })

  const completed = acceptedCount + rejectedCount
  const acceptanceRate = completed > 0 ? ((acceptedCount / completed) * 100).toFixed(1) : '0'
  const monthGrowthPct = lastMonthCount > 0
    ? ((thisMonthCount - lastMonthCount) / lastMonthCount) * 100
    : null

  // Build monthly trend
  const monthlyMap: Record<string, { submitted: number; accepted: number; rejected: number }> = {}
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `T${d.getMonth() + 1}/${String(d.getFullYear()).slice(2)}`
    monthlyMap[key] = { submitted: 0, accepted: 0, rejected: 0 }
  }
  for (const s of recentSubmissions12) {
    const d = new Date(s.createdAt)
    const key = `T${d.getMonth() + 1}/${String(d.getFullYear()).slice(2)}`
    if (monthlyMap[key]) {
      monthlyMap[key].submitted++
      if (['ACCEPTED', 'PUBLISHED'].includes(s.status)) monthlyMap[key].accepted++
      if (s.status === 'REJECTED') monthlyMap[key].rejected++
    }
  }
  const trendData = Object.entries(monthlyMap).map(([month, d]) => ({ month, ...d }))

  // Category data
  const categoryData = categories
    .filter(c => c._count.submissions > 0)
    .map(c => ({ name: c.name, count: c._count.submissions }))
    .sort((a, b) => b.count - a.count)

  // Top orgs
  const orgMap: Record<string, number> = {}
  for (const u of topOrgs) {
    const org = u.org?.trim() || 'Không xác định'
    orgMap[org] = (orgMap[org] || 0) + 1
  }
  const topOrgsData = Object.entries(orgMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([org, count]) => ({ org, count }))

  // Reviewer performance data
  const reviewerPerf = topReviewers
    .filter(u => u.reviews.length > 0)
    .map(u => {
      const submitted = u.reviews.filter(r => r.submittedAt).length
      const total = u.reviews.length
      const completionRate = total > 0 ? Math.round((submitted / total) * 100) : 0
      const avgDays = submitted > 0
        ? Math.round(
            u.reviews
              .filter(r => r.submittedAt && r.invitedAt)
              .reduce((sum, r) => sum + (new Date(r.submittedAt!).getTime() - new Date(r.invitedAt!).getTime()) / (1000 * 60 * 60 * 24), 0)
            / submitted
          )
        : 0
      return { name: u.fullName, total, submitted, completionRate, avgDays }
    })
    .sort((a, b) => b.completionRate - a.completionRate)
    .slice(0, 8)

  function GrowthBadge({ pct }: { pct: number | null }) {
    if (pct === null) return null
    if (pct > 0) return (
      <span className="flex items-center gap-0.5 text-xs text-green-600">
        <TrendingUp className="h-3 w-3" />+{pct.toFixed(0)}% so tháng trước
      </span>
    )
    if (pct < 0) return (
      <span className="flex items-center gap-0.5 text-xs text-red-500">
        <TrendingDown className="h-3 w-3" />{pct.toFixed(0)}% so tháng trước
      </span>
    )
    return (
      <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" />Không đổi
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-800 to-amber-500 bg-clip-text text-transparent">
            Dashboard Tổng biên tập
          </h1>
          <p className="text-muted-foreground mt-1">
            Xin chào, {session.fullName} · Tổng quan toàn hệ thống tạp chí
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/eic/analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Phân tích chi tiết
          </Link>
        </Button>
      </div>

      {/* KPI Cards — row 1 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card className="xl:col-span-1 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-slate-800 border-blue-100 dark:border-blue-800">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Tháng này</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">{thisMonthCount}</div>
            <GrowthBadge pct={monthGrowthPct} />
          </CardContent>
        </Card>

        <Card className="xl:col-span-1 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-800 border-slate-100 dark:border-slate-700">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Tổng bài nộp</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalSubmissions}</div>
            <p className="text-xs text-muted-foreground">Tất cả thời gian</p>
          </CardContent>
        </Card>

        <Card className="xl:col-span-1 bg-gradient-to-br from-green-50 to-white dark:from-green-950/30 dark:to-slate-800 border-green-100 dark:border-green-800">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Tỷ lệ chấp nhận</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{acceptanceRate}%</div>
            <p className="text-xs text-muted-foreground">{acceptedCount} / {completed} hoàn tất</p>
          </CardContent>
        </Card>

        <Card className={`xl:col-span-1 ${pendingDecisions > 0 ? 'bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/30 dark:to-slate-800 border-amber-200 dark:border-amber-800' : ''}`}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Cần quyết định</CardTitle>
            <Clock className={`h-4 w-4 ${pendingDecisions > 0 ? 'text-amber-500' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${pendingDecisions > 0 ? 'text-amber-600' : ''}`}>{pendingDecisions}</div>
            <p className="text-xs text-muted-foreground">Phản biện đã xong</p>
          </CardContent>
        </Card>

        <Card className="xl:col-span-1 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/30 dark:to-slate-800 border-purple-100 dark:border-purple-800">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Phản biện viên</CardTitle>
            <UserCheck className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{activeReviewers}</div>
            <p className="text-xs text-muted-foreground">Đang hoạt động</p>
          </CardContent>
        </Card>

        <Card className="xl:col-span-1 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/30 dark:to-slate-800 border-indigo-100 dark:border-indigo-800">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Số xuất bản</CardTitle>
            <BookOpen className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600">{totalPublishedIssues}</div>
            <p className="text-xs text-muted-foreground">Tạp chí đã công bố</p>
          </CardContent>
        </Card>
      </div>

      {/* Overdue alert */}
      {overdueSubmissions > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/20">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">
              {overdueSubmissions} bài đang phản biện đã quá 14 ngày
            </p>
            <p className="text-xs text-red-600 dark:text-red-500">Cần theo dõi tiến độ phản biện viên</p>
          </div>
          <Button size="sm" variant="outline" asChild className="border-red-300 text-red-700 hover:bg-red-100">
            <Link href="/dashboard/editor/submissions?status=UNDER_REVIEW">Xem ngay</Link>
          </Button>
        </div>
      )}

      {/* Charts (client component) */}
      <EicChartsSection
        trendData={trendData}
        categoryData={categoryData}
        reviewerPerf={reviewerPerf}
        topOrgsData={topOrgsData}
      />

      {/* Bottom grid: Urgent decisions + Quick access */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Urgent */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-amber-700">
                  <Clock className="h-5 w-5" />
                  Chờ quyết định ({pendingDecisions})
                </CardTitle>
                <CardDescription>Bài đã hoàn thành phản biện, chờ biên tập quyết định</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {urgentSubmissions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Không có bài nào đang chờ quyết định</p>
              </div>
            ) : (
              <div className="space-y-2">
                {urgentSubmissions.map(sub => {
                  const daysWaiting = Math.floor((Date.now() - new Date(sub.createdAt).getTime()) / (1000 * 60 * 60 * 24))
                  return (
                    <div key={sub.id} className="flex items-center justify-between gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{sub.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">{sub.code}</span>
                          {sub.category && (
                            <Badge variant="secondary" className="text-[10px] py-0">{sub.category.name}</Badge>
                          )}
                          <span className={`text-xs ${daysWaiting > 21 ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                            {daysWaiting} ngày
                          </span>
                        </div>
                      </div>
                      <Button size="sm" asChild>
                        <Link href={`/dashboard/editor/submissions/${sub.id}`}>
                          Ra quyết định <ArrowRight className="h-3 w-3 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chờ ký xuất bản — thao tác RIÊNG của Tổng biên tập */}
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-emerald-700">
              <Zap className="h-5 w-5" />
              Chờ ký xuất bản ({inProductionCount})
            </CardTitle>
            <CardDescription>Bài đã dàn trang xong, chờ Tổng biên tập ký xuất bản cuối</CardDescription>
          </CardHeader>
          <CardContent>
            {readyToPublish.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Không có bài nào chờ xuất bản</p>
              </div>
            ) : (
              <div className="space-y-2">
                {readyToPublish.map(sub => (
                  <div key={sub.id} className="flex items-center justify-between gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{sub.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{sub.code}</span>
                        {sub.category && (
                          <Badge variant="secondary" className="text-[10px] py-0">{sub.category.name}</Badge>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="default" asChild className="bg-emerald-700 hover:bg-emerald-800">
                      <Link href="/dashboard/layout/production">
                        Xuất bản <ArrowRight className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Access — full width */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Truy cập nhanh</CardTitle>
          <CardDescription>Các chức năng quản lý quan trọng</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { href: '/dashboard/eic/analytics', icon: BarChart3, label: 'Phân tích', color: 'text-indigo-500' },
              { href: '/dashboard/editor/submissions', icon: FileText, label: 'Quản lý bài', color: 'text-blue-500' },
              { href: '/dashboard/managing/issues', icon: BookOpen, label: 'Quản lý số', color: 'text-green-500' },
              { href: '/dashboard/admin/users', icon: Users, label: 'Người dùng', color: 'text-purple-500' },
              { href: '/dashboard/layout/production', icon: Zap, label: 'Xuất bản', color: 'text-emerald-600' },
              { href: '/dashboard/admin/categories', icon: Target, label: 'Chuyên mục', color: 'text-orange-500' },
            ].map(({ href, icon: Icon, label, color }) => (
              <Button key={href} asChild variant="outline" className="h-auto py-4 flex-col gap-2">
                <Link href={href}>
                  <Icon className={`h-6 w-6 ${color}`} />
                  <span className="text-xs">{label}</span>
                </Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
