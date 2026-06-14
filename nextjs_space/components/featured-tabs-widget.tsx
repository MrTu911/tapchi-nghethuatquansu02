'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, Flame, Star, Newspaper } from 'lucide-react'

export interface FeaturedTabItem {
  id: string
  slug: string
  title: string
  coverImage?: string | null
  publishedAt?: string | null
  createdAt: string
  views: number
}

interface FeaturedTabsWidgetProps {
  featuredNews: FeaturedTabItem[]
  mostViewedNews: FeaturedTabItem[]
}

function formatDate(iso?: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default function FeaturedTabsWidget({
  featuredNews,
  mostViewedNews,
}: FeaturedTabsWidgetProps) {
  const [activeTab, setActiveTab] = useState<'featured' | 'popular'>('featured')

  const items = activeTab === 'featured' ? featuredNews : mostViewedNews

  if (featuredNews.length === 0 && mostViewedNews.length === 0) return null

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* Tab headers */}
      <div className="grid grid-cols-2 border-b border-gray-100 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('featured')}
          className={`flex items-center justify-center gap-1.5 py-3 text-xs font-bold uppercase tracking-wide transition-colors ${
            activeTab === 'featured'
              ? 'bg-[#8B1A1A] text-white'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          <Star className="w-3.5 h-3.5" />
          Tiêu Điểm
        </button>
        <button
          onClick={() => setActiveTab('popular')}
          className={`flex items-center justify-center gap-1.5 py-3 text-xs font-bold uppercase tracking-wide transition-colors ${
            activeTab === 'popular'
              ? 'bg-[#8B1A1A] text-white'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          Đọc Nhiều
        </button>
      </div>

      {/* News list */}
      <div className="divide-y divide-gray-50 dark:divide-gray-800">
        {items.slice(0, 7).map((item, idx) => (
          <Link
            key={item.id}
            href={`/news/${item.slug}`}
            className="flex items-start gap-3 p-3 hover:bg-[#FDF5E6] dark:hover:bg-gray-800 transition-colors group"
          >
            {/* Thumbnail */}
            <div className="relative w-16 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
              {item.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.coverImage}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#FDF5E6] to-[#d1e8d4] dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                  <Newspaper className="w-4 h-4 text-[#8B1A1A]/30" />
                </div>
              )}
              {/* Rank badge for popular tab */}
              {activeTab === 'popular' && (
                <div
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold leading-none ${
                    idx < 3 ? 'bg-[#D4A843] text-white' : 'bg-gray-400/80 text-white'
                  }`}
                >
                  {idx + 1}
                </div>
              )}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold text-gray-800 dark:text-gray-200 group-hover:text-[#8B1A1A] dark:group-hover:text-amber-400 line-clamp-2 leading-snug transition-colors">
                {item.title}
              </h4>
              <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                <span>{formatDate(item.publishedAt || item.createdAt)}</span>
                <span className="flex items-center gap-0.5 ml-auto">
                  <Eye className="w-2.5 h-2.5" />
                  {item.views.toLocaleString()}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
