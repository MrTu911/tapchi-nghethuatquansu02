import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getSignedImageUrl } from '@/lib/image-utils'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Calendar, User, Eye, Tag, Share2,
  Facebook, Twitter, Linkedin, ArrowLeft, Newspaper, ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

interface NewsDetailPageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: NewsDetailPageProps): Promise<Metadata> {
  const news = await prisma.news.findUnique({ where: { slug: params.slug } })
  if (!news) return { title: 'Không tìm thấy tin tức' }

  return {
    title: `${news.title} - Tạp chí điện tử Nghệ thuật Quân sự Việt Nam`,
    description: news.summary || news.title,
    openGraph: {
      title: news.title,
      description: news.summary || news.title,
      images: news.coverImage ? [news.coverImage] : [],
      type: 'article',
      publishedTime: news.publishedAt?.toISOString(),
    },
  }
}

const NEWS_CATEGORIES: Record<string, string> = {
  announcement: 'Thông báo',
  event: 'Sự kiện',
  call_for_paper: 'Call for Papers',
  policy: 'Chính sách',
  research_news: 'Tin nghiên cứu',
  interview: 'Phỏng vấn',
  award: 'Giải thưởng',
  conference: 'Hội thảo',
}

function getCategoryLabel(category?: string | null) {
  if (!category) return 'Chưa phân loại'
  return NEWS_CATEGORIES[category] || category
}

function estimateReadTime(content?: string | null) {
  if (!content) return 1
  const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200))
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const news = await prisma.news.findUnique({
    where: { slug: params.slug },
    include: { author: { select: { fullName: true, org: true, email: true } } },
  })

  if (!news || !news.isPublished) notFound()

  const [relatedNews, coverImageSigned] = await Promise.all([
    prisma.news.findMany({
      where: {
        isPublished: true,
        id: { not: news.id },
        OR: [
          { category: news.category },
          ...(news.tags.length > 0 ? [{ tags: { hasSome: news.tags } }] : []),
        ],
      },
      orderBy: { publishedAt: 'desc' },
      take: 3,
      include: { author: { select: { fullName: true } } },
    }),
    news.coverImage ? getSignedImageUrl(news.coverImage, true) : Promise.resolve(null),
  ])

  const relatedWithUrls = await Promise.all(
    relatedNews.map(async (item) => ({
      ...item,
      coverImageSigned: item.coverImage ? await getSignedImageUrl(item.coverImage, true) : null,
    }))
  )

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'
  const newsUrl = `${siteUrl}/news/${news.slug}`
  const readTime = estimateReadTime(news.content)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 py-3">
        <Link href="/" className="hover:text-[#295232] transition-colors">Trang chủ</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/news" className="hover:text-[#295232] transition-colors">Tin tức</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-600 dark:text-gray-300 line-clamp-1 max-w-[200px]">
          {getCategoryLabel(news.category)}
        </span>
      </div>

      {/* Hero image */}
      {coverImageSigned && (
        <div className="relative h-56 sm:h-72 lg:h-96 rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-800 shadow-lg mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverImageSigned}
            alt={news.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      )}

      {/* Main layout: 2/3 content + 1/3 sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">

        {/* Article content */}
        <article>
          {/* Article header */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 p-6 mb-6 shadow-sm">
            {/* Category + featured */}
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-[#D4A843] text-[#1E293B] text-xs font-bold px-3 py-1 rounded-full">
                {getCategoryLabel(news.category)}
              </span>
              {news.isFeatured && (
                <span className="bg-[#295232] text-white text-xs font-bold px-3 py-1 rounded-full">
                  ⭐ Nổi bật
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-50 leading-tight mb-3">
              {news.title}
            </h1>

            {news.titleEn && (
              <h2 className="text-lg text-gray-500 dark:text-gray-400 italic mb-3">{news.titleEn}</h2>
            )}

            {news.summary && (
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-base border-l-4 border-[#295232] pl-4 mb-4 italic">
                {news.summary}
              </p>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-700">
              {news.author && (
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-full bg-[#295232] flex items-center justify-center text-white text-xs font-bold">
                    {news.author.fullName[0]}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 leading-none">{news.author.fullName}</p>
                    {news.author.org && (
                      <p className="text-[11px] text-gray-400 leading-none mt-0.5">{news.author.org}</p>
                    )}
                  </div>
                </div>
              )}
              <Separator orientation="vertical" className="h-4 hidden sm:block" />
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {news.publishedAt
                  ? format(new Date(news.publishedAt), "dd 'tháng' MM, yyyy", { locale: vi })
                  : format(new Date(news.createdAt), "dd 'tháng' MM, yyyy", { locale: vi })
                }
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" /> {news.views.toLocaleString()} lượt xem
              </span>
              <span className="text-gray-300">·</span>
              <span className="text-gray-400">~{readTime} phút đọc</span>
            </div>

            {/* Tags */}
            {news.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <Tag className="w-3.5 h-3.5 text-gray-400" />
                {news.tags.map((tag, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 bg-[#E8F3EA] dark:bg-[#1E3924]/40 text-[#295232] dark:text-emerald-400 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Article body */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 p-6 sm:p-8 mb-6 shadow-sm">
            <div
              className="prose prose-slate dark:prose-invert max-w-none
                prose-headings:text-[#295232] dark:prose-headings:text-emerald-400
                prose-a:text-[#295232] dark:prose-a:text-emerald-400
                prose-blockquote:border-l-[#295232] prose-blockquote:bg-[#E8F3EA] dark:prose-blockquote:bg-[#1E3924]/30 prose-blockquote:rounded-r-lg prose-blockquote:py-1
                prose-img:rounded-xl prose-img:shadow-md"
              dangerouslySetInnerHTML={{ __html: news.content }}
            />
          </div>

          {/* English content */}
          {news.contentEn && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 p-6 sm:p-8 mb-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1 h-5 bg-[#D4A843] rounded-full" />
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">English Version</h3>
              </div>
              <div
                className="prose prose-slate dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: news.contentEn }}
              />
            </div>
          )}

          {/* Share */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Share2 className="w-4 h-4" /> Chia sẻ bài viết
              </span>
              <div className="flex gap-2">
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(newsUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 text-xs font-medium transition-colors"
                >
                  <Facebook className="w-3.5 h-3.5" /> Facebook
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(newsUrl)}&text=${encodeURIComponent(news.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sky-200 text-sky-600 hover:bg-sky-50 text-xs font-medium transition-colors"
                >
                  <Twitter className="w-3.5 h-3.5" /> Twitter
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(newsUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50 text-xs font-medium transition-colors"
                >
                  <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                </a>
              </div>
            </div>
          </div>
        </article>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Related news */}
          {relatedWithUrls.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="bg-[#295232] text-white px-4 py-3 flex items-center gap-2">
                <Newspaper className="w-4 h-4" />
                <span className="text-sm font-semibold">Tin liên quan</span>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {relatedWithUrls.map((item) => (
                  <Link
                    key={item.id}
                    href={`/news/${item.slug}`}
                    className="flex gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                  >
                    <div className="w-16 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                      {(item.coverImageSigned || item.coverImage) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.coverImageSigned || item.coverImage || ''}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#E8F3EA] to-[#d1e8d4] flex items-center justify-center">
                          <Newspaper className="w-4 h-4 text-[#295232]/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-gray-800 dark:text-gray-200 group-hover:text-[#295232] dark:group-hover:text-emerald-400 line-clamp-2 leading-snug transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {item.publishedAt
                          ? format(new Date(item.publishedAt), 'dd/MM/yyyy', { locale: vi })
                          : format(new Date(item.createdAt), 'dd/MM/yyyy', { locale: vi })
                        }
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Back link */}
          <Link
            href="/news"
            className="flex items-center gap-2 text-sm text-[#295232] hover:underline font-medium px-1"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách tin tức
          </Link>
        </aside>
      </div>

      <div className="pb-12" />
    </div>
  )
}
