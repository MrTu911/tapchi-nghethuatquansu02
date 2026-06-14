"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  PlusCircle, Edit, Trash2, Eye, Search, Loader2, Calendar,
  User, Star, FileText, CheckCircle2, FileEdit, Newspaper,
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
  summary?: string | null
  coverImage?: string | null
  category?: string | null
  tags: string[]
  isPublished: boolean
  isFeatured: boolean
  publishedAt?: Date | null
  createdAt: Date
  views: number
  author?: { fullName: string; email: string }
}

const NEWS_CATEGORIES = [
  { value: 'announcement', label: 'Thông báo' },
  { value: 'event', label: 'Sự kiện' },
  { value: 'call_for_paper', label: 'Call for Papers' },
  { value: 'policy', label: 'Chính sách' },
  { value: 'research_news', label: 'Tin nghiên cứu' },
  { value: 'interview', label: 'Phỏng vấn' },
  { value: 'award', label: 'Giải thưởng' },
  { value: 'conference', label: 'Hội thảo' },
]

function getCategoryLabel(category?: string | null) {
  if (!category) return 'Chưa phân loại'
  return NEWS_CATEGORIES.find((c) => c.value === category)?.label || category
}

export default function NewsManagementPage() {
  const router = useRouter()
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => { fetchNews() }, [categoryFilter, statusFilter])

  const fetchNews = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (categoryFilter !== 'all') params.append('category', categoryFilter)
      if (statusFilter === 'published') params.append('isPublished', 'true')
      if (statusFilter === 'draft') params.append('isPublished', 'false')
      const res = await fetch(`/api/news?${params}`)
      const data = await res.json()
      if (data.success) setNews(data.data.news)
      else toast.error('Lỗi khi tải danh sách tin tức')
    } catch {
      toast.error('Lỗi kết nối')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/news/${deleteId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) { toast.success('Đã xóa tin tức'); fetchNews() }
      else toast.error('Lỗi khi xóa tin tức')
    } catch { toast.error('Lỗi kết nối') }
    finally { setDeleteId(null) }
  }

  const handleToggleFeatured = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`/api/news/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !current }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(!current ? 'Đã đánh dấu nổi bật' : 'Đã bỏ nổi bật')
        fetchNews()
      } else toast.error('Lỗi khi cập nhật')
    } catch { toast.error('Lỗi kết nối') }
  }

  const filteredNews = news.filter((item) => {
    if (!searchTerm.trim()) return true
    const q = searchTerm.toLowerCase()
    return item.title.toLowerCase().includes(q) || item.titleEn?.toLowerCase().includes(q)
  })

  // Stats computed from full list (unfiltered by search)
  const stats = {
    total: news.length,
    published: news.filter((n) => n.isPublished).length,
    draft: news.filter((n) => !n.isPublished).length,
    featured: news.filter((n) => n.isFeatured).length,
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Quản lý Tin tức
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Quản lý tin tức, thông báo, sự kiện của tạp chí
          </p>
        </div>
        <Button
          onClick={() => router.push('/dashboard/admin/news/create')}
          className="bg-[#295232] hover:bg-[#1E3924] text-white"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Tạo tin mới
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Tổng số', value: stats.total, icon: Newspaper, color: 'text-gray-600', bg: 'bg-gray-50 dark:bg-gray-800' },
          { label: 'Đã đăng', value: stats.published, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Bản nháp', value: stats.draft, icon: FileEdit, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: 'Nổi bật', value: stats.featured, icon: Star, color: 'text-[#D4A843]', bg: 'bg-[#FFF3CC]/60 dark:bg-yellow-900/20' },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-gray-100 dark:border-gray-700`}>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 font-medium">{s.label}</p>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Tìm kiếm theo tiêu đề..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Danh mục" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả danh mục</SelectItem>
            {NEWS_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-40">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="published">Đã đăng</SelectItem>
            <SelectItem value="draft">Bản nháp</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="overflow-hidden border-gray-100 dark:border-gray-700">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-12 gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-[#295232]" />
              <span className="text-gray-500">Đang tải...</span>
            </div>
          ) : filteredNews.length === 0 ? (
            <div className="text-center p-12">
              <Newspaper className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">Chưa có tin tức nào</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                  <TableHead className="w-12">Ảnh</TableHead>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead className="w-32">Danh mục</TableHead>
                  <TableHead className="w-28">Tác giả</TableHead>
                  <TableHead className="w-28">Trạng thái</TableHead>
                  <TableHead className="w-20 text-center">Lượt xem</TableHead>
                  <TableHead className="w-28">Ngày đăng</TableHead>
                  <TableHead className="text-right w-32">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNews.map((item) => (
                  <TableRow
                    key={item.id}
                    className={item.isFeatured ? 'border-l-2 border-l-[#D4A843]' : ''}
                  >
                    {/* Thumbnail */}
                    <TableCell>
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                        {item.coverImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.coverImage}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        ) : (
                          <FileText className="w-4 h-4 text-gray-300" />
                        )}
                      </div>
                    </TableCell>

                    {/* Title */}
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="font-medium text-gray-800 dark:text-gray-200 line-clamp-1">
                          {item.title}
                        </div>
                        {item.titleEn && (
                          <div className="text-xs text-gray-400 italic line-clamp-1">{item.titleEn}</div>
                        )}
                        {item.isFeatured && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#D4A843]">
                            <Star className="w-2.5 h-2.5" fill="currentColor" /> Nổi bật
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Category */}
                    <TableCell>
                      <Badge variant="outline" className="text-xs border-gray-200 text-gray-600 dark:text-gray-300">
                        {getCategoryLabel(item.category)}
                      </Badge>
                    </TableCell>

                    {/* Author */}
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-[80px]">
                          {item.author?.fullName || '—'}
                        </span>
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      {item.isPublished ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                          Đã đăng
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
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
                        {item.publishedAt
                          ? format(new Date(item.publishedAt), 'dd/MM/yyyy', { locale: vi })
                          : format(new Date(item.createdAt), 'dd/MM/yyyy', { locale: vi })
                        }
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-1">
                        {item.isPublished && (
                          <Link href={`/news/${item.slug}`} target="_blank">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-sky-600">
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-7 w-7 p-0 ${item.isFeatured ? 'text-[#D4A843]' : 'text-gray-300 hover:text-[#D4A843]'}`}
                          onClick={() => handleToggleFeatured(item.id, item.isFeatured)}
                          title={item.isFeatured ? 'Bỏ nổi bật' : 'Đánh dấu nổi bật'}
                        >
                          <Star className="h-3.5 w-3.5" fill={item.isFeatured ? 'currentColor' : 'none'} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-gray-400 hover:text-[#295232]"
                          onClick={() => router.push(`/dashboard/admin/news/${item.id}`)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-gray-300 hover:text-red-500"
                          onClick={() => setDeleteId(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
  )
}
