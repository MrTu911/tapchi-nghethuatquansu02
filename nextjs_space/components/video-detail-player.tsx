'use client'

import { useEffect, useRef } from 'react'

interface VideoDetailPlayerProps {
  id: string
  videoUrl: string
  thumbnailUrl?: string | null
}

/**
 * Trình phát video nội bộ (LAN) trên trang chi tiết công khai. Tăng lượt xem đúng
 * 1 lần khi mở trang (gọi GET /api/videos/[id] có side-effect increment ở backend).
 */
export function VideoDetailPlayer({ id, videoUrl, thumbnailUrl }: VideoDetailPlayerProps) {
  const countedRef = useRef(false)

  useEffect(() => {
    if (countedRef.current) return
    countedRef.current = true
    fetch(`/api/videos/${id}`).catch(() => undefined)
  }, [id])

  return (
    <div className="aspect-video w-full bg-black rounded-xl overflow-hidden shadow-lg">
      <video
        src={videoUrl}
        poster={thumbnailUrl || undefined}
        controls
        autoPlay
        playsInline
        className="w-full h-full"
        controlsList="nodownload"
      />
    </div>
  )
}
