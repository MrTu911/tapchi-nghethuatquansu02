'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Loader2,
  Gauge,
  Download,
  Music,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Trình phát podcast tùy biến theo bản sắc Tạp chí Nghệ thuật Quân sự Việt Nam
 * (xanh quân sự #1E3924 + vàng đồng #E5C86E). Thay cho <audio controls> mặc định
 * của trình duyệt để đồng bộ thương hiệu và bổ sung UX: tua ±15s, đổi tốc độ,
 * âm lượng, thanh seek có hiển thị phần đã đệm (buffered).
 *
 * Là client component thuần trình bày + tương tác media; không chứa business logic.
 * Dùng ở trang chi tiết podcast công khai và dialog xem trước ở trang quản lý.
 */

const SPEEDS = [1, 1.25, 1.5, 2] as const

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m}:${s.toString().padStart(2, '0')}`
}

interface PodcastPlayerProps {
  src: string
  title?: string
  coverUrl?: string | null
  /** Thời lượng đã biết (giây) để hiển thị ngay trước khi audio nạp xong metadata. */
  duration?: number | null
  variant?: 'full' | 'compact'
  className?: string
}

export function PodcastPlayer({
  src,
  title,
  coverUrl,
  duration,
  variant = 'full',
  className,
}: PodcastPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [total, setTotal] = useState(duration && duration > 0 ? duration : 0)
  const [buffered, setBuffered] = useState(0)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [speedIdx, setSpeedIdx] = useState(0)

  // Reset trạng thái khi đổi nguồn phát.
  useEffect(() => {
    setIsPlaying(false)
    setCurrent(0)
    setBuffered(0)
    setReady(false)
    setFailed(false)
    setSpeedIdx(0)
    setTotal(duration && duration > 0 ? duration : 0)
  }, [src, duration])

  function togglePlay() {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) audio.play().catch(() => setFailed(true))
    else audio.pause()
  }

  function seekBy(delta: number) {
    const audio = audioRef.current
    if (!audio) return
    const max = audio.duration || total || 0
    audio.currentTime = Math.min(Math.max(0, audio.currentTime + delta), max)
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current
    if (!audio) return
    const value = Number(e.target.value)
    audio.currentTime = value
    setCurrent(value)
  }

  function cycleSpeed() {
    const next = (speedIdx + 1) % SPEEDS.length
    setSpeedIdx(next)
    if (audioRef.current) audioRef.current.playbackRate = SPEEDS[next]
  }

  function toggleMute() {
    const audio = audioRef.current
    if (!audio) return
    audio.muted = !audio.muted
    setMuted(audio.muted)
  }

  function handleVolume(e: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current
    if (!audio) return
    const value = Number(e.target.value)
    audio.volume = value
    setVolume(value)
    audio.muted = value === 0
    setMuted(value === 0)
  }

  function updateBuffered() {
    const audio = audioRef.current
    if (!audio || audio.buffered.length === 0) return
    try {
      setBuffered(audio.buffered.end(audio.buffered.length - 1))
    } catch {
      /* buffered ranges có thể ném lỗi khi rỗng — bỏ qua */
    }
  }

  const playedPct = total > 0 ? Math.min((current / total) * 100, 100) : 0
  const bufferedPct = total > 0 ? Math.min((buffered / total) * 100, 100) : 0
  const compact = variant === 'compact'

  return (
    <div
      className={cn(
        'rounded-2xl border border-[#1E3924]/15 bg-gradient-to-br from-[#1E3924]/[0.06] to-[#E5C86E]/[0.12] p-4 shadow-sm dark:border-[#E5C86E]/20 dark:from-[#1E3924]/40 dark:to-[#1E3924]/10 sm:p-5',
        className
      )}
    >
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration
          if (Number.isFinite(d) && d > 0) setTotal(d)
          setReady(true)
        }}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onProgress={updateBuffered}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onError={() => setFailed(true)}
        className="hidden"
      />

      <div className="flex items-center gap-4">
        {/* Cover (chỉ ở variant full) */}
        {!compact && (
          <div className="hidden h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-[#1E3924] to-[#2f5a3a] shadow-md sm:block">
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverUrl} alt={title || 'Podcast'} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Music className="h-7 w-7 text-[#E5C86E]" />
              </div>
            )}
          </div>
        )}

        {/* Nút play/pause chính */}
        <button
          type="button"
          onClick={togglePlay}
          disabled={failed}
          aria-label={isPlaying ? 'Tạm dừng' : 'Phát'}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#1E3924] text-white shadow-lg ring-2 ring-[#E5C86E]/50 transition-transform hover:scale-105 hover:bg-[#25482d] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#E5C86E] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {failed ? (
            <VolumeX className="h-6 w-6" />
          ) : !ready && isPlaying ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-6 w-6" fill="currentColor" />
          ) : (
            <Play className="ml-0.5 h-6 w-6" fill="currentColor" />
          )}
        </button>

        {/* Seek + thời gian + điều khiển phụ */}
        <div className="min-w-0 flex-1 space-y-2">
          {title && !compact && (
            <p className="truncate text-sm font-semibold text-[#1E3924] dark:text-[#E5C86E]">{title}</p>
          )}

          {/* Thanh seek */}
          <div className="group relative h-2 w-full rounded-full bg-[#1E3924]/15 dark:bg-white/10">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-[#1E3924]/25 dark:bg-white/20"
              style={{ width: `${bufferedPct}%` }}
              aria-hidden
            />
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-[#E5C86E]"
              style={{ width: `${playedPct}%` }}
              aria-hidden
            />
            <span
              className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#1E3924] bg-[#E5C86E] opacity-0 shadow transition-opacity group-hover:opacity-100"
              style={{ left: `${playedPct}%` }}
              aria-hidden
            />
            <input
              type="range"
              min={0}
              max={total || 0}
              step="any"
              value={current}
              onChange={handleSeek}
              aria-label="Tua vị trí phát"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium tabular-nums text-[#1E3924]/70 dark:text-white/60">
              {formatTime(current)} / {formatTime(total)}
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => seekBy(-15)}
                aria-label="Tua lùi 15 giây"
                className="rounded-md p-1.5 text-[#1E3924]/70 transition-colors hover:bg-[#1E3924]/10 hover:text-[#1E3924] dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => seekBy(15)}
                aria-label="Tua tới 15 giây"
                className="rounded-md p-1.5 text-[#1E3924]/70 transition-colors hover:bg-[#1E3924]/10 hover:text-[#1E3924] dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <RotateCw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={cycleSpeed}
                aria-label="Đổi tốc độ phát"
                className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-semibold text-[#1E3924]/70 transition-colors hover:bg-[#1E3924]/10 hover:text-[#1E3924] dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <Gauge className="h-4 w-4" />
                {SPEEDS[speedIdx]}x
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hàng dưới: âm lượng + tải về (chỉ variant full) */}
      {!compact && (
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#1E3924]/10 pt-3 dark:border-white/10">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? 'Bật tiếng' : 'Tắt tiếng'}
              className="rounded-md p-1 text-[#1E3924]/70 transition-colors hover:text-[#1E3924] dark:text-white/70 dark:hover:text-white"
            >
              {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={handleVolume}
              aria-label="Âm lượng"
              className="h-1.5 w-24 cursor-pointer"
              style={{ accentColor: '#1E3924' }}
            />
          </div>

          <a
            href={src}
            download
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-[#1E3924]/70 transition-colors hover:bg-[#1E3924]/10 hover:text-[#1E3924] dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <Download className="h-3.5 w-3.5" />
            Tải về
          </a>
        </div>
      )}

      {failed && (
        <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">
          Không phát được âm thanh. Vui lòng{' '}
          <a href={src} download className="underline">
            tải về
          </a>{' '}
          để nghe.
        </p>
      )}
    </div>
  )
}
