import { getServerSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
  FileText, Clock, CheckCircle, AlertTriangle, ArrowRight,
  UserCheck, Zap, Layers, Eye, ClipboardList, Lock,
} from 'lucide-react'

/**
 * Dashboard PHÓ TỔNG BIÊN TẬP (DEPUTY_EIC).
 *
 * Nghiệp vụ: Phó TBT giám sát TOÀN BỘ tòa soạn ngang Tổng biên tập — ra quyết định
 * biên tập, phân công, đẩy bài vào dàn trang — NHƯNG không có quyền ký xuất bản cuối.
 * Bài đã dàn trang xong được "trình" Tổng biên tập ký (chỉ hiển thị, không có nút
 * xuất bản ở đây). Xem [[editor_flow_revamp]] để biết ranh giới publish = EIC-only.
 */
export default async function DeputyDashboardPage() {
  const session = await getServerSession()
  if (!session) redirect('/auth/login')

  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)

  const [
    pendingDecisions,
    underReviewCount,
    revisionCount,
    inProductionCount,
    overdueCount,
    acceptedCount,
    rejectedCount,
    pendingDecisionList,
    readyForEic,
  ] = await Promise.all([
    prisma.submission.count({
      where: { status: 'UNDER_REVIEW', reviews: { every: { submittedAt: { not: null } } } },
    }),
    prisma.submission.count({ where: { status: 'UNDER_REVIEW' } }),
    prisma.submission.count({ where: { status: 'REVISION' } }),
    prisma.submission.count({ where: { status: 'IN_PRODUCTION' } }),
    prisma.submission.count({
      where: { status: 'UNDER_REVIEW', createdAt: { lt: fourteenDaysAgo } },
    }),
    prisma.submission.count({ where: { status: { in: ['ACCEPTED', 'PUBLISHED'] } } }),
    prisma.submission.count({ where: { status: 'REJECTED' } }),
    prisma.submission.findMany({
      where: { status: 'UNDER_REVIEW', reviews: { every: { submittedAt: { not: null } } } },
      select: {
        id: true, title: true, code: true, createdAt: true,
        category: { select: { name: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: 6,
    }),
    prisma.submission.findMany({
      where: { status: 'IN_PRODUCTION' },
      select: {
        id: true, title: true, code: true, lastStatusChangeAt: true,
        category: { select: { name: true } },
      },
      orderBy: { lastStatusChangeAt: 'asc' },
      take: 5,
    }),
  ])

  const completed = acceptedCount + rejectedCount
  const acceptanceRate = completed > 0 ? ((acceptedCount / completed) * 100).toFixed(1) : '0'

  const kpis = [
    { label: 'Cần quyết định', value: pendingDecisions, icon: Clock, tone: 'text-amber-600', bg: 'from-amber-50 to-white dark:from-amber-950/30 dark:to-slate-800 border-amber-200 dark:border-amber-800', hint: 'Phản biện đã xong' },
    { label: 'Đang phản biện', value: underReviewCount, icon: FileText, tone: 'text-blue-600', bg: 'from-blue-50 to-white dark:from-blue-950/30 dark:to-slate-800 border-blue-100 dark:border-blue-800', hint: 'Tổng số đang xử lý' },
    { label: 'Chờ chỉnh sửa', value: revisionCount, icon: ClipboardList, tone: 'text-orange-600', bg: 'from-orange-50 to-white dark:from-orange-950/30 dark:to-slate-800 border-orange-100 dark:border-orange-800', hint: 'Tác giả đang sửa' },
    { label: 'Chờ TBT ký', value: inProductionCount, icon: Layers, tone: 'text-emerald-600', bg: 'from-emerald-50 to-white dark:from-emerald-950/30 dark:to-slate-800 border-emerald-100 dark:border-emerald-800', hint: 'Đã dàn trang' },
    { label: 'Tỷ lệ chấp nhận', value: `${acceptanceRate}%`, icon: CheckCircle, tone: 'text-green-600', bg: 'from-green-50 to-white dark:from-green-950/30 dark:to-slate-800 border-green-100 dark:border-green-800', hint: `${acceptedCount}/${completed} hoàn tất` },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-800 to-amber-500 bg-clip-text text-transparent">
            Dashboard Phó Tổng biên tập
          </h1>
          <p className="text-muted-foreground mt-1">
            Xin chào, {session.fullName} · Giám sát toàn bộ quy trình biên tập
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/editor/submissions">
            <FileText className="h-4 w-4 mr-2" />
            Quản lý bài nộp
          </Link>
        </Button>
      </div>

      {/* Nhắc nhở ranh giới quyền */}
      <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
        <Lock className="h-5 w-5 text-amber-600 shrink-0" />
        <p className="text-sm text-amber-700 dark:text-amber-400">
          Phó Tổng biên tập điều hành toàn bộ workflow và <strong>trình</strong> bài đã dàn trang lên Tổng biên tập.
          Quyền <strong>ký xuất bản cuối</strong> thuộc về Tổng biên tập.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {kpis.map(({ label, value, icon: Icon, tone, bg, hint }) => (
          <Card key={label} className={`bg-gradient-to-br ${bg}`}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
              <Icon className={`h-4 w-4 ${tone}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${tone}`}>{value}</div>
              <p className="text-xs text-muted-foreground">{hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Overdue alert */}
      {overdueCount > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/20">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">
              {overdueCount} bài đang phản biện đã quá 14 ngày
            </p>
            <p className="text-xs text-red-600 dark:text-red-500">Cần đôn đốc tiến độ phản biện viên</p>
          </div>
          <Button size="sm" variant="outline" asChild className="border-red-300 text-red-700 hover:bg-red-100">
            <Link href="/dashboard/editor/submissions?status=UNDER_REVIEW">Xem ngay</Link>
          </Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Chờ quyết định — Phó TBT được ra quyết định */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <Clock className="h-5 w-5" />
              Chờ quyết định ({pendingDecisions})
            </CardTitle>
            <CardDescription>Bài đã hoàn thành phản biện, chờ ra quyết định biên tập</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingDecisionList.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Không có bài nào đang chờ quyết định</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingDecisionList.map(sub => {
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

        {/* Sẵn sàng trình Tổng biên tập — read-only, KHÔNG có nút xuất bản */}
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-emerald-700">
              <Layers className="h-5 w-5" />
              Trình Tổng biên tập ({inProductionCount})
            </CardTitle>
            <CardDescription>Bài đã dàn trang xong, chờ Tổng biên tập ký xuất bản</CardDescription>
          </CardHeader>
          <CardContent>
            {readyForEic.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Chưa có bài nào sẵn sàng xuất bản</p>
              </div>
            ) : (
              <div className="space-y-2">
                {readyForEic.map(sub => (
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
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/dashboard/layout/production">
                        <Eye className="h-3 w-3 mr-1" /> Theo dõi
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Access */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Truy cập nhanh</CardTitle>
          <CardDescription>Các chức năng điều hành biên tập</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { href: '/dashboard/editor/submissions', icon: FileText, label: 'Quản lý bài', color: 'text-blue-500' },
              { href: '/dashboard/editor/assign-reviewers', icon: UserCheck, label: 'Gán phản biện', color: 'text-amber-500' },
              { href: '/dashboard/managing', icon: ClipboardList, label: 'Phân công', color: 'text-violet-500' },
              { href: '/dashboard/managing/issues', icon: Layers, label: 'Quản lý số', color: 'text-green-500' },
              { href: '/dashboard/layout/production', icon: Zap, label: 'Dàn trang', color: 'text-emerald-600' },
              { href: '/dashboard/eic/analytics', icon: FileText, label: 'Phân tích', color: 'text-indigo-500' },
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
