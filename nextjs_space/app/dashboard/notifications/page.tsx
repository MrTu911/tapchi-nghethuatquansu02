'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  Bell,
  CheckCheck,
  Loader2,
  Search,
  Send,
  Trash2,
  X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useNotificationList } from '@/hooks/useNotifications'
import { NotificationFilterSidebar } from '@/components/notifications/notification-filter-sidebar'
import { NotificationItemCard } from '@/components/notifications/notification-item-card'
import { SendNotificationDialog } from '@/components/notifications/send-notification-dialog'

const ADMIN_ROLES = ['SYSADMIN', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'EIC', 'SECTION_EDITOR']
const PAGE_SIZE = 10

function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false)
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(json => {
        const role = json?.data?.user?.role
        setIsAdmin(!!role && ADMIN_ROLES.includes(role))
      })
      .catch(() => {})
  }, [])
  return isAdmin
}

export default function NotificationsPage() {
  const isAdmin = useIsAdmin()

  const [activeFilter, setActiveFilter] = useState('ALL')
  const [keyword, setKeyword] = useState('')
  const [debouncedKeyword, setDebouncedKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [sendDialogOpen, setSendDialogOpen] = useState(false)

  // Debounce keyword
  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(keyword), 400)
    return () => clearTimeout(t)
  }, [keyword])

  // Reset về trang 1 khi đổi filter/keyword
  useEffect(() => {
    setPage(1)
  }, [activeFilter, debouncedKeyword])

  const filter = {
    type: activeFilter !== 'ALL' && activeFilter !== 'UNREAD' ? activeFilter : undefined,
    unreadOnly: activeFilter === 'UNREAD' || undefined,
    keyword: debouncedKeyword || undefined,
    page,
    pageSize: PAGE_SIZE,
  }

  const {
    notifications,
    pagination,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
  } = useNotificationList(filter)

  const readCount = pagination.total - unreadCount

  const handleFilterChange = useCallback((f: string) => {
    setActiveFilter(f)
    setKeyword('')
  }, [])

  const clearKeyword = () => {
    setKeyword('')
    setDebouncedKeyword('')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-7 w-7" />
            Thông báo
          </h1>
          <p className="text-muted-foreground mt-1">Quản lý và xem các thông báo của bạn</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setSendDialogOpen(true)} className="shrink-0">
            <Send className="mr-2 h-4 w-4" />
            Gửi thông báo
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Tổng thông báo" value={pagination.total} color="text-foreground" />
        <StatCard label="Chưa đọc" value={unreadCount} color="text-orange-500" />
        <StatCard label="Đã đọc" value={readCount} color="text-green-500" />
      </div>

      {/* Main layout: sidebar + list */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <NotificationFilterSidebar
          activeFilter={activeFilter}
          unreadCount={unreadCount}
          totalCount={pagination.total}
          onFilterChange={handleFilterChange}
        />

        {/* Right panel */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                placeholder="Tìm kiếm thông báo..."
                className="pl-9 pr-8"
              />
              {keyword && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={clearKeyword}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  <CheckCheck className="mr-1.5 h-4 w-4" />
                  Đọc tất cả
                </Button>
              )}
              {readCount > 0 && (
                <Button variant="outline" size="sm" onClick={deleteAllRead} className="text-destructive hover:text-destructive">
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  Xóa đã đọc
                </Button>
              )}
            </div>
          </div>

          {/* Active filter badge */}
          {(activeFilter !== 'ALL' || debouncedKeyword) && (
            <div className="flex items-center gap-2 flex-wrap">
              {activeFilter !== 'ALL' && (
                <Badge variant="secondary" className="gap-1">
                  {activeFilter === 'UNREAD' ? 'Chưa đọc' : activeFilter}
                  <button onClick={() => setActiveFilter('ALL')}><X className="h-3 w-3" /></button>
                </Badge>
              )}
              {debouncedKeyword && (
                <Badge variant="secondary" className="gap-1">
                  &quot;{debouncedKeyword}&quot;
                  <button onClick={clearKeyword}><X className="h-3 w-3" /></button>
                </Badge>
              )}
            </div>
          )}

          {/* List */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <ErrorState message={error} onRetry={() => window.location.reload()} />
          ) : notifications.length === 0 ? (
            <EmptyState filter={activeFilter} keyword={debouncedKeyword} />
          ) : (
            <div className="space-y-2">
              {notifications.map(n => (
                <NotificationItemCard
                  key={n.id}
                  notification={n}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Pagination
              current={pagination.page}
              total={pagination.totalPages}
              onChange={setPage}
            />
          )}
        </div>
      </div>

      {isAdmin && (
        <SendNotificationDialog
          open={sendDialogOpen}
          onOpenChange={setSendDialogOpen}
        />
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
      </CardContent>
    </Card>
  )
}

function EmptyState({ filter, keyword }: { filter: string; keyword: string }) {
  let title = 'Chưa có thông báo nào'
  let desc = 'Thông báo mới sẽ xuất hiện ở đây'
  if (filter === 'UNREAD') {
    title = 'Không có thông báo chưa đọc'
    desc = 'Bạn đã đọc tất cả thông báo'
  } else if (keyword) {
    title = 'Không tìm thấy thông báo'
    desc = `Không có kết quả phù hợp với "${keyword}"`
  } else if (filter !== 'ALL') {
    title = 'Không có thông báo loại này'
    desc = 'Chưa có thông báo thuộc danh mục này'
  }
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <Bell className="h-14 w-14 text-muted-foreground opacity-40 mb-4" />
        <h3 className="text-base font-semibold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </CardContent>
    </Card>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-3">
        <p className="text-sm text-destructive">{message}</p>
        <Button variant="outline" size="sm" onClick={onRetry}>Thử lại</Button>
      </CardContent>
    </Card>
  )
}

function Pagination({ current, total, onChange }: { current: number; total: number; onChange: (p: number) => void }) {
  const pages = Array.from({ length: total }, (_, i) => i + 1)
  const visible = pages.filter(p => p === 1 || p === total || Math.abs(p - current) <= 1)
  const withEllipsis: (number | '...')[] = []
  let prev = 0
  for (const p of visible) {
    if (p - prev > 1) withEllipsis.push('...')
    withEllipsis.push(p)
    prev = p
  }

  return (
    <div className="flex items-center justify-center gap-1 pt-2">
      <Button variant="outline" size="sm" disabled={current === 1} onClick={() => onChange(current - 1)}>
        ←
      </Button>
      {withEllipsis.map((p, i) =>
        p === '...' ? (
          <span key={`e-${i}`} className="px-2 text-muted-foreground text-sm">…</span>
        ) : (
          <Button
            key={p}
            variant={p === current ? 'default' : 'outline'}
            size="sm"
            className="w-8 h-8 p-0"
            onClick={() => onChange(p as number)}
          >
            {p}
          </Button>
        )
      )}
      <Button variant="outline" size="sm" disabled={current === total} onClick={() => onChange(current + 1)}>
        →
      </Button>
    </div>
  )
}
