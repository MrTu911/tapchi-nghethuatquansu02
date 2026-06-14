'use client'

import { useState, useEffect, useCallback } from 'react'
import { Play, Eye, Calendar, X, Search, Film, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

interface Video {
  id: string
  title: string
  description?: string
  videoType: string
  videoUrl: string
  videoId?: string
  thumbnailUrl?: string
  cloudStoragePath?: string
  category?: string
  tags: string[]
  isFeatured: boolean
  views: number
  publishedAt?: string
}

function getEmbedUrl(video: Video): string {
  if (video.videoType === 'youtube') {
    if (video.videoId) return `https://www.youtube.com/embed/${video.videoId}?autoplay=1`
    const m = video.videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)
    if (m?.[1]) return `https://www.youtube.com/embed/${m[1]}?autoplay=1`
  }
  return video.videoUrl
}

function getThumbnail(video: Video): string {
  if (video.videoType === 'youtube') {
    const id = video.videoId || video.videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1]
    if (id) return `https://img.youtube.com/vi/${id}/mqdefault.jpg`
  }
  return video.thumbnailUrl || ''
}

function formatDate(iso?: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function VideoCard({ video, onClick }: { video: Video; onClick: () => void }) {
  const thumb = getThumbnail(video)
  return (
    <button
      onClick={onClick}
      className="group bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all text-left w-full"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-900 overflow-hidden">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : video.videoType === 'upload' && video.cloudStoragePath ? (
          <video
            src={video.cloudStoragePath}
            className="w-full h-full object-cover"
            muted
            preload="metadata"
            onLoadedMetadata={(e) => {
              const v = e.currentTarget
              if (v.duration > 2) v.currentTime = 2
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <Film className="w-10 h-10 text-gray-600" />
          </div>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
            <Play className="w-6 h-6 text-[#295232] ml-1" fill="#295232" />
          </div>
        </div>
        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          {video.videoType === 'youtube' && (
            <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">YouTube</span>
          )}
          {video.isFeatured && (
            <span className="bg-[#D4A843] text-[#1E293B] text-[10px] font-bold px-1.5 py-0.5 rounded">⭐ Nổi bật</span>
          )}
        </div>
      </div>
      {/* Info */}
      <div className="p-3">
        <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug mb-2 group-hover:text-[#295232] transition-colors">
          {video.title}
        </h3>
        {video.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">{video.description}</p>
        )}
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{video.views.toLocaleString()}</span>
          {video.publishedAt && (
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(video.publishedAt)}</span>
          )}
          {video.category && (
            <span className="ml-auto bg-gray-100 dark:bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded text-[10px]">{video.category}</span>
          )}
        </div>
      </div>
    </button>
  )
}

function VideoModal({ video, onClose }: { video: Video; onClose: () => void }) {
  const embedUrl = getEmbedUrl(video)
  const isUpload = video.videoType === 'upload'

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden w-full max-w-4xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Player */}
        <div className="aspect-video bg-black">
          {isUpload ? (
            <video
              src={embedUrl}
              controls
              autoPlay
              className="w-full h-full"
              controlsList="nodownload"
            />
          ) : (
            <iframe
              src={embedUrl}
              title={video.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </div>
        {/* Info bar */}
        <div className="p-4 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-base text-gray-900 dark:text-gray-100 leading-snug">{video.title}</h2>
            <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{video.views.toLocaleString()} lượt xem</span>
              {video.publishedAt && <span>{formatDate(video.publishedAt)}</span>}
            </div>
            {video.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-3">{video.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

const CATEGORIES = ['Tất cả', 'giới thiệu', 'văn hóa', 'khoa học', 'lịch sử', 'phân tích', 'công nghệ']

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [playing, setPlaying] = useState<Video | null>(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Tất cả')

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/videos?isActive=true&limit=50')
      const data = await res.json()
      if (data.success) setVideos(data.data.videos || [])
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchVideos() }, [fetchVideos])

  const filtered = videos.filter((v) => {
    const matchSearch = !search ||
      v.title.toLowerCase().includes(search.toLowerCase()) ||
      (v.description || '').toLowerCase().includes(search.toLowerCase())
    const matchCat = category === 'Tất cả' || v.category === category
    return matchSearch && matchCat
  })

  const featured = filtered.filter((v) => v.isFeatured)
  const rest = filtered.filter((v) => !v.isFeatured)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
              <Link href="/" className="hover:text-[#295232]">Trang chủ</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-gray-600 dark:text-gray-300">Video</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Play className="w-6 h-6 text-[#295232]" fill="#295232" />
              Tin Tức Video
            </h1>
            <p className="text-sm text-gray-500 mt-1">{videos.length} video · Click để xem</p>
          </div>
        </div>

        {/* Search + filter */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm video..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  category === cat
                    ? 'bg-[#295232] text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-[#295232]/50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <div className="w-10 h-10 border-2 border-[#295232] border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Đang tải video...</span>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-400">
            <Film className="w-12 h-12" />
            <p className="text-sm">Không tìm thấy video phù hợp</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Featured videos */}
            {featured.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-1 h-5 bg-[#295232] rounded-full" />
                  <h2 className="font-bold text-gray-800 dark:text-gray-100 text-sm uppercase tracking-wide">Video nổi bật</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featured.map((v) => (
                    <VideoCard key={v.id} video={v} onClick={() => setPlaying(v)} />
                  ))}
                </div>
              </section>
            )}

            {/* All other videos */}
            {rest.length > 0 && (
              <section>
                {featured.length > 0 && (
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-1 h-5 bg-gray-300 rounded-full" />
                    <h2 className="font-bold text-gray-800 dark:text-gray-100 text-sm uppercase tracking-wide">Tất cả video</h2>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {rest.map((v) => (
                    <VideoCard key={v.id} video={v} onClick={() => setPlaying(v)} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* Modal player */}
      {playing && <VideoModal video={playing} onClose={() => setPlaying(null)} />}
    </div>
  )
}
