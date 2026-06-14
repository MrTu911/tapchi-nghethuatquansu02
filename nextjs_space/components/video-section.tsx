'use client'

import { useState, useEffect } from 'react'
import { Play, Loader2, Eye, Calendar, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface VideoItem {
  id: string
  title: string
  description?: string
  embedUrl: string
  thumbnailUrl?: string
  videoType?: string
  videoUrl?: string
  videoId?: string
  views?: number
  publishedAt?: string
}

interface VideoSectionProps {
  videos?: VideoItem[]
}

const getYouTubeEmbedUrl = (videoUrl: string, videoId?: string): string => {
  if (videoId) return `https://www.youtube.com/embed/${videoId}`
  const match = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)
  if (match?.[1]) return `https://www.youtube.com/embed/${match[1]}`
  return videoUrl
}

const getYouTubeThumbnail = (videoUrl: string, videoId?: string): string => {
  if (videoId) return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
  const match = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)
  if (match?.[1]) return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`
  return ''
}

function formatVideoDate(iso?: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function VideoSection({ videos: propVideos }: VideoSectionProps) {
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null)
  const [videos, setVideos] = useState<VideoItem[]>(propVideos || [])
  const [loading, setLoading] = useState(!propVideos || propVideos.length === 0)

  useEffect(() => {
    if (propVideos && propVideos.length > 0) return

    const controller = new AbortController()

    const fetchVideos = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/videos?isActive=true&limit=8', { signal: controller.signal })
        const data = await response.json()
        if (data.success && data.data.videos?.length > 0) {
          const transformed: VideoItem[] = data.data.videos.map((v: {
            id: string; title: string; description?: string; videoType: string;
            videoUrl: string; videoId?: string; thumbnailUrl?: string;
            views?: number; publishedAt?: string;
          }) => ({
            id: v.id,
            title: v.title,
            description: v.description,
            embedUrl: v.videoType === 'youtube'
              ? getYouTubeEmbedUrl(v.videoUrl, v.videoId)
              : v.videoUrl,
            thumbnailUrl: v.videoType === 'youtube'
              ? getYouTubeThumbnail(v.videoUrl, v.videoId)
              : v.thumbnailUrl || '',
            videoType: v.videoType,
            videoUrl: v.videoUrl,
            videoId: v.videoId,
            views: v.views || 0,
            publishedAt: v.publishedAt,
          }))
          setVideos(transformed)
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return
        // silent fail — section just won't show
      } finally {
        setLoading(false)
      }
    }

    fetchVideos()
    return () => controller.abort()
  }, [propVideos])

  const mainVideo = selectedVideo || videos[0] || null

  if (loading) {
    return (
      <div className="bg-neutral-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 p-8 flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#8B1A1A]" />
      </div>
    )
  }

  if (!mainVideo) return null

  return (
    <section className="bg-neutral-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="p-5">
        {/* Section header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="w-1 h-6 bg-[#8B1A1A] rounded-full inline-block" />
            <Play className="w-4 h-4 text-[#8B1A1A]" fill="#8B1A1A" />
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
              Tin Tức Video
            </h2>
          </div>
          <Link
            href="/videos"
            className="text-xs text-[#8B1A1A] hover:underline flex items-center gap-0.5 font-medium"
          >
            Xem tất cả <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Desktop 65/35 — player left, playlist right */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">

          {/* Main player */}
          <div className="space-y-3">
            <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden shadow-md">
              {mainVideo.videoType === 'upload' ? (
                <video
                  key={mainVideo.id}
                  src={mainVideo.embedUrl}
                  controls
                  className="w-full h-full"
                  controlsList="nodownload"
                />
              ) : (
                <iframe
                  key={mainVideo.id}
                  src={mainVideo.embedUrl}
                  title={mainVideo.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 leading-snug">
                {mainVideo.title}
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-400 mt-1.5">
                <span className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  {(mainVideo.views || 0).toLocaleString()} lượt xem
                </span>
                {mainVideo.publishedAt && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {formatVideoDate(mainVideo.publishedAt)}
                  </span>
                )}
              </div>
              {mainVideo.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                  {mainVideo.description}
                </p>
              )}
            </div>
          </div>

          {/* Playlist sidebar */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
              Danh sách video
            </p>
            {videos.slice(0, 6).map((video) => {
              const isActive = mainVideo.id === video.id
              return (
                <button
                  key={video.id}
                  onClick={() => setSelectedVideo(video)}
                  className={`flex gap-2.5 p-2 rounded-lg text-left transition-all w-full ${
                    isActive
                      ? 'border-l-4 border-[#8B1A1A] bg-[#FDF5E6] dark:bg-[#6B1313]/40 border-t border-r border-b border-[#8B1A1A]/20'
                      : 'border border-neutral-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-[#FDF5E6] dark:hover:bg-gray-700 hover:border-[#8B1A1A]/20'
                  }`}
                >
                  <div className="relative w-20 h-[52px] flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
                    {video.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : video.videoType === 'upload' && video.videoUrl ? (
                      <video
                        src={video.videoUrl}
                        className="w-full h-full object-cover"
                        muted
                        preload="metadata"
                        playsInline
                        onLoadedMetadata={(e) => {
                          const v = e.currentTarget
                          if (v.duration > 2) v.currentTime = 2
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                      <Play className="w-4 h-4 text-white" fill="white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold line-clamp-2 leading-snug ${
                      isActive ? 'text-[#8B1A1A] dark:text-amber-400' : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {video.title}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {(video.views || 0).toLocaleString()}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
