
import { getServerSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { FileText, Calendar, Tag, Shield, User, MessageSquare, CheckCircle, History, Download, PenLine } from 'lucide-react'
import { notFound } from 'next/navigation'
import { SubmissionStatusPipeline } from '@/components/dashboard/submission-status-pipeline'
import MessageChatbox from '@/components/dashboard/message-chatbox'
import { FilePreview } from '@/components/dashboard/file-preview'

interface PageProps {
  params: {
    id: string
  }
}

export default async function SubmissionDetailPage({ params }: PageProps) {
  const session = await getServerSession()
  
  if (!session) {
    redirect('/auth/login')
  }

  const submission = await prisma.submission.findUnique({
    where: {
      id: params.id
    },
    include: {
      category: true,
      author: {
        select: {
          id: true,
          fullName: true,
          email: true,
          org: true
        }
      },
      files: {
        orderBy: {
          createdAt: 'desc'
        }
      },
      reviews: {
        include: {
          reviewer: (session.role === 'SYSADMIN' || session.role === 'EIC' || session.role === 'SECTION_EDITOR' || session.role === 'MANAGING_EDITOR') ? {
            select: {
              fullName: true,
              email: true
            }
          } : false
        },
        orderBy: {
          submittedAt: 'desc'
        }
      },
      decisions: {
        include: {
          editor: {
            select: {
              fullName: true
            }
          }
        },
        orderBy: {
          decidedAt: 'desc'
        }
      },
      versions: {
        include: {
          responseFile: true
        },
        orderBy: {
          versionNo: 'desc'
        }
      },
      article: {
        include: {
          issue: {
            include: {
              volume: true
            }
          }
        }
      }
    }
  })

  if (!submission) {
    notFound()
  }

  // Check if user owns this submission
  if (submission.createdBy !== session.uid && session.role !== 'SYSADMIN' && session.role !== 'EIC') {
    redirect('/dashboard/author')
  }

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      'NEW': { label: 'Mới nộp', variant: 'default' },
      'DESK_REJECT': { label: 'Từ chối sơ bộ', variant: 'destructive' },
      'UNDER_REVIEW': { label: 'Đang phản biện', variant: 'secondary' },
      'REVISION': { label: 'Cần chỉnh sửa', variant: 'outline' },
      'ACCEPTED': { label: 'Chấp nhận', variant: 'success' },
      'REJECTED': { label: 'Từ chối', variant: 'destructive' },
      'IN_PRODUCTION': { label: 'Đang xuất bản', variant: 'secondary' },
      'PUBLISHED': { label: 'Đã xuất bản', variant: 'default' }
    }
    return statusMap[status] || { label: status, variant: 'default' }
  }

  const getRecommendationLabel = (rec: string) => {
    const labels: Record<string, { text: string; variant: any }> = {
      'ACCEPT': { text: 'Chấp nhận', variant: 'success' },
      'MINOR': { text: 'Sửa nhỏ', variant: 'secondary' },
      'MAJOR': { text: 'Sửa lớn', variant: 'outline' },
      'REJECT': { text: 'Từ chối', variant: 'destructive' }
    }
    return labels[rec] || { text: rec, variant: 'default' }
  }

  const status = getStatusLabel(submission.status)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">Chi tiết bài nộp</h1>
            <Badge variant={status.variant as any} className="text-sm">
              {status.label}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Mã bài: <strong>{submission.code}</strong>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Sửa bài: chỉ hiện khi bài mới nộp, chưa biên tập */}
          {submission.status === 'NEW' && (
            <Button variant="outline" asChild>
              <Link href={`/dashboard/author/submissions/${params.id}/edit`}>
                <PenLine className="w-4 h-4 mr-2" />
                Sửa bài
              </Link>
            </Button>
          )}
          {submission.status === 'REVISION' && (
            <Button asChild>
              <Link href={`/dashboard/author/revise/${params.id}`}>
                Nộp bản chỉnh sửa
              </Link>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href={`/dashboard/submissions/${params.id}/versions`}>
              <History className="w-4 h-4 mr-2" />
              Lịch sử phiên bản
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/author/submissions">
              Quay lại danh sách
            </Link>
          </Button>
        </div>
      </div>

      {/* Pipeline Status */}
      <SubmissionStatusPipeline submissionId={params.id} />

      {/* Main Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{submission.title}</CardTitle>
          <CardDescription className="flex flex-wrap gap-4 mt-2">
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {submission.author.fullName}
            </span>
            {submission.author.org && (
              <span>• {submission.author.org}</span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Nộp: {new Date(submission.createdAt).toLocaleDateString('vi-VN')}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Category and Security */}
          <div className="flex flex-wrap gap-4">
            {submission.category && (
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Chuyên mục:</span>
                <Badge>{submission.category.name}</Badge>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Bảo mật:</span>
              <Badge variant="outline">{submission.securityLevel}</Badge>
            </div>
          </div>

          <Separator />

          {/* Abstract Vietnamese */}
          {submission.abstractVn && (
            <div>
              <h4 className="font-semibold mb-2">Tóm tắt (Tiếng Việt)</h4>
              <p className="text-sm text-muted-foreground">{submission.abstractVn}</p>
            </div>
          )}

          {/* Abstract English */}
          {submission.abstractEn && (
            <div>
              <h4 className="font-semibold mb-2">Abstract (English)</h4>
              <p className="text-sm text-muted-foreground">{submission.abstractEn}</p>
            </div>
          )}

          {/* Keywords */}
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

      {/* File Viewer — PDF / DOCX (render inline) / ảnh đều xem trực tiếp.
          Bản thảo mới nhất hiển thị đầy đủ; các bản cũ là link tải. */}
      {(() => {
        const manuscriptFiles = submission.files.filter((f) => f.fileType === 'MANUSCRIPT')
        if (manuscriptFiles.length === 0) {
          return (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
                <FileText className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm font-medium">Chưa có file bản thảo</p>
                <p className="max-w-sm text-xs text-muted-foreground">
                  Bài nộp này chưa có file bản thảo (PDF/DOCX) để xem trước.
                </p>
              </CardContent>
            </Card>
          )
        }
        const [latest, ...older] = manuscriptFiles
        return (
          <div className="space-y-4">
            <FilePreview
              url={`/api/files/${latest.id}/content`}
              fileName={latest.originalName}
              mimeType={latest.mimeType}
              title="Bản thảo (mới nhất)"
              height="700px"
            />
            {older.length > 0 && (
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Các bản thảo trước ({older.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {older.map((file) => (
                      <div key={file.id} className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{file.originalName}</p>
                          {file.description && (
                            <p className="text-xs text-muted-foreground">{file.description}</p>
                          )}
                        </div>
                        <Button asChild variant="outline" size="sm">
                          <a href={`/api/files/${file.id}/content`} download={file.originalName}>
                            <Download className="mr-1 h-4 w-4" />
                            Tải xuống
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )
      })()}

      {/* Tài liệu đính kèm khác (thư trả lời phản biện, phụ lục...) */}
      {submission.files.filter((f) => f.fileType === 'REVIEW_ATTACHMENT' || f.fileType === 'SUPPLEMENTARY').length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5 text-brand" />
              Tài liệu đính kèm
            </CardTitle>
            <CardDescription>Thư trả lời phản biện và tài liệu bổ sung của tác giả</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {submission.files
                .filter((f) => f.fileType === 'REVIEW_ATTACHMENT' || f.fileType === 'SUPPLEMENTARY')
                .map((file) => {
                  const isImage = file.mimeType?.startsWith('image/')
                  return (
                    <div key={file.id} className="rounded-lg border bg-muted/30 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{file.originalName}</p>
                          {file.description && (
                            <p className="text-xs text-muted-foreground">{file.description}</p>
                          )}
                        </div>
                        <Button asChild variant="outline" size="sm">
                          <a href={`/api/files/${file.id}/content`} download={file.originalName}>
                            <Download className="h-4 w-4 mr-1" />
                            Tải xuống
                          </a>
                        </Button>
                      </div>
                      {isImage && (
                        <a
                          href={`/api/files/${file.id}/content`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 block"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`/api/files/${file.id}/content`}
                            alt={file.originalName}
                            className="max-h-72 w-auto rounded-md border object-contain"
                          />
                        </a>
                      )}
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews */}
      {submission.reviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Phản biện ({submission.reviews.length})
            </CardTitle>
            <CardDescription>
              Kết quả phản biện từ các chuyên gia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {submission.reviews.map((review, index) => {
                const rec = review.recommendation ? getRecommendationLabel(review.recommendation) : null

                return (
                  <div key={review.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h5 className="font-semibold">Phản biện #{index + 1} - Vòng {review.roundNo}</h5>
                        {review.reviewer ? (
                          <p className="text-sm text-muted-foreground">
                            Phản biện viên: {review.reviewer.fullName}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">
                            [Ẩn danh theo nguyên tắc phản biện kín]
                          </p>
                        )}
                      </div>
                      {rec && (
                        <Badge variant={rec.variant as any}>
                          {rec.text}
                        </Badge>
                      )}
                    </div>

                    {review.submittedAt ? (
                      <div className="space-y-2">
                        {review.score && (
                          <p className="text-sm">
                            <strong>Điểm:</strong> {review.score}/100
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          Hoàn thành: {new Date(review.submittedAt).toLocaleDateString('vi-VN')}
                        </p>
                        {review.formJson && (
                          <div className="mt-3 p-3 bg-muted rounded">
                            <p className="text-sm font-medium mb-2">Nhận xét:</p>
                            <pre className="text-xs whitespace-pre-wrap">
                              {JSON.stringify(review.formJson, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        Đang chờ phản biện...
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Editor Decisions */}
      {submission.decisions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Quyết định biên tập ({submission.decisions.length})
            </CardTitle>
            <CardDescription>
              Các quyết định từ biên tập viên
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {submission.decisions.map((decision, index) => {
                const getDecisionLabel = (dec: string) => {
                  const labels: Record<string, { text: string; variant: any }> = {
                    'ACCEPT': { text: 'Chấp nhận', variant: 'success' },
                    'MINOR': { text: 'Sửa nhỏ', variant: 'secondary' },
                    'MAJOR': { text: 'Sửa lớn', variant: 'outline' },
                    'REJECT': { text: 'Từ chối', variant: 'destructive' }
                  }
                  return labels[dec] || { text: dec, variant: 'default' }
                }

                const decLabel = getDecisionLabel(decision.decision)

                return (
                  <div key={decision.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h5 className="font-semibold">Quyết định vòng {decision.roundNo}</h5>
                        <p className="text-sm text-muted-foreground">
                          Biên tập: {decision.editor.fullName}
                        </p>
                      </div>
                      <Badge variant={decLabel.variant as any}>
                        {decLabel.text}
                      </Badge>
                    </div>

                    {decision.note && (
                      <div className="mt-3 p-3 bg-muted rounded">
                        <p className="text-sm font-medium mb-2">Ghi chú:</p>
                        <p className="text-sm">{decision.note}</p>
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

      {/* Article Info (if published) */}
      {submission.article && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-900">Đã xuất bản</CardTitle>
            <CardDescription className="text-green-700">
              Bài viết của bạn đã được xuất bản
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {submission.article.issue && (
                <p>
                  <strong>Số tạp chí:</strong> Tập {submission.article.issue.volume?.volumeNo || submission.article.issue.year}, Số {submission.article.issue.number} ({submission.article.issue.year})
                </p>
              )}
              {submission.article.pages && (
                <p><strong>Trang:</strong> {submission.article.pages}</p>
              )}
              {submission.article.doiLocal && (
                <p><strong>DOI:</strong> {submission.article.doiLocal}</p>
              )}
              {submission.article.publishedAt && (
                <p>
                  <strong>Ngày xuất bản:</strong> {new Date(submission.article.publishedAt).toLocaleDateString('vi-VN')}
                </p>
              )}
              <div className="pt-3">
                <Button asChild>
                  <Link href={`/articles/${submission.article.id}`}>
                    Xem bài đã xuất bản
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Author-Editor Messaging */}
      <MessageChatbox 
        submissionId={params.id}
        authorId={submission.author.id}
        authorName={submission.author.fullName}
        submissionTitle={submission.title}
        currentUserId={session.uid}
      />

      {/* Versions */}
      {submission.versions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Lịch sử phiên bản ({submission.versions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {submission.versions.map((version) => (
                <div key={version.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-brand/40 text-brand">
                          Phiên bản {version.versionNo}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(version.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      {version.changelog && (
                        <p className="text-sm text-muted-foreground mt-2">
                          <span className="font-medium text-foreground">Thay đổi: </span>
                          {version.changelog}
                        </p>
                      )}
                      {version.coverLetter && (
                        <p className="text-sm text-muted-foreground mt-1">
                          <span className="font-medium text-foreground">Thư ngỏ: </span>
                          {version.coverLetter}
                        </p>
                      )}
                    </div>
                    {version.responseFile && (
                      <Button asChild variant="outline" size="sm" className="flex-shrink-0">
                        <a
                          href={`/api/files/${version.responseFile.id}/content`}
                          download={version.responseFile.originalName}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Thư phản hồi
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
