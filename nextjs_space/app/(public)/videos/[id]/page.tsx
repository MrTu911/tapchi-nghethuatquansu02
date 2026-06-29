import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Eye, Calendar, Clock, Tag, ChevronRight, Play, Film, ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { VideoDetailPlayer } from '@/components/video-detail-player'
import { getYouTubeThumbnail } from '@/lib/youtube'

const ShareButton = dynamic(
  () => import('@/components/share-button').then((m) => ({ default: m.ShareButton })),
  { ssr: false, loading: () => <Button variant="outline" size="sm" disabled>Chia sẻ</Button> }
)

interface VideoDetailPageProps {
  params: { id: string }
}

// ============================================================================
// HELPERS
// ============================================================================

function getThumbnail(video: {
  videoType: string
  videoUrl: string
  videoId: string | null
  thumbnailUrl: string | null
}): string {
  if (video.videoType === 'youtube') {
    return getYouTubeThumbnail(video.videoUrl, video.videoId)
  }
  return video.thumbnailUrl || ''
}

function formatDate(date: Date | null): string {
  if (!date) return ''
  return new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })
}

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return ''
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

async function getRelatedVideos(currentId: string, category: string | null) {
  const base = { isActive: true, id: { not: currentId } }
  const orderBy = [
    { isFeatured: 'desc' as const },
    { publishedAt: 'desc' as const },
    { createdAt: 'desc' as const },
  ]

  let related = category
    ? await prisma.video.findMany({ where: { ...base, category }, orderBy, take: 6 })
    : []

  if (related.length < 6) {
    const excludeIds = [currentId, ...related.map((v) => v.id)]
    const fill = await prisma.video.findMany({
      where: { isActive: true, id: { notIn: excludeIds } },
      orderBy,
      take: 6 - related.length,
    })
    related = [...related, ...fill]
  }
  return related
}

// ============================================================================
// METADATA (SEO)
// ============================================================================

export async function generateMetadata({ params }: VideoDetailPageProps): Promise<Metadata> {
  const video = await prisma.video.findUnique({ where: { id: params.id } })
  if (!video || !video.isActive) {
    // Layout đã có title template "%s | Tạp chí..." nên trả tiêu đề trần
    return { title: 'Video không tồn tại' }
  }

  const description = video.description?.slice(0, 200) || 'Video trên Tạp chí Nghệ thuật Quân sự Việt Nam'
  const thumbnail = getThumbnail(video)

  return {
    title: video.title,
    description,
    keywords: video.tags?.length ? video.tags.join(', ') : undefined,
    openGraph: {
      title: video.title,
      description,
      type: 'video.other',
      images: thumbnail ? [{ url: thumbnail }] : undefined,
    },
  }
}

// ============================================================================
// PAGE
// ============================================================================

export default async function VideoDetailPage({ params }: VideoDetailPageProps) {
  const video = await prisma.video.findUnique({ where: { id: params.id } })
  if (!video || !video.isActive) notFound()

  const related = await getRelatedVideos(video.id, video.category)
  const duration = formatDuration(video.duration)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-0 sm:px-0 py-6 lg:py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-5">
          <Link href="/" className="hover:text-[#295232]">Trang chủ</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/videos" className="hover:text-[#295232]">Video</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-600 dark:text-gray-300 truncate max-w-[50%]">{video.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-5">
            <VideoDetailPlayer
              id={video.id}
              videoType={video.videoType}
              videoUrl={video.videoUrl}
              videoId={video.videoId}
              thumbnailUrl={video.thumbnailUrl}
              title={video.title}
            />

            {/* Title + meta */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
              <div className="flex items-start gap-2 flex-wrap">
                {video.isFeatured && (
                  <span className="bg-[#D4A843] text-[#1E293B] text-[10px] font-bold px-2 py-0.5 rounded">⭐ Nổi bật</span>
                )}
                {video.category && (
                  <span className="bg-[#295232]/10 text-[#295232] text-[10px] font-semibold px-2 py-0.5 rounded">
                    {video.category}
                  </span>
                )}
              </div>

              <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 leading-snug">
                {video.title}
              </h1>
              {video.titleEn && (
                <p className="text-sm text-gray-400 italic -mt-2">{video.titleEn}</p>
              )}

              <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> {video.views.toLocaleString()} lượt xem
                </span>
                {video.publishedAt && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {formatDate(video.publishedAt)}
                  </span>
                )}
                {duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {duration}
                  </span>
                )}
                <div className="ml-auto">
                  <ShareButton title={video.title} text={video.description || video.title} />
                </div>
              </div>

              {video.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line border-t border-gray-100 dark:border-gray-800 pt-4">
                  {video.description}
                </p>
              )}

              {video.tags?.length > 0 && (
                <div className="flex items-center flex-wrap gap-2 pt-1">
                  <Tag className="w-3.5 h-3.5 text-gray-400" />
                  {video.tags.map((t) => (
                    <span key={t} className="text-[11px] bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <Link href="/videos">
              <Button variant="outline" size="sm" className="gap-1.5">
                <ArrowLeft className="w-4 h-4" /> Về danh sách video
              </Button>
            </Link>
          </div>

          {/* Sidebar: related videos */}
          <aside className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1 h-5 bg-[#295232] rounded-full" />
              <h2 className="font-bold text-gray-800 dark:text-gray-100 text-sm uppercase tracking-wide">
                Video liên quan
              </h2>
            </div>

            {related.length === 0 ? (
              <p className="text-sm text-gray-400">Chưa có video liên quan.</p>
            ) : (
              <div className="space-y-3">
                {related.map((rv) => {
                  const thumb = getThumbnail(rv)
                  return (
                    <Link
                      key={rv.id}
                      href={`/videos/${rv.id}`}
                      className="group flex gap-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="relative w-32 flex-shrink-0 aspect-video bg-gray-900">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumb} alt={rv.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Film className="w-5 h-5 text-gray-600" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-5 h-5 text-white" fill="white" />
                        </div>
                      </div>
                      <div className="py-2 pr-2 min-w-0">
                        <h3 className="text-xs font-semibold text-gray-800 dark:text-gray-200 line-clamp-2 leading-snug group-hover:text-[#295232]">
                          {rv.title}
                        </h3>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1">
                          <span className="flex items-center gap-0.5"><Eye className="w-2.5 h-2.5" />{rv.views.toLocaleString()}</span>
                          {rv.publishedAt && <span>{formatDate(rv.publishedAt)}</span>}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
