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
import { BrandStatCard } from '@/components/dashboard/brand-stat-card'
import { toast } from 'sonner'
import {
  Upload, FileText, ScanLine, Loader2, CheckCircle2, AlertTriangle, Sparkles,
  BookOpen, Download, Database, ArrowRight, ArrowLeft, Layers, ScrollText, ShieldCheck, FileWarning,
} from 'lucide-react'
import { DraftArticlesEditor, type DraftArticleRow } from './_components/draft-articles-editor'
import { CorpusUploadPanel, type CorpusMeta } from './_components/corpus-upload-panel'

const ALLOWED_ROLES = ['EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'LAYOUT_EDITOR', 'SYSADMIN']

type IngestMode = 'ocr' | 'corpus'
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
  tcvn3Applied?: number
  lowQuality: number
  duplicatesFlagged: { articleId: string; title: string; slug: string; severity: number; matches: { title: string; severity: number; type: string }[] }[]
  errors: string[]
  epubUrl?: string
  libraryUrl?: string
  awaitingPublish?: boolean
}

const PHASE_LABELS: Record<string, string> = {
  CREATED: 'Khởi tạo',
  SPLITTING: 'Tách PDF từng bài',
  EXTRACTING: 'Trích toàn văn (tự nhận dạng TCVN3 / OCR)',
  EXTRACT_IMAGES: 'Trích ảnh minh họa',
  IMPORTING: 'Nhập bản chuẩn',
  EPUB: 'Sinh EPUB',
  DUPLICATE_CHECK: 'Đối chiếu trùng lặp',
  READY: 'Sẵn sàng biên tập',
  DONE: 'Hoàn tất',
  FAILED: 'Lỗi',
}
const OCR_PHASES = ['CREATED', 'SPLITTING', 'EXTRACTING', 'EXTRACT_IMAGES', 'EPUB', 'DUPLICATE_CHECK', 'READY']
const CORPUS_PHASES = ['CREATED', 'IMPORTING', 'EPUB', 'DUPLICATE_CHECK', 'READY']

const currentYear = new Date().getFullYear()

export default function IssueIngestPage() {
  const session = useDashboardSession()
  const [mode, setMode] = useState<IngestMode | null>(null)
  const [step, setStep] = useState<WizardStep>('upload')

  // Meta số báo (luồng OCR)
  const [number, setNumber] = useState('')
  const [year, setYear] = useState(String(currentYear))
  const [month, setMonth] = useState('')
  const [title, setTitle] = useState('')
  const [issueCode, setIssueCode] = useState('')
  const [isSpecial, setIsSpecial] = useState(false)
  const [pageOffset, setPageOffset] = useState('0')
  const [ocr, setOcr] = useState(true)
  const [tocPages, setTocPages] = useState('4')

  // File + kết quả bóc tách (luồng số hóa)
  const [file, setFile] = useState<File | null>(null)
  const [images, setImages] = useState<File[]>([])
  const [cover, setCover] = useState<File | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [fileUrl, setFileUrl] = useState('')
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [engine, setEngine] = useState<string>('')
  const [encodingLabel, setEncodingLabel] = useState<string>('')
  const [totalPdfPages, setTotalPdfPages] = useState(0)
  const [articles, setArticles] = useState<DraftArticleRow[]>([])

  // Tiến trình (dùng chung cả 2 luồng)
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

  // ── Luồng OCR: upload + bóc tách mục lục ───────────────────────────────────
  const handleExtract = async () => {
    if (!file && images.length === 0) return toast.error('Chọn file PDF số báo hoặc ảnh scan')
    if (!number || !year) return toast.error('Vui lòng nhập số và năm xuất bản')

    setExtracting(true)
    try {
      const fd = new FormData()
      if (file) fd.append('file', file)
      else images.forEach((img) => fd.append('images', img))
      if (cover) fd.append('cover', cover)
      fd.append('tocPages', tocPages)

      const res = await fetch('/api/repository/ingest/extract-toc', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Bóc tách thất bại')

      const data = json.data
      setFileUrl(data.fileUrl)
      setCoverUrl(data.coverUrl ?? null)
      setEngine(data.engine)
      setEncodingLabel(data.encodingLabel ?? '')
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

  // ── Luồng OCR: tạo số + chạy số hóa nền ────────────────────────────────────
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

  // ── Luồng corpus: upload corpus.json/.zip + chạy nền ───────────────────────
  const handleStartCorpus = async (corpusFile: File, meta: CorpusMeta) => {
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('file', corpusFile)
      if (meta.number) fd.append('number', meta.number)
      if (meta.year) fd.append('year', meta.year)
      if (meta.issueCode) fd.append('issueCode', meta.issueCode)
      if (meta.isSpecial) fd.append('isSpecial', 'true')

      const res = await fetch('/api/repository/ingest/import-corpus', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Nhập corpus thất bại')

      setSlug(json.data.slug)
      setStep('processing')
      startPolling(json.data.slug)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lỗi nhập corpus')
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

  const resetWizard = () => {
    stopPolling()
    setMode(null)
    setStep('upload')
    setStatus(null)
    setSlug('')
    setFile(null)
    setImages([])
    setCover(null)
    setArticles([])
    setFileUrl('')
    setCoverUrl(null)
  }

  const phases = mode === 'corpus' ? CORPUS_PHASES : OCR_PHASES
  const phaseIndex = status ? phases.indexOf(status.phase) : 0
  const progressPct = status?.status === 'done' ? 100 : Math.round((Math.max(0, phaseIndex) / (phases.length - 1)) * 100)

  return (
    <div className="theme-leadership space-y-6 p-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E3924] via-[#1E3924] to-[#2c5237] p-6 text-[#F9F9F9] shadow-lg">
        <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-[#E5C86E]/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 right-24 h-32 w-32 rounded-full bg-[#E5C86E]/10 blur-2xl" />
        <div className="relative flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E5C86E]/20 ring-1 ring-[#E5C86E]/40">
            <ScanLine className="h-6 w-6 text-[#E5C86E]" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">Số hóa số báo cũ</h1>
            <p className="mt-1 max-w-2xl text-sm text-[#F9F9F9]/80">
              Đưa các số báo in trước đây vào CSDL bài báo (tra cứu, kiểm tra đạo văn, đối chiếu trùng lặp)
              và sinh bản đọc số EPUB cho Thư viện điện tử.
            </p>
            {mode && (
              <button
                onClick={resetWizard}
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#E5C86E] hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Chọn lại cách số hóa
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bước 0: chọn cách số hóa — mặc định số hóa từ PDF/ảnh (một luồng). */}
      {!mode && (
        <div className="space-y-4">
          <ModeCard
            recommended
            icon={ScanLine}
            title="Số hóa số báo từ PDF hoặc ảnh"
            desc="Tải PDF số báo (hoặc ảnh scan) → tự tách từng bài, tự nhận dạng font cũ TCVN3 và chuyển mã, OCR khi cần. Biên tập viên kiểm tra & sửa trước khi xuất bản."
            points={['Nhận cả PDF lẫn ảnh scan', 'Tự chuyển mã TCVN3 → Unicode (không cần công cụ ngoài)', 'OCR tiếng Việt dự phòng', 'Dừng ở nháp để biên tập, rồi mới xuất bản']}
            onClick={() => { setMode('ocr'); setStep('upload') }}
          />
          <details className="rounded-xl border border-border/70 bg-muted/30 p-4">
            <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
              Nâng cao: nhập bản chuẩn corpus.json (đã có sẵn bản trích)
            </summary>
            <div className="mt-3">
              <ModeCard
                icon={Sparkles}
                title="Nhập bản chuẩn (corpus.json)"
                desc="Dùng khi bạn đã có sẵn file corpus.json trích chuẩn từng ký tự cho một số. Bỏ qua bước tách/OCR."
                points={['Toàn văn có sẵn, nhập nhanh', 'Vẫn dừng ở nháp để kiểm tra & xuất bản']}
                onClick={() => { setMode('corpus'); setStep('upload') }}
              />
            </div>
          </details>
        </div>
      )}

      {/* Thanh bước */}
      {mode && <StepIndicator mode={mode} step={step} />}

      {/* ── Luồng OCR ─────────────────────────────────────────────────────── */}
      {mode === 'ocr' && step === 'upload' && (
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
              <span className="text-xs text-muted-foreground">
                Engine text tự chọn: trích trực tiếp → chuyển mã TCVN3 → OCR (không cần bật/tắt).
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Nguồn số báo * — PDF hoặc ảnh scan</Label>
                <Input
                  type="file"
                  accept="application/pdf,image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? [])
                    const pdf = files.find((f) => f.type === 'application/pdf')
                    if (pdf) { setFile(pdf); setImages([]) }
                    else { setImages(files.filter((f) => f.type.startsWith('image/'))); setFile(null) }
                  }}
                />
                {file && <p className="text-xs text-muted-foreground"><FileText className="mr-1 inline h-3 w-3" />{file.name}</p>}
                {images.length > 0 && <p className="text-xs text-muted-foreground"><FileText className="mr-1 inline h-3 w-3" />{images.length} ảnh scan</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Ảnh bìa (tuỳ chọn)</Label>
                <Input type="file" accept="image/*" onChange={(e) => setCover(e.target.files?.[0] ?? null)} />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleExtract} disabled={extracting} className="bg-[#1E3924] text-white hover:bg-[#1E3924]/90">
                {extracting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ScanLine className="mr-2 h-4 w-4" />}
                Bóc tách mục lục
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {mode === 'ocr' && step === 'review' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <span>2. Kiểm tra & xác nhận danh sách bài</span>
              <span className="flex flex-wrap items-center gap-2 text-sm font-normal text-muted-foreground">
                {encodingLabel && <Badge className="bg-[#1E3924] text-white">Nhận dạng: {encodingLabel}</Badge>}
                <Badge variant="outline">Nguồn text: {engine || 'n/a'}</Badge>
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
              <Button onClick={handleStartIngest} disabled={submitting} className="bg-[#1E3924] text-white hover:bg-[#1E3924]/90">
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Bắt đầu số hóa
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Luồng corpus ──────────────────────────────────────────────────── */}
      {mode === 'corpus' && step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-[#E5C86E]" /> Nhập bản chuẩn từ tcvn3-extractor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CorpusUploadPanel onStart={handleStartCorpus} submitting={submitting} />
          </CardContent>
        </Card>
      )}

      {/* ── Xử lý (dùng chung) ────────────────────────────────────────────── */}
      {step === 'processing' && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Đang số hóa…</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <Loader2 className="h-4 w-4 animate-spin text-[#1E3924] dark:text-emerald-300" />
                  {PHASE_LABELS[status?.phase ?? 'CREATED'] ?? status?.phase}
                </span>
                <span className="tabular-nums text-muted-foreground">{progressPct}%</span>
              </div>
              <Progress value={progressPct} className="h-2" />
              <p className="mt-2 text-sm text-muted-foreground">{status?.message ?? 'Đang chuẩn bị...'}</p>
            </div>

            <PhaseTimeline phases={phases} current={status?.phase ?? 'CREATED'} />

            {status && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <BrandStatCard label="Tổng bài" value={status.totalArticles} icon={ScrollText} tone="green" />
                <BrandStatCard label={mode === 'corpus' ? 'Đã nhập' : 'Đã tách PDF'} value={status.splitDone} icon={Layers} tone="gold" />
                <BrandStatCard label="Có toàn văn" value={status.extractedFromPdf} icon={FileText} tone="emerald" />
                <BrandStatCard label="Text yếu" value={status.lowQuality} icon={FileWarning} tone={status.lowQuality > 0 ? 'amber' : 'slate'} />
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Có thể rời trang — tiến trình vẫn chạy nền. OCR (nếu có) sẽ mất vài phút với số báo scan.
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Kết quả (dùng chung) ──────────────────────────────────────────── */}
      {step === 'done' && status && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              {status.status === 'done' ? (
                <><CheckCircle2 className="h-5 w-5 text-emerald-600" /> Sẵn sàng biên tập — chưa xuất bản</>
              ) : (
                <><AlertTriangle className="h-5 w-5 text-destructive" /> Số hóa thất bại</>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <BrandStatCard label="Bài đã nhập" value={status.totalArticles} icon={ScrollText} tone="green" />
              <BrandStatCard label={mode === 'corpus' ? 'Đã nhập' : 'Tách PDF (lỗi)'} value={mode === 'corpus' ? status.splitDone : `${status.splitDone} (${status.splitErrors})`} icon={Layers} tone="gold" />
              <BrandStatCard label="Có toàn văn" value={status.extractedFromPdf} icon={FileText} tone="emerald" />
              <BrandStatCard label="Text yếu" value={status.lowQuality} icon={FileWarning} tone={status.lowQuality > 0 ? 'amber' : 'slate'} />
            </div>

            {status.duplicatesFlagged.length > 0 && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700/50 dark:bg-amber-950/30">
                <p className="mb-2 flex items-center gap-2 font-medium text-amber-800 dark:text-amber-200">
                  <ShieldCheck className="h-4 w-4" /> {status.duplicatesFlagged.length} bài nghi trùng với CSDL
                </p>
                <ul className="space-y-1 text-sm text-amber-900 dark:text-amber-200/90">
                  {status.duplicatesFlagged.map((d) => (
                    <li key={d.articleId}>
                      <span className="font-medium">{d.title}</span> — trùng cụm nguyên văn {d.severity}% với{' '}
                      {d.matches.map((m) => m.title).slice(0, 2).join('; ')}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-amber-700 dark:text-amber-300/80">
                  Đã nhập đầy đủ; cờ dựa trên trùng cụm NGUYÊN VĂN (không phải cùng chủ đề). Biên tập viên xem xét và xử lý nếu cần.
                </p>
              </div>
            )}

            {status.errors.length > 0 && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
                {status.errors.map((e, i) => <p key={i}>• {e}</p>)}
              </div>
            )}

            {status.status === 'done' && (
              <div className="rounded-lg border border-[#E5C86E]/50 bg-[#E5C86E]/10 p-4 text-sm">
                <p className="font-medium text-[#1E3924] dark:text-emerald-100">Bước tiếp theo: kiểm tra & biên tập</p>
                <p className="mt-1 text-muted-foreground">
                  Số đang ở trạng thái <b>nháp</b>. Hãy kiểm tra/sửa toàn văn, mục lục, ảnh minh họa,
                  tải ảnh đầu/cuối số rồi bấm <b>Xuất bản</b> ở trang biên tập.
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {status.status === 'done' && (
                <Button asChild className="bg-[#1E3924] text-white hover:bg-[#1E3924]/90">
                  <Link href={`/dashboard/repository/ingest/${slug}/review`}>
                    <ArrowRight className="mr-2 h-4 w-4" /> Kiểm tra &amp; biên tập
                  </Link>
                </Button>
              )}
              {status.libraryUrl && (
                <Button variant="outline" asChild>
                  <Link href={status.libraryUrl} target="_blank"><BookOpen className="mr-2 h-4 w-4" /> Xem trình đọc (nháp)</Link>
                </Button>
              )}
              {status.epubUrl && (
                <Button variant="outline" asChild>
                  <a href={status.epubUrl} download><Download className="mr-2 h-4 w-4" /> Tải EPUB</a>
                </Button>
              )}
              <Button variant="ghost" onClick={resetWizard}>Số hóa số khác</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ModeCard({
  icon: Icon, title, desc, points, onClick, recommended = false,
}: {
  icon: typeof ScanLine
  title: string
  desc: string
  points: string[]
  onClick: () => void
  recommended?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className="group relative flex h-full flex-col rounded-2xl border border-border/70 bg-card p-6 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#E5C86E] hover:shadow-md"
    >
      {recommended && (
        <Badge className="absolute right-4 top-4 bg-[#E5C86E] text-[#1E3924] hover:bg-[#E5C86E]">Khuyến nghị</Badge>
      )}
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#1E3924]/10 text-[#1E3924] transition-colors group-hover:bg-[#1E3924] group-hover:text-[#E5C86E] dark:text-emerald-300">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-bold text-[#1E3924] dark:text-emerald-100">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      <ul className="mt-4 space-y-1.5 text-sm">
        {points.map((p, i) => (
          <li key={i} className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
      <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[#1E3924] dark:text-emerald-300">
        Bắt đầu <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </span>
    </button>
  )
}

function StepIndicator({ mode, step }: { mode: IngestMode; step: WizardStep }) {
  const steps: { key: WizardStep; label: string }[] = mode === 'corpus'
    ? [
        { key: 'upload', label: 'Tải corpus' },
        { key: 'processing', label: 'Xử lý' },
        { key: 'done', label: 'Kết quả' },
      ]
    : [
        { key: 'upload', label: 'Tải PDF' },
        { key: 'review', label: 'Kiểm tra bài' },
        { key: 'processing', label: 'Xử lý' },
        { key: 'done', label: 'Kết quả' },
      ]
  const activeIndex = steps.findIndex((s) => s.key === step)

  return (
    <div className="flex items-center">
      {steps.map((s, i) => {
        const done = i < activeIndex
        const active = i === activeIndex
        return (
          <div key={s.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  active ? 'bg-[#E5C86E] text-[#1E3924] ring-2 ring-[#E5C86E]/40'
                    : done ? 'bg-[#1E3924] text-white'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </span>
              <span className={`hidden text-sm sm:inline ${active ? 'font-semibold text-[#1E3924] dark:text-emerald-200' : 'text-muted-foreground'}`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span className={`mx-2 h-0.5 flex-1 rounded ${done ? 'bg-[#1E3924]' : 'bg-muted'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function PhaseTimeline({ phases, current }: { phases: string[]; current: string }) {
  const currentIndex = phases.indexOf(current)
  const visible = phases.filter((p) => p !== 'CREATED' && p !== 'DONE')
  return (
    <div className="flex flex-wrap gap-2">
      {visible.map((p) => {
        const idx = phases.indexOf(p)
        const done = idx < currentIndex || current === 'DONE'
        const active = idx === currentIndex
        return (
          <span
            key={p}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
              done ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                : active ? 'bg-[#E5C86E]/25 text-[#8a6a14] ring-1 ring-[#E5C86E] dark:text-[#E5C86E]'
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : active ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {PHASE_LABELS[p] ?? p}
          </span>
        )
      })}
    </div>
  )
}
