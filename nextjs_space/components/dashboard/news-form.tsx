"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowLeft, Save, Send, Eye, Loader2, RotateCcw, Link2, Star,
  FileEdit, CheckCircle2, CalendarClock, Globe, AlertCircle,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ModernEditor } from '@/components/modern-editor'
import { NewsTagInput } from '@/components/dashboard/news-tag-input'
import { NewsCoverField } from '@/components/dashboard/news-cover-field'
import { NewsPreviewDialog } from '@/components/dashboard/news-preview-dialog'
import {
  NEWS_CATEGORIES, SEO_LIMITS, countWords, estimateReadingTime, previewNewsSlug,
} from '@/lib/news-constants'
import { cn } from '@/lib/utils'

const TAG_SUGGESTIONS = [
  'nghệ thuật quân sự', 'chiến lược', 'hội thảo', 'nghiên cứu',
  'Học viện Quốc phòng', 'quốc tế', 'đào tạo', 'lịch sử quân sự',
]

export interface NewsFormInitialData {
  id?: string
  title?: string
  titleEn?: string | null
  summary?: string | null
  summaryEn?: string | null
  content?: string
  contentEn?: string | null
  coverImage?: string | null
  coverImageSigned?: string | null
  category?: string | null
  tags?: string[]
  slug?: string
  isPublished?: boolean
  isFeatured?: boolean
  publishedAt?: string | null
  views?: number
  updatedAt?: string | null
  author?: { fullName?: string | null } | null
}

interface NewsFormProps {
  mode: 'create' | 'edit'
  newsId?: string
  initialData?: NewsFormInitialData
  defaultCategory?: string
}

interface NewsFormState {
  title: string
  titleEn: string
  summary: string
  summaryEn: string
  content: string
  contentEn: string
  coverImage: string
  category: string
  tags: string[]
  isPublished: boolean
  isFeatured: boolean
  publishedAt: string
}

function buildInitialState(initial?: NewsFormInitialData, defaultCategory?: string): NewsFormState {
  return {
    title: initial?.title ?? '',
    titleEn: initial?.titleEn ?? '',
    summary: initial?.summary ?? '',
    summaryEn: initial?.summaryEn ?? '',
    content: initial?.content ?? '',
    contentEn: initial?.contentEn ?? '',
    coverImage: initial?.coverImage ?? '',
    category: initial?.category ?? defaultCategory ?? '',
    tags: initial?.tags ?? [],
    isPublished: initial?.isPublished ?? false,
    isFeatured: initial?.isFeatured ?? false,
    publishedAt: initial?.publishedAt ? new Date(initial.publishedAt).toISOString().slice(0, 16) : '',
  }
}

export function NewsForm({ mode, newsId, initialData, defaultCategory }: NewsFormProps) {
  const router = useRouter()

  const [form, setForm] = useState<NewsFormState>(() => buildInitialState(initialData, defaultCategory))
  const [slug, setSlug] = useState(initialData?.slug ?? '')
  // Ở chế độ sửa, giữ và hiển thị slug đã lưu; chế độ tạo thì tự suy từ tiêu đề
  const [slugTouched, setSlugTouched] = useState(mode === 'edit' && Boolean(initialData?.slug))
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showErrors, setShowErrors] = useState(false)

  // Snapshot ban đầu để phát hiện thay đổi chưa lưu
  const initialSnapshot = useRef(JSON.stringify(buildInitialState(initialData, defaultCategory)))
  const initialSlug = useRef(initialData?.slug ?? '')
  const justSaved = useRef(false)

  const update = useCallback(<K extends keyof NewsFormState>(field: K, value: NewsFormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }, [])

  // Slug hiển thị: tự suy từ tiêu đề cho tới khi người dùng tự sửa
  const effectiveSlug = slugTouched ? slug : previewNewsSlug(form.title)

  const isDirty = useMemo(
    () => JSON.stringify(form) !== initialSnapshot.current || effectiveSlug !== initialSlug.current,
    [form, effectiveSlug],
  )

  const wordCount = useMemo(() => countWords(form.content), [form.content])
  const readTime = useMemo(() => estimateReadingTime(form.content), [form.content])

  const titleError = showErrors && !form.title.trim()
  const contentError = showErrors && countWords(form.content) === 0

  // ── Cảnh báo rời trang khi còn thay đổi chưa lưu ───────────────────────────
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty && !justSaved.current) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  const buildPayload = (overridePublished?: boolean) => {
    const isPublished = overridePublished ?? form.isPublished
    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      titleEn: form.titleEn.trim() || null,
      summary: form.summary.trim() || null,
      summaryEn: form.summaryEn.trim() || null,
      content: form.content,
      contentEn: form.contentEn || null,
      coverImage: form.coverImage || null,
      category: form.category || null,
      tags: form.tags,
      isPublished,
      isFeatured: form.isFeatured,
      publishedAt: isPublished
        ? form.publishedAt
          ? new Date(form.publishedAt).toISOString()
          : new Date().toISOString()
        : null,
    }
    // Chỉ gửi slug khi người dùng tự đặt; nếu không, để server tự sinh từ tiêu đề
    if (slugTouched && effectiveSlug) payload.slug = effectiveSlug
    return payload
  }

  const handleSave = async (overridePublished?: boolean) => {
    if (!form.title.trim() || countWords(form.content) === 0) {
      setShowErrors(true)
      toast.error('Vui lòng nhập tiêu đề và nội dung')
      return
    }

    try {
      setSaving(true)
      const payload = buildPayload(overridePublished)
      if (overridePublished !== undefined) update('isPublished', overridePublished)

      const res = await fetch(mode === 'create' ? '/api/news' : `/api/news/${newsId}`, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        justSaved.current = true
        toast.success(
          mode === 'create'
            ? payload.isPublished ? 'Đã tạo và xuất bản tin tức' : 'Đã lưu bản nháp'
            : 'Đã cập nhật tin tức',
        )
        router.push('/dashboard/admin/news')
        router.refresh()
      } else {
        toast.error(data.message || data.error || 'Lỗi khi lưu tin tức')
      }
    } catch {
      toast.error('Lỗi kết nối khi lưu tin tức')
    } finally {
      setSaving(false)
    }
  }

  // Ctrl/Cmd + S để lưu nhanh
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        if (!saving) handleSave()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saving, form, slug, slugTouched])

  const handleBack = () => {
    if (isDirty && !window.confirm('Bạn có thay đổi chưa lưu. Rời khỏi trang?')) return
    router.push('/dashboard/admin/news')
  }

  const scheduledFuture =
    form.isPublished && form.publishedAt && new Date(form.publishedAt).getTime() > Date.now()

  const statusMeta = !form.isPublished
    ? { label: 'Bản nháp', icon: FileEdit, cls: 'text-amber-700 bg-amber-50 dark:bg-amber-900/30' }
    : scheduledFuture
      ? { label: 'Đã lên lịch', icon: CalendarClock, cls: 'text-sky-700 bg-sky-50 dark:bg-sky-900/30' }
      : { label: 'Sẽ xuất bản', icon: CheckCircle2, cls: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30' }

  const primaryLabel =
    mode === 'create'
      ? form.isPublished ? 'Xuất bản tin' : 'Lưu bản nháp'
      : 'Lưu thay đổi'

  return (
    <div className="space-y-5 pb-24">
      {/* ── Sticky action bar ─────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 -mx-4 border-b border-gray-100 bg-white/90 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-950/90 md:-mx-6 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Button>
            <div>
              <h1 className="text-lg font-bold leading-tight text-gray-900 dark:text-gray-100">
                {mode === 'create' ? 'Tạo tin tức mới' : 'Chỉnh sửa tin tức'}
              </h1>
              <p className="flex items-center gap-2 text-xs text-gray-400">
                <span>{wordCount.toLocaleString()} từ · {readTime} phút đọc</span>
                {isDirty && (
                  <span className="inline-flex items-center gap-1 text-amber-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Chưa lưu
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowPreview(true)}>
              <Eye className="mr-2 h-4 w-4" />
              Xem trước
            </Button>
            {/* Tạo nhanh: nút phụ để xuất bản ngay khi đang ở chế độ nháp */}
            {mode === 'create' && !form.isPublished && (
              <Button
                variant="outline"
                size="sm"
                disabled={saving}
                onClick={() => handleSave(true)}
              >
                <Send className="mr-2 h-4 w-4" />
                Xuất bản ngay
              </Button>
            )}
            <Button
              size="sm"
              className="bg-[#1E3924] text-white hover:bg-[#295232]"
              disabled={saving}
              onClick={() => handleSave()}
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {primaryLabel}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Cột chính ───────────────────────────────────────────────────── */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardContent className="space-y-5 pt-6">
              {/* Tiêu đề */}
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="title">
                    Tiêu đề <span className="text-red-500">*</span>
                  </Label>
                  <span className={cn(
                    'text-[11px]',
                    form.title.length > SEO_LIMITS.titleMax ? 'text-red-500'
                      : form.title.length > SEO_LIMITS.titleIdeal ? 'text-amber-500' : 'text-gray-400',
                  )}>
                    {form.title.length}/{SEO_LIMITS.titleIdeal}
                  </span>
                </div>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => update('title', e.target.value)}
                  placeholder="Nhập tiêu đề tin tức..."
                  className={cn('mt-1 text-base font-medium', titleError && 'border-red-400 focus-visible:ring-red-400')}
                />
                {titleError && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
                    <AlertCircle className="h-3 w-3" /> Tiêu đề là bắt buộc
                  </p>
                )}
              </div>

              {/* Slug / đường dẫn */}
              <div>
                <Label htmlFor="slug" className="flex items-center gap-1.5">
                  <Link2 className="h-3.5 w-3.5 text-gray-400" /> Đường dẫn (slug)
                </Label>
                <div className="mt-1 flex items-center gap-2">
                  <span className="hidden text-xs text-gray-400 sm:inline">/news/</span>
                  <Input
                    id="slug"
                    value={effectiveSlug}
                    onChange={(e) => {
                      setSlugTouched(true)
                      setSlug(e.target.value)
                    }}
                    onBlur={() => slugTouched && setSlug(previewNewsSlug(slug))}
                    placeholder="duong-dan-tin-tuc"
                    className="font-mono text-sm"
                  />
                  {slugTouched && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-gray-400"
                      title="Tự động theo tiêu đề"
                      onClick={() => {
                        setSlugTouched(false)
                        setSlug('')
                      }}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-gray-400">
                  Để trống sẽ tự sinh từ tiêu đề. Đường dẫn phải là duy nhất.
                </p>
              </div>

              {/* Tóm tắt */}
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="summary">Tóm tắt</Label>
                  <span className={cn(
                    'text-[11px]',
                    form.summary.length > SEO_LIMITS.summaryMax ? 'text-red-500'
                      : form.summary.length > SEO_LIMITS.summaryIdeal ? 'text-amber-500' : 'text-gray-400',
                  )}>
                    {form.summary.length}/{SEO_LIMITS.summaryIdeal}
                  </span>
                </div>
                <Textarea
                  id="summary"
                  value={form.summary}
                  onChange={(e) => update('summary', e.target.value)}
                  placeholder="Mô tả ngắn gọn nội dung tin tức (hiển thị ở danh sách & chia sẻ mạng xã hội)..."
                  rows={3}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Nội dung VI / EN */}
          <Card>
            <CardContent className="pt-6">
              <Tabs defaultValue="vi">
                <TabsList className="mb-4">
                  <TabsTrigger value="vi">Nội dung (Tiếng Việt)</TabsTrigger>
                  <TabsTrigger value="en" className="gap-1.5">
                    <Globe className="h-3.5 w-3.5" /> Bản tiếng Anh
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="vi" className="space-y-2">
                  <Label className="flex items-center justify-between">
                    <span>Nội dung <span className="text-red-500">*</span></span>
                  </Label>
                  <ModernEditor
                    value={form.content}
                    onChange={(v) => update('content', v)}
                    placeholder="Gõ '/' để xem lệnh nhanh... Bắt đầu viết nội dung tin tức"
                    height="520px"
                  />
                  {contentError && (
                    <p className="flex items-center gap-1 text-xs text-red-500">
                      <AlertCircle className="h-3 w-3" /> Nội dung là bắt buộc
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="en" className="space-y-4">
                  <div>
                    <Label htmlFor="titleEn">English title</Label>
                    <Input
                      id="titleEn"
                      value={form.titleEn}
                      onChange={(e) => update('titleEn', e.target.value)}
                      placeholder="Enter English title..."
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="summaryEn">English summary</Label>
                    <Textarea
                      id="summaryEn"
                      value={form.summaryEn}
                      onChange={(e) => update('summaryEn', e.target.value)}
                      placeholder="Enter a brief summary..."
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>English content</Label>
                    <ModernEditor
                      value={form.contentEn}
                      onChange={(v) => update('contentEn', v)}
                      placeholder="Type '/' for quick commands... Start writing English content"
                      height="420px"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Xuất bản */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Xuất bản</CardTitle>
                <span className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
                  statusMeta.cls,
                )}>
                  <statusMeta.icon className="h-3 w-3" />
                  {statusMeta.label}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isPublished" className="cursor-pointer">Xuất bản công khai</Label>
                  <p className="text-[11px] text-gray-400">Hiển thị tin trên trang công khai</p>
                </div>
                <Switch
                  id="isPublished"
                  checked={form.isPublished}
                  onCheckedChange={(v) => update('isPublished', v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isFeatured" className="flex cursor-pointer items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 text-[#D4A843]" /> Tin nổi bật
                  </Label>
                  <p className="text-[11px] text-gray-400">Ưu tiên hiển thị ở vị trí nổi bật</p>
                </div>
                <Switch
                  id="isFeatured"
                  checked={form.isFeatured}
                  onCheckedChange={(v) => update('isFeatured', v)}
                />
              </div>

              {form.isPublished && (
                <div>
                  <Label htmlFor="publishedAt" className="text-sm">Thời gian xuất bản</Label>
                  <Input
                    id="publishedAt"
                    type="datetime-local"
                    value={form.publishedAt}
                    onChange={(e) => update('publishedAt', e.target.value)}
                    className="mt-1"
                  />
                  <p className="mt-1 text-[11px] text-gray-400">
                    Bỏ trống = xuất bản ngay khi lưu.
                  </p>
                </div>
              )}

              <Separator />

              <Button
                className="w-full bg-[#1E3924] text-white hover:bg-[#295232]"
                disabled={saving}
                onClick={() => handleSave()}
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {primaryLabel}
              </Button>
            </CardContent>
          </Card>

          {/* Ảnh đại diện */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Ảnh đại diện</CardTitle>
            </CardHeader>
            <CardContent>
              <NewsCoverField
                value={form.coverImage}
                onChange={(v) => update('coverImage', v)}
                previewUrl={form.coverImage === initialData?.coverImage ? initialData?.coverImageSigned : null}
              />
            </CardContent>
          </Card>

          {/* Phân loại */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Phân loại</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="category">Danh mục</Label>
                <Select value={form.category} onValueChange={(v) => update('category', v)}>
                  <SelectTrigger id="category" className="mt-1">
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {NEWS_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div>
                          <div>{cat.label}</div>
                          <div className="text-[11px] text-gray-400">{cat.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Thẻ tag</Label>
                <div className="mt-1">
                  <NewsTagInput
                    value={form.tags}
                    onChange={(t) => update('tags', t)}
                    suggestions={TAG_SUGGESTIONS}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SEO / chia sẻ preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Xem trước tìm kiếm & chia sẻ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-gray-100 p-3 dark:border-gray-800">
                <p className="truncate text-xs text-emerald-700 dark:text-emerald-400">
                  tapchintqsvn · /news/{effectiveSlug || 'duong-dan'}
                </p>
                <p className="mt-0.5 line-clamp-2 text-sm font-medium text-[#1a0dab] dark:text-sky-400">
                  {form.title || 'Tiêu đề tin tức sẽ hiển thị ở đây'}
                </p>
                <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">
                  {form.summary || 'Phần tóm tắt sẽ hiển thị tại đây giúp người đọc và công cụ tìm kiếm hiểu nội dung tin.'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Thông tin (chỉ ở chế độ sửa) */}
          {mode === 'edit' && initialData && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Thông tin</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 text-xs text-gray-500">
                {initialData.author?.fullName && <p>Tác giả: {initialData.author.fullName}</p>}
                <p>Lượt xem: {(initialData.views ?? 0).toLocaleString()}</p>
                {initialData.updatedAt && (
                  <p>Cập nhật: {new Date(initialData.updatedAt).toLocaleString('vi-VN')}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <NewsPreviewDialog
        open={showPreview}
        onClose={() => setShowPreview(false)}
        data={{
          title: form.title,
          titleEn: form.titleEn,
          summary: form.summary,
          summaryEn: form.summaryEn,
          content: form.content,
          contentEn: form.contentEn,
          coverImage: form.coverImage,
          coverPreviewUrl: form.coverImage === initialData?.coverImage ? initialData?.coverImageSigned : null,
          category: form.category,
          tags: form.tags,
          isFeatured: form.isFeatured,
        }}
      />
    </div>
  )
}
