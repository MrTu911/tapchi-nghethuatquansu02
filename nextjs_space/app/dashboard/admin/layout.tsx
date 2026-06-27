import type { ReactNode } from 'react'

/**
 * Layout khu vực QUẢN TRỊ HỆ THỐNG (SYSADMIN).
 *
 * Bọc trang con trong `.theme-leadership` để áp palette thương hiệu NTQS
 * (xanh quân sự #1E3924 + vàng đồng #E5C86E), nhất quán với các khu vực lãnh đạo
 * (Thư ký tòa soạn / Phó Tổng biên tập / Tổng biên tập). Trước đây dashboard admin
 * dùng gradient amber/blue/purple lệch branding. Class chỉ override CSS var trong subtree.
 *
 * Auth/session đã xử lý ở app/dashboard/layout.tsx (layout cha).
 */
export default function AdminThemeLayout({ children }: { children: ReactNode }) {
  return <div className="theme-leadership">{children}</div>
}
