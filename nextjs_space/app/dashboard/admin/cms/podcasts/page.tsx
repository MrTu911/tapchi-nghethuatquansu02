'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Plus,
  Pencil,
  Trash2,
  Play,
  Headphones,
  Star,
  Radio,
  Upload,
  Image as ImageIcon,
  Music,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

interface Podcast {
  id: string
  title: string
  titleEn: string | null
  description: string | null
  audioPath: string | null
  audioUrl: string | null
  duration: number | null
  fileSize: number | null
  mimeType: string | null
  coverImagePath: string | null
  coverImageUrl: string | null
  host: string | null
  episodeNumber: number | null
  seasonNumber: number | null
  transcript: string | null
  category: string | null
  tags: string[]
  isFeatured: boolean
  isActive: boolean
  displayOrder: number
  plays: number
  publishedAt: string | null
  createdAt: string
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--:--'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const CATEGORIES = ['Khoa học', 'Công nghệ', 'Giáo dục', 'Văn hóa', 'Thể thao', 'Sức khỏe', 'Kinh tế', 'Khác']

export default function PodcastManagementPage() {
  const [podcasts, setPodcasts] = useState<Podcast[]>([])
  const [loading, setLoading] = useState(true)
  const [totalPlays, setTotalPlays] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [editingPodcast, setEditingPodcast] = useState<Podcast | null>(null)
  const [deletingPodcast, setDeletingPodcast] = useState<Podcast | null>(null)
  const [previewPodcast, setPreviewPodcast] = useState<Podcast | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formTitleEn, setFormTitleEn] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formHost, setFormHost] = useState('')
  const [formEpisode, setFormEpisode] = useState('')
  const [formSeason, setFormSeason] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formTags, setFormTags] = useState('')
  const [formFeatured, setFormFeatured] = useState(false)
  const [formActive, setFormActive] = useState(true)
  const [formPublishedAt, setFormPublishedAt] = useState('')
  const [formDisplayOrder, setFormDisplayOrder] = useState('0')

  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null)

  const audioInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  async function fetchPodcasts(p = 1) {
    setLoading(true)
    try {
      const res = await fetch(`/api/podcasts?page=${p}&limit=20&adminView=true`)
      const data = await res.json()
      if (data.success) {
        setPodcasts(data.data.podcasts)
        setTotalPages(data.data.pagination.totalPages)
        setTotal(data.data.pagination.total)
        // Tổng lượt nghe: lấy từ tất cả (chỉ chính xác khi 1 trang, cộng dồn nếu phân trang)
        setTotalPlays(prev =>
          p === 1
            ? data.data.podcasts.reduce((sum: number, pod: Podcast) => sum + pod.plays, 0)
            : prev + data.data.podcasts.reduce((sum: number, pod: Podcast) => sum + pod.plays, 0)
        )
      }
    } catch {
      toast.error('Không thể tải danh sách podcast')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPodcasts(page)
  }, [page])

  function resetForm() {
    setFormTitle('')
    setFormTitleEn('')
    setFormDescription('')
    setFormHost('')
    setFormEpisode('')
    setFormSeason('')
    setFormCategory('')
    setFormTags('')
    setFormFeatured(false)
    setFormActive(true)
    setFormPublishedAt('')
    setFormDisplayOrder('0')
    setAudioFile(null)
    setCoverFile(null)
    setCoverPreviewUrl(null)
  }

  function openEditDialog(podcast: Podcast) {
    setEditingPodcast(podcast)
    setFormTitle(podcast.title)
    setFormTitleEn(podcast.titleEn || '')
    setFormDescription(podcast.description || '')
    setFormHost(podcast.host || '')
    setFormEpisode(podcast.episodeNumber?.toString() || '')
    setFormSeason(podcast.seasonNumber?.toString() || '')
    setFormCategory(podcast.category || '')
    setFormTags(podcast.tags.join(', '))
    setFormFeatured(podcast.isFeatured)
    setFormActive(podcast.isActive)
    setFormPublishedAt(podcast.publishedAt ? podcast.publishedAt.slice(0, 16) : '')
    setFormDisplayOrder(podcast.displayOrder.toString())
    setAudioFile(null)
    setCoverFile(null)
    setCoverPreviewUrl(podcast.coverImageUrl)
  }

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverFile(file)
    const url = URL.createObjectURL(file)
    setCoverPreviewUrl(url)
  }

  async function handleSubmit() {
    if (!formTitle.trim()) {
      toast.error('Vui lòng nhập tiêu đề')
      return
    }
    if (!editingPodcast && !audioFile) {
      toast.error('Vui lòng chọn file âm thanh')
      return
    }

    setSubmitting(true)
    const formData = new FormData()
    formData.append('title', formTitle.trim())
    if (formTitleEn) formData.append('titleEn', formTitleEn)
    if (formDescription) formData.append('description', formDescription)
    if (formHost) formData.append('host', formHost)
    if (formEpisode) formData.append('episodeNumber', formEpisode)
    if (formSeason) formData.append('seasonNumber', formSeason)
    if (formCategory) formData.append('category', formCategory)
    if (formTags) formData.append('tags', formTags)
    formData.append('isFeatured', String(formFeatured))
    formData.append('isActive', String(formActive))
    if (formPublishedAt) formData.append('publishedAt', new Date(formPublishedAt).toISOString())
    formData.append('displayOrder', formDisplayOrder)
    if (audioFile) formData.append('audioFile', audioFile)
    if (coverFile) formData.append('coverImageFile', coverFile)

    try {
      const url = editingPodcast ? `/api/podcasts/${editingPodcast.id}` : '/api/podcasts'
      const method = editingPodcast ? 'PUT' : 'POST'
      const res = await fetch(url, { method, body: formData })
      const data = await res.json()
      if (data.success) {
        toast.success(editingPodcast ? 'Đã cập nhật podcast' : 'Đã thêm podcast mới')
        setShowUploadDialog(false)
        setEditingPodcast(null)
        resetForm()
        fetchPodcasts(page)
      } else {
        toast.error(data.error || 'Thao tác thất bại')
      }
    } catch {
      toast.error('Lỗi kết nối')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deletingPodcast) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/podcasts/${deletingPodcast.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Đã xóa podcast')
        setDeletingPodcast(null)
        fetchPodcasts(page)
      } else {
        toast.error(data.error || 'Xóa thất bại')
      }
    } catch {
      toast.error('Lỗi kết nối')
    } finally {
      setDeleting(false)
    }
  }

  const activeCount = podcasts.filter(p => p.isActive).length
  const featuredCount = podcasts.filter(p => p.isFeatured).length

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Headphones className="h-6 w-6" />
            Quản lý Podcast
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Upload và quản lý các tập podcast của tạp chí</p>
        </div>
        <Button onClick={() => { resetForm(); setShowUploadDialog(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm Podcast
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{total}</div>
            <div className="text-sm text-muted-foreground">Tổng số tập</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
            <div className="text-sm text-muted-foreground">Đang phát</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-600">{featuredCount}</div>
            <div className="text-sm text-muted-foreground">Nổi bật</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{totalPlays.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Tổng lượt nghe</div>
          </CardContent>
        </Card>
      </div>

      {/* Podcast Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : podcasts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
          <Radio className="h-10 w-10 mb-3 opacity-30" />
          <p>Chưa có podcast nào. Thêm tập đầu tiên!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {podcasts.map(podcast => (
            <Card key={podcast.id} className="overflow-hidden">
              {/* Cover image */}
              <div className="relative aspect-square bg-muted">
                {podcast.coverImageUrl ? (
                  <img
                    src={podcast.coverImageUrl}
                    alt={podcast.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music className="h-12 w-12 text-muted-foreground/40" />
                  </div>
                )}
                <div className="absolute top-2 left-2 flex gap-1">
                  {!podcast.isActive && <Badge variant="secondary">Tắt</Badge>}
                  {podcast.isFeatured && (
                    <Badge className="bg-yellow-500 text-white">
                      <Star className="h-3 w-3 mr-1" />
                      Nổi bật
                    </Badge>
                  )}
                </div>
                <button
                  className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors group"
                  onClick={() => setPreviewPodcast(podcast)}
                >
                  <Play className="h-10 w-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>

              <CardContent className="p-3 space-y-1">
                <div className="font-medium text-sm line-clamp-2">{podcast.title}</div>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  {podcast.host && <div>Host: {podcast.host}</div>}
                  {(podcast.seasonNumber || podcast.episodeNumber) && (
                    <div>
                      {podcast.seasonNumber ? `S${podcast.seasonNumber} ` : ''}
                      {podcast.episodeNumber ? `E${podcast.episodeNumber}` : ''}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span>{formatDuration(podcast.duration)}</span>
                    <span>•</span>
                    <span>{podcast.plays.toLocaleString()} lượt nghe</span>
                  </div>
                </div>
                <div className="flex gap-1 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-7 text-xs"
                    onClick={() => openEditDialog(podcast)}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Sửa
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 w-7 p-0 text-destructive hover:bg-destructive hover:text-white"
                    onClick={() => setDeletingPodcast(podcast)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
            Trước
          </Button>
          <span className="flex items-center text-sm text-muted-foreground px-2">
            {page} / {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
            Sau
          </Button>
        </div>
      )}

      {/* Upload / Edit Dialog */}
      <Dialog
        open={showUploadDialog || editingPodcast !== null}
        onOpenChange={(open) => {
          if (!open) { setShowUploadDialog(false); setEditingPodcast(null); resetForm() }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPodcast ? 'Chỉnh sửa Podcast' : 'Thêm Podcast mới'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Audio file upload */}
            <div className="space-y-2">
              <Label>File âm thanh {!editingPodcast && <span className="text-destructive">*</span>}</Label>
              <div
                className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => audioInputRef.current?.click()}
              >
                {audioFile ? (
                  <div className="flex items-center gap-2 justify-center text-sm">
                    <Music className="h-4 w-4 text-primary" />
                    <span className="font-medium">{audioFile.name}</span>
                    <span className="text-muted-foreground">({formatFileSize(audioFile.size)})</span>
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm">
                    <Upload className="h-6 w-6 mx-auto mb-1" />
                    {editingPodcast ? 'Chọn file mới để thay thế (bỏ qua nếu không đổi)' : 'Kéo thả hoặc click để chọn file MP3, M4A, WAV (tối đa 200MB)'}
                  </div>
                )}
              </div>
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={e => setAudioFile(e.target.files?.[0] || null)}
              />
            </div>

            {/* Cover image */}
            <div className="space-y-2">
              <Label>Ảnh bìa</Label>
              <div className="flex gap-3 items-start">
                <div
                  className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors overflow-hidden shrink-0"
                  onClick={() => coverInputRef.current?.click()}
                >
                  {coverPreviewUrl ? (
                    <img src={coverPreviewUrl} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="text-sm text-muted-foreground flex-1 pt-2">
                  Click vào ô bên trái để chọn ảnh bìa (JPG, PNG, WebP, tối đa 10MB)
                </div>
              </div>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverChange}
              />
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <Label>Tiêu đề (Tiếng Việt) <span className="text-destructive">*</span></Label>
                <Input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Tên tập podcast" />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Tiêu đề (Tiếng Anh)</Label>
                <Input value={formTitleEn} onChange={e => setFormTitleEn(e.target.value)} placeholder="Episode title in English" />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Mô tả</Label>
                <Textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} rows={3} placeholder="Nội dung tóm tắt tập podcast..." />
              </div>
              <div className="space-y-1">
                <Label>Host / Người dẫn</Label>
                <Input value={formHost} onChange={e => setFormHost(e.target.value)} placeholder="Tên người dẫn chương trình" />
              </div>
              <div className="space-y-1">
                <Label>Chuyên mục</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn chuyên mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Số tập (Episode)</Label>
                <Input type="number" min={1} value={formEpisode} onChange={e => setFormEpisode(e.target.value)} placeholder="1" />
              </div>
              <div className="space-y-1">
                <Label>Số mùa (Season)</Label>
                <Input type="number" min={1} value={formSeason} onChange={e => setFormSeason(e.target.value)} placeholder="1" />
              </div>
              <div className="space-y-1">
                <Label>Tags (cách nhau bởi dấu phẩy)</Label>
                <Input value={formTags} onChange={e => setFormTags(e.target.value)} placeholder="khoa học, công nghệ, giáo dục" />
              </div>
              <div className="space-y-1">
                <Label>Thứ tự hiển thị</Label>
                <Input type="number" value={formDisplayOrder} onChange={e => setFormDisplayOrder(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Ngày phát hành</Label>
                <Input type="datetime-local" value={formPublishedAt} onChange={e => setFormPublishedAt(e.target.value)} />
              </div>
              <div className="flex items-center gap-3 pt-4">
                <Switch checked={formActive} onCheckedChange={setFormActive} />
                <Label>Kích hoạt (hiển thị public)</Label>
              </div>
              <div className="flex items-center gap-3 pt-4">
                <Switch checked={formFeatured} onCheckedChange={setFormFeatured} />
                <Label>Đánh dấu nổi bật</Label>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => { setShowUploadDialog(false); setEditingPodcast(null); resetForm() }}>
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingPodcast ? 'Lưu thay đổi' : 'Thêm podcast'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deletingPodcast !== null} onOpenChange={open => { if (!open) setDeletingPodcast(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa Podcast</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Bạn có chắc chắn muốn xóa tập podcast <span className="font-semibold text-foreground">"{deletingPodcast?.title}"</span>?
            File âm thanh và ảnh bìa sẽ bị xóa vĩnh viễn.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingPodcast(null)}>Hủy</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview / Player Dialog */}
      <Dialog open={previewPodcast !== null} onOpenChange={open => { if (!open) setPreviewPodcast(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{previewPodcast?.title}</DialogTitle>
          </DialogHeader>
          {previewPodcast && (
            <div className="space-y-4">
              {previewPodcast.coverImageUrl && (
                <img
                  src={previewPodcast.coverImageUrl}
                  alt={previewPodcast.title}
                  className="w-full aspect-square object-cover rounded-lg"
                />
              )}
              {previewPodcast.host && (
                <p className="text-sm text-muted-foreground">Host: {previewPodcast.host}</p>
              )}
              {previewPodcast.description && (
                <p className="text-sm">{previewPodcast.description}</p>
              )}
              {previewPodcast.audioUrl && (
                <audio controls className="w-full" src={previewPodcast.audioUrl}>
                  Trình duyệt không hỗ trợ phát âm thanh.
                </audio>
              )}
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{previewPodcast.plays.toLocaleString()} lượt nghe</span>
                <span>{formatFileSize(previewPodcast.fileSize)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
