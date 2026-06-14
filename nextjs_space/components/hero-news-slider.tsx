'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Eye, Newspaper } from 'lucide-react'

export interface HeroSlideItem {
  id: string
  slug: string
  title: string
  summary?: string | null
  coverImage?: string | null
  category?: string | null
  publishedAt?: string | null
  createdAt: string
  views: number
  author?: { fullName: string } | null
}

interface HeroNewsSliderProps {
  news: HeroSlideItem[]
  autoPlayInterval?: number
}

const CATEGORY_LABELS: Record<string, string> = {
  hoat_dong: 'Hoạt động học viện',
  nghien_cuu: 'Nghiên cứu khoa học',
  thong_bao: 'Thông báo',
  dao_tao: 'Đào tạo',
  su_kien: 'Sự kiện',
  hop_tac_quoc_te: 'Hợp tác quốc tế',
  announcement: 'Thông báo',
  event: 'Sự kiện',
  call_for_paper: 'Call for Papers',
  policy: 'Chính sách',
  research_news: 'Tin nghiên cứu',
  interview: 'Phỏng vấn',
  award: 'Giải thưởng',
  conference: 'Hội thảo',
}

function formatDate(iso?: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default function HeroNewsSlider({
  news,
  autoPlayInterval = 5000,
}: HeroNewsSliderProps) {
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const goTo = useCallback((index: number) => {
    setCurrent(index)
  }, [])

  const prev = useCallback(() => {
    setCurrent(c => (c - 1 + news.length) % news.length)
  }, [news.length])

  const next = useCallback(() => {
    setCurrent(c => (c + 1) % news.length)
  }, [news.length])

  useEffect(() => {
    if (isPaused || news.length <= 1) return
    const timer = setInterval(next, autoPlayInterval)
    return () => clearInterval(timer)
  }, [isPaused, next, news.length, autoPlayInterval])

  if (!news || news.length === 0) return null

  return (
    <div
      className="relative rounded-xl overflow-hidden shadow-md bg-gray-900"
      style={{ aspectRatio: '16/7' }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides */}
      {news.map((slide, idx) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            idx === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          {slide.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={slide.coverImage}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#6B1313] to-[#8B1A1A] flex items-center justify-center">
              <Newspaper className="w-20 h-20 text-white/10" />
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
        </div>
      ))}

      {/* Slide content */}
      <div className="absolute bottom-0 left-0 right-0 z-20 px-5 pb-5 pt-16 sm:px-7 sm:pb-6">
        {news[current].category && (
          <span className="inline-block bg-[#D4A843] text-[#1a1a1a] text-[11px] font-bold px-2.5 py-0.5 rounded-full mb-2 uppercase tracking-wide">
            {CATEGORY_LABELS[news[current].category!] ?? news[current].category}
          </span>
        )}

        <Link href={`/news/${news[current].slug}`} className="group block">
          <h2 className="text-white font-bold text-xl sm:text-2xl leading-snug line-clamp-2 mb-3 group-hover:text-[#C8960C] transition-colors">
            {news[current].title}
          </h2>
        </Link>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-white/60 text-xs flex-wrap">
            {news[current].author && (
              <span className="text-white/70">{news[current].author!.fullName}</span>
            )}
            <span>{formatDate(news[current].publishedAt || news[current].createdAt)}</span>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {news[current].views.toLocaleString()}
            </span>
          </div>

          <Link
            href={`/news/${news[current].slug}`}
            className="flex-shrink-0 text-xs text-white bg-[#8B1A1A]/80 hover:bg-[#8B1A1A] px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors"
          >
            Xem chi tiết <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Prev / Next buttons */}
      {news.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/30 hover:bg-black/55 flex items-center justify-center text-white transition-colors"
            aria-label="Trước"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/30 hover:bg-black/55 flex items-center justify-center text-white transition-colors"
            aria-label="Tiếp"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dot pagination */}
          <div className="absolute bottom-5 right-20 z-20 flex items-center gap-1.5">
            {news.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goTo(idx)}
                className={`rounded-full transition-all duration-300 ${
                  idx === current
                    ? 'w-5 h-2 bg-[#D4A843]'
                    : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
