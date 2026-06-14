import Link from 'next/link'
import { ChevronRight, Image as ImageIcon } from 'lucide-react'

interface GalleryPhoto {
  id: string
  url: string
  alt?: string | null
  caption?: string | null
}

interface PhotoGallerySectionProps {
  photos: GalleryPhoto[]
}

export default function PhotoGallerySection({ photos }: PhotoGallerySectionProps) {
  if (!photos || photos.length === 0) return null

  const [p0, p1, p2, p3, p4, p5, p6, p7] = photos

  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="widget-header">
        <ImageIcon className="w-4 h-4" />
        <span className="widget-header-title">Thư Viện Ảnh</span>
        <Link
          href="/media"
          className="ml-auto text-xs text-white/80 hover:text-white flex items-center gap-0.5 transition-colors"
        >
          Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="p-4">
        {/* Row 1: masonry-lite 3 + wide combo */}
        <div className="grid grid-cols-3 gap-2 mb-2">
          {/* Ảnh lớn bên trái — row-span-2 nếu có đủ ảnh */}
          {p0 && (
            <div className={`relative overflow-hidden rounded-lg group cursor-pointer ${photos.length >= 5 ? 'row-span-2' : ''}`}
              style={photos.length >= 5 ? { gridRow: 'span 2' } : {}}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p0.url}
                alt={p0.alt || 'Ảnh'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                style={{ minHeight: photos.length >= 5 ? 200 : 120 }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </div>
          )}
          {/* Ảnh nhỏ phải trên */}
          {p1 && (
            <GalleryThumb photo={p1} />
          )}
          {p2 && (
            <GalleryThumb photo={p2} />
          )}
          {/* Ảnh rộng bottom-right — 2 cols */}
          {p3 && (
            <div className="col-span-2 relative aspect-[2/1] overflow-hidden rounded-lg group cursor-pointer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p3.url}
                alt={p3.alt || 'Ảnh'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              {p3.caption && (
                <p className="absolute bottom-2 left-2 right-2 text-[11px] text-white bg-black/50 px-2 py-1 rounded line-clamp-1">
                  {p3.caption}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Row 2: 4 ảnh đều nhau */}
        {(p4 || p5 || p6 || p7) && (
          <div className="grid grid-cols-4 gap-2">
            {[p4, p5, p6, p7].map((p, i) =>
              p ? <GalleryThumb key={p.id} photo={p} /> : <div key={i} className="aspect-[4/3]" />
            )}
          </div>
        )}
      </div>
    </section>
  )
}

function GalleryThumb({ photo }: { photo: GalleryPhoto }) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-lg group cursor-pointer">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.url}
        alt={photo.alt || 'Ảnh'}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
    </div>
  )
}
