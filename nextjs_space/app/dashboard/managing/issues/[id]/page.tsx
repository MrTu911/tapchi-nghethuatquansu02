
import { getServerSession } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getSignedImageUrl } from '@/lib/image-utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { BrandStatCard } from '@/components/dashboard/brand-stat-card'
import { PublishIssueButton } from './_components/publish-issue-button'
import Link from 'next/link'
import { ArrowLeft, Edit, BookOpen, Calendar, FileText, Hash, Layers, ExternalLink, Info } from 'lucide-react'

const PUBLISH_ROLES = ['EIC', 'SYSADMIN']

/** Dòng bài viết đã chuẩn hóa để hiển thị, gộp từ cả Article và JournalArticle. */
type IssueArticleRow = {
  id: string
  title: string
  authorLabel: string
  pageLabel: string
  categoryName: string | null
  doi: string | null
  href: string
}

export default async function IssueDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession()

  if (!session) {
    redirect('/auth/login')
  }

  const issue = await prisma.issue.findUnique({
    where: { id: params.id },
    include: {
      volume: true,
      articles: {
        include: {
          submission: { include: { category: true, author: true } },
        },
        orderBy: { pages: 'asc' },
      },
      // Số nhập từ kho số hóa (corpus) chứa bài trong JournalArticle, không phải Article.
      // Phải lấy cả nguồn này, nếu không các số corpus sẽ hiển thị "chưa có bài viết"
      // dù danh sách bên ngoài đếm hàng chục bài.
      journalArticles: {
        select: {
          id: true,
          title: true,
          authorsText: true,
          pageStart: true,
          pageEnd: true,
        },
        orderBy: { pageStart: 'asc' },
      },
    },
  })

  if (!issue) {
    notFound()
  }

  const isPublished = issue.status === 'PUBLISHED'
  const canPublish = PUBLISH_ROLES.includes(session.role)
  const volumeNo = issue.volume?.volumeNo ?? issue.year
  const issueLabel = `Tập ${volumeNo}, Số ${issue.number}/${issue.year}`
  // coverImage là path tương đối; resolve qua /uploads để ảnh hiển thị đúng.
  const coverUrl = issue.coverImage ? await getSignedImageUrl(issue.coverImage) : null

  // Gộp 2 nguồn bài của một số về một danh sách hiển thị thống nhất.
  // Hai nguồn không chồng lấn theo dữ liệu thực tế (xem lib/issue-utils.ts).
  const articleRows: IssueArticleRow[] = issue.articles.map((article, index) => ({
    id: article.id,
    title: article.submission.title,
    authorLabel: article.submission.author.fullName,
    pageLabel: article.pages || `#${index + 1}`,
    categoryName: article.submission.category?.name ?? null,
    doi: article.doiLocal ?? null,
    href: `/articles/${article.id}`,
  }))
  const journalRows: IssueArticleRow[] = issue.journalArticles.map(ja => ({
    id: ja.id,
    title: ja.title,
    authorLabel: ja.authorsText,
    pageLabel: ja.pageEnd ? `${ja.pageStart}–${ja.pageEnd}` : `${ja.pageStart}`,
    categoryName: null,
    doi: null,
    href: `/journal-articles/${ja.id}`,
  }))
  const issueArticles = [...articleRows, ...journalRows]

  return (
    <div className="space-y-6">
      {/* Header — banner thương hiệu NTQS */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1E3924] via-[#244a2c] to-[#1E3924] px-6 py-6 text-[#F9F9F9] shadow-md">
        <div className="absolute -right-6 -top-8 h-36 w-36 rounded-full bg-[#E5C86E]/10" aria-hidden />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="text-[#F9F9F9] hover:bg-white/10 hover:text-[#F9F9F9]"
            >
              <Link href="/dashboard/managing/issues">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{issueLabel}</h1>
                <Badge
                  className={
                    isPublished
                      ? 'border-0 bg-emerald-500 text-white hover:bg-emerald-500'
                      : 'border-0 bg-[#E5C86E] text-[#1E3924] hover:bg-[#E5C86E]'
                  }
                >
                  {isPublished ? '✓ Đã xuất bản' : '✎ Bản nháp'}
                </Badge>
              </div>
              {issue.title && <p className="mt-1 text-sm text-[#F9F9F9]/80">{issue.title}</p>}
              {issue.publishDate && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-[#F9F9F9]/70">
                  <Calendar className="h-3 w-3" />
                  Ngày xuất bản:{' '}
                  {new Date(issue.publishDate).toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="border-white/30 bg-white/5 text-[#F9F9F9] hover:bg-white/15 hover:text-[#F9F9F9]"
            >
              <Link href={`/issues/${issue.id}`} target="_blank">
                <ExternalLink className="mr-1.5 h-4 w-4" />
                Xem công khai
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="border-white/30 bg-white/5 text-[#F9F9F9] hover:bg-white/15 hover:text-[#F9F9F9]"
            >
              <Link href={`/dashboard/managing/issues/${issue.id}/journal-articles`}>
                <BookOpen className="mr-1.5 h-4 w-4" />
                Mục lục số hóa
              </Link>
            </Button>
            <Button
              size="sm"
              asChild
              className="bg-[#E5C86E] font-medium text-[#1E3924] hover:bg-[#d8b95a]"
            >
              <Link href={`/dashboard/managing/issues/${issue.id}/edit`}>
                <Edit className="mr-1.5 h-4 w-4" />
                Chỉnh sửa
              </Link>
            </Button>
            {canPublish && !isPublished && (
              <PublishIssueButton
                issueId={issue.id}
                issueLabel={issueLabel}
                articleCount={issueArticles.length}
              />
            )}
          </div>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <BrandStatCard label="Bài viết trong số" value={issueArticles.length} icon={FileText} tone="green" />
        <BrandStatCard label="Tập (Volume)" value={volumeNo} icon={Layers} tone="gold" />
        <BrandStatCard label="Số (Issue)" value={issue.number} icon={Hash} tone="sky" />
        <BrandStatCard label="Năm xuất bản" value={issue.year} icon={Calendar} tone="slate" />
      </div>

      {/* Cảnh báo điều kiện xuất bản cho người không có quyền / chưa đủ điều kiện */}
      {!isPublished && (
        <div className="flex items-start gap-2 rounded-lg border border-[#E5C86E]/50 bg-[#E5C86E]/10 px-4 py-3 text-sm text-[#8a6a14] dark:text-[#E5C86E]">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
          {issueArticles.length === 0 ? (
            <span>Số tạp chí chưa có bài viết. Hãy gán bài từ Hàng đợi sản xuất trước khi xuất bản.</span>
          ) : canPublish ? (
            <span>Số đã sẵn sàng. Tổng biên tập có thể bấm “Xuất bản số” để công bố toàn bộ {issueArticles.length} bài viết.</span>
          ) : (
            <span>Số đã có {issueArticles.length} bài viết. Chỉ Tổng biên tập (EIC) có quyền xuất bản chính thức.</span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Cột trái: thông tin + ảnh bìa */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Ảnh bìa</CardTitle>
            </CardHeader>
            <CardContent>
              {coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverUrl}
                  alt={`Bìa ${issueLabel} — Tạp chí Nghệ thuật Quân sự Việt Nam`}
                  className="w-full rounded-lg border shadow-sm"
                />
              ) : (
                <div className="flex aspect-[3/4] w-full flex-col items-center justify-center rounded-lg bg-gradient-to-br from-[#1E3924] to-[#244a2c] p-4 text-center text-[#F9F9F9]">
                  <BookOpen className="mb-2 h-12 w-12 text-[#E5C86E]" />
                  <p className="text-xs font-medium uppercase tracking-wide text-[#E5C86E]">
                    Nghệ thuật Quân sự
                  </p>
                  <p className="mt-1 text-lg font-bold">Số {issue.number}/{issue.year}</p>
                  <p className="mt-2 text-xs text-[#F9F9F9]/70">Chưa có ảnh bìa</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Thông tin chung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {issue.description ? (
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Mô tả</p>
                  <p className="leading-relaxed">{issue.description}</p>
                </div>
              ) : (
                <p className="text-xs italic text-muted-foreground">Chưa có mô tả</p>
              )}
              {issue.doi && (
                <>
                  <Separator />
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">DOI</p>
                    <p className="break-all font-mono text-xs">{issue.doi}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cột phải: danh sách bài viết */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Bài viết trong số này ({issueArticles.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {issueArticles.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed py-12 text-center text-muted-foreground">
                  <BookOpen className="mx-auto mb-3 h-12 w-12 opacity-30" />
                  <p className="font-medium text-foreground">Chưa có bài viết nào</p>
                  <p className="mt-1 text-sm">Gán bài viết vào số này từ Hàng đợi sản xuất / dàn trang</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {issueArticles.map((article, index) => (
                    <div
                      key={article.id}
                      className="flex items-start gap-3 rounded-lg border border-border/60 p-4 transition-colors hover:border-[#1E3924]/30 hover:bg-[#1E3924]/[0.03]"
                    >
                      <div className="flex h-8 w-12 shrink-0 items-center justify-center rounded-md bg-[#1E3924]/5 font-mono text-xs font-medium text-[#1E3924] dark:bg-[#1E3924]/30 dark:text-emerald-200">
                        {article.pageLabel || `#${index + 1}`}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="mb-1 font-medium leading-snug">
                          <Link
                            href={article.href}
                            target="_blank"
                            className="transition-colors hover:text-[#1E3924] hover:underline dark:hover:text-emerald-300"
                          >
                            {article.title}
                          </Link>
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          <span>{article.authorLabel}</span>
                          {article.categoryName && (
                            <>
                              <span>•</span>
                              <Badge variant="outline" className="text-xs">
                                {article.categoryName}
                              </Badge>
                            </>
                          )}
                          {article.doi && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-xs">DOI: {article.doi}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
