import { getServerSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, ArrowLeft, PenLine } from 'lucide-react'
import Link from 'next/link'
import SubmissionEditForm from '@/components/dashboard/submission-edit-form'

interface PageProps {
  params: { id: string }
}

export default async function EditSubmissionPage({ params }: PageProps) {
  const session = await getServerSession()

  if (!session) {
    redirect('/auth/login')
  }

  const submission = await prisma.submission.findUnique({
    where: { id: params.id },
    include: {
      category: true,
      files: {
        where: { fileType: 'MANUSCRIPT' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })

  if (!submission) {
    notFound()
  }

  // Only the author can edit
  if (submission.createdBy !== session.uid) {
    redirect('/dashboard/author/submissions')
  }

  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
  })

  const canEdit = submission.status === 'NEW'
  const currentFile = submission.files[0] ?? null

  // Pre-join keywords for the form
  const keywordsStr = submission.keywords?.join(', ') ?? ''

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold">Sửa bài đã nộp</h1>
            <Badge variant="outline">{submission.code}</Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            Chỉ được sửa khi bài chưa được biên tập viên xử lý
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/author/submissions/${params.id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Link>
        </Button>
      </div>

      {/* Cannot edit warning */}
      {!canEdit && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Bài viết đang ở trạng thái <strong>{submission.status}</strong> — không thể sửa trực tiếp.
            {submission.status === 'REVISION' && (
              <>
                {' '}Vui lòng dùng chức năng{' '}
                <Link
                  href={`/dashboard/author/revise/${params.id}`}
                  className="underline font-medium"
                >
                  Nộp bản chỉnh sửa
                </Link>
                {' '}để phản hồi yêu cầu của biên tập viên.
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Form */}
      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PenLine className="h-5 w-5" />
              Chỉnh sửa thông tin bài viết
            </CardTitle>
            <CardDescription>
              Bạn có thể sửa tiêu đề, tóm tắt, từ khóa và thay thế file bản thảo.
              Khi lưu, lịch sử file cũ vẫn được giữ lại.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SubmissionEditForm
              submissionId={params.id}
              initialData={{
                title: submission.title,
                abstractVn: submission.abstractVn ?? '',
                abstractEn: submission.abstractEn ?? '',
                keywords: keywordsStr,
                categoryId: submission.categoryId ?? '',
                securityLevel: submission.securityLevel,
              }}
              currentFile={
                currentFile
                  ? {
                      id: currentFile.id,
                      originalName: currentFile.originalName,
                      mimeType: currentFile.mimeType,
                    }
                  : null
              }
              categories={categories}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
