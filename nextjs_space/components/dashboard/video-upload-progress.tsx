'use client'

import { Button } from '@/components/ui/button'
import { Pause, Play, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import type { ChunkUploadStatus } from '@/hooks/use-chunked-video-upload'

interface VideoUploadProgressProps {
  status: ChunkUploadStatus
  progress: number // 0..1
  uploadedBytes: number
  totalBytes: number
  speedBps: number
  etaSec: number | null
  error?: string | null
  onPause: () => void
  onResume: () => void
  onCancel: () => void
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

function formatEta(seconds: number | null): string {
  if (seconds === null || !isFinite(seconds) || seconds <= 0) return '—'
  const s = Math.round(seconds)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const rem = s % 60
  if (m < 60) return `${m}m ${rem}s`
  const h = Math.floor(m / 60)
  return `${h}h ${m % 60}m`
}

export function VideoUploadProgress({
  status,
  progress,
  uploadedBytes,
  totalBytes,
  speedBps,
  etaSec,
  error,
  onPause,
  onResume,
  onCancel,
}: VideoUploadProgressProps) {
  const percent = Math.round(progress * 100)
  const isPaused = status === 'paused'
  const isCompleting = status === 'completing'
  const isDone = status === 'done'
  const isError = status === 'error'

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 p-4 space-y-3">
      {/* Header line */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          {isDone ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="text-emerald-700">Hoàn tất</span>
            </>
          ) : isError ? (
            <>
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-red-600">Lỗi upload</span>
            </>
          ) : isCompleting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-[#295232]" />
              <span className="text-[#295232]">Đang hoàn tất...</span>
            </>
          ) : isPaused ? (
            <>
              <Pause className="h-4 w-4 text-amber-500" />
              <span className="text-amber-600">Tạm dừng</span>
            </>
          ) : (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-[#295232]" />
              <span className="text-[#295232]">Đang tải lên...</span>
            </>
          )}
        </div>
        <span className="text-sm font-bold tabular-nums text-gray-700 dark:text-gray-200">
          {percent}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-[width] duration-200 ${
            isError ? 'bg-red-500' : isDone ? 'bg-emerald-500' : 'bg-[#295232]'
          }`}
          style={{ width: `${isDone ? 100 : percent}%` }}
        />
      </div>

      {/* Stats line */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className="tabular-nums">
          {formatBytes(uploadedBytes)} / {formatBytes(totalBytes)}
        </span>
        {!isDone && !isError && (
          <span className="tabular-nums">
            {speedBps > 0 ? `${formatBytes(speedBps)}/s` : '—'} · còn ~{formatEta(etaSec)}
          </span>
        )}
      </div>

      {isError && error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      {/* Controls */}
      {!isDone && !isError && (
        <div className="flex items-center gap-2 pt-1">
          {isPaused ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1.5"
              onClick={onResume}
              disabled={isCompleting}
            >
              <Play className="h-3.5 w-3.5" /> Tiếp tục
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1.5"
              onClick={onPause}
              disabled={isCompleting}
            >
              <Pause className="h-3.5 w-3.5" /> Tạm dừng
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 text-xs gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={onCancel}
            disabled={isCompleting}
          >
            <X className="h-3.5 w-3.5" /> Hủy
          </Button>
        </div>
      )}
    </div>
  )
}
