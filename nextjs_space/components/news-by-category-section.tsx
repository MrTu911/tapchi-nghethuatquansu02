'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { NewsCardStandard, type NewsCardItem } from '@/components/news-card'

interface NewsByCategorySectionProps {
  title: string
  category: string
  news: NewsCardItem[]
  viewAllHref?: string
  icon?: React.ReactNode
}

export default function NewsByCategorySection({
  title,
  news,
  viewAllHref,
}: NewsByCategorySectionProps) {
  if (!news || news.length === 0) return null

  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="widget-header">
        <span className="widget-header-title">{title}</span>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="ml-auto text-xs text-white/80 hover:text-white flex items-center gap-0.5 transition-colors"
          >
            Xem thêm <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Grid 4 cards */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {news.slice(0, 4).map(item => (
          <NewsCardStandard key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}
