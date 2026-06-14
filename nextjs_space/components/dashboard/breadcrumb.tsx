'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

// Map path segments to Vietnamese labels
const pathLabels: Record<string, string> = {
  // Dashboard roots
  dashboard: 'Dashboard',
  admin: 'Quản trị',
  editor: 'Biên tập',
  author: 'Tác giả',
  reviewer: 'Phản biện',
  production: 'Xuất bản',
  
  // Common sections
  submissions: 'Bài nộp',
  articles: 'Bài viết',
  reviews: 'Phản biện',
  reviewers: 'Phản biện viên',
  users: 'Người dùng',
  settings: 'Cài đặt',
  
  // Admin sections
  cms: 'Quản lý nội dung',
  issues: 'Số tạp chí',
  volumes: 'Tập',
  categories: 'Chuyên mục',
  news: 'Tin tức',
  banners: 'Banner',
  pages: 'Trang tĩnh',
  media: 'Thư viện Media',
  videos: 'Video',
  navigation: 'Menu',
  security: 'Bảo mật',
  alerts: 'Cảnh báo',
  'audit-logs': 'Nhật ký hệ thống',
  'review-settings': 'Cài đặt phản biện',
  
  // Repository
  repository: 'Kho bài báo',
  stats: 'Thống kê',
  search: 'Tìm kiếm',
  
  // Actions
  new: 'Tạo mới',
  edit: 'Chỉnh sửa',
  review: 'Phản biện',
  versions: 'Lịch sử phiên bản',
  messages: 'Tin nhắn',
}

interface BreadcrumbProps {
  className?: string
  homeLabel?: string
  showHome?: boolean
}

export function Breadcrumb({ 
  className, 
  homeLabel = 'Trang chủ',
  showHome = true 
}: BreadcrumbProps) {
  const pathname = usePathname()
  
  // Parse path segments
  const segments = pathname.split('/').filter(Boolean)
  
  // Skip if only at dashboard root
  if (segments.length <= 1) return null
  
  // Build breadcrumb items
  const items: { label: string; href: string; isLast: boolean }[] = []
  let currentPath = ''
  
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`
    const isLast = index === segments.length - 1
    
    // Check if segment is a UUID (skip showing UUID in breadcrumb)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)
    
    if (isUUID) {
      // For UUIDs, show "Chi tiết" instead
      items.push({
        label: 'Chi tiết',
        href: currentPath,
        isLast
      })
    } else {
      // Get label from map or capitalize segment
      const label = pathLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
      items.push({
        label,
        href: currentPath,
        isLast
      })
    }
  })

  return (
    <nav 
      aria-label="Breadcrumb" 
      className={cn(
        'flex items-center text-sm text-muted-foreground mb-4',
        className
      )}
    >
      <ol className="flex items-center gap-1 flex-wrap">
        {showHome && (
          <li className="flex items-center">
            <Link 
              href="/dashboard" 
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">{homeLabel}</span>
            </Link>
            <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/50" />
          </li>
        )}
        
        {items.map((item, index) => (
          <li key={item.href} className="flex items-center">
            {item.isLast ? (
              <span className="font-medium text-foreground">
                {item.label}
              </span>
            ) : (
              <>
                <Link 
                  href={item.href}
                  className="hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
                <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/50" />
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export default Breadcrumb
