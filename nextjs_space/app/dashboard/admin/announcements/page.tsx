"use client"

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Bell, PlusCircle, Edit, Trash2, Eye, EyeOff, Search, Loader2,
  Calendar, User, Star, FileText, Globe, FileEdit,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

interface NewsItem {
  id: string
  slug: string
  title: string
  titleEn?: string | null
  category?: string | null
  tags: string[]
  isPublished: boolean
  isFeatured: boolean
  publishedAt?: string | null
  createdAt: string
  views: number
  author?: { fullName: string; email: string } | null
}

const ANNOUNCEMENT_CATEGORIES = [
  { value: 'announcement', label: 'Thông báo', badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' },
  { value: 'event', label: 'Sự kiện', badgeClass: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' },
  { value: 'call_for_paper', label: 'Tuyển bài', badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' },
  { value: 'policy', label: 'Chính sách', badgeClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' },
]

const CATEGORY_MAP = Object.fromEntries(ANNOUNCEMENT_CATEGORIES.map(c => [c.value, c]))

function getCategoryDisplay(category?: string | null) {
  if (!category) return { label: 'Chưa phân loại', badgeClass: 'bg-slate-100 text-slate-500' }
  return CATEGORY_MAP[category] ?? { label: category, badgeClass: 'bg-slate-100 text-slate-500' }
}

export default function AnnouncementsManagementPage() {
  const router = useRouter()
  const [items, setItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => { fetchItems() }, [])

  async function fetchItems() {
    try {
      setLoading(true)
      const res = await fetch(
        '/api/news?categories=announcement,event,call_for_paper,policy&limit=100'
      )
      const data = await res.json()
      if (data.success) setItems(data.data.news ?? [])
      else toast.error('Lỗi khi tải danh sách thông báo')
    } catch {
      toast.error('Lỗi kết nối')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/news/${deleteId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Đã xóa thông báo')
        setItems(prev => prev.filter(i => i.id !== deleteId))
      } else toast.error('Lỗi khi xóa')
    } catch {
      toast.error('Lỗi kết nối')
    } finally {
      setDeleteId(null)
    }
  }

  async function handleTogglePublish(id: string, current: boolean) {
    try {
      const res = await fetch(`/api/news/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !current }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(!current ? 'Đã công khai' : 'Đã chuyển sang nháp')
        setItems(prev => prev.map(i => i.id === id ? { ...i, isPublished: !current } : i))
      } else toast.error('Lỗi khi cập nhật')
    } catch {
      toast.error('Lỗi kết nối')
    }
  }

  async function handleToggleFeatured(id: string, current: boolean) {
    try {
      const res = await fetch(`/api/news/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !current }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(!current ? 'Đã đánh dấu nổi bật' : 'Đã bỏ nổi bật')
        setItems(prev => prev.map(i => i.id === id ? { ...i, isFeatured: !current } : i))
      } else toast.error('Lỗi khi cập nhật')
    } catch {
      toast.error('Lỗi kết nối')
    }
  }

  const stats = useMemo(() => ({
    total: items.length,
    published: items.filter(i => i.isPublished).length,
    draft: items.filter(i => !i.isPublished).length,
    events: items.filter(i => i.category === 'event').length,
  }), [items])

  const displayedItems = useMemo(() => {
    return items.filter(item => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false
      if (statusFilter === 'published' && !item.isPublished) return false
      if (statusFilter === 'draft' && item.isPublished) return false
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase()
        if (!item.title.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [items, categoryFilter, statusFilter, searchTerm])

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md">
            <Bell className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Thông báo & Sự kiện
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Quản lý thông báo, sự kiện, tuyển bài và chính sách
            </p>
          </div>
        </div>
        <Button
          onClick={() => router.push('/dashboard/admin/news/create?category=announcement')}
          className="bg-[#295232] hover:bg-[#1E3924] text-white shadow-sm"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Tạo thông báo mới
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl p-4 border border-slate-100 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-500 font-medium">Tổng thông báo</p>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-3xl font-bold text-slate-700 dark:text-slate-200">{stats.total}</p>
          <p className="text-xs text-slate-400 mt-1">tất cả loại</p>
        </div>

        <div className="rounded-xl p-4 border border-emerald-100 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-emerald-600 font-medium">Đã công khai</p>
            <Globe className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">{stats.published}</p>
          <p className="text-xs text-emerald-500 mt-1">đang hiển thị</p>
        </div>

        <div className="rounded-xl p-4 border border-amber-100 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/20">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-amber-600 font-medium">Bản nháp</p>
            <FileEdit className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-amber-700 dark:text-amber-400">{stats.draft}</p>
          <p className="text-xs text-amber-500 mt-1">chưa công khai</p>
        </div>

        <div className="rounded-xl p-4 border border-purple-100 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-purple-600 font-medium">Sự kiện</p>
            <Calendar className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-purple-700 dark:text-purple-400">{stats.events}</p>
          <p className="text-xs text-purple-500 mt-1">loại sự kiện</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Tìm kiếm theo tiêu đề..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Loại thông báo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả loại</SelectItem>
            {ANNOUNCEMENT_CATEGORIES.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-36">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="published">Đã đăng</SelectItem>
            <SelectItem value="draft">Bản nháp</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="overflow-hidden border-gray-100 dark:border-gray-700 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-16 gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              <span className="text-gray-400 text-sm">Đang tải...</span>
            </div>
          ) : displayedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center">
              <div className="h-14 w-14 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-3">
                <Bell className="w-7 h-7 text-blue-300" />
              </div>
              <p className="text-gray-400 font-medium">Chưa có thông báo nào</p>
              <p className="text-gray-300 text-sm mt-1">Tạo thông báo đầu tiên để bắt đầu</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-50 dark:hover:bg-gray-800/60">
                  <TableHead className="font-semibold text-gray-600 dark:text-gray-300">Tiêu đề</TableHead>
                  <TableHead className="w-32 font-semibold text-gray-600 dark:text-gray-300">Loại</TableHead>
                  <TableHead className="w-28 font-semibold text-gray-600 dark:text-gray-300">Tác giả</TableHead>
                  <TableHead className="w-32 font-semibold text-gray-600 dark:text-gray-300">Trạng thái</TableHead>
                  <TableHead className="w-20 text-center font-semibold text-gray-600 dark:text-gray-300">Xem</TableHead>
                  <TableHead className="w-28 font-semibold text-gray-600 dark:text-gray-300">Ngày đăng</TableHead>
                  <TableHead className="text-right w-36 font-semibold text-gray-600 dark:text-gray-300">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedItems.map(item => {
                  const cat = getCategoryDisplay(item.category)
                  const dateStr = item.publishedAt
                    ? format(new Date(item.publishedAt), 'dd/MM/yyyy', { locale: vi })
                    : format(new Date(item.createdAt), 'dd/MM/yyyy', { locale: vi })

                  return (
                    <TableRow
                      key={item.id}
                      className={`transition-colors ${item.isFeatured ? 'border-l-2 border-l-blue-400' : ''}`}
                    >
                      {/* Title */}
                      <TableCell>
                        <div className="space-y-0.5 max-w-sm">
                          <p className="font-medium text-gray-800 dark:text-gray-200 line-clamp-1">
                            {item.title}
                          </p>
                          {item.isFeatured && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-500">
                              <Star className="w-2.5 h-2.5" fill="currentColor" /> Nổi bật
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Category badge */}
                      <TableCell>
                        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${cat.badgeClass}`}>
                          {cat.label}
                        </span>
                      </TableCell>

                      {/* Author */}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
                          <span className="text-sm text-gray-500 truncate max-w-[80px]">
                            {item.author?.fullName || '—'}
                          </span>
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        {item.isPublished ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                            Đã đăng
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 dark:bg-amber-900/30 px-2.5 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                            Nháp
                          </span>
                        )}
                      </TableCell>

                      {/* Views */}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1 text-sm text-gray-400">
                          <Eye className="h-3.5 w-3.5" />
                          {item.views.toLocaleString()}
                        </div>
                      </TableCell>

                      {/* Date */}
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Calendar className="h-3 w-3 flex-shrink-0" />
                          {dateStr}
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-0.5">
                          {item.isPublished && (
                            <Link href={`/news/${item.slug}`} target="_blank">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-gray-300 hover:text-sky-500"
                                title="Xem bài"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-7 w-7 p-0 ${item.isFeatured ? 'text-amber-400' : 'text-gray-300 hover:text-amber-400'}`}
                            onClick={() => handleToggleFeatured(item.id, item.isFeatured)}
                            title={item.isFeatured ? 'Bỏ nổi bật' : 'Đánh dấu nổi bật'}
                          >
                            <Star className="h-3.5 w-3.5" fill={item.isFeatured ? 'currentColor' : 'none'} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-7 w-7 p-0 ${item.isPublished ? 'text-emerald-400 hover:text-amber-400' : 'text-gray-300 hover:text-emerald-500'}`}
                            onClick={() => handleTogglePublish(item.id, item.isPublished)}
                            title={item.isPublished ? 'Chuyển về nháp' : 'Công khai'}
                          >
                            {item.isPublished
                              ? <EyeOff className="h-3.5 w-3.5" />
                              : <Globe className="h-3.5 w-3.5" />
                            }
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-gray-300 hover:text-[#295232]"
                            onClick={() => router.push(`/dashboard/admin/news/${item.id}`)}
                            title="Chỉnh sửa"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-gray-300 hover:text-red-500"
                            onClick={() => setDeleteId(item.id)}
                            title="Xóa"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Xem thêm link sang trang tin tức tổng */}
      {!loading && items.length > 0 && (
        <div className="flex justify-between items-center text-sm text-gray-400">
          <span>Hiển thị {displayedItems.length} / {items.length} mục</span>
          <Link
            href="/dashboard/admin/news"
            className="text-[#295232] hover:underline font-medium"
          >
            Xem tất cả tin tức →
          </Link>
        </div>
      )}

      {/* Delete dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa thông báo</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa thông báo này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
