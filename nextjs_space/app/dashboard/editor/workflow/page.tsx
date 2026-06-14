import { getServerSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import StatCard from '@/components/dashboard/stat-card';
import WorkflowPipelineBar from '@/components/dashboard/workflow-pipeline-bar';
import WorkflowDeadlineTabs from '@/components/dashboard/workflow-deadline-tabs';
import { Clock, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const TERMINAL_STATUSES = ['PUBLISHED', 'REJECTED', 'DESK_REJECT'] as const;

// Palette khớp SSOT lib/submission-status.ts (đồng bộ với Kanban dashboard biên tập)
const PIPELINE_STAGE_CONFIG = [
  { status: 'NEW', label: 'Bài mới', colorClass: 'border-sky-300 bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300', href: '/dashboard/editor/submissions?status=NEW' },
  { status: 'UNDER_REVIEW', label: 'Đang phản biện', colorClass: 'border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300', href: '/dashboard/editor/submissions?status=UNDER_REVIEW' },
  { status: 'REVISION', label: 'Đang chỉnh sửa', colorClass: 'border-gold/50 bg-gold/10 text-yellow-800 dark:text-gold', href: '/dashboard/editor/submissions?status=REVISION' },
  { status: 'ACCEPTED', label: 'Đã chấp nhận', colorClass: 'border-brand/40 bg-brand/10 text-brand dark:text-emerald-300', href: '/dashboard/editor/submissions?status=ACCEPTED' },
  { status: 'IN_PRODUCTION', label: 'Dàn trang', colorClass: 'border-violet-300 bg-violet-50 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300', href: '/dashboard/editor/submissions?status=IN_PRODUCTION' },
];

export default async function EditorWorkflowPage() {
  const session = await getServerSession();

  if (!session) {
    redirect('/auth/login');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.email },
    select: { id: true }
  });

  if (!user) {
    redirect('/auth/login');
  }

  const now = new Date();
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Parallel queries: DB aggregate stats + pipeline counts + deadline lists
  const [
    totalActive,
    totalOverdue,
    totalUpcoming,
    totalCompleted,
    submissionGroupCounts,
    allDeadlines,
    myDeadlines,
    overdueSubmissions,
  ] = await Promise.all([
    prisma.deadline.count({
      where: {
        completedAt: null,
        submission: { status: { notIn: [...TERMINAL_STATUSES] } },
      },
    }),
    prisma.deadline.count({
      where: {
        isOverdue: true,
        completedAt: null,
        submission: { status: { notIn: [...TERMINAL_STATUSES] } },
      },
    }),
    prisma.deadline.count({
      where: {
        completedAt: null,
        dueDate: { gt: now, lte: sevenDaysLater },
        submission: { status: { notIn: [...TERMINAL_STATUSES] } },
      },
    }),
    prisma.deadline.count({
      where: {
        completedAt: { not: null },
      },
    }),
    prisma.submission.groupBy({
      by: ['status'],
      where: { status: { notIn: [...TERMINAL_STATUSES] } },
      _count: { status: true },
    }),
    prisma.deadline.findMany({
      where: {
        submission: { status: { notIn: [...TERMINAL_STATUSES] } },
      },
      include: {
        submission: {
          select: { id: true, code: true, title: true, status: true },
        },
        assignedUser: {
          select: { fullName: true, email: true },
        },
      },
      orderBy: { dueDate: 'asc' },
      take: 200,
    }),
    prisma.deadline.findMany({
      where: {
        assignedTo: user.id,
        completedAt: null,
      },
      include: {
        submission: {
          select: { id: true, code: true, title: true, status: true },
        },
        assignedUser: {
          select: { fullName: true, email: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    }),
    prisma.submission.findMany({
      where: {
        isOverdue: true,
        status: { notIn: [...TERMINAL_STATUSES] },
      },
      include: {
        author: { select: { fullName: true, email: true } },
        category: true,
      },
      orderBy: { lastStatusChangeAt: 'asc' },
      take: 10,
    }),
  ]);

  // Compute deadline sub-lists from allDeadlines (avoid extra DB calls)
  const overdueDeadlines = allDeadlines.filter((d) => d.isOverdue && !d.completedAt);
  const upcomingDeadlines = allDeadlines.filter((d) => {
    const due = new Date(d.dueDate);
    return due > now && due <= sevenDaysLater && !d.completedAt;
  });

  // Build pipeline stages with counts
  const statusCountMap = Object.fromEntries(
    submissionGroupCounts.map((g) => [g.status, g._count.status])
  );
  const pipelineStages = PIPELINE_STAGE_CONFIG.map((cfg) => ({
    ...cfg,
    count: statusCountMap[cfg.status] ?? 0,
  }));

  // Serialize dates for Client Component boundary
  function serializeDeadline(d: typeof allDeadlines[number]) {
    return {
      id: d.id,
      type: d.type,
      dueDate: d.dueDate.toISOString(),
      isOverdue: d.isOverdue,
      completedAt: d.completedAt?.toISOString() ?? null,
      submission: d.submission,
      assignedUser: d.assignedUser,
    };
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-brand dark:text-emerald-300">Quản lý Quy trình Xuất bản</h1>
          <p className="text-muted-foreground mt-1">
            Theo dõi tiến độ, deadline và pipeline xử lý bài viết
          </p>
        </div>
      </div>

      {/* Pipeline overview */}
      <WorkflowPipelineBar stages={pipelineStages} />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Deadline đang hoạt động"
          value={totalActive}
          icon={Clock}
          description="Chưa hoàn thành"
        />
        <StatCard
          title="Quá hạn"
          value={totalOverdue}
          icon={AlertTriangle}
          description="Cần xử lý ngay"
          variant="destructive"
        />
        <StatCard
          title="Sắp đến hạn"
          value={totalUpcoming}
          icon={TrendingUp}
          description="Trong 7 ngày tới"
          variant="warning"
        />
        <StatCard
          title="Đã hoàn thành"
          value={totalCompleted}
          icon={CheckCircle}
          description="Tổng số đã hoàn thành"
          variant="success"
        />
      </div>

      {/* Deadline tabs — Client Component */}
      <WorkflowDeadlineTabs
        overdueDeadlines={overdueDeadlines.map(serializeDeadline)}
        upcomingDeadlines={upcomingDeadlines.map(serializeDeadline)}
        myDeadlines={myDeadlines.map(serializeDeadline)}
        allDeadlines={allDeadlines.map(serializeDeadline)}
      />

      {/* Overdue submissions (SLA) */}
      {overdueSubmissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Bài viết quá hạn SLA</CardTitle>
            <CardDescription>
              Các bài viết đang quá thời gian xử lý tiêu chuẩn
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overdueSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <Link
                      href={`/dashboard/editor/submissions/${submission.id}`}
                      className="font-medium hover:underline"
                    >
                      {submission.title}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      Mã: {submission.code} • Tác giả: {submission.author.fullName}
                    </p>
                    <p className="text-sm text-destructive">
                      Quá hạn {submission.daysInCurrentStatus} ngày ở trạng thái {submission.status}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/editor/submissions/${submission.id}`}>
                      Xem chi tiết
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
