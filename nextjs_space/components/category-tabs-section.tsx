'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Calendar, Eye, ChevronRight, Loader2, BookOpenText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ArticleItem {
  id: string
  title: string
  abstractVn?: string | null
  publishedAt?: string | null
  views: number
  author: { fullName: string } | null
  category: { name: string; slug: string; code: string } | null
}

interface CategoryData {
  code: string
  name: string
  slug: string
  articles: ArticleItem[]
}

interface CategoryTabsSectionProps {
  categories: CategoryData[]
}

// ── Color palette ────────────────────────────────────────────────────────────

const PALETTE: Record<string, { bg: string; text: string; light: string; border: string }> = {
  CDHD:   { bg: 'bg-red-600',     text: 'text-red-600',     light: 'bg-red-50 dark:bg-red-950/20',     border: 'border-red-200 dark:border-red-900' },
  NVDC:   { bg: 'bg-blue-700',    text: 'text-blue-700',    light: 'bg-blue-50 dark:bg-blue-950/20',   border: 'border-blue-200 dark:border-blue-900' },
  NCTD:   { bg: 'bg-emerald-600', text: 'text-emerald-700', light: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-200 dark:border-emerald-900' },
  TTKN:   { bg: 'bg-amber-500',   text: 'text-amber-700',   light: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-200 dark:border-amber-900' },
  LSHK:   { bg: 'bg-stone-600',   text: 'text-stone-700',   light: 'bg-stone-50 dark:bg-stone-950/20', border: 'border-stone-200 dark:border-stone-900' },
  LSTT:   { bg: 'bg-purple-700',  text: 'text-purple-700',  light: 'bg-purple-50 dark:bg-purple-950/20', border: 'border-purple-200 dark:border-purple-900' },
  KHKT:   { bg: 'bg-cyan-700',    text: 'text-cyan-700',    light: 'bg-cyan-50 dark:bg-cyan-950/20',   border: 'border-cyan-200 dark:border-cyan-900' },
  QTNQ:   { bg: 'bg-rose-700',    text: 'text-rose-700',    light: 'bg-rose-50 dark:bg-rose-950/20',   border: 'border-rose-200 dark:border-rose-900' },
  DBHB:   { bg: 'bg-orange-600',  text: 'text-orange-700',  light: 'bg-orange-50 dark:bg-orange-950/20', border: 'border-orange-200 dark:border-orange-900' },
  HTDT:   { bg: 'bg-green-700',   text: 'text-green-700',   light: 'bg-green-50 dark:bg-green-950/20', border: 'border-green-200 dark:border-green-900' },
  TINTUC: { bg: 'bg-sky-600',     text: 'text-sky-600',     light: 'bg-sky-50 dark:bg-sky-950/20',     border: 'border-sky-200 dark:border-sky-900' },
}

const DEFAULT_PALETTE = { bg: 'bg-slate-700', text: 'text-slate-700', light: 'bg-slate-50 dark:bg-slate-900/20', border: 'border-slate-200 dark:border-slate-800' }

const INITIAL_COUNT = 5
const LOAD_MORE_STEP = 3

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso?: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatDateShort(iso?: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' })
}

// ── Sub-components ────────────────────────────────────────────────────────────

/**
 * Featured card — first article in category, journal-standard layout
 * Inspired by MDPI / Frontiers featured article presentation
 */
function FeaturedCard({ article, palette }: { article: ArticleItem; palette: typeof DEFAULT_PALETTE }) {
  return (
    <Link
      href={`/articles/${article.id}`}
      className={cn(
        'group block p-4 sm:p-5 transition-colors',
        'hover:bg-gray-50 dark:hover:bg-gray-800/50',
      )}
    >
      {/* Metadata row */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2.5">
        {article.category && (
          <span className={cn('text-[11px] font-semibold uppercase tracking-wide', palette.text)}>
            {article.category.name}
          </span>
        )}
        {article.publishedAt && (
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Calendar className="w-3 h-3" aria-hidden="true" />
            {formatDate(article.publishedAt)}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-[15px] sm:text-base font-bold text-gray-900 dark:text-gray-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 leading-snug line-clamp-3 mb-2">
        {article.title}
      </h3>

      {/* Author */}
      {article.author && (
        <p className="text-xs text-gray-500 dark:text-gray-400 italic mb-2">
          {article.author.fullName}
        </p>
      )}

      {/* Abstract snippet */}
      {article.abstractVn && (
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed mb-3">
          {article.abstractVn}
        </p>
      )}

      {/* Footer row */}
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <Eye className="w-3 h-3" aria-hidden="true" />
          {article.views.toLocaleString()} lượt đọc
        </span>
        <span className={cn('text-xs font-semibold flex items-center gap-0.5 group-hover:underline underline-offset-2', palette.text)}>
          Đọc toàn văn <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        </span>
      </div>
    </Link>
  )
}

/**
 * Compact article row — journal list format
 * Inspired by Springer / MDPI article list style
 */
function ArticleRow({
  article,
  rank,
  palette,
  isNew,
}: {
  article: ArticleItem
  rank: number
  palette: typeof DEFAULT_PALETTE
  isNew?: boolean
}) {
  return (
    <Link
      href={`/articles/${article.id}`}
      className={cn(
        'group flex gap-3 items-start px-4 py-3 transition-all duration-300',
        'hover:bg-gray-50 dark:hover:bg-gray-800/50',
        isNew && 'animate-in fade-in slide-in-from-bottom-2 duration-300',
      )}
    >
      {/* Rank number */}
      <span
        aria-hidden="true"
        className={cn(
          'flex-shrink-0 w-5 h-5 rounded text-center leading-5 text-[11px] font-bold mt-0.5 select-none',
          rank <= 3
            ? cn(palette.bg, 'text-white')
            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500',
        )}
      >
        {rank}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-sky-600 dark:group-hover:text-sky-400 line-clamp-2 leading-snug mb-1">
          {article.title}
        </h4>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-gray-400">
          {article.author && (
            <span className="text-gray-500 dark:text-gray-400 italic truncate max-w-[160px]">
              {article.author.fullName}
            </span>
          )}
          {article.publishedAt && (
            <span className="flex items-center gap-0.5">
              <Calendar className="w-2.5 h-2.5" aria-hidden="true" />
              {formatDateShort(article.publishedAt)}
            </span>
          )}
          <span className="flex items-center gap-0.5 ml-auto">
            <Eye className="w-2.5 h-2.5" aria-hidden="true" />
            {article.views.toLocaleString()}
          </span>
        </div>
      </div>
    </Link>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CategoryTabsSection({ categories }: CategoryTabsSectionProps) {
  const [activeCode, setActiveCode] = useState(categories[0]?.code ?? '')
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT)
  const [isAutoLoading, setIsAutoLoading] = useState(false)
  const [newlyLoadedFrom, setNewlyLoadedFrom] = useState<number | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  // Store current visibleCount in a ref so IntersectionObserver always has fresh value
  const visibleCountRef = useRef(visibleCount)
  visibleCountRef.current = visibleCount

  const activeCategory = categories.find(c => c.code === activeCode)
  const palette = PALETTE[activeCode] ?? DEFAULT_PALETTE

  // Reset when tab changes
  useEffect(() => {
    setVisibleCount(INITIAL_COUNT)
    setNewlyLoadedFrom(null)
    setIsAutoLoading(false)
  }, [activeCode])

  const loadMore = useCallback(() => {
    const total = activeCategory?.articles.length ?? 0
    const current = visibleCountRef.current
    if (current >= total || isAutoLoading) return

    setIsAutoLoading(true)
    // Brief delay so spinner is visible — feels like a real load
    setTimeout(() => {
      const next = Math.min(current + LOAD_MORE_STEP, total)
      setNewlyLoadedFrom(current)
      setVisibleCount(next)
      setIsAutoLoading(false)
    }, 350)
  }, [activeCategory, isAutoLoading])

  // IntersectionObserver: auto-trigger when sentinel enters viewport
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore()
        }
      },
      { threshold: 0.1, rootMargin: '80px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore])

  if (!categories.length) return null

  const visibleArticles = activeCategory?.articles.slice(0, visibleCount) ?? []
  const totalArticles = activeCategory?.articles.length ?? 0
  const hasMore = visibleCount < totalArticles

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">

      {/* ── Tab pills ────────────────────────────────────────────────────── */}
      <div
        className="border-b border-gray-100 dark:border-gray-800 px-3 pt-3 pb-2.5 flex flex-wrap gap-1.5"
        role="tablist"
        aria-label="Chọn chuyên mục"
      >
        {categories.map(cat => {
          const isActive = cat.code === activeCode
          const p = PALETTE[cat.code] ?? DEFAULT_PALETTE
          return (
            <button
              key={cat.code}
              role="tab"
              aria-selected={isActive}
              aria-controls="category-articles-panel"
              onClick={() => setActiveCode(cat.code)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-sky-500',
                isActive
                  ? cn(p.bg, 'text-white shadow-sm scale-[1.03]')
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-[1.02]',
              )}
            >
              {cat.name.length > 24 ? cat.name.substring(0, 22) + '…' : cat.name}
            </button>
          )
        })}
      </div>

      {/* ── Section header bar ───────────────────────────────────────────── */}
      <div
        id="category-articles-panel"
        role="tabpanel"
        className={cn(palette.bg, 'px-4 py-2.5 flex items-center justify-between')}
      >
        <div className="flex items-center gap-2">
          <BookOpenText className="w-3.5 h-3.5 text-white/80" aria-hidden="true" />
          <h3 className="text-white text-[13px] font-bold tracking-wide">
            {activeCategory?.name}
          </h3>
        </div>
        <span className="text-white/60 text-xs tabular-nums">
          {totalArticles} bài
        </span>
      </div>

      {/* ── Article feed ─────────────────────────────────────────────────── */}
      {visibleArticles.length === 0 ? (
        <p className="text-center text-gray-400 py-10 text-sm">
          Chưa có bài viết trong chuyên mục này
        </p>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {visibleArticles.map((art, idx) =>
            idx === 0 ? (
              /* Featured card with abstract */
              <FeaturedCard key={art.id} article={art} palette={palette} />
            ) : (
              /* Compact journal row */
              <ArticleRow
                key={art.id}
                article={art}
                rank={idx + 1}
                palette={palette}
                isNew={newlyLoadedFrom !== null && idx >= newlyLoadedFrom}
              />
            )
          )}
        </div>
      )}

      {/* ── Auto-load sentinel ────────────────────────────────────────────── */}
      {/* The IntersectionObserver watches this element; when visible → loadMore() */}
      {hasMore && <div ref={sentinelRef} className="h-8" aria-hidden="true" />}

      {/* Loading spinner */}
      {isAutoLoading && (
        <div className="flex items-center justify-center gap-2 py-3 text-xs text-gray-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          Đang tải thêm bài…
        </div>
      )}

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/60 dark:bg-gray-900/60">
        <span className="text-[11px] text-gray-400 tabular-nums">
          {Math.min(visibleCount, totalArticles)}/{totalArticles} bài
        </span>
        <Link
          href={`/categories/${activeCategory?.slug}`}
          className={cn(
            'text-xs font-semibold flex items-center gap-0.5 transition-colors',
            palette.text,
            'hover:underline underline-offset-2',
          )}
        >
          Xem tất cả chuyên mục
          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}
