import { redirect } from 'next/navigation'

/**
 * Trang gốc khu vực BIÊN TẬP VIÊN DÀN TRANG (Layout Editor).
 *
 * Không gian làm việc thực tế là Hàng đợi Sản xuất; trang gốc này điều hướng
 * tới đó để biên tập viên dàn trang không gặp 404 sau khi đăng nhập
 * (middleware đưa LAYOUT_EDITOR → /dashboard/layout).
 */
export default function LayoutDashboardRedirect() {
  redirect('/dashboard/layout/production')
}
