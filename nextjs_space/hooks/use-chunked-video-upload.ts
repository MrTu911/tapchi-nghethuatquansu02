'use client'

import { useCallback, useRef, useState } from 'react'

/**
 * Hook upload video theo từng phần (chunked/resumable).
 *
 * Luồng: init -> gửi từng chunk tuần tự -> complete. Hỗ trợ tạm dừng/tiếp tục,
 * hủy, và tự retry khi lỗi mạng (server idempotent theo offset). Không giới hạn
 * dung lượng vì không nạp toàn bộ file vào RAM (dùng File.slice).
 */

export type ChunkUploadStatus =
  | 'idle'
  | 'uploading'
  | 'paused'
  | 'completing'
  | 'done'
  | 'error'

export interface VideoUploadMetadata {
  title: string
  titleEn?: string
  description?: string
  category?: string
  tags?: string[]
  isFeatured?: boolean
  isActive?: boolean
  displayOrder?: number
  duration?: number // thời lượng (giây), đọc từ thẻ video phía client
  // Nếu có: thay file cho video đã tồn tại (chỉ đổi file + thời lượng, giữ metadata).
  // Khi đó title và các trường khác được bỏ qua ở server.
  replaceVideoId?: string
}

const MAX_CHUNK_RETRIES = 4
const RETRY_BASE_DELAY_MS = 800

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function apiPostJson(query: string, body: unknown): Promise<any> {
  const res = await fetch(`/api/videos/upload${query}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!json.success) {
    const err: any = new Error(json.error || 'Lỗi máy chủ')
    err.status = res.status
    throw err
  }
  return json.data
}

async function apiSendChunk(
  uploadId: string,
  offset: number,
  blob: Blob,
  signal: AbortSignal
): Promise<{ received: number; totalSize: number }> {
  const res = await fetch(
    `/api/videos/upload?action=chunk&uploadId=${uploadId}&offset=${offset}`,
    { method: 'POST', body: blob, signal }
  )
  const json = await res.json()
  if (!json.success) {
    const err: any = new Error(json.error || 'Lỗi tải phần dữ liệu')
    err.status = res.status
    throw err
  }
  return json.data
}

async function apiGetReceived(uploadId: string): Promise<number> {
  const res = await fetch(`/api/videos/upload?uploadId=${uploadId}`)
  const json = await res.json()
  if (!json.success) return 0
  return json.data.received as number
}

async function apiAbort(uploadId: string): Promise<void> {
  try {
    await fetch(`/api/videos/upload?action=abort&uploadId=${uploadId}`, { method: 'POST' })
  } catch {
    /* best-effort */
  }
}

export function useChunkedVideoUpload() {
  const [status, setStatus] = useState<ChunkUploadStatus>('idle')
  const [uploadedBytes, setUploadedBytes] = useState(0)
  const [totalBytes, setTotalBytes] = useState(0)
  const [speedBps, setSpeedBps] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const pausedRef = useRef(false)
  const cancelledRef = useRef(false)
  const uploadIdRef = useRef<string | null>(null)
  const controllerRef = useRef<AbortController | null>(null)
  // Mốc đo tốc độ theo cửa sổ gần nhất
  const speedAnchorRef = useRef<{ bytes: number; time: number }>({ bytes: 0, time: 0 })

  const reset = useCallback(() => {
    pausedRef.current = false
    cancelledRef.current = false
    uploadIdRef.current = null
    controllerRef.current = null
    setStatus('idle')
    setUploadedBytes(0)
    setTotalBytes(0)
    setSpeedBps(0)
    setError(null)
  }, [])

  const updateSpeed = useCallback((received: number) => {
    const now = Date.now()
    const anchor = speedAnchorRef.current
    const dt = (now - anchor.time) / 1000
    if (dt >= 0.5) {
      const bps = (received - anchor.bytes) / dt
      setSpeedBps(bps > 0 ? bps : 0)
      speedAnchorRef.current = { bytes: received, time: now }
    }
  }, [])

  const pause = useCallback(() => {
    if (status === 'uploading') {
      pausedRef.current = true
      setStatus('paused')
    }
  }, [status])

  const resume = useCallback(() => {
    if (status === 'paused') {
      pausedRef.current = false
      setStatus('uploading')
    }
  }, [status])

  const cancel = useCallback(async () => {
    cancelledRef.current = true
    pausedRef.current = false
    controllerRef.current?.abort()
    const id = uploadIdRef.current
    if (id) await apiAbort(id)
    reset()
  }, [reset])

  /**
   * Bắt đầu upload. Trả về bản ghi video khi hoàn tất, hoặc null nếu bị hủy.
   */
  const start = useCallback(
    async (file: File, metadata: VideoUploadMetadata): Promise<any | null> => {
      cancelledRef.current = false
      pausedRef.current = false
      setError(null)
      setStatus('uploading')
      setTotalBytes(file.size)
      setUploadedBytes(0)
      speedAnchorRef.current = { bytes: 0, time: Date.now() }

      try {
        // 1) init
        const init = await apiPostJson('?action=init', {
          fileName: file.name,
          mimeType: file.type || 'video/mp4',
          totalSize: file.size,
        })
        uploadIdRef.current = init.uploadId
        const chunkSize: number = init.chunkSize

        // 2) gửi từng chunk
        let offset = 0
        while (offset < file.size) {
          if (cancelledRef.current) return null

          // Chờ nếu đang tạm dừng
          while (pausedRef.current && !cancelledRef.current) {
            await sleep(200)
          }
          if (cancelledRef.current) return null

          const end = Math.min(offset + chunkSize, file.size)
          const blob = file.slice(offset, end)

          const received = await sendChunkWithRetry(
            init.uploadId,
            offset,
            blob,
            () => cancelledRef.current
          )
          offset = received
          setUploadedBytes(received)
          updateSpeed(received)
        }

        if (cancelledRef.current) return null

        // 3) complete — thay file bản ghi cũ (replaceVideoId) hoặc tạo mới
        setStatus('completing')
        const completeBody = metadata.replaceVideoId
          ? {
              uploadId: init.uploadId,
              replaceVideoId: metadata.replaceVideoId,
              duration: metadata.duration,
            }
          : {
              uploadId: init.uploadId,
              title: metadata.title,
              titleEn: metadata.titleEn,
              description: metadata.description,
              category: metadata.category,
              tags: metadata.tags ?? [],
              isFeatured: metadata.isFeatured ?? false,
              isActive: metadata.isActive ?? true,
              displayOrder: metadata.displayOrder ?? 0,
              duration: metadata.duration,
            }
        const result = await apiPostJson('?action=complete', completeBody)
        setStatus('done')
        setSpeedBps(0)
        return result.video
      } catch (e: any) {
        if (cancelledRef.current) return null
        setError(e?.message || 'Upload thất bại')
        setStatus('error')
        return null
      }
    },
    [updateSpeed]
  )

  /**
   * Gửi một chunk có retry. Khi gặp lỗi sai offset (409) hoặc lỗi mạng, hỏi lại
   * trạng thái server để biết đã nhận tới đâu rồi tiếp tục từ đó.
   */
  async function sendChunkWithRetry(
    uploadId: string,
    offset: number,
    blob: Blob,
    isCancelled: () => boolean
  ): Promise<number> {
    let attempt = 0
    while (true) {
      if (isCancelled()) return offset
      const controller = new AbortController()
      controllerRef.current = controller
      try {
        const { received } = await apiSendChunk(uploadId, offset, blob, controller.signal)
        return received
      } catch (e: any) {
        if (isCancelled()) return offset
        attempt += 1
        if (attempt > MAX_CHUNK_RETRIES) throw e
        // Đồng bộ lại offset thực tế từ server trước khi thử lại
        const serverReceived = await apiGetReceived(uploadId).catch(() => offset)
        if (serverReceived >= offset + blob.size) {
          // Phần này đã được nhận trọn vẹn trước đó
          return serverReceived
        }
        await sleep(RETRY_BASE_DELAY_MS * attempt)
      }
    }
  }

  const progress = totalBytes > 0 ? uploadedBytes / totalBytes : 0
  const etaSec = speedBps > 0 ? (totalBytes - uploadedBytes) / speedBps : null

  return {
    status,
    progress,
    uploadedBytes,
    totalBytes,
    speedBps,
    etaSec,
    error,
    start,
    pause,
    resume,
    cancel,
    reset,
    isActive: status === 'uploading' || status === 'paused' || status === 'completing',
  }
}
