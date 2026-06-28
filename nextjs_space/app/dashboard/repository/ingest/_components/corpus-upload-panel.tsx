'use client'

import { useState } from 'react'
import JSZip from 'jszip'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  FileJson, FileArchive, Loader2, CheckCircle2, AlertTriangle, Upload,
  BookText, Layers, FileText, Image as ImageIcon, ChevronDown,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Corpus, CorpusArticle } from '@/types/corpus'

export interface CorpusMeta {
  number?: string
  year?: string
  month?: string
  issueCode?: string
  isSpecial: boolean
}

interface CorpusPreview {
  issueName: string
  totalArticles: number
  sections: number
  withFullText: number
  withoutFullText: number
  hasArticlePdfs: boolean
  hasCover: boolean
  sampleTitles: string[]
  warnings: string[]
}

interface CorpusUploadPanelProps {
  onStart: (file: File, meta: CorpusMeta) => void
  submitting: boolean
}

function articleHasFullText(article: CorpusArticle): boolean {
  return (article.body?.paragraphs ?? []).some((p) => p.text?.trim())
}

/** Đọc + phân tích corpus phía client để xem trước trước khi nhập (không gọi server). */
async function parseCorpusPreview(file: File): Promise<CorpusPreview> {
  const lower = file.name.toLowerCase()
  const isZip = lower.endsWith('.zip')

  let corpus: Corpus
  let hasArticlePdfs = false
  let hasCover = false

  if (isZip) {
    const zip = await JSZip.loadAsync(await file.arrayBuffer())
    const entries = Object.values(zip.files).filter((e) => !e.dir)
    const corpusEntry = entries.find((e) => /(^|\/)corpus\.json$/i.test(e.name))
    if (!corpusEntry) throw new Error('Trong .zip không tìm thấy corpus.json')
    corpus = JSON.parse(await corpusEntry.async('string')) as Corpus
    hasArticlePdfs = entries.some((e) => /(?:^|\/)articles_pdf\/[^/]+\.pdf$/i.test(e.name))
    hasCover = entries.some((e) => /(?:^|\/)cover\.(jpe?g|png|webp)$/i.test(e.name))
  } else {
    corpus = JSON.parse(await file.text()) as Corpus
  }

  if (!corpus || !Array.isArray(corpus.articles) || corpus.articles.length === 0) {
    throw new Error('corpus.json không hợp lệ (thiếu mảng "articles")')
  }

  const withFullText = corpus.articles.filter(articleHasFullText).length
  const withoutFullText = corpus.articles.length - withFullText

  const warnings: string[] = []
  const noAuthor = corpus.articles.filter((a) => !a.authors?.length).length
  if (noAuthor > 0) warnings.push(`${noAuthor} bài chưa có tác giả`)
  if (withoutFullText > 0) warnings.push(`${withoutFullText} bài chưa có toàn văn`)
  if (!isZip) warnings.push('Chỉ có corpus.json — không kèm PDF từng bài (vẫn nhập được toàn văn)')

  return {
    issueName: corpus.issue?.name ?? file.name,
    totalArticles: corpus.articles.length,
    sections: corpus.sections?.length ?? 0,
    withFullText,
    withoutFullText,
    hasArticlePdfs,
    hasCover,
    sampleTitles: corpus.articles.slice(0, 5).map((a) => a.title?.main ?? '(không tên)'),
    warnings,
  }
}

export function CorpusUploadPanel({ onStart, submitting }: CorpusUploadPanelProps) {
  const [file, setFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false)
  const [preview, setPreview] = useState<CorpusPreview | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [meta, setMeta] = useState<CorpusMeta>({ isSpecial: false })

  const handleFile = async (picked: File | null) => {
    setFile(picked)
    setPreview(null)
    if (!picked) return
    setParsing(true)
    try {
      const result = await parseCorpusPreview(picked)
      setPreview(result)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Không đọc được corpus')
      setFile(null)
    } finally {
      setParsing(false)
    }
  }

  const isZip = file?.name.toLowerCase().endsWith('.zip')

  return (
    <div className="space-y-5">
      {/* Vùng chọn file */}
      <label
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#1E3924]/25 bg-[#1E3924]/[0.03] px-6 py-8 text-center transition-colors hover:border-[#E5C86E] hover:bg-[#E5C86E]/5"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1E3924]/10">
          {isZip ? <FileArchive className="h-6 w-6 text-[#1E3924]" /> : <FileJson className="h-6 w-6 text-[#1E3924]" />}
        </div>
        {file ? (
          <div>
            <p className="font-medium text-[#1E3924]">{file.name}</p>
            <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        ) : (
          <div>
            <p className="font-medium">Chọn file corpus từ tcvn3-extractor</p>
            <p className="text-xs text-muted-foreground">
              <code>corpus.json</code> hoặc <code>.zip</code> (corpus.json + articles_pdf/ + cover)
            </p>
          </div>
        )}
        <Input
          type="file"
          accept=".json,.zip,application/json,application/zip"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
      </label>

      {parsing && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Đang đọc & kiểm tra corpus…
        </p>
      )}

      {/* Xem trước */}
      {preview && (
        <div className="space-y-4 rounded-xl border border-border/70 bg-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Số báo nhận diện</p>
              <p className="text-lg font-bold text-[#1E3924] dark:text-emerald-200">{preview.issueName}</p>
            </div>
            <Badge className="bg-[#E5C86E] text-[#1E3924] hover:bg-[#E5C86E]">Bản chuẩn TCVN3</Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <PreviewStat icon={BookText} label="Tổng bài" value={preview.totalArticles} />
            <PreviewStat icon={Layers} label="Chuyên mục" value={preview.sections} />
            <PreviewStat icon={FileText} label="Có toàn văn" value={preview.withFullText} tone="ok" />
            <PreviewStat
              icon={AlertTriangle}
              label="Thiếu toàn văn"
              value={preview.withoutFullText}
              tone={preview.withoutFullText > 0 ? 'warn' : 'ok'}
            />
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <Capability ok={preview.hasArticlePdfs} icon={FileText} label="PDF từng bài" />
            <Capability ok={preview.hasCover} icon={ImageIcon} label="Ảnh bìa" />
          </div>

          {preview.sampleTitles.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Ví dụ bài đầu số:</p>
              <ul className="space-y-0.5 text-sm">
                {preview.sampleTitles.map((t, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-[#E5C86E]">•</span>
                    <span className="line-clamp-1">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {preview.warnings.length > 0 && (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-200">
              <p className="mb-1 flex items-center gap-1.5 font-medium">
                <AlertTriangle className="h-4 w-4" /> Lưu ý
              </p>
              <ul className="ml-5 list-disc space-y-0.5">
                {preview.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}

          {/* Tuỳ chọn nâng cao: override slug số báo */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              Tuỳ chọn nâng cao (đặt lại số/năm)
            </button>
            {showAdvanced && (
              <div className="mt-3 grid gap-3 sm:grid-cols-4">
                <Field label="Số">
                  <Input type="number" value={meta.number ?? ''} onChange={(e) => setMeta({ ...meta, number: e.target.value })} placeholder="vd: 7" />
                </Field>
                <Field label="Năm">
                  <Input type="number" value={meta.year ?? ''} onChange={(e) => setMeta({ ...meta, year: e.target.value })} placeholder="vd: 2026" />
                </Field>
                <Field label="Số liên tục">
                  <Input type="number" value={meta.issueCode ?? ''} onChange={(e) => setMeta({ ...meta, issueCode: e.target.value })} placeholder="vd: 247" />
                </Field>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-sm">
                    <Switch checked={meta.isSpecial} onCheckedChange={(v) => setMeta({ ...meta, isSpecial: v })} /> Số đặc biệt
                  </label>
                </div>
                <p className="text-xs text-muted-foreground sm:col-span-4">
                  Để trống = tự suy từ tên số trong corpus. Chỉ điền khi muốn cố định đường dẫn (slug) số báo.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-1">
            <Button
              onClick={() => file && onStart(file, meta)}
              disabled={submitting || !file}
              className="bg-[#1E3924] text-white hover:bg-[#1E3924]/90"
            >
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Bắt đầu nhập {preview.totalArticles} bài
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function PreviewStat({
  icon: Icon, label, value, tone = 'default',
}: { icon: typeof BookText; label: string; value: number; tone?: 'default' | 'ok' | 'warn' }) {
  const valueColor =
    tone === 'warn' ? 'text-amber-600 dark:text-amber-300'
      : tone === 'ok' ? 'text-emerald-700 dark:text-emerald-300'
        : 'text-[#1E3924] dark:text-emerald-200'
  return (
    <div className="rounded-lg border border-border/60 bg-background p-3">
      <Icon className="mb-1 h-4 w-4 text-muted-foreground" />
      <p className={`text-xl font-bold tabular-nums ${valueColor}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function Capability({ ok, icon: Icon, label }: { ok: boolean; icon: typeof FileText; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${
        ok ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
          : 'bg-muted text-muted-foreground'
      }`}
    >
      {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
      {label}: {ok ? 'có' : 'không'}
    </span>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  )
}
