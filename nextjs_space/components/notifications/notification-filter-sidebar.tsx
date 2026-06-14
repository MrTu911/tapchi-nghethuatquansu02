'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  AlertCircle,
  Bell,
  CheckCircle,
  Clock,
  FileText,
  UserCheck,
} from 'lucide-react'

export interface FilterOption {
  value: string
  label: string
  icon: React.ReactNode
  count?: number
}

const TYPE_FILTERS: FilterOption[] = [
  { value: 'ALL', label: 'Tất cả', icon: <Bell className="h-4 w-4" /> },
  { value: 'UNREAD', label: 'Chưa đọc', icon: <AlertCircle className="h-4 w-4 text-orange-500" /> },
]

const TYPE_CATEGORIES: FilterOption[] = [
  { value: 'SUBMISSION_RECEIVED', label: 'Bài viết mới', icon: <FileText className="h-4 w-4 text-blue-500" /> },
  { value: 'REVIEW_INVITED', label: 'Mời phản biện', icon: <UserCheck className="h-4 w-4 text-purple-500" /> },
  { value: 'REVIEW_REMINDER', label: 'Nhắc phản biện', icon: <Clock className="h-4 w-4 text-orange-500" /> },
  { value: 'REVIEW_COMPLETED', label: 'Phản biện xong', icon: <CheckCircle className="h-4 w-4 text-green-500" /> },
  { value: 'DECISION_MADE', label: 'Quyết định', icon: <CheckCircle className="h-4 w-4 text-indigo-500" /> },
  { value: 'REVISION_REQUESTED', label: 'Yêu cầu sửa', icon: <AlertCircle className="h-4 w-4 text-yellow-600" /> },
  { value: 'ARTICLE_PUBLISHED', label: 'Đã xuất bản', icon: <CheckCircle className="h-4 w-4 text-emerald-500" /> },
  { value: 'DEADLINE_APPROACHING', label: 'Sắp hết hạn', icon: <Clock className="h-4 w-4 text-orange-500" /> },
  { value: 'DEADLINE_OVERDUE', label: 'Quá hạn', icon: <AlertCircle className="h-4 w-4 text-red-500" /> },
]

interface NotificationFilterSidebarProps {
  activeFilter: string
  unreadCount: number
  totalCount: number
  onFilterChange: (filter: string) => void
}

export function NotificationFilterSidebar({
  activeFilter,
  unreadCount,
  totalCount,
  onFilterChange,
}: NotificationFilterSidebarProps) {
  return (
    <aside className="w-full md:w-56 shrink-0 space-y-1">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">
        Tổng quan
      </p>
      {TYPE_FILTERS.map(option => (
        <FilterButton
          key={option.value}
          option={option}
          isActive={activeFilter === option.value}
          count={option.value === 'ALL' ? totalCount : option.value === 'UNREAD' ? unreadCount : undefined}
          onClick={() => onFilterChange(option.value)}
        />
      ))}

      <div className="pt-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">
          Theo loại
        </p>
        {TYPE_CATEGORIES.map(option => (
          <FilterButton
            key={option.value}
            option={option}
            isActive={activeFilter === option.value}
            onClick={() => onFilterChange(option.value)}
          />
        ))}
      </div>
    </aside>
  )
}

function FilterButton({
  option,
  isActive,
  count,
  onClick,
}: {
  option: FilterOption
  isActive: boolean
  count?: number
  onClick: () => void
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        'w-full justify-start gap-2 h-9 font-normal',
        isActive && 'bg-accent font-medium'
      )}
      onClick={onClick}
    >
      {option.icon}
      <span className="flex-1 text-left truncate">{option.label}</span>
      {count !== undefined && count > 0 && (
        <Badge
          variant={option.value === 'UNREAD' ? 'destructive' : 'secondary'}
          className="ml-auto text-xs h-5 px-1.5"
        >
          {count}
        </Badge>
      )}
    </Button>
  )
}
