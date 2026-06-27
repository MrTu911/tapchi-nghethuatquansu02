import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/**
 * Trạng thái rỗng dùng chung cho các trang danh sách (bài nộp, phản biện, số báo...).
 *
 * Trước đây mỗi nơi tự dựng "empty state" inline (vd workflow-deadline-tabs).
 * Component này gom về một mối: icon tuỳ chọn + tiêu đề + thông điệp + action.
 * Chỉ hiển thị — không chứa business logic (theo frontend-ui rules).
 */
interface EmptyStateProps {
  message: string
  title?: string
  icon?: LucideIcon
  action?: ReactNode
  className?: string
}

export function EmptyState({ message, title, icon: Icon, action, className }: EmptyStateProps) {
  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center">
        {Icon && (
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-full bg-muted')}>
            <Icon className="h-6 w-6 text-muted-foreground" aria-hidden />
          </div>
        )}
        {title && <p className="text-sm font-semibold text-foreground">{title}</p>}
        <p className="max-w-md text-sm text-muted-foreground">{message}</p>
        {action}
      </CardContent>
    </Card>
  )
}
