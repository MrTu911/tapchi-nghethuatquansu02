'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useDashboardSession } from '@/components/dashboard/session-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import {
  Upload, FileText, ScanLine, Loader2, CheckCircle2, AlertTriangle,
  BookOpen, Download, Database, ArrowRight, ArrowLeft,
} from 'lucide-react'
import { DraftArticlesEditor, type DraftArticleRow } from './_components/draft-articles-editor'

const ALLOWED_ROLES = ['EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'LAYOUT_EDITOR', 'SYSADMIN']

type WizardStep = 'upload' | 'review' | 'processing' | 'done'

interface IngestStatus {
  slug: string
  status: 'processing' | 'done' | 'failed'
  phase: string
  message: string
  totalArticles: number
  splitDone: number
  splitErrors: number
  extractedFromPdf: number
  ocrApplied: number
  lowQuality: number
  duplicatesFlagged: { articleId: string; title: string; slug: string; severity: number; matches: { title: string; severity: number; type: string }[] }[]
  errors: string[]
  epubUrl?: string
  libraryUrl?: string
}

const PHASE_LABELS: Record<string, string> = {
  CREATED: 'Khởi tạo',
  SPLITTING: 'Tách PDF từng bài',
  EXTRACTING: 'Trích toàn văn / OCR',
  EPUB: 'Sinh EPUB',
  DUPLICATE_CHECK: 'Đối chiếu trùng lặp',
  PUBLISHING: 'Xuất bản',
  DONE: 'Hoàn tất',
  FAILED: 'Lỗi',
}
const PHASE_ORDER = ['CREATED', 'SPLITTING', 'EXTRACTING', 'EPUB', 'DUPLICATE_CHECK', 'PUBLISHING', 'DONE']

const currentYear = new Date().getFullYear()

export default function IssueIngestPage() {
  const session = useDashboardSession()
  const [step, setStep] = useState<WizardStep>('upload')

  // Meta số báo
  const [number, setNumber] = useState('')
  const [year, setYear] = useState(String(currentYear))
  const [month, setMonth] = useState('')
  const [title, setTitle] = useState('')
  const [issueCode, setIssueCode] = useState('')
  const [isSpecial, setIsSpecial] = useState(false)
  const [pageOffset, setPageOffset] = useState('0')
  const [ocr, setOcr] = useState(true)
  const [tocPages, setTocPages] = useState('4')

  // File + kết quả bóc tách
  const [file, setFile] = useState<File | null>(null)
  const [cover, setCover] = useState<File | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [fileUrl, setFileUrl] = useState('')
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [engine, setEngine] = useState<string>('')
  const [totalPdfPages, setTotalPdfPages] = useState(0)
  const [articles, setArticles] = useState<DraftArticleRow[]>([])

  // Tiến trình
  const [slug, setSlug] = useState('')
  const [status, setStatus] = useState<IngestStatus | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  useEffect(() => () => stopPolling(), [stopPolling])

  if (session && !ALLOWED_ROLES.includes(session.role)) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Bạn không có quyền truy cập chức năng số hóa số báo.
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Bước 1 → 2: upload + bóc tách mục lục ──────────────────────────────────
  const handleExtract = async () => {
    if (!file) return toast.error('Vui lòng chọn file PDF số báo')
    if (!number || !year) return toast.error('Vui lòng nhập số và năm xuất bản')

    setExtracting(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      if (cover) fd.append('cover', cover)
      fd.append('tocPages', tocPages)

      const res = await fetch('/api/repository/ingest/extract-toc', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Bóc tách thất bại')

      const data = json.data
      setFileUrl(data.fileUrl)
      setCoverUrl(data.coverUrl ?? null)
      setEngine(data.engine)
      setTotalPdfPages(data.totalPdfPages)
      setArticles(data.articles ?? [])

      if (data.ocrUnavailable) {
        toast.warning('Không trích được mục lục (PDF scan, chưa có OCR). Hãy nhập danh sách bài thủ công.')
      } else if (!data.articles?.length) {
        toast.warning('Chưa nhận diện được bài nào từ mục lục. Hãy nhập/sửa thủ công.')
      } else {
        toast.success(`Đã nhận diện ${data.articles.length} bài (nguồn: ${data.engine}). Vui lòng kiểm tra.`)
      }
      setStep('review')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lỗi bóc tách mục lục')
    } finally {
      setExtracting(false)
    }
  }

  // ── Bước 2 → 3: tạo số + chạy số hóa nền ───────────────────────────────────
  const handleStartIngest = async () => {
    if (articles.length === 0) return toast.error('Cần ít nhất một bài')
    if (articles.some((a) => !a.title.trim())) return toast.error('Có bài chưa nhập tên')

    setSubmitting(true)
    try {
      const res = await fetch('/api/repository/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl,
          coverUrl,
          number: parseInt(number, 10),
          year: parseInt(year, 10),
          month: month ? parseInt(month, 10) : undefined,
          title: title || undefined,
          issueCode: issueCode ? parseInt(issueCode, 10) : undefined,
          isSpecial,
          pageOffset: parseInt(pageOffset, 10) || 0,
          ocr,
          articles,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Khởi tạo số hóa thất bại')

      setSlug(json.data.slug)
      setStep('processing')
      startPolling(json.data.slug)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lỗi khởi tạo số hóa')
    } finally {
      setSubmitting(false)
    }
  }

  const startPolling = (issueSlug: string) => {
    stopPolling()
    const poll = async () => {
      try {
        const res = await fetch(`/api/repository/ingest/${issueSlug}/status`)
        if (!res.ok) return
        const json = await res.json()
        if (!json.success) return
        const st = json.data as IngestStatus
        setStatus(st)
        if (st.status === 'done' || st.status === 'failed') {
          stopPolling()
          setStep('done')
        }
      } catch {
        /* tiếp tục poll */
      }
    }
    poll()
    pollRef.current = setInterval(poll, 2000)
  }

  const phaseIndex = status ? PHASE_ORDER.indexOf(status.phase) : 0
  const progressPct = status?.status === 'done' ? 100 : Math.round((Math.max(0, phaseIndex) / (PHASE_ORDER.length - 1)) * 100)

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Upload className="h-6 w-6 text-[#1E3924]" /> Số hóa số báo cũ
        </h1>
        <p className="text-muted-foreground">
          Tải PDF số báo → tự tách bài, OCR, đưa vào CSDL bài báo (tra cứu, đạo văn, trùng lặp) và sinh EPUB.
        </p>
      </div>

      <StepIndicator step={step} />

      {step === 'upload' && (
        <Card>
          <CardHeader><CardTitle className="text-lg">1. Thông tin số & tải PDF</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <Label>Số *</Label>
                <Input type="number" min={1} value={number} onChange={(e) => setNumber(e.target.value)} placeholder="vd: 5" />
              </div>
              <div className="space-y-1.5">
                <Label>Năm *</Label>
                <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Tháng</Label>
                <Input type="number" min={1} max={12} value={month} onChange={(e) => setMonth(e.target.value)} placeholder="1-12" />
              </div>
              <div className="space-y-1.5">
                <Label>Số liên tục (issueCode)</Label>
                <Input type="number" value={issueCode} onChange={(e) => setIssueCode(e.target.value)} placeholder="vd: 245" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Tiêu đề hiển thị (tuỳ chọn)</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tự tạo nếu để trống" />
              </div>
              <div className="space-y-1.5">
                <Label>Bù lệch trang (offset)</Label>
                <Input type="number" value={pageOffset} onChange={(e) => setPageOffset(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Số trang mục lục đọc</Label>
                <Input type="number" min={1} max={10} value={tocPages} onChange={(e) => setTocPages(e.target.value)} />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={isSpecial} onCheckedChange={setIsSpecial} /> Số đặc biệt
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={ocr} onCheckedChange={setOcr} /> Bật OCR tiếng Việt (PDF scan/font cũ)
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>File PDF số báo *</Label>
                <Input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                {file && <p className="text-xs text-muted-foreground"><FileText className="mr-1 inline h-3 w-3" />{file.name}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Ảnh bìa (tuỳ chọn)</Label>
                <Input type="file" accept="image/*" onChange={(e) => setCover(e.target.files?.[0] ?? null)} />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleExtract} disabled={extracting}>
                {extracting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ScanLine className="mr-2 h-4 w-4" />}
                Bóc tách mục lục
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'review' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <span>2. Kiểm tra & xác nhận danh sách bài</span>
              <span className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
                <Badge variant="outline">Nguồn: {engine || 'n/a'}</Badge>
                <Badge variant="outline">{totalPdfPages} trang PDF</Badge>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DraftArticlesEditor articles={articles} onChange={setArticles} />
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('upload')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
              </Button>
              <Button onClick={handleStartIngest} disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Bắt đầu số hóa
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'processing' && (
        <Card>
          <CardHeader><CardTitle className="text-lg">3. Đang số hóa…</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progressPct} />
            <p className="flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin text-[#1E3924]" />
              <span className="font-medium">{PHASE_LABELS[status?.phase ?? 'CREATED'] ?? status?.phase}</span>
              <span className="text-muted-foreground">— {status?.message ?? 'Đang chuẩn bị...'}</span>
            </p>
            {status && (
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <Stat label="Tổng bài" value={status.totalArticles} />
                <Stat label="Đã tách PDF" value={status.splitDone} />
                <Stat label="OCR áp dụng" value={status.ocrApplied} />
                <Stat label="Text yếu" value={status.lowQuality} />
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              OCR có thể mất vài phút với số báo scan. Có thể rời trang; tiến trình vẫn chạy nền.
            </p>
          </CardContent>
        </Card>
      )}

      {step === 'done' && status && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              {status.status === 'done' ? (
                <><CheckCircle2 className="h-5 w-5 text-green-600" /> Hoàn tất số hóa</>
              ) : (
                <><AlertTriangle className="h-5 w-5 text-destructive" /> Số hóa thất bại</>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <Stat label="Bài đã nhập" value={status.totalArticles} />
              <Stat label="Tách PDF (lỗi)" value={`${status.splitDone} (${status.splitErrors})`} />
              <Stat label="OCR áp dụng" value={status.ocrApplied} />
              <Stat label="Text yếu" value={status.lowQuality} />
            </div>

            {status.duplicatesFlagged.length > 0 && (
              <div className="rounded-md border border-amber-300 bg-amber-50 p-4">
                <p className="mb-2 flex items-center gap-2 font-medium text-amber-800">
                  <AlertTriangle className="h-4 w-4" /> {status.duplicatesFlagged.length} bài nghi trùng với CSDL
                </p>
                <ul className="space-y-1 text-sm text-amber-900">
                  {status.duplicatesFlagged.map((d) => (
                    <li key={d.articleId}>
                      <span className="font-medium">{d.title}</span> — tương đồng {d.severity}% với{' '}
                      {d.matches.map((m) => m.title).slice(0, 2).join('; ')}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-amber-700">Đã nhập đầy đủ; biên tập viên xem xét và xử lý nếu cần.</p>
              </div>
            )}

            {status.errors.length > 0 && (
              <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
                {status.errors.map((e, i) => <p key={i}>• {e}</p>)}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {status.libraryUrl && (
                <Button asChild>
                  <Link href={status.libraryUrl} target="_blank"><BookOpen className="mr-2 h-4 w-4" /> Mở trình đọc số</Link>
                </Button>
              )}
              {status.epubUrl && (
                <Button variant="outline" asChild>
                  <a href={status.epubUrl} download><Download className="mr-2 h-4 w-4" /> Tải EPUB</a>
                </Button>
              )}
              <Button variant="outline" asChild>
                <Link href="/dashboard/repository"><Database className="mr-2 h-4 w-4" /> Về CSDL bài báo</Link>
              </Button>
              <Button variant="ghost" onClick={() => window.location.reload()}>Số hóa số khác</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  )
}

function StepIndicator({ step }: { step: WizardStep }) {
  const steps: { key: WizardStep; label: string }[] = [
    { key: 'upload', label: 'Tải PDF' },
    { key: 'review', label: 'Kiểm tra bài' },
    { key: 'processing', label: 'Xử lý' },
    { key: 'done', label: 'Kết quả' },
  ]
  const activeIndex = steps.findIndex((s) => s.key === step)
  return (
    <div className="flex items-center gap-2 text-sm">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2">
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
              i <= activeIndex ? 'bg-[#1E3924] text-white' : 'bg-muted text-muted-foreground'
            }`}
          >
            {i + 1}
          </span>
          <span className={i === activeIndex ? 'font-medium' : 'text-muted-foreground'}>{s.label}</span>
          {i < steps.length - 1 && <span className="mx-1 text-muted-foreground">→</span>}
        </div>
      ))}
    </div>
  )
}
