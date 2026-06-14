import { getServerSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { FileText, Calendar, Tag, Shield, User, MessageSquare, CheckCircle, UserPlus, History, Download, Clock, Gavel, FileEdit } from 'lucide-react'
import { notFound } from 'next/navigation'
import EditorDecisionForm from '@/components/dashboard/editor-decision-form'
import WorkflowTimeline from '@/components/dashboard/workflow-timeline'
import WorkflowActions from '@/components/dashboard/workflow-actions'
import RevisionWaitingActions from '@/components/dashboard/revision-waiting-actions'
import { PDFViewerWithFeedback } from '@/components/pdf-viewer-with-feedback'
import { PlagiarismChecker } from '@/components/dashboard/plagiarism-checker'
import { ReviewerSuggestionPanel } from '@/components/dashboard/reviewer-suggestion-panel'
import { getSubmissionStatusConfig } from '@/lib/submission-status'
import { canEditorAccessSubmission } from '@/lib/editor-scope'

interface PageProps {
  params: { id: string }
}

/** Trạng thái có hành động chuyển-giai-đoạn (stage) cho biên tập (ngoài quyết định). */
const STAGE_ACTION_STATUSES = ['NEW', 'ACCEPTED', 'IN_PRODUCTION']

const RECOMMENDATION_LABEL: Record<string, { text: string; variant: string }> = {
  ACCEPT: { text: 'Chấp nhận', variant: 'success' },
  MINOR: { text: 'Sửa nhỏ', variant: 'secondary' },
  MAJOR: { text: 'Sửa lớn', variant: 'outline' },
  REJECT: { text: 'Từ chối', variant: 'destructive' },
}

export default async function EditorSubmissionDetailPage({ params }: PageProps) {
  const session = await getServerSession()
  if (!session) redirect('/auth/login')

  const submission = await prisma.submission.findUnique({
    where: { id: params.id },
    include: {
      category: true,
      author: { select: { id: true, fullName: true, email: true, org: true } },
      assignedEditor: { select: { fullName: true } },
      files: { orderBy: { createdAt: 'desc' } },
      reviews: {
        include: { reviewer: { select: { fullName: true, email: true } } },
        orderBy: { submittedAt: 'desc' },
      },
      decisions: {
        include: { editor: { select: { fullName: true } } },
        orderBy: { decidedAt: 'desc' },
      },
      versions: { orderBy: { versionNo: 'desc' } },
    },
  })

  if (!submission) notFound()

  // Scope chuyên mục: BTV chuyên mục chỉ mở bài được phân công cho mình.
  if (!canEditorAccessSubmission(session.role, session.uid, submission.assignedEditorId)) {
    redirect('/dashboard/editor/submissions')
  }

  const statusCfg = getSubmissionStatusConfig(submission.status)
  const StatusIcon = statusCfg.icon

  const completedReviews = submission.reviews.filter(r => r.submittedAt)
  const pendingReviews = submission.reviews.filter(r => !r.submittedAt)
  const allReviewsCompleted = submission.reviews.length > 0 && pendingReviews.length === 0

  // Quyết định biên tập chỉ hiện khi bài ĐANG phản biện và mọi phản biện đã xong.
  const showDecisionForm = submission.status === 'UNDER_REVIEW' && allReviewsCompleted
  const isWaitingRevision = submission.status === 'REVISION'

  const maxRound = submission.reviews.length > 0
    ? Math.max(...submission.reviews.map(r => r.roundNo))
    : 1

  const currentUser = await prisma.user.findUnique({ where: { email: session.email } })
  const hasStageActions = STAGE_ACTION_STATUSES.includes(submission.status)

  // Vai trò biên tập được ghi nhận xét nội bộ trực tiếp trên bản thảo PDF
  const EDITORIAL_ROLES = ['SECTION_EDITOR', 'MANAGING_EDITOR', 'DEPUTY_EIC', 'EIC', 'LAYOUT_EDITOR', 'SYSADMIN', 'SECURITY_AUDITOR']
  const canAnnotate = !!currentUser && EDITORIAL_ROLES.includes(currentUser.role)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-brand dark:text-emerald-300">Chi tiết bài nộp</h1>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-sm font-medium ${statusCfg.badgeClass}`}>
              <StatusIcon className="h-3.5 w-3.5" />
              {statusCfg.label}
            </span>
          </div>
          <p className="text-muted-foreground">
            Mã bài: <strong className="font-mono">{submission.code}</strong> · {statusCfg.description}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">
            Biên tập phụ trách:{' '}
            {submission.assignedEditor ? (
              <span className="font-medium text-brand dark:text-emerald-400">{submission.assignedEditor.fullName}</span>
            ) : (
              <span className="text-amber-700 dark:text-amber-400">Chưa phân công</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/editor/submissions">Quay lại</Link>
          </Button>
          {submission.status === 'NEW' && (
            <Button asChild>
              <Link href={`/dashboard/editor/assign-reviewers?submissionId=${submission.id}`}>
                <UserPlus className="mr-2 h-4 w-4" />
                Gán phản biện
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Workflow stage actions — chỉ hiện khi có hành động chuyển giai đoạn */}
      {currentUser && hasStageActions && (
        <Card className="border-brand/20 bg-brand/[0.03]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-brand">
              <Clock className="h-5 w-5" />
              Chuyển giai đoạn
            </CardTitle>
            <CardDescription>Các bước chuyển trạng thái có thể thực hiện với bài viết này</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <WorkflowActions
              submissionId={submission.id}
              currentStatus={submission.status}
              userRole={currentUser.role}
            />
            <Separator />
            <Link href={`/dashboard/submissions/${submission.id}/versions`}>
              <Button variant="outline" className="w-full sm:w-auto">
                <History className="w-4 h-4 mr-2" />
                Xem lịch sử phiên bản
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Main Information */}
      <Card className="overflow-hidden">
        <div className="h-1.5 bg-brand" />
        <CardHeader>
          <CardTitle className="text-2xl">{submission.title}</CardTitle>
          <CardDescription className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            <span className="flex items-center gap-1"><User className="h-4 w-4" />{submission.author.fullName}</span>
            {submission.author.org && <span>• {submission.author.org}</span>}
            <span>• {submission.author.email}</span>
            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />Nộp: {new Date(submission.createdAt).toLocaleDateString('vi-VN')}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            {submission.category && (
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Chuyên mục:</span>
                <Badge variant="secondary">{submission.category.name}</Badge>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Bảo mật:</span>
              <Badge variant="outline">{submission.securityLevel}</Badge>
            </div>
          </div>

          <Separator />

          {submission.abstractVn && (
            <div>
              <h4 className="font-semibold mb-2">Tóm tắt (Tiếng Việt)</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{submission.abstractVn}</p>
            </div>
          )}
          {submission.abstractEn && (
            <div>
              <h4 className="font-semibold mb-2">Abstract (English)</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{submission.abstractEn}</p>
            </div>
          )}
          {submission.keywords && submission.keywords.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Từ khóa</h4>
              <div className="flex flex-wrap gap-2">
                {submission.keywords.map((keyword, index) => (
                  <Badge key={index} variant="secondary">{keyword}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* File Viewer Section — PDF inline, Word as download */}
      {submission.files && submission.files.length > 0 && (
        <div className="space-y-4">
          {submission.files
            .filter((file) => file.fileType === 'MANUSCRIPT')
            .map((file) => {
              const isPdf = file.mimeType?.includes('pdf')
              const isWord =
                file.mimeType?.includes('msword') ||
                file.mimeType?.includes('wordprocessingml')

              if (isPdf) {
                return (
                  <PDFViewerWithFeedback
                    key={file.id}
                    pdfUrl={`/api/files/${file.id}/content`}
                    submissionId={submission.id}
                    canComment={canAnnotate}
                    currentUser={currentUser ? { id: currentUser.id, fullName: currentUser.fullName } : undefined}
                  />
                )
              }

              if (isWord) {
                return (
                  <Card key={file.id} className="overflow-hidden">
                    <CardHeader className="bg-brand/5 border-b border-brand/15">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-brand" />
                          <div>
                            <CardTitle className="text-brand text-base">Bản thảo Word</CardTitle>
                            <p className="text-sm text-muted-foreground mt-0.5">{file.originalName}</p>
                          </div>
                        </div>
                        <Button asChild variant="outline">
                          <a href={`/api/files/${file.id}/content`} download={file.originalName}>
                            <Download className="h-4 w-4 mr-1" />
                            Tải xuống
                          </a>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="py-6 text-center text-muted-foreground text-sm">
                      File Word không thể xem trực tiếp trên trình duyệt. Vui lòng tải xuống để xem nội dung.
                    </CardContent>
                  </Card>
                )
              }
              return null
            })}
        </div>
      )}

      {/* Plagiarism Checker */}
      <PlagiarismChecker submissionId={submission.id} submissionCode={submission.code} />

      {/* Reviewers Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-brand" />
                Trạng thái phản biện ({completedReviews.length}/{submission.reviews.length})
              </CardTitle>
              <CardDescription>Vòng {maxRound}</CardDescription>
            </div>
            {submission.status !== 'NEW' && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/editor/assign-reviewers?submissionId=${submission.id}`}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Cập nhật phản biện
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!['ACCEPTED', 'REJECTED', 'IN_PRODUCTION', 'PUBLISHED'].includes(submission.status) && (
            <ReviewerSuggestionPanel submissionId={submission.id} />
          )}
          {submission.reviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>Chưa gán phản biện viên</p>
              <Button asChild className="mt-4">
                <Link href={`/dashboard/editor/assign-reviewers?submissionId=${submission.id}`}>
                  Gán phản biện viên
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {submission.reviews.map((review, index) => {
                const rec = review.recommendation ? RECOMMENDATION_LABEL[review.recommendation] : null
                return (
                  <div
                    key={review.id}
                    className={`rounded-lg border p-4 ${review.submittedAt ? 'border-brand/20 bg-brand/[0.04]' : 'border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-900'}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h5 className="font-semibold">Phản biện #{index + 1}</h5>
                        <p className="text-sm text-muted-foreground">
                          {review.reviewer.fullName} ({review.reviewer.email})
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {rec && <Badge variant={rec.variant as any}>{rec.text}</Badge>}
                        {review.submittedAt ? (
                          <Badge className="bg-brand text-white">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Đã hoàn thành
                          </Badge>
                        ) : (
                          <Badge variant="outline">Đang chờ</Badge>
                        )}
                      </div>
                    </div>

                    {review.submittedAt ? (
                      <div className="space-y-2">
                        {review.score && <p className="text-sm"><strong>Điểm:</strong> {review.score}/100</p>}
                        <p className="text-sm text-muted-foreground">
                          Hoàn thành: {new Date(review.submittedAt).toLocaleDateString('vi-VN')}
                        </p>
                        {review.formJson && (
                          <details className="mt-3">
                            <summary className="cursor-pointer text-sm font-medium mb-2">Xem chi tiết phản biện</summary>
                            <div className="space-y-3 mt-3 p-3 bg-background rounded border">
                              {Object.entries(review.formJson as any).map(([key, value]) => (
                                <div key={key}>
                                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">{key}</p>
                                  <p className="text-sm">{value as string}</p>
                                </div>
                              ))}
                            </div>
                          </details>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Đang chờ phản biện hoàn thành...</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Editor Decision Form — chỉ khi đang phản biện & đã đủ phản biện */}
      {showDecisionForm && (
        <Card className="border-brand/40 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-brand to-gold" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-brand">
              <Gavel className="h-5 w-5" />
              Đưa ra quyết định biên tập
            </CardTitle>
            <CardDescription>
              Tất cả phản biện đã hoàn thành. Vui lòng đưa ra quyết định cho bài viết này.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EditorDecisionForm
              submissionId={submission.id}
              roundNo={maxRound}
              reviews={completedReviews}
            />
          </CardContent>
        </Card>
      )}

      {/* Đang chờ tác giả nộp bản chỉnh sửa */}
      {isWaitingRevision && currentUser && (
        <Card className="border-gold/40 overflow-hidden">
          <div className="h-1.5 bg-gold" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-gold">
              <FileEdit className="h-5 w-5" />
              Đang chờ tác giả nộp bản chỉnh sửa
            </CardTitle>
            <CardDescription>
              Bài đã được yêu cầu chỉnh sửa. Khi tác giả nộp lại, bài sẽ tự chuyển về &ldquo;Đang phản biện&rdquo; để bạn tiếp tục xử lý.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RevisionWaitingActions submissionId={submission.id} roundNo={maxRound} />
          </CardContent>
        </Card>
      )}

      {/* Previous Decisions */}
      {submission.decisions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-brand" />
              Lịch sử quyết định ({submission.decisions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {submission.decisions.map((decision) => {
                const decLabel = RECOMMENDATION_LABEL[decision.decision] || { text: decision.decision, variant: 'default' }
                return (
                  <div key={decision.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h5 className="font-semibold">Quyết định vòng {decision.roundNo}</h5>
                        <p className="text-sm text-muted-foreground">Biên tập: {decision.editor.fullName}</p>
                      </div>
                      <Badge variant={decLabel.variant as any}>{decLabel.text}</Badge>
                    </div>
                    {decision.note && (
                      <div className="mt-3 p-3 bg-muted rounded">
                        <p className="text-sm font-medium mb-1">Ghi chú:</p>
                        <p className="text-sm whitespace-pre-line">{decision.note}</p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(decision.decidedAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workflow Timeline */}
      <WorkflowTimeline submissionId={submission.id} />
    </div>
  )
}
