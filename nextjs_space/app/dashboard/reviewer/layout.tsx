import type { ReactNode } from 'react'

/**
 * Layout khu vực PHẢN BIỆN VIÊN.
 *
 * Bọc toàn bộ trang con trong `.theme-reviewer` để áp palette thương hiệu NTQS
 * (xanh quân sự #1E3924 + vàng đồng #E5C86E) — class chỉ override các CSS var
 * primary/accent/ring trong subtree, KHÔNG ảnh hưởng dashboard editor/admin.
 *
 * Phần auth/session đã được xử lý ở app/dashboard/layout.tsx (layout cha).
 * Div bọc chỉ mang CSS var, không thêm thuộc tính layout nên không phá bố cục.
 */
export default function ReviewerThemeLayout({ children }: { children: ReactNode }) {
  return <div className="theme-reviewer">{children}</div>
}
