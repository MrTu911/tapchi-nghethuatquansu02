import Link from 'next/link'
import { cache } from 'react'
import { prisma } from '@/lib/prisma'
import { getSignedImageUrl } from '@/lib/image-utils'
import { LATEST_ISSUE_ORDER } from '@/lib/services/issue-ordering'
import {
  BookOpen, Eye, Download, Calendar, ChevronRight,
  TrendingUp,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

import MarqueeNewsBar from '@/components/marquee-news-bar'
import HeroBannerEnhanced from '@/components/hero-banner-enhanced'
import HeroNewsSlider from '@/components/hero-news-slider'
import CategoryTabsSection from '@/components/category-tabs-section'
import { AnnouncementsWidget } from '@/components/announcements-widget'
import VisitorStats from '@/components/visitor-stats'
import TinTucNoiBatSection from '@/components/tin-tuc-noi-bat-section'
import VideoSection from '@/components/video-section'
import PodcastSection from '@/components/podcast-section'
import NewsByCategorySection from '@/components/news-by-category-section'
import PhotoGallerySection from '@/components/photo-gallery-section'
import FeaturedTabsWidget from '@/components/featured-tabs-widget'
import { NewsCardStandard } from '@/components/news-card'

export const revalidate = 300

// ─── Data fetchers ────────────────────────────────────────────────────────────

const getLatestArticles = cache(async (take = 10) => {
  try {
    const articles = await prisma.article.findMany({
      where: {
        approvalStatus: 'APPROVED',
        publishedAt: { lte: new Date() },
      },
      include: {
        submission: {
          include: {
            author: { select: { id: true, fullName: true, org: true } },
            category: { select: { id: true, name: true, slug: true, code: true } },
          },
        },
        issue: { include: { volume: true } },
      },
      orderBy: { publishedAt: 'desc' },
      take,
    })
    return articles.map(a => ({
      id: a.id,
      title: a.submission.title,
      abstractVn: a.submission.abstractVn,
      keywords: a.submission.keywords,
      pdfUrl: a.pdfFile,
      views: a.views,
      downloads: a.downloads,
      isFeatured: a.isFeatured,
      author: a.submission.author,
      category: a.submission.category,
      issue: a.issue,
      publishedAt: a.publishedAt?.toISOString() ?? null,
    }))
  } catch {
    return []
  }
})

const getMostViewedArticles = cache(async (take = 8) => {
  try {
    const articles = await prisma.article.findMany({
      where: {
        approvalStatus: 'APPROVED',
        publishedAt: { lte: new Date() },
      },
      include: {
        submission: {
          include: {
            author: { select: { fullName: true } },
            category: { select: { name: true, slug: true, code: true } },
          },
        },
      },
      orderBy: { views: 'desc' },
      take,
    })
    return articles.map(a => ({
      id: a.id,
      title: a.submission.title,
      views: a.views,
      downloads: a.downloads,
      author: a.submission.author,
      category: a.submission.category,
      publishedAt: a.publishedAt?.toISOString() ?? null,
    }))
  } catch {
    return []
  }
})

const getArticlesByCategory = cache(async () => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } })

    const result = await Promise.all(
      categories.map(async (cat) => {
        const articles = await prisma.article.findMany({
          where: {
            approvalStatus: 'APPROVED',
            publishedAt: { lte: new Date() },
            submission: { categoryId: cat.id },
          },
          include: {
            submission: {
              include: {
                author: { select: { fullName: true } },
                category: { select: { name: true, slug: true, code: true } },
              },
            },
          },
          orderBy: { publishedAt: 'desc' },
          take: 10,
        })

        return {
          code: cat.code,
          name: cat.name,
          slug: cat.slug,
          articles: articles.map(a => ({
            id: a.id,
            title: a.submission.title,
            abstractVn: a.submission.abstractVn,
            views: a.views,
            publishedAt: a.publishedAt?.toISOString() ?? null,
            author: a.submission.author,
            category: a.submission.category,
          })),
        }
      })
    )
    return result.filter(cat => cat.articles.length > 0)
  } catch {
    return []
  }
})

const getRecentIssues = cache(async (take = 5) => {
  try {
    const issues = await prisma.issue.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        // Đếm cả bài số hóa (journalArticles) lẫn bài biên tập (articles): các số nhập
        // từ Thư viện số chỉ có journalArticles nên dùng articles sẽ ra "0 bài".
        _count: { select: { articles: true, journalArticles: true } },
      },
      orderBy: LATEST_ISSUE_ORDER,
      take,
    })
    return Promise.all(issues.map(async i => ({
      id: i.id,
      title: i.title ?? undefined,
      coverImage: i.coverImage ? await getSignedImageUrl(i.coverImage, true) : undefined,
      publishDate: i.publishDate?.toISOString(),
      number: i.number,
      year: i.year,
      articleCount: i._count.journalArticles || i._count.articles,
    })))
  } catch {
    return []
  }
})

const getSliderData = cache(async () => {
  try {
    const sliders = await prisma.banner.findMany({
      where: { isActive: true, targetRole: 'HOME_SLIDER' },
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
    })
    if (sliders.length > 0) {
      return Promise.all(
        sliders.map(async s => ({
          id: s.id,
          image: await getSignedImageUrl(s.imageUrl, true),
          title: s.title ?? '',
          description: s.subtitle ?? '',
          linkUrl: s.linkUrl ?? '#',
          buttonText: s.buttonText ?? 'Xem chi tiết',
        }))
      )
    }

    const banners = await prisma.banner.findMany({
      where: {
        isActive: true,
        AND: [
          { OR: [{ startDate: null }, { startDate: { lte: new Date() } }] },
          { OR: [{ endDate: null }, { endDate: { gte: new Date() } }] },
        ],
      },
      orderBy: { position: 'asc' },
      take: 4,
    })
    if (banners.length > 0) {
      return Promise.all(
        banners.map(async b => ({
          id: b.id,
          image: await getSignedImageUrl(b.imageUrl, true),
          title: b.title ?? '',
          description: b.subtitle ?? '',
          linkUrl: b.linkUrl ?? '#',
          buttonText: b.buttonText ?? 'Xem chi tiết',
        }))
      )
    }
    return []
  } catch {
    return []
  }
})

const getMarqueeItems = cache(async () => {
  try {
    const articles = await prisma.article.findMany({
      where: { approvalStatus: 'APPROVED', publishedAt: { lte: new Date() } },
      include: { submission: { select: { title: true } } },
      orderBy: { publishedAt: 'desc' },
      take: 6,
    })
    return articles.map(a => ({
      id: `article-${a.id}`,
      title: `Bài mới: ${a.submission.title}`,
      url: `/articles/${a.id}`,
      isImportant: false,
    }))
  } catch {
    return []
  }
})

const getLatestNews = cache(async (take = 10) => {
  try {
    const news = await prisma.news.findMany({
      where: { isPublished: true },
      include: { author: { select: { fullName: true } } },
      orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }],
      take,
    })
    return Promise.all(
      news.map(async (n) => ({
        id: n.id,
        slug: n.slug,
        title: n.title,
        summary: n.summary,
        coverImage: n.coverImage,
        coverImageSigned: n.coverImage ? await getSignedImageUrl(n.coverImage, true) : null,
        category: n.category,
        publishedAt: n.publishedAt?.toISOString() ?? null,
        createdAt: n.createdAt.toISOString(),
        views: n.views,
        author: n.author ? { fullName: n.author.fullName } : null,
      }))
    )
  } catch {
    return []
  }
})

const getMostViewedNews = cache(async (take = 7) => {
  try {
    const news = await prisma.news.findMany({
      where: { isPublished: true },
      orderBy: { views: 'desc' },
      take,
    })
    return Promise.all(
      news.map(async (n) => ({
        id: n.id,
        slug: n.slug,
        title: n.title,
        coverImage: n.coverImage ? await getSignedImageUrl(n.coverImage, true) : null,
        publishedAt: n.publishedAt?.toISOString() ?? null,
        createdAt: n.createdAt.toISOString(),
        views: n.views,
      }))
    )
  } catch {
    return []
  }
})

const getNewsByCategories = cache(async () => {
  const categories = [
    { key: 'hoat_dong', label: 'Hoạt Động Học Viện' },
    { key: 'nghien_cuu', label: 'Nghiên Cứu Khoa Học' },
    { key: 'thong_bao', label: 'Thông Báo' },
    { key: 'dao_tao', label: 'Đào Tạo' },
  ]
  try {
    const results = await Promise.all(
      categories.map(async (cat) => {
        const news = await prisma.news.findMany({
          where: { isPublished: true, category: cat.key },
          include: { author: { select: { fullName: true } } },
          orderBy: { publishedAt: 'desc' },
          take: 4,
        })
        return {
          ...cat,
          news: news.map(n => ({
            id: n.id,
            slug: n.slug,
            title: n.title,
            summary: n.summary,
            coverImage: n.coverImage,
            category: n.category,
            publishedAt: n.publishedAt?.toISOString() ?? null,
            createdAt: n.createdAt.toISOString(),
            views: n.views,
            author: n.author ? { fullName: n.author.fullName } : null,
          })),
        }
      })
    )
    return results.filter(r => r.news.length > 0)
  } catch {
    return []
  }
})

const getGalleryPhotos = cache(async () => {
  try {
    const mediaItems = await prisma.media.findMany({
      where: { fileType: { startsWith: 'image/' } },
      orderBy: { createdAt: 'desc' },
      take: 8,
    })
    if (mediaItems.length >= 4) {
      return mediaItems.map(m => ({
        id: m.id,
        url: m.cloudStoragePath,
        alt: m.altText ?? m.fileName,
        caption: null,
      }))
    }
    const news = await prisma.news.findMany({
      where: { isPublished: true, coverImage: { not: null } },
      orderBy: { publishedAt: 'desc' },
      take: 8,
    })
    return news
      .filter(n => n.coverImage)
      .map(n => ({
        id: n.id,
        url: n.coverImage as string,
        alt: n.title,
        caption: null,
      }))
  } catch {
    return []
  }
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso?: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const [
    latestArticles,
    mostViewed,
    categoriesWithArticles,
    recentIssues,
    sliderData,
    marqueeItems,
    latestNews,
    mostViewedNews,
    newsByCategories,
    galleryPhotos,
  ] = await Promise.all([
    getLatestArticles(12),
    getMostViewedArticles(8),
    getArticlesByCategory(),
    getRecentIssues(5),
    getSliderData(),
    getMarqueeItems(),
    getLatestNews(10),
    getMostViewedNews(7),
    getNewsByCategories(),
    getGalleryPhotos(),
  ])

  const latestIssue = recentIssues[0] ?? null
  const olderIssues = recentIssues.slice(1)

  // Hero slider: top 6 news items
  const heroNews = latestNews.slice(0, 6).map(n => ({
    ...n,
    coverImage: n.coverImageSigned || n.coverImage,
  }))

  // 4-card quick row: next 4 (items 4–7 or overlap if < 8 total)
  const quickRowNews = latestNews.slice(0, 4).map(n => ({
    id: n.id,
    slug: n.slug,
    title: n.title,
    coverImage: n.coverImageSigned || n.coverImage,
    category: n.category,
    publishedAt: n.publishedAt,
    createdAt: n.createdAt,
    views: n.views,
    author: n.author,
  }))

  // Sidebar featured/popular tabs
  const featuredTabItems = latestNews.slice(0, 7).map(n => ({
    id: n.id,
    slug: n.slug,
    title: n.title,
    coverImage: n.coverImageSigned || n.coverImage,
    publishedAt: n.publishedAt,
    createdAt: n.createdAt,
    views: n.views,
  }))

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* ── Ticker ─────────────────────────────────────────────── */}
      <div className="mx-0 sm:mx-0 sticky top-0 z-40">
        <MarqueeNewsBar newsItems={marqueeItems} />
      </div>

      {/* ── Main layout: left content + persistent right sidebar ── */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

        {/* ═══ LEFT COLUMN ═══════════════════════════════════════ */}
        <div className="min-w-0 space-y-5">

          {/* 1. Hero — news slider hoặc banner slider */}
          {heroNews.length > 0 ? (
            <HeroNewsSlider news={heroNews} autoPlayInterval={5000} />
          ) : sliderData.length > 0 ? (
            <div className="rounded-xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-700">
              <HeroBannerEnhanced slides={sliderData} autoPlayInterval={5000} />
            </div>
          ) : null}

          {/* 2. Quick row — 4 card tin mới nhất */}
          {quickRowNews.length >= 2 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quickRowNews.map(item => (
                <NewsCardStandard key={item.id} item={item} />
              ))}
            </div>
          )}

          {/* 3. Tin tức nổi bật */}
          {latestNews.length > 0 && (
            <TinTucNoiBatSection news={latestNews} />
          )}

          {/* 4. Video */}
          <VideoSection />

          {/* 5. Tin theo chuyên mục */}
          {newsByCategories.length > 0 && (
            <div className="space-y-4">
              {newsByCategories.map(cat => (
                <NewsByCategorySection
                  key={cat.key}
                  title={cat.label}
                  category={cat.key}
                  news={cat.news}
                  viewAllHref={`/news?category=${cat.key}`}
                />
              ))}
            </div>
          )}

          {/* 8. Bài báo theo chuyên mục (tabs) */}
          <div>
            <div className="section-title-bar">
              <div className="section-title-bar-left">
                <span className="section-title-accent" />
                <h2 className="section-title-text">Bài Báo Theo Chuyên Mục</h2>
              </div>
            </div>
            <CategoryTabsSection categories={categoriesWithArticles} />
          </div>

          {/* 7. Danh sách bài báo mới nhất */}
          {latestArticles.length > 0 && (
            <div>
              <div className="section-title-bar">
                <div className="section-title-bar-left">
                  <span className="section-title-accent" />
                  <h2 className="section-title-text">Bài Báo Mới Nhất</h2>
                </div>
                <Link href="/articles" className="text-xs text-[#8B1A1A] hover:underline flex items-center gap-0.5">
                  Xem tất cả <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm divide-y divide-gray-100 dark:divide-gray-800">
                {latestArticles.slice(0, 8).map((art, idx) => (
                  <Link
                    key={art.id}
                    href={`/articles/${art.id}`}
                    className="flex gap-4 items-start px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                  >
                    <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                      idx < 3 ? 'bg-[#8B1A1A] text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                    }`}>
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-[#8B1A1A] line-clamp-2 leading-snug">
                        {art.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        {art.author && (
                          <span className="text-gray-500 dark:text-gray-400">{art.author.fullName}</span>
                        )}
                        {art.category && (
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-normal border-gray-200">
                            {art.category.name.length > 18 ? art.category.name.substring(0, 16) + '…' : art.category.name}
                          </Badge>
                        )}
                        <span className="ml-auto flex items-center gap-1">
                          <Eye className="w-3 h-3" /> {art.views.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 8. Thư viện ảnh */}
          {galleryPhotos.length >= 4 && (
            <PhotoGallerySection photos={galleryPhotos} />
          )}
        </div>

        {/* ═══ RIGHT SIDEBAR — persistent ════════════════════════ */}
        <aside className="space-y-5">

          {/* Số mới nhất */}
          {latestIssue && (
            <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900">
              <div className="widget-header">
                <BookOpen className="w-4 h-4" />
                <span className="widget-header-title">Số Mới Nhất</span>
              </div>
              <Link href={`/issues/${latestIssue.id}`} className="block group">
                {/* Cover — full-width, tỉ lệ 3:4 đúng chuẩn bìa tạp chí */}
                <div className="relative w-full aspect-[3/4] bg-[#F5EFE0]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={latestIssue.coverImage ?? '/images/default-cover.jpg'}
                    alt={`Bìa Tập ${latestIssue.year} Số ${latestIssue.number}`}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  />
                  {/* Overlay thông tin dưới ảnh */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-3 pt-10">
                    <p className="text-white text-[11px] font-semibold">
                      Tập {latestIssue.year}, Số {latestIssue.number} – {latestIssue.year}
                    </p>
                    <p className="text-white/65 text-[10px] mt-0.5">{latestIssue.articleCount} bài báo</p>
                  </div>
                </div>
                {/* Tiêu đề và link */}
                <div className="px-3 py-2.5">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-[#8B1A1A] text-sm line-clamp-2 transition-colors leading-snug">
                    {latestIssue.title ?? `Tạp chí Tập ${latestIssue.year}, Số ${latestIssue.number}/${latestIssue.year}`}
                  </h3>
                  <span className="inline-flex items-center gap-1 text-xs text-[#8B1A1A] font-medium mt-1.5 group-hover:underline">
                    Xem số này <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            </div>
          )}

          {/* Tiêu điểm / Đọc nhiều */}
          {(featuredTabItems.length > 0 || mostViewedNews.length > 0) && (
            <FeaturedTabsWidget
              featuredNews={featuredTabItems}
              mostViewedNews={mostViewedNews}
            />
          )}

          {/* Số trước */}
          {olderIssues.length > 0 && (
            <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900">
              <div className="widget-header">
                <Calendar className="w-4 h-4" />
                <span className="widget-header-title">Số Trước</span>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {olderIssues.map(issue => (
                  <Link
                    key={issue.id}
                    href={`/issues/${issue.id}`}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                  >
                    {/* Thumbnail bìa tạp chí — tỉ lệ 3:4 */}
                    <div className="relative w-10 h-[54px] flex-shrink-0 rounded overflow-hidden shadow-sm">
                      {issue.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={issue.coverImage}
                          alt={`Bìa Số ${issue.number}`}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-[#F5EFE0] flex flex-col items-center justify-center text-[#8B1A1A]">
                          <span className="text-[9px] font-semibold leading-none opacity-80">Số</span>
                          <span className="text-sm font-bold leading-none">{issue.number}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-[#8B1A1A] line-clamp-2 transition-colors leading-snug">
                        {issue.title ?? `Số ${issue.number}/${issue.year}`}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Tập {issue.year} · {issue.articleCount} bài
                      </p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 group-hover:text-[#8B1A1A] transition-colors" />
                  </Link>
                ))}
              </div>
              <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800">
                <Link href="/archive" className="text-xs text-[#8B1A1A] hover:underline flex items-center gap-1 font-medium">
                  Xem tất cả số <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}

          {/* Bài đọc nhiều nhất */}
          {mostViewed.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="widget-header">
                <TrendingUp className="w-4 h-4" />
                <span className="widget-header-title">Bài Đọc Nhiều Nhất</span>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {mostViewed.map((art, idx) => (
                  <Link
                    key={art.id}
                    href={`/articles/${art.id}`}
                    className="flex gap-3 items-start px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                  >
                    <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx < 3 ? 'bg-[#8B1A1A] text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                    }`}>
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm text-gray-800 dark:text-gray-200 group-hover:text-[#8B1A1A] line-clamp-2 leading-snug font-medium">
                        {art.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                        <Eye className="w-3 h-3" />
                        <span>{art.views.toLocaleString()}</span>
                        <Download className="w-3 h-3 ml-1" />
                        <span>{art.downloads.toLocaleString()}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Tải nhiều nhất */}
          {mostViewed.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="widget-header">
                <Download className="w-4 h-4" />
                <span className="widget-header-title">Tải Nhiều Nhất</span>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {[...mostViewed].sort((a, b) => b.downloads - a.downloads).slice(0, 5).map((art, idx) => (
                  <Link
                    key={art.id}
                    href={`/articles/${art.id}`}
                    className="flex gap-3 items-start px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                  >
                    <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx < 3 ? 'bg-[#C8960C] text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                    }`}>
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm text-gray-800 dark:text-gray-200 group-hover:text-[#8B1A1A] line-clamp-2 leading-snug font-medium">
                        {art.title}
                      </h4>
                      <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
                        <Download className="w-3 h-3" />
                        <span>{art.downloads.toLocaleString()} tải</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Thông báo — data từ API News */}
          <AnnouncementsWidget />

          {/* Chuyên mục bài báo */}
          {categoriesWithArticles.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="widget-header">
                <BookOpen className="w-4 h-4" />
                <span className="widget-header-title">Chuyên Mục</span>
              </div>
              <div className="p-3 flex flex-wrap gap-2">
                {categoriesWithArticles.map(cat => (
                  <Link
                    key={cat.code}
                    href={`/categories/${cat.slug}`}
                    className="text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-[#E8F3EA] hover:text-[#8B1A1A] dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400 transition-colors border border-transparent hover:border-[#8B1A1A]/20"
                  >
                    {cat.name.length > 22 ? cat.name.substring(0, 20) + '…' : cat.name}
                    <span className="ml-1 text-gray-400">({cat.articles.length})</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Podcast */}
          <PodcastSection />

          {/* Thống kê */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="widget-header">
              <TrendingUp className="w-4 h-4" />
              <span className="widget-header-title">Thống Kê</span>
            </div>
            <div className="p-4">
              <VisitorStats className="" />
            </div>
          </div>
        </aside>
      </div>

      <div className="pb-12" />
    </div>
  )
}
