'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft, ExternalLink, CheckCircle2, XCircle, Download,
  Loader2, Save, Globe, Clock, AlertCircle, Eye, EyeOff,
  Image as ImageIcon, Video, User, Calendar
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import Link from 'next/link'

// ─── Types ───────────────────────────────────────────────────────────────────

interface CrawledContent {
  id: string
  sourceUrl: string
  rawTitle: string
  rawContent: string
  rawSummary?: string
  rawAuthor?: string
  rawDate?: string
  rawImageUrls: string[]
  rawVideoUrls: string[]
  editedTitle?: string
  editedContent?: string
  editedSummary?: string
  coverImageS3?: string
  imagesS3: string[]
  category?: string
  tags: string[]
  status: string
  reviewNote?: string
  importedNewsId?: string
  importedNews?: { id: string; slug: string; title: string; isPublished: boolean }
  webSource?: { id: string; name: string; url: string }
  crawlJob?: { id: string; status: string; startedAt?: string }
  reviewer?: { fullName: string }
  importer?: { fullName: string }
  reviewedAt?: string
  importedAt?: string
  createdAt: string
}

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING:   { label: 'Chờ duyệt',  color: 'bg-amber-100 text-amber-800 border-amber-200' },
  APPROVED:  { label: 'Đã duyệt',   color: 'bg-blue-100 text-blue-700 border-blue-200' },
  IMPORTED:  { label: 'Đã import',  color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  REJECTED:  { label: 'Từ chối',    color: 'bg-red-100 text-red-700 border-red-200' },
  DUPLICATE: { label: 'Trùng lặp',  color: 'bg-purple-100 text-purple-700 border-purple-200' },
}

const NEWS_CATEGORIES = [
  { value: 'announcement', label: 'Thông báo' },
  { value: 'event', label: 'Sự kiện' },
  { value: 'call_for_paper', label: 'Thông báo bài' },
  { value: 'policy', label: 'Chính sách' },
  { value: 'research_news', label: 'Tin nghiên cứu' },
  { value: 'interview', label: 'Phỏng vấn' },
  { value: 'award', label: 'Giải thưởng' },
  { value: 'conference', label: 'Hội nghị' },
]

// ─── Reject Dialog ────────────────────────────────────────────────────────────

function RejectDialog({ open, onClose, onReject }: {
  open: boolean
  onClose: () => void
  onReject: (note: string) => Promise<void>
}) {
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    if (!note.trim()) { toast.error('Vui lòng nhập lý do từ chối'); return }
    setLoading(true)
    await onReject(note)
    setLoading(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-700">
            <XCircle className="h-5 w-5" /> Từ chối bài viết
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Label>Lý do từ chối <span className="text-red-500">*</span></Label>
          <Textarea
            placeholder="Nêu rõ lý do từ chối bài này..."
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Hủy</Button>
          <Button className="bg-red-600 hover:bg-red-700" onClick={handleConfirm} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Xác nhận từ chối
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Import Dialog ────────────────────────────────────────────────────────────

function ImportDialog({ open, onClose, onImport }: {
  open: boolean
  onClose: () => void
  onImport: (opts: { isPublished: boolean; publishedAt?: string }) => Promise<void>
}) {
  const [publishNow, setPublishNow] = useState(false)
  const [publishedAt, setPublishedAt] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    await onImport({
      isPublished: publishNow,
      publishedAt: publishNow && publishedAt ? publishedAt : undefined,
    })
    setLoading(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-700">
            <Download className="h-5 w-5" /> Import vào News
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-slate-600">
            Bài viết sẽ được tạo trong module News. Bạn có thể chỉnh sửa thêm sau khi import.
          </p>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <Switch checked={publishNow} onCheckedChange={setPublishNow} />
            <div>
              <p className="text-sm font-medium">Xuất bản ngay sau khi import</p>
              <p className="text-xs text-slate-400">Nếu tắt, bài sẽ ở trạng thái nháp</p>
            </div>
          </div>
          {publishNow && (
            <div className="space-y-1">
              <Label className="text-xs">Ngày xuất bản (tùy chọn)</Label>
              <Input type="datetime-local" value={publishedAt} onChange={e => setPublishedAt(e.target.value)} />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Hủy</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleConfirm} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Download className="h-4 w-4 mr-1" />}
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function CrawledContentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [content, setContent] = useState<CrawledContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)

  // Edit state
  const [editedTitle, setEditedTitle] = useState('')
  const [editedSummary, setEditedSummary] = useState('')
  const [editedContent, setEditedContent] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState('')
  const [safeContent, setSafeContent] = useState('')

  const fetchContent = useCallback(async () => {
    try {
      const res = await fetch(`/api/crawled-content/${id}`)
      const data = await res.json()
      if (data.success) {
        const c = data.data
        setContent(c)
        setEditedTitle(c.editedTitle || c.rawTitle)
        setEditedSummary(c.editedSummary || c.rawSummary || '')
        setEditedContent(c.editedContent || c.rawContent)
        setCategory(c.category || '')
        setTags((c.tags || []).join(', '))
      }
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchContent() }, [fetchContent])

  // Sanitize HTML phía client bằng DOMPurify (chỉ chạy trong browser)
  useEffect(() => {
    const raw = editedContent || content?.rawContent || ''
    if (!raw) { setSafeContent(''); return }
    import('dompurify').then(({ default: DOMPurify }) => {
      const sanitized = DOMPurify.sanitize(raw, {
        ADD_TAGS: ['iframe', 'video', 'source', 'figure', 'figcaption', 'picture'],
        ADD_ATTR: [
          'allowfullscreen', 'frameborder', 'controls', 'loading',
          'referrerpolicy', 'crossorigin',
          'style', 'class', 'width', 'height', 'align',
          'srcset', 'sizes', 'alt', 'title',
        ],
        FORCE_BODY: true,
      })
      // Thêm referrerpolicy="no-referrer" vào mọi <img> để tránh hotlink protection
      const withNoreferrer = sanitized.replace(
        /<img(\s)/gi,
        '<img referrerpolicy="no-referrer" loading="lazy"$1'
      )
      setSafeContent(withNoreferrer)
    }).catch(() => {
      setSafeContent(raw.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ''))
    })
  }, [editedContent, content?.rawContent])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/crawled-content/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          editedTitle,
          editedSummary,
          editedContent,
          category: category || undefined,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      })
      if (!res.ok) throw new Error('Lỗi lưu')
      toast.success('Đã lưu chỉnh sửa')
      fetchContent()
    } catch {
      toast.error('Lỗi khi lưu')
    } finally {
      setSaving(false)
    }
  }

  async function handleApprove() {
    try {
      const res = await fetch(`/api/crawled-content/${id}/approve`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}'
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error)
      }
      toast.success('Đã duyệt bài viết')
      fetchContent()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Lỗi')
    }
  }

  async function handleReject(note: string) {
    const res = await fetch(`/api/crawled-content/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewNote: note }),
    })
    if (!res.ok) {
      const d = await res.json()
      toast.error(d.error || 'Lỗi từ chối')
      return
    }
    toast.success('Đã từ chối bài viết')
    fetchContent()
  }

  async function handleImport(opts: { isPublished: boolean; publishedAt?: string }) {
    const res = await fetch(`/api/crawled-content/${id}/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ overrides: opts }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error || 'Lỗi import')
      return
    }
    toast.success('Import thành công! Bài đã được tạo trong News.')
    fetchContent()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!content) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-slate-400">
        <AlertCircle className="h-12 w-12 mb-3 opacity-30" />
        <p>Không tìm thấy bài viết</p>
        <Link href="/dashboard/admin/crawled-content">
          <Button variant="outline" size="sm" className="mt-3">Quay lại</Button>
        </Link>
      </div>
    )
  }

  const statusCfg = STATUS_CONFIG[content.status] || { label: content.status, color: 'bg-slate-100 text-slate-600' }
  const canEdit = content.status !== 'IMPORTED'
  const canApprove = ['PENDING', 'DUPLICATE', 'REJECTED'].includes(content.status)
  const canReject = ['PENDING', 'APPROVED', 'DUPLICATE'].includes(content.status)
  const canImport = content.status === 'APPROVED'


  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          {/* Left */}
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/dashboard/admin/crawled-content">
              <Button size="sm" variant="ghost" className="gap-1 text-slate-600 shrink-0">
                <ArrowLeft className="h-4 w-4" /> Quay lại
              </Button>
            </Link>
            <span className="text-slate-300">|</span>
            <p className="text-sm font-medium text-slate-700 truncate max-w-80">
              {content.editedTitle || content.rawTitle}
            </p>
            <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full border shrink-0 ${statusCfg.color}`}>
              {statusCfg.label}
            </span>
          </div>

          {/* Right — Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {canApprove && (
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 gap-1.5" onClick={handleApprove}>
                <CheckCircle2 className="h-4 w-4" /> Duyệt
              </Button>
            )}
            {canReject && (
              <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 gap-1.5" onClick={() => setShowRejectDialog(true)}>
                <XCircle className="h-4 w-4" /> Từ chối
              </Button>
            )}
            {canImport && (
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 gap-1.5" onClick={() => setShowImportDialog(true)}>
                <Download className="h-4 w-4" /> Import vào News
              </Button>
            )}
            {content.status === 'IMPORTED' && content.importedNews && (
              <Link href={`/dashboard/admin/news`}>
                <Button size="sm" variant="outline" className="gap-1.5 text-emerald-700 border-emerald-200">
                  <ExternalLink className="h-4 w-4" /> Xem bài đã import
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Metadata bar */}
        <div className="max-w-7xl mx-auto px-6 pb-2 flex items-center gap-4 text-xs text-slate-500">
          {content.webSource && (
            <span className="flex items-center gap-1">
              <Globe className="h-3 w-3" />
              {content.webSource.name}
            </span>
          )}
          <a href={content.sourceUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-indigo-500 hover:underline">
            <ExternalLink className="h-3 w-3" /> Xem bài gốc
          </a>
          {content.rawAuthor && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" /> {content.rawAuthor}
            </span>
          )}
          {content.rawDate && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(content.rawDate).toLocaleDateString('vi-VN')}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Crawl: {new Date(content.createdAt).toLocaleString('vi-VN')}
          </span>
          {content.rawImageUrls.length > 0 && (
            <span className="flex items-center gap-1">
              <ImageIcon className="h-3 w-3" /> {content.rawImageUrls.length} ảnh
            </span>
          )}
          {content.rawVideoUrls.length > 0 && (
            <span className="flex items-center gap-1">
              <Video className="h-3 w-3" /> {content.rawVideoUrls.length} video
            </span>
          )}
        </div>
      </div>

      {/* Body — Split view */}
      <div className="max-w-7xl mx-auto px-6 py-5 flex gap-5">
        {/* Left — Preview */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Preview bài viết</h2>
            <Button
              size="sm" variant="ghost"
              className="gap-1.5 text-slate-500"
              onClick={() => setShowPreview(p => !p)}
            >
              {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showPreview ? 'Ẩn preview' : 'Hiện preview'}
            </Button>
          </div>

          {showPreview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-xl shadow-sm border border-slate-100 p-6"
            >
              {/* Cover image */}
              {(content.coverImageS3 || content.rawImageUrls[0]) && (
                <div className="mb-5 rounded-lg overflow-hidden max-h-72">
                  <img
                    src={content.coverImageS3 ? `/api/files/${content.coverImageS3}` : content.rawImageUrls[0]}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <h1 className="text-2xl font-bold text-slate-900 mb-3 leading-tight">
                {editedTitle || content.rawTitle}
              </h1>

              {(editedSummary || content.rawSummary) && (
                <p className="text-base text-slate-600 italic border-l-4 border-indigo-200 pl-3 mb-4">
                  {editedSummary || content.rawSummary}
                </p>
              )}

              <div
                className="prose prose-slate max-w-none prose-img:rounded-lg prose-a:text-indigo-600 text-sm"
                dangerouslySetInnerHTML={{ __html: safeContent }}
              />
            </motion.div>
          )}

          {/* Videos */}
          {content.rawVideoUrls.length > 0 && (
            <div className="mt-4 bg-white rounded-xl shadow-sm border border-slate-100 p-4">
              <h3 className="text-sm font-semibold text-slate-600 mb-3 flex items-center gap-1.5">
                <Video className="h-4 w-4" /> Video ({content.rawVideoUrls.length})
              </h3>
              <div className="space-y-2">
                {content.rawVideoUrls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-indigo-500 hover:underline flex items-center gap-1 truncate">
                    <ExternalLink className="h-3 w-3 shrink-0" /> {url}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right — Edit Panel */}
        <div className="w-80 shrink-0 space-y-4">
          <div className="sticky top-28 space-y-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-4">
                <h3 className="text-sm font-semibold text-slate-700">Chỉnh sửa nội dung</h3>

                <div className="space-y-1">
                  <Label className="text-xs">Tiêu đề</Label>
                  <Input
                    value={editedTitle}
                    onChange={e => setEditedTitle(e.target.value)}
                    disabled={!canEdit}
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Tóm tắt</Label>
                  <Textarea
                    value={editedSummary}
                    onChange={e => setEditedSummary(e.target.value)}
                    disabled={!canEdit}
                    rows={3}
                    className="text-sm resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Chuyên mục</Label>
                  <Select
                    value={category || '__none__'}
                    onValueChange={v => setCategory(v === '__none__' ? '' : v)}
                    disabled={!canEdit}
                  >
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Chọn chuyên mục..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Không xác định</SelectItem>
                      {NEWS_CATEGORIES.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Tags (phân cách bằng dấu phẩy)</Label>
                  <Input
                    value={tags}
                    onChange={e => setTags(e.target.value)}
                    disabled={!canEdit}
                    placeholder="tag1, tag2, tag3"
                    className="text-sm"
                  />
                </div>

                {canEdit && (
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Lưu chỉnh sửa
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Cover images */}
            {content.rawImageUrls.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                    Ảnh trong bài ({content.rawImageUrls.length})
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {content.rawImageUrls.slice(0, 9).map((url, i) => (
                      <div key={i} className="aspect-square rounded-lg overflow-hidden bg-slate-100">
                        <img
                          src={url}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Review info */}
            {(content.reviewNote || content.reviewer) && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 space-y-2">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Thông tin review</h3>
                  {content.reviewer && (
                    <p className="text-xs text-slate-600">
                      <span className="text-slate-400">Reviewer: </span>{content.reviewer.fullName}
                    </p>
                  )}
                  {content.reviewedAt && (
                    <p className="text-xs text-slate-600">
                      <span className="text-slate-400">Thời gian: </span>
                      {new Date(content.reviewedAt).toLocaleString('vi-VN')}
                    </p>
                  )}
                  {content.reviewNote && (
                    <div className="bg-red-50 border border-red-100 rounded-lg p-2">
                      <p className="text-xs text-red-700">{content.reviewNote}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Imported info */}
            {content.importedNews && (
              <Card className="border-0 shadow-sm bg-emerald-50">
                <CardContent className="p-4 space-y-2">
                  <h3 className="text-xs font-semibold text-emerald-600 uppercase tracking-wide flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Đã import
                  </h3>
                  <p className="text-xs text-slate-600">
                    Slug: <code className="bg-white px-1 rounded">{content.importedNews.slug}</code>
                  </p>
                  <p className="text-xs text-slate-500">
                    {content.importedNews.isPublished ? '✅ Đã xuất bản' : '📝 Đang ở dạng nháp'}
                  </p>
                  {content.importedAt && (
                    <p className="text-xs text-slate-400">
                      {new Date(content.importedAt).toLocaleString('vi-VN')}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <RejectDialog
        open={showRejectDialog}
        onClose={() => setShowRejectDialog(false)}
        onReject={handleReject}
      />
      <ImportDialog
        open={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onImport={handleImport}
      />
    </div>
  )
}
