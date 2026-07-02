'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { getImageUrl } from '@/lib/image-utils-client'
import { toast } from 'sonner'
import {
  Loader2, BookOpen, RefreshCw, Send, ArrowLeft, ImagePlus, ShieldAlert, X, FileText,
} from 'lucide-react'
import { ArticleEditor, type ReviewArticle } from './_components/article-editor'
import type { ImagesLayout, MatterImage } from '@/lib/services/journal-images-layout.service'

interface DuplicateFlag {
  articleId: string
  title: string
  severity: number
  matches: { title: string }[]
}
interface ReviewData {
  issue: { id: string; slug: string; title: string; number: number; year: number; coverImage: string | null; status: string; pageCount: number | null }
  sections: { id: string; name: string }[]
  articles: ReviewArticle[]
  status: { duplicatesFlagged?: DuplicateFlag[]; awaitingPublish?: boolean; publishedAt?: string } | null
  imagesLayout: ImagesLayout
}

export default function IssueReviewPage() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug
  const [data, setData] = useState<ReviewData | null>(null)
  const [layout, setLayout] = useState<ImagesLayout>({ frontMatter: [], backMatter: [], articles: {} })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<'' | 'rebuild' | 'publish'>('')
  const [uploadingMatter, setUploadingMatter] = useState<'' | 'front' | 'back'>('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/repository/ingest/${slug}/review`)
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Không tải được dữ liệu')
      setData(json.data)
      setLayout(json.data.imagesLayout)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { load() }, [load])

  const saveLayout = async () => {
    const res = await fetch(`/api/repository/ingest/${slug}/images/layout`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(layout),
    })
    const json = await res.json()
    if (!res.ok || !json.success) throw new Error(json.error || 'Lưu bố cục ảnh thất bại')
  }

  const handleRebuild = async () => {
    setBusy('rebuild')
    try {
      await saveLayout()
      const res = await fetch(`/api/repository/ingest/${slug}/rebuild`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Dựng lại thất bại')
      toast.success('Đã lưu & dựng lại bản đọc + EPUB')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lỗi dựng lại')
    } finally {
      setBusy('')
    }
  }

  const handlePublish = async () => {
    if (!confirm('Xuất bản số báo này? Số + tất cả bài sẽ hiển thị công khai.')) return
    setBusy('publish')
    try {
      await saveLayout()
      const res = await fetch(`/api/repository/ingest/${slug}/publish`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Xuất bản thất bại')
      toast.success('Đã xuất bản số báo!')
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lỗi xuất bản')
    } finally {
      setBusy('')
    }
  }

  const uploadMatter = async (kind: 'front' | 'back', files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploadingMatter(kind)
    try {
      const fd = new FormData()
      fd.append('kind', kind)
      Array.from(files).forEach((f) => fd.append('files', f))
      const res = await fetch(`/api/repository/ingest/${slug}/images`, { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Tải ảnh thất bại')
      setLayout(json.data.layout)
      toast.success('Đã tải ảnh')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lỗi tải ảnh')
    } finally {
      setUploadingMatter('')
    }
  }

  const removeMatter = (kind: 'front' | 'back', idx: number) => {
    setLayout((prev) => ({
      ...prev,
      [kind === 'front' ? 'frontMatter' : 'backMatter']: (kind === 'front' ? prev.frontMatter : prev.backMatter).filter((_, i) => i !== idx),
    }))
  }

  const onArticleImagesChange = (articleSlug: string, images: ImagesLayout['articles'][string]['images']) => {
    setLayout((prev) => ({ ...prev, articles: { ...prev.articles, [articleSlug]: { images } } }))
  }

  if (loading) return <div className="flex h-64 items-center justify-center p-6"><Loader2 className="h-6 w-6 animate-spin text-[#1E3924]" /></div>
  if (error) return (
    <div className="p-6"><Card><CardContent className="space-y-3 p-6 text-center">
      <p className="text-destructive">{error}</p>
      <Button variant="outline" onClick={load}>Thử lại</Button>
    </CardContent></Card></div>
  )
  if (!data) return null

  const dupByArticle = new Map((data.status?.duplicatesFlagged ?? []).map((d) => [d.articleId, d]))
  const published = data.issue.status === 'PUBLISHED'

  return (
    <div className="theme-leadership space-y-5 p-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E3924] to-[#2c5237] p-6 text-[#F9F9F9] shadow-lg">
        <Link href="/dashboard/repository/ingest" className="mb-2 inline-flex items-center gap-1 text-xs text-[#E5C86E] hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Về số hóa
        </Link>
        <h1 className="text-2xl font-bold">Biên tập trước xuất bản — {data.issue.title}</h1>
        <p className="mt-1 text-sm text-[#F9F9F9]/80">
          Kiểm tra & sửa toàn văn, mục lục, ảnh minh họa; tải ảnh đầu/cuối số; rồi bấm Xuất bản.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {published
            ? <Badge className="bg-emerald-600">Đã xuất bản</Badge>
            : <Badge className="bg-[#E5C86E] text-[#1E3924]">Nháp — chờ xuất bản</Badge>}
          <Badge variant="outline" className="border-white/30 text-white">{data.articles.length} bài</Badge>
        </div>
      </div>

      {/* Actions */}
      <div className="sticky top-0 z-10 flex flex-wrap gap-2 rounded-xl border bg-background/95 p-3 shadow-sm backdrop-blur">
        <Button onClick={handleRebuild} disabled={busy !== ''} variant="outline">
          {busy === 'rebuild' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />} Lưu & dựng lại
        </Button>
        {!published && (
          <Button onClick={handlePublish} disabled={busy !== ''} className="bg-[#1E3924] text-white hover:bg-[#1E3924]/90">
            {busy === 'publish' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />} Xuất bản
          </Button>
        )}
        <Button variant="ghost" asChild>
          <Link href={`/library/${slug}`} target="_blank"><BookOpen className="mr-2 h-4 w-4" /> Xem trình đọc</Link>
        </Button>
        <Button variant="ghost" asChild>
          <a href={`/data/issues/${slug}/issue.epub`} download><FileText className="mr-2 h-4 w-4" /> Tải EPUB</a>
        </Button>
      </div>

      {/* Dup summary */}
      {(data.status?.duplicatesFlagged?.length ?? 0) > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm dark:bg-amber-950/30">
          <p className="flex items-center gap-2 font-medium text-amber-800 dark:text-amber-200">
            <ShieldAlert className="h-4 w-4" /> {data.status!.duplicatesFlagged!.length} bài nghi trùng nguyên văn với kho — xem cờ ở từng bài.
          </p>
        </div>
      )}

      {/* Front/back matter */}
      <MatterPanel slug={slug} title="Ảnh trang đầu số (chèn sau bìa EPUB)" kind="front"
        items={layout.frontMatter} uploading={uploadingMatter === 'front'}
        onUpload={(f) => uploadMatter('front', f)} onRemove={(i) => removeMatter('front', i)} />

      {/* Articles */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-[#1E3924] dark:text-emerald-100">Danh sách bài ({data.articles.length})</h2>
        {data.articles.map((a) => (
          <ArticleEditor
            key={a.id}
            issueId={data.issue.id}
            slug={slug}
            article={a}
            sections={data.sections}
            images={layout.articles[a.slug]?.images ?? []}
            duplicate={dupByArticle.get(a.id)}
            onImagesChange={onArticleImagesChange}
          />
        ))}
      </div>

      <MatterPanel slug={slug} title="Ảnh trang cuối số (chèn cuối EPUB)" kind="back"
        items={layout.backMatter} uploading={uploadingMatter === 'back'}
        onUpload={(f) => uploadMatter('back', f)} onRemove={(i) => removeMatter('back', i)} />

      <p className="text-xs text-muted-foreground">
        Ghi chú: mọi thay đổi ảnh (bật/tắt, chú thích, đầu/cuối số) được lưu khi bấm "Lưu &amp; dựng lại" hoặc "Xuất bản".
      </p>
    </div>
  )
}

function MatterPanel({
  slug, title, kind, items, uploading, onUpload, onRemove,
}: {
  slug: string; title: string; kind: 'front' | 'back'; items: MatterImage[]; uploading: boolean
  onUpload: (files: FileList | null) => void; onRemove: (idx: number) => void
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span>{title}</span>
          <label className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-[#1E3924] hover:underline dark:text-emerald-300">
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />} Tải ảnh
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onUpload(e.target.files)} />
          </label>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0
          ? <p className="text-xs text-muted-foreground">Chưa có ảnh {kind === 'front' ? 'đầu' : 'cuối'} số.</p>
          : (
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {items.map((m, i) => (
                <div key={m.file} className="relative rounded-md border p-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getImageUrl(`/data/issues/${slug}/${m.file}`)} alt="" className="h-28 w-full rounded object-contain bg-muted" />
                  <button onClick={() => onRemove(i)} className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
      </CardContent>
    </Card>
  )
}
