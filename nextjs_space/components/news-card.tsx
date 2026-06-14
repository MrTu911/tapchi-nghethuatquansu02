import Link from 'next/link'
import { Eye, Newspaper } from 'lucide-react'

export interface NewsCardItem {
  id: string
  slug: string
  title: string
  summary?: string | null
  coverImage?: string | null
  category?: string | null
  publishedAt?: string | null
  createdAt?: string
  views: number
  author?: { fullName: string } | null
}

const CATEGORY_LABELS: Record<string, string> = {
  hoat_dong: 'Hoạt động',
  su_kien: 'Sự kiện',
  truyen_thong: 'Truyền thống',
  dao_tao: 'Đào tạo',
  nghien_cuu: 'Nghiên cứu',
  can_bo: 'Cán bộ',
  hop_tac_quoc_te: 'Hợp tác quốc tế',
  thong_bao: 'Thông báo',
  announcement: 'Thông báo',
  event: 'Sự kiện',
  call_for_paper: 'Call for Papers',
  policy: 'Chính sách',
  research_news: 'Tin nghiên cứu',
}

function formatDate(iso?: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function getCategoryLabel(cat?: string | null) {
  if (!cat) return ''
  return CATEGORY_LABELS[cat] || cat
}

/** Standard card — ảnh 16/9 trên, title bên dưới. Dùng cho grid 4 cột. */
export function NewsCardStandard({ item }: { item: NewsCardItem }) {
  const imgSrc = item.coverImage || null
  const catLabel = getCategoryLabel(item.category)

  return (
    <Link
      href={`/news/${item.slug}`}
      className="group flex flex-col bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Image */}
      <div className="relative aspect-[16/9] overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
        {imgSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imgSrc}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#8B1A1A]/10 to-[#A52020]/20 flex items-center justify-center">
            <Newspaper className="w-8 h-8 text-[#8B1A1A]/30" />
          </div>
        )}
        {catLabel && (
          <span className="absolute top-2 left-2 bg-[#D4A843]/90 text-[#1E293B] text-[10px] font-bold px-2 py-0.5 rounded-full">
            {catLabel}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col flex-1">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-[#8B1A1A] dark:group-hover:text-amber-400 line-clamp-2 leading-snug flex-1">
          {item.title}
        </h3>
        <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-400">
          <span>{formatDate(item.publishedAt || item.createdAt)}</span>
          <span className="ml-auto flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {item.views.toLocaleString()}
          </span>
        </div>
      </div>
    </Link>
  )
}

/** Compact card — ảnh nhỏ bên trái, title bên phải. Dùng cho danh sách sidebar. */
export function NewsCardCompact({ item, rank }: { item: NewsCardItem; rank?: number }) {
  const imgSrc = item.coverImage || null

  return (
    <Link
      href={`/news/${item.slug}`}
      className="group flex gap-3 items-start p-2.5 rounded-lg hover:bg-[#FDF5E6] dark:hover:bg-gray-800 transition-colors"
    >
      {rank !== undefined && (
        <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
          ${rank < 3 ? 'bg-[#8B1A1A] text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
          {rank + 1}
        </span>
      )}
      <div className="w-[72px] h-12 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800">
        {imgSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imgSrc}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-[#FDF5E6] dark:bg-gray-700 flex items-center justify-center">
            <Newspaper className="w-4 h-4 text-[#8B1A1A]/30" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-[#8B1A1A] dark:group-hover:text-amber-400 line-clamp-2 leading-snug">
          {item.title}
        </h4>
        <p className="text-[11px] text-gray-400 mt-0.5">
          {formatDate(item.publishedAt || item.createdAt)} · <Eye className="w-2.5 h-2.5 inline" /> {item.views}
        </p>
      </div>
    </Link>
  )
}
