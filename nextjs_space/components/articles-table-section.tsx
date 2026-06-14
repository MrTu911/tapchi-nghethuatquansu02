'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, FileText, Download, Filter, Quote, X } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export interface ArticleData {
  id: string
  title: string
  authorName: string
  authorOrg: string | null
  category: string
  categoryId: string
  year: number
  issueNumber: number | null
  issueVolume: string | null
  pdfUrl: string | null
  doi: string | null
  views: number
  downloads: number
  publishedAt: string | null
  issn: string | null
}

interface Category {
  id: string
  name: string
}

interface ArticlesTableSectionProps {
  articles: ArticleData[]
  categories: Category[]
}

type SortKey = 'newest' | 'oldest' | 'views' | 'downloads' | 'title' | 'author'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'views', label: 'Lượt xem nhiều nhất' },
  { value: 'downloads', label: 'Lượt tải nhiều nhất' },
  { value: 'title', label: 'Tên bài (A→Z)' },
  { value: 'author', label: 'Tác giả (A→Z)' },
]

const PAGE_SIZE_OPTIONS = [10, 25, 50]
const DEFAULT_ISSN = '1859-0454'

// Trích dẫn đơn giản theo định danh tạp chí NTQS.
function buildCitation(article: ArticleData): string {
  const issuePart = article.issueNumber
    ? `, Số ${article.issueNumber}${article.issueVolume ? ` (Tập ${article.issueVolume})` : ''}`
    : ''
  const issn = article.issn || DEFAULT_ISSN
  return `${article.authorName} (${article.year}). ${article.title}. Tạp chí Nghệ thuật Quân sự Việt Nam${issuePart}. ISSN ${issn}.`
}

// Danh sách số trang có dấu "…" cho phân trang gọn.
function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | 'ellipsis')[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  if (start > 2) pages.push('ellipsis')
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < total - 1) pages.push('ellipsis')
  pages.push(total)
  return pages
}

export default function ArticlesTableSection({ articles, categories }: ArticlesTableSectionProps) {
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedYear, setSelectedYear] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortKey>('newest')
  const [pageSize, setPageSize] = useState<number>(10)
  const [currentPage, setCurrentPage] = useState(1)

  // Debounce ô tìm kiếm để không lọc lại trên mỗi phím gõ.
  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const availableYears = useMemo(
    () => Array.from(new Set(articles.map((a) => a.year))).sort((a, b) => b - a),
    [articles]
  )

  const filteredArticles = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase()
    const result = articles.filter((article) => {
      const matchesSearch =
        keyword === '' ||
        article.title.toLowerCase().includes(keyword) ||
        article.authorName.toLowerCase().includes(keyword)
      const matchesCategory = selectedCategory === 'all' || article.categoryId === selectedCategory
      const matchesYear = selectedYear === 'all' || article.year.toString() === selectedYear
      return matchesSearch && matchesCategory && matchesYear
    })

    const byDate = (a: ArticleData) =>
      a.publishedAt ? new Date(a.publishedAt).getTime() : new Date(a.year, 0).getTime()

    const sorted = [...result]
    switch (sortBy) {
      case 'newest':
        sorted.sort((a, b) => byDate(b) - byDate(a))
        break
      case 'oldest':
        sorted.sort((a, b) => byDate(a) - byDate(b))
        break
      case 'views':
        sorted.sort((a, b) => b.views - a.views)
        break
      case 'downloads':
        sorted.sort((a, b) => b.downloads - a.downloads)
        break
      case 'title':
        sorted.sort((a, b) => a.title.localeCompare(b.title, 'vi'))
        break
      case 'author':
        sorted.sort((a, b) => a.authorName.localeCompare(b.authorName, 'vi'))
        break
    }
    return sorted
  }, [articles, searchQuery, selectedCategory, selectedYear, sortBy])

  const totalPages = Math.max(1, Math.ceil(filteredArticles.length / pageSize))
  const paginatedArticles = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredArticles.slice(start, start + pageSize)
  }, [filteredArticles, currentPage, pageSize])

  // Reset trang khi đổi bộ lọc/sắp xếp/kích thước trang.
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedCategory, selectedYear, sortBy, pageSize])

  const hasActiveFilters = searchQuery !== '' || selectedCategory !== 'all' || selectedYear !== 'all'

  const clearAllFilters = () => {
    setSearchInput('')
    setSearchQuery('')
    setSelectedCategory('all')
    setSelectedYear('all')
  }

  const handleCopyCitation = async (article: ArticleData) => {
    try {
      await navigator.clipboard.writeText(buildCitation(article))
      toast.success('Đã sao chép trích dẫn')
    } catch {
      toast.error('Không thể sao chép trích dẫn')
    }
  }

  const goToPage = (page: number) => setCurrentPage(Math.min(totalPages, Math.max(1, page)))
  const pageNumbers = getPageNumbers(currentPage, totalPages)

  return (
    <section>
      <div className="mb-6">
        <h2 className="font-serif text-2xl font-bold text-content flex items-center gap-3">
          <FileText className="h-6 w-6 text-[#8B1A1A] dark:text-[#C8960C]" />
          Tra cứu bài báo
        </h2>
        <p className="mt-1 text-sm text-content-muted">
          Tìm kiếm, sắp xếp và tải xuống toàn bộ bài báo đã xuất bản
        </p>
      </div>

      {/* Bộ lọc */}
      <Card className="card-bg mb-6">
        <CardContent className="p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="article-search" className="text-sm font-medium text-content-secondary">
                Tìm kiếm
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" />
                <Input
                  id="article-search"
                  type="search"
                  placeholder="Tìm theo tên bài hoặc tác giả…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="article-category" className="text-sm font-medium text-content-secondary">
                Lĩnh vực
              </Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger id="article-category">
                  <SelectValue placeholder="Tất cả lĩnh vực" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả lĩnh vực</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="article-year" className="text-sm font-medium text-content-secondary">
                Năm xuất bản
              </Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger id="article-year">
                  <SelectValue placeholder="Tất cả năm" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả năm</SelectItem>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      Năm {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Chip bộ lọc đang áp dụng — gỡ được từng cái */}
          {hasActiveFilters && (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4 text-sm text-content-muted">
              <Filter className="h-4 w-4" />
              <span className="font-medium">Đang lọc:</span>
              {searchQuery && (
                <FilterChip label={`Từ khóa: "${searchQuery}"`} onRemove={() => { setSearchInput(''); setSearchQuery('') }} />
              )}
              {selectedCategory !== 'all' && (
                <FilterChip
                  label={categories.find((c) => c.id === selectedCategory)?.name ?? 'Lĩnh vực'}
                  onRemove={() => setSelectedCategory('all')}
                />
              )}
              {selectedYear !== 'all' && (
                <FilterChip label={`Năm ${selectedYear}`} onRemove={() => setSelectedYear('all')} />
              )}
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="ml-auto text-xs">
                Xóa tất cả
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Thanh sắp xếp + số kết quả */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-content-muted" aria-live="polite">
          Tìm thấy <span className="font-semibold text-content">{filteredArticles.length}</span> bài báo
          {filteredArticles.length !== articles.length && (
            <> trên tổng số <span className="font-semibold text-content">{articles.length}</span></>
          )}
        </p>
        <div className="flex items-center gap-2">
          <Label htmlFor="article-sort" className="text-xs text-content-muted">
            Sắp xếp
          </Label>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
            <SelectTrigger id="article-sort" className="h-9 w-[200px]">
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
        </div>
      </div>

      {/* Bảng */}
      <Card className="overflow-hidden border-t-2 border-t-[#C8960C] shadow-sm">
        <div className="overflow-x-auto">
          <TooltipProvider delayDuration={200}>
            <Table>
              <TableHeader>
                <TableRow className="bg-[#8B1A1A]/5 dark:bg-[#8B1A1A]/20 hover:bg-[#8B1A1A]/5">
                  <TableHead scope="col" className="w-12 font-semibold text-content-secondary">STT</TableHead>
                  <TableHead scope="col" className="min-w-[300px] font-semibold text-content-secondary">Tên bài báo</TableHead>
                  <TableHead scope="col" className="min-w-[150px] font-semibold text-content-secondary">Tác giả</TableHead>
                  <TableHead scope="col" className="font-semibold text-content-secondary">Lĩnh vực</TableHead>
                  <TableHead scope="col" className="text-center font-semibold text-content-secondary">Năm</TableHead>
                  <TableHead scope="col" className="text-center font-semibold text-content-secondary">Số</TableHead>
                  <TableHead scope="col" className="text-center font-semibold text-content-secondary">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedArticles.length > 0 ? (
                  paginatedArticles.map((article, index) => (
                    <TableRow key={article.id} className="transition-colors hover:bg-[#8B1A1A]/5">
                      <TableCell className="font-medium text-content-muted">
                        {(currentPage - 1) * pageSize + index + 1}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/articles/${article.id}`}
                          className="font-medium text-[#8B1A1A] hover:underline dark:text-[#C8960C] line-clamp-2"
                        >
                          {article.title}
                        </Link>
                        {article.doi && (
                          <div className="mt-0.5 text-xs text-content-muted">DOI: {article.doi}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-content">{article.authorName}</div>
                        {article.authorOrg && (
                          <div className="text-xs text-content-muted line-clamp-1">{article.authorOrg}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{article.category}</Badge>
                      </TableCell>
                      <TableCell className="text-center font-medium text-content">{article.year}</TableCell>
                      <TableCell className="text-center">
                        {article.issueNumber ? (
                          <span className="text-sm text-content-secondary">
                            {article.issueVolume && `T${article.issueVolume}, `}S{article.issueNumber}
                          </span>
                        ) : (
                          <span className="text-xs text-content-muted">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 w-9 p-0"
                                onClick={() => handleCopyCitation(article)}
                                aria-label="Sao chép trích dẫn"
                              >
                                <Quote className="h-4 w-4 text-[#8B1A1A] dark:text-[#C8960C]" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Sao chép trích dẫn</TooltipContent>
                          </Tooltip>
                          {article.pdfUrl ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button asChild variant="ghost" size="sm" className="h-9 w-9 p-0">
                                  <a
                                    href={article.pdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Tải PDF"
                                  >
                                    <Download className="h-4 w-4 text-[#8B1A1A] dark:text-[#C8960C]" />
                                  </a>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Tải PDF</TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="inline-flex h-9 w-9 items-center justify-center text-xs text-content-muted">-</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center">
                      <FileText className="mx-auto mb-3 h-12 w-12 text-content-muted/40" />
                      <p className="font-medium text-content-secondary">Không tìm thấy bài báo phù hợp</p>
                      <p className="mt-1 text-sm text-content-muted">Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TooltipProvider>
        </div>
      </Card>

      {/* Phân trang + kích thước trang */}
      {filteredArticles.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="article-page-size" className="text-xs text-content-muted">
              Hiển thị
            </Label>
            <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(Number(v))}>
              <SelectTrigger id="article-page-size" className="h-9 w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-content-muted">/ trang</span>
          </div>

          {totalPages > 1 && (
            <Pagination className="mx-0 w-auto justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    aria-disabled={currentPage === 1}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                    onClick={(e) => { e.preventDefault(); goToPage(currentPage - 1) }}
                  />
                </PaginationItem>
                {pageNumbers.map((page, idx) =>
                  page === 'ellipsis' ? (
                    <PaginationItem key={`ellipsis-${idx}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        isActive={page === currentPage}
                        onClick={(e) => { e.preventDefault(); goToPage(page) }}
                        className={page === currentPage ? 'border-[#8B1A1A] text-[#8B1A1A] dark:text-[#C8960C]' : ''}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    aria-disabled={currentPage === totalPages}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                    onClick={(e) => { e.preventDefault(); goToPage(currentPage + 1) }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}
    </section>
  )
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <Badge variant="secondary" className="gap-1 pr-1">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Bỏ lọc ${label}`}
        className="ml-0.5 rounded-full p-0.5 hover:bg-foreground/10"
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  )
}
