import { getServerSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import { FileText, Clock, CheckCircle, AlertCircle, ArrowRight, Calendar, Users, PlusCircle } from 'lucide-react'
import {
  getSubmissionStatusConfig,
  getStageProgress,
  WORKFLOW_STAGES,
} from '@/lib/submission-status'

export default async function AuthorSubmissionsPage() {
  const session = await getServerSession()
  if (!session) {
    redirect('/auth/login')
  }

  const submissions = await prisma.submission.findMany({
    where: { createdBy: session.uid },
    include: {
      category: true,
      reviews: { include: { reviewer: { select: { fullName: true } } } },
      decisions: {
        include: { editor: { select: { fullName: true } } },
        orderBy: { decidedAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const statusCounts = submissions.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const needsAction = submissions.filter((s) => s.status === 'REVISION')
  const inProgress = submissions.filter((s) => ['NEW', 'UNDER_REVIEW'].includes(s.status))

  const summaryCards = [
    { label: 'Tổng bài nộp', value: submissions.length, icon: FileText, className: 'border-brand/30 bg-brand/5', text: 'text-brand' },
    { label: 'Đang xử lý', value: inProgress.length, icon: Clock, className: 'border-amber-200 bg-amber-50 dark:bg-amber-950/20', text: 'text-amber-700 dark:text-amber-400' },
    { label: 'Cần hành động', value: needsAction.length, icon: AlertCircle, className: 'border-gold/40 bg-gold/10', text: 'text-yellow-800 dark:text-gold' },
    { label: 'Đã công bố', value: statusCounts['PUBLISHED'] || 0, icon: CheckCircle, className: 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20', text: 'text-emerald-700 dark:text-emerald-400' },
  ]

  return (
    <div className="space-y-6">
      {/* Header — brand gradient */}
      <div className="rounded-2xl bg-gradient-to-r from-brand to-military-700 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gold">Tác giả</p>
            <h1 className="mt-1 text-2xl font-bold md:text-3xl">Bài nộp của tôi</h1>
            <p className="mt-1 text-sm text-white/80">Theo dõi tiến trình phản biện và xuất bản</p>
          </div>
          <Button asChild variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20">
            <Link href="/dashboard/author/submit">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nộp bài mới
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.label} className={card.className}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${card.text}`}>{card.label}</p>
                  <p className={`text-2xl font-bold ${card.text}`}>{card.value}</p>
                </div>
                <card.icon className={`h-8 w-8 opacity-40 ${card.text}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Needs Action Alert */}
      {needsAction.length > 0 && (
        <Card className="border-gold/50 bg-gold/10">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-yellow-900 dark:text-gold">
              <AlertCircle className="h-5 w-5" />
              Cần hành động ({needsAction.length})
            </CardTitle>
            <CardDescription>Bài viết cần bạn chỉnh sửa theo yêu cầu phản biện</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {needsAction.slice(0, 3).map((sub) => (
                <div key={sub.id} className="flex items-center justify-between rounded-lg border bg-white p-3 dark:bg-slate-900">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{sub.title}</p>
                    <p className="text-sm text-muted-foreground">{sub.code}</p>
                  </div>
                  <Button size="sm" asChild>
                    <Link href={`/dashboard/author/revise/${sub.id}`}>Chỉnh sửa ngay</Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submissions List */}
      {submissions.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="py-12 text-center text-muted-foreground">
              <FileText className="mx-auto mb-4 h-16 w-16 opacity-40" />
              <h3 className="mb-2 text-lg font-medium">Chưa có bài nộp nào</h3>
              <p className="mb-4">Bắt đầu chia sẻ nghiên cứu của bạn với cộng đồng khoa học</p>
              <Button asChild>
                <Link href="/dashboard/author/submit">Nộp bài đầu tiên</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => {
            const cfg = getSubmissionStatusConfig(submission.status)
            const completedReviews = submission.reviews.filter((r) => r.submittedAt).length
            const progress = getStageProgress(submission.status)
            const daysSince = Math.floor((Date.now() - new Date(submission.createdAt).getTime()) / (1000 * 60 * 60 * 24))
            const latestDecision = submission.decisions[0]
            const isRejected = submission.status === 'REJECTED' || submission.status === 'DESK_REJECT'

            return (
              <Card key={submission.id} className="overflow-hidden transition-all hover:shadow-md">
                <div className="flex">
                  <div className={`w-1.5 ${isRejected ? 'bg-red-500' : submission.status === 'PUBLISHED' ? 'bg-emerald-500' : 'bg-brand'}`} />
                  <div className="flex-1 p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-lg font-semibold">{submission.title}</h3>
                          <Badge variant="outline" className={cfg.badgeClass}>
                            <cfg.icon className="mr-1 h-3.5 w-3.5" />
                            {cfg.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {submission.code} • {submission.category?.name || 'Chưa phân loại'}
                        </p>
                      </div>
                      <div className="flex flex-shrink-0 gap-2">
                        {submission.status === 'REVISION' && (
                          <Button size="sm" asChild>
                            <Link href={`/dashboard/author/revise/${submission.id}`}>Chỉnh sửa</Link>
                          </Button>
                        )}
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/author/submissions/${submission.id}`}>
                            Chi tiết <ArrowRight className="ml-1 h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                    </div>

                    {!isRejected && (
                      <div className="mb-3">
                        <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                          <span>Tiến độ</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <div className="mt-1 flex justify-between">
                          {WORKFLOW_STAGES.slice(0, 4).map((stage, i) => {
                            const StageIcon = stage.icon
                            const isActive = stage.key === submission.status
                            const isPast = WORKFLOW_STAGES.findIndex((s) => s.key === submission.status) > i
                            return (
                              <div
                                key={stage.key}
                                className={`flex items-center gap-1 text-xs ${isActive ? 'font-medium text-brand' : isPast ? 'text-emerald-600' : 'text-muted-foreground'}`}
                              >
                                <StageIcon className="h-3 w-3" />
                                <span className="hidden sm:inline">{stage.label}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-4 border-t pt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {daysSince} ngày trước
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {completedReviews}/{submission.reviews.length} phản biện
                      </span>
                      {latestDecision && (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          {latestDecision.decision}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
