'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import {
  AlertCircle,
  Bell,
  CheckCircle,
  Clock,
  FileText,
  Trash2,
  UserCheck,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Notification } from '@/hooks/useNotifications'

const ICONS: Record<string, React.ReactNode> = {
  SUBMISSION_RECEIVED: <FileText className="h-5 w-5" />,
  REVIEW_INVITED: <UserCheck className="h-5 w-5" />,
  REVIEW_REMINDER: <Clock className="h-5 w-5" />,
  REVIEW_COMPLETED: <CheckCircle className="h-5 w-5" />,
  DECISION_MADE: <CheckCircle className="h-5 w-5" />,
  REVISION_REQUESTED: <AlertCircle className="h-5 w-5" />,
  ARTICLE_PUBLISHED: <CheckCircle className="h-5 w-5" />,
  DEADLINE_APPROACHING: <Clock className="h-5 w-5" />,
  DEADLINE_OVERDUE: <AlertCircle className="h-5 w-5" />,
}

const ICON_COLORS: Record<string, string> = {
  SUBMISSION_RECEIVED: 'text-blue-500 bg-blue-50',
  REVIEW_INVITED: 'text-purple-500 bg-purple-50',
  REVIEW_REMINDER: 'text-orange-500 bg-orange-50',
  REVIEW_COMPLETED: 'text-green-500 bg-green-50',
  DECISION_MADE: 'text-indigo-500 bg-indigo-50',
  REVISION_REQUESTED: 'text-yellow-600 bg-yellow-50',
  ARTICLE_PUBLISHED: 'text-emerald-500 bg-emerald-50',
  DEADLINE_APPROACHING: 'text-orange-500 bg-orange-50',
  DEADLINE_OVERDUE: 'text-red-500 bg-red-50',
}

const TYPE_LABELS: Record<string, string> = {
  SUBMISSION_RECEIVED: 'Bài viết mới',
  REVIEW_INVITED: 'Mời phản biện',
  REVIEW_REMINDER: 'Nhắc phản biện',
  REVIEW_COMPLETED: 'Phản biện xong',
  DECISION_MADE: 'Quyết định',
  REVISION_REQUESTED: 'Yêu cầu sửa',
  ARTICLE_PUBLISHED: 'Đã xuất bản',
  DEADLINE_APPROACHING: 'Sắp hết hạn',
  DEADLINE_OVERDUE: 'Quá hạn',
}

interface NotificationItemCardProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
}

export function NotificationItemCard({ notification, onMarkAsRead, onDelete }: NotificationItemCardProps) {
  const icon = ICONS[notification.type] ?? <Bell className="h-5 w-5" />
  const iconColor = ICON_COLORS[notification.type] ?? 'text-gray-500 bg-gray-50'
  const label = TYPE_LABELS[notification.type] ?? notification.type

  const handleMarkRead = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (!notification.isRead) onMarkAsRead(notification.id)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onDelete(notification.id)
  }

  const content = (
    <div className="flex gap-4 w-full">
      <div className={cn('flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center', iconColor)}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs shrink-0">{label}</Badge>
            {!notification.isRead && (
              <Badge variant="default" className="text-xs shrink-0 bg-blue-500">Mới</Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: vi })}
          </span>
        </div>
        <p className={cn('text-sm mb-1', !notification.isRead ? 'font-semibold' : 'font-medium')}>
          {notification.title}
        </p>
        <p className="text-sm text-muted-foreground line-clamp-2">{notification.message}</p>
      </div>
    </div>
  )

  return (
    <div
      className={cn(
        'group relative flex items-start gap-2 rounded-lg border p-4 transition-all hover:shadow-sm',
        !notification.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50/40' : 'bg-background hover:bg-accent/30'
      )}
    >
      {notification.link ? (
        <Link
          href={notification.link}
          className="flex-1 min-w-0"
          onClick={handleMarkRead}
        >
          {content}
        </Link>
      ) : (
        <div className="flex-1 min-w-0">{content}</div>
      )}

      {/* Actions — hiển thị khi hover */}
      <div className="flex flex-col gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {!notification.isRead && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title="Đánh dấu đã đọc"
            onClick={handleMarkRead}
          >
            <CheckCircle className="h-4 w-4 text-green-500" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          title="Xóa thông báo"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  )
}
