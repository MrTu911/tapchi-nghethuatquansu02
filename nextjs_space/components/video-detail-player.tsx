'use client'

import { useEffect, useRef } from 'react'

interface VideoDetailPlayerProps {
  id: string
  videoType: string
  videoUrl: string
  videoId?: string | null
  thumbnailUrl?: string | null
  title: string
}

function getYouTubeEmbedUrl(videoUrl: string, videoId?: string | null): string {
  const id =
    videoId ||
    videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/)?.[1]
  return id ? `https://www.youtube.com/embed/${id}` : videoUrl
}

/**
 * Trình phát video trên trang chi tiết công khai. Tăng lượt xem đúng 1 lần khi
 * mở trang (gọi GET /api/videos/[id] có side-effect increment ở backend).
 */
export function VideoDetailPlayer({
  id,
  videoType,
  videoUrl,
  videoId,
  thumbnailUrl,
  title,
}: VideoDetailPlayerProps) {
  const countedRef = useRef(false)

  useEffect(() => {
    if (countedRef.current) return
    countedRef.current = true
    fetch(`/api/videos/${id}`).catch(() => undefined)
  }, [id])

  const isUpload = videoType === 'upload'

  return (
    <div className="aspect-video w-full bg-black rounded-xl overflow-hidden shadow-lg">
      {isUpload ? (
        <video
          src={videoUrl}
          poster={thumbnailUrl || undefined}
          controls
          autoPlay
          playsInline
          className="w-full h-full"
          controlsList="nodownload"
        />
      ) : (
        <iframe
          src={getYouTubeEmbedUrl(videoUrl, videoId)}
          title={title}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )}
    </div>
  )
}
