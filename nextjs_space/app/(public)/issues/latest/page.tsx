
import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { getFileUrl } from '@/lib/local-storage'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, FileText, ExternalLink, Download, BookOpen, Award, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Số Mới Nhất - Tạp chí Nghệ thuật Quân sự Việt Nam',
  description: 'Số phát hành mới nhất của Tạp chí Nghệ thuật Quân sự Việt Nam'
}

const CATEGORY_COLOR_MAP: Record<string, string> = {
  'ky-thuat': 'bg-blue-100 text-blue-800 border border-blue-200',
  'nghe-thuat-quan-su': 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  'khoa-hoc': 'bg-amber-100 text-amber-800 border border-amber-200',
  'quan-su': 'bg-rose-100 text-rose-800 border border-rose-200',
  'ly-luan': 'bg-purple-100 text-purple-800 border border-purple-200',
}

function getCategoryColor(slug: string | null | undefined): string {
  if (!slug) return 'bg-military-100 text-military-800 border border-military-200'
  return CATEGORY_COLOR_MAP[slug] ?? 'bg-military-100 text-military-800 border border-military-200'
}

async function getLatestIssue() {
  try {
    const issue = await prisma.issue.findFirst({
      where: { status: 'PUBLISHED' },
      orderBy: [{ year: 'desc' }, { number: 'desc' }],
      include: {
        volume: true,
        articles: {
          where: { submission: { status: 'PUBLISHED' } },
          include: {
            submission: {
              include: {
                author: { select: { fullName: true, org: true } },
                category: true
              }
            }
          },
          orderBy: { publishedAt: 'asc' }
        }
      }
    })
    return issue
  } catch (error) {
    console.error('Error fetching latest issue:', error)
    return null
  }
}

export default async function LatestIssuePage() {
  const rawIssue = await getLatestIssue()

  const issue = rawIssue ? {
    ...rawIssue,
    coverImage: rawIssue.coverImage ? getFileUrl(rawIssue.coverImage, true) : null,
    pdfUrl: rawIssue.pdfUrl ? getFileUrl(rawIssue.pdfUrl, true) : null,
  } : null

  if (!issue) {
    return (
      <div className="py-16 flex flex-col items-center justify-center gap-4 text-center">
        <div className="w-20 h-20 rounded-full bg-military-50 flex items-center justify-center">
          <BookOpen className="w-10 h-10 text-military-400" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Chưa có số tạp chí nào được xuất bản</h2>
        <p className="text-muted-foreground text-sm">Vui lòng quay lại sau.</p>
        <Button variant="outline" asChild>
          <Link href="/archive">Xem kho lưu trữ</Link>
        </Button>
      </div>
    )
  }

  const publishDateLabel = issue.publishDate
    ? new Date(issue.publishDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : `Năm ${issue.year}`

  return (
    <div className="py-6 space-y-8">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-military-600 transition-colors">Trang chủ</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/archive" className="hover:text-military-600 transition-colors">Kho lưu trữ</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">Số mới nhất</span>
      </nav>

      {/* Hero Banner */}
      <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-military-800 to-military-600 shadow-xl">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">

          {/* Cover Image */}
          <div className="lg:col-span-2 relative">
            {issue.coverImage ? (
              <div className="relative aspect-[3/4] lg:aspect-auto lg:h-full min-h-[320px]">
                <Image
                  src={issue.coverImage}
                  alt={`Bìa Tập ${issue.volume.volumeNo} Số ${issue.number}`}
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-military-800/30 lg:block hidden" />
              </div>
            ) : (
              <div className="aspect-[3/4] lg:aspect-auto lg:h-full min-h-[320px] bg-military-700/50 flex items-center justify-center">
                <BookOpen className="w-24 h-24 text-white/20" />
              </div>
            )}
          </div>

          {/* Issue Info */}
          <div className="lg:col-span-3 p-8 lg:p-10 flex flex-col justify-center gap-6 text-white">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold uppercase tracking-wider text-white border border-white/30">
                  <Award className="h-3 w-3" />
                  Số mới nhất
                </span>
                <span className="text-white/70 text-sm">
                  Tập {issue.volume.volumeNo}, Số {issue.number} – Năm {issue.year}
                </span>
              </div>

              <h1 className="text-2xl lg:text-3xl font-bold text-white leading-tight">
                {issue.title || `Tạp chí Nghệ thuật Quân sự Việt Nam`}
              </h1>

              {issue.description && (
                <p className="text-white/75 text-sm lg:text-base leading-relaxed line-clamp-3">
                  {issue.description}
                </p>
              )}
            </div>

            {/* Metadata grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2.5 bg-white/10 rounded-xl p-3">
                <Calendar className="h-4 w-4 text-white/70 shrink-0" />
                <div>
                  <p className="text-xs text-white/60 uppercase tracking-wide">Xuất bản</p>
                  <p className="text-sm font-medium text-white">{publishDateLabel}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 bg-white/10 rounded-xl p-3">
                <FileText className="h-4 w-4 text-white/70 shrink-0" />
                <div>
                  <p className="text-xs text-white/60 uppercase tracking-wide">Bài viết</p>
                  <p className="text-sm font-medium text-white">{issue.articles.length} bài</p>
                </div>
              </div>
            </div>

            {issue.doi && (
              <p className="text-xs text-white/60 font-mono">DOI: {issue.doi}</p>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                className="bg-white text-military-800 hover:bg-white/90 font-semibold shadow-md"
                asChild
              >
                <Link href={`/issues/${issue.id}`}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Xem đầy đủ
                </Link>
              </Button>
              {issue.pdfUrl && (
                <Button
                  variant="outline"
                  className="border-white/40 text-white hover:bg-white/10 hover:text-white hover:border-white/60"
                  asChild
                >
                  <a href={issue.pdfUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-4 w-4" />
                    Tải PDF
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="rounded-xl border border-military-200 bg-military-50 px-6 py-4">
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center gap-2 text-military-700">
            <Calendar className="h-4 w-4 text-military-500" />
            <span className="font-medium">Ngày xuất bản:</span>
            <span>{publishDateLabel}</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-military-200" />
          <div className="flex items-center gap-2 text-military-700">
            <FileText className="h-4 w-4 text-military-500" />
            <span className="font-medium">Số bài:</span>
            <span>{issue.articles.length} bài viết</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-military-200" />
          <div className="flex items-center gap-2 text-military-700">
            <BookOpen className="h-4 w-4 text-military-500" />
            <span className="font-medium">Tập:</span>
            <span>Tập {issue.volume.volumeNo} – {issue.year}</span>
          </div>
          {issue.doi && (
            <>
              <div className="hidden sm:block w-px h-4 bg-military-200" />
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-military-100 text-military-700 border border-military-200">
                  DOI: {issue.doi}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Articles Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Mục lục</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {issue.articles.length} bài viết trong số này
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild className="text-military-600 hover:text-military-700 hover:bg-military-50">
            <Link href={`/issues/${issue.id}`}>
              Xem tất cả
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
          {issue.articles.map((article, index) => (
            <div
              key={article.id}
              className="flex gap-5 p-5 hover:bg-military-50 transition-colors duration-150 group"
            >
              {/* Number Badge */}
              <div className="shrink-0 pt-0.5">
                <div className="w-8 h-8 rounded-full bg-military-600 text-white flex items-center justify-center text-sm font-bold shadow-sm group-hover:bg-military-700 transition-colors">
                  {index + 1}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-start gap-2 flex-wrap">
                  {article.submission.category && (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 ${getCategoryColor(article.submission.category.slug)}`}>
                      {article.submission.category.name}
                    </span>
                  )}
                  {article.pages && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded shrink-0">
                      Tr. {article.pages}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-semibold leading-snug">
                  <Link
                    href={`/articles/${article.id}`}
                    className="text-foreground hover:text-military-700 transition-colors"
                  >
                    {article.submission.title}
                  </Link>
                </h3>

                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground/80">{article.submission.author.fullName}</span>
                  {article.submission.author.org && (
                    <span className="ml-1 text-muted-foreground">({article.submission.author.org})</span>
                  )}
                </p>

                {article.submission.abstractVn && (
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {article.submission.abstractVn}
                  </p>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-3 text-military-600 hover:text-military-700 hover:bg-military-100 text-xs font-medium"
                    asChild
                  >
                    <Link href={`/articles/${article.id}`}>
                      Xem chi tiết
                      <ChevronRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                  {article.pdfFile && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-3 text-xs font-medium border-military-200 text-military-700 hover:bg-military-50"
                      asChild
                    >
                      <a href={article.pdfFile} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-1.5 h-3 w-3" />
                        PDF
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            className="border-military-300 text-military-700 hover:bg-military-50 hover:border-military-400"
            asChild
          >
            <Link href={`/issues/${issue.id}`}>
              <BookOpen className="mr-2 h-4 w-4" />
              Xem số đầy đủ
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
