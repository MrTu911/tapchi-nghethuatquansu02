import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { getFileUrl } from '@/lib/local-storage'
import { LATEST_ISSUE_ORDER } from '@/lib/services/issue-ordering'
import { IssueTocClient } from '@/components/journal-issue/issue-toc-client'
import { Button } from '@/components/ui/button'
import { Calendar, FileText, ExternalLink, Download, BookOpen, BookOpenCheck, Award, ChevronRight, Layers } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Số Mới Nhất - Tạp chí Nghệ thuật Quân sự Việt Nam',
  description: 'Số phát hành mới nhất của Tạp chí Nghệ thuật Quân sự Việt Nam',
}

// Số mới nhất nạp THEO dữ liệu số hóa (JournalArticle/IssueSection từ corpus epub),
// không dùng quan hệ `articles` (peer-review) vốn rỗng với các số nhập từ thư viện.
async function getLatestIssue() {
  try {
    return await prisma.issue.findFirst({
      where: { status: 'PUBLISHED' },
      orderBy: LATEST_ISSUE_ORDER,
      include: {
        volume: true,
        sections: {
          orderBy: { order: 'asc' },
          include: {
            journalArticles: {
              orderBy: { pageStart: 'asc' },
              include: { authors: { orderBy: { order: 'asc' } } },
            },
          },
        },
        _count: { select: { journalArticles: true } },
      },
    })
  } catch (error) {
    console.error('Error fetching latest issue:', error)
    return null
  }
}

export default async function LatestIssuePage() {
  const rawIssue = await getLatestIssue()

  const issue = rawIssue
    ? {
        ...rawIssue,
        coverImage: rawIssue.coverImage ? getFileUrl(rawIssue.coverImage, true) : null,
        pdfUrl: rawIssue.pdfUrl ? getFileUrl(rawIssue.pdfUrl, true) : null,
      }
    : null

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

  const totalArticles = issue._count.journalArticles
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
                  alt={`Bìa ${issue.title ?? `Số ${issue.number}/${issue.year}`}`}
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
                  Số {issue.number} – Năm {issue.year}
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                  <p className="text-sm font-medium text-white">{totalArticles} bài</p>
                </div>
              </div>
              {issue.pageCount && (
                <div className="flex items-center gap-2.5 bg-white/10 rounded-xl p-3">
                  <Layers className="h-4 w-4 text-white/70 shrink-0" />
                  <div>
                    <p className="text-xs text-white/60 uppercase tracking-wide">Số trang</p>
                    <p className="text-sm font-medium text-white">{issue.pageCount} trang</p>
                  </div>
                </div>
              )}
            </div>

            {issue.doi && (
              <p className="text-xs text-white/60 font-mono">DOI: {issue.doi}</p>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              {issue.slug && (
                <Button className="bg-white text-military-800 hover:bg-white/90 font-semibold shadow-md" asChild>
                  <Link href={`/library/${issue.slug}`}>
                    <BookOpenCheck className="mr-2 h-4 w-4" />
                    Đọc toàn văn
                  </Link>
                </Button>
              )}
              <Button
                variant="outline"
                className="border-white/40 text-white hover:bg-white/10 hover:text-white hover:border-white/60"
                asChild
              >
                <Link href={`/issues/${issue.id}`}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Xem chi tiết số
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
            <span>{totalArticles} bài viết</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-military-200" />
          <div className="flex items-center gap-2 text-military-700">
            <Layers className="h-4 w-4 text-military-500" />
            <span className="font-medium">Chuyên mục:</span>
            <span>{issue.sections.length} chuyên mục</span>
          </div>
          {issue.pageCount && (
            <>
              <div className="hidden sm:block w-px h-4 bg-military-200" />
              <div className="flex items-center gap-2 text-military-700">
                <BookOpen className="h-4 w-4 text-military-500" />
                <span className="font-medium">Số trang:</span>
                <span>{issue.pageCount} trang</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mục lục — đúng dữ liệu số hóa từ corpus */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Mục lục</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {totalArticles} bài viết trong số này
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild className="text-military-600 hover:text-military-700 hover:bg-military-50">
            <Link href={`/issues/${issue.id}`}>
              Xem chi tiết số
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <IssueTocClient
            sections={issue.sections}
            pdfUrl={issue.pdfUrl}
            totalArticles={totalArticles}
          />
        </div>

        {/* Footer CTA */}
        {issue.slug && (
          <div className="flex justify-center pt-2">
            <Button
              className="bg-military-700 text-white hover:bg-military-800"
              asChild
            >
              <Link href={`/library/${issue.slug}`}>
                <BookOpenCheck className="mr-2 h-4 w-4" />
                Đọc toàn văn số này
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
