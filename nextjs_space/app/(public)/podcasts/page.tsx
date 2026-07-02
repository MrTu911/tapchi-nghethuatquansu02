'use client'

import { useState, useEffect } from 'react'
import { Headphones, Search, Play, Music, Calendar, Mic, AlertCircle, RefreshCw, Star, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface Podcast {
  id: string
  title: string
  titleEn: string | null
  description: string | null
  coverImageUrl: string | null
  host: string | null
  episodeNumber: number | null
  seasonNumber: number | null
  duration: number | null
  category: string | null
  tags: string[]
  isFeatured: boolean
  plays: number
  publishedAt: string | null
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return ''
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function PodcastCard({ podcast, highlight = false }: { podcast: Podcast; highlight?: boolean }) {
  return (
    <Link
      href={`/podcasts/${podcast.id}`}
      className={`group flex h-full gap-4 rounded-xl border bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:bg-gray-900 ${
        highlight
          ? 'border-[#E5C86E]/60 ring-1 ring-[#E5C86E]/40 dark:border-[#E5C86E]/40'
          : 'border-[#1E3924]/10 hover:border-[#1E3924]/30 dark:border-gray-800'
      }`}
    >
      {/* Cover */}
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-[#1E3924] to-[#2f5a3a]">
        {podcast.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={podcast.coverImageUrl}
            alt={podcast.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Music className="h-8 w-8 text-[#E5C86E]" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/25">
          <Play className="h-6 w-6 text-white opacity-0 transition-opacity group-hover:opacity-100" fill="white" />
        </div>
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-semibold transition-colors group-hover:text-[#1E3924] dark:group-hover:text-[#E5C86E]">
            {podcast.title}
          </h3>
          {podcast.isFeatured && (
            <Badge className="shrink-0 bg-[#E5C86E] text-xs text-[#1E3924] hover:bg-[#E5C86E]">Nổi bật</Badge>
          )}
        </div>

        {podcast.host && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Mic className="h-3 w-3" />
            <span className="truncate">{podcast.host}</span>
          </div>
        )}

        {podcast.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">{podcast.description}</p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs text-muted-foreground">
          {(podcast.seasonNumber || podcast.episodeNumber) && (
            <span>
              {podcast.seasonNumber ? `S${podcast.seasonNumber} ` : ''}
              {podcast.episodeNumber ? `E${podcast.episodeNumber}` : ''}
            </span>
          )}
          {podcast.duration && <span>{formatDuration(podcast.duration)}</span>}
          <span className="flex items-center gap-1">
            <Headphones className="h-3 w-3" />
            {podcast.plays.toLocaleString()}
          </span>
          {podcast.publishedAt && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(podcast.publishedAt)}
            </span>
          )}
          {podcast.category && (
            <Badge variant="outline" className="border-[#1E3924]/20 px-1.5 py-0 text-xs">{podcast.category}</Badge>
          )}
        </div>
      </div>
    </Link>
  )
}

function SectionHeading({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-5 w-1 rounded-full ${accent ? 'bg-[#E5C86E]' : 'bg-[#1E3924]/40'}`} />
      <h2 className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-[#1E3924] dark:text-[#E5C86E]">
        {children}
      </h2>
    </div>
  )
}

export default function PodcastsPage() {
  const [podcasts, setPodcasts] = useState<Podcast[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  async function fetchPodcasts(p: number, kw: string) {
    setLoading(true)
    setError(false)
    try {
      const params = new URLSearchParams({ isActive: 'true', page: String(p), limit: '18' })
      if (kw) params.set('keyword', kw)
      const res = await fetch(`/api/podcasts?${params}`)
      const data = await res.json()
      if (data.success) {
        setPodcasts(data.data.podcasts)
        setTotalPages(data.data.pagination.totalPages)
        setTotal(data.data.pagination.total)
      } else {
        setError(true)
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPodcasts(page, keyword)
  }, [page, keyword])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    fetchPodcasts(1, keyword)
  }

  // Dải "Nổi bật" chỉ hiển thị ở trang đầu khi không tìm kiếm; danh sách chính bỏ các tập đã nổi bật để tránh trùng.
  const showFeatured = page === 1 && !keyword
  const featured = showFeatured ? podcasts.filter((p) => p.isFeatured) : []
  const mainList = showFeatured ? podcasts.filter((p) => !p.isFeatured) : podcasts

  return (
    <div className="mx-auto max-w-[1280px] space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E3924] to-[#2f5a3a] px-6 py-8 text-white shadow-sm sm:px-8 sm:py-10">
        <div className="flex items-center gap-2 text-xs text-[#F9F9F9]/70">
          <Link href="/" className="transition-colors hover:text-[#E5C86E]">Trang chủ</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[#F9F9F9]">Podcast</span>
        </div>
        <div className="mt-3 flex items-start gap-4">
          <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-[#E5C86E]/40">
            <Headphones className="h-7 w-7 text-[#E5C86E]" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold sm:text-3xl">Podcast</h1>
            <p className="max-w-2xl text-sm text-[#F9F9F9]/80">
              Lắng nghe các tập podcast về nghệ thuật quân sự, chiến lược, lịch sử và khoa học quốc phòng.
            </p>
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="relative mt-5 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1E3924]/50" />
          <Input
            className="border-0 bg-white pl-9 text-[#1E3924] placeholder:text-[#1E3924]/50 focus-visible:ring-2 focus-visible:ring-[#E5C86E]"
            placeholder="Tìm kiếm podcast..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </form>
      </div>

      {/* List */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-[#1E3924]/5 dark:bg-gray-800" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center py-16 text-center text-muted-foreground">
          <AlertCircle className="mb-3 h-12 w-12 text-rose-400" />
          <p className="mb-4">Không tải được danh sách podcast. Vui lòng thử lại.</p>
          <button
            onClick={() => fetchPodcasts(page, keyword)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1E3924] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#25482d]"
          >
            <RefreshCw className="h-4 w-4" />
            Thử lại
          </button>
        </div>
      ) : podcasts.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <Music className="mx-auto mb-3 h-12 w-12 opacity-30" />
          <p>{keyword ? 'Không tìm thấy podcast phù hợp' : 'Chưa có podcast nào'}</p>
        </div>
      ) : (
        <>
          {/* Dải nổi bật (chỉ ở trang đầu, không tìm kiếm) */}
          {featured.length > 0 && (
            <section className="space-y-3">
              <SectionHeading accent>
                <Star className="h-4 w-4 fill-[#E5C86E] text-[#E5C86E]" />
                Nổi bật
              </SectionHeading>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((podcast) => (
                  <PodcastCard key={`feat-${podcast.id}`} podcast={podcast} highlight />
                ))}
              </div>
            </section>
          )}

          {mainList.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                {featured.length > 0 ? (
                  <SectionHeading>Tất cả tập podcast</SectionHeading>
                ) : (
                  <span />
                )}
                <span className="text-sm text-muted-foreground">{total} tập podcast</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {mainList.map((podcast) => (
                  <PodcastCard key={podcast.id} podcast={podcast} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Pagination */}
      {!error && totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border border-[#1E3924]/20 px-4 py-2 text-sm transition-colors hover:bg-[#1E3924]/5 disabled:opacity-40 dark:hover:bg-gray-800"
          >
            Trước
          </button>
          <span className="px-4 py-2 text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-[#1E3924]/20 px-4 py-2 text-sm transition-colors hover:bg-[#1E3924]/5 disabled:opacity-40 dark:hover:bg-gray-800"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  )
}
