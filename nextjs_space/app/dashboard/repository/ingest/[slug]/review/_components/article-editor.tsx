'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { getImageUrl } from '@/lib/image-utils-client'
import { toast } from 'sonner'
import { Loader2, Save, ImagePlus, ChevronDown, ChevronRight, ShieldAlert } from 'lucide-react'
import type { ArticleImage } from '@/lib/services/journal-images-layout.service'

export interface ReviewArticle {
  id: string
  slug: string
  title: string
  authorsText: string | null
  sectionId: string | null
  pageStart: number
  pageEnd: number | null
  abstract: string | null
  contentText: string | null
  contentSource: string | null
  extractionStatus: string
  status: string
}

interface Props {
  issueId: string
  slug: string
  article: ReviewArticle
  sections: { id: string; name: string }[]
  images: ArticleImage[]
  duplicate?: { severity: number; matches: { title: string }[] }
  onImagesChange: (articleSlug: string, images: ArticleImage[]) => void
}

const SOURCE_LABEL: Record<string, string> = {
  'tcvn3-convert': 'Chuyển mã TCVN3',
  pdftotext: 'Trích text',
  'pdf-parse': 'Trích text',
  'manual-edit': 'Đã sửa tay',
  'pdf-ingest': 'Chờ trích',
}

export function ArticleEditor({ issueId, slug, article, sections, images, duplicate, onImagesChange }: Props) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(article.title)
  const [authorsText, setAuthorsText] = useState(article.authorsText ?? '')
  const [sectionId, setSectionId] = useState(article.sectionId ?? '')
  const [pageStart, setPageStart] = useState(String(article.pageStart))
  const [pageEnd, setPageEnd] = useState(article.pageEnd ? String(article.pageEnd) : '')
  const [contentText, setContentText] = useState(article.contentText ?? '')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const sourceLabel = SOURCE_LABEL[article.contentSource ?? ''] ?? article.contentSource ?? '—'
  const lowQuality = article.extractionStatus === 'OCR_FAILED' || article.extractionStatus === 'LOW_QUALITY'

  const handleSave = async () => {
    if (!title.trim()) return toast.error('Tên bài không được trống')
    setSaving(true)
    try {
      const res = await fetch(`/api/issues/${issueId}/journal-articles/${article.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          authorsText,
          sectionId: sectionId || null,
          pageStart: parseInt(pageStart, 10) || article.pageStart,
          pageEnd: pageEnd ? parseInt(pageEnd, 10) : null,
          contentText,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Lưu thất bại')
      toast.success('Đã lưu bài')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lỗi lưu bài')
    } finally {
      setSaving(false)
    }
  }

  const handleUploadImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('kind', 'article')
      fd.append('articleSlug', article.slug)
      Array.from(files).forEach((f) => fd.append('files', f))
      const res = await fetch(`/api/repository/ingest/${slug}/images`, { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Tải ảnh thất bại')
      onImagesChange(article.slug, json.data.layout.articles[article.slug]?.images ?? [])
      toast.success('Đã tải ảnh vào bài')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lỗi tải ảnh')
    } finally {
      setUploading(false)
    }
  }

  const toggleImage = (idx: number) => {
    const next = images.map((img, i) => (i === idx ? { ...img, enabled: !img.enabled } : img))
    onImagesChange(article.slug, next)
  }
  const setCaption = (idx: number, caption: string) => {
    const next = images.map((img, i) => (i === idx ? { ...img, caption } : img))
    onImagesChange(article.slug, next)
  }

  return (
    <Card className={duplicate ? 'border-amber-300' : lowQuality ? 'border-orange-300' : ''}>
      <CardContent className="p-4">
        <button onClick={() => setOpen((v) => !v)} className="flex w-full items-start gap-2 text-left">
          {open ? <ChevronDown className="mt-1 h-4 w-4 shrink-0" /> : <ChevronRight className="mt-1 h-4 w-4 shrink-0" />}
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-[#1E3924] dark:text-emerald-100">{title || '(chưa có tên)'}</p>
            <p className="truncate text-xs text-muted-foreground">{authorsText || 'Chưa có tác giả'} · tr. {pageStart}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-1">
            <Badge variant="outline" className="text-xs">{sourceLabel}</Badge>
            {lowQuality && <Badge className="bg-orange-500 text-xs">Text yếu</Badge>}
            {duplicate && (
              <Badge className="bg-amber-500 text-xs"><ShieldAlert className="mr-1 h-3 w-3" />Trùng {duplicate.severity}%</Badge>
            )}
          </div>
        </button>

        {open && (
          <div className="mt-4 space-y-4 border-t pt-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <Label>Tên bài</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Tác giả</Label>
                <Input value={authorsText} onChange={(e) => setAuthorsText(e.target.value)} placeholder="Ngăn cách bằng ;" />
              </div>
              <div className="space-y-1">
                <Label>Chuyên mục</Label>
                <select
                  value={sectionId}
                  onChange={(e) => setSectionId(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">— Không —</option>
                  {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Trang bắt đầu</Label>
                <Input type="number" value={pageStart} onChange={(e) => setPageStart(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Trang kết thúc</Label>
                <Input type="number" value={pageEnd} onChange={(e) => setPageEnd(e.target.value)} />
              </div>
            </div>

            {duplicate && (
              <div className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                Nghi trùng cụm nguyên văn {duplicate.severity}% với: {duplicate.matches.map((m) => m.title).slice(0, 2).join('; ')}
              </div>
            )}

            <div className="space-y-1">
              <Label>Toàn văn (sửa để chỉnh lỗi chuyển mã/OCR trước khi xuất bản)</Label>
              <Textarea
                value={contentText}
                onChange={(e) => setContentText(e.target.value)}
                rows={12}
                className="font-serif text-sm leading-relaxed"
                placeholder={lowQuality ? 'Chưa trích được toàn văn — nhập tay nếu cần.' : ''}
              />
              <p className="text-xs text-muted-foreground">{contentText.length.toLocaleString('vi-VN')} ký tự</p>
            </div>

            {/* Ảnh trong bài */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Ảnh minh họa ({images.filter((i) => i.enabled).length}/{images.length} bật)</Label>
                <label className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-[#1E3924] hover:underline dark:text-emerald-300">
                  {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />} Tải ảnh
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleUploadImages(e.target.files)} />
                </label>
              </div>
              {images.length > 0 && (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {images.map((img, i) => (
                    <div key={img.file} className={`rounded-md border p-2 ${img.enabled ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-border opacity-70'}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={getImageUrl(`/data/issues/${slug}/${img.file}`)} alt="" className="mb-1 h-24 w-full rounded object-contain bg-muted" />
                      <label className="flex items-center gap-1.5 text-xs">
                        <input type="checkbox" checked={img.enabled} onChange={() => toggleImage(i)} /> Đưa vào bản đọc
                      </label>
                      <Input value={img.caption ?? ''} onChange={(e) => setCaption(i, e.target.value)} placeholder="Chú thích" className="mt-1 h-7 text-xs" />
                    </div>
                  ))}
                </div>
              )}
              {images.length === 0 && <p className="text-xs text-muted-foreground">Chưa có ảnh trích tự động cho bài này.</p>}
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} size="sm" className="bg-[#1E3924] text-white hover:bg-[#1E3924]/90">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Lưu bài
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
