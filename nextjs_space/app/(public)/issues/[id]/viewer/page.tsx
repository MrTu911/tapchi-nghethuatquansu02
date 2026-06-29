import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft, Clock, Download, ExternalLink, FileWarning } from 'lucide-react'

type Props = { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const issue = await findIssue(params.id)
  if (!issue) return { title: 'Không tìm thấy' }
  return {
    title:       `Đọc ${issue.title ?? `Số ${issue.number}/${issue.year}`} | Tạp chí Nghệ thuật Quân sự Việt Nam`,
    description: issue.description ?? `Đọc toàn văn tạp chí số ${issue.number} năm ${issue.year}`,
  }
}

async function findIssue(idOrSlug: string) {
  return prisma.issue.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    include: { volume: true },
  })
}

export default async function IssueViewerPage({ params }: Props) {
  const issue = await findIssue(params.id)
  if (!issue) notFound()

  const issueLabel = issue.title ?? `Số ${issue.number} (${issue.year})`
  const backHref   = `/issues/${params.id}`

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">

      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b shadow-sm">
        <div className="max-w-[1280px] mx-auto px-0 sm:px-0 py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Button variant="ghost" size="sm" asChild>
                <Link href={backHref}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Quay lại
                </Link>
              </Button>
              <div className="min-w-0">
                <h1 className="text-xl font-bold truncate">{issueLabel}</h1>
                <p className="text-sm text-muted-foreground">
                  Tập {issue.volume?.volumeNo ?? issue.year}
                  {issue.volume?.issn ? ` · ISSN ${issue.volume.issn}` : ''}
                </p>
              </div>
            </div>

            {/* Download button — only when PDF exists */}
            {issue.pdfUrl && (
              <Button variant="outline" size="sm" asChild className="flex-shrink-0">
                <a href={issue.pdfUrl} download>
                  <Download className="h-4 w-4 mr-2" />
                  Tải về PDF
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* PDF area */}
      <div className="max-w-[1280px] mx-auto px-0 sm:px-0 py-8">
        {issue.pdfUrl ? (
          <>
            {/* PDF iframe — browser handles 404 natively; user sees "Nếu không hiển thị..." */}
            <Card className="overflow-hidden shadow-lg">
              <CardContent className="p-0">
                <div style={{ height: '820px' }}>
                  <iframe
                    src={`${issue.pdfUrl}#toolbar=1&navpanes=0`}
                    className="w-full h-full border-0"
                    title={issueLabel}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="mt-4 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Nếu PDF không hiển thị, hãy thử các tuỳ chọn bên dưới.
              </p>
              <div className="flex gap-2 justify-center flex-wrap">
                <Button variant="outline" size="sm" asChild>
                  <a href={issue.pdfUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Mở trong tab mới
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={issue.pdfUrl} download>
                    <Download className="h-4 w-4 mr-2" />
                    Tải về
                  </a>
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* pdfUrl rỗng trong DB — hiển thị thông báo thay vì crash */
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="rounded-full bg-muted p-4">
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-semibold">File PDF toàn văn đang được cập nhật</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Số báo này đang trong quá trình số hóa. Vui lòng quay lại sau hoặc
                  liên hệ ban biên tập để được hỗ trợ.
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link href={backHref}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Quay lại số báo
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white dark:bg-gray-900 border-t mt-8">
        <div className="max-w-[1280px] mx-auto px-0 sm:px-0 py-5 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 Tạp chí Nghệ thuật Quân sự Việt Nam
          </p>
        </div>
      </div>
    </div>
  )
}
