/**
 * DEPRECATED — trang sửa tin cũ (theo slug) đã được gộp vào /dashboard/admin/news/[id].
 * Resolve slug -> id phía server rồi redirect sang trình soạn thảo mới (đang hoạt động đúng).
 * Nếu không tìm thấy slug, đưa về danh sách tin tức.
 */
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function DeprecatedCmsNewsEditPage({
  params,
}: {
  params: { slug: string }
}) {
  const news = await prisma.news.findUnique({
    where: { slug: params.slug },
    select: { id: true },
  })

  redirect(news ? `/dashboard/admin/news/${news.id}` : '/dashboard/admin/news')
}
