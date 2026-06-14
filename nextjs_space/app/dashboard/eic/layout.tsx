import type { ReactNode } from 'react'

/**
 * Layout khu vực TỔNG BIÊN TẬP (EIC).
 *
 * Bọc trang con trong `.theme-leadership` để áp palette thương hiệu NTQS
 * (xanh quân sự #1E3924 + vàng đồng #E5C86E), nhất quán với khu vực Thư ký
 * tòa soạn và Phó Tổng biên tập. Class chỉ override CSS var primary/accent/ring
 * trong subtree, KHÔNG ảnh hưởng dashboard khác.
 *
 * Auth/session đã xử lý ở app/dashboard/layout.tsx (layout cha).
 */
export default function EicThemeLayout({ children }: { children: ReactNode }) {
  return <div className="theme-leadership">{children}</div>
}
