
import { getServerSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ISSUE_ARTICLE_COUNT_SELECT, getIssueArticleCount } from '@/lib/issue-utils'
import { getSignedImageUrl } from '@/lib/image-utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BrandStatCard } from '@/components/dashboard/brand-stat-card'
import Link from 'next/link'
import { BookOpen, Plus, Library, CheckCircle2, FileEdit, FileText, Calendar, ArrowRight } from 'lucide-react'

export default async function IssuesManagementPage() {
  const session = await getServerSession()

  if (!session) {
    redirect('/auth/login')
  }

  const issues = await prisma.issue.findMany({
    include: {
      volume: true,
      _count: { select: ISSUE_ARTICLE_COUNT_SELECT },
    },
    orderBy: [{ year: 'desc' }, { number: 'desc' }],
  })

  const publishedCount = issues.filter(i => i.status === 'PUBLISHED').length
  const draftCount = issues.filter(i => i.status === 'DRAFT').length
  const totalArticles = issues.reduce((sum, i) => sum + getIssueArticleCount(i), 0)

  // coverImage lưu path tương đối (vd "issues/so-6-2026/cover.jpg") — phải resolve
  // qua /uploads mới hiển thị được, nếu không trình duyệt sẽ resolve tương đối trang
  // hiện tại và trả 404.
  const coverUrlById = new Map<string, string>()
  await Promise.all(
    issues.map(async issue => {
      if (issue.coverImage) {
        coverUrlById.set(issue.id, await getSignedImageUrl(issue.coverImage))
      }
    }),
  )

  return (
    <div className="space-y-6">
      {/* Header — banner thương hiệu NTQS */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1E3924] via-[#244a2c] to-[#1E3924] px-6 py-6 text-[#F9F9F9] shadow-md">
        <div className="absolute -right-6 -top-8 h-36 w-36 rounded-full bg-[#E5C86E]/10" aria-hidden />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E5C86E]/20 ring-1 ring-[#E5C86E]/40">
              <Library className="h-6 w-6 text-[#E5C86E]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Quản lý số tạp chí</h1>
              <p className="mt-1 text-sm text-[#F9F9F9]/80">
                Tạo, biên tập và xuất bản các số của Tạp chí Nghệ thuật Quân sự Việt Nam
              </p>
            </div>
          </div>
          <Button
            asChild
            className="bg-[#E5C86E] font-medium text-[#1E3924] hover:bg-[#d8b95a]"
          >
            <Link href="/dashboard/managing/issues/create">
              <Plus className="mr-2 h-4 w-4" />
              Tạo số mới
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BrandStatCard label="Tổng số tạp chí" value={issues.length} icon={BookOpen} tone="green" />
        <BrandStatCard label="Đã xuất bản" value={publishedCount} icon={CheckCircle2} tone="emerald" />
        <BrandStatCard label="Bản nháp" value={draftCount} icon={FileEdit} tone="gold" />
        <BrandStatCard label="Tổng bài viết" value={totalArticles} icon={FileText} tone="sky" />
      </div>

      {/* Danh sách số dạng lưới thẻ */}
      {issues.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center text-muted-foreground">
            <BookOpen className="mb-4 h-16 w-16 opacity-30" />
            <p className="mb-1 text-lg font-medium text-foreground">Chưa có số tạp chí nào</p>
            <p className="mb-4 text-sm">Bắt đầu bằng cách tạo số đầu tiên</p>
            <Button asChild className="bg-[#1E3924] text-white hover:bg-[#15281a]">
              <Link href="/dashboard/managing/issues/create">
                <Plus className="mr-2 h-4 w-4" />
                Tạo số mới
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {issues.map(issue => {
            const isPublished = issue.status === 'PUBLISHED'
            const coverUrl = coverUrlById.get(issue.id)
            return (
              <Card
                key={issue.id}
                className="group flex flex-col overflow-hidden border-border/60 transition-shadow hover:shadow-md"
              >
                {/* Ảnh bìa */}
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-gradient-to-br from-[#1E3924]/90 to-[#244a2c]">
                  {coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coverUrl}
                      alt={`Bìa Tập ${issue.volume?.volumeNo ?? '—'}, Số ${issue.number}/${issue.year} — Tạp chí Nghệ thuật Quân sự Việt Nam`}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center text-[#F9F9F9]">
                      <BookOpen className="mb-2 h-10 w-10 text-[#E5C86E]" />
                      <p className="text-xs font-medium uppercase tracking-wide text-[#E5C86E]">
                        Nghệ thuật Quân sự
                      </p>
                      <p className="mt-1 text-lg font-bold">Số {issue.number}</p>
                      <p className="text-sm text-[#F9F9F9]/80">Năm {issue.year}</p>
                    </div>
                  )}
                  <div className="absolute right-2 top-2">
                    <Badge
                      className={
                        isPublished
                          ? 'border-0 bg-emerald-600 text-white hover:bg-emerald-600'
                          : 'border-0 bg-[#E5C86E] text-[#1E3924] hover:bg-[#E5C86E]'
                      }
                    >
                      {isPublished ? 'Đã xuất bản' : 'Nháp'}
                    </Badge>
                  </div>
                </div>

                {/* Thông tin */}
                <CardContent className="flex flex-1 flex-col gap-2 p-4">
                  <h3 className="font-semibold leading-snug">
                    Tập {issue.volume?.volumeNo ?? 'N/A'}, Số {issue.number}
                    <span className="text-muted-foreground"> ({issue.year})</span>
                  </h3>
                  {issue.title && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">{issue.title}</p>
                  )}
                  <div className="mt-auto space-y-1.5 pt-2 text-xs text-muted-foreground">
                    <p className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" />
                      {getIssueArticleCount(issue)} bài viết
                    </p>
                    {issue.publishDate && (
                      <p className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(issue.publishDate).toLocaleDateString('vi-VN')}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="mt-2 w-full justify-between border-[#1E3924]/20 text-[#1E3924] hover:bg-[#1E3924]/5 dark:text-emerald-200"
                  >
                    <Link href={`/dashboard/managing/issues/${issue.id}`}>
                      Xem chi tiết
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
