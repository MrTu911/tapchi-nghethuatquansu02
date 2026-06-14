import { getServerSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { User, Tag, UserCheck, AlertCircle, Inbox } from 'lucide-react'
import { getSubmissionStatusConfig } from '@/lib/submission-status'
import AssignEditorControl from '@/components/dashboard/assign-editor-control'

const ALLOWED_ROLES = ['MANAGING_EDITOR', 'DEPUTY_EIC', 'EIC', 'SYSADMIN']
const ACTIVE_STATUSES = ['NEW', 'UNDER_REVIEW', 'REVISION'] as const

export default async function EditorAssignmentsPage() {
  const session = await getServerSession()
  if (!session) redirect('/auth/login')
  if (!ALLOWED_ROLES.includes(session.role)) redirect('/dashboard')

  const [submissions, editorsRaw] = await Promise.all([
    prisma.submission.findMany({
      where: { status: { in: [...ACTIVE_STATUSES] }, isArchived: false },
      include: {
        category: true,
        author: { select: { fullName: true } },
        assignedEditor: { select: { id: true, fullName: true } },
      },
      orderBy: [{ assignedEditorId: 'asc' }, { createdAt: 'desc' }],
    }),
    prisma.user.findMany({
      where: { role: { in: ['SECTION_EDITOR', 'MANAGING_EDITOR', 'DEPUTY_EIC', 'EIC'] }, isActive: true },
      select: {
        id: true,
        fullName: true,
        role: true,
        _count: { select: { assignedDeadlines: { where: { completedAt: null } } } },
      },
      orderBy: { fullName: 'asc' },
    }),
  ])

  const editors = editorsRaw.map((e) => ({
    id: e.id,
    fullName: e.fullName,
    role: e.role,
    currentWorkload: e._count.assignedDeadlines,
  }))

  const unassignedCount = submissions.filter((s) => !s.assignedEditorId).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-brand dark:text-emerald-300">Phân công biên tập</h1>
        <p className="text-muted-foreground mt-1">
          Thư ký tòa soạn phân bài đang xử lý cho biên tập viên phụ trách
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/30 dark:to-slate-900">
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Chưa phân công</p>
              <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">{unassignedCount}</p>
            </div>
            <AlertCircle className="h-9 w-9 text-amber-400" />
          </CardContent>
        </Card>
        <Card className="border-brand/30 bg-gradient-to-br from-brand/10 to-white dark:from-brand/20 dark:to-slate-900">
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-sm font-medium text-brand dark:text-emerald-300">Bài đang xử lý</p>
              <p className="text-3xl font-bold text-brand dark:text-emerald-300">{submissions.length}</p>
            </div>
            <Inbox className="h-9 w-9 text-brand/50" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Biên tập viên</p>
              <p className="text-3xl font-bold">{editors.length}</p>
            </div>
            <UserCheck className="h-9 w-9 text-muted-foreground/40" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách bài cần phân công</CardTitle>
          <CardDescription>Bài chưa có biên tập viên phụ trách hiển thị trước</CardDescription>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Inbox className="mx-auto mb-3 h-12 w-12 opacity-40" />
              <p>Không có bài nào đang xử lý</p>
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map((s) => {
                const statusCfg = getSubmissionStatusConfig(s.status)
                const StatusIcon = statusCfg.icon
                return (
                  <div
                    key={s.id}
                    className={`flex flex-col gap-3 rounded-xl border p-4 lg:flex-row lg:items-center lg:justify-between ${
                      s.assignedEditorId ? 'bg-card' : 'border-amber-300/60 bg-amber-50/40 dark:bg-amber-950/10'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/dashboard/editor/submissions/${s.id}`}
                          className="font-semibold hover:text-brand hover:underline line-clamp-1"
                        >
                          {s.title}
                        </Link>
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${statusCfg.badgeClass}`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusCfg.label}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                        <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-muted">{s.code}</span>
                        <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{s.author.fullName}</span>
                        <span className="flex items-center gap-1"><Tag className="h-3.5 w-3.5" />{s.category?.name || 'Chưa phân loại'}</span>
                        <span className="flex items-center gap-1">
                          <UserCheck className="h-3.5 w-3.5" />
                          {s.assignedEditor ? (
                            <span className="text-brand dark:text-emerald-400">{s.assignedEditor.fullName}</span>
                          ) : (
                            <span className="text-amber-700 dark:text-amber-400">Chưa phân công</span>
                          )}
                        </span>
                      </div>
                    </div>
                    <AssignEditorControl
                      submissionId={s.id}
                      editors={editors}
                      currentEditorId={s.assignedEditorId}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
