import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { getSignedImageUrl } from '@/lib/image-utils'
import { Badge } from '@/components/ui/badge'
import { Calendar, User, Eye, Newspaper, TrendingUp, ChevronRight, Tag } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

export const metadata: Metadata = {
  title: 'Tin tức - Tạp chí Nghệ thuật Quân sự Việt Nam',
  description: 'Tin tức, sự kiện và hoạt động của Tạp chí Nghệ thuật Quân sự Việt Nam — Học viện Quốc phòng',
}

export const revalidate = 300

const NEWS_CATEGORIES = [
  { value: 'all', label: 'Tất cả' },
  { value: 'chien_luoc_quan_su', label: 'Chiến lược quân sự' },
  { value: 'nghe_thuat_tac_chien', label: 'Nghệ thuật tác chiến' },
  { value: 'chien_dich_hoc', label: 'Chiến dịch học' },
  { value: 'chien_thuat_hoc', label: 'Chiến thuật học' },
  { value: 'lich_su_quan_su', label: 'Lịch sử quân sự' },
  { value: 'khoa_hoc_quan_su', label: 'Khoa học quân sự' },
  { value: 'giao_duc_quan_su', label: 'Giáo dục quân sự' },
  { value: 'hop_tac_quoc_phong', label: 'Hợp tác quốc phòng' },
  { value: 'tin_tuc_hoc_vien', label: 'Tin tức Học viện' },
]

function getCategoryLabel(category?: string | null) {
  if (!category) return 'Chưa phân loại'
  return NEWS_CATEGORIES.find((c) => c.value === category)?.label || category
}

function formatDate(date: Date | null | undefined) {
  if (!date) return ''
  return format(date, 'dd/MM/yyyy', { locale: vi })
}

export default async function NewsListPage({
  searchParams,
}: {
  searchParams: { category?: string }
}) {
  const activeCategory = searchParams.category && searchParams.category !== 'all'
    ? searchParams.category
    : undefined

  const where = { isPublished: true, ...(activeCategory ? { category: activeCategory } : {}) }

  const [heroNews, allNews, hotNews] = await Promise.all([
    // Big hero: featured + no category filter
    prisma.news.findFirst({
      where: { isPublished: true, isFeatured: true },
      orderBy: { publishedAt: 'desc' },
      include: { author: { select: { fullName: true } } },
    }),
    // Main grid
    prisma.news.findMany({
      where,
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: 12,
      include: { author: { select: { fullName: true } } },
    }),
    // Sidebar: most viewed
    prisma.news.findMany({
      where: { isPublished: true },
      orderBy: { views: 'desc' },
      take: 6,
      select: { id: true, slug: true, title: true, views: true, publishedAt: true, createdAt: true },
    }),
  ])

  const [heroWithUrl, allNewsWithUrls] = await Promise.all([
    heroNews
      ? getSignedImageUrl(heroNews.coverImage ?? '', true).then((url) => ({
          ...heroNews,
          coverImageSigned: url,
        }))
      : Promise.resolve(null),
    Promise.all(
      allNews.map(async (n) => ({
        ...n,
        coverImageSigned: n.coverImage ? await getSignedImageUrl(n.coverImage, true) : null,
      }))
    ),
  ])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 py-3">
        <Link href="/" className="hover:text-[#295232] transition-colors">Trang chủ</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-700 dark:text-gray-300 font-medium">Tin tức</span>
      </div>

      {/* Hero featured card */}
      {heroWithUrl && !activeCategory && (
        <Link href={`/news/${heroWithUrl.slug}`} className="group block mb-6">
          <div className="relative h-64 sm:h-80 lg:h-96 rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-800 shadow-lg">
            {heroWithUrl.coverImageSigned ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={heroWithUrl.coverImageSigned}
                alt={heroWithUrl.title}
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#295232] to-[#1E3924]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

            <div className="absolute top-4 left-4">
              <span className="bg-[#D4A843] text-[#1E293B] text-xs font-bold px-3 py-1.5 rounded-full">
                {getCategoryLabel(heroWithUrl.category)}
              </span>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
              <h1 className="text-white font-bold text-xl sm:text-3xl leading-snug line-clamp-3 mb-3 group-hover:text-[#E5C86E] transition-colors">
                {heroWithUrl.title}
              </h1>
              {heroWithUrl.summary && (
                <p className="text-white/70 text-sm sm:text-base line-clamp-2 mb-3 hidden sm:block">
                  {heroWithUrl.summary}
                </p>
              )}
              <div className="flex items-center gap-4 text-white/55 text-xs sm:text-sm">
                {heroWithUrl.author && (
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> {heroWithUrl.author.fullName}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(heroWithUrl.publishedAt ?? heroWithUrl.createdAt)}
                </span>
                <span className="ml-auto flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" /> {heroWithUrl.views.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 mb-6 scrollbar-none">
        {NEWS_CATEGORIES.map((cat) => {
          const isActive = cat.value === (activeCategory ?? 'all')
          return (
            <Link
              key={cat.value}
              href={cat.value === 'all' ? '/news' : `/news?category=${cat.value}`}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#295232] text-white shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-[#295232]/30 hover:text-[#295232]'
              }`}
            >
              {cat.label}
            </Link>
          )
        })}
      </div>

      {/* Main content + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">

        {/* News grid */}
        <div>
          {allNewsWithUrls.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 p-12 text-center">
              <Newspaper className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">Chưa có tin tức trong danh mục này</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {allNewsWithUrls.map((news) => (
                <Link key={news.id} href={`/news/${news.slug}`} className="group block">
                  <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-all hover:border-[#295232]/20 h-full flex flex-col">
                    {/* Image */}
                    <div className="relative aspect-[16/9] bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0">
                      {(news.coverImageSigned || news.coverImage) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={news.coverImageSigned || news.coverImage || ''}
                          alt={news.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#E8F3EA] to-[#d1e8d4] dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                          <Newspaper className="w-8 h-8 text-[#295232]/30" />
                        </div>
                      )}
                      {/* Category badge */}
                      <div className="absolute top-2 left-2">
                        <span className="bg-[#D4A843]/90 text-[#1E293B] text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {getCategoryLabel(news.category)}
                        </span>
                      </div>
                      {news.isFeatured && (
                        <div className="absolute top-2 right-2">
                          <span className="bg-[#295232] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            ⭐ Nổi bật
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="font-bold text-gray-800 dark:text-gray-100 group-hover:text-[#295232] dark:group-hover:text-emerald-400 line-clamp-2 leading-snug mb-2 transition-colors">
                        {news.title}
                      </h3>
                      {news.summary && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 flex-1">
                          {news.summary}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-auto pt-2 border-t border-gray-100 dark:border-gray-700">
                        {news.author && (
                          <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                            <User className="w-3 h-3" /> {news.author.fullName}
                          </span>
                        )}
                        <span className="flex items-center gap-1 ml-auto">
                          <Calendar className="w-3 h-3" />
                          {formatDate(news.publishedAt ?? news.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" /> {news.views.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Tin đọc nhiều nhất */}
          {hotNews.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="bg-[#295232] text-white px-4 py-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-semibold">Tin đọc nhiều nhất</span>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {hotNews.map((item, idx) => (
                  <Link
                    key={item.id}
                    href={`/news/${item.slug}`}
                    className="flex gap-3 items-start px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                  >
                    <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx < 3 ? 'bg-[#295232] text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                    }`}>
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-[#295232] dark:group-hover:text-emerald-400 line-clamp-2 leading-snug transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {item.views.toLocaleString()} lượt xem
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Các chủ đề */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="bg-[#4A7A55] text-white px-4 py-3 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              <span className="text-sm font-semibold">Chủ đề</span>
            </div>
            <div className="p-4 flex flex-wrap gap-2">
              {NEWS_CATEGORIES.filter((c) => c.value !== 'all').map((cat) => (
                <Link
                  key={cat.value}
                  href={`/news?category=${cat.value}`}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    activeCategory === cat.value
                      ? 'bg-[#295232] text-white border-[#295232]'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#295232]/40 hover:text-[#295232]'
                  }`}
                >
                  {cat.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Back to home */}
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-[#295232] hover:underline font-medium"
          >
            ← Về trang chủ
          </Link>
        </aside>
      </div>

      <div className="pb-12" />
    </div>
  )
}
