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
import { BrandStatCard } from '@/components/dashboard/brand-stat-card'
import { PodcastPlayer } from '@/components/podcast-player'
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
  Search,
  PlayCircle,
  FileText,
  Globe,
} from 'lucide-react'
import { toast } from 'sonner'

interface Podcast {
  id: string
  title: string
  titleEn: string | null
  description: string | null
  descriptionEn: string | null
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

interface PodcastStats {
  total: number
  active: number
  featured: number
  totalPlays: number
}

type StatusFilter = 'all' | 'active' | 'inactive' | 'featured'

// Giới hạn khớp với backend (app/api/podcasts) — validate sớm phía client để
// người dùng không phải chờ upload rồi mới nhận lỗi.
const AUDIO_MAX_BYTES = 200 * 1024 * 1024 // 200MB
const IMAGE_MAX_BYTES = 10 * 1024 * 1024 // 10MB

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

// Trạng thái phát hành suy ra từ isActive + publishedAt.
function getPodcastStatus(p: Podcast): { label: string; className: string } {
  if (!p.isActive) return { label: 'Đã tắt', className: 'bg-rose-600 text-white' }
  if (!p.publishedAt) return { label: 'Nháp', className: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100' }
  if (new Date(p.publishedAt) > new Date()) return { label: 'Hẹn lịch', className: 'bg-amber-500 text-white' }
  return { label: 'Đang phát', className: 'bg-[#1E3924] text-white' }
}

// Chuyên mục bám bản sắc Tạp chí Nghệ thuật Quân sự Việt Nam (xem CLAUDE.md §6).
const CATEGORIES = [
  'Chiến lược quân sự',
  'Nghệ thuật tác chiến',
  'Chiến dịch học',
  'Chiến thuật học',
  'Lịch sử quân sự',
  'Khoa học quân sự',
  'Giáo dục quân sự',
  'Hợp tác quốc phòng',
  'Tin tức Học viện',
  'Khác',
]

export default function PodcastManagementPage() {
  const [podcasts, setPodcasts] = useState<Podcast[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<PodcastStats | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Tìm kiếm + lọc
  const [searchInput, setSearchInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

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
  const [formDescriptionEn, setFormDescriptionEn] = useState('')
  const [formTranscript, setFormTranscript] = useState('')
  const [formHost, setFormHost] = useState('')
  const [formEpisode, setFormEpisode] = useState('')
  const [formSeason, setFormSeason] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formTags, setFormTags] = useState('')
  const [formFeatured, setFormFeatured] = useState(false)
  const [formActive, setFormActive] = useState(true)
  const [formPublishedAt, setFormPublishedAt] = useState('')
  const [formDisplayOrder, setFormDisplayOrder] = useState('0')
  const [formDuration, setFormDuration] = useState<number | null>(null)

  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null)

  const audioInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  async function fetchPodcasts(p = 1) {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(p),
        limit: '20',
        adminView: 'true',
        includeStats: 'true',
      })
      if (keyword) params.set('keyword', keyword)
      if (statusFilter === 'active') params.set('isActive', 'true')
      if (statusFilter === 'inactive') params.set('isActive', 'false')
      if (statusFilter === 'featured') params.set('isFeatured', 'true')

      const res = await fetch(`/api/podcasts?${params}`)
      const data = await res.json()
      if (data.success) {
        setPodcasts(data.data.podcasts)
        setTotalPages(data.data.pagination.totalPages)
        if (data.data.stats) setStats(data.data.stats)
      } else {
        toast.error(data.error || 'Không thể tải danh sách podcast')
      }
    } catch {
      toast.error('Không thể tải danh sách podcast')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPodcasts(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, keyword, statusFilter])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    setKeyword(searchInput.trim())
  }

  function handleStatusChange(value: StatusFilter) {
    setPage(1)
    setStatusFilter(value)
  }

  function resetForm() {
    setFormTitle('')
    setFormTitleEn('')
    setFormDescription('')
    setFormDescriptionEn('')
    setFormTranscript('')
    setFormHost('')
    setFormEpisode('')
    setFormSeason('')
    setFormCategory('')
    setFormTags('')
    setFormFeatured(false)
    setFormActive(true)
    setFormPublishedAt('')
    setFormDisplayOrder('0')
    setFormDuration(null)
    setAudioFile(null)
    setCoverFile(null)
    setCoverPreviewUrl(null)
  }

  function openEditDialog(podcast: Podcast) {
    setEditingPodcast(podcast)
    setFormTitle(podcast.title)
    setFormTitleEn(podcast.titleEn || '')
    setFormDescription(podcast.description || '')
    setFormDescriptionEn(podcast.descriptionEn || '')
    setFormTranscript(podcast.transcript || '')
    setFormHost(podcast.host || '')
    setFormEpisode(podcast.episodeNumber?.toString() || '')
    setFormSeason(podcast.seasonNumber?.toString() || '')
    setFormCategory(podcast.category || '')
    setFormTags(podcast.tags.join(', '))
    setFormFeatured(podcast.isFeatured)
    setFormActive(podcast.isActive)
    setFormPublishedAt(podcast.publishedAt ? podcast.publishedAt.slice(0, 16) : '')
    setFormDisplayOrder(podcast.displayOrder.toString())
    setFormDuration(podcast.duration)
    setAudioFile(null)
    setCoverFile(null)
    setCoverPreviewUrl(podcast.coverImageUrl)
  }

  function handleAudioChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null
    if (!file) {
      setAudioFile(null)
      return
    }
    // Validate sớm phía client (backend vẫn là nguồn chặn thật sự).
    if (file.type && !file.type.startsWith('audio/')) {
      toast.error('File âm thanh không hợp lệ. Vui lòng chọn MP3, M4A, WAV, OGG, AAC')
      e.target.value = ''
      return
    }
    if (file.size > AUDIO_MAX_BYTES) {
      toast.error('File âm thanh quá lớn. Giới hạn 200MB')
      e.target.value = ''
      return
    }
    setAudioFile(file)
    // Đọc thời lượng phía client (server không giải mã audio) để lưu kèm khi upload.
    const url = URL.createObjectURL(file)
    const audio = new Audio()
    audio.preload = 'metadata'
    audio.onloadedmetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setFormDuration(Math.round(audio.duration))
      }
      URL.revokeObjectURL(url)
    }
    audio.onerror = () => URL.revokeObjectURL(url)
    audio.src = url
  }

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type && !file.type.startsWith('image/')) {
      toast.error('Ảnh bìa phải là file ảnh (JPG, PNG, WebP)')
      e.target.value = ''
      return
    }
    if (file.size > IMAGE_MAX_BYTES) {
      toast.error('Ảnh bìa quá lớn. Giới hạn 10MB')
      e.target.value = ''
      return
    }
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
    if (formDescriptionEn) formData.append('descriptionEn', formDescriptionEn)
    if (formTranscript) formData.append('transcript', formTranscript)
    if (formHost) formData.append('host', formHost)
    if (formEpisode) formData.append('episodeNumber', formEpisode)
    if (formSeason) formData.append('seasonNumber', formSeason)
    if (formCategory) formData.append('category', formCategory)
    if (formTags) formData.append('tags', formTags)
    formData.append('isFeatured', String(formFeatured))
    formData.append('isActive', String(formActive))
    if (formPublishedAt) formData.append('publishedAt', new Date(formPublishedAt).toISOString())
    formData.append('displayOrder', formDisplayOrder)
    if (formDuration != null) formData.append('duration', String(formDuration))
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

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1E3924]/10 dark:bg-[#1E3924]/40">
            <Headphones className="h-6 w-6 text-[#1E3924] dark:text-[#E5C86E]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1E3924] dark:text-[#E5C86E]">Quản lý Podcast</h1>
            <p className="text-muted-foreground text-sm">Upload và quản lý các tập podcast của tạp chí</p>
          </div>
        </div>
        <Button onClick={() => { resetForm(); setShowUploadDialog(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm Podcast
        </Button>
      </div>

      {/* Stats — số liệu tính trên toàn bộ thư viện (từ API), ổn định qua mọi trang */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <BrandStatCard label="Tổng số tập" value={stats?.total ?? 0} icon={Radio} tone="green" loading={!stats} />
        <BrandStatCard label="Đang phát" value={stats?.active ?? 0} icon={PlayCircle} tone="sky" loading={!stats} />
        <BrandStatCard label="Nổi bật" value={stats?.featured ?? 0} icon={Star} tone="gold" loading={!stats} />
        <BrandStatCard label="Tổng lượt nghe" value={(stats?.totalPlays ?? 0).toLocaleString()} icon={Headphones} tone="amber" loading={!stats} />
      </div>

      {/* Search + Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Tìm theo tiêu đề, người dẫn..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>
        <Select value={statusFilter} onValueChange={(v) => handleStatusChange(v as StatusFilter)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="active">Đang phát</SelectItem>
            <SelectItem value="inactive">Đã tắt</SelectItem>
            <SelectItem value="featured">Nổi bật</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Podcast Grid */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#1E3924]/60" />
        </div>
      ) : podcasts.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center text-muted-foreground">
          <Radio className="mb-3 h-10 w-10 opacity-30" />
          <p>{keyword || statusFilter !== 'all' ? 'Không tìm thấy podcast phù hợp' : 'Chưa có podcast nào. Thêm tập đầu tiên!'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {podcasts.map((podcast) => {
            const status = getPodcastStatus(podcast)
            return (
              <Card key={podcast.id} className="group overflow-hidden border-border/60 transition-shadow hover:shadow-md">
                {/* Cover image */}
                <div className="relative aspect-square bg-gradient-to-br from-[#1E3924] to-[#2f5a3a]">
                  {podcast.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={podcast.coverImageUrl}
                      alt={podcast.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Music className="h-12 w-12 text-[#E5C86E]/70" />
                    </div>
                  )}
                  <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                    <Badge className={status.className}>{status.label}</Badge>
                    {podcast.isFeatured && (
                      <Badge className="bg-[#E5C86E] text-[#1E3924]">
                        <Star className="mr-1 h-3 w-3" />
                        Nổi bật
                      </Badge>
                    )}
                  </div>
                  <button
                    className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors hover:bg-black/40"
                    onClick={() => setPreviewPodcast(podcast)}
                    aria-label={`Xem trước: ${podcast.title}`}
                  >
                    <Play className="h-10 w-10 text-white opacity-0 transition-opacity group-hover:opacity-100" fill="white" />
                  </button>
                </div>

                <CardContent className="space-y-1 p-3">
                  <div className="line-clamp-2 text-sm font-medium group-hover:text-[#1E3924] dark:group-hover:text-[#E5C86E]">
                    {podcast.title}
                  </div>
                  <div className="space-y-0.5 text-xs text-muted-foreground">
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
                      className="h-7 flex-1 text-xs"
                      onClick={() => openEditDialog(podcast)}
                    >
                      <Pencil className="mr-1 h-3 w-3" />
                      Sửa
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 w-7 p-0 text-destructive hover:bg-destructive hover:text-white"
                      onClick={() => setDeletingPodcast(podcast)}
                      aria-label="Xóa"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Trước
          </Button>
          <span className="flex items-center px-2 text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
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
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPodcast ? 'Chỉnh sửa Podcast' : 'Thêm Podcast mới'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Audio file upload */}
            <div className="space-y-2">
              <Label>File âm thanh {!editingPodcast && <span className="text-destructive">*</span>}</Label>
              <div
                className="cursor-pointer rounded-lg border-2 border-dashed p-4 text-center transition-colors hover:border-[#1E3924]"
                onClick={() => audioInputRef.current?.click()}
              >
                {audioFile ? (
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <Music className="h-4 w-4 text-[#1E3924] dark:text-[#E5C86E]" />
                    <span className="font-medium">{audioFile.name}</span>
                    <span className="text-muted-foreground">({formatFileSize(audioFile.size)})</span>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    <Upload className="mx-auto mb-1 h-6 w-6" />
                    {editingPodcast ? 'Chọn file mới để thay thế (bỏ qua nếu không đổi)' : 'Kéo thả hoặc click để chọn file MP3, M4A, WAV (tối đa 200MB)'}
                  </div>
                )}
              </div>
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={handleAudioChange}
              />
            </div>

            {/* Cover image */}
            <div className="space-y-2">
              <Label>Ảnh bìa</Label>
              <div className="flex items-start gap-3">
                <div
                  className="flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed transition-colors hover:border-[#1E3924]"
                  onClick={() => coverInputRef.current?.click()}
                >
                  {coverPreviewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={coverPreviewUrl} alt="Cover" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 pt-2 text-sm text-muted-foreground">
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
                <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Tên tập podcast" />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Tiêu đề (Tiếng Anh)</Label>
                <Input value={formTitleEn} onChange={(e) => setFormTitleEn(e.target.value)} placeholder="Episode title in English" />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Mô tả</Label>
                <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={3} placeholder="Nội dung tóm tắt tập podcast..." />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" />
                  Mô tả (Tiếng Anh)
                </Label>
                <Textarea value={formDescriptionEn} onChange={(e) => setFormDescriptionEn(e.target.value)} rows={3} placeholder="English summary..." />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  Transcript (nội dung văn bản)
                </Label>
                <Textarea value={formTranscript} onChange={(e) => setFormTranscript(e.target.value)} rows={5} placeholder="Bản ghi lời thoại đầy đủ của tập podcast (giúp tìm kiếm & tiếp cận)..." />
              </div>
              <div className="space-y-1">
                <Label>Host / Người dẫn</Label>
                <Input value={formHost} onChange={(e) => setFormHost(e.target.value)} placeholder="Tên người dẫn chương trình" />
              </div>
              <div className="space-y-1">
                <Label>Chuyên mục</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn chuyên mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Số tập (Episode)</Label>
                <Input type="number" min={1} value={formEpisode} onChange={(e) => setFormEpisode(e.target.value)} placeholder="1" />
              </div>
              <div className="space-y-1">
                <Label>Số mùa (Season)</Label>
                <Input type="number" min={1} value={formSeason} onChange={(e) => setFormSeason(e.target.value)} placeholder="1" />
              </div>
              <div className="space-y-1">
                <Label>Tags (cách nhau bởi dấu phẩy)</Label>
                <Input value={formTags} onChange={(e) => setFormTags(e.target.value)} placeholder="nghệ thuật quân sự, chiến lược, quốc phòng" />
              </div>
              <div className="space-y-1">
                <Label>Thứ tự hiển thị</Label>
                <Input type="number" value={formDisplayOrder} onChange={(e) => setFormDisplayOrder(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Ngày phát hành</Label>
                <Input type="datetime-local" value={formPublishedAt} onChange={(e) => setFormPublishedAt(e.target.value)} />
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
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingPodcast ? 'Lưu thay đổi' : 'Thêm podcast'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deletingPodcast !== null} onOpenChange={(open) => { if (!open) setDeletingPodcast(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa Podcast</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Bạn có chắc chắn muốn xóa tập podcast <span className="font-semibold text-foreground">&quot;{deletingPodcast?.title}&quot;</span>?
            File âm thanh và ảnh bìa sẽ bị xóa vĩnh viễn.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingPodcast(null)}>Hủy</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview / Player Dialog */}
      <Dialog open={previewPodcast !== null} onOpenChange={(open) => { if (!open) setPreviewPodcast(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{previewPodcast?.title}</DialogTitle>
          </DialogHeader>
          {previewPodcast && (
            <div className="space-y-4">
              {previewPodcast.host && (
                <p className="text-sm text-muted-foreground">Host: {previewPodcast.host}</p>
              )}
              {previewPodcast.description && (
                <p className="text-sm">{previewPodcast.description}</p>
              )}
              {previewPodcast.audioUrl ? (
                <PodcastPlayer
                  src={previewPodcast.audioUrl}
                  title={previewPodcast.title}
                  coverUrl={previewPodcast.coverImageUrl}
                  duration={previewPodcast.duration}
                />
              ) : (
                <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                  Tập này chưa có file âm thanh.
                </p>
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
