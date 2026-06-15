import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Image from 'next/image'
import Link from 'next/link'
import {
  BookOpen, BookOpenCheck, Calendar, Download,
  FileText, Hash, Info, Newspaper,
} from 'lucide-react'
import { IssueTocClient } from '@/components/journal-issue/issue-toc-client'
import { getFileUrl } from '@/lib/local-storage'

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const issue = await findIssue(params.id)
  if (!issue) return { title: 'Không tìm thấy số tạp chí' }

  const title = issue.title || `Số ${issue.number} (${issue.year})`
  return {
    title:       `${title} | Tạp chí Nghệ thuật Quân sự Việt Nam`,
    description: issue.description || `Xem chi tiết ${title}`,
    openGraph: {
      title,
      description: issue.description || undefined,
      images:      issue.coverImage ? [issue.coverImage] : undefined,
    },
  }
}

async function findIssue(idOrSlug: string) {
  return prisma.issue.findFirst({
    // Trang công khai chỉ hiển thị số đã xuất bản — không rò số DRAFT
    where: { status: 'PUBLISHED', OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    include: {
      volume: true,
      sections: {
        include: {
          journalArticles: {
            include: { authors: { orderBy: { order: 'asc' } } },
            orderBy: { pageStart: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      },
      _count: {
        select: { articles: true, journalArticles: true },
      },
    },
  })
}

export default async function IssueDetailPage({ params }: Props) {
  const rawIssue = await findIssue(params.id)
  if (!rawIssue) notFound()

  const issue = {
    ...rawIssue,
    coverImage: rawIssue.coverImage ? getFileUrl(rawIssue.coverImage, true) : null,
    pdfUrl: rawIssue.pdfUrl ? getFileUrl(rawIssue.pdfUrl, true) : null,
  }

  const hasSections = issue.sections.length > 0
  const totalJournalArticles = issue._count.journalArticles
  const totalPeerReviewed    = issue._count.articles

  const issnDisplay = issue.volume?.issn ?? null
  const volumeYear  = issue.volume?.publicationPeriod ?? null

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">

        {/* ── Left: Cover + metadata ───────────────────────────────────────── */}
        <div>
          <Card className="sticky top-4">
            <CardContent className="p-4 space-y-4">

              {/* Cover image */}
              <div className="relative aspect-[623/847] bg-sky-50 dark:bg-sky-950 overflow-hidden rounded-lg border">
                {issue.coverImage ? (
                  <Image
                    src={issue.coverImage}
                    alt={`Bìa ${issue.title ?? `Số ${issue.number}/${issue.year}`}`}
                    fill
                    sizes="300px"
                    className="object-contain"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-blue-100 dark:from-emerald-900/40 dark:to-blue-900/40 flex items-center justify-center">
                    <BookOpen className="h-20 w-20 text-muted-foreground opacity-20" />
                  </div>
                )}
              </div>

              {/* Cover caption */}
              {issue.coverCaption && (
                <p className="text-[11px] leading-relaxed text-muted-foreground border-l-2 border-muted pl-2 italic">
                  {issue.coverCaption}
                  {issue.coverPhotoCredit && (
                    <span className="not-italic font-medium"> — {issue.coverPhotoCredit}</span>
                  )}
                </p>
              )}

              {/* Issue identity */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    {/* Volume số đặc biệt có volumeNo sentinel → hiển thị theo năm cho gọn */}
                    Tập {issue.year}
                  </Badge>
                  {issue.issueCode && (
                    <Badge variant="outline" className="text-xs font-mono">
                      #{issue.issueCode}
                    </Badge>
                  )}
                  <Badge
                    variant={issue.status === 'PUBLISHED' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {issue.status === 'PUBLISHED' ? 'Đã xuất bản' : 'Nháp'}
                  </Badge>
                </div>
                <h1 className="text-lg font-bold leading-tight">
                  {issue.title ?? `Số ${issue.number} (${issue.year})`}
                </h1>
                {issue.description && (
                  <p className="text-sm text-muted-foreground">{issue.description}</p>
                )}
              </div>

              {/* Metadata list */}
              <ul className="space-y-2 text-sm text-muted-foreground">
                {issnDisplay && (
                  <li className="flex items-center gap-2">
                    <Hash className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>ISSN&nbsp;<span className="font-mono text-foreground">{issnDisplay}</span></span>
                  </li>
                )}
                {issue.publishDate && (
                  <li className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>
                      {new Date(issue.publishDate).toLocaleDateString('vi-VN', {
                        month: 'long', year: 'numeric',
                      })}
                    </span>
                  </li>
                )}
                {issue.pageCount && (
                  <li className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{issue.pageCount} trang</span>
                  </li>
                )}
                <li className="flex items-center gap-2">
                  <Newspaper className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>
                    {totalJournalArticles > 0 ? totalJournalArticles : totalPeerReviewed} bài viết
                  </span>
                </li>
              </ul>

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-1">
                {/* Đọc toàn văn trong Thư viện số (KindleReader từ corpus) khi số đã được số hóa */}
                {issue.slug && (
                  <Button asChild className="w-full">
                    <Link href={`/library/${issue.slug}`}>
                      <BookOpenCheck className="mr-2 h-4 w-4" />
                      Đọc toàn văn
                    </Link>
                  </Button>
                )}
                {issue.pdfUrl && (
                  <Button variant={issue.slug ? 'outline' : 'default'} asChild className="w-full">
                    <Link href={`/issues/${params.id}/viewer`}>
                      <BookOpenCheck className="mr-2 h-4 w-4" />
                      Đọc toàn văn PDF
                    </Link>
                  </Button>
                )}
                {issue.pdfUrl && (
                  <Button variant="outline" asChild className="w-full">
                    <a href={issue.pdfUrl} download>
                      <Download className="mr-2 h-4 w-4" />
                      Tải PDF
                    </a>
                  </Button>
                )}
                <Button variant="ghost" asChild className="w-full">
                  <Link href="/issues">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Tất cả số báo
                  </Link>
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* ── Right: Tabs ──────────────────────────────────────────────────── */}
        <div className="min-w-0">
          <Tabs defaultValue="toc">
            <TabsList className="mb-4 w-full justify-start">
              <TabsTrigger value="toc" className="gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                Mục lục
              </TabsTrigger>
              <TabsTrigger value="info" className="gap-1.5">
                <Info className="h-3.5 w-3.5" />
                Thông tin xuất bản
              </TabsTrigger>
              {issue.pdfUrl && (
                <TabsTrigger value="pdf" className="gap-1.5">
                  <BookOpenCheck className="h-3.5 w-3.5" />
                  Đọc toàn văn
                </TabsTrigger>
              )}
            </TabsList>

            {/* ── Tab 1: Mục lục ──────────────────────────────────────────── */}
            <TabsContent value="toc">
              <Card>
                <CardContent className="pt-4 pb-2 px-4">
                  {hasSections ? (
                    <IssueTocClient
                      sections={issue.sections}
                      pdfUrl={issue.pdfUrl}
                      totalArticles={totalJournalArticles}
                    />
                  ) : (
                    /* Fallback: peer-reviewed articles list */
                    <LegacyArticlesPlaceholder count={totalPeerReviewed} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Tab 2: Thông tin xuất bản ────────────────────────────────── */}
            <TabsContent value="info">
              <Card>
                <CardContent className="pt-4 pb-6 px-4">
                  <PublicationInfo issue={issue} issnDisplay={issnDisplay} volumeYear={volumeYear} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Tab 3: Đọc toàn văn ─────────────────────────────────────── */}
            {issue.pdfUrl && (
              <TabsContent value="pdf">
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <div style={{ height: '780px' }}>
                      <iframe
                        src={`${issue.pdfUrl}#toolbar=1`}
                        className="w-full h-full border-0"
                        title={issue.title ?? `Số ${issue.number} (${issue.year})`}
                      />
                    </div>
                    <div className="p-3 border-t flex justify-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={issue.pdfUrl} target="_blank" rel="noopener noreferrer">
                          Mở trong tab mới
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a href={issue.pdfUrl} download>
                          <Download className="mr-1 h-3 w-3" />
                          Tải về
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>

      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function LegacyArticlesPlaceholder({ count }: { count: number }) {
  if (count === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground opacity-30 mb-3" />
        <p className="text-sm text-muted-foreground">Số này đang trong quá trình biên tập.</p>
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <FileText className="h-10 w-10 text-muted-foreground opacity-30 mb-3" />
      <p className="text-sm text-muted-foreground">
        Số này có {count} bài viết đang chờ số hóa mục lục.
      </p>
    </div>
  )
}

function PublicationInfo({
  issue,
  issnDisplay,
  volumeYear,
}: {
  issue: Awaited<ReturnType<typeof findIssue>> & object
  issnDisplay: string | null
  volumeYear: string | null
}) {
  const rows: [string, string | null | undefined][] = [
    ['Tạp chí',          'Tạp chí Nghệ thuật Quân sự Việt Nam'],
    ['Đơn vị xuất bản',  'Học viện Quốc phòng - Bộ Quốc phòng'],
    ['ISSN',             issnDisplay],
    ['Năm',              issue.year?.toString()],
    // Volume số đặc biệt dùng volumeNo sentinel (>= 900000) → ẩn dòng Tập, tránh lộ số rác
    ['Tập',              issue.volume && issue.volume.volumeNo < 900000
                           ? issue.volume.volumeNo.toString()
                           : null],
    ['Số',               issue.issueCode
                           ? `${issue.number} (${issue.issueCode})`
                           : issue.number?.toString()],
    ['Kỳ phát hành',     volumeYear],
    ['Số trang',         issue.pageCount ? `${issue.pageCount} trang` : null],
    ['Ngày xuất bản',    issue.publishDate
                           ? new Date(issue.publishDate).toLocaleDateString('vi-VN', {
                               day: 'numeric', month: 'long', year: 'numeric',
                             })
                           : null],
    ['DOI',              issue.doi],
  ]

  return (
    <dl className="divide-y">
      {rows
        .filter(([, v]) => v != null && v !== '')
        .map(([label, value]) => (
          <div key={label} className="flex gap-4 py-2.5">
            <dt className="w-36 text-sm text-muted-foreground flex-shrink-0">{label}</dt>
            <dd className="text-sm font-medium flex-1">{value}</dd>
          </div>
        ))}
    </dl>
  )
}
