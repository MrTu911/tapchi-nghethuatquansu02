'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  ArrowLeft,
  PlusCircle,
  Eye,
  Loader2,
  BookOpen,
  Calendar,
  FileText,
  Download,
  CheckCircle,
  ExternalLink,
  Trash2,
  ImageOff,
  Hash,
  Users,
  BarChart2,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import dynamic from 'next/dynamic'
import { TableScrollWrapper } from '@/components/dashboard/table-scroll-wrapper'
import { AddArticlesToIssueDialog } from '@/components/dashboard/add-articles-dialog'

const PDFViewerSimple = dynamic(
  () => import('@/components/pdf-viewer-simple').then((m) => ({ default: m.PDFViewerSimple })),
  {
    ssr: false,
    loading: () => (
      <div className="h-96 bg-gradient-to-br from-slate-100 to-slate-200 animate-pulse rounded-xl flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Đang tải PDF viewer...</span>
        </div>
      </div>
    ),
  }
)

interface Volume {
  id: string
  volumeNo: number
  year: number
  title?: string
}

interface Article {
  id: string
  doi?: string
  pages?: string
  publishedAt?: string
  views: number
  downloads: number
  submission?: {
    id: string
    title: string
    code: string
    author: {
      id: string
      fullName: string
      org?: string
    }
    category?: {
      id: string
      name: string
      code: string
    }
    createdAt: string
  }
}

interface Issue {
  id: string
  volumeNo: number
  volume?: Volume
  number: number
  year: number
  title?: string
  description?: string
  coverImage?: string
  pdfUrl?: string
  doi?: string
  publishDate?: string
  status: 'DRAFT' | 'PUBLISHED'
  articles: Article[]
  _count?: {
    articles: number
  }
}

export default function IssueDetailPage() {
  const router = useRouter()
  const params = useParams()
  const issueId = params?.id as string

  const [issue, setIssue] = useState<Issue | null>(null)
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)

  useEffect(() => {
    if (issueId) {
      fetchIssueDetail()
    }
  }, [issueId])

  const fetchIssueDetail = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/issues/${issueId}`)
      const data = await response.json()

      if (response.ok && (data.success || data.issue)) {
        setIssue(data.issue || data.data)
      } else {
        toast.error(data.error || 'Không thể tải thông tin số tạp chí')
        router.push('/dashboard/admin/issues')
      }
    } catch (error) {
      console.error('Fetch issue error:', error)
      toast.error('Lỗi kết nối server')
      router.push('/dashboard/admin/issues')
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async () => {
    if (!issue) return

    if (!issue.articles || issue.articles.length === 0) {
      toast.error('Không thể xuất bản số tạp chí chưa có bài viết')
      return
    }

    setPublishing(true)
    try {
      const response = await fetch('/api/issues/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueId: issue.id }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success('Xuất bản số tạp chí thành công!')
        fetchIssueDetail()
        router.refresh()
      } else {
        toast.error(data.error || 'Có lỗi xảy ra khi xuất bản')
      }
    } catch (error) {
      console.error('Publish error:', error)
      toast.error('Lỗi kết nối server')
    } finally {
      setPublishing(false)
      setPublishDialogOpen(false)
    }
  }

  const handleArticlesAdded = () => {
    setAddDialogOpen(false)
    fetchIssueDetail()
    router.refresh()
  }

  const handleRemoveArticle = async (articleId: string) => {
    try {
      const response = await fetch(`/api/articles/${articleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueId: null }),
      })

      if (response.ok) {
        toast.success('Đã gỡ bài viết khỏi số tạp chí')
        fetchIssueDetail()
      } else {
        toast.error('Không thể gỡ bài viết')
      }
    } catch (error) {
      console.error('Remove article error:', error)
      toast.error('Lỗi kết nối server')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <span className="text-muted-foreground">Đang tải thông tin số tạp chí...</span>
        </div>
      </div>
    )
  }

  if (!issue) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <FileText className="h-16 w-16 text-muted-foreground opacity-30 mb-4" />
        <p className="text-xl font-semibold text-muted-foreground">Không tìm thấy số tạp chí</p>
        <Button onClick={() => router.push('/dashboard/admin/issues')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại danh sách
        </Button>
      </div>
    )
  }

  const articleCount = issue.articles?.length || 0
  const volumeNo = issue.volume?.volumeNo || issue.volumeNo
  const isPublished = issue.status === 'PUBLISHED'

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/admin/issues')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Quay lại
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">
                Tập {volumeNo} — Số {issue.number} ({issue.year})
              </h1>
              <Badge
                variant={isPublished ? 'default' : 'secondary'}
                className={isPublished ? 'bg-emerald-600 hover:bg-emerald-600' : ''}
              >
                {isPublished ? '✓ Đã xuất bản' : '✎ Nháp'}
              </Badge>
            </div>
            {issue.title && (
              <p className="text-muted-foreground mt-0.5 text-sm">{issue.title}</p>
            )}
            {issue.publishDate && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Ngày xuất bản:{' '}
                {format(new Date(issue.publishDate), 'dd/MM/yyyy', { locale: vi })}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          <Link href={`/issues/${issue.id}`} target="_blank">
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-1.5 h-4 w-4" />
              Xem công khai
            </Button>
          </Link>
          {!isPublished && (
            <Button
              size="sm"
              onClick={() => setPublishDialogOpen(true)}
              disabled={articleCount === 0}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle className="mr-1.5 h-4 w-4" />
              Xuất bản số
            </Button>
          )}
        </div>
      </div>

      {/* ── KPI strip ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-0 bg-blue-50 dark:bg-blue-950/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
              <FileText className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">{articleCount}</p>
              <p className="text-xs text-blue-600">Bài báo</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-purple-50 dark:bg-purple-950/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
              <BookOpen className="h-5 w-5 text-purple-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-700">{volumeNo}</p>
              <p className="text-xs text-purple-600">Tập (Volume)</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-amber-50 dark:bg-amber-950/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900">
              <Hash className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-700">{issue.number}</p>
              <p className="text-xs text-amber-600">Số (Issue)</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-slate-50 dark:bg-slate-800/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
              <Calendar className="h-5 w-5 text-slate-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-700">{issue.year}</p>
              <p className="text-xs text-slate-600">Năm</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left Sidebar ───────────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-5">

          {/* Cover Image */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                Ảnh bìa
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {issue.coverImage ? (
                <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden shadow-md border">
                  <Image
                    src={issue.coverImage}
                    alt={`Bìa số ${issue.number} tập ${volumeNo}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 300px"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-full aspect-[3/4] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-lg flex flex-col items-center justify-center border border-dashed border-slate-300 dark:border-slate-600">
                    <BookOpen className="h-14 w-14 text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-xs text-muted-foreground">Chưa có ảnh bìa</p>
                  </div>
                  <Alert variant="default" className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                    <ImageOff className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-700 text-sm">Thiếu ảnh bìa</AlertTitle>
                    <AlertDescription className="text-amber-600 text-xs">
                      Số tạp chí chưa có ảnh bìa. Chỉnh sửa để tải lên.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Issue Metadata */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-muted-foreground" />
                Thông tin chi tiết
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {issue.description ? (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Mô tả</p>
                  <p className="text-sm leading-relaxed">{issue.description}</p>
                </div>
              ) : (
                <p className="text-muted-foreground text-xs italic">Chưa có mô tả</p>
              )}

              {issue.doi && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">DOI</p>
                    <p className="font-mono text-xs break-all">{issue.doi}</p>
                  </div>
                </>
              )}

              <Separator />

              {/* PDF action */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">PDF toàn số</p>
                {issue.pdfUrl ? (
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href={issue.pdfUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="mr-2 h-4 w-4" />
                      Tải xuống PDF
                    </a>
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Chưa có file PDF toàn số</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right Content ──────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Articles list */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Danh sách bài báo
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {articleCount > 0
                      ? `${articleCount} bài viết trong số này`
                      : 'Chưa có bài viết nào'}
                  </CardDescription>
                </div>
                <Button size="sm" onClick={() => setAddDialogOpen(true)}>
                  <PlusCircle className="mr-1.5 h-4 w-4" />
                  Thêm bài báo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {articleCount === 0 ? (
                <div className="text-center py-14 border-2 border-dashed rounded-xl">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-30 mb-3" />
                  <p className="text-muted-foreground mb-4 font-medium">
                    Chưa có bài viết nào trong số này
                  </p>
                  <Button onClick={() => setAddDialogOpen(true)} variant="outline" size="sm">
                    <PlusCircle className="mr-1.5 h-4 w-4" />
                    Thêm bài báo đầu tiên
                  </Button>
                </div>
              ) : (
                <TableScrollWrapper>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">STT</TableHead>
                        <TableHead>Tiêu đề / Mã</TableHead>
                        <TableHead>Tác giả</TableHead>
                        <TableHead>Danh mục</TableHead>
                        <TableHead className="text-center w-20">
                          <Eye className="h-4 w-4 mx-auto" />
                        </TableHead>
                        <TableHead className="text-center w-20">
                          <Download className="h-4 w-4 mx-auto" />
                        </TableHead>
                        <TableHead className="text-right w-16">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {issue.articles.map((article, index) => (
                        <TableRow key={article.id} className="group">
                          <TableCell className="font-medium text-muted-foreground">
                            {index + 1}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-0.5">
                              <Link
                                href={`/articles/${article.id}`}
                                target="_blank"
                                className="font-medium text-sm hover:text-primary hover:underline leading-snug line-clamp-2 transition-colors"
                              >
                                {article.submission?.title || 'Chưa có tiêu đề'}
                              </Link>
                              {article.submission?.code && (
                                <span className="text-xs text-muted-foreground font-mono">
                                  {article.submission.code}
                                </span>
                              )}
                              {article.doi && (
                                <div className="text-xs text-muted-foreground font-mono">
                                  DOI: {article.doi}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">
                                {article.submission?.author.fullName}
                              </p>
                              {article.submission?.author.org && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {article.submission.author.org}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {article.submission?.category ? (
                              <Badge variant="outline" className="text-xs">
                                {article.submission.category.name}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-sm tabular-nums">{article.views}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-sm tabular-nums">{article.downloads}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleRemoveArticle(article.id)}
                              className="h-8 w-8 text-destructive/60 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Gỡ khỏi số này"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableScrollWrapper>
              )}
            </CardContent>
          </Card>

          {/* Inline PDF viewer for full issue */}
          {issue.pdfUrl && (
            <PDFViewerSimple
              fileUrl={issue.pdfUrl}
              fileName={`Tap-${volumeNo}-So-${issue.number}-${issue.year}.pdf`}
              title={`PDF toàn số: Tập ${volumeNo} — Số ${issue.number} (${issue.year})`}
              height="700px"
            />
          )}
        </div>
      </div>

      {/* Add Articles Dialog */}
      <AddArticlesToIssueDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        issueId={issue.id}
        onSuccess={handleArticlesAdded}
      />

      {/* Publish Confirmation Dialog */}
      <AlertDialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              Xác nhận xuất bản số tạp chí
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xuất bản{' '}
              <strong>
                Tập {volumeNo} — Số {issue.number} ({issue.year})
              </strong>
              ?
              <br />
              <br />
              Số này có <strong>{articleCount} bài viết</strong>. Sau khi xuất bản, các bài viết sẽ
              hiển thị công khai trên website.
              <br />
              <br />
              <span className="text-emerald-700 font-medium">
                ✓ Hành động này có thể hoàn tác sau bằng cách chỉnh sửa trạng thái số.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={publishing}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePublish}
              disabled={publishing}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {publishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {publishing ? 'Đang xuất bản...' : 'Xuất bản ngay'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
