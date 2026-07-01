
import { getServerSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ISSUE_ARTICLE_COUNT_SELECT, getIssueArticleCount } from '@/lib/issue-utils'
import { PENDING_DECISION_WHERE } from '@/lib/submission-queries'
import { BrandStatCard, type BrandTone } from '@/components/dashboard/brand-stat-card'
import {
  BookOpen, FileText, CheckCircle, ClipboardList, Clock, Layers,
  UserCheck, ArrowRight, Send, BarChart3,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

/**
 * Dashboard THƯ KÝ TÒA SOẠN (MANAGING_EDITOR).
 *
 * Nghiệp vụ: điều phối toàn bộ quy trình biên tập — phân công biên tập viên cho
 * bài mới, đôn đốc phản biện, ra quyết định, quản lý số tạp chí. Thư ký tòa soạn
 * thấy TOÀN BỘ bài nộp (EDITOR_SEE_ALL_ROLES) nhưng quyền ký xuất bản cuối thuộc
 * Tổng biên tập.
 */
export default async function ManagingEditorDashboardPage() {
  const session = await getServerSession()
  if (!session) redirect('/auth/login')

  const [
    awaitingAssignment,
    underReviewCount,
    pendingDecisions,
    acceptedCount,
    inProductionCount,
    totalIssues,
    awaitingAssignmentList,
    recentIssues,
  ] = await Promise.all([
    prisma.submission.count({ where: { status: 'NEW' } }),
    prisma.submission.count({ where: { status: 'UNDER_REVIEW' } }),
    prisma.submission.count({ where: PENDING_DECISION_WHERE }),
    prisma.submission.count({ where: { status: 'ACCEPTED' } }),
    prisma.submission.count({ where: { status: 'IN_PRODUCTION' } }),
    prisma.issue.count(),
    prisma.submission.findMany({
      where: { status: 'NEW' },
      select: {
        id: true, title: true, code: true, createdAt: true,
        category: { select: { name: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: 6,
    }),
    prisma.issue.findMany({
      take: 5,
      include: { volume: true, _count: { select: ISSUE_ARTICLE_COUNT_SELECT } },
      orderBy: { publishDate: 'desc' },
    }),
  ])

  const kpis: { label: string; value: string | number; icon: typeof Clock; tone: BrandTone; hint: string }[] = [
    { label: 'Chờ phân công', value: awaitingAssignment, icon: ClipboardList, tone: 'amber', hint: 'Bài mới chưa gán biên tập' },
    { label: 'Đang phản biện', value: underReviewCount, icon: FileText, tone: 'sky', hint: 'Tổng số đang xử lý' },
    { label: 'Cần quyết định', value: pendingDecisions, icon: Clock, tone: 'gold', hint: 'Phản biện đã xong' },
    { label: 'Chờ xuất bản', value: acceptedCount, icon: CheckCircle, tone: 'emerald', hint: 'Đã chấp nhận' },
    { label: 'Đang dàn trang', value: inProductionCount, icon: Layers, tone: 'green', hint: 'Trong sản xuất' },
    { label: 'Số tạp chí', value: totalIssues, icon: BookOpen, tone: 'slate', hint: 'Tổng đã tạo' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-brand to-gold bg-clip-text text-transparent">
            Dashboard Thư ký tòa soạn
          </h1>
          <p className="text-muted-foreground mt-1">
            Xin chào, {session.fullName} · Điều phối quy trình biên tập và xuất bản
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/managing/assignments">
            <UserCheck className="h-4 w-4 mr-2" />
            Phân công biên tập
          </Link>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map(({ label, value, icon, tone, hint }) => (
          <BrandStatCard key={label} label={label} value={value} icon={icon} tone={tone} hint={hint} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bài chờ phân công biên tập */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <ClipboardList className="h-5 w-5" />
              Chờ phân công biên tập ({awaitingAssignment})
            </CardTitle>
            <CardDescription>Bài mới nộp cần gán biên tập viên chuyên mục phụ trách</CardDescription>
          </CardHeader>
          <CardContent>
            {awaitingAssignmentList.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Không có bài nào đang chờ phân công</p>
              </div>
            ) : (
              <div className="space-y-2">
                {awaitingAssignmentList.map((sub) => {
                  const daysWaiting = Math.floor(
                    (Date.now() - new Date(sub.createdAt).getTime()) / (1000 * 60 * 60 * 24)
                  )
                  return (
                    <div key={sub.id} className="flex items-center justify-between gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{sub.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">{sub.code}</span>
                          {sub.category && (
                            <Badge variant="secondary" className="text-[10px] py-0">{sub.category.name}</Badge>
                          )}
                          <span className={`text-xs ${daysWaiting > 7 ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                            {daysWaiting} ngày
                          </span>
                        </div>
                      </div>
                      <Button size="sm" asChild>
                        <Link href="/dashboard/managing/assignments">
                          Phân công <ArrowRight className="h-3 w-3 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Số tạp chí gần đây */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-emerald-700">
              <BookOpen className="h-5 w-5" />
              Số tạp chí gần đây
            </CardTitle>
            <CardDescription>5 số mới nhất</CardDescription>
          </CardHeader>
          <CardContent>
            {recentIssues.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Chưa có số tạp chí nào</p>
                <Button asChild size="sm" className="mt-4">
                  <Link href="/dashboard/managing/issues/create">Tạo số đầu tiên</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {recentIssues.map((issue) => (
                  <div key={issue.id} className="flex items-center justify-between gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        Tập {issue.volume?.volumeNo || issue.year}, Số {issue.number} ({issue.year})
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{getIssueArticleCount(issue)} bài</span>
                        <Badge variant={issue.status === 'PUBLISHED' ? 'default' : 'secondary'} className="text-[10px] py-0">
                          {issue.status === 'PUBLISHED' ? 'Đã xuất bản' : 'Nháp'}
                        </Badge>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/dashboard/managing/issues/${issue.id}`}>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Truy cập nhanh */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Truy cập nhanh</CardTitle>
          <CardDescription>Các chức năng điều phối tòa soạn</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { href: '/dashboard/managing/assignments', icon: UserCheck, label: 'Phân công', color: 'text-violet-500' },
              { href: '/dashboard/editor/submissions', icon: FileText, label: 'Bài cần xử lý', color: 'text-blue-500' },
              { href: '/dashboard/editor/assign-reviewers', icon: Send, label: 'Gán phản biện', color: 'text-amber-500' },
              { href: '/dashboard/managing/issues', icon: Layers, label: 'Quản lý số', color: 'text-green-500' },
              { href: '/dashboard/managing/issues/create', icon: BookOpen, label: 'Tạo số mới', color: 'text-emerald-600' },
              { href: '/dashboard/eic/analytics', icon: BarChart3, label: 'Phân tích', color: 'text-indigo-500' },
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
