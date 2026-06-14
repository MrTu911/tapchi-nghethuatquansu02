import { Metadata } from 'next'
import Link from 'next/link'
import { BookOpen, FileText } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getFileUrl } from '@/lib/local-storage'
import { Button } from '@/components/ui/button'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { ArchiveHero } from '@/components/archive/archive-hero'
import { StatRegistry } from '@/components/archive/stat-registry'
import { ArchiveTabs, type RecentArticleItem, type TopCategoryItem } from '@/components/archive/archive-tabs'
import { type MergedArchiveIssue } from '@/components/archive/issue-bookshelf'
import { listLibraryIssues } from '@/lib/library/list-issues'
import { type ArticleData } from '@/components/articles-table-section'

export const metadata: Metadata = {
  title: 'Kho Lưu trữ Bài báo Khoa học | Tạp chí Nghệ thuật Quân sự Việt Nam',
  description:
    'Cơ sở dữ liệu học thuật công khai - Tra cứu và tải xuống toàn bộ bài báo khoa học đã xuất bản trên Tạp chí Nghệ thuật Quân sự Việt Nam.',
  keywords: ['lưu trữ bài báo', 'cơ sở dữ liệu học thuật', 'nghiên cứu khoa học', 'nghệ thuật quân sự'],
}

interface ArchiveStatistics {
  totalIssues: number
  totalArticles: number
  totalAuthors: number
  totalViews: number
  totalDownloads: number
  recentArticles: RecentArticleItem[]
  topCategories: TopCategoryItem[]
}

// Thống kê tổng quan cho dải registry + 2 widget phụ.
async function getArchiveStatistics(): Promise<ArchiveStatistics> {
  try {
    const publishedArticleWhere = { submission: { status: 'PUBLISHED' as const } }

    const [totalIssues, totalArticles, viewsAgg, downloadsAgg, totalAuthors, recent, topCats] =
      await Promise.all([
        prisma.issue.count({ where: { status: 'PUBLISHED' } }),
        prisma.article.count({ where: publishedArticleWhere }),
        prisma.article.aggregate({ where: publishedArticleWhere, _sum: { views: true } }),
        prisma.article.aggregate({ where: publishedArticleWhere, _sum: { downloads: true } }),
        prisma.user.count({ where: { submissions: { some: { status: 'PUBLISHED' } } } }),
        prisma.article.findMany({
          where: publishedArticleWhere,
          take: 5,
          orderBy: { publishedAt: 'desc' },
          include: {
            submission: { select: { title: true, author: { select: { fullName: true } } } },
          },
        }),
        // include => trả về tất cả scalar (gồm slug) + _count
        prisma.category.findMany({
          take: 5,
          where: { submissions: { some: { status: 'PUBLISHED' } } },
          include: { _count: { select: { submissions: { where: { status: 'PUBLISHED' } } } } },
          orderBy: { submissions: { _count: 'desc' } },
        }),
      ])

    const recentArticles: RecentArticleItem[] = recent.map((article) => ({
      id: article.id,
      title: article.submission.title,
      authorName: article.submission.author.fullName,
      dateLabel: article.publishedAt
        ? new Date(article.publishedAt).toLocaleDateString('vi-VN')
        : '',
    }))

    const topCategories: TopCategoryItem[] = topCats.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      count: cat._count.submissions,
    }))

    return {
      totalIssues,
      totalArticles,
      totalAuthors,
      totalViews: viewsAgg._sum.views || 0,
      totalDownloads: downloadsAgg._sum.downloads || 0,
      recentArticles,
      topCategories,
    }
  } catch (error) {
    console.error('[archive] Error fetching statistics:', error)
    return {
      totalIssues: 0,
      totalArticles: 0,
      totalAuthors: 0,
      totalViews: 0,
      totalDownloads: 0,
      recentArticles: [],
      topCategories: [],
    }
  }
}

// Slug nhất quán với corpus generator (lib/services/journal-corpus.service.ts).
function resolveIssueSlug(issue: { slug: string | null; number: number; year: number }): string {
  return issue.slug ?? `so-${issue.number}-${issue.year}`
}

// Gộp số tạp chí: union theo slug giữa DB (Issue PUBLISHED) và Thư viện (corpus.json).
// Số có ở cả hai → 1 thẻ với đủ Đọc/PDF/Mục lục; số chỉ ở một nguồn → giữ hành động khả dụng.
async function getMergedIssues(): Promise<MergedArchiveIssue[]> {
  try {
    const [dbIssues, libraryIssues] = await Promise.all([
      prisma.issue.findMany({
        where: { status: 'PUBLISHED' },
        include: {
          volume: { select: { volumeNo: true } },
          _count: { select: { articles: true } },
        },
        orderBy: [{ year: 'desc' }, { number: 'desc' }],
      }),
      listLibraryIssues(),
    ])

    const merged = new Map<string, MergedArchiveIssue>()

    // Thư viện trước (đây là các số đã số hóa, đọc được).
    for (const lib of libraryIssues) {
      merged.set(lib.slug, {
        key: lib.slug,
        name: lib.issue || lib.title,
        year: lib.year,
        coverUrl: lib.coverUrl,
        articleCount: lib.articleCount,
        libraryUrl: `/library/${lib.slug}`,
        viewerUrl: null,
        tocUrl: null,
      })
    }

    // Bổ sung dữ liệu DB: số trùng slug được gắn thêm PDF/Mục lục; số chỉ có ở DB thì thêm mới.
    for (const db of dbIssues) {
      const slug = resolveIssueSlug(db)
      const dbCover = db.coverImage ? getFileUrl(db.coverImage, true) : null
      const existing = merged.get(slug)
      if (existing) {
        existing.viewerUrl = `/issues/${db.id}/viewer`
        existing.tocUrl = `/issues/${db.id}`
        if (!existing.coverUrl) existing.coverUrl = dbCover
      } else {
        merged.set(slug, {
          key: slug,
          name: db.title || `Số ${db.number} (${db.year})`,
          year: db.year,
          coverUrl: dbCover,
          articleCount: db._count.articles,
          libraryUrl: null,
          viewerUrl: `/issues/${db.id}/viewer`,
          tocUrl: `/issues/${db.id}`,
        })
      }
    }

    return Array.from(merged.values())
  } catch (error) {
    console.error('[archive] Error merging issues:', error)
    return []
  }
}

// Toàn bộ bài báo đã xuất bản cho bảng tra cứu.
async function getAllPublishedArticles(): Promise<ArticleData[]> {
  try {
    const submissions = await prisma.submission.findMany({
      where: { status: 'PUBLISHED', article: { isNot: null } },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { fullName: true, org: true } },
        category: { select: { id: true, name: true } },
        article: {
          include: {
            issue: { include: { volume: { select: { volumeNo: true, issn: true } } } },
          },
        },
      },
    })

    return submissions
      .filter((sub) => sub.article)
      .map((sub) => {
        const article = sub.article!
        return {
          id: article.id,
          title: sub.title,
          authorName: sub.author.fullName,
          authorOrg: sub.author.org,
          category: sub.category?.name || 'Không xác định',
          categoryId: sub.category?.id || '',
          year: article.issue?.year || new Date(article.publishedAt || sub.createdAt).getFullYear(),
          issueNumber: article.issue?.number || null,
          issueVolume: article.issue?.volume?.volumeNo?.toString() || null,
          pdfUrl: article.pdfFile || null,
          doi: article.doiLocal,
          views: article.views,
          downloads: article.downloads,
          publishedAt: article.publishedAt ? article.publishedAt.toISOString() : null,
          issn: article.issue?.volume?.issn || null,
        }
      })
  } catch (error) {
    console.error('[archive] Error fetching articles:', error)
    return []
  }
}

async function getCategories(): Promise<{ id: string; name: string }[]> {
  try {
    return await prisma.category.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } })
  } catch (error) {
    console.error('[archive] Error fetching categories:', error)
    return []
  }
}

export default async function ArchivePage() {
  const [issues, stats, articles, categories] = await Promise.all([
    getMergedIssues(),
    getArchiveStatistics(),
    getAllPublishedArticles(),
    getCategories(),
  ])

  // Nhóm số theo năm; trong mỗi năm xếp số mới (slug lớn) lên trước.
  const issuesByYear = issues.reduce<Record<string, MergedArchiveIssue[]>>((acc, issue) => {
    const year = issue.year.toString()
    ;(acc[year] ??= []).push(issue)
    return acc
  }, {})
  for (const year of Object.keys(issuesByYear)) {
    issuesByYear[year].sort((a, b) => b.key.localeCompare(a.key))
  }
  const years = Object.keys(issuesByYear).sort((a, b) => parseInt(b) - parseInt(a))

  return (
    <div className="animate-fadeIn py-8 space-y-10">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Trang chủ</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-[#8B1A1A] dark:text-[#C8960C] font-medium">
              Lưu trữ
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <ArchiveHero />

      <StatRegistry
        stats={{
          // Đếm theo số thực sự duyệt được trong tab (DB đã xuất bản ∪ Thư viện đã số hóa).
          totalIssues: issues.length,
          totalArticles: stats.totalArticles,
          totalAuthors: stats.totalAuthors,
          totalViews: stats.totalViews,
          totalDownloads: stats.totalDownloads,
        }}
      />

      <ArchiveTabs
        issuesByYear={issuesByYear}
        years={years}
        articles={articles}
        categories={categories}
        recentArticles={stats.recentArticles}
        topCategories={stats.topCategories}
      />

      {/* Khám phá thêm */}
      {issues.length > 0 && (
        <div className="section-bg-light rounded-xl p-8 text-center">
          <h3 className="font-serif text-xl font-bold text-content mb-4">Khám phá thêm</h3>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild className="bg-[#8B1A1A] hover:bg-[#6B1313] text-white">
              <Link href="/issues/latest">
                <BookOpen className="h-4 w-4 mr-2" />
                Số mới nhất
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-[#8B1A1A]/30 text-[#8B1A1A] hover:bg-[#8B1A1A]/5 dark:text-[#C8960C] dark:border-[#C8960C]/40"
            >
              <Link href="/articles">
                <FileText className="h-4 w-4 mr-2" />
                Tất cả bài báo
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-[#8B1A1A]/30 text-[#8B1A1A] hover:bg-[#8B1A1A]/5 dark:text-[#C8960C] dark:border-[#C8960C]/40"
            >
              <Link href="/dashboard/author">Nộp bài nghiên cứu</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
