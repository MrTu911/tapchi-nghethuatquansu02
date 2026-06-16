
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import {
  Edit, Hash, Eye, CheckCircle2, AlertCircle, Search, Filter, X,
  BookOpen, Calendar, FileText, RefreshCw, Layers, Tag, Link2,
  ChevronLeft, ChevronRight, Info, Sparkles, ExternalLink, CopyCheck
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Article {
  id: string
  pages?: string
  doiLocal?: string
  publishedAt?: string
  submission: {
    id: string
    code: string
    title: string
    author: {
      fullName: string
      email: string
    }
    category?: {
      name: string
    }
  }
  issue?: {
    id: string
    number: number
    volume: {
      volumeNo: number
    }
  }
}

interface Issue {
  id: string
  number: number
  year: number
  volume: {
    volumeNo: number
  }
}

interface SummaryStats {
  total: number
  hasDoi: number
  hasIssue: number
  published: number
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 15

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'has-doi', label: 'Đã có DOI' },
  { value: 'no-doi', label: 'Chưa có DOI' },
  { value: 'published', label: 'Đã xuất bản' },
  { value: 'unpublished', label: 'Chưa xuất bản' },
]

// ─── Skeleton Loading ─────────────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5">
        <Skeleton className="h-4 w-24 mb-3" />
        <Skeleton className="h-8 w-16 mb-1" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  )
}

function TableRowSkeleton() {
  return (
    <TableRow>
      {[80, 200, 120, 100, 60, 100, 80].map((w, i) => (
        <TableCell key={i}>
          <Skeleton className={`h-4 w-[${w}px]`} />
        </TableCell>
      ))}
    </TableRow>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: number | string
  sub?: string
  icon: React.ReactNode
  color: string
  accent: string
}

function StatCard({ label, value, sub, icon, color, accent }: StatCardProps) {
  return (
    <Card className={`border-0 shadow-sm bg-gradient-to-br ${color}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
            <p className={`text-2xl font-bold ${accent}`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`p-2 rounded-lg ${accent.replace('text-', 'bg-').replace('-700', '-100').replace('-800', '-100')}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MetadataManagerPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generatingDoi, setGeneratingDoi] = useState<string | null>(null)

  // Dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [formData, setFormData] = useState({
    pages: '',
    doiLocal: '',
    issueId: '',
    publishedAt: ''
  })

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [filterIssue, setFilterIssue] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)

  // ── Data loading ─────────────────────────────────────────────────────────────

  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/metadata')
      const data = await res.json()
      if (data.success) setArticles(data.data)
      else toast.error('Không thể tải danh sách bài viết')
    } catch {
      toast.error('Lỗi kết nối máy chủ')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchIssues = useCallback(async () => {
    try {
      const res = await fetch('/api/issues')
      const data = await res.json()
      if (data.success) setIssues(data.data)
    } catch {
      console.error('Lỗi tải danh sách số tạp chí')
    }
  }, [])

  useEffect(() => {
    fetchArticles()
    fetchIssues()
  }, [fetchArticles, fetchIssues])

  // ── Derived data ─────────────────────────────────────────────────────────────

  const categories = useMemo(() => {
    const cats = new Set<string>()
    articles.forEach(a => {
      if (a.submission.category?.name) cats.add(a.submission.category.name)
    })
    return Array.from(cats).sort()
  }, [articles])

  const stats: SummaryStats = useMemo(() => ({
    total: articles.length,
    hasDoi: articles.filter(a => !!a.doiLocal).length,
    hasIssue: articles.filter(a => !!a.issue).length,
    published: articles.filter(a => !!a.publishedAt).length,
  }), [articles])

  const filteredArticles = useMemo(() => {
    let result = [...articles]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(a =>
        a.submission.code.toLowerCase().includes(q) ||
        a.submission.title.toLowerCase().includes(q) ||
        a.submission.author.fullName.toLowerCase().includes(q) ||
        a.submission.author.email.toLowerCase().includes(q) ||
        a.doiLocal?.toLowerCase().includes(q)
      )
    }
    if (filterIssue !== 'all') {
      if (filterIssue === 'unassigned') result = result.filter(a => !a.issue)
      else result = result.filter(a => a.issue?.id === filterIssue)
    }
    if (filterCategory !== 'all') {
      result = result.filter(a => a.submission.category?.name === filterCategory)
    }
    if (filterStatus !== 'all') {
      if (filterStatus === 'has-doi') result = result.filter(a => !!a.doiLocal)
      else if (filterStatus === 'no-doi') result = result.filter(a => !a.doiLocal)
      else if (filterStatus === 'published') result = result.filter(a => !!a.publishedAt)
      else if (filterStatus === 'unpublished') result = result.filter(a => !a.publishedAt)
    }
    return result
  }, [articles, searchQuery, filterIssue, filterCategory, filterStatus])

  const totalPages = Math.max(1, Math.ceil(filteredArticles.length / PAGE_SIZE))
  const pagedArticles = filteredArticles.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const hasActiveFilters = searchQuery || filterIssue !== 'all' || filterCategory !== 'all' || filterStatus !== 'all'

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1) }, [searchQuery, filterIssue, filterCategory, filterStatus])

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleEdit = (article: Article) => {
    setSelectedArticle(article)
    setFormData({
      pages: article.pages || '',
      doiLocal: article.doiLocal || '',
      issueId: article.issue?.id || '',
      publishedAt: article.publishedAt
        ? new Date(article.publishedAt).toISOString().split('T')[0]
        : ''
    })
    setIsEditDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedArticle) return
    try {
      setSaving(true)
      const res = await fetch('/api/metadata', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId: selectedArticle.id,
          ...formData,
          issueId: formData.issueId || null
        })
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Cập nhật metadata thành công')
        setIsEditDialogOpen(false)
        fetchArticles()
      } else {
        toast.error(data.error || 'Cập nhật thất bại')
      }
    } catch {
      toast.error('Lỗi kết nối máy chủ')
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateDOI = async (articleId: string) => {
    try {
      setGeneratingDoi(articleId)
      const res = await fetch('/api/metadata/generate-doi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId })
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Đã tạo DOI: ${data.doi}`)
        fetchArticles()
      } else {
        toast.error(data.error || 'Không thể tạo DOI')
      }
    } catch {
      toast.error('Lỗi kết nối máy chủ')
    } finally {
      setGeneratingDoi(null)
    }
  }

  const clearFilters = () => {
    setSearchQuery('')
    setFilterIssue('all')
    setFilterCategory('all')
    setFilterStatus('all')
  }

  const copyDoi = (doi: string) => {
    navigator.clipboard.writeText(doi).then(() => toast.success('Đã sao chép DOI'))
  }

  const formatIssueLabel = (issue: Issue) =>
    `Tập ${issue.volume.volumeNo}, Số ${issue.number} (${issue.year})`

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <TooltipProvider>
      <div className="space-y-6 pb-10">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600" />
              Quản lý Metadata & Xuất bản
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gán số tạp chí, quản lý DOI, trang và ngày xuất bản cho các bài viết đã chấp nhận
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchArticles} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>

        {/* ── Thống kê tổng quan ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          ) : (
            <>
              <StatCard
                label="Tổng bài viết"
                value={stats.total}
                sub="đã được chấp nhận"
                icon={<FileText className="h-4 w-4 text-blue-600" />}
                color="from-blue-50 to-blue-50/30"
                accent="text-blue-700"
              />
              <StatCard
                label="Đã có DOI"
                value={stats.hasDoi}
                sub={`${stats.total > 0 ? Math.round(stats.hasDoi / stats.total * 100) : 0}% tổng số`}
                icon={<Hash className="h-4 w-4 text-emerald-600" />}
                color="from-emerald-50 to-emerald-50/30"
                accent="text-emerald-700"
              />
              <StatCard
                label="Đã gán số"
                value={stats.hasIssue}
                sub={`${stats.total > 0 ? Math.round(stats.hasIssue / stats.total * 100) : 0}% tổng số`}
                icon={<BookOpen className="h-4 w-4 text-violet-600" />}
                color="from-violet-50 to-violet-50/30"
                accent="text-violet-700"
              />
              <StatCard
                label="Đã xuất bản"
                value={stats.published}
                sub={`${stats.total > 0 ? Math.round(stats.published / stats.total * 100) : 0}% tổng số`}
                icon={<CheckCircle2 className="h-4 w-4 text-amber-600" />}
                color="from-amber-50 to-amber-50/30"
                accent="text-amber-700"
              />
            </>
          )}
        </div>

        {/* ── Bảng danh sách ─────────────────────────────────────────────── */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base">Danh sách Bài viết</CardTitle>
                <CardDescription className="mt-0.5">
                  {hasActiveFilters
                    ? `Hiển thị ${filteredArticles.length} / ${articles.length} bài viết`
                    : `Tổng cộng ${articles.length} bài viết`}
                </CardDescription>
              </div>
              <Button
                variant={showFilters ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setShowFilters(v => !v)}
              >
                <Filter className="h-4 w-4 mr-2" />
                {showFilters ? 'Ẩn bộ lọc' : 'Bộ lọc'}
                {hasActiveFilters && (
                  <span className="ml-2 bg-blue-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {[searchQuery, filterIssue !== 'all', filterCategory !== 'all', filterStatus !== 'all'].filter(Boolean).length}
                  </span>
                )}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">

            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo mã bài, tiêu đề, tác giả, email hoặc DOI..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Bộ lọc mở rộng */}
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-lg border bg-slate-50/80">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <BookOpen className="h-3 w-3" /> Số tạp chí
                  </Label>
                  <Select value={filterIssue} onValueChange={setFilterIssue}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Tất cả" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả số</SelectItem>
                      <SelectItem value="unassigned">— Chưa gán số —</SelectItem>
                      {issues.map(issue => (
                        <SelectItem key={issue.id} value={issue.id}>
                          {formatIssueLabel(issue)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Layers className="h-3 w-3" /> Lĩnh vực
                  </Label>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Tất cả" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả lĩnh vực</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Tag className="h-3 w-3" /> Trạng thái
                  </Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Tất cả" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_FILTER_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Active filter chips */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">Đang lọc:</span>
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1 text-xs pr-1">
                    "{searchQuery}"
                    <button onClick={() => setSearchQuery('')} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filterIssue !== 'all' && (
                  <Badge variant="secondary" className="gap-1 text-xs pr-1">
                    {filterIssue === 'unassigned' ? 'Chưa gán số'
                      : `Số: ${issues.find(i => i.id === filterIssue)?.number ?? filterIssue}`}
                    <button onClick={() => setFilterIssue('all')} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filterCategory !== 'all' && (
                  <Badge variant="secondary" className="gap-1 text-xs pr-1">
                    {filterCategory}
                    <button onClick={() => setFilterCategory('all')} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filterStatus !== 'all' && (
                  <Badge variant="secondary" className="gap-1 text-xs pr-1">
                    {STATUS_FILTER_OPTIONS.find(o => o.value === filterStatus)?.label}
                    <button onClick={() => setFilterStatus('all')} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={clearFilters}>
                  Xóa tất cả
                </Button>
              </div>
            )}

            {/* Table */}
            {loading ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã bài</TableHead>
                    <TableHead>Tiêu đề</TableHead>
                    <TableHead>Tác giả</TableHead>
                    <TableHead>Số tạp chí</TableHead>
                    <TableHead>Trang</TableHead>
                    <TableHead>DOI</TableHead>
                    <TableHead>Xuất bản</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 6 }).map((_, i) => <TableRowSkeleton key={i} />)}
                </TableBody>
              </Table>
            ) : pagedArticles.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium text-muted-foreground">
                  {hasActiveFilters ? 'Không tìm thấy bài viết phù hợp' : 'Chưa có bài viết nào'}
                </p>
                {hasActiveFilters && (
                  <Button variant="link" size="sm" onClick={clearFilters} className="mt-2">
                    Xóa bộ lọc và xem tất cả
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80">
                      <TableHead className="w-28 font-semibold">Mã bài</TableHead>
                      <TableHead className="font-semibold">Tiêu đề</TableHead>
                      <TableHead className="font-semibold">Tác giả</TableHead>
                      <TableHead className="font-semibold">Số tạp chí</TableHead>
                      <TableHead className="font-semibold w-20">Trang</TableHead>
                      <TableHead className="font-semibold">DOI</TableHead>
                      <TableHead className="font-semibold w-28">Xuất bản</TableHead>
                      <TableHead className="text-right font-semibold w-36">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedArticles.map(article => (
                      <TableRow key={article.id} className="hover:bg-blue-50/30 transition-colors">
                        <TableCell>
                          <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded font-medium">
                            {article.submission.code}
                          </span>
                        </TableCell>

                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="max-w-[220px] truncate text-sm font-medium cursor-help">
                                {article.submission.title}
                              </p>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-sm text-xs">
                              {article.submission.title}
                            </TooltipContent>
                          </Tooltip>
                          {article.submission.category && (
                            <span className="text-[11px] text-muted-foreground">
                              {article.submission.category.name}
                            </span>
                          )}
                        </TableCell>

                        <TableCell>
                          <p className="text-sm font-medium">{article.submission.author.fullName}</p>
                          <p className="text-xs text-muted-foreground">{article.submission.author.email}</p>
                        </TableCell>

                        <TableCell>
                          {article.issue ? (
                            <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100 border-violet-200 text-xs font-medium">
                              <BookOpen className="h-3 w-3 mr-1" />
                              T.{article.issue.volume.volumeNo} S.{article.issue.number}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">
                              Chưa gán
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell>
                          {article.pages ? (
                            <span className="font-mono text-xs text-slate-600">{article.pages}</span>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>

                        <TableCell>
                          {article.doiLocal ? (
                            <div className="flex items-center gap-1.5 max-w-[160px]">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-xs text-emerald-700 font-mono truncate cursor-help">
                                    {article.doiLocal}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">
                                  {article.doiLocal}
                                </TooltipContent>
                              </Tooltip>
                              <button
                                onClick={() => copyDoi(article.doiLocal!)}
                                className="text-slate-400 hover:text-slate-600 flex-shrink-0"
                              >
                                <CopyCheck className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
                              <span className="text-xs">Chưa có</span>
                            </div>
                          )}
                        </TableCell>

                        <TableCell>
                          {article.publishedAt ? (
                            <div className="flex items-center gap-1 text-emerald-600">
                              <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="text-xs">
                                {new Date(article.publishedAt).toLocaleDateString('vi-VN', {
                                  day: '2-digit', month: '2-digit', year: 'numeric'
                                })}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={() => handleEdit(article)}
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Chỉnh sửa metadata</TooltipContent>
                            </Tooltip>

                            {!article.doiLocal && article.issue && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                    onClick={() => handleGenerateDOI(article.id)}
                                    disabled={generatingDoi === article.id}
                                  >
                                    {generatingDoi === article.id
                                      ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                      : <Sparkles className="h-3.5 w-3.5" />
                                    }
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Tạo DOI tự động</TooltipContent>
                              </Tooltip>
                            )}

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={() => window.open(`/articles/${article.submission.id}`, '_blank')}
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Xem bài viết</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {!loading && filteredArticles.length > PAGE_SIZE && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">
                  Trang {currentPage} / {totalPages} — {filteredArticles.length} kết quả
                </p>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = currentPage <= 3
                      ? i + 1
                      : currentPage >= totalPages - 2
                        ? totalPages - 4 + i
                        : currentPage - 2 + i
                    if (page < 1 || page > totalPages) return null
                    return (
                      <Button
                        key={page}
                        variant={page === currentPage ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 w-7 p-0 text-xs"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    )
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Chú thích ─────────────────────────────────────────────────────── */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <strong>Lưu ý:</strong> Tính năng tạo DOI tự động chỉ khả dụng khi bài viết đã được gán vào số tạp chí.
            DOI được sinh theo định dạng chuẩn <code className="bg-blue-100 px-1 rounded">10.59386/ntqs.{'{năm}'}.{'{mã}'}</code> và cần được xác nhận trước khi đăng ký với CrossRef.
          </div>
        </div>
      </div>

      {/* ── Dialog chỉnh sửa metadata ───────────────────────────────────── */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-4 w-4 text-blue-500" />
              Chỉnh sửa Metadata Bài viết
            </DialogTitle>
            <DialogDescription>
              <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                {selectedArticle?.submission.code}
              </span>
              <span className="ml-2 text-xs line-clamp-1">{selectedArticle?.submission.title}</span>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-2">

              {/* Số tạp chí */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-violet-500" />
                  Số tạp chí
                </Label>
                <Select
                  value={formData.issueId}
                  onValueChange={v => setFormData(d => ({ ...d, issueId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="— Chọn số tạp chí —" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">— Không gán —</SelectItem>
                    {issues.map(issue => (
                      <SelectItem key={issue.id} value={issue.id}>
                        {formatIssueLabel(issue)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Bài viết phải được gán số tạp chí trước khi tạo DOI
                </p>
              </div>

              {/* Trang */}
              <div className="space-y-1.5">
                <Label htmlFor="pages" className="text-sm font-medium flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-slate-500" />
                  Số trang
                </Label>
                <Input
                  id="pages"
                  value={formData.pages}
                  onChange={e => setFormData(d => ({ ...d, pages: e.target.value }))}
                  placeholder="Ví dụ: 1-10 hoặc 45-52"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Nhập theo định dạng: trang_đầu-trang_cuối
                </p>
              </div>

              {/* DOI */}
              <div className="space-y-1.5">
                <Label htmlFor="doi" className="text-sm font-medium flex items-center gap-1.5">
                  <Link2 className="h-3.5 w-3.5 text-emerald-500" />
                  DOI
                </Label>
                <div className="relative">
                  <Input
                    id="doi"
                    value={formData.doiLocal}
                    onChange={e => setFormData(d => ({ ...d, doiLocal: e.target.value }))}
                    placeholder="Ví dụ: 10.59386/ntqs.2025.123"
                    className="font-mono pr-8"
                  />
                  {formData.doiLocal && (
                    <button
                      type="button"
                      onClick={() => setFormData(d => ({ ...d, doiLocal: '' }))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Để trống nếu muốn tạo DOI tự động sau khi gán số tạp chí
                </p>
              </div>

              {/* Ngày xuất bản */}
              <div className="space-y-1.5">
                <Label htmlFor="publishedAt" className="text-sm font-medium flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-amber-500" />
                  Ngày xuất bản
                </Label>
                <Input
                  id="publishedAt"
                  type="date"
                  value={formData.publishedAt}
                  onChange={e => setFormData(d => ({ ...d, publishedAt: e.target.value }))}
                />
              </div>

            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={saving}
              >
                Hủy bỏ
              </Button>
              <Button type="submit" disabled={saving} className="min-w-[100px]">
                {saving ? (
                  <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Đang lưu...</>
                ) : (
                  <><CheckCircle2 className="h-4 w-4 mr-2" /> Lưu thay đổi</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
