import type { ReactNode } from 'react'

/**
 * Layout khu vực PHÓ TỔNG BIÊN TẬP (Deputy EIC).
 *
 * Bọc trang con trong `.theme-leadership` để áp palette thương hiệu NTQS
 * (xanh quân sự #1E3924 + vàng đồng #E5C86E), nhất quán với khu vực Thư ký
 * tòa soạn và Tổng biên tập. Class chỉ override CSS var trong subtree.
 *
 * Auth/session đã xử lý ở app/dashboard/layout.tsx (layout cha).
 */
export default function DeputyThemeLayout({ children }: { children: ReactNode }) {
  return <div className="theme-leadership">{children}</div>
}
