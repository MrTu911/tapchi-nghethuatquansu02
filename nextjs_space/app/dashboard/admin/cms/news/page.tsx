/**
 * DEPRECATED — module Tin tức cũ đã được gộp vào /dashboard/admin/news.
 * Giữ lại làm redirect shim để các URL/bookmark cũ không bị 404.
 * Có thể xóa hẳn sau khi chắc chắn không còn liên kết cũ nào trỏ tới.
 */
import { redirect } from 'next/navigation'

export default function DeprecatedCmsNewsListPage() {
  redirect('/dashboard/admin/news')
}
