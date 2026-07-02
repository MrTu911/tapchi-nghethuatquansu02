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
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { PodcastPlayer } from '@/components/podcast-player'
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
  const [status, setStatus] = useState<'ok' | 'notfound' | 'error'>('ok')
  const [related, setRelated] = useState<Podcast[]>([])

  async function load() {
    if (!id) return
    setLoading(true)
    setStatus('ok')
    try {
      const res = await fetch(`/api/podcasts/${id}`)
      const data = await res.json()
      if (data.success) {
        const current: Podcast = data.data.podcast
        setPodcast(current)
        await loadRelated(current.category)
      } else {
        setStatus(res.status === 404 ? 'notfound' : 'error')
      }
    } catch {
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  // Ưu tiên các tập cùng chuyên mục; nếu không đủ thì lấy chung.
  async function loadRelated(category: string | null) {
    try {
      if (category) {
        const res = await fetch(`/api/podcasts?isActive=true&limit=6&category=${encodeURIComponent(category)}`)
        const data = await res.json()
        if (data.success) {
          const list = data.data.podcasts.filter((p: Podcast) => p.id !== id)
          if (list.length >= 1) {
            setRelated(list.slice(0, 4))
            return
          }
        }
      }
      const res = await fetch(`/api/podcasts?isActive=true&limit=6`)
      const data = await res.json()
      if (data.success) {
        setRelated(data.data.podcasts.filter((p: Podcast) => p.id !== id).slice(0, 4))
      }
    } catch {
      // Danh sách "các tập khác" là phụ — bỏ qua nếu lỗi.
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 py-10">
        <div className="h-64 animate-pulse rounded-2xl bg-[#1E3924]/5 dark:bg-gray-800" />
        <div className="h-8 w-2/3 animate-pulse rounded bg-[#1E3924]/5 dark:bg-gray-800" />
        <div className="h-4 animate-pulse rounded bg-[#1E3924]/5 dark:bg-gray-800" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-[#1E3924]/5 dark:bg-gray-800" />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="mx-auto max-w-3xl py-10 text-center text-muted-foreground">
        <AlertCircle className="mx-auto mb-3 h-12 w-12 text-rose-400" />
        <p className="mb-4">Không tải được podcast. Vui lòng thử lại.</p>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 rounded-lg bg-[#1E3924] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#25482d]"
        >
          <RefreshCw className="h-4 w-4" />
          Thử lại
        </button>
      </div>
    )
  }

  if (status === 'notfound' || !podcast) {
    return (
      <div className="mx-auto max-w-3xl py-10 text-center text-muted-foreground">
        <Music className="mx-auto mb-3 h-12 w-12 opacity-30" />
        <p>Podcast không tồn tại hoặc đã bị xóa</p>
        <Link href="/podcasts" className="mt-4 inline-block text-sm text-[#1E3924] underline dark:text-[#E5C86E]">
          Quay lại danh sách
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-10">
      {/* Back link */}
      <Link
        href="/podcasts"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-[#1E3924] dark:hover:text-[#E5C86E]"
      >
        <ArrowLeft className="h-4 w-4" />
        Tất cả Podcast
      </Link>

      {/* Cover + Info */}
      <div className="flex items-start gap-6">
        <div className="h-40 w-40 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E3924] to-[#2f5a3a] shadow-lg">
          {podcast.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={podcast.coverImageUrl}
              alt={podcast.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Music className="h-14 w-14 text-[#E5C86E]" />
            </div>
          )}
        </div>

        <div className="flex-1 space-y-2 pt-1">
          {(podcast.seasonNumber || podcast.episodeNumber) && (
            <p className="text-sm font-medium text-muted-foreground">
              {podcast.seasonNumber ? `Mùa ${podcast.seasonNumber} · ` : ''}
              {podcast.episodeNumber ? `Tập ${podcast.episodeNumber}` : ''}
            </p>
          )}
          <h1 className="text-2xl font-bold leading-tight text-[#1E3924] dark:text-[#E5C86E]">{podcast.title}</h1>
          {podcast.titleEn && (
            <p className="text-sm italic text-muted-foreground">{podcast.titleEn}</p>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1 text-sm text-muted-foreground">
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
            <Badge className="bg-[#1E3924]/10 text-xs text-[#1E3924] dark:bg-[#1E3924]/40 dark:text-[#E5C86E]">{podcast.category}</Badge>
          )}
        </div>
      </div>

      {/* Audio Player */}
      {podcast.audioUrl && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1E3924] dark:text-[#E5C86E]">
            <Headphones className="h-4 w-4" />
            Nghe ngay
          </div>
          <PodcastPlayer
            src={podcast.audioUrl}
            title={podcast.title}
            coverUrl={podcast.coverImageUrl}
            duration={podcast.duration}
          />
          <p className="text-right text-xs text-muted-foreground">
            {podcast.plays.toLocaleString()} lượt nghe
          </p>
        </div>
      )}

      {/* Description */}
      {podcast.description && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-[#1E3924] dark:text-[#E5C86E]">Nội dung</h2>
          <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{podcast.description}</p>
          {podcast.descriptionEn && (
            <p className="mt-3 whitespace-pre-line border-l-2 border-[#E5C86E] pl-3 text-sm italic leading-relaxed text-muted-foreground">
              {podcast.descriptionEn}
            </p>
          )}
        </div>
      )}

      {/* Tags */}
      {podcast.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Tag className="h-3.5 w-3.5 text-muted-foreground" />
          {podcast.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="border-[#1E3924]/20 text-xs">{tag}</Badge>
          ))}
        </div>
      )}

      {/* Transcript */}
      {podcast.transcript && (
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-[#1E3924] dark:text-[#E5C86E]">
            <FileText className="h-4 w-4" />
            Nội dung văn bản (Transcript)
          </h2>
          <div className="max-h-80 overflow-y-auto whitespace-pre-line rounded-xl border border-[#1E3924]/10 bg-[#1E3924]/[0.03] p-4 text-sm leading-relaxed text-muted-foreground dark:border-gray-800 dark:bg-gray-900/40">
            {podcast.transcript}
          </div>
        </div>
      )}

      {/* Related podcasts */}
      {related.length > 0 && (
        <div className="space-y-4 border-t border-[#1E3924]/10 pt-4">
          <h2 className="text-lg font-semibold text-[#1E3924] dark:text-[#E5C86E]">Các tập khác</h2>
          <div className="space-y-3">
            {related.map((rel) => (
              <Link
                key={rel.id}
                href={`/podcasts/${rel.id}`}
                className="group flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-[#1E3924]/5 dark:hover:bg-gray-800/50"
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-[#1E3924] to-[#2f5a3a]">
                  {rel.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={rel.coverImageUrl} alt={rel.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Music className="h-5 w-5 text-[#E5C86E]" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium transition-colors group-hover:text-[#1E3924] dark:group-hover:text-[#E5C86E]">{rel.title}</p>
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
            className="block pt-2 text-center text-sm text-[#1E3924] hover:underline dark:text-[#E5C86E]"
          >
            Xem tất cả podcast →
          </Link>
        </div>
      )}
    </div>
  )
}
