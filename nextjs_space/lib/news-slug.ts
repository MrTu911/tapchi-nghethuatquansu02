/**
 * Sinh slug duy nhất cho tin tức (server-side, source of truth khi lưu).
 * Dùng chung cho POST /api/news và PUT /api/news/[id] để tránh trùng lặp logic.
 */

import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

/**
 * @param source   Slug người dùng nhập (ưu tiên) hoặc tiêu đề để sinh slug.
 * @param excludeId Bỏ qua chính bản ghi đang sửa khi kiểm tra trùng.
 */
export async function generateUniqueNewsSlug(
  source: string,
  excludeId?: string,
): Promise<string> {
  const base = (slugify(source || '') || 'tin-tuc').substring(0, 100)
  let candidate = base
  let counter = 1

  // Slug trùng rất hiếm nên vòng lặp dừng gần như tức thì.
  while (true) {
    const existing = await prisma.news.findUnique({
      where: { slug: candidate },
      select: { id: true },
    })
    if (!existing || existing.id === excludeId) break
    candidate = `${base}-${counter}`
    counter++
  }

  return candidate
}
