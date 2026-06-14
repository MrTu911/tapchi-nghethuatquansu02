"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Bell, Calendar, AlertCircle, RefreshCw, ChevronRight } from 'lucide-react'

interface NewsItem {
  id: string
  slug: string
  title: string
  category: string | null
  publishedAt: string | null
  createdAt: string
}

const CATEGORY_CONFIG: Record<string, { label: string; className: string }> = {
  announcement: {
    label: 'Thông báo',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  },
  event: {
    label: 'Sự kiện',
    className: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  },
  call_for_paper: {
    label: 'Tuyển bài',
    className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
  },
  policy: {
    label: 'Chính sách',
    className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  },
}

function getCategoryConfig(category: string | null) {
  if (!category) return { label: 'Tin tức', className: 'bg-slate-100 text-slate-600' }
  return CATEGORY_CONFIG[category] ?? { label: category, className: 'bg-slate-100 text-slate-600' }
}

function formatDate(dateStr: string | null) {
  const d = dateStr ? new Date(dateStr) : null
  if (!d || isNaN(d.getTime())) return ''
  return d.toLocaleDateString('vi-VN', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function AnnouncementsWidget() {
  const [items, setItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  function fetchAnnouncements() {
    setLoading(true)
    setError(false)
    fetch('/api/news?categories=announcement,event,call_for_paper,policy&isPublished=true&limit=5')
      .then(r => r.json())
      .then(data => {
        setItems(data?.data?.news ?? [])
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  return (
    <div className="rounded-lg overflow-hidden border border-border shadow-sm">
      <div className="widget-header flex items-center gap-2 px-4 py-3">
        <Bell className="h-4 w-4 text-white/90" />
        <span className="widget-header-title text-sm font-semibold tracking-wide">THÔNG BÁO</span>
      </div>

      <div className="bg-card p-3">
        {loading && (
          <div className="space-y-3 py-1">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse space-y-2 p-2">
                <div className="h-3 w-16 bg-muted rounded" />
                <div className="h-4 bg-muted rounded" />
                <div className="h-3 w-24 bg-muted rounded" />
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Không thể tải thông báo</p>
            <button
              onClick={fetchAnnouncements}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <RefreshCw className="h-3 w-3" />
              Thử lại
            </button>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Bell className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Chưa có thông báo nào</p>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="space-y-1">
            {items.map(item => {
              const cat = getCategoryConfig(item.category)
              const dateDisplay = formatDate(item.publishedAt ?? item.createdAt)
              return (
                <Link
                  key={item.id}
                  href={`/news/${item.slug}`}
                  className="block p-2.5 rounded-md hover:bg-accent/60 transition-colors group"
                >
                  <div className="mb-1">
                    <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded ${cat.className}`}>
                      {cat.label}
                    </span>
                  </div>
                  <p className="text-sm font-medium line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                    {item.title}
                  </p>
                  {dateDisplay && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 shrink-0" />
                      <span>{dateDisplay}</span>
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        )}

        {!loading && !error && (
          <div className="mt-2 pt-2 border-t border-border">
            <Link
              href="/news"
              className="flex items-center justify-center gap-1 text-xs text-primary hover:underline py-1"
            >
              Xem tất cả thông báo
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
