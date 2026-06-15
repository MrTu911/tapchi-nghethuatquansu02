'use client'

import { useState, useEffect, useRef } from 'react'
import { Headphones, Mic, ChevronRight, Play, Pause, Music } from 'lucide-react'
import Link from 'next/link'

interface PodcastItem {
  id: string
  title: string
  host: string | null
  coverImageUrl: string | null
  audioUrl: string | null
  duration: number | null
  episodeNumber: number | null
  seasonNumber: number | null
  category: string | null
  plays: number
  publishedAt: string | null
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return ''
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function PodcastCard({
  podcast,
  isPlaying,
  onPlay,
}: {
  podcast: PodcastItem
  isPlaying: boolean
  onPlay: (podcast: PodcastItem) => void
}) {
  return (
    <div className="flex gap-3 items-start group">
      {/* Cover */}
      <button
        className="relative shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900"
        onClick={() => onPlay(podcast)}
        aria-label={isPlaying ? 'Dừng' : 'Phát'}
      >
        {podcast.coverImageUrl ? (
          <img
            src={podcast.coverImageUrl}
            alt={podcast.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music className="h-6 w-6 text-purple-400" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {isPlaying ? (
            <Pause className="h-5 w-5 text-white" fill="white" />
          ) : (
            <Play className="h-5 w-5 text-white" fill="white" />
          )}
        </div>
        {isPlaying && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Pause className="h-5 w-5 text-white" fill="white" />
          </div>
        )}
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/podcasts/${podcast.id}`}
          className="block text-sm font-medium line-clamp-2 leading-snug hover:text-primary transition-colors"
        >
          {podcast.title}
        </Link>
        <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
          {podcast.host && (
            <div className="flex items-center gap-1">
              <Mic className="h-3 w-3" />
              <span>{podcast.host}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            {(podcast.seasonNumber || podcast.episodeNumber) && (
              <span>
                {podcast.seasonNumber ? `S${podcast.seasonNumber}` : ''}
                {podcast.episodeNumber ? `E${podcast.episodeNumber}` : ''}
              </span>
            )}
            {podcast.duration && <span>{formatDuration(podcast.duration)}</span>}
            <span className="flex items-center gap-1">
              <Headphones className="h-3 w-3" />
              {podcast.plays.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PodcastSection() {
  const [podcasts, setPodcasts] = useState<PodcastItem[]>([])
  const [loading, setLoading] = useState(true)
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    fetch('/api/podcasts?isActive=true&limit=5')
      .then(r => r.json())
      .then(data => {
        if (data.success) setPodcasts(data.data.podcasts)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function handlePlay(podcast: PodcastItem) {
    const audio = audioRef.current
    if (!podcast.audioUrl || !audio) return

    // Cùng track: chỉ tạm dừng / phát tiếp, KHÔNG nạp lại src để tránh tua về đầu.
    if (currentId === podcast.id) {
      if (audio.paused) audio.play().catch(() => {})
      else audio.pause()
      return
    }

    // Track mới: nạp src và phát từ đầu.
    audio.src = podcast.audioUrl
    audio.play().catch(() => {})
    setCurrentId(podcast.id)
  }

  function toggleCurrent() {
    const audio = audioRef.current
    if (!audio || !currentId) return
    if (audio.paused) audio.play().catch(() => {})
    else audio.pause()
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.pause()
    }
  }, [])

  if (!loading && podcasts.length === 0) return null

  return (
    <section className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center">
            <Headphones className="h-4 w-4 text-white" />
          </div>
          <h2 className="font-bold text-base text-gray-900 dark:text-gray-100">Podcast</h2>
        </div>
        <Link
          href="/podcasts"
          className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 hover:underline font-medium"
        >
          Xem tất cả
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3">
                <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {podcasts.map(podcast => (
              <PodcastCard
                key={podcast.id}
                podcast={podcast}
                isPlaying={currentId === podcast.id && isPlaying}
                onPlay={handlePlay}
              />
            ))}
          </div>
        )}
      </div>

      {/* Inline player bar — hiển thị khi đã chọn một tập */}
      {currentId && (
        <div className="px-4 py-2 bg-purple-600 text-white flex items-center gap-2 text-xs">
          <button
            onClick={toggleCurrent}
            className="shrink-0 hover:opacity-80"
            aria-label={isPlaying ? 'Tạm dừng' : 'Phát tiếp'}
          >
            {isPlaying ? (
              <Pause className="h-3.5 w-3.5" fill="white" />
            ) : (
              <Play className="h-3.5 w-3.5" fill="white" />
            )}
          </button>
          <span className="truncate flex-1">
            {podcasts.find(p => p.id === currentId)?.title}
          </span>
          <Headphones className={`h-3.5 w-3.5 shrink-0 ${isPlaying ? 'animate-pulse' : 'opacity-60'}`} />
        </div>
      )}
    </section>
  )
}
