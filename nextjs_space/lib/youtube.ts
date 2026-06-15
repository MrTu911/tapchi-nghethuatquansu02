/**
 * Tiện ích YouTube dùng chung (client + server).
 *
 * Lý do tồn tại: link dạng `youtu.be/ID?si=...` (nút Share của YouTube) khiến
 * regex cũ bắt nhầm cả `?si=...` vào videoId, làm URL ảnh đại diện
 * `img.youtube.com/vi/<id>/hqdefault.jpg` bị hỏng. Các hàm dưới đây luôn LÀM SẠCH
 * videoId trước khi dựng URL.
 */

/** Trích YouTube video ID từ mọi định dạng URL phổ biến. */
export function extractYouTubeId(url: string): string {
  if (!url) return ''
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([^&?/\s]+)/
  )
  return match?.[1] || ''
}

/** Làm sạch videoId có thể còn dính tham số (vd "rzdu31D_uKQ?si=abc"). */
export function cleanYouTubeId(id?: string | null): string {
  if (!id) return ''
  return id.split(/[?&/\s]/)[0]
}

/** Lấy videoId sạch từ (videoId ưu tiên, fallback trích từ URL). */
export function resolveYouTubeId(videoUrl?: string | null, videoId?: string | null): string {
  return cleanYouTubeId(videoId) || extractYouTubeId(videoUrl || '')
}

/** URL ảnh đại diện. hqdefault luôn tồn tại và nét hơn mqdefault. */
export function getYouTubeThumbnail(videoUrl?: string | null, videoId?: string | null): string {
  const id = resolveYouTubeId(videoUrl, videoId)
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : ''
}

/** URL nhúng (embed). */
export function getYouTubeEmbedUrl(
  videoUrl?: string | null,
  videoId?: string | null,
  autoplay = false
): string {
  const id = resolveYouTubeId(videoUrl, videoId)
  if (!id) return videoUrl || ''
  return `https://www.youtube.com/embed/${id}${autoplay ? '?autoplay=1' : ''}`
}
