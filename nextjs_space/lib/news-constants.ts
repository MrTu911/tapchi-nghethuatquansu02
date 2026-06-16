/**
 * News module — shared constants & client-safe helpers.
 *
 * Nguồn sự thật duy nhất (SSOT) cho danh mục tin tức và các helper hiển thị,
 * dùng chung cho cả trang danh sách, form tạo/sửa và public site.
 * Tránh trùng lặp hằng số NEWS_CATEGORIES ở nhiều file.
 */

import { slugify } from '@/lib/utils'

export interface NewsCategoryOption {
  value: string
  label: string
  /** Mô tả ngắn để gợi ý khi chọn danh mục trong form */
  description: string
  /** Lớp màu badge (tailwind) giúp phân biệt danh mục trong bảng/preview */
  badgeClass: string
}

/**
 * Danh mục tin tức của Tạp chí Nghệ thuật Quân sự Việt Nam.
 * Giá trị `value` được lưu vào News.category (string) — giữ tương thích dữ liệu cũ.
 */
export const NEWS_CATEGORIES: NewsCategoryOption[] = [
  {
    value: 'announcement',
    label: 'Thông báo',
    description: 'Thông báo chính thức của tòa soạn, Học viện',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300',
  },
  {
    value: 'event',
    label: 'Sự kiện',
    description: 'Hoạt động, sự kiện của Học viện Quốc phòng',
    badgeClass: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300',
  },
  {
    value: 'call_for_paper',
    label: 'Call for Papers',
    description: 'Kêu gọi gửi bài cho số tạp chí sắp tới',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300',
  },
  {
    value: 'policy',
    label: 'Chính sách',
    description: 'Văn bản, quy định, chính sách liên quan',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300',
  },
  {
    value: 'research_news',
    label: 'Tin nghiên cứu',
    description: 'Kết quả, hoạt động nghiên cứu khoa học quân sự',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300',
  },
  {
    value: 'interview',
    label: 'Phỏng vấn',
    description: 'Bài phỏng vấn chuyên gia, nhà khoa học',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300',
  },
  {
    value: 'award',
    label: 'Giải thưởng',
    description: 'Khen thưởng, vinh danh, thành tích',
    badgeClass: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300',
  },
  {
    value: 'conference',
    label: 'Hội thảo',
    description: 'Hội thảo, tọa đàm khoa học',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300',
  },
]

const CATEGORY_BY_VALUE = new Map(NEWS_CATEGORIES.map((c) => [c.value, c]))

export function getNewsCategory(value?: string | null): NewsCategoryOption | undefined {
  if (!value) return undefined
  return CATEGORY_BY_VALUE.get(value)
}

export function getNewsCategoryLabel(value?: string | null): string {
  if (!value) return 'Chưa phân loại'
  return CATEGORY_BY_VALUE.get(value)?.label ?? value
}

export function getNewsCategoryBadgeClass(value?: string | null): string {
  return (
    getNewsCategory(value)?.badgeClass ??
    'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300'
  )
}

/**
 * Slug xem trước phía client. Khớp logic slugify dùng chung; server vẫn là
 * nguồn sự thật cuối cùng khi lưu (dedupe slug trùng).
 */
export function previewNewsSlug(title: string): string {
  return slugify(title || '').substring(0, 100)
}

/** Bỏ HTML, đếm số từ thực của nội dung. */
export function countWords(html?: string | null): number {
  if (!html) return 0
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length
}

/** Ước lượng thời gian đọc (phút), ~200 từ/phút. */
export function estimateReadingTime(html?: string | null): number {
  const words = countWords(html)
  if (words === 0) return 0
  return Math.max(1, Math.round(words / 200))
}

/** Độ dài khuyến nghị cho SEO/social để gợi ý cảnh báo mềm trong form. */
export const SEO_LIMITS = {
  titleIdeal: 65,
  titleMax: 110,
  summaryIdeal: 160,
  summaryMax: 280,
} as const

export type NewsSortOption = 'newest' | 'oldest' | 'most_viewed' | 'title'

export const NEWS_SORT_OPTIONS: { value: NewsSortOption; label: string }[] = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'most_viewed', label: 'Xem nhiều nhất' },
  { value: 'title', label: 'Theo tiêu đề (A→Z)' },
]
