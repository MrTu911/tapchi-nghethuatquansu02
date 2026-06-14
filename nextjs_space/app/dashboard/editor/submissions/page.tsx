import { getServerSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { FileText, Search, User, Tag, Calendar, MessageSquare } from 'lucide-react'
import { getSubmissionStatusConfig } from '@/lib/submission-status'
import { submissionScopeWhere } from '@/lib/editor-scope'
import type { SubmissionStatus } from '@prisma/client'

interface PageProps {
  searchParams: { status?: string; q?: string }
}

/** Ánh xạ status (từ link Kanban) → tab mặc định. */
const STATUS_TO_TAB: Record<string, string> = {
  NEW: 'new',
  UNDER_REVIEW: 'review',
  REVISION: 'revision',
  ACCEPTED: 'accepted',
}

export default async function EditorSubmissionsPage({ searchParams }: PageProps) {
  const session = await getServerSession()
  if (!session) redirect('/auth/login')

  const keyword = (searchParams.q || '').trim()
  const defaultTab = STATUS_TO_TAB[searchParams.status || ''] || 'new'

  const submissions = await prisma.submission.findMany({
    where: {
      status: { in: ['NEW', 'UNDER_REVIEW', 'REVISION', 'ACCEPTED'] },
      ...submissionScopeWhere(session.role, session.uid),
      ...(keyword
        ? {
            OR: [
              { title: { contains: keyword, mode: 'insensitive' } },
              { code: { contains: keyword, mode: 'insensitive' } },
              { author: { fullName: { contains: keyword, mode: 'insensitive' } } },
            ],
          }
        : {}),
    },
    include: {
      category: true,
      author: { select: { fullName: true, email: true } },
      reviews: { include: { reviewer: { select: { fullName: true } } } },
      decisions: { orderBy: { decidedAt: 'desc' }, take: 1 },
    },
    orderBy: { createdAt: 'desc' },
  })

  const newSubmissions = submissions.filter(s => s.status === 'NEW')
  const underReview = submissions.filter(s => s.status === 'UNDER_REVIEW')
  const needsDecision = submissions.filter(s =>
    s.status === 'UNDER_REVIEW' &&
    s.reviews.length > 0 &&
    s.reviews.every(r => r.submittedAt)
  )
  const revision = submissions.filter(s => s.status === 'REVISION')
  const accepted = submissions.filter(s => s.status === 'ACCEPTED')

  const StatusBadge = ({ status }: { status: SubmissionStatus }) => {
    const cfg = getSubmissionStatusConfig(status)
    const Icon = cfg.icon
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.badgeClass}`}>
        <Icon className="h-3 w-3" />
        {cfg.label}
      </span>
    )
  }

  const SubmissionsList = ({ items }: { items: typeof submissions }) => {
    if (items.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>{keyword ? `Không tìm thấy bài nào khớp "${keyword}"` : 'Không có bài nộp nào'}</p>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {items.map((submission) => {
          const completedReviews = submission.reviews.filter(r => r.submittedAt).length
          const totalReviews = submission.reviews.length
          const reviewPct = totalReviews > 0 ? Math.round((completedReviews / totalReviews) * 100) : 0

          return (
            <div
              key={submission.id}
              className="group rounded-xl border bg-card p-4 transition-all hover:border-brand/40 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <h4 className="font-semibold text-base line-clamp-1">{submission.title}</h4>
                    <StatusBadge status={submission.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground mb-2">
                    <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-muted">{submission.code}</span>
                    <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{submission.author.fullName}</span>
                    <span className="flex items-center gap-1"><Tag className="h-3.5 w-3.5" />{submission.category?.name || 'Chưa phân loại'}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(submission.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                  {submission.abstractVn && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{submission.abstractVn}</p>
                  )}
                  {totalReviews > 0 && (
                    <div className="mt-3 flex items-center gap-2">
                      <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                      <div className="h-1.5 w-32 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-brand" style={{ width: `${reviewPct}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">Phản biện {completedReviews}/{totalReviews}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/editor/submissions/${submission.id}`}>Chi tiết</Link>
                  </Button>
                  {submission.status === 'NEW' && (
                    <Button size="sm" asChild>
                      <Link href={`/dashboard/editor/assign-reviewers?submissionId=${submission.id}`}>
                        Gán phản biện
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-brand dark:text-emerald-300">Quản lý bài nộp</h1>
          <p className="text-muted-foreground mt-1">Xem xét, gán phản biện và theo dõi tiến độ các bài viết</p>
        </div>
        {/* Tìm kiếm (GET form — không cần JS) */}
        <form className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            name="q"
            defaultValue={keyword}
            placeholder="Tìm theo tiêu đề, mã, tác giả…"
            className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/20"
          />
        </form>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="new">Mới ({newSubmissions.length})</TabsTrigger>
          <TabsTrigger value="review">Đang phản biện ({underReview.length})</TabsTrigger>
          <TabsTrigger value="decision">Cần quyết định ({needsDecision.length})</TabsTrigger>
          <TabsTrigger value="revision">Chỉnh sửa ({revision.length})</TabsTrigger>
          <TabsTrigger value="accepted">Đã chấp nhận ({accepted.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="new">
          <Card>
            <CardHeader>
              <CardTitle>Bài nộp mới</CardTitle>
              <CardDescription>Các bài viết vừa nộp, cần xét sơ bộ và gán phản biện</CardDescription>
            </CardHeader>
            <CardContent><SubmissionsList items={newSubmissions} /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="review">
          <Card>
            <CardHeader>
              <CardTitle>Đang phản biện</CardTitle>
              <CardDescription>Các bài viết đang trong quá trình phản biện</CardDescription>
            </CardHeader>
            <CardContent><SubmissionsList items={underReview} /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="decision">
          <Card>
            <CardHeader>
              <CardTitle>Cần quyết định</CardTitle>
              <CardDescription>Đã hoàn thành phản biện, chờ biên tập viên ra quyết định</CardDescription>
            </CardHeader>
            <CardContent><SubmissionsList items={needsDecision} /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revision">
          <Card>
            <CardHeader>
              <CardTitle>Cần chỉnh sửa</CardTitle>
              <CardDescription>Các bài viết đang chờ tác giả nộp bản chỉnh sửa</CardDescription>
            </CardHeader>
            <CardContent><SubmissionsList items={revision} /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accepted">
          <Card>
            <CardHeader>
              <CardTitle>Đã chấp nhận</CardTitle>
              <CardDescription>Các bài đã duyệt nội dung, chờ chuyển sang dàn trang/xuất bản</CardDescription>
            </CardHeader>
            <CardContent><SubmissionsList items={accepted} /></CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
