'use client'

import { useState, useEffect } from 'react'
import { Headphones, Search, Play, Music, Calendar, Mic } from 'lucide-react'
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
      className="group flex gap-4 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all"
    >
      {/* Cover */}
      <div className="relative shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900">
        {podcast.coverImageUrl ? (
          <img
            src={podcast.coverImageUrl}
            alt={podcast.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music className="h-8 w-8 text-purple-400" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <Play className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="white" />
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {podcast.title}
          </h3>
          {podcast.isFeatured && (
            <Badge className="shrink-0 bg-yellow-500 text-white text-xs">Nổi bật</Badge>
          )}
        </div>

        {podcast.host && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Mic className="h-3 w-3" />
            <span>{podcast.host}</span>
          </div>
        )}

        {podcast.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{podcast.description}</p>
        )}

        <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
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
          {podcast.category && <Badge variant="outline" className="text-xs px-1.5 py-0">{podcast.category}</Badge>}
        </div>
      </div>
    </Link>
  )
}

export default function PodcastsPage() {
  const [podcasts, setPodcasts] = useState<Podcast[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  async function fetchPodcasts(p: number, kw: string) {
    setLoading(true)
    try {
      const params = new URLSearchParams({ isActive: 'true', page: String(p), limit: '15' })
      if (kw) params.set('keyword', kw)
      const res = await fetch(`/api/podcasts?${params}`)
      const data = await res.json()
      if (data.success) {
        setPodcasts(data.data.podcasts)
        setTotalPages(data.data.pagination.totalPages)
        setTotal(data.data.pagination.total)
      }
    } catch {
      // silent
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

  return (
    <div className="max-w-3xl mx-auto px-0 sm:px-0 py-10 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-purple-100 dark:bg-purple-900 mb-2">
          <Headphones className="h-7 w-7 text-purple-600 dark:text-purple-300" />
        </div>
        <h1 className="text-3xl font-bold">Podcast</h1>
        <p className="text-muted-foreground">Lắng nghe các tập podcast về nghệ thuật quân sự, chiến lược, lịch sử và khoa học quốc phòng</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Tìm kiếm podcast..."
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
        />
      </form>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : podcasts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Music className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Chưa có podcast nào</p>
        </div>
      ) : (
        <>
          <div className="text-sm text-muted-foreground">{total} tập podcast</div>
          <div className="space-y-3">
            {podcasts.map(podcast => (
              <PodcastCard key={podcast.id} podcast={podcast} />
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Trước
          </button>
          <span className="px-4 py-2 text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  )
}
