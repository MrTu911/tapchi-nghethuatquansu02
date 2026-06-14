'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  FileText, Image as ImageIcon, Download, Loader2, FileQuestion, ExternalLink,
} from 'lucide-react'

export type PreviewKind = 'pdf' | 'docx' | 'doc-legacy' | 'image' | 'other'

interface FilePreviewProps {
  /** File client-side (preview TRƯỚC khi nộp). Ưu tiên hơn url nếu có. */
  file?: File | null
  /** URL stream file đã nộp (vd /api/files/[id]/content). */
  url?: string
  fileName?: string
  mimeType?: string | null
  title?: string
  height?: string
}

/** Phân loại file theo mime + tên để chọn cách hiển thị phù hợp. */
export function detectPreviewKind(mimeType?: string | null, fileName?: string): PreviewKind {
  const m = (mimeType || '').toLowerCase()
  const n = (fileName || '').toLowerCase()
  if (m.includes('pdf') || n.endsWith('.pdf')) return 'pdf'
  // docx (OOXML) — render được bằng docx-preview
  if (m.includes('wordprocessingml') || n.endsWith('.docx')) return 'docx'
  // .doc nhị phân cũ — không render được, chỉ tải xuống
  if (m === 'application/msword' || n.endsWith('.doc')) return 'doc-legacy'
  if (m.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(n)) return 'image'
  return 'other'
}

/** Khung tải xuống dùng chung cho file không xem trực tiếp được. */
function DownloadFallback({
  icon: Icon,
  message,
  downloadUrl,
  fileName,
}: {
  icon: typeof FileText
  message: string
  downloadUrl?: string
  fileName?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <Icon className="h-12 w-12 text-muted-foreground" />
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      {downloadUrl && (
        <Button asChild variant="outline">
          <a href={downloadUrl} download={fileName}>
            <Download className="mr-1 h-4 w-4" />
            Tải xuống
          </a>
        </Button>
      )}
    </div>
  )
}

/** Xem PDF bằng iframe (PDF viewer của trình duyệt) + fallback object-tag. */
function PdfFrame({ src, fileName, height }: { src: string; fileName: string; height: string }) {
  const [useObject, setUseObject] = useState(false)
  // Không gắn fragment #toolbar vào blob: URL (preview trước khi nộp) — một số
  // trình duyệt không phân giải được blob có fragment.
  const framedSrc = src.startsWith('blob:') ? src : `${src}#toolbar=1`
  return (
    <div className="relative w-full" style={{ height }}>
      {useObject ? (
        <object data={framedSrc} type="application/pdf" className="h-full w-full border-0" title={fileName}>
          <div className="flex h-full flex-col items-center justify-center bg-muted/30 p-8 text-center">
            <FileText className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="mb-3 text-sm text-muted-foreground">Trình duyệt không hiển thị được PDF trực tiếp.</p>
            <Button asChild variant="outline" size="sm">
              <a href={src} download={fileName}><Download className="mr-1 h-4 w-4" />Tải xuống</a>
            </Button>
          </div>
        </object>
      ) : (
        <iframe
          src={framedSrc}
          className="h-full w-full border-0"
          title={fileName}
          onError={() => setUseObject(true)}
        />
      )}
    </div>
  )
}

/** Render nội dung DOCX bằng docx-preview (lazy-load, client-side, offline). */
function DocxPreview({ blobSource, height }: { blobSource: File | string; height: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    let cancelled = false
    const container = containerRef.current
    if (!container) return

    const run = async () => {
      setStatus('loading')
      try {
        let blob: Blob
        if (typeof blobSource === 'string') {
          const res = await fetch(blobSource)
          if (!res.ok) throw new Error(`Tải file thất bại (HTTP ${res.status})`)
          blob = await res.blob()
        } else {
          blob = blobSource
        }
        const { renderAsync } = await import('docx-preview')
        if (cancelled) return
        container.innerHTML = ''
        await renderAsync(blob, container, undefined, {
          className: 'docx-rendered',
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          breakPages: true,
          useBase64URL: true,
        })
        if (!cancelled) setStatus('ready')
      } catch {
        if (!cancelled) setStatus('error')
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [blobSource])

  return (
    <div className="relative">
      {status === 'loading' && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="mb-2 h-8 w-8 animate-spin text-brand" />
          <p className="text-sm text-muted-foreground">Đang dựng nội dung Word…</p>
        </div>
      )}
      {status === 'error' && (
        <div className="py-8 text-center text-sm text-red-600">
          Không thể hiển thị nội dung file. Vui lòng tải xuống để xem.
        </div>
      )}
      <div
        ref={containerRef}
        className={status === 'ready' ? 'overflow-auto rounded-lg bg-muted/30 p-4' : 'hidden'}
        style={{ maxHeight: height }}
      />
    </div>
  )
}

/**
 * Preview thống nhất cho PDF / DOCX / ảnh, dùng được cho cả:
 *  - file đang chọn (trước khi nộp / trước khi gửi lại) — truyền `file`
 *  - file đã nộp — truyền `url` (+ mimeType, fileName)
 *
 * Header dùng tông thương hiệu NTQS; component tự chứa, KHÔNG đụng PDFViewerSimple
 * (đang dùng chung cho editor/reviewer/admin/public).
 */
export function FilePreview({
  file,
  url,
  fileName,
  mimeType,
  title = 'Xem trước tài liệu',
  height = '640px',
}: FilePreviewProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)

  const effectiveName = fileName || file?.name || 'document'
  const effectiveMime = mimeType ?? file?.type ?? null
  const kind = detectPreviewKind(effectiveMime, effectiveName)

  // Tạo object URL cho file client-side (PDF/ảnh); thu hồi khi unmount.
  useEffect(() => {
    if (!file) {
      setObjectUrl(null)
      return
    }
    const u = URL.createObjectURL(file)
    setObjectUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [file])

  const sourceUrl = file ? objectUrl : url
  const downloadUrl = sourceUrl ?? undefined
  const HeaderIcon = kind === 'image' ? ImageIcon : kind === 'other' ? FileQuestion : FileText

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-gradient-to-r from-brand/10 to-gold/10 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <HeaderIcon className="h-5 w-5 flex-shrink-0 text-brand" />
            <div className="min-w-0">
              <CardTitle className="truncate text-base text-brand">{title}</CardTitle>
              <p className="truncate text-sm text-brand/80">{effectiveName}</p>
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            {kind === 'pdf' && sourceUrl && (
              <Button asChild variant="outline" size="sm" className="bg-white hover:bg-brand/5">
                <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-1 h-4 w-4" />
                  Tab mới
                </a>
              </Button>
            )}
            {downloadUrl && (
              <Button asChild variant="outline" size="sm" className="bg-white hover:bg-brand/5">
                <a href={downloadUrl} download={effectiveName}>
                  <Download className="mr-1 h-4 w-4" />
                  Tải về
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {kind === 'pdf' ? (
          sourceUrl ? (
            <PdfFrame src={sourceUrl} fileName={effectiveName} height={height} />
          ) : (
            <div className="py-10 text-center text-sm text-muted-foreground">
              <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-brand" />
              Đang chuẩn bị xem trước…
            </div>
          )
        ) : kind === 'image' ? (
          sourceUrl ? (
            <div className="flex justify-center overflow-auto bg-muted/30 p-3" style={{ maxHeight: height }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sourceUrl} alt={effectiveName} className="h-auto max-w-full object-contain" />
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-muted-foreground">Đang tải ảnh…</div>
          )
        ) : kind === 'docx' && (file || url) ? (
          <div className="p-4">
            <DocxPreview blobSource={(file as File) || (url as string)} height={height} />
          </div>
        ) : kind === 'doc-legacy' ? (
          <DownloadFallback
            icon={FileText}
            message="File .doc (Word cũ) không xem trực tiếp được trên trình duyệt. Vui lòng tải xuống, hoặc lưu lại dưới định dạng .docx/PDF để xem trước."
            downloadUrl={downloadUrl}
            fileName={effectiveName}
          />
        ) : (
          <DownloadFallback
            icon={FileQuestion}
            message="Không hỗ trợ xem trước định dạng này. Vui lòng tải xuống để xem nội dung."
            downloadUrl={downloadUrl}
            fileName={effectiveName}
          />
        )}
      </CardContent>
    </Card>
  )
}
