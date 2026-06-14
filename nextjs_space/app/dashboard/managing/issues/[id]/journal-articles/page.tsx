'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card'
import { Button }    from '@/components/ui/button'
import { Badge }     from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  ArrowLeft, BookOpen, CheckCircle2, Circle, Clock, ExternalLink,
  Loader2, RefreshCw, ScanText, Trash2,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Author {
  id: string
  name: string
  militaryRank?: string | null
  degree?: string | null
}

interface JournalArticle {
  id: string
  title: string
  authorsText: string
  pageStart: number
  pageEnd?: number | null
  status: 'DRAFT' | 'PUBLISHED' | 'WITHDRAWN'
  authors: Author[]
  section?: { id: string; name: string } | null
}

interface Section {
  id: string
  name: string
  order: number
  journalArticles: JournalArticle[]
}

type WorkflowStatus = 'DONE' | 'NEEDS_REVIEW' | 'PENDING' | 'READY'

interface WorkflowStep {
  code: string
  name: string
  status: WorkflowStatus
}

interface IssueInfo {
  id: string
  title?: string | null
  number: number
  year: number
  issueCode?: number | null
  pdfUrl?: string | null
  digitizationWorkflow?: { steps: WorkflowStep[] } | null
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JournalArticlesPage() {
  const params   = useParams<{ id: string }>()
  const router   = useRouter()
  const issueId  = params.id

  const [issue,        setIssue]        = useState<IssueInfo | null>(null)
  const [sections,     setSections]     = useState<Section[]>([])
  const [loading,      setLoading]      = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleting,     setDeleting]     = useState(false)
  const [generating,   setGenerating]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [issueRes, sectionsRes] = await Promise.all([
        fetch(`/api/issues/${issueId}`),
        fetch(`/api/issues/${issueId}/sections`),
      ])
      const issueData    = await issueRes.json()
      const sectionsData = await sectionsRes.json()
      if (issueData.success)    setIssue(issueData.data)
      if (sectionsData.success) setSections(sectionsData.data)
    } catch {
      toast.error('Không tải được dữ liệu')
    } finally {
      setLoading(false)
    }
  }, [issueId])

  useEffect(() => { load() }, [load])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(
        `/api/issues/${issueId}/journal-articles/${deleteTarget}`,
        { method: 'DELETE' },
      )
      const data = await res.json()
      if (data.success) {
        toast.success('Đã xoá bài viết')
        await load()
      } else {
        toast.error(data.error || 'Xoá thất bại')
      }
    } catch {
      toast.error('Lỗi kết nối')
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const handleGenerateCorpus = async (ocr = false) => {
    if (ocr && !confirm('OCR toàn văn cho PDF font cũ có thể mất vài phút cho mỗi số. Tiếp tục?')) return
    setGenerating(true)
    try {
      const res = await fetch(`/api/issues/${issueId}/generate-corpus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ocr }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || 'Đã tạo bản đọc số')
      } else {
        toast.error(data.error || 'Tạo bản đọc số thất bại')
      }
    } catch {
      toast.error('Lỗi kết nối')
    } finally {
      setGenerating(false)
    }
  }

  const totalArticles = sections.reduce((s, sec) => s + sec.journalArticles.length, 0)
  const workflow      = issue?.digitizationWorkflow?.steps ?? []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!issue) {
    return (
      <div className="p-6 text-center text-muted-foreground">Không tìm thấy số báo.</div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/managing/issues/${issueId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {issue.title ?? `Số ${issue.number} (${issue.year})`}
          </h1>
          <p className="text-sm text-muted-foreground">
            Mục lục số hóa · {totalArticles} bài · {sections.length} chuyên mục
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Tải lại
          </Button>
          {issue.pdfUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={issue.pdfUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                Xem PDF gốc
              </a>
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => handleGenerateCorpus(false)}
            disabled={generating || totalArticles === 0}
            title="Sinh corpus.json + PDF từng bài để hiển thị trong Thư viện"
          >
            {generating
              ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              : <BookOpen className="h-3.5 w-3.5 mr-1" />}
            Tạo bản đọc số
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleGenerateCorpus(true)}
            disabled={generating || totalArticles === 0}
            title="Như trên, kèm OCR tiếng Việt để lấy toàn văn từ PDF font cũ (chậm hơn nhiều)"
          >
            <ScanText className="h-3.5 w-3.5 mr-1" />
            + OCR
          </Button>
        </div>
      </div>

      {/* Digitization workflow */}
      {workflow.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tiến độ số hóa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {workflow.map((step) => (
                <WorkflowStepBadge key={step.code} step={step} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seed hint when empty */}
      {sections.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <BookOpen className="h-12 w-12 text-muted-foreground opacity-30" />
            <p className="font-medium">Chưa có mục lục số hóa</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Chạy lệnh seed để nhập mục lục từ dữ liệu chuẩn bị sẵn:
            </p>
            <code className="text-xs bg-muted rounded px-3 py-1.5 font-mono">
              npx tsx --require dotenv/config prisma/seed-issue-01-2025.ts
            </code>
          </CardContent>
        </Card>
      )}

      {/* Sections + articles */}
      {sections.map((section) => (
        <Card key={section.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {section.name}
              </CardTitle>
              <Badge variant="secondary">{section.journalArticles.length} bài</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 text-center">Trang</TableHead>
                  <TableHead>Tiêu đề bài</TableHead>
                  <TableHead className="hidden md:table-cell">Tác giả</TableHead>
                  <TableHead className="w-24 text-center">Trạng thái</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {section.journalArticles.map((article) => (
                  <TableRow key={article.id}>
                    <TableCell className="text-center font-mono text-sm">
                      {article.pageStart}
                      {article.pageEnd ? `–${article.pageEnd}` : ''}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium line-clamp-2">{article.title}</p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[240px]">
                      <span className="line-clamp-2">{article.authorsText}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={article.status} />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTarget(article.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      {/* Delete confirm dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xoá bài viết</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ xoá bài viết và toàn bộ thông tin tác giả liên quan.
              Dữ liệu không thể khôi phục.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Xoá
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}

// ─── Mini components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === 'PUBLISHED')
    return <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-0">Đã đăng</Badge>
  if (status === 'WITHDRAWN')
    return <Badge variant="destructive" className="text-xs">Thu hồi</Badge>
  return <Badge variant="secondary" className="text-xs">Nháp</Badge>
}

function WorkflowStepBadge({ step }: { step: WorkflowStep }) {
  const iconMap: Record<WorkflowStatus, React.ReactNode> = {
    DONE:         <CheckCircle2 className="h-3 w-3 text-green-600" />,
    READY:        <CheckCircle2 className="h-3 w-3 text-blue-600" />,
    NEEDS_REVIEW: <Clock className="h-3 w-3 text-amber-500" />,
    PENDING:      <Circle className="h-3 w-3 text-muted-foreground" />,
  }
  const colorMap: Record<WorkflowStatus, string> = {
    DONE:         'border-green-200  bg-green-50  dark:bg-green-900/20',
    READY:        'border-blue-200   bg-blue-50   dark:bg-blue-900/20',
    NEEDS_REVIEW: 'border-amber-200  bg-amber-50  dark:bg-amber-900/20',
    PENDING:      'border-border     bg-muted/40',
  }

  return (
    <div className={`flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-xs ${colorMap[step.status]}`}>
      {iconMap[step.status]}
      <span className="leading-tight">{step.name}</span>
    </div>
  )
}
