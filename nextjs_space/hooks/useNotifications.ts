'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  link?: string | null
  metadata?: unknown
}

export interface NotificationPagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface NotificationFilter {
  type?: string
  keyword?: string
  unreadOnly?: boolean
  page?: number
  pageSize?: number
}

interface FetchResult {
  notifications: Notification[]
  unreadCount: number
  pagination: NotificationPagination
}

async function fetchNotificationsApi(filter: NotificationFilter): Promise<FetchResult> {
  const params = new URLSearchParams()
  if (filter.page) params.set('page', String(filter.page))
  if (filter.pageSize) params.set('pageSize', String(filter.pageSize))
  if (filter.unreadOnly) params.set('unreadOnly', 'true')
  if (filter.type) params.set('type', filter.type)
  if (filter.keyword) params.set('keyword', filter.keyword)

  const res = await fetch(`/api/notifications?${params.toString()}`)
  if (!res.ok) throw new Error('Không thể tải thông báo')
  const json = await res.json()
  return json.data
}

export function useNotificationList(filter: NotificationFilter) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [pagination, setPagination] = useState<NotificationPagination>({ page: 1, pageSize: 10, total: 0, totalPages: 0 })
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchData = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    try {
      setLoading(true)
      setError(null)
      const result = await fetchNotificationsApi(filter)
      setNotifications(result.notifications)
      setPagination(result.pagination)
      setUnreadCount(result.unreadCount)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      setError('Không thể tải thông báo')
    } finally {
      setLoading(false)
    }
  }, [
    filter.type,
    filter.keyword,
    filter.unreadOnly,
    filter.page,
    filter.pageSize,
  ])

  useEffect(() => {
    fetchData()
    return () => abortRef.current?.abort()
  }, [fetchData])

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      })
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {
      toast.error('Không thể đánh dấu đã đọc')
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true }),
      })
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
      toast.success('Đã đánh dấu tất cả là đã đọc')
    } catch {
      toast.error('Có lỗi xảy ra')
    }
  }, [])

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      })
      setNotifications(prev => {
        const removed = prev.find(n => n.id === notificationId)
        if (removed && !removed.isRead) setUnreadCount(c => Math.max(0, c - 1))
        return prev.filter(n => n.id !== notificationId)
      })
      setPagination(prev => ({ ...prev, total: prev.total - 1 }))
      toast.success('Đã xóa thông báo')
    } catch {
      toast.error('Không thể xóa thông báo')
    }
  }, [])

  const deleteAllRead = useCallback(async () => {
    try {
      await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteAllRead: true }),
      })
      await fetchData()
      toast.success('Đã xóa tất cả thông báo đã đọc')
    } catch {
      toast.error('Không thể xóa thông báo')
    }
  }, [fetchData])

  return {
    notifications,
    pagination,
    unreadCount,
    loading,
    error,
    refetch: fetchData,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
  }
}

export function useUnreadCount() {
  const [count, setCount] = useState(0)

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?pageSize=1')
      if (!res.ok) return
      const json = await res.json()
      setCount(json.data?.unreadCount ?? 0)
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    fetch_()
    const interval = setInterval(fetch_, 30000)
    return () => clearInterval(interval)
  // fetch_ has empty useCallback deps so it's stable across renders — no need to list it
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { count, refetch: fetch_ }
}
