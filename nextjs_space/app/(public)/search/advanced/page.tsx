'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Filter, X, Eye, Download, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Category {
  id: string
  name: string
}

interface SearchResult {
  id: string
  title: string
  abstract: string
  author: {
    fullName: string
    org: string | null
  }
  category: {
    id: string
    name: string
  } | null
  keywords: string[]
  publishedAt: string | null
  doi: string | null
  pages: string | null
  views: number
  downloads: number
  issue: {
    volume: number | null
    number: number
    year: number
  } | null
}

type SortBy = 'publishedAt' | 'views' | 'downloads' | 'title'
type Order = 'asc' | 'desc'

interface SearchMeta {
  total: number
  page: number
  pageSize: number
  totalPages: number
}

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'publishedAt', label: 'Ngày xuất bản' },
  { value: 'views',       label: 'Lượt xem' },
  { value: 'downloads',   label: 'Lượt tải' },
  { value: 'title',       label: 'Tiêu đề (A-Z)' },
]

export default function AdvancedSearchPage() {
  const searchParams = useSearchParams()

  const [categories, setCategories] = useState<Category[]>([])
  const [results, setResults] = useState<SearchResult[]>([])
  const [meta, setMeta] = useState<SearchMeta | null>(null)
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const [filters, setFilters] = useState({
    keyword:     searchParams?.get('keyword')     || '',
    title:       searchParams?.get('title')       || '',
    author:      searchParams?.get('author')      || '',
    affiliation: searchParams?.get('affiliation') || '',
    categoryId:  searchParams?.get('categoryId')  || 'all',
    yearFrom:    searchParams?.get('yearFrom')    || '',
    yearTo:      searchParams?.get('yearTo')      || '',
    keywords:    searchParams?.get('keywords')    || '',
  })

  const [sortBy, setSortBy]   = useState<SortBy>('publishedAt')
  const [order, setOrder]     = useState<Order>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 10

  useEffect(() => {
    fetchCategories()
    if (searchParams?.get('keyword') || searchParams?.get('title')) {
      runSearch(1)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      if (data.success) setCategories(data.data)
    } catch {
      // non-critical — categories still load on retry
    }
  }

  const buildParams = useCallback((page: number): URLSearchParams => {
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') params.append(key, value)
    })

    params.set('sortBy',   sortBy)
    params.set('order',    order)
    params.set('page',     String(page))
    params.set('pageSize', String(PAGE_SIZE))

    return params
  }, [filters, sortBy, order])

  const runSearch = useCallback(async (page: number) => {
    setLoading(true)
    setHasSearched(true)
    setCurrentPage(page)

    try {
      const params = buildParams(page)
      const response = await fetch(`/api/search/advanced?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        const payload = data.data as {
          results: SearchResult[]
          total: number
          page: number
          pageSize: number
          totalPages: number
        }
        setResults(payload.results ?? [])
        setMeta({
          total:      payload.total,
          page:       payload.page,
          pageSize:   payload.pageSize,
          totalPages: payload.totalPages,
        })
      } else {
        toast.error(data.error || 'Lỗi tìm kiếm')
      }
    } catch {
      toast.error('Lỗi kết nối server')
    } finally {
      setLoading(false)
    }
  }, [buildParams])

  const handleSearch = () => runSearch(1)

  const handleReset = () => {
    setFilters({
      keyword: '', title: '', author: '', affiliation: '',
      categoryId: 'all', yearFrom: '', yearTo: '', keywords: '',
    })
    setSortBy('publishedAt')
    setOrder('desc')
    setResults([])
    setMeta(null)
    setHasSearched(false)
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    runSearch(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleOrder = () => {
    setOrder(prev => prev === 'desc' ? 'asc' : 'desc')
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/" className="hover:underline">Trang chủ</Link>
          <span>/</span>
          <Link href="/search" className="hover:underline">Tra cứu</Link>
          <span>/</span>
          <span>Tìm kiếm nâng cao</span>
        </div>
        <h1 className="text-4xl font-bold mb-2">Tìm kiếm Nâng cao</h1>
        <p className="text-muted-foreground">
          Sử dụng các bộ lọc chi tiết để tìm kiếm bài viết chính xác hơn
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Filter Panel ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Bộ lọc tìm kiếm
              </CardTitle>
              <CardDescription>Điền thông tin để lọc kết quả</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="keyword">Từ khóa chung</Label>
                <Input
                  id="keyword"
                  placeholder="Tìm trong tất cả các trường..."
                  value={filters.keyword}
                  onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Tiêu đề bài viết</Label>
                <Input
                  id="title"
                  placeholder="Nhập tiêu đề..."
                  value={filters.title}
                  onChange={(e) => setFilters({ ...filters, title: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="author">Tác giả</Label>
                <Input
                  id="author"
                  placeholder="Tên tác giả..."
                  value={filters.author}
                  onChange={(e) => setFilters({ ...filters, author: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="affiliation">Đơn vị công tác</Label>
                <Input
                  id="affiliation"
                  placeholder="Tên đơn vị..."
                  value={filters.affiliation}
                  onChange={(e) => setFilters({ ...filters, affiliation: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryId">Chuyên mục</Label>
                <Select
                  value={filters.categoryId}
                  onValueChange={(value) => setFilters({ ...filters, categoryId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tất cả chuyên mục" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả chuyên mục</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Từ năm</Label>
                  <Select
                    value={filters.yearFrom || 'all'}
                    onValueChange={(value) =>
                      setFilters({ ...filters, yearFrom: value === 'all' ? '' : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Năm" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Đến năm</Label>
                  <Select
                    value={filters.yearTo || 'all'}
                    onValueChange={(value) =>
                      setFilters({ ...filters, yearTo: value === 'all' ? '' : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Năm" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="keywords">Từ khóa (keywords)</Label>
                <Input
                  id="keywords"
                  placeholder="Ví dụ: AI, chiến thuật..."
                  value={filters.keywords}
                  onChange={(e) => setFilters({ ...filters, keywords: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <p className="text-xs text-muted-foreground">Tách nhiều từ khóa bằng dấu phẩy</p>
              </div>

              {/* ── Sort controls ─────────────────────────────────────────── */}
              <div className="pt-2 border-t space-y-3">
                <Label>Sắp xếp theo</Label>
                <div className="flex gap-2">
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleOrder}
                    title={order === 'desc' ? 'Giảm dần' : 'Tăng dần'}
                    aria-label="Đổi chiều sắp xếp"
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {order === 'desc' ? 'Giảm dần (mới nhất / cao nhất trước)' : 'Tăng dần (cũ nhất / thấp nhất trước)'}
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleSearch}
                  disabled={loading}
                  className="flex-1"
                >
                  <Search className="mr-2 h-4 w-4" />
                  {loading ? 'Đang tìm...' : 'Tìm kiếm'}
                </Button>
                <Button onClick={handleReset} variant="outline" aria-label="Đặt lại">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Results Panel ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Kết quả tìm kiếm</CardTitle>
                  <CardDescription>
                    {hasSearched && meta
                      ? `Tìm thấy ${meta.total} bài viết`
                      : 'Nhập bộ lọc và nhấn "Tìm kiếm"'}
                  </CardDescription>
                </div>
                {hasSearched && meta && meta.total > 0 && (
                  <span className="text-xs text-muted-foreground">
                    Trang {meta.page} / {meta.totalPages}
                  </span>
                )}
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <ResultsSkeleton />
              ) : !hasSearched ? (
                <EmptyPrompt />
              ) : results.length === 0 ? (
                <NoResults onReset={handleReset} />
              ) : (
                <>
                  <div className="space-y-6">
                    {results.map((article) => (
                      <ArticleCard key={article.id} article={article} />
                    ))}
                  </div>

                  {meta && meta.totalPages > 1 && (
                    <Pagination
                      meta={meta}
                      onPageChange={handlePageChange}
                      disabled={loading}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ArticleCard({ article }: { article: SearchResult }) {
  return (
    <div className="pb-6 border-b last:border-b-0 last:pb-0">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {article.category && (
              <Badge variant="secondary" className="mb-2">
                {article.category.name}
              </Badge>
            )}
            <h3 className="text-lg font-semibold hover:text-primary mb-1 leading-snug">
              <Link href={`/articles/${article.id}`}>{article.title}</Link>
            </h3>
          </div>
          {article.issue && (
            <Badge variant="outline" className="shrink-0 text-xs">
              {article.issue.volume !== null
                ? `Tập ${article.issue.volume}, `
                : ''}
              Số {article.issue.number} ({article.issue.year})
            </Badge>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          <span className="font-medium">{article.author.fullName}</span>
          {article.author.org && (
            <span className="ml-1">— {article.author.org}</span>
          )}
        </p>

        {article.abstract && (
          <p className="text-sm line-clamp-3 text-muted-foreground">{article.abstract}</p>
        )}

        {article.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {article.keywords.map((kw, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {kw}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 pt-2 flex-wrap">
          <Button size="sm" asChild>
            <Link href={`/articles/${article.id}`}>Xem chi tiết</Link>
          </Button>

          {article.publishedAt && (
            <span className="text-xs text-muted-foreground">
              Xuất bản: {new Date(article.publishedAt).toLocaleDateString('vi-VN')}
            </span>
          )}

          <div className="flex items-center gap-3 ml-auto text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {article.views.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <Download className="h-3.5 w-3.5" />
              {article.downloads.toLocaleString()}
            </span>
          </div>
        </div>

        {article.doi && (
          <p className="text-xs text-muted-foreground">
            DOI: <span className="font-mono">{article.doi}</span>
          </p>
        )}
      </div>
    </div>
  )
}

function Pagination({
  meta,
  onPageChange,
  disabled,
}: {
  meta: SearchMeta
  onPageChange: (page: number) => void
  disabled: boolean
}) {
  const { page, totalPages } = meta

  const pageNumbers = buildPageNumbers(page, totalPages)

  return (
    <div className="flex items-center justify-center gap-1 mt-8 pt-6 border-t">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1 || disabled}
        aria-label="Trang trước"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {pageNumbers.map((p, idx) =>
        p === '...' ? (
          <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">…</span>
        ) : (
          <Button
            key={p}
            variant={p === page ? 'default' : 'outline'}
            size="sm"
            className="w-9"
            onClick={() => onPageChange(p as number)}
            disabled={disabled}
          >
            {p}
          </Button>
        )
      )}

      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages || disabled}
        aria-label="Trang sau"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

/** Build compact page number list with ellipsis for large ranges */
function buildPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | '...')[] = [1]

  if (current > 3) pages.push('...')

  const start = Math.max(2, current - 1)
  const end   = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)

  if (current < total - 2) pages.push('...')

  pages.push(total)
  return pages
}

function ResultsSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="space-y-2 pb-6 border-b last:border-b-0">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-16 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyPrompt() {
  return (
    <div className="text-center py-12">
      <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
      <p className="text-muted-foreground">Sử dụng bộ lọc bên trái để bắt đầu tìm kiếm</p>
    </div>
  )
}

function NoResults({ onReset }: { onReset: () => void }) {
  return (
    <div className="text-center py-12">
      <p className="text-muted-foreground mb-4">Không tìm thấy kết quả phù hợp</p>
      <Button onClick={onReset} variant="outline">Đặt lại bộ lọc</Button>
    </div>
  )
}
