'use client'

import { useState, useEffect } from 'react'
import { Headphones, Search, Play, Music, Calendar, Mic, AlertCircle, RefreshCw, Star } from 'lucide-react'
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

function PodcastCard({ podcast }: { podcast: Podcast }) {
  return (
    <Link
      href={`/podcasts/${podcast.id}`}
      className="group flex gap-4 rounded-xl border border-[#1E3924]/10 bg-white p-4 shadow-sm transition-all hover:border-[#1E3924]/30 hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
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
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-semibold transition-colors group-hover:text-[#1E3924] dark:group-hover:text-[#E5C86E]">
            {podcast.title}
          </h3>
          {podcast.isFeatured && (
            <Badge className="shrink-0 bg-[#E5C86E] text-xs text-[#1E3924]">Nổi bật</Badge>
          )}
        </div>

        {podcast.host && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Mic className="h-3 w-3" />
            <span>{podcast.host}</span>
          </div>
        )}

        {podcast.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">{podcast.description}</p>
        )}

        <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
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
      const params = new URLSearchParams({ isActive: 'true', page: String(p), limit: '15' })
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

  const featured = podcasts.filter((p) => p.isFeatured)

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-10">
      {/* Header */}
      <div className="space-y-3 text-center">
        <div className="mb-2 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#1E3924] to-[#2f5a3a] shadow-md">
          <Headphones className="h-7 w-7 text-[#E5C86E]" />
        </div>
        <h1 className="text-3xl font-bold text-[#1E3924] dark:text-[#E5C86E]">Podcast</h1>
        <p className="text-muted-foreground">Lắng nghe các tập podcast về nghệ thuật quân sự, chiến lược, lịch sử và khoa học quốc phòng</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Tìm kiếm podcast..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </form>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
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
          {page === 1 && !keyword && featured.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#1E3924] dark:text-[#E5C86E]">
                <Star className="h-4 w-4 fill-[#E5C86E] text-[#E5C86E]" />
                Nổi bật
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {featured.slice(0, 2).map((podcast) => (
                  <PodcastCard key={`feat-${podcast.id}`} podcast={podcast} />
                ))}
              </div>
            </div>
          )}

          <div className="text-sm text-muted-foreground">{total} tập podcast</div>
          <div className="space-y-3">
            {podcasts.map((podcast) => (
              <PodcastCard key={podcast.id} podcast={podcast} />
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {!error && totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
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
