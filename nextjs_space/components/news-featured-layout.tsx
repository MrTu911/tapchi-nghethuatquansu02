'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Calendar, User, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface NewsItem {
  id: string
  title: string
  slug: string
  excerpt: string
  coverImage?: string
  category?: string
  publishedAt?: string
  author?: {
    id: string
    fullName: string
  }
}

interface NewsFeaturedLayoutProps {
  title: string
  news: NewsItem[]
}

export default function NewsFeaturedLayout({ title, news }: NewsFeaturedLayoutProps) {
  if (!news || news.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Chưa có tin tức nào.</p>
      </div>
    )
  }

  const featuredNews = news[0]
  const sideNews = news.slice(1, 4)

  return (
    <div className="space-y-6">
      {/* Section Title */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <span className="w-1 h-8 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full"></span>
          {title}
        </h2>
        <Link href="/news">
          <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700">
            Xem tất cả
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Layout: 1 Featured + 3 Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Featured News (Left - Large) */}
        <Link href={`/news/${featuredNews.slug}`} className="group">
          <Card className="overflow-hidden h-full hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-emerald-500">
            <div className="relative aspect-video bg-gray-100 dark:bg-gray-800">
              {featuredNews.coverImage ? (
                <Image
                  src={featuredNews.coverImage}
                  alt={featuredNews.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900">
                  <span className="text-4xl text-emerald-600 dark:text-emerald-400">📰</span>
                </div>
              )}
              {featuredNews.category && (
                <Badge className="absolute top-3 left-3 bg-emerald-600 hover:bg-emerald-700">
                  {featuredNews.category}
                </Badge>
              )}
            </div>
            <CardContent className="p-5">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                {featuredNews.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                {featuredNews.excerpt}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5" />
                  <span>{featuredNews.author?.fullName || 'Ban biên tập'}</span>
                </div>
                {featuredNews.publishedAt && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{new Date(featuredNews.publishedAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Side News (Right - 3 Small Items) */}
        <div className="space-y-4">
          {sideNews.map((item) => (
            <Link key={item.id} href={`/news/${item.slug}`} className="group">
              <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border hover:border-emerald-500">
                <div className="flex gap-4 p-4">
                  {/* Thumbnail */}
                  <div className="relative w-24 h-24 flex-shrink-0 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                    {item.coverImage ? (
                      <Image
                        src={item.coverImage}
                        alt={item.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900 dark:to-cyan-900">
                        <span className="text-2xl text-blue-600 dark:text-blue-400">📰</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                      {item.excerpt}
                    </p>
                    {item.publishedAt && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(item.publishedAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
