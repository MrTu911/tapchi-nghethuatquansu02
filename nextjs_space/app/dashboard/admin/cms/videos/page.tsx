'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import {
  PlusCircle, Edit, Trash2, Eye, Loader2, Upload, X,
  Play, FileVideo, LayoutGrid, List, Star, Activity, Maximize2, Camera, Check,
  Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, RefreshCw,
} from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { useChunkedVideoUpload } from '@/hooks/use-chunked-video-upload'
import { VideoUploadProgress } from '@/components/dashboard/video-upload-progress'

interface Video {
  id: string
  title: string
  titleEn?: string
  description?: string
  videoType: string
  videoUrl: string
  videoId?: string
  cloudStoragePath?: string
  thumbnailUrl?: string
  category?: string
  tags: string[]
  isFeatured: boolean
  isActive: boolean
  displayOrder: number
  views: number
  publishedAt?: string
  createdAt: string
}

/** Nguồn phát cho video upload nội bộ (LAN). */
function getPlaybackUrl(video: Video): string {
  return video.cloudStoragePath || video.videoUrl
}

/**
 * Đọc thời lượng và tự chụp một khung hình đại diện từ file video phía client
 * (dùng <video> offscreen + canvas) — không cần ffmpeg trên server.
 * Trả về blob ảnh (có thể null nếu trình duyệt không decode được) và thời lượng (giây).
 */
async function captureVideoThumbnail(file: File): Promise<{ blob: Blob | null; durationSec: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true
    video.src = url
    let settled = false

    const finish = (blob: Blob | null, durationSec: number) => {
      if (settled) return
      settled = true
      URL.revokeObjectURL(url)
      resolve({ blob, durationSec })
    }

    video.onloadedmetadata = () => {
      const durationSec = isFinite(video.duration) ? Math.round(video.duration) : 0
      const target = Math.min(2, (video.duration || 4) * 0.25)
      const drawFrame = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = video.videoWidth || 1280
          canvas.height = video.videoHeight || 720
          const ctx = canvas.getContext('2d')
          if (!ctx) return finish(null, durationSec)
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          canvas.toBlob((blob) => finish(blob, durationSec), 'image/jpeg', 0.85)
        } catch {
          finish(null, durationSec)
        }
      }
      video.onseeked = drawFrame
      try { video.currentTime = target } catch { drawFrame() }
    }
    video.onerror = () => finish(null, 0)
    setTimeout(() => finish(null, 0), 15000) // timeout an toàn
  })
}

export default function VideosManagementPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingVideo, setEditingVideo] = useState<Video | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [deleteVideoId, setDeleteVideoId] = useState<string | null>(null)
  const [previewVideo, setPreviewVideo] = useState<Video | null>(null)
  const [capturedThumb, setCapturedThumb] = useState<{ dataUrl: string; blob: Blob } | null>(null)
  const [savingThumb, setSavingThumb] = useState(false)
  const previewVideoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploader = useChunkedVideoUpload()

  // Auto-thumbnail + duration đọc từ file khi chọn
  const [autoThumbBlob, setAutoThumbBlob] = useState<Blob | null>(null)
  const [autoDurationSec, setAutoDurationSec] = useState<number | null>(null)

  // Tìm kiếm + lọc + phân trang (client-side trên danh sách đã tải)
  const [keyword, setKeyword] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [page, setPage] = useState(1)
  const pageSize = 12

  const [formData, setFormData] = useState({
    title: '',
    titleEn: '',
    description: '',
    category: '',
    tags: '',
    isFeatured: false,
    isActive: true,
    displayOrder: 0,
  })

  useEffect(() => { fetchVideos() }, [])
  // Quay về trang 1 khi đổi bộ lọc/từ khóa
  useEffect(() => { setPage(1) }, [keyword, filterCategory, filterStatus])

  const fetchVideos = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/videos?limit=500')
      const data = await res.json()
      if (data.success) {
        setVideos(data.data.videos || [])
        setTotalCount(data.data.pagination?.total || data.data.videos?.length || 0)
      }
    } catch { toast.error('Không thể tải danh sách video') }
    finally { setLoading(false) }
  }

  const handleOpenDialog = (video?: Video) => {
    // Xóa mọi trạng thái file/upload còn sót từ lần mở trước
    handleRemoveFile()
    uploader.reset()
    if (video) {
      setEditingVideo(video)
      setFormData({
        title: video.title,
        titleEn: video.titleEn || '',
        description: video.description || '',
        category: video.category || '',
        tags: video.tags?.join(', ') || '',
        isFeatured: video.isFeatured,
        isActive: video.isActive,
        displayOrder: video.displayOrder,
      })
    } else {
      setEditingVideo(null)
      setFormData({ title: '', titleEn: '', description: '', category: '', tags: '', isFeatured: false, isActive: true, displayOrder: 0 })
    }
    setIsDialogOpen(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const acceptedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo', 'video/avi', 'video/x-matroska']
    // Một số trình duyệt để type rỗng với .mkv/.mov — chấp nhận nếu là file video
    if (file.type && !acceptedTypes.includes(file.type) && !file.type.startsWith('video/')) {
      toast.error('Chỉ chấp nhận file video (MP4, WebM, OGG, MOV, AVI, MKV)')
      return
    }
    // Không giới hạn dung lượng phía client — file lớn sẽ upload theo từng phần (chunked)
    setSelectedFile(file)
    setVideoPreview(URL.createObjectURL(file))
    // Tự đọc thời lượng + chụp ảnh đại diện (best-effort, không chặn luồng)
    setAutoThumbBlob(null)
    setAutoDurationSec(null)
    captureVideoThumbnail(file)
      .then(({ blob, durationSec }) => {
        setAutoThumbBlob(blob)
        setAutoDurationSec(durationSec > 0 ? durationSec : null)
      })
      .catch(() => { /* ảnh đại diện là phụ */ })
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (videoPreview) URL.revokeObjectURL(videoPreview)
    setVideoPreview(null)
    setAutoThumbBlob(null)
    setAutoDurationSec(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const parseTags = () =>
    formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : []

  /** Đặt ảnh đại diện từ khung hình đã chụp (best-effort — ảnh đại diện là phụ). */
  const uploadAutoThumbnail = async (videoId: string) => {
    if (!autoThumbBlob) return
    try {
      const fd = new FormData()
      fd.append('thumbnail', autoThumbBlob, 'thumbnail.jpg')
      await fetch(`/api/videos/${videoId}/thumbnail`, { method: 'POST', body: fd })
    } catch { /* ảnh đại diện là phụ */ }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) { toast.error('Vui lòng nhập tiêu đề'); return }

    // ---- Thêm mới: bắt buộc chọn file video ----
    if (!editingVideo) {
      if (!selectedFile) { toast.error('Vui lòng chọn file video để tải lên'); return }
      const video = await uploader.start(selectedFile, {
        title: formData.title,
        titleEn: formData.titleEn || undefined,
        description: formData.description || undefined,
        category: formData.category || undefined,
        tags: parseTags(),
        isFeatured: formData.isFeatured,
        isActive: formData.isActive,
        displayOrder: formData.displayOrder,
        duration: autoDurationSec ?? undefined,
      })
      if (video) {
        await uploadAutoThumbnail(video.id)
        toast.success('Tải lên video thành công!')
        setIsDialogOpen(false)
        handleRemoveFile()
        uploader.reset()
        fetchVideos()
      } else if (uploader.error) {
        toast.error(uploader.error)
      }
      return
    }

    // ---- Chỉnh sửa: nếu có file mới -> thay file trước (luồng chunked) ----
    if (selectedFile) {
      const replaced = await uploader.start(selectedFile, {
        title: formData.title, // server bỏ qua khi có replaceVideoId
        replaceVideoId: editingVideo.id,
        duration: autoDurationSec ?? undefined,
      })
      if (!replaced) {
        if (uploader.error) toast.error(uploader.error)
        return
      }
      // Cập nhật ảnh đại diện theo file mới (nếu chụp được)
      await uploadAutoThumbnail(editingVideo.id)
    }

    // ---- Cập nhật metadata (PUT) ----
    setIsSubmitting(true)
    try {
      const payload: any = {
        title: formData.title,
        titleEn: formData.titleEn || null,
        description: formData.description || null,
        category: formData.category || null,
        tags: parseTags(),
        isFeatured: formData.isFeatured,
        isActive: formData.isActive,
        displayOrder: formData.displayOrder,
      }
      // publishedAt: kích hoạt lần đầu -> đặt now; tắt -> null; đã publish rồi thì giữ nguyên
      if (!formData.isActive) {
        payload.publishedAt = null
      } else if (!editingVideo.publishedAt) {
        payload.publishedAt = new Date().toISOString()
      }

      const res = await fetch(`/api/videos/${editingVideo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Cập nhật thành công')
        setIsDialogOpen(false)
        handleRemoveFile()
        uploader.reset()
        fetchVideos()
      } else {
        toast.error(data.error || 'Có lỗi xảy ra')
      }
    } catch { toast.error('Không thể thực hiện') }
    finally { setIsSubmitting(false) }
  }

  const handleDelete = async () => {
    if (!deleteVideoId) return
    try {
      const res = await fetch(`/api/videos/${deleteVideoId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) { toast.success('Đã xóa video'); fetchVideos() }
      else toast.error('Không thể xóa')
    } catch { toast.error('Lỗi khi xóa') }
    finally { setDeleteVideoId(null) }
  }

  const handleCaptureFrame = () => {
    const videoEl = previewVideoRef.current
    if (!videoEl) return
    const canvas = document.createElement('canvas')
    canvas.width = videoEl.videoWidth || 1280
    canvas.height = videoEl.videoHeight || 720
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(videoEl, 0, 0)
    canvas.toBlob((blob) => {
      if (!blob) return
      setCapturedThumb({ dataUrl: canvas.toDataURL('image/jpeg', 0.85), blob })
      toast.success('Đã chụp frame — nhấn Lưu để đặt làm ảnh đại diện')
    }, 'image/jpeg', 0.85)
  }

  const handleSaveThumbnail = async () => {
    if (!capturedThumb || !previewVideo) return
    setSavingThumb(true)
    try {
      const fd = new FormData()
      fd.append('thumbnail', capturedThumb.blob, 'thumbnail.jpg')
      const res = await fetch(`/api/videos/${previewVideo.id}/thumbnail`, { method: 'POST', body: fd })
      const data = await res.json()
      if (data.success) {
        setVideos(prev => prev.map(v => v.id === previewVideo.id ? { ...v, thumbnailUrl: data.data.thumbnailUrl } : v))
        setPreviewVideo(prev => prev ? { ...prev, thumbnailUrl: data.data.thumbnailUrl } : null)
        setCapturedThumb(null)
        toast.success('Đã lưu ảnh đại diện!')
      } else {
        toast.error('Lưu thất bại')
      }
    } catch { toast.error('Lỗi khi lưu') }
    finally { setSavingThumb(false) }
  }

  // Đổi thứ tự hiển thị bằng cách hoán đổi displayOrder với video liền kề
  const handleReorder = async (video: Video, direction: 'up' | 'down') => {
    const idx = pagedVideos.findIndex((v) => v.id === video.id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= pagedVideos.length) return
    const other = pagedVideos[swapIdx]
    // Nếu trùng order, gán theo vị trí để hoán đổi có hiệu lực
    const aOrder = video.displayOrder === other.displayOrder ? idx : other.displayOrder
    const bOrder = video.displayOrder === other.displayOrder ? swapIdx : video.displayOrder
    try {
      await Promise.all([
        fetch(`/api/videos/${video.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ displayOrder: aOrder }) }),
        fetch(`/api/videos/${other.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ displayOrder: bOrder }) }),
      ])
      fetchVideos()
    } catch { toast.error('Không đổi được thứ tự') }
  }

  const stats = {
    total: totalCount,
    active: videos.filter((v) => v.isActive).length,
    featured: videos.filter((v) => v.isFeatured).length,
    totalViews: videos.reduce((sum, v) => sum + v.views, 0),
  }

  // Danh mục có thật trong dữ liệu (cho dropdown lọc)
  const categoryOptions = Array.from(
    new Set(videos.map((v) => (v.category || '').trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, 'vi'))

  // Lọc theo từ khóa + danh mục + trạng thái, rồi phân trang
  const filteredVideos = videos.filter((v) => {
    const kw = keyword.trim().toLowerCase()
    const matchKw = !kw ||
      v.title.toLowerCase().includes(kw) ||
      (v.titleEn || '').toLowerCase().includes(kw) ||
      (v.description || '').toLowerCase().includes(kw)
    const matchCategory = filterCategory === 'all' || (v.category || '') === filterCategory
    const matchStatus = filterStatus === 'all' || (filterStatus === 'active' ? v.isActive : !v.isActive)
    return matchKw && matchCategory && matchStatus
  })
  const totalPages = Math.max(1, Math.ceil(filteredVideos.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pagedVideos = filteredVideos.slice((safePage - 1) * pageSize, safePage * pageSize)

  // Ảnh đại diện video upload nội bộ (không dùng thumbnail ngoài Internet)
  const getThumbnail = (video: Video) => video.thumbnailUrl || ''

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Quản lý Video
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Tải lên và phát video trên mạng nội bộ (LAN)</p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-[#295232] hover:bg-[#1E3924] text-white"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Thêm Video
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Tổng video', value: stats.total, icon: FileVideo, color: 'text-gray-600', bg: 'bg-gray-50 dark:bg-gray-800' },
          { label: 'Đang hoạt động', value: stats.active, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Nổi bật', value: stats.featured, icon: Star, color: 'text-[#D4A843]', bg: 'bg-[#FFF3CC]/60 dark:bg-yellow-900/20' },
          { label: 'Tổng lượt xem', value: stats.totalViews.toLocaleString(), icon: Eye, color: 'text-sky-600', bg: 'bg-sky-50 dark:bg-sky-900/20' },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-gray-100 dark:border-gray-700`}>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 font-medium">{s.label}</p>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar: tìm kiếm + lọc + đổi chế độ xem */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 min-w-[200px] sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Tìm tiêu đề, mô tả..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="h-9 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 text-sm text-gray-700 dark:text-gray-200"
        >
          <option value="all">Tất cả danh mục</option>
          {categoryOptions.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
          className="h-9 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 text-sm text-gray-700 dark:text-gray-200"
        >
          <option value="all">Mọi trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="inactive">Tạm dừng</option>
        </select>
        <div className="flex items-center gap-2 sm:ml-auto">
          <span className="text-xs text-gray-400 mr-1">{filteredVideos.length} kết quả</span>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? 'bg-[#295232] hover:bg-[#1E3924]' : ''}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-[#295232] hover:bg-[#1E3924]' : ''}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-[#295232]" />
        </div>
      ) : videos.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center h-48 gap-3">
          <FileVideo className="h-12 w-12 text-gray-300" />
          <p className="text-gray-400">Chưa có video nào</p>
          <Button onClick={() => handleOpenDialog()} size="sm" className="bg-[#295232] hover:bg-[#1E3924] text-white">
            <PlusCircle className="h-4 w-4 mr-1" /> Thêm video đầu tiên
          </Button>
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center h-48 gap-3">
          <Search className="h-10 w-10 text-gray-300" />
          <p className="text-gray-400">Không tìm thấy video phù hợp bộ lọc</p>
          <Button onClick={() => { setKeyword(''); setFilterCategory('all'); setFilterStatus('all') }} size="sm" variant="outline">
            Xóa bộ lọc
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid view */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pagedVideos.map((video) => {
            const thumb = getThumbnail(video)
            return (
              <div
                key={video.id}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt={video.title} className="w-full h-full object-cover" />
                  ) : getPlaybackUrl(video) ? (
                    <video
                      src={getPlaybackUrl(video)}
                      className="w-full h-full object-cover"
                      muted
                      preload="metadata"
                      onLoadedMetadata={(e) => {
                        const v = e.currentTarget
                        if (v.duration > 2) v.currentTime = 2
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="w-10 h-10 text-gray-300" />
                    </div>
                  )}
                  {/* Play overlay — click to preview */}
                  <button
                    type="button"
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => { setCapturedThumb(null); setPreviewVideo(video) }}
                    title="Xem video"
                  >
                    <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                      <Play className="w-5 h-5 text-[#295232]" fill="#295232" />
                    </div>
                  </button>
                  {/* Camera badge — capture thumbnail */}
                  {!video.thumbnailUrl && (
                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <Camera className="w-2.5 h-2.5" /> Chưa có ảnh
                      </span>
                    </div>
                  )}
                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex gap-1">
                    {video.category && (
                      <span className="bg-[#295232] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                        {video.category}
                      </span>
                    )}
                    {video.isFeatured && (
                      <span className="bg-[#D4A843] text-[#1E293B] text-[10px] font-bold px-1.5 py-0.5 rounded">
                        ⭐
                      </span>
                    )}
                  </div>
                  {/* Status */}
                  <div className="absolute top-2 right-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${video.isActive ? 'bg-emerald-500 text-white' : 'bg-gray-400 text-white'}`}>
                      {video.isActive ? '● Live' : '○ Off'}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200 line-clamp-2 leading-snug mb-2">
                    {video.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {video.views.toLocaleString()}
                    </span>
                    {video.publishedAt && (
                      <span>{format(new Date(video.publishedAt), 'dd/MM/yyyy', { locale: vi })}</span>
                    )}
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1 mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-sky-500 hover:text-sky-600 hover:bg-sky-50"
                      onClick={() => setPreviewVideo(video)}
                      title="Xem video"
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 flex-1 text-xs text-gray-500 hover:text-[#295232]"
                      onClick={() => handleOpenDialog(video)}
                    >
                      <Edit className="h-3 w-3 mr-1" /> Sửa
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-gray-300 hover:text-red-500"
                      onClick={() => setDeleteVideoId(video.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* List view */
        <Card className="overflow-hidden border-gray-100 dark:border-gray-700">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                <TableHead className="w-20">Ảnh</TableHead>
                <TableHead>Tiêu đề</TableHead>
                <TableHead className="w-32">Danh mục</TableHead>
                <TableHead className="w-28">Trạng thái</TableHead>
                <TableHead className="w-24 text-center">Lượt xem</TableHead>
                <TableHead className="w-28">Ngày</TableHead>
                <TableHead className="w-24 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedVideos.map((video, rowIdx) => {
                const thumb = getThumbnail(video)
                return (
                  <TableRow key={video.id}>
                    <TableCell>
                      <div className="w-16 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 relative flex-shrink-0">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumb} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="font-medium text-gray-800 dark:text-gray-200 line-clamp-1">{video.title}</div>
                        {video.titleEn && <div className="text-xs text-gray-400 italic line-clamp-1">{video.titleEn}</div>}
                        {video.isFeatured && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#D4A843]">
                            <Star className="w-2.5 h-2.5" fill="currentColor" /> Nổi bật
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {video.category ? (
                        <Badge variant="secondary" className="text-xs">{video.category}</Badge>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {video.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                          Tạm dừng
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1 text-sm text-gray-500">
                        <Eye className="h-3.5 w-3.5" /> {video.views}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-gray-400">
                      {video.publishedAt
                        ? format(new Date(video.publishedAt), 'dd/MM/yyyy', { locale: vi })
                        : format(new Date(video.createdAt), 'dd/MM/yyyy', { locale: vi })
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-1">
                        <div className="flex flex-col">
                          <button
                            type="button"
                            className="text-gray-300 hover:text-[#295232] disabled:opacity-30 disabled:hover:text-gray-300"
                            onClick={() => handleReorder(video, 'up')}
                            disabled={rowIdx === 0}
                            title="Lên trên"
                          >
                            <ChevronUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            className="text-gray-300 hover:text-[#295232] disabled:opacity-30 disabled:hover:text-gray-300"
                            onClick={() => handleReorder(video, 'down')}
                            disabled={rowIdx === pagedVideos.length - 1}
                            title="Xuống dưới"
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-sky-500 hover:text-sky-600" onClick={() => setPreviewVideo(video)} title="Xem video">
                          <Play className="h-3.5 w-3.5" fill="currentColor" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:text-[#295232]" onClick={() => handleOpenDialog(video)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:text-red-500" onClick={() => setDeleteVideoId(video.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Phân trang */}
      {!loading && filteredVideos.length > pageSize && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" /> Trước
          </Button>
          <span className="text-sm text-gray-500">
            Trang <span className="font-semibold text-gray-700 dark:text-gray-200">{safePage}</span> / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            className="gap-1"
          >
            Sau <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open && uploader.isActive) return; setIsDialogOpen(open) }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVideo ? 'Chỉnh sửa Video' : 'Thêm Video Mới'}</DialogTitle>
            <DialogDescription>
              {editingVideo ? 'Cập nhật thông tin hoặc thay thế file video.' : 'Tải lên file video để phát trên mạng nội bộ (LAN).'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Khu vực tải lên / thay thế file video (LAN) */}
            <div className="space-y-3 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4">
              <Label className="flex items-center gap-2 text-[#295232]">
                {editingVideo ? <RefreshCw className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                {editingVideo ? 'Thay thế file video (tùy chọn)' : 'Chọn file video *'}
              </Label>
              <p className="text-xs text-gray-400">
                MP4, WebM, OGG, MOV, AVI, MKV — không giới hạn dung lượng. File lớn tải theo từng phần, có thể tạm dừng / tiếp tục.
                {editingVideo && ' Bỏ trống nếu chỉ sửa thông tin.'}
              </p>
              <Input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                disabled={uploader.isActive}
              />
              {videoPreview && !uploader.isActive && uploader.status !== 'error' && (
                <div className="relative">
                  <video src={videoPreview} controls className="w-full rounded-lg max-h-64" />
                  <Button type="button" variant="destructive" size="sm" onClick={handleRemoveFile} className="absolute top-2 right-2 h-7 w-7 p-0">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {editingVideo && !videoPreview && !uploader.isActive && (
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <FileVideo className="h-3.5 w-3.5" /> Đang dùng file hiện tại — chọn file mới để thay thế.
                </p>
              )}
              {(uploader.isActive || uploader.status === 'error') && (
                <VideoUploadProgress
                  status={uploader.status}
                  progress={uploader.progress}
                  uploadedBytes={uploader.uploadedBytes}
                  totalBytes={uploader.totalBytes}
                  speedBps={uploader.speedBps}
                  etaSec={uploader.etaSec}
                  error={uploader.error}
                  onPause={uploader.pause}
                  onResume={uploader.resume}
                  onCancel={uploader.cancel}
                />
              )}
            </div>

            <div className="space-y-4">
              <div>
                <Label>Tiêu đề (Tiếng Việt) *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Nhập tiêu đề video"
                  className="mt-1.5"
                  required
                />
              </div>
              <div>
                <Label>Tiêu đề (English)</Label>
                <Input
                  value={formData.titleEn}
                  onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                  placeholder="Enter video title in English"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Mô tả</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả nội dung video..."
                  rows={3}
                  className="mt-1.5"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Danh mục</Label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="VD: Nghiên cứu, Hội thảo"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Thứ tự hiển thị</Label>
                  <Input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                    className="mt-1.5"
                  />
                </div>
              </div>
              <div>
                <Label>Từ khóa (phân cách bằng dấu phẩy)</Label>
                <Input
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="khoa học, nghiên cứu, nghệ thuật quân sự"
                  className="mt-1.5"
                />
              </div>
              <div className="flex items-center gap-6 pt-1">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.isFeatured}
                    onCheckedChange={(v) => setFormData({ ...formData, isFeatured: v })}
                  />
                  <Label className="flex items-center gap-1 cursor-pointer">
                    <Star className="w-3.5 h-3.5 text-[#D4A843]" fill={formData.isFeatured ? '#D4A843' : 'none'} />
                    Nổi bật
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(v) => setFormData({ ...formData, isActive: v })}
                  />
                  <Label className="cursor-pointer">Kích hoạt</Label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting || uploader.isActive}>
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting || uploader.isActive} className="bg-[#295232] hover:bg-[#1E3924] text-white">
                {(isSubmitting || uploader.isActive) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {uploader.isActive ? 'Đang tải lên...' : editingVideo ? 'Cập nhật' : 'Lưu video'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteVideoId} onOpenChange={(open) => !open && setDeleteVideoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>Bạn có chắc muốn xóa video này? Hành động không thể hoàn tác.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Video Preview Modal */}
      {previewVideo && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => { setPreviewVideo(null); setCapturedThumb(null) }}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden w-full max-w-4xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Player — video nội bộ (LAN) */}
            <div className="aspect-video bg-black">
              <video
                ref={previewVideoRef}
                key={previewVideo.id}
                src={getPlaybackUrl(previewVideo)}
                controls
                autoPlay
                className="w-full h-full"
                controlsList="nodownload"
              />
            </div>

            {/* Thumbnail capture strip */}
            {(
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex items-center gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1.5"
                  onClick={handleCaptureFrame}
                >
                  <Camera className="w-3.5 h-3.5" />
                  Chụp frame làm ảnh đại diện
                </Button>

                {capturedThumb && (
                  <>
                    {/* Preview thumbnail */}
                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={capturedThumb.dataUrl}
                        alt="preview"
                        className="h-10 w-[72px] object-cover rounded border border-gray-200"
                      />
                      <Button
                        size="sm"
                        className="h-8 text-xs gap-1.5 bg-[#295232] hover:bg-[#1E3924]"
                        onClick={handleSaveThumbnail}
                        disabled={savingThumb}
                      >
                        {savingThumb
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Check className="w-3.5 h-3.5" />}
                        Lưu làm ảnh đại diện
                      </Button>
                      <button
                        onClick={() => setCapturedThumb(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}

                {previewVideo.thumbnailUrl && !capturedThumb && (
                  <span className="text-xs text-emerald-600 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Đã có ảnh đại diện
                  </span>
                )}
              </div>
            )}

            {/* Info + actions */}
            <div className="p-4 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {previewVideo.category && (
                    <span className="bg-[#295232]/10 text-[#295232] text-[10px] font-bold px-1.5 py-0.5 rounded">
                      {previewVideo.category}
                    </span>
                  )}
                  {previewVideo.isFeatured && (
                    <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-1.5 py-0.5 rounded">⭐ Nổi bật</span>
                  )}
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${previewVideo.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {previewVideo.isActive ? '● Live' : '○ Off'}
                  </span>
                </div>
                <h2 className="font-bold text-base text-gray-900 dark:text-gray-100 leading-snug">{previewVideo.title}</h2>
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {previewVideo.views.toLocaleString()} lượt xem</span>
                  {previewVideo.publishedAt && (
                    <span>{format(new Date(previewVideo.publishedAt), 'dd/MM/yyyy', { locale: vi })}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs hover:text-[#295232]"
                  onClick={() => { setPreviewVideo(null); handleOpenDialog(previewVideo) }}
                >
                  <Edit className="h-3 w-3 mr-1" /> Sửa
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                  onClick={() => { setPreviewVideo(null); setCapturedThumb(null) }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
