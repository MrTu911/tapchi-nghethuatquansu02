/**
 * DEPRECATED — trang tạo tin cũ đã được gộp vào /dashboard/admin/news/create.
 * Giữ lại làm redirect shim để các URL/bookmark cũ không bị 404.
 */
import { redirect } from 'next/navigation'

export default function DeprecatedCmsNewsCreatePage() {
  redirect('/dashboard/admin/news/create')
}
