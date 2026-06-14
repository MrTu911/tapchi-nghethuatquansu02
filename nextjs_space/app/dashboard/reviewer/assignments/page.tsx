
import { getServerSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ReviewerAssignmentsPending from './pending-tab'
import ReviewerAssignmentsCompleted from './completed-tab'

export default async function ReviewerAssignmentsPage() {
  const session = await getServerSession()

  if (!session) {
    redirect('/auth/login')
  }

  const reviews = await prisma.review.findMany({
    where: { reviewerId: session.uid },
    include: {
      submission: {
        include: {
          category: true,
          author: {
            select: { fullName: true, email: true, org: true },
          },
        },
      },
    },
    orderBy: { invitedAt: 'desc' },
  })

  const now = new Date()

  const pendingReviews = reviews
    .filter((r) => !r.submittedAt && !r.declinedAt)
    .map((r) => {
      const invitedAt = r.invitedAt ? new Date(r.invitedAt) : null
      const deadline = r.deadline ? new Date(r.deadline) : null
      const daysWaiting = invitedAt
        ? Math.floor((now.getTime() - invitedAt.getTime()) / 86_400_000)
        : 0
      const daysLeft = deadline
        ? Math.floor((deadline.getTime() - now.getTime()) / 86_400_000)
        : null
      const isOverdue = deadline ? now > deadline : daysWaiting > 14

      return { ...r, daysWaiting, daysLeft, isOverdue, deadline }
    })
    .sort((a, b) => {
      // Quá hạn lên trước, rồi sort theo deadline gần nhất
      if (a.isOverdue && !b.isOverdue) return -1
      if (!a.isOverdue && b.isOverdue) return 1
      if (a.daysLeft !== null && b.daysLeft !== null) return a.daysLeft - b.daysLeft
      return b.daysWaiting - a.daysWaiting
    })

  const completedReviews = reviews
    .filter((r) => !!r.submittedAt)
    .sort((a, b) =>
      new Date(b.submittedAt!).getTime() - new Date(a.submittedAt!).getTime()
    )

  const overdueCount = pendingReviews.filter((r) => r.isOverdue).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand/5 via-background to-gold/5 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-5 shadow-lg border border-slate-200 dark:border-slate-700">
        <div>
          <h1 className="text-2xl font-bold text-brand dark:text-emerald-300">
            Bài được gán phản biện
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Quản lý tất cả bài viết được gán cho bạn
          </p>
        </div>
        {overdueCount > 0 && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-medium text-red-700">
              {overdueCount} bài quá hạn
            </span>
          </div>
        )}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: 'Đang chờ',
            value: pendingReviews.length,
            color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300',
            dot: 'bg-amber-400',
          },
          {
            label: 'Quá hạn',
            value: overdueCount,
            color: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300',
            dot: 'bg-red-500',
          },
          {
            label: 'Hoàn thành',
            value: completedReviews.length,
            color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300',
            dot: 'bg-emerald-500',
          },
          {
            label: 'Tổng cộng',
            value: reviews.length,
            color: 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
            dot: 'bg-slate-400',
          },
        ].map((stat, i) => (
          <div
            key={i}
            className={`rounded-xl p-4 flex items-center gap-3 border border-transparent shadow-sm ${stat.color}`}
          >
            <span className={`w-3 h-3 rounded-full flex-shrink-0 ${stat.dot}`} />
            <div>
              <p className="text-xs opacity-70">{stat.label}</p>
              <p className="text-xl font-bold">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm rounded-xl p-1">
          <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Chờ phản biện
            {pendingReviews.length > 0 && (
              <span className="ml-2 bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">
                {pendingReviews.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Đã hoàn thành
            {completedReviews.length > 0 && (
              <span className="ml-2 bg-emerald-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">
                {completedReviews.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <ReviewerAssignmentsPending reviews={pendingReviews as any} />
        </TabsContent>

        <TabsContent value="completed">
          <ReviewerAssignmentsCompleted reviews={completedReviews as any} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
