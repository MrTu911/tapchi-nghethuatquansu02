'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  FileText, Search, Filter, Edit, Eye, History, ClipboardCheck,
  Sparkles, Send, CheckCircle2, XCircle, RefreshCw, X, ChevronLeft,
  ChevronRight, BookOpen, Hash, AlertCircle, Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { generateDOI } from '@/lib/validation/metadata'

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
    author: { fullName: string; email: string }
    category?: { id: string; name: string }
  }
  issue?: {
    id: string
    number: number
    volume: { volumeNo: number }
  }
}

interface Issue {
  id: string
  number: number
  year: number
  volume: { volumeNo: number }
}

interface Category {
  id: string
  name: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

// ─── Small helper components ──────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon: Icon, accent,
}: {
  label: string; value: number; sub: string; icon: React.ElementType; accent: string
}) {
  return (
    <div className={`rounded-xl border bg-white dark:bg-slate-900 p-4 flex items-start gap-3 shadow-sm border-l-4 ${accent}`}>
      <div className="rounded-lg bg-muted p-2 mt-0.5 shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="text-sm font-medium mt-0.5">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </div>
    </div>
  )
}

function DoiStatus({ doi }: { doi?: string }) {
  if (doi) {
    return (
      <div className="flex items-center gap-1.5">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
        <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400 truncate max-w-[140px]" title={doi}>
          {doi}
        </span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1.5 text-muted-foreground">
      <XCircle className="h-3.5 w-3.5 shrink-0" />
      <span className="text-xs">Chưa có</span>
    </div>
  )
}

function IssueBadge({ issue }: { issue?: Article['issue'] }) {
  if (issue) {
    return (
      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-0 font-medium text-xs">
        T{issue.volume.volumeNo}/S{issue.number}
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="text-orange-600 border-orange-300 dark:border-orange-700 dark:text-orange-400 text-xs">
      Chưa gán
    </Badge>
  )
}

function ActiveFilterTag({
  label, onRemove,
}: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
      {label}
      <button onClick={onRemove} className="ml-0.5 hover:text-primary/60">
        <X className="h-3 w-3" />
      </button>
    </span>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ArticleManagementPage() {
  // Raw data
  const [articles, setArticles] = useState<Article[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [doiFilter, setDoiFilter] = useState<'all' | 'with-doi' | 'without-doi'>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [issueFilter, setIssueFilter] = useState('all')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)

  // Edit dialog
  const [editDialog, setEditDialog] = useState(false)
  const [previewDialog, setPreviewDialog] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [formData, setFormData] = useState({ pages: '', doiLocal: '', issueId: '', publishedAt: '' })

  // ── Fetch ───────────────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [artRes, issuesRes, catRes] = await Promise.all([
        fetch('/api/metadata'),
        fetch('/api/issues'),
        fetch('/api/categories'),
      ])
      const [artData, issuesData, catData] = await Promise.all([
        artRes.json(), issuesRes.json(), catRes.json(),
      ])
      if (artData.success) setArticles(artData.data)
      if (issuesData.success) setIssues(issuesData.data)
      if (catData.success) setCategories(catData.data)
    } catch {
      toast.error('Lỗi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Derived filtered list ────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let result = articles

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        a =>
          a.submission.title.toLowerCase().includes(q) ||
          a.submission.author.fullName.toLowerCase().includes(q) ||
          a.submission.code.toLowerCase().includes(q)
      )
    }

    if (doiFilter === 'with-doi')    result = result.filter(a => !!a.doiLocal)
    if (doiFilter === 'without-doi') result = result.filter(a => !a.doiLocal)

    if (categoryFilter !== 'all')
      result = result.filter(a => a.submission.category?.id === categoryFilter)

    if (issueFilter === 'assigned')    result = result.filter(a => !!a.issue)
    else if (issueFilter === 'unassigned') result = result.filter(a => !a.issue)
    else if (issueFilter !== 'all')    result = result.filter(a => a.issue?.id === issueFilter)

    return result
  }, [articles, searchQuery, doiFilter, categoryFilter, issueFilter])

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1) }, [searchQuery, doiFilter, categoryFilter, issueFilter])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const pageStart = (safePage - 1) * PAGE_SIZE
  const pageRows = filtered.slice(pageStart, pageStart + PAGE_SIZE)

  // Stats
  const withDoi    = articles.filter(a => a.doiLocal).length
  const withoutDoi = articles.length - withDoi
  const unassigned = articles.filter(a => !a.issue).length

  // Active filters count
  const hasFilters = searchQuery || doiFilter !== 'all' || categoryFilter !== 'all' || issueFilter !== 'all'

  const resetFilters = () => {
    setSearchQuery('')
    setDoiFilter('all')
    setCategoryFilter('all')
    setIssueFilter('all')
  }

  // ── Actions ─────────────────────────────────────────────────────────────────

  const openEdit = (article: Article) => {
    setSelectedArticle(article)
    setFormData({
      pages: article.pages ?? '',
      doiLocal: article.doiLocal ?? '',
      issueId: article.issue?.id ?? '',
      publishedAt: article.publishedAt
        ? new Date(article.publishedAt).toISOString().split('T')[0]
        : '',
    })
    setEditDialog(true)
  }

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedArticle) return
    try {
      const res = await fetch('/api/metadata', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId: selectedArticle.id,
          ...formData,
          issueId: formData.issueId || null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Cập nhật metadata thành công')
        setEditDialog(false)
        fetchAll()
      } else {
        toast.error(data.error || 'Có lỗi xảy ra')
      }
    } catch {
      toast.error('Lỗi cập nhật metadata')
    }
  }

  const handleGenerateDOI = async (article: Article) => {
    if (!article.issue) {
      toast.error('Bài viết phải được gán vào số tạp chí trước khi tạo DOI')
      return
    }
    const doi = generateDOI(article.id, article.issue.volume.volumeNo)
    const res = await fetch('/api/metadata', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId: article.id, doiLocal: doi }),
    })
    const data = await res.json()
    if (data.success) { toast.success(`Đã tạo DOI: ${doi}`); fetchAll() }
    else toast.error(data.error ?? 'Lỗi tạo DOI')
  }

  const handleRegisterCrossRef = async (article: Article) => {
    if (!article.doiLocal) { toast.error('Bài viết chưa có DOI'); return }
    try {
      const res = await fetch(`/api/articles/${article.id}/doi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registerCrossRef: true }),
      })
      const data = await res.json()
      if (data.success && data.data?.crossRef?.success) {
        toast.success(`Đã gửi lên CrossRef (batch: ${data.data.crossRef.batchId})`)
      } else if (data.success) {
        toast.warning(`Đã lưu nhưng CrossRef thất bại: ${data.data?.crossRef?.message ?? ''}`)
      } else {
        toast.error(data.error ?? 'Có lỗi xảy ra')
      }
    } catch {
      toast.error('Lỗi kết nối server')
    }
  }

  // ── Page numbers helper ──────────────────────────────────────────────────────

  const pageNumbers = useMemo(() => {
    const pages: (number | 'gap')[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else if (safePage <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i)
      pages.push('gap', totalPages)
    } else if (safePage >= totalPages - 3) {
      pages.push(1, 'gap')
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1, 'gap', safePage - 1, safePage, safePage + 1, 'gap', totalPages)
    }
    return pages
  }, [totalPages, safePage])

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Quản lý Bài báo
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Metadata, DOI và phân công số tạp chí
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Tổng bài báo"
          value={articles.length}
          sub="đã xuất bản"
          icon={BookOpen}
          accent="border-l-slate-400"
        />
        <StatCard
          label="Đã có DOI"
          value={withDoi}
          sub={`${articles.length > 0 ? Math.round(withDoi / articles.length * 100) : 0}% tổng số`}
          icon={Hash}
          accent="border-l-emerald-400"
        />
        <StatCard
          label="Chưa có DOI"
          value={withoutDoi}
          sub="cần tạo DOI"
          icon={AlertCircle}
          accent="border-l-amber-400"
        />
        <StatCard
          label="Chưa gán số"
          value={unassigned}
          sub="chưa vào số tạp chí"
          icon={Layers}
          accent="border-l-rose-400"
        />
      </div>

      {/* ── Filter panel ── */}
      <div className="rounded-xl border bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Tìm kiếm & Lọc</span>
          {hasFilters && (
            <button
              onClick={resetFilters}
              className="ml-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <X className="h-3.5 w-3.5" />
              Xóa bộ lọc
            </button>
          )}
        </div>

        <div className="p-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {/* Search */}
          <div className="lg:col-span-2 space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Tìm kiếm
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tiêu đề, tác giả, mã bài..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-muted/40"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* DOI filter */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Trạng thái DOI
            </Label>
            <Select value={doiFilter} onValueChange={v => setDoiFilter(v as typeof doiFilter)}>
              <SelectTrigger className="h-9 bg-muted/40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="with-doi">✅ Đã có DOI</SelectItem>
                <SelectItem value="without-doi">❌ Chưa có DOI</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category filter */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Chuyên mục
            </Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-9 bg-muted/40">
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Issue filter */}
          <div className="space-y-1.5 lg:col-span-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Số tạp chí
            </Label>
            <Select value={issueFilter} onValueChange={setIssueFilter}>
              <SelectTrigger className="h-9 bg-muted/40">
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="assigned">Đã gán số</SelectItem>
                <SelectItem value="unassigned">Chưa gán số</SelectItem>
                {issues.map(i => (
                  <SelectItem key={i.id} value={i.id}>
                    Tập {i.volume.volumeNo}, Số {i.number} — Năm {i.year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active filter tags + result count */}
        <div className="px-4 pb-3 flex items-center gap-2 flex-wrap">
          {searchQuery && (
            <ActiveFilterTag label={`"${searchQuery}"`} onRemove={() => setSearchQuery('')} />
          )}
          {doiFilter !== 'all' && (
            <ActiveFilterTag
              label={doiFilter === 'with-doi' ? 'Có DOI' : 'Chưa có DOI'}
              onRemove={() => setDoiFilter('all')}
            />
          )}
          {categoryFilter !== 'all' && (
            <ActiveFilterTag
              label={categories.find(c => c.id === categoryFilter)?.name ?? categoryFilter}
              onRemove={() => setCategoryFilter('all')}
            />
          )}
          {issueFilter !== 'all' && issueFilter !== 'assigned' && issueFilter !== 'unassigned' && (
            <ActiveFilterTag
              label={(() => {
                const iss = issues.find(i => i.id === issueFilter)
                return iss ? `T${iss.volume.volumeNo}/S${iss.number}` : issueFilter
              })()}
              onRemove={() => setIssueFilter('all')}
            />
          )}
          {issueFilter === 'assigned'   && <ActiveFilterTag label="Đã gán số"   onRemove={() => setIssueFilter('all')} />}
          {issueFilter === 'unassigned' && <ActiveFilterTag label="Chưa gán số" onRemove={() => setIssueFilter('all')} />}

          <span className="ml-auto text-xs text-muted-foreground">
            {filtered.length === articles.length
              ? `${articles.length} bài báo`
              : `${filtered.length} / ${articles.length} bài báo`}
          </span>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <RefreshCw className="h-7 w-7 animate-spin" />
            <p className="text-sm">Đang tải dữ liệu...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <FileText className="h-10 w-10 opacity-20" />
            <p className="font-medium">Không có bài báo phù hợp</p>
            {hasFilters && (
              <Button variant="outline" size="sm" onClick={resetFilters}>
                <X className="h-4 w-4 mr-1" />
                Xóa bộ lọc
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-[110px] font-semibold">Mã bài</TableHead>
                    <TableHead className="font-semibold">Tiêu đề & Tác giả</TableHead>
                    <TableHead className="w-[130px] font-semibold">Chuyên mục</TableHead>
                    <TableHead className="w-[110px] font-semibold">Số TK</TableHead>
                    <TableHead className="w-[60px] font-semibold">Trang</TableHead>
                    <TableHead className="w-[200px] font-semibold">DOI</TableHead>
                    <TableHead className="w-[200px] text-right font-semibold">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.map(article => (
                    <TableRow
                      key={article.id}
                      className={`hover:bg-muted/30 transition-colors ${
                        !article.issue
                          ? 'border-l-2 border-l-orange-300 dark:border-l-orange-700'
                          : article.doiLocal
                          ? 'border-l-2 border-l-emerald-300 dark:border-l-emerald-700'
                          : 'border-l-2 border-l-transparent'
                      }`}
                    >
                      {/* Mã bài */}
                      <TableCell>
                        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                          {article.submission.code}
                        </span>
                      </TableCell>

                      {/* Tiêu đề + tác giả */}
                      <TableCell>
                        <Link
                          href={`/articles/${article.id}`}
                          target="_blank"
                          className="font-medium text-sm hover:text-primary hover:underline line-clamp-2 leading-snug"
                        >
                          {article.submission.title}
                        </Link>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {article.submission.author.fullName}
                        </p>
                      </TableCell>

                      {/* Chuyên mục */}
                      <TableCell>
                        {article.submission.category?.name ? (
                          <Badge
                            variant="outline"
                            className="text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                          >
                            {article.submission.category.name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>

                      {/* Số tạp chí */}
                      <TableCell>
                        <IssueBadge issue={article.issue} />
                      </TableCell>

                      {/* Trang */}
                      <TableCell>
                        <span className="text-sm">{article.pages ?? '—'}</span>
                      </TableCell>

                      {/* DOI */}
                      <TableCell>
                        <DoiStatus doi={article.doiLocal} />
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <div className="flex items-center justify-end gap-1 flex-wrap">
                          {/* Edit metadata */}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                            onClick={() => openEdit(article)}
                            title="Sửa metadata"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>

                          {/* Preview */}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                            onClick={() => { setSelectedArticle(article); setPreviewDialog(true) }}
                            title="Xem trước"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>

                          {/* Versions */}
                          <Link href={`/dashboard/admin/articles/${article.id}/versions`}>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                              title="Lịch sử phiên bản"
                            >
                              <History className="h-3.5 w-3.5" />
                            </Button>
                          </Link>

                          {/* Review */}
                          <Link href={`/dashboard/admin/articles/${article.id}/review`}>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                              title="Kiểm duyệt"
                            >
                              <ClipboardCheck className="h-3.5 w-3.5" />
                            </Button>
                          </Link>

                          {/* Generate DOI */}
                          {!article.doiLocal && article.issue && (
                            <Button
                              size="sm"
                              className="h-7 px-2 text-xs bg-violet-600 hover:bg-violet-700 text-white"
                              onClick={() => handleGenerateDOI(article)}
                              title="Tự động tạo DOI"
                            >
                              <Sparkles className="h-3 w-3 mr-1" />
                              DOI
                            </Button>
                          )}

                          {/* Send to CrossRef */}
                          {article.doiLocal && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950"
                              onClick={() => handleRegisterCrossRef(article)}
                              title="Gửi lên CrossRef"
                            >
                              <Send className="h-3 w-3 mr-1" />
                              CR
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
                <p className="text-xs text-muted-foreground">
                  Hiển thị{' '}
                  <strong>{pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filtered.length)}</strong>
                  {' '}trong{' '}
                  <strong>{filtered.length}</strong> bài
                </p>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={safePage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {pageNumbers.map((p, i) =>
                    p === 'gap' ? (
                      <span key={`gap-${i}`} className="px-1 text-muted-foreground text-sm">…</span>
                    ) : (
                      <Button
                        key={p}
                        variant={safePage === p ? 'default' : 'outline'}
                        size="icon"
                        className="h-7 w-7 text-xs"
                        onClick={() => setCurrentPage(p as number)}
                      >
                        {p}
                      </Button>
                    )
                  )}

                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={safePage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Edit Metadata Dialog ── */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa Metadata</DialogTitle>
            <DialogDescription className="line-clamp-2">
              <span className="font-mono text-xs bg-muted px-1 rounded mr-1">
                {selectedArticle?.submission.code}
              </span>
              {selectedArticle?.submission.title}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitEdit} className="space-y-4 pt-1">
            {/* Issue */}
            <div className="space-y-1.5">
              <Label className="font-medium">Số tạp chí</Label>
              <Select
                value={formData.issueId}
                onValueChange={v => setFormData(prev => ({ ...prev, issueId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn số tạp chí" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Không gán</SelectItem>
                  {issues.map(i => (
                    <SelectItem key={i.id} value={i.id}>
                      Tập {i.volume.volumeNo}, Số {i.number} — Năm {i.year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Pages */}
              <div className="space-y-1.5">
                <Label className="font-medium">Trang</Label>
                <Input
                  value={formData.pages}
                  onChange={e => setFormData(prev => ({ ...prev, pages: e.target.value }))}
                  placeholder="1-10"
                />
              </div>

              {/* Published date */}
              <div className="space-y-1.5">
                <Label className="font-medium">Ngày xuất bản</Label>
                <Input
                  type="date"
                  value={formData.publishedAt}
                  onChange={e => setFormData(prev => ({ ...prev, publishedAt: e.target.value }))}
                />
              </div>
            </div>

            {/* DOI */}
            <div className="space-y-1.5">
              <Label className="font-medium">DOI</Label>
              <Input
                value={formData.doiLocal}
                onChange={e => setFormData(prev => ({ ...prev, doiLocal: e.target.value }))}
                placeholder="10.59386/ntqs.2025.xxx"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Định dạng: 10.xxxxx/xxxx — để trống nếu chưa cần
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialog(false)}>
                Hủy
              </Button>
              <Button type="submit">Lưu thay đổi</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Preview Dialog ── */}
      <Dialog open={previewDialog} onOpenChange={setPreviewDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Chi tiết bài báo</DialogTitle>
          </DialogHeader>

          {selectedArticle && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Mã bài</p>
                  <p className="font-mono text-sm font-semibold">{selectedArticle.submission.code}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Tiêu đề</p>
                  <p className="font-semibold leading-snug">{selectedArticle.submission.title}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Tác giả</p>
                  <p className="font-medium">{selectedArticle.submission.author.fullName}</p>
                  <p className="text-xs text-muted-foreground">{selectedArticle.submission.author.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Chuyên mục</p>
                  <p>{selectedArticle.submission.category?.name ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Số tạp chí</p>
                  {selectedArticle.issue ? (
                    <p>Tập {selectedArticle.issue.volume.volumeNo}, Số {selectedArticle.issue.number}</p>
                  ) : (
                    <p className="text-orange-600">Chưa gán số</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Trang</p>
                  <p>{selectedArticle.pages ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Ngày xuất bản</p>
                  <p>
                    {selectedArticle.publishedAt
                      ? new Date(selectedArticle.publishedAt).toLocaleDateString('vi-VN')
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">DOI</p>
                  {selectedArticle.doiLocal ? (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="font-mono text-xs">{selectedArticle.doiLocal}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Chưa có</span>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t flex gap-2">
                <Link
                  href={`/articles/${selectedArticle.id}`}
                  target="_blank"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Xem bài đầy đủ
                </Link>
                {selectedArticle.doiLocal && (
                  <button
                    onClick={() => { handleRegisterCrossRef(selectedArticle); setPreviewDialog(false) }}
                    className="text-sm text-emerald-600 hover:underline flex items-center gap-1 ml-4"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Gửi CrossRef
                  </button>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDialog(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
