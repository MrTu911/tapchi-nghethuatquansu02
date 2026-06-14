import Link from 'next/link'
import { ChevronRight, Eye, Newspaper } from 'lucide-react'

interface NewsItem {
  id: string
  slug: string
  title: string
  summary?: string | null
  coverImage?: string | null
  coverImageSigned?: string | null
  category?: string | null
  publishedAt?: string | null
  createdAt: string
  views: number
  author?: { fullName: string } | null
}

const CATEGORY_LABELS: Record<string, string> = {
  announcement: 'Thông báo',
  event: 'Sự kiện',
  call_for_paper: 'Call for Papers',
  policy: 'Chính sách',
  research_news: 'Tin nghiên cứu',
  interview: 'Phỏng vấn',
  award: 'Giải thưởng',
  conference: 'Hội thảo',
}

function formatNewsDate(iso?: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function getCategoryLabel(category?: string | null) {
  if (!category) return ''
  return CATEGORY_LABELS[category] || category
}

export default function TinTucNoiBatSection({ news }: { news: NewsItem[] }) {
  if (!news || news.length === 0) return null

  const [mainNews, ...sideNews] = news

  return (
    <section className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:bg-gray-900 dark:border-gray-700">
      <div className="p-5">
        {/* Section header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="w-1 h-6 bg-[#8B1A1A] rounded-full inline-block" />
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
              Tin Tức Nổi Bật
            </h2>
            <span className="inline-flex items-center gap-1 bg-[#D4A843]/15 text-[#9A7010] dark:text-[#D4A843] text-[11px] font-bold px-2 py-0.5 rounded-full border border-[#D4A843]/30">
              <span className="w-1.5 h-1.5 bg-[#D4A843] rounded-full animate-pulse" />
              MỚI
            </span>
          </div>
          <Link
            href="/news"
            className="text-sm text-[#8B1A1A] dark:text-amber-400 hover:text-[#A52020] font-medium flex items-center gap-0.5 transition-colors"
          >
            Xem tất cả <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Grid: 3/5 main + 2/5 side */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Main card (60%) */}
          <Link
            href={`/news/${mainNews.slug}`}
            className="lg:col-span-3 group relative block overflow-hidden rounded-xl"
          >
            <div className="relative aspect-[16/9] bg-gray-200 dark:bg-gray-800 rounded-xl overflow-hidden">
              {(mainNews.coverImageSigned || mainNews.coverImage) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mainNews.coverImageSigned || mainNews.coverImage || ''}
                  alt={mainNews.title}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#8B1A1A] to-[#A52020] flex items-center justify-center">
                  <Newspaper className="w-16 h-16 text-white/20" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

              {mainNews.category && (
                <div className="absolute top-3 left-3">
                  <span className="bg-[#D4A843] text-[#1E293B] text-[11px] font-bold px-2.5 py-1 rounded-full">
                    {getCategoryLabel(mainNews.category)}
                  </span>
                </div>
              )}

              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                <h3 className="text-white font-bold text-base sm:text-xl leading-snug line-clamp-3 mb-2 group-hover:text-[#C8960C] transition-colors">
                  {mainNews.title}
                </h3>
                {mainNews.summary && (
                  <p className="text-white/70 text-sm line-clamp-2 mb-3 hidden sm:block">
                    {mainNews.summary}
                  </p>
                )}
                <div className="flex items-center gap-3 text-white/55 text-xs">
                  {mainNews.author && <span>{mainNews.author.fullName}</span>}
                  {mainNews.author && <span>·</span>}
                  <span>{formatNewsDate(mainNews.publishedAt || mainNews.createdAt)}</span>
                  <span className="ml-auto flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" /> {mainNews.views.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </Link>

          {/* Side cards (40%) */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            {sideNews.slice(0, 3).map((item) => (
              <Link
                key={item.id}
                href={`/news/${item.slug}`}
                className="group flex gap-3 p-2.5 rounded-lg hover:bg-[#FDF5E6] dark:hover:bg-gray-800 transition-colors border border-neutral-100 dark:border-gray-700 hover:border-[#8B1A1A]/20"
              >
                <div className="w-20 h-14 sm:w-24 sm:h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                  {(item.coverImageSigned || item.coverImage) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.coverImageSigned || item.coverImage || ''}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#FDF5E6] to-[#d1e8d4] dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                      <Newspaper className="w-5 h-5 text-[#8B1A1A]/30" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {item.category && (
                    <span className="text-[10px] font-bold text-[#D4A843] uppercase tracking-wide">
                      {getCategoryLabel(item.category)}
                    </span>
                  )}
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-[#8B1A1A] dark:group-hover:text-amber-400 line-clamp-2 leading-snug mt-0.5 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {formatNewsDate(item.publishedAt || item.createdAt)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
