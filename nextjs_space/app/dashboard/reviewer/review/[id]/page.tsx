
import { getServerSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { FileText, Calendar, Tag, User, Clock, AlertTriangle, History, MessageSquareReply } from 'lucide-react'
import { notFound } from 'next/navigation'
import ReviewForm from '@/components/dashboard/review-form'
import { PDFViewerClient } from './pdf-viewer-client'
import ReviewInviteActions from '@/components/dashboard/review-invite-actions'
import {
  getReviewStateConfig,
  canEditReview,
  isReviewOverdue,
  getDaysUntilDeadline,
  getRecommendationConfig,
} from '@/lib/review-status'

interface PageProps {
  params: {
    id: string
  }
}

export default async function ReviewPage({ params }: PageProps) {
  const session = await getServerSession()

  if (!session) {
    redirect('/auth/login')
  }

  const review = await prisma.review.findUnique({
    where: {
      id: params.id,
    },
    include: {
      submission: {
        include: {
          category: true,
          // ❌ Không bao gồm thông tin author để đảm bảo double-blind review
          files: {
            orderBy: {
              createdAt: 'desc',
            },
          },
          versions: {
            orderBy: {
              versionNo: 'desc',
            },
            take: 1,
            include: {
              responseFile: { select: { id: true, originalName: true } },
            },
          },
        },
      },
      reviewer: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  })

  if (!review) {
    notFound()
  }

  // Check if user is the assigned reviewer
  if (review.reviewerId !== session.uid && session.role !== 'SYSADMIN' && session.role !== 'EIC') {
    redirect('/dashboard/reviewer')
  }

  const submission = review.submission

  // Quyết định biên tập cho vòng này (gate quyền sửa: sửa được tới khi có quyết định)
  const decision = await prisma.editorDecision.findFirst({
    where: { submissionId: review.submissionId, roundNo: review.roundNo },
    select: { id: true },
  })
  const hasDecision = !!decision
  const canEdit = canEditReview(review, hasDecision)
  const stateConfig = getReviewStateConfig(review, hasDecision)
  const StateIcon = stateConfig.icon
  const overdue = isReviewOverdue(review)
  const daysLeft = getDaysUntilDeadline(review)

  // Lời mời chưa được phản hồi (chưa đồng ý / chưa từ chối / chưa nộp) → hiện banner
  const needsInviteResponse = !review.submittedAt && !review.acceptedAt && !review.declinedAt

  // Vòng > 1: lấy ngữ cảnh chỉnh sửa cho reviewer (bài phản biện vòng trước của
  // chính họ + thư phản hồi / changelog của tác giả) để đánh giá đúng phần đã sửa.
  const priorReviews =
    review.roundNo > 1
      ? await prisma.review.findMany({
          where: {
            submissionId: review.submissionId,
            reviewerId: review.reviewerId,
            roundNo: { lt: review.roundNo },
            submittedAt: { not: null },
          },
          orderBy: { roundNo: 'desc' },
          select: { id: true, roundNo: true, score: true, recommendation: true, formJson: true },
        })
      : []
  const latestVersion = submission.versions?.[0]
  const showRevisionContext =
    review.roundNo > 1 && (priorReviews.length > 0 || !!latestVersion)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Phản biện bài viết</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Vòng {review.roundNo}</Badge>
            <Badge variant="outline" className={stateConfig.badgeClass}>
              <StateIcon className="mr-1 h-3.5 w-3.5" />
              {stateConfig.label}
            </Badge>
            {review.deadline && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Hạn: {new Date(review.deadline).toLocaleDateString('vi-VN')}
              </span>
            )}
            {overdue ? (
              <Badge variant="outline" className="border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                Quá hạn
              </Badge>
            ) : (
              daysLeft != null && !review.submittedAt && (
                <span className="text-sm text-muted-foreground">· còn {daysLeft} ngày</span>
              )
            )}
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/reviewer">Quay lại dashboard</Link>
        </Button>
      </div>

      {/* Banner lời mời — Đồng ý / Từ chối */}
      {needsInviteResponse && (
        <Card className="border-brand/30 bg-brand/5">
          <CardHeader>
            <CardTitle className="text-lg">Lời mời phản biện</CardTitle>
            <CardDescription>
              Bạn được mời phản biện bài viết này{review.deadline ? ` (hạn ${new Date(review.deadline).toLocaleDateString('vi-VN')})` : ''}.
              Vui lòng xác nhận để biên tập theo dõi tiến độ.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReviewInviteActions reviewId={review.id} />
          </CardContent>
        </Card>
      )}

      {/* Đã từ chối */}
      {review.declinedAt && (
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40">
          <CardContent className="flex items-center gap-3 py-4 text-sm text-red-800 dark:text-red-300">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            Bạn đã từ chối lời mời phản biện này vào {new Date(review.declinedAt).toLocaleDateString('vi-VN')}.
          </CardContent>
        </Card>
      )}

      {/* Submission Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{submission.title}</CardTitle>
          <CardDescription className="flex flex-wrap gap-4 mt-2">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Nộp: {new Date(submission.createdAt).toLocaleDateString('vi-VN')}
            </span>
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              [Ẩn danh theo nguyên tắc phản biện kín]
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {submission.category && (
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Chuyên mục:</span>
              <Badge>{submission.category.name}</Badge>
            </div>
          )}

          <Separator />

          {submission.abstractVn && (
            <div>
              <h4 className="font-semibold mb-2">Tóm tắt (Tiếng Việt)</h4>
              <p className="text-sm text-muted-foreground">{submission.abstractVn}</p>
            </div>
          )}

          {submission.abstractEn && (
            <div>
              <h4 className="font-semibold mb-2">Abstract (English)</h4>
              <p className="text-sm text-muted-foreground">{submission.abstractEn}</p>
            </div>
          )}

          {submission.keywords && submission.keywords.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Từ khóa</h4>
              <div className="flex flex-wrap gap-2">
                {submission.keywords.map((keyword, index) => (
                  <Badge key={index} variant="secondary">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ngữ cảnh chỉnh sửa (Vòng > 1) */}
      {showRevisionContext && (
        <Card className="border-gold/40 bg-gold/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="h-5 w-5 text-gold" />
              Ngữ cảnh chỉnh sửa (Vòng {review.roundNo})
            </CardTitle>
            <CardDescription>
              Tác giả đã nộp bản chỉnh sửa. Đối chiếu với phản biện vòng trước của bạn để đánh giá phần đã sửa.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {latestVersion && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Bản chỉnh sửa v{latestVersion.versionNo}</Badge>
                  {latestVersion.responseFile && (
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={`/api/files/${latestVersion.responseFile.id}/content`}
                        download={latestVersion.responseFile.originalName}
                      >
                        <MessageSquareReply className="mr-2 h-4 w-4" />
                        Tải thư phản hồi phản biện
                      </a>
                    </Button>
                  )}
                </div>
                {latestVersion.changelog && (
                  <div>
                    <h4 className="text-sm font-semibold">Tóm tắt thay đổi</h4>
                    <p className="whitespace-pre-line text-sm text-muted-foreground">{latestVersion.changelog}</p>
                  </div>
                )}
                {latestVersion.coverLetter && (
                  <div>
                    <h4 className="text-sm font-semibold">Thư ngỏ của tác giả</h4>
                    <p className="whitespace-pre-line text-sm text-muted-foreground">{latestVersion.coverLetter}</p>
                  </div>
                )}
              </div>
            )}

            {priorReviews.length > 0 && (
              <div className="space-y-3">
                <Separator />
                <h4 className="text-sm font-semibold">Phản biện vòng trước của bạn</h4>
                {priorReviews.map((pr) => {
                  const rec = getRecommendationConfig(pr.recommendation)
                  const prComments = (pr.formJson as any)?.comments as string | undefined
                  return (
                    <div key={pr.id} className="rounded-lg border bg-background p-3">
                      <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
                        <Badge variant="secondary">Vòng {pr.roundNo}</Badge>
                        <Badge variant="outline" className={rec.badgeClass}>{rec.label}</Badge>
                        {pr.score != null && <span className="text-muted-foreground">Điểm: {pr.score}/100</span>}
                      </div>
                      {prComments && (
                        <p className="whitespace-pre-line text-sm text-muted-foreground">{prComments}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* PDF Viewer Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Nội dung bài báo
          </CardTitle>
          <CardDescription>Xem toàn văn bản thảo để thực hiện phản biện</CardDescription>
        </CardHeader>
        <CardContent>
          {submission.files && submission.files.length > 0 ? (
            <div className="space-y-6">
              {submission.files
                .filter((file) => file.mimeType?.includes('pdf'))
                .map((file) => (
                  <PDFViewerClient key={file.id} fileId={file.id} fileName={file.originalName} />
                ))}
              {submission.files.filter((file) => file.mimeType?.includes('pdf')).length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-16 w-16 text-muted-foreground/40 mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">Không có file PDF</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Bài báo này chưa có file PDF nào được tải lên. Vui lòng liên hệ với biên tập viên.
                  </p>
                  <div className="mt-4 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
                    <p className="font-mono">Các file có sẵn: {submission.files.map((f) => f.originalName).join(', ')}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-16 w-16 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">Chưa có tài liệu đính kèm</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Bài báo này chưa có file nào được tải lên. Vui lòng liên hệ với biên tập viên để được hỗ trợ.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Form */}
      <Card>
        <CardHeader>
          <CardTitle>Biểu mẫu phản biện</CardTitle>
          <CardDescription>
            {review.submittedAt
              ? `Đã nộp vào ${new Date(review.submittedAt).toLocaleDateString('vi-VN')}${canEdit ? ' · còn có thể chỉnh sửa' : ''}`
              : 'Vui lòng điền đầy đủ thông tin phản biện. Bạn có thể Lưu nháp để hoàn thiện sau.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReviewForm review={review} canEdit={canEdit} />
        </CardContent>
      </Card>

      {/* Review Guidelines */}
      {!review.submittedAt && (
        <Card className="bg-sky-50 border-sky-200 dark:bg-sky-950/40 dark:border-sky-900">
          <CardHeader>
            <CardTitle className="text-sky-900 dark:text-sky-200">Hướng dẫn phản biện</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-sky-800 dark:text-sky-300 space-y-2">
            <p>• <strong>Tính mới và độc đáo:</strong> Bài viết có đóng góp mới cho lĩnh vực không?</p>
            <p>• <strong>Phương pháp nghiên cứu:</strong> Phương pháp có phù hợp và chặt chẽ không?</p>
            <p>• <strong>Kết quả và phân tích:</strong> Kết quả có rõ ràng, chính xác không?</p>
            <p>• <strong>Trình bày:</strong> Bài viết có cấu trúc tốt, dễ hiểu không?</p>
            <p>• <strong>Tài liệu tham khảo:</strong> Trích dẫn có đầy đủ và phù hợp không?</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
