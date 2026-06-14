'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useDashboardSession } from '@/components/dashboard/session-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import {
  Archive, Search, Plus, Edit, Trash2, FileText, Loader2,
  ChevronLeft, ChevronRight, FileCheck2, FileX2, Image, ImageOff,
  Eye, BookOpen, User, Tag, Hash, CheckCircle2, Clock, XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { TableScrollWrapper } from '@/components/dashboard/table-scroll-wrapper'

const MANAGE_ROLES = ['SYSADMIN', 'EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'SECTION_EDITOR']

interface ArticleItem {
  id: string
  title: string
  authorsText: string
  sectionName: string | null
  issueInfo: string
  issueYear: number
  pageStart: number
  pageEnd: number | null
  status: string
  splitStatus: string
  thumbnailStatus: string
  hasPdf: boolean
  hasThumbnail: boolean
}

interface ArticleDetail {
  id: string
  title: string
  authorsText: string
  authors: {
    name: string
    militaryRank?: string | null
    academicTitle?: string | null
    degree?: string | null
    organization?: string | null
    order: number
  }[]
  abstract: string | null
  keywords: string[]
  issueInfo: string
  sectionName: string | null
  pageStart: number
  pageEnd: number | null
  status: string
  splitStatus: string
  hasPdf: boolean
  hasThumbnail: boolean
}

const SPLIT_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  DONE: { label: 'Script tách', className: 'text-green-600' },
  MANUAL: { label: 'Upload thủ công', className: 'text-sky-600' },
  PENDING: { label: 'Chờ xử lý', className: 'text-amber-500' },
  ERROR: { label: 'Lỗi tách PDF', className: 'text-red-500' },
}

function PdfStatusCell({ splitStatus, hasThumbnail }: { splitStatus: string; hasThumbnail: boolean }) {
  const cfg = SPLIT_STATUS_CONFIG[splitStatus] ?? { label: splitStatus, className: 'text-gray-400' }
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`text-xs font-medium ${cfg.className}`}>{cfg.label}</span>
      <div className="flex gap-1">
        <span title="PDF">
          {splitStatus === 'DONE' || splitStatus === 'MANUAL'
            ? <FileCheck2 className="h-3.5 w-3.5 text-green-500" />
            : <FileX2 className="h-3.5 w-3.5 text-gray-300" />}
        </span>
        <span title="Thumbnail">
          {hasThumbnail
            ? <Image className="h-3.5 w-3.5 text-green-500" />
            : <ImageOff className="h-3.5 w-3.5 text-gray-300" />}
        </span>
      </div>
    </div>
  )
}

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PUBLISHED: { label: 'Đã xuất bản', variant: 'default' },
  DRAFT: { label: 'Bản nháp', variant: 'secondary' },
  WITHDRAWN: { label: 'Đã thu hồi', variant: 'destructive' },
}

const currentYear = new Date().getFullYear()
const YEAR_OPTIONS = Array.from({ length: 30 }, (_, i) => currentYear - i)

function buildAuthorLabel(a: ArticleDetail['authors'][number]): string {
  const parts = [a.militaryRank, a.academicTitle, a.degree ? `${a.degree}.` : '', a.name].filter(Boolean)
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

function ArticleDetailModal({
  articleId,
  open,
  onClose,
}: {
  articleId: string | null
  open: boolean
  onClose: () => void
}) {
  const [detail, setDetail] = useState<ArticleDetail | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !articleId) { setDetail(null); return }
    setLoading(true)
    fetch(`/api/repository/press-archive/${articleId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          const a = d.data
          setDetail({
            id: a.id,
            title: a.title,
            authorsText: a.authorsText,
            authors: a.authors ?? [],
            abstract: a.abstract ?? null,
            keywords: a.keywords ?? [],
            issueInfo: a.issue
              ? `Số ${a.issue.number}/${a.issue.year}${a.issue.title ? ' — ' + a.issue.title : ''}`
              : '',
            sectionName: a.section?.name ?? null,
            pageStart: a.pageStart,
            pageEnd: a.pageEnd ?? null,
            status: a.status,
            splitStatus: a.splitStatus,
            hasPdf: !!a.articlePdfUrl,
            hasThumbnail: !!a.thumbnailUrl,
          })
        } else {
          toast.error('Không tải được chi tiết bài báo')
        }
      })
      .catch(() => toast.error('Lỗi kết nối'))
      .finally(() => setLoading(false))
  }, [open, articleId])

  const statusInfo = detail ? (STATUS_LABELS[detail.status] ?? { label: detail.status, variant: 'outline' as const }) : null

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-sky-600" />
            Chi tiết bài báo
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-sky-600" />
          </div>
        ) : detail ? (
          <div className="space-y-4 pt-2">
            {/* Trạng thái + số báo */}
            <div className="flex items-center gap-2 flex-wrap">
              {statusInfo && <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>}
              {detail.sectionName && <Badge variant="outline">{detail.sectionName}</Badge>}
              <span className="text-sm text-gray-500">{detail.issueInfo}</span>
              {detail.pageEnd
                ? <span className="text-sm text-gray-500">tr. {detail.pageStart}–{detail.pageEnd}</span>
                : <span className="text-sm text-gray-500">tr. {detail.pageStart}</span>}
            </div>

            {/* Tiêu đề */}
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-base leading-snug">{detail.title}</p>
            </div>

            <Separator />

            {/* Tác giả */}
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                <User className="h-3.5 w-3.5" /> Tác giả
              </div>
              {detail.authors.length > 0 ? (
                <div className="space-y-1">
                  {detail.authors.map((a, i) => (
                    <div key={i} className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">{buildAuthorLabel(a)}</span>
                      {a.organization && (
                        <span className="text-gray-500 ml-1">— {a.organization}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">{detail.authorsText}</p>
              )}
            </div>

            {/* Tóm tắt */}
            {detail.abstract && (
              <>
                <Separator />
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    <FileText className="h-3.5 w-3.5" /> Tóm tắt
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{detail.abstract}</p>
                </div>
              </>
            )}

            {/* Từ khóa */}
            {detail.keywords.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    <Tag className="h-3.5 w-3.5" /> Từ khóa
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {detail.keywords.map((kw) => (
                      <Badge key={kw} variant="secondary" className="text-xs">{kw}</Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* PDF status */}
            <Separator />
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5" />
                <span>PDF:</span>
                {detail.hasPdf ? (
                  <span className="text-green-600 font-medium">
                    {SPLIT_STATUS_CONFIG[detail.splitStatus]?.label ?? detail.splitStatus}
                  </span>
                ) : (
                  <span className="text-gray-400">Chưa có</span>
                )}
              </div>
              {detail.hasThumbnail && (
                <span className="text-green-600">Có thumbnail</span>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

export default function PressArchivePage() {
  const session = useDashboardSession()
  const canManage = MANAGE_ROLES.includes(session?.role ?? '')

  const [articles, setArticles] = useState<ArticleItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const pageSize = 20

  const [keyword, setKeyword] = useState('')
  const [yearFilter, setYearFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  // searchTrigger dùng để force re-fetch khi page đã là 1 (tránh double-fetch)
  const [searchTrigger, setSearchTrigger] = useState(0)

  const [detailId, setDetailId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [stats, setStats] = useState<{ published: number; draft: number; withdrawn: number } | null>(null)

  const fetchArticles = useCallback(async (currentPage: number, kw: string, year: string, status: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (kw) params.set('keyword', kw)
      if (year !== 'all') params.set('year', year)
      if (status !== 'all') params.set('status', status)
      params.set('page', String(currentPage))
      params.set('pageSize', String(pageSize))

      const res = await fetch(`/api/repository/press-archive?${params}`)
      const data = await res.json()
      if (data.success) {
        setArticles(data.data.articles)
        setTotal(data.data.total)
      } else {
        toast.error(data.error || 'Lỗi tải dữ liệu')
      }
    } catch {
      toast.error('Lỗi kết nối')
    } finally {
      setLoading(false)
    }
  }, [pageSize])

  useEffect(() => {
    fetchArticles(page, keyword, yearFilter, statusFilter)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, yearFilter, statusFilter, searchTrigger])

  useEffect(() => {
    fetch('/api/repository/press-archive/stats')
      .then((r) => r.json())
      .then((d) => { if (d.success) setStats(d.data) })
      .catch(() => {})
  }, [])

  const handleSearch = () => {
    if (page !== 1) {
      setPage(1) // useEffect sẽ tự trigger khi page thay đổi
    } else {
      setSearchTrigger((t) => t + 1) // force re-fetch khi đã ở page 1
    }
  }

  const handleWithdraw = async (id: string) => {
    try {
      const res = await fetch(`/api/repository/press-archive/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Đã thu hồi bài báo')
        setSearchTrigger((t) => t + 1)
      } else {
        toast.error(data.error || 'Lỗi thu hồi')
      }
    } catch {
      toast.error('Lỗi kết nối')
    }
  }

  const openDetail = (id: string) => {
    setDetailId(id)
    setDetailOpen(true)
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Archive className="h-8 w-8 text-sky-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bài báo lịch sử</h1>
            <p className="text-gray-500 text-sm">Tổng cộng: {total} bài báo từ ấn phẩm in và nguồn lịch sử</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/repository">← Về CSDL chung</Link>
          </Button>
          {canManage && (
            <Button asChild className="bg-sky-600 hover:bg-sky-700">
              <Link href="/dashboard/repository/press-archive/new">
                <Plus className="h-4 w-4 mr-2" />
                Thêm bài báo
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Stat cards */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <Card
            className="cursor-pointer hover:border-sky-400 transition-colors"
            onClick={() => { setStatusFilter('PUBLISHED'); setPage(1) }}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-500 shrink-0" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.published}</p>
                <p className="text-xs text-gray-500">Đã xuất bản</p>
              </div>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:border-sky-400 transition-colors"
            onClick={() => { setStatusFilter('DRAFT'); setPage(1) }}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="h-8 w-8 text-amber-500 shrink-0" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.draft}</p>
                <p className="text-xs text-gray-500">Bản nháp</p>
              </div>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:border-sky-400 transition-colors"
            onClick={() => { setStatusFilter('WITHDRAWN'); setPage(1) }}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <XCircle className="h-8 w-8 text-red-400 shrink-0" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.withdrawn}</p>
                <p className="text-xs text-gray-500">Đã thu hồi</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Tìm theo tiêu đề, tác giả, tóm tắt..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Select value={yearFilter} onValueChange={(v) => { setYearFilter(v); setPage(1) }}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Năm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả năm</SelectItem>
                {YEAR_OPTIONS.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="PUBLISHED">Đã xuất bản</SelectItem>
                <SelectItem value="DRAFT">Bản nháp</SelectItem>
                <SelectItem value="WITHDRAWN">Đã thu hồi</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Tìm kiếm
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Danh sách bài báo lịch sử
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
            </div>
          ) : (
            <>
              <TableScrollWrapper>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[35%]">Tiêu đề</TableHead>
                      <TableHead>Tác giả</TableHead>
                      <TableHead>Chuyên mục</TableHead>
                      <TableHead>Số/Năm</TableHead>
                      <TableHead>Trang</TableHead>
                      <TableHead className="text-center">PDF</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {articles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-10 text-gray-500">
                          Chưa có bài báo lịch sử nào
                        </TableCell>
                      </TableRow>
                    ) : (
                      articles.map((article) => {
                        const statusInfo = STATUS_LABELS[article.status] ?? { label: article.status, variant: 'outline' as const }
                        return (
                          <TableRow key={article.id}>
                            <TableCell>
                              <button
                                type="button"
                                className="font-medium text-gray-900 dark:text-white line-clamp-2 text-left hover:text-sky-600 transition-colors cursor-pointer"
                                onClick={() => openDetail(article.id)}
                              >
                                {article.title}
                              </button>
                              {article.hasPdf && (
                                <span className="ml-2 text-xs text-sky-600">PDF</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600 max-w-[160px] truncate" title={article.authorsText}>
                              {article.authorsText}
                            </TableCell>
                            <TableCell className="text-sm">
                              {article.sectionName ? (
                                <Badge variant="outline">{article.sectionName}</Badge>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">{article.issueInfo}</TableCell>
                            <TableCell className="text-sm">
                              {article.pageEnd
                                ? `${article.pageStart}–${article.pageEnd}`
                                : article.pageStart}
                            </TableCell>
                            <TableCell className="text-center">
                              <PdfStatusCell
                                splitStatus={article.splitStatus}
                                hasThumbnail={article.hasThumbnail}
                              />
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Xem chi tiết"
                                  onClick={() => openDetail(article.id)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {canManage && (
                                  <>
                                    <Button variant="ghost" size="sm" asChild title="Chỉnh sửa">
                                      <Link href={`/dashboard/repository/press-archive/${article.id}/edit`}>
                                        <Edit className="h-4 w-4" />
                                      </Link>
                                    </Button>
                                    {article.status !== 'WITHDRAWN' && (
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" title="Thu hồi">
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Thu hồi bài báo?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Bài báo sẽ được đánh dấu là đã thu hồi và không hiển thị trong CSDL công khai. Dữ liệu vẫn được giữ lại.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                                            <AlertDialogAction
                                              className="bg-red-600 hover:bg-red-700"
                                              onClick={() => handleWithdraw(article.id)}
                                            >
                                              Thu hồi
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    )}
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </TableScrollWrapper>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <span className="text-sm text-gray-500">
                    Hiển thị {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} / {total} bài
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="flex items-center px-3 text-sm">
                      {page} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <ArticleDetailModal
        articleId={detailId}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  )
}
