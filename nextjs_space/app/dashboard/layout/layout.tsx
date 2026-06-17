import type { ReactNode } from 'react'

/**
 * Layout khu vực DÀN TRANG / SẢN XUẤT (Layout Editor).
 *
 * Bọc trang con trong `.theme-leadership` để áp palette thương hiệu NTQS
 * (xanh quân sự #1E3924 + vàng đồng #E5C86E), nhất quán với khu vực Thư ký
 * tòa soạn / Phó Tổng biên tập / Tổng biên tập. Class chỉ override CSS var
 * trong subtree nên không ảnh hưởng các khu vực khác.
 *
 * Auth/session đã xử lý ở app/dashboard/layout.tsx (layout cha).
 */
export default function ProductionThemeLayout({ children }: { children: ReactNode }) {
  return <div className="theme-leadership">{children}</div>
}
