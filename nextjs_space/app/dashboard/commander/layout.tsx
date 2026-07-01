import type { ReactNode } from 'react'

/**
 * Layout khu vực CHỈ HUY HỌC VIỆN (Commander).
 *
 * Bọc trang con trong `.theme-leadership` để áp palette thương hiệu NTQS
 * (xanh quân sự #1E3924 + vàng đồng #E5C86E), nhất quán với các khu vực lãnh đạo.
 * Class chỉ override CSS var trong subtree.
 *
 * Auth/session đã xử lý ở app/dashboard/layout.tsx (layout cha); phần điều hướng
 * theo vai trò xử lý trong chính trang commander/page.tsx.
 */
export default function CommanderThemeLayout({ children }: { children: ReactNode }) {
  return <div className="theme-leadership">{children}</div>
}
