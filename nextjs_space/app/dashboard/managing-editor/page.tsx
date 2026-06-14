import { redirect } from 'next/navigation'

/**
 * DEPRECATED — khu vực Thư ký tòa soạn đã hợp nhất về `/dashboard/managing`
 * (route chính trong middleware + sidebar). Trang cũ này không còn consumer nào
 * trỏ tới; giữ lại dưới dạng redirect để không vỡ link/bookmark cũ thay vì xóa
 * cứng (theo migration-refactor rules). Có thể gỡ hẳn ở đợt dọn dẹp sau.
 */
export default function LegacyManagingEditorRedirect() {
  redirect('/dashboard/managing')
}
