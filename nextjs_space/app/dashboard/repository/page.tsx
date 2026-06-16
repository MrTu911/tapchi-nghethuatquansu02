'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useDashboardSession } from '@/components/dashboard/session-context'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Database, Search, Plus, Eye, Loader2, RefreshCw, Archive, ShieldCheck,
  FileText, BookCheck, BookText, Download, X, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { TableScrollWrapper } from '@/components/dashboard/table-scroll-wrapper'
import {
  RepositoryArticleSheet,
  type RepositoryArticleRef,
} from '@/components/dashboard/repository-article-sheet'
import type { RepositoryArticleSource } from '@/lib/repository-link'

interface Article {
  id: string
  title: string
  authors: string
  categoryName: string
  publishedAt: string | null
  views: number
  downloads: number
  issueInfo: string
  sourceType: RepositoryArticleSource
}

interface Category {
  id: string
  name: string
}

interface RepositoryStats {
  totalArticles: number
  totalPeerReview: number
  totalJournalImport: number
  totalDownloads: number
}

const PAGE_SIZE = 20
const MANAGE_ROLES = ['SYSADMIN', 'EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'SECTION_EDITOR']

// Năm xuất bản để lọc: từ năm hiện tại lùi về 1987 (năm tạp chí bắt đầu hoạt động).
function buildYearOptions(): number[] {
  const current = new Date().getFullYear()
  const years: number[] = []
  for (let y = current; y >= 1987; y--) years.push(y)
  return years
}

const SOURCE_BADGE: Record<RepositoryArticleSource, { label: string; className: string }> = {
  PEER_REVIEW: {
    label: 'Qua phản biện',
    className: 'border-emerald-500/40 text-emerald-700 dark:text-emerald-400',
  },
  JOURNAL_IMPORT: {
    label: 'Kho số',
    className: 'border-amber-500/40 text-amber-700 dark:text-amber-500',
  },
}

export default function RepositoryDashboardPage() {
  const session = useDashboardSession()
  const canManage = MANAGE_ROLES.includes(session?.role ?? '')

  const [articles, setArticles] = useState<Article[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  // Bộ lọc — searchTerm là giá trị ô input; keyword là từ khóa đã "commit" (Enter/nút).
  // Tách hai biến để gõ phím KHÔNG gọi API mỗi ký tự (chỉ tìm khi bấm tìm kiếm).
  const [searchTerm, setSearchTerm] = useState('')
  const [keyword, setKeyword] = useState('')
  const [sourceType, setSourceType] = useState<string>('all')
  const [categoryId, setCategoryId] = useState<string>('all')
  const [year, setYear] = useState<string>('all')
  const [page, setPage] = useState(0)

  const [categories, setCategories] = useState<Category[]>([])
  const [stats, setStats] = useState<RepositoryStats | null>(null)

  // Drawer xem chi tiết
  const [selected, setSelected] = useState<RepositoryArticleRef | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const years = buildYearOptions()

  const fetchArticles = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (keyword) params.set('keyword', keyword)
      if (sourceType !== 'all') params.set('sourceType', sourceType)
      if (categoryId !== 'all') params.set('categoryId', categoryId)
      if (year !== 'all') params.set('year', year)
      params.set('limit', String(PAGE_SIZE))
      params.set('offset', String(page * PAGE_SIZE))

      const res = await fetch(`/api/repository/search?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setArticles(data.data.articles || [])
        setTotal(data.data.total || 0)
      } else {
        toast.error(data.error || 'Lỗi tải dữ liệu')
      }
    } catch {
      toast.error('Lỗi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }, [keyword, sourceType, categoryId, year, page])

  useEffect(() => {
    fetchArticles()
  }, [fetchArticles])

  // Danh mục + thống kê tải một lần khi vào trang.
  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.data)) {
          setCategories(d.data.map((c: any) => ({ id: c.id, name: c.name })))
        }
      })
      .catch(() => {})

    fetch('/api/repository/stats')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data?.overview) setStats(d.data.overview)
      })
      .catch(() => {})
  }, [])

  // Commit từ khóa + về trang đầu. Việc đổi keyword/page sẽ tự trigger fetch qua effect.
  const applyFilters = () => {
    setKeyword(searchTerm.trim())
    setPage(0)
  }

  const resetFilters = () => {
    setSearchTerm('')
    setKeyword('')
    setSourceType('all')
    setCategoryId('all')
    setYear('all')
    setPage(0)
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/repository/sync', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        toast.success(`Đồng bộ thành công: ${data.data.synced} bài báo`)
        fetchArticles()
      } else {
        toast.error(data.error || 'Lỗi đồng bộ')
      }
    } catch {
      toast.error('Lỗi đồng bộ dữ liệu')
    } finally {
      setSyncing(false)
    }
  }

  const openArticle = (article: Article) => {
    setSelected({ id: article.id, sourceType: article.sourceType, title: article.title })
    setSheetOpen(true)
  }

  const hasActiveFilters =
    keyword !== '' || sourceType !== 'all' || categoryId !== 'all' || year !== 'all'
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const fromRow = total === 0 ? 0 : page * PAGE_SIZE + 1
  const toRow = Math.min((page + 1) * PAGE_SIZE, total)

  return (
    <div className="theme-leadership space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Database className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Quản lý CSDL Bài báo</h1>
            <p className="text-sm text-muted-foreground">
              Kho dữ liệu bài báo của Tạp chí Nghệ thuật Quân sự Việt Nam
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/repository/press-archive">
              <Archive className="mr-2 h-4 w-4" />
              Bài báo lịch sử
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/repository/duplicate-check">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Kiểm tra trùng lặp
            </Link>
          </Button>
          {canManage && (
            <>
              <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
                {syncing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Đồng bộ Workflow
              </Button>
              <Button size="sm" asChild>
                <Link href="/dashboard/repository/new">
                  <Plus className="mr-2 h-4 w-4" /> Thêm bài báo
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={<FileText className="h-5 w-5" />}
          label="Tổng bài báo"
          value={stats?.totalArticles}
        />
        <StatCard
          icon={<BookCheck className="h-5 w-5" />}
          label="Qua phản biện"
          value={stats?.totalPeerReview}
        />
        <StatCard
          icon={<BookText className="h-5 w-5" />}
          label="Kho số (lưu trữ)"
          value={stats?.totalJournalImport}
        />
        <StatCard
          icon={<Download className="h-5 w-5" />}
          label="Tổng lượt tải"
          value={stats?.totalDownloads}
        />
      </div>

      {/* Bộ lọc */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo tiêu đề, tóm tắt, tác giả..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                  className="pl-9"
                />
              </div>
              <Button onClick={applyFilters} className="sm:w-auto">
                <Search className="mr-2 h-4 w-4" /> Tìm kiếm
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Select value={sourceType} onValueChange={(v) => { setSourceType(v); setPage(0) }}>
                <SelectTrigger className="w-[170px]">
                  <SelectValue placeholder="Nguồn bài" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả nguồn</SelectItem>
                  <SelectItem value="PEER_REVIEW">Qua phản biện</SelectItem>
                  <SelectItem value="JOURNAL_IMPORT">Kho số (lưu trữ)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); setPage(0) }}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Chuyên mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả chuyên mục</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={year} onValueChange={(v) => { setYear(v); setPage(0) }}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Năm" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả năm</SelectItem>
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  <X className="mr-1.5 h-4 w-4" /> Xóa lọc
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danh sách */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <TableScrollWrapper className="border-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[42%]">Tiêu đề</TableHead>
                    <TableHead>Tác giả</TableHead>
                    <TableHead>Nguồn</TableHead>
                    <TableHead>Số / Năm</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {articles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                        {hasActiveFilters
                          ? 'Không tìm thấy bài báo phù hợp bộ lọc.'
                          : 'Chưa có bài báo nào trong CSDL.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    articles.map((article) => {
                      const badge = SOURCE_BADGE[article.sourceType]
                      return (
                        <TableRow
                          key={`${article.sourceType}-${article.id}`}
                          className="cursor-pointer"
                          onClick={() => openArticle(article)}
                        >
                          <TableCell>
                            <span className="line-clamp-2 font-medium text-foreground hover:text-primary">
                              {article.title}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            <span className="line-clamp-1">{article.authors || '—'}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={badge.className}>
                              {badge.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {article.issueInfo || '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                openArticle(article)
                              }}
                            >
                              <Eye className="mr-1.5 h-4 w-4" /> Xem bài báo
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </TableScrollWrapper>
          )}

          {/* Phân trang */}
          {!loading && total > 0 && (
            <div className="flex flex-col items-center justify-between gap-3 border-t px-6 py-4 sm:flex-row">
              <p className="text-sm text-muted-foreground">
                Hiển thị <span className="font-medium text-foreground">{fromRow}–{toRow}</span> trong{' '}
                <span className="font-medium text-foreground">{total}</span> bài báo
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" /> Trước
                </Button>
                <span className="text-sm text-muted-foreground">
                  Trang {page + 1}/{totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => (p + 1 < totalPages ? p + 1 : p))}
                  disabled={page + 1 >= totalPages}
                >
                  Sau <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <RepositoryArticleSheet
        article={selected}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        canManage={canManage}
      />
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number | undefined
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          {value === undefined ? (
            <Skeleton className="h-7 w-14" />
          ) : (
            <p className="text-2xl font-bold leading-none text-foreground">
              {value.toLocaleString('vi-VN')}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}
