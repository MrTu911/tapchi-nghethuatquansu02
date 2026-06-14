import { getServerSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, User, Tag, Shield, Users, FileText } from 'lucide-react'
import AssignReviewersForm from '@/components/dashboard/assign-reviewers-form'
import { notFound } from 'next/navigation'
import { getSubmissionStatusConfig } from '@/lib/submission-status'
import { REVIEWER_ELIGIBLE_ROLES } from '@/lib/rbac'
import { canEditorAccessSubmission } from '@/lib/editor-scope'

interface PageProps {
  searchParams: { submissionId?: string }
}

export default async function AssignReviewersPage({ searchParams }: PageProps) {
  const session = await getServerSession()
  if (!session) redirect('/auth/login')

  const submissionId = searchParams.submissionId

  if (!submissionId) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-brand dark:text-emerald-300">Gán phản biện viên</h1>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground opacity-40" />
            <p className="text-muted-foreground">
              Vui lòng chọn một bài nộp từ danh sách để gán phản biện viên.
            </p>
            <Button asChild>
              <Link href="/dashboard/editor/submissions">Tới danh sách bài nộp</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      category: true,
      author: { select: { fullName: true, email: true, org: true } },
      reviews: {
        include: { reviewer: { select: { id: true, fullName: true, email: true } } },
      },
    },
  })

  if (!submission) notFound()

  // Scope chuyên mục: BTV chuyên mục chỉ gán phản biện cho bài được phân công.
  if (!canEditorAccessSubmission(session.role, session.uid, submission.assignedEditorId)) {
    redirect('/dashboard/editor/submissions')
  }

  const reviewers = await prisma.user.findMany({
    where: {
      role: { in: REVIEWER_ELIGIBLE_ROLES },
      isActive: true,
      id: { not: submission.createdBy }, // loại trừ tác giả (conflict of interest)
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      org: true,
      role: true,
      _count: { select: { reviews: true } },
    },
    orderBy: { fullName: 'asc' },
  })

  // Chỉ lấy phản biện viên của ĐÚNG vòng hiện tại (gắn với chu kỳ chỉnh sửa),
  // để thao tác thêm/bớt khớp với logic của API (tránh nhân đôi vòng).
  const currentRound = (submission.revisionRound ?? 0) + 1
  const currentReviewerIds = submission.reviews
    .filter(r => r.roundNo === currentRound)
    .map(r => r.reviewerId)
  const statusCfg = getSubmissionStatusConfig(submission.status)
  const StatusIcon = statusCfg.icon

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-brand dark:text-emerald-300">Gán phản biện viên</h1>
          <p className="text-muted-foreground mt-1">Chọn các phản biện viên phù hợp cho bài nộp</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/editor/submissions/${submission.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại bài nộp
          </Link>
        </Button>
      </div>

      {/* Submission Info */}
      <Card className="overflow-hidden">
        <div className="h-1.5 bg-brand" />
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle>{submission.title}</CardTitle>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${statusCfg.badgeClass}`}>
              <StatusIcon className="h-3 w-3" />
              {statusCfg.label}
            </span>
          </div>
          <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
            <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-muted">{submission.code}</span>
            <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{submission.author.fullName}</span>
            <span className="flex items-center gap-1"><Tag className="h-3.5 w-3.5" />{submission.category?.name || 'Chưa phân loại'}</span>
            <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5" />{submission.securityLevel}</span>
            <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />Đã gán: {currentReviewerIds.length}</span>
          </CardDescription>
        </CardHeader>
        {submission.abstractVn && (
          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-3">{submission.abstractVn}</p>
          </CardContent>
        )}
      </Card>

      {/* Assign Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-brand" />
            Chọn phản biện viên
          </CardTitle>
          <CardDescription>Nên chọn ít nhất 2 phản biện viên độc lập cho bài nộp này</CardDescription>
        </CardHeader>
        <CardContent>
          <AssignReviewersForm
            submission={submission}
            reviewers={reviewers}
            currentReviewerIds={currentReviewerIds}
          />
        </CardContent>
      </Card>
    </div>
  )
}
