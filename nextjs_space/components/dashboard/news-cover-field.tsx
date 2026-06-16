"use client"

import { useRef, useState, type DragEvent } from 'react'
import { toast } from 'sonner'
import { Upload, X, Image as ImageIcon, Loader2, Replace } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MediaPicker } from '@/components/media-picker'
import { getImageUrl } from '@/lib/image-utils-client'
import { cn } from '@/lib/utils'

const MAX_COVER_BYTES = 5 * 1024 * 1024

interface NewsCoverFieldProps {
  /** Giá trị lưu trữ: cloudStoragePath/key hoặc URL */
  value: string
  onChange: (value: string) => void
  /** Signed URL ưu tiên hiển thị (nếu có từ API) */
  previewUrl?: string | null
}

/**
 * Trường chọn ảnh đại diện cho tin tức:
 * kéo-thả, tải lên mới, chọn từ thư viện media, xem trước và gỡ ảnh.
 */
export function NewsCoverField({ value, onChange, previewUrl }: NewsCoverFieldProps) {
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [showMediaPicker, setShowMediaPicker] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh')
      return
    }
    if (file.size > MAX_COVER_BYTES) {
      toast.error('Kích thước ảnh không được vượt quá 5MB')
      return
    }

    try {
      setUploading(true)
      const fd = new FormData()
      fd.append('image', file)
      const res = await fetch('/api/news/upload-image', {
        method: 'POST',
        credentials: 'include',
        body: fd,
      })
      const data = await res.json()
      if (data.success) {
        // Lưu key/cloudStoragePath (bền vững) thay vì signed URL (hết hạn)
        onChange(data.data.key || data.data.url)
        toast.success('Đã tải ảnh đại diện lên')
      } else {
        toast.error(data.message || data.error || 'Lỗi khi tải ảnh lên')
      }
    } catch {
      toast.error('Lỗi kết nối khi tải ảnh lên')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) uploadFile(file)
  }

  const displaySrc = previewUrl || getImageUrl(value)

  if (value) {
    return (
      <div className="space-y-3">
        <div className="relative aspect-video overflow-hidden rounded-lg border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displaySrc}
            alt="Ảnh đại diện tin tức"
            className="h-full w-full object-cover"
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.opacity = '0.3'
            }}
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute right-2 top-2 h-7 w-7 p-0"
            onClick={() => onChange('')}
            aria-label="Gỡ ảnh đại diện"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => setShowMediaPicker(true)}
          >
            <Replace className="mr-2 h-4 w-4" />
            Đổi ảnh
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Tải lên
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) uploadFile(file)
            e.target.value = ''
          }}
        />
        <MediaPicker
          open={showMediaPicker}
          onClose={() => setShowMediaPicker(false)}
          onSelect={(media) => {
            onChange(media.cloudStoragePath)
            setShowMediaPicker(false)
            toast.success('Đã chọn ảnh đại diện')
          }}
          allowUpload
        />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors',
          dragging
            ? 'border-[#1E3924] bg-[#1E3924]/5 dark:border-emerald-500'
            : 'border-gray-200 hover:border-gray-300 dark:border-gray-700',
        )}
      >
        {uploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-[#1E3924] dark:text-emerald-400" />
        ) : (
          <ImageIcon className="h-8 w-8 text-gray-300" />
        )}
        <p className="text-sm text-gray-500">
          Kéo-thả ảnh vào đây hoặc <span className="font-medium text-[#1E3924] dark:text-emerald-400">bấm để chọn</span>
        </p>
        <p className="text-[11px] text-gray-400">PNG, JPG, WEBP · tối đa 5MB · đề nghị 1200×630px</p>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => setShowMediaPicker(true)}
      >
        <ImageIcon className="mr-2 h-4 w-4" />
        Chọn từ thư viện ảnh
      </Button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) uploadFile(file)
          e.target.value = ''
        }}
      />

      <MediaPicker
        open={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={(media) => {
          onChange(media.cloudStoragePath)
          setShowMediaPicker(false)
          toast.success('Đã chọn ảnh đại diện')
        }}
        allowUpload
      />
    </div>
  )
}
