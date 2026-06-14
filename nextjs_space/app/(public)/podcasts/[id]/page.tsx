'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  Headphones,
  Mic,
  Calendar,
  Tag,
  FileText,
  ArrowLeft,
  Music,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface Podcast {
  id: string
  title: string
  titleEn: string | null
  description: string | null
  descriptionEn: string | null
  audioUrl: string | null
  coverImageUrl: string | null
  host: string | null
  episodeNumber: number | null
  seasonNumber: number | null
  duration: number | null
  transcript: string | null
  category: string | null
  tags: string[]
  plays: number
  publishedAt: string | null
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return ''
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}g ${m}p ${s}s`
  if (m > 0) return `${m} phút ${s} giây`
  return `${s} giây`
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export default function PodcastDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [podcast, setPodcast] = useState<Podcast | null>(null)
  const [loading, setLoading] = useState(true)
  const [related, setRelated] = useState<Podcast[]>([])

  useEffect(() => {
    if (!id) return
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/podcasts/${id}`)
        const data = await res.json()
        if (data.success) {
          setPodcast(data.data.podcast)
          // Fetch related podcasts
          const relRes = await fetch(`/api/podcasts?isActive=true&limit=5`)
          const relData = await relRes.json()
          if (relData.success) {
            setRelated(relData.data.podcasts.filter((p: Podcast) => p.id !== id).slice(0, 4))
          }
        }
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
        <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-2/3" />
        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-4/5" />
      </div>
    )
  }

  if (!podcast) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 text-center text-muted-foreground">
        <Music className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p>Podcast không tồn tại hoặc đã bị xóa</p>
        <Link href="/podcasts" className="mt-4 inline-block text-primary underline text-sm">
          Quay lại danh sách
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      {/* Back link */}
      <Link
        href="/podcasts"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Tất cả Podcast
      </Link>

      {/* Cover + Info */}
      <div className="flex gap-6 items-start">
        <div className="shrink-0 w-40 h-40 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 shadow-lg">
          {podcast.coverImageUrl ? (
            <img
              src={podcast.coverImageUrl}
              alt={podcast.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music className="h-14 w-14 text-purple-400" />
            </div>
          )}
        </div>

        <div className="flex-1 space-y-2 pt-1">
          {(podcast.seasonNumber || podcast.episodeNumber) && (
            <p className="text-sm text-muted-foreground font-medium">
              {podcast.seasonNumber ? `Mùa ${podcast.seasonNumber} · ` : ''}
              {podcast.episodeNumber ? `Tập ${podcast.episodeNumber}` : ''}
            </p>
          )}
          <h1 className="text-2xl font-bold leading-tight">{podcast.title}</h1>
          {podcast.titleEn && (
            <p className="text-sm text-muted-foreground italic">{podcast.titleEn}</p>
          )}

          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground pt-1">
            {podcast.host && (
              <span className="flex items-center gap-1">
                <Mic className="h-3.5 w-3.5" />
                {podcast.host}
              </span>
            )}
            {podcast.duration && (
              <span className="flex items-center gap-1">
                <Headphones className="h-3.5 w-3.5" />
                {formatDuration(podcast.duration)}
              </span>
            )}
            {podcast.publishedAt && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(podcast.publishedAt)}
              </span>
            )}
          </div>

          {podcast.category && (
            <Badge variant="secondary" className="text-xs">{podcast.category}</Badge>
          )}
        </div>
      </div>

      {/* Audio Player */}
      {podcast.audioUrl && (
        <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-purple-700 dark:text-purple-300">
            <Headphones className="h-4 w-4" />
            Nghe ngay
          </div>
          <audio
            controls
            className="w-full"
            src={podcast.audioUrl}
            preload="metadata"
          >
            Trình duyệt của bạn không hỗ trợ phát âm thanh.
            <a href={podcast.audioUrl} download>Tải về</a>
          </audio>
          <p className="text-xs text-muted-foreground text-right">
            {podcast.plays.toLocaleString()} lượt nghe
          </p>
        </div>
      )}

      {/* Description */}
      {podcast.description && (
        <div className="space-y-2">
          <h2 className="font-semibold text-lg">Nội dung</h2>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{podcast.description}</p>
          {podcast.descriptionEn && (
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line italic text-sm border-l-2 border-muted pl-3 mt-3">
              {podcast.descriptionEn}
            </p>
          )}
        </div>
      )}

      {/* Tags */}
      {podcast.tags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Tag className="h-3.5 w-3.5 text-muted-foreground" />
          {podcast.tags.map(tag => (
            <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
          ))}
        </div>
      )}

      {/* Transcript */}
      {podcast.transcript && (
        <div className="space-y-3">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Nội dung văn bản (Transcript)
          </h2>
          <div className="rounded-xl border bg-muted/30 p-4 text-sm leading-relaxed whitespace-pre-line max-h-80 overflow-y-auto text-muted-foreground">
            {podcast.transcript}
          </div>
        </div>
      )}

      {/* Related podcasts */}
      {related.length > 0 && (
        <div className="space-y-4 pt-4 border-t">
          <h2 className="font-semibold text-lg">Các tập khác</h2>
          <div className="space-y-3">
            {related.map(rel => (
              <Link
                key={rel.id}
                href={`/podcasts/${rel.id}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
              >
                <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900">
                  {rel.coverImageUrl ? (
                    <img src={rel.coverImageUrl} alt={rel.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="h-5 w-5 text-purple-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">{rel.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {rel.host && `${rel.host} · `}
                    {rel.plays.toLocaleString()} lượt nghe
                  </p>
                </div>
              </Link>
            ))}
          </div>
          <Link
            href="/podcasts"
            className="block text-center text-sm text-primary hover:underline pt-2"
          >
            Xem tất cả podcast →
          </Link>
        </div>
      )}
    </div>
  )
}
