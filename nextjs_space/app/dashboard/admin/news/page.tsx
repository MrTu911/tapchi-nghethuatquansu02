"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { toast } from 'sonner'
import {
  PlusCircle, Edit, Trash2, Eye, Search, Loader2, Calendar, User, Star,
  FileText, CheckCircle2, FileEdit, Newspaper, ChevronLeft, ChevronRight,
  Send, Undo2, X,
} from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { getImageUrl } from '@/lib/image-utils-client'
import {
  NEWS_CATEGORIES, NEWS_SORT_OPTIONS, getNewsCategoryBadgeClass, getNewsCategoryLabel,
  type NewsSortOption,
} from '@/lib/news-constants'
import { cn } from '@/lib/utils'

interface NewsItem {
  id: string
  slug: string
  title: string
  titleEn?: string | null
  summary?: string | null
  coverImage?: string | null
  coverImageSigned?: string | null
  category?: string | null
  tags: string[]
  isPublished: boolean
  isFeatured: boolean
  publishedAt?: string | null
  createdAt: string
  views: number
  author?: { fullName: string; email: string } | null
}

const PAGE_SIZE = 12

export default function NewsManagementPage() {
  const router = useRouter()

  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [searchInput, setSearchInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [featuredOnly, setFeaturedOnly] = useState(false)
  const [sort, setSort] = useState<NewsSortOption>('newest')

  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0, featured: 0 })
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  // ── Debounce ô tìm kiếm ────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      setKeyword(searchInput.trim())
      setPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [searchInput])

  const fetchStats = useCallback(async () => {
    try {
      const counts = await Promise.all([
        fetch('/api/news?limit=1').then((r) => r.json()),
        fetch('/api/news?limit=1&isPublished=true').then((r) => r.json()),
        fetch('/api/news?limit=1&isPublished=false').then((r) => r.json()),
        fetch('/api/news?limit=1&isFeatured=true').then((r) => r.json()),
      ])
      setStats({
        total: counts[0]?.data?.pagination?.total ?? 0,
        published: counts[1]?.data?.pagination?.total ?? 0,
        draft: counts[2]?.data?.pagination?.total ?? 0,
        featured: counts[3]?.data?.pagination?.total ?? 0,
      })
    } catch {
      /* stats không quan trọng — bỏ qua lỗi nhẹ */
    }
  }, [])

  const fetchNews = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(PAGE_SIZE))
      params.set('sort', sort)
      if (keyword) params.set('keyword', keyword)
      if (categoryFilter !== 'all') params.set('category', categoryFilter)
      if (statusFilter === 'published') params.set('isPublished', 'true')
      if (statusFilter === 'draft') params.set('isPublished', 'false')
      if (featuredOnly) params.set('isFeatured', 'true')

      const res = await fetch(`/api/news?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setNews(data.data.news)
        setTotalPages(data.data.pagination.totalPages || 1)
        setTotal(data.data.pagination.total || 0)
      } else {
        toast.error('Lỗi khi tải danh sách tin tức')
      }
    } catch {
      toast.error('Lỗi kết nối')
    } finally {
      setLoading(false)
    }
  }, [page, sort, keyword, categoryFilter, statusFilter, featuredOnly])

  useEffect(() => { fetchNews() }, [fetchNews])
  useEffect(() => { fetchStats() }, [fetchStats])

  const refresh = () => {
    fetchNews()
    fetchStats()
  }

  const patchNews = async (id: string, body: Record<string, unknown>, okMsg: string) => {
    try {
      setBusyId(id)
      const res = await fetch(`/api/news/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(okMsg)
        refresh()
      } else {
        toast.error(data.error || data.message || 'Lỗi khi cập nhật')
      }
    } catch {
      toast.error('Lỗi kết nối')
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/news/${deleteId}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('Đã xóa tin tức')
        refresh()
      } else {
        toast.error(data.error || 'Lỗi khi xóa tin tức')
      }
    } catch {
      toast.error('Lỗi kết nối')
    } finally {
      setDeleteId(null)
    }
  }

  const hasActiveFilters =
    keyword !== '' || categoryFilter !== 'all' || statusFilter !== 'all' || featuredOnly

  const clearFilters = () => {
    setSearchInput('')
    setKeyword('')
    setCategoryFilter('all')
    setStatusFilter('all')
    setFeaturedOnly(false)
    setPage(1)
  }

  const statCards = [
    { label: 'Tổng số', value: stats.total, icon: Newspaper, color: 'text-gray-600', bg: 'bg-gray-50 dark:bg-gray-800' },
    { label: 'Đã đăng', value: stats.published, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Bản nháp', value: stats.draft, icon: FileEdit, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Nổi bật', value: stats.featured, icon: Star, color: 'text-[#D4A843]', bg: 'bg-[#FFF3CC]/60 dark:bg-yellow-900/20' },
  ]

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Quản lý Tin tức
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">
              Quản lý tin tức, thông báo, sự kiện của Tạp chí Nghệ thuật Quân sự Việt Nam
            </p>
          </div>
          <Button
            onClick={() => router.push('/dashboard/admin/news/create')}
            className="bg-[#1E3924] text-white hover:bg-[#295232]"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Tạo tin mới
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {statCards.map((s) => (
            <div key={s.label} className={`${s.bg} rounded-xl border border-gray-100 p-4 dark:border-gray-700`}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500">{s.label}</p>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Tìm theo tiêu đề, tóm tắt..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1) }}>
            <SelectTrigger className="lg:w-44"><SelectValue placeholder="Danh mục" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả danh mục</SelectItem>
              {NEWS_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
            <SelectTrigger className="lg:w-36"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="published">Đã đăng</SelectItem>
              <SelectItem value="draft">Bản nháp</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={(v) => { setSort(v as NewsSortOption); setPage(1) }}>
            <SelectTrigger className="lg:w-44"><SelectValue placeholder="Sắp xếp" /></SelectTrigger>
            <SelectContent>
              {NEWS_SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant={featuredOnly ? 'default' : 'outline'}
            className={cn(featuredOnly && 'bg-[#D4A843] text-white hover:bg-[#c29a36]')}
            onClick={() => { setFeaturedOnly((v) => !v); setPage(1) }}
          >
            <Star className="mr-2 h-4 w-4" fill={featuredOnly ? 'currentColor' : 'none'} />
            Nổi bật
          </Button>

          {hasActiveFilters && (
            <Button type="button" variant="ghost" onClick={clearFilters} title="Xóa bộ lọc">
              <X className="mr-1 h-4 w-4" /> Xóa lọc
            </Button>
          )}
        </div>

        {/* Table */}
        <Card className="overflow-hidden border-gray-100 dark:border-gray-700">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center gap-3 p-12">
                <Loader2 className="h-6 w-6 animate-spin text-[#1E3924]" />
                <span className="text-gray-500">Đang tải...</span>
              </div>
            ) : news.length === 0 ? (
              <div className="p-12 text-center">
                <Newspaper className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                <p className="text-gray-400">
                  {hasActiveFilters ? 'Không có tin tức phù hợp bộ lọc' : 'Chưa có tin tức nào'}
                </p>
                {hasActiveFilters && (
                  <Button variant="link" className="mt-1 text-[#1E3924]" onClick={clearFilters}>
                    Xóa bộ lọc
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                    <TableHead className="w-14">Ảnh</TableHead>
                    <TableHead>Tiêu đề</TableHead>
                    <TableHead className="w-32">Danh mục</TableHead>
                    <TableHead className="w-28">Tác giả</TableHead>
                    <TableHead className="w-28">Trạng thái</TableHead>
                    <TableHead className="w-20 text-center">Lượt xem</TableHead>
                    <TableHead className="w-28">Ngày</TableHead>
                    <TableHead className="w-40 text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {news.map((item) => (
                    <TableRow
                      key={item.id}
                      className={cn('group', item.isFeatured && 'border-l-2 border-l-[#D4A843]')}
                    >
                      {/* Thumbnail */}
                      <TableCell>
                        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                          {item.coverImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.coverImageSigned || getImageUrl(item.coverImage)}
                              alt=""
                              className="h-full w-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                            />
                          ) : (
                            <FileText className="h-4 w-4 text-gray-300" />
                          )}
                        </div>
                      </TableCell>

                      {/* Title */}
                      <TableCell>
                        <button
                          onClick={() => router.push(`/dashboard/admin/news/${item.id}`)}
                          className="space-y-0.5 text-left"
                        >
                          <div className="line-clamp-1 font-medium text-gray-800 group-hover:text-[#1E3924] dark:text-gray-200 dark:group-hover:text-emerald-400">
                            {item.title}
                          </div>
                          {item.titleEn && (
                            <div className="line-clamp-1 text-xs italic text-gray-400">{item.titleEn}</div>
                          )}
                          {item.isFeatured && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#D4A843]">
                              <Star className="h-2.5 w-2.5" fill="currentColor" /> Nổi bật
                            </span>
                          )}
                        </button>
                      </TableCell>

                      {/* Category */}
                      <TableCell>
                        <Badge variant="outline" className={cn('text-xs', getNewsCategoryBadgeClass(item.category))}>
                          {getNewsCategoryLabel(item.category)}
                        </Badge>
                      </TableCell>

                      {/* Author */}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                          <span className="max-w-[80px] truncate text-sm text-gray-600 dark:text-gray-300">
                            {item.author?.fullName || '—'}
                          </span>
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        {item.isPublished ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                            Đã đăng
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/30">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                            Nháp
                          </span>
                        )}
                      </TableCell>

                      {/* Views */}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1 text-sm text-gray-500">
                          <Eye className="h-3.5 w-3.5" />
                          {item.views.toLocaleString()}
                        </div>
                      </TableCell>

                      {/* Date */}
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Calendar className="h-3 w-3 flex-shrink-0" />
                          {format(new Date(item.publishedAt || item.createdAt), 'dd/MM/yyyy', { locale: vi })}
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {busyId === item.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin text-gray-400" />
                          ) : (
                            <>
                              <IconAction
                                tooltip={item.isPublished ? 'Chuyển về nháp' : 'Xuất bản ngay'}
                                onClick={() => patchNews(
                                  item.id,
                                  { isPublished: !item.isPublished },
                                  item.isPublished ? 'Đã chuyển về nháp' : 'Đã xuất bản',
                                )}
                                className={item.isPublished ? 'text-amber-500 hover:text-amber-600' : 'text-emerald-500 hover:text-emerald-600'}
                              >
                                {item.isPublished ? <Undo2 className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
                              </IconAction>

                              <IconAction
                                tooltip={item.isFeatured ? 'Bỏ nổi bật' : 'Đánh dấu nổi bật'}
                                onClick={() => patchNews(
                                  item.id,
                                  { isFeatured: !item.isFeatured },
                                  item.isFeatured ? 'Đã bỏ nổi bật' : 'Đã đánh dấu nổi bật',
                                )}
                                className={item.isFeatured ? 'text-[#D4A843]' : 'text-gray-300 hover:text-[#D4A843]'}
                              >
                                <Star className="h-3.5 w-3.5" fill={item.isFeatured ? 'currentColor' : 'none'} />
                              </IconAction>

                              {item.isPublished && (
                                <Link href={`/news/${item.slug}`} target="_blank">
                                  <IconAction tooltip="Xem trên trang công khai" className="text-gray-400 hover:text-sky-600">
                                    <Eye className="h-3.5 w-3.5" />
                                  </IconAction>
                                </Link>
                              )}

                              <IconAction
                                tooltip="Chỉnh sửa"
                                onClick={() => router.push(`/dashboard/admin/news/${item.id}`)}
                                className="text-gray-400 hover:text-[#1E3924]"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </IconAction>

                              <IconAction
                                tooltip="Xóa"
                                onClick={() => setDeleteId(item.id)}
                                className="text-gray-300 hover:text-red-500"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </IconAction>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {!loading && news.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-gray-500">
              Trang {page}/{totalPages} · {total.toLocaleString()} tin
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="mr-1 h-4 w-4" /> Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Sau <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn xóa tin tức này? Hành động này không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
                Xóa
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  )
}

/** Nút icon nhỏ kèm tooltip — dùng lại cho các thao tác trong bảng. */
function IconAction({
  tooltip, onClick, className, children,
}: {
  tooltip: string
  onClick?: () => void
  className?: string
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn('h-7 w-7 p-0', className)}
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  )
}
