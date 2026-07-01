import type { ReactNode } from 'react'

/**
 * Layout khu vực KIỂM ĐỊNH BẢO MẬT (Security Auditor).
 *
 * Bọc trang con trong `.theme-leadership` để áp palette thương hiệu NTQS
 * (xanh quân sự #1E3924 + vàng đồng #E5C86E), nhất quán với các khu vực lãnh đạo
 * (Thư ký tòa soạn, Phó TBT, Tổng biên tập). Tín hiệu cảnh báo (đỏ/hổ phách) vẫn
 * được giữ ở icon/badge theo ngữ nghĩa an toàn. Class chỉ override CSS var trong subtree.
 *
 * Auth/session đã xử lý ở app/dashboard/layout.tsx (layout cha).
 */
export default function SecurityThemeLayout({ children }: { children: ReactNode }) {
  return <div className="theme-leadership">{children}</div>
}
