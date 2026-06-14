import { getServerSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { notFound } from 'next/navigation'
import { AlertCircle, FileText, MessageSquare, ArrowLeft, UploadCloud, History, Download, ClipboardCheck } from 'lucide-react'
import Link from 'next/link'
import RevisionSubmissionForm from '@/components/dashboard/revision-submission-form'
import { FilePreview } from '@/components/dashboard/file-preview'

interface PageProps {
  params: { id: string }
}

/** Render formJson của phản biện thành cặp nhãn–giá trị dễ đọc thay vì JSON thô. */
function ReviewFormDetails({ formJson }: { formJson: unknown }) {
  if (!formJson || typeof formJson !== 'object') {
    return <p className="text-sm whitespace-pre-wrap">{String(formJson ?? '')}</p>
  }
  const entries = Object.entries(formJson as Record<string, unknown>)
  if (entries.length === 0) return null
  return (
    <div className="space-y-2">
      {entries.map(([key, value]) => (
        <div key={key}>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{key}</p>
          <p className="text-sm whitespace-pre-wrap">
            {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
          </p>
        </div>
      ))}
    </div>
  )
}

const RECOMMENDATION_LABELS: Record<string, { text: string; variant: string }> = {
  ACCEPT: { text: 'Chấp nhận', variant: 'success' },
  MINOR: { text: 'Sửa nhỏ', variant: 'secondary' },
  MAJOR: { text: 'Sửa lớn', variant: 'outline' },
  REJECT: { text: 'Từ chối', variant: 'destructive' },
}

export default async function ReviseSubmissionPage({ params }: PageProps) {
  const session = await getServerSession()
  if (!session) {
    redirect('/auth/login')
  }

  const submission = await prisma.submission.findUnique({
    where: { id: params.id },
    include: {
      category: true,
      author: { select: { fullName: true, email: true } },
      reviews: {
        where: { submittedAt: { not: null } },
        include: { reviewer: { select: { fullName: true } } },
        orderBy: { submittedAt: 'desc' },
      },
      decisions: {
        include: { editor: { select: { fullName: true } } },
        orderBy: { decidedAt: 'desc' },
      },
      versions: {
        include: { responseFile: true },
        orderBy: { versionNo: 'desc' },
      },
      files: {
        where: { fileType: 'MANUSCRIPT' },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!submission) {
    notFound()
  }
  if (submission.createdBy !== session.uid) {
    redirect('/dashboard/author')
  }

  // Guard trạng thái: chỉ cho nộp bản chỉnh sửa khi đang REVISION
  if (submission.status !== 'REVISION') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Nộp bản chỉnh sửa</h1>
          <p className="text-muted-foreground mt-1">
            Mã bài: <strong>{submission.code}</strong>
          </p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Bài viết này không yêu cầu chỉnh sửa. Trạng thái hiện tại: <strong>{submission.status}</strong>
          </AlertDescription>
        </Alert>
        <Button variant="outline" asChild>
          <Link href="/dashboard/author/submissions">Quay lại danh sách</Link>
        </Button>
      </div>
    )
  }

  const latestDecision = submission.decisions[0]
  const nextVersionNo = submission.versions.length + 1

  return (
    <div className="space-y-6">
      {/* Header — brand gradient */}
      <div className="rounded-2xl bg-gradient-to-r from-brand to-military-700 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gold">Tác giả · Chỉnh sửa</p>
            <h1 className="mt-1 text-2xl font-bold md:text-3xl">Nộp bản chỉnh sửa</h1>
            <p className="mt-1 text-sm text-white/80 line-clamp-1">
              {submission.title} · <strong>{submission.code}</strong>
            </p>
          </div>
          <Button variant="outline" asChild className="border-white/40 bg-white/10 text-white hover:bg-white/20">
            <Link href={`/dashboard/author/submissions/${params.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Xem bài gốc
            </Link>
          </Button>
        </div>
      </div>

      {/* Hành động cần làm — gold accent */}
      <Card className="border-gold/50 bg-gold/10">
        <CardContent className="flex items-start gap-3 py-4">
          <ClipboardCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-700 dark:text-gold" />
          <div className="text-sm">
            <p className="font-semibold text-yellow-900 dark:text-gold">
              Bài viết của bạn cần được chỉnh sửa theo yêu cầu phản biện
            </p>
            <p className="mt-0.5 text-yellow-800/90 dark:text-gold/80">
              Hãy đọc kỹ nhận xét bên dưới, cập nhật bản thảo, mô tả các thay đổi và (khuyến nghị) đính kèm thư trả lời phản biện.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Cột trái: bản thảo hiện tại + phản hồi của hội đồng */}
        <div className="space-y-6 lg:col-span-2">
          {/* Bản thảo hiện tại — để tác giả xem nội dung cần chỉnh sửa */}
          {submission.files.length > 0 ? (
            <FilePreview
              url={`/api/files/${submission.files[0].id}/content`}
              fileName={submission.files[0].originalName}
              mimeType={submission.files[0].mimeType}
              title="Bản thảo hiện tại (cần chỉnh sửa)"
              height="560px"
            />
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
                <FileText className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm font-medium">Chưa có file bản thảo</p>
                <p className="max-w-sm text-xs text-muted-foreground">
                  Bài này chưa có file bản thảo đính kèm để xem trước. Bạn vẫn có thể nộp bản chỉnh sửa ở khung bên phải.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Quyết định mới nhất của biên tập viên */}
          {latestDecision && (
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="h-5 w-5 text-brand" />
                  Yêu cầu chỉnh sửa từ Biên tập viên
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge variant="outline" className="border-brand/40 text-brand">
                    Vòng {latestDecision.roundNo}
                  </Badge>
                  <Badge variant={latestDecision.decision === 'MINOR' ? 'secondary' : 'outline'}>
                    {latestDecision.decision === 'MINOR' ? 'Sửa nhỏ' : 'Sửa lớn'}
                  </Badge>
                  <span className="text-muted-foreground">· {latestDecision.editor.fullName}</span>
                </div>
                {latestDecision.note && (
                  <div className="rounded-lg border bg-muted/40 p-3">
                    <p className="mb-1 text-sm font-medium">Ghi chú của biên tập viên</p>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">{latestDecision.note}</p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {new Date(latestDecision.decidedAt).toLocaleString('vi-VN', {
                    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Nhận xét phản biện */}
          {submission.reviews.length > 0 && (
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="h-5 w-5 text-brand" />
                  Nhận xét từ phản biện ({submission.reviews.length})
                </CardTitle>
                <CardDescription>Tham khảo các nhận xét sau để hoàn thiện bài viết</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {submission.reviews.map((review, index) => {
                  const rec = review.recommendation ? RECOMMENDATION_LABELS[review.recommendation] : null
                  return (
                    <div key={review.id} className="rounded-lg border p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <h5 className="font-semibold">Phản biện #{index + 1} · Vòng {review.roundNo}</h5>
                          {review.score != null && (
                            <p className="text-sm text-muted-foreground">Điểm: {review.score}/100</p>
                          )}
                        </div>
                        {rec && <Badge variant={rec.variant as any}>{rec.text}</Badge>}
                      </div>
                      {review.formJson ? (
                        <div className="mt-3 rounded-lg bg-muted/40 p-3">
                          <ReviewFormDetails formJson={review.formJson} />
                        </div>
                      ) : null}
                      <p className="mt-2 text-xs text-muted-foreground">
                        Hoàn thành: {review.submittedAt && new Date(review.submittedAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}

          {/* Lịch sử phiên bản */}
          {submission.versions.length > 0 && (
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-base">
                  <History className="h-5 w-5 text-brand" />
                  Lịch sử phiên bản ({submission.versions.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <ol className="relative space-y-4 border-l border-border pl-6">
                  {submission.versions.map((version) => (
                    <li key={version.id} className="relative">
                      <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-brand ring-4 ring-brand/15" />
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Phiên bản {version.versionNo}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(version.createdAt).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                          {version.changelog && (
                            <p className="mt-1 text-sm text-muted-foreground">{version.changelog}</p>
                          )}
                        </div>
                        {version.responseFile && (
                          <Button asChild variant="outline" size="sm" className="flex-shrink-0">
                            <a href={`/api/files/${version.responseFile.id}/content`} download={version.responseFile.originalName}>
                              <Download className="mr-1 h-4 w-4" />
                              Thư phản hồi
                            </a>
                          </Button>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Cột phải: form nộp (sticky) */}
        <div className="lg:col-span-1">
          <Card className="lg:sticky lg:top-6">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-base">
                <UploadCloud className="h-5 w-5 text-brand" />
                Nộp bản chỉnh sửa
              </CardTitle>
              <CardDescription>
                Sẽ tạo <strong>phiên bản {nextVersionNo}</strong> và gửi lại cho biên tập viên
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <RevisionSubmissionForm submissionId={params.id} currentVersionNo={submission.versions.length} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
