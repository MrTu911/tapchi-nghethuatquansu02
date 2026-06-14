import type { ReactNode } from 'react'

/**
 * Layout khu vực BIÊN TẬP VIÊN.
 *
 * Bọc toàn bộ trang con trong `.theme-editor` để áp palette thương hiệu NTQS
 * (xanh quân sự #1E3924 + vàng đồng #E5C86E) — class này chỉ override các CSS
 * var primary/accent/ring trong subtree, KHÔNG ảnh hưởng dashboard admin/author.
 *
 * Phần auth/session đã được xử lý ở app/dashboard/layout.tsx (layout cha).
 * Div bọc chỉ mang CSS var, không thêm thuộc tính layout nên không phá bố cục.
 */
export default function EditorThemeLayout({ children }: { children: ReactNode }) {
  return <div className="theme-editor">{children}</div>
}
