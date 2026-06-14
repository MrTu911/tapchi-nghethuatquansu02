import type { ReactNode } from 'react'

/**
 * Layout khu vực THƯ KÝ TÒA SOẠN / BIÊN TẬP CHÍNH (Managing Editor).
 *
 * Bọc trang con trong `.theme-leadership` để áp palette thương hiệu NTQS
 * (xanh quân sự #1E3924 + vàng đồng #E5C86E), nhất quán với khu vực Phó Tổng
 * biên tập và Tổng biên tập. Class chỉ override CSS var trong subtree.
 *
 * Auth/session đã xử lý ở app/dashboard/layout.tsx (layout cha).
 */
export default function ManagingThemeLayout({ children }: { children: ReactNode }) {
  return <div className="theme-leadership">{children}</div>
}
