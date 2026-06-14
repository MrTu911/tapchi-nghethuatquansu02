import { getServerSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import {
  FileText, Clock, CheckCircle, Users, AlertTriangle,
  ArrowRight, UserPlus, LayoutGrid, BookOpen
} from 'lucide-react'
import EditorChartsSection from './charts-section'
import { SUBMISSION_STATUS_CONFIG } from '@/lib/submission-status'
import { submissionScopeWhere, submissionRelationScope } from '@/lib/editor-scope'
import type { SubmissionStatus } from '@prisma/client'

/** Các giai đoạn hiển thị trên Kanban (dùng nhãn/màu/icon từ SSOT trạng thái). */
const KANBAN_STAGES: SubmissionStatus[] = ['NEW', 'UNDER_REVIEW', 'REVISION', 'ACCEPTED', 'IN_PRODUCTION']

export default async function EditorDashboardPage() {
  const session = await getServerSession()
  if (!session) redirect('/auth/login')

  const editorRoles = ['SECTION_EDITOR', 'MANAGING_EDITOR', 'DEPUTY_EIC', 'EIC', 'SYSADMIN']
  if (!editorRoles.includes(session.role)) redirect('/dashboard')

  const now = new Date()
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const submissions = await prisma.submission.findMany({
    where: { isArchived: false, ...submissionScopeWhere(session.role, session.uid) },
    include: {
      category: true,
      author: { select: { fullName: true, email: true, org: true } },
      reviews: {
        include: { reviewer: { select: { fullName: true } } },
      },
      decisions: { orderBy: { decidedAt: 'desc' }, take: 1 },
    },
    orderBy: { createdAt: 'desc' },
  })

  const kanbanColumns: Record<SubmissionStatus, typeof submissions> = {
    NEW: submissions.filter(s => s.status === 'NEW'),
    UNDER_REVIEW: submissions.filter(s => s.status === 'UNDER_REVIEW'),
    REVISION: submissions.filter(s => s.status === 'REVISION'),
    ACCEPTED: submissions.filter(s => s.status === 'ACCEPTED'),
    IN_PRODUCTION: submissions.filter(s => s.status === 'IN_PRODUCTION'),
    DESK_REJECT: [],
    REJECTED: [],
    PUBLISHED: [],
  }

  const stats = {
    total: submissions.length,
    newCount: kanbanColumns.NEW.length,
    underReview: kanbanColumns.UNDER_REVIEW.length,
    needsDecision: submissions.filter(s =>
      s.status === 'UNDER_REVIEW' &&
      s.reviews.length > 0 &&
      s.reviews.every((r: { submittedAt: Date | null }) => r.submittedAt)
    ).length,
    overdue: submissions.filter(s => {
      if (s.status !== 'UNDER_REVIEW') return false
      return Math.floor((Date.now() - new Date(s.createdAt).getTime()) / (1000 * 60 * 60 * 24)) > 14
    }).length,
  }

  const pendingReviews = await prisma.review.count({
    where: { submittedAt: null, declinedAt: null, ...submissionRelationScope(session.role, session.uid) },
  })

  // Stage funnel data — màu khớp dot của SSOT trạng thái
  const stageFunnel = [
    { stage: 'NEW', label: 'Bài mới', count: kanbanColumns.NEW.length, color: '#0ea5e9' },
    { stage: 'UNDER_REVIEW', label: 'Đang PB', count: kanbanColumns.UNDER_REVIEW.length, color: '#f59e0b' },
    { stage: 'REVISION', label: 'Chờ sửa', count: kanbanColumns.REVISION.length, color: '#E5C86E' },
    { stage: 'ACCEPTED', label: 'Chấp nhận', count: kanbanColumns.ACCEPTED.length, color: '#2f6b43' },
    { stage: 'IN_PRODUCTION', label: 'Xuất bản', count: kanbanColumns.IN_PRODUCTION.length, color: '#8b5cf6' },
  ]

  // Category breakdown (active submissions only)
  const activeSubs = submissions.filter(s => !['REJECTED', 'PUBLISHED', 'DESK_REJECT'].includes(s.status))
  const catMap: Record<string, number> = {}
  for (const s of activeSubs) {
    const name = s.category?.name || 'Chưa phân loại'
    catMap[name] = (catMap[name] || 0) + 1
  }
  const categoryBreakdown = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([name, count]) => ({ name, count }))

  // Reviewer workload
  const reviewerWorkloadMap: Record<string, { name: string; active: number; overdue: number }> = {}
  for (const s of submissions.filter(s => s.status === 'UNDER_REVIEW')) {
    for (const r of s.reviews.filter((r: any) => !r.submittedAt && !r.declinedAt)) {
      const id = r.reviewerId
      const name = r.reviewer?.fullName || 'Không rõ'
      if (!reviewerWorkloadMap[id]) reviewerWorkloadMap[id] = { name, active: 0, overdue: 0 }
      reviewerWorkloadMap[id].active++
      const daysInReview = Math.floor((Date.now() - new Date(s.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      if (daysInReview > 14) reviewerWorkloadMap[id].overdue++
    }
  }
  const reviewerWorkload = Object.values(reviewerWorkloadMap)
    .sort((a, b) => b.active - a.active)
    .slice(0, 8)

  // Upcoming deadlines (7 days)
  const deadlines = await prisma.deadline.findMany({
    where: {
      dueDate: { gte: now, lte: sevenDaysFromNow },
      completedAt: null,
      ...submissionRelationScope(session.role, session.uid),
    },
    include: { submission: { select: { title: true, code: true } } },
    orderBy: { dueDate: 'asc' },
    take: 8,
  })
  const upcomingDeadlines = deadlines.map(d => ({
    submissionTitle: d.submission?.title || 'Bài viết',
    submissionCode: d.submission?.code || '',
    daysLeft: Math.ceil((new Date(d.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    type: d.type,
  }))

  // KPI cards — dùng tông màu ngữ nghĩa, hài hòa với palette SSOT
  const kpiCards = [
    {
      label: 'Bài mới',
      value: stats.newCount,
      icon: FileText,
      ring: 'border-sky-200 dark:border-sky-900',
      surface: 'from-sky-50 to-white dark:from-sky-950/30 dark:to-slate-900',
      text: 'text-sky-700 dark:text-sky-300',
      iconClass: 'text-sky-400',
    },
    {
      label: 'Đang phản biện',
      value: stats.underReview,
      icon: Clock,
      ring: 'border-amber-200 dark:border-amber-900',
      surface: 'from-amber-50 to-white dark:from-amber-950/30 dark:to-slate-900',
      text: 'text-amber-700 dark:text-amber-300',
      iconClass: 'text-amber-400',
    },
    {
      label: 'Cần quyết định',
      value: stats.needsDecision,
      icon: CheckCircle,
      ring: 'border-brand/30',
      surface: 'from-brand/10 to-white dark:from-brand/20 dark:to-slate-900',
      text: 'text-brand dark:text-emerald-300',
      iconClass: 'text-brand/50',
    },
    {
      label: 'Quá hạn',
      value: stats.overdue,
      icon: AlertTriangle,
      ring: 'border-red-200 dark:border-red-900',
      surface: 'from-red-50 to-white dark:from-red-950/30 dark:to-slate-900',
      text: 'text-red-700 dark:text-red-300',
      iconClass: 'text-red-400',
    },
    {
      label: 'Chờ phản biện',
      value: pendingReviews,
      icon: Users,
      ring: 'border-violet-200 dark:border-violet-900',
      surface: 'from-violet-50 to-white dark:from-violet-950/30 dark:to-slate-900',
      text: 'text-violet-700 dark:text-violet-300',
      iconClass: 'text-violet-400',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-brand/15 bg-gradient-to-r from-brand/10 via-brand/5 to-transparent p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand/70 dark:text-emerald-400/70">
            Tạp chí Nghệ thuật Quân sự Việt Nam
          </p>
          <h1 className="mt-1 text-3xl font-bold text-brand dark:text-emerald-300">
            Bàn làm việc Biên tập
          </h1>
          <p className="text-muted-foreground mt-1">
            Xin chào, {session.fullName} · Quản lý quy trình phản biện và quyết định
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/editor/reviewers">
              <Users className="h-4 w-4 mr-2" />
              Phản biện viên
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/editor/submissions">
              <LayoutGrid className="h-4 w-4 mr-2" />
              Tất cả bài
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-5">
        {kpiCards.map(({ label, value, icon: Icon, ring, surface, text, iconClass }) => (
          <Card key={label} className={`${ring} bg-gradient-to-br ${surface}`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${text}`}>{label}</p>
                  <p className={`text-3xl font-bold ${text}`}>{value}</p>
                </div>
                <Icon className={`h-10 w-10 ${iconClass}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts: funnel, category, workload, deadlines */}
      <EditorChartsSection
        stageFunnel={stageFunnel}
        categoryBreakdown={categoryBreakdown}
        reviewerWorkload={reviewerWorkload}
        upcomingDeadlines={upcomingDeadlines}
      />

      {/* Kanban Board */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <LayoutGrid className="h-5 w-5 text-brand" />
                Pipeline bài viết
              </CardTitle>
              <CardDescription>Theo dõi tiến độ xử lý bài viết theo từng giai đoạn</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {KANBAN_STAGES.map((key) => {
              const cfg = SUBMISSION_STATUS_CONFIG[key]
              const subs = kanbanColumns[key]
              const Icon = cfg.icon
              return (
                <div key={key} className="rounded-xl border bg-card overflow-hidden">
                  <div className={`h-1.5 ${cfg.dotClass}`} />
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        <Icon className={`h-4 w-4 ${cfg.textClass}`} />
                        <h3 className={`font-semibold text-sm ${cfg.textClass}`}>{cfg.label}</h3>
                      </div>
                      <Badge variant="secondary" className="text-xs">{subs.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {subs.slice(0, 5).map((sub) => {
                        const daysAgo = Math.floor((Date.now() - new Date(sub.createdAt).getTime()) / (1000 * 60 * 60 * 24))
                        return (
                          <Link
                            key={sub.id}
                            href={`/dashboard/editor/submissions/${sub.id}`}
                            className="block p-2 bg-background rounded-lg border hover:border-brand/40 hover:shadow-sm transition-all"
                          >
                            <p className="text-xs font-medium line-clamp-2 mb-1">{sub.title}</p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{sub.code}</span>
                              <span>{daysAgo}d</span>
                            </div>
                          </Link>
                        )
                      })}
                      {subs.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-4">Trống</p>
                      )}
                      {subs.length > 5 && (
                        <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
                          <Link href={`/dashboard/editor/submissions?status=${key}`}>
                            Xem thêm {subs.length - 5} <ArrowRight className="h-3 w-3 ml-1" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Thao tác nhanh</CardTitle>
          <CardDescription>Truy cập nhanh các chức năng quản lý</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: `/dashboard/editor/submissions?status=NEW`, icon: FileText, label: `Bài mới (${stats.newCount})` },
            { href: '/dashboard/editor/assign-reviewers', icon: UserPlus, label: 'Gán phản biện' },
            { href: '/dashboard/editor/reviewers', icon: Users, label: 'Phản biện viên' },
            { href: '/dashboard/production', icon: BookOpen, label: 'Xuất bản' },
          ].map(({ href, icon: Icon, label }) => (
            <Button key={href} variant="outline" className="h-auto py-4 flex-col gap-2 hover:border-brand/40 hover:bg-brand/5" asChild>
              <Link href={href}>
                <Icon className="h-6 w-6 text-brand" />
                <span className="text-xs text-center">{label}</span>
              </Link>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
