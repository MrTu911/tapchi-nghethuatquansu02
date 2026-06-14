'use client'

import { useState, useEffect } from 'react'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import Image from 'next/image'
import {
  Plus, Trash2, Edit, GripVertical, ImageIcon, Link as LinkIcon,
  Loader2, Eye, EyeOff, Layers, ChevronLeft, ChevronRight,
} from 'lucide-react'

interface SliderItem {
  id: string
  imageUrl: string
  linkUrl: string | null
  altText: string | null
  displayOrder: number
  isActive: boolean
  createdAt: string
  creator?: { fullName: string }
}

// --- Sortable card component ---
function SortableSliderCard({
  slider,
  index,
  total,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  slider: SliderItem
  index: number
  total: number
  onEdit: (s: SliderItem) => void
  onDelete: (id: string) => void
  onToggleActive: (s: SliderItem) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: slider.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`shadow-sm transition-all ${!slider.isActive ? 'opacity-60' : ''} ${isDragging ? 'shadow-lg ring-2 ring-emerald-500/30' : ''}`}>
        <CardContent className="p-0">
          <div className="flex items-center gap-0">
            {/* Drag handle */}
            <div
              {...attributes}
              {...listeners}
              className="flex items-center justify-center w-10 h-full self-stretch cursor-grab active:cursor-grabbing flex-shrink-0 text-muted-foreground/40 hover:text-muted-foreground transition-colors rounded-l-lg hover:bg-muted/40"
            >
              <GripVertical className="h-4 w-4" />
            </div>

            {/* Thumbnail */}
            <div className="relative w-40 aspect-[3/1] bg-muted rounded overflow-hidden flex-shrink-0 my-3">
              {slider.imageUrl ? (
                <Image
                  src={slider.imageUrl}
                  alt={slider.altText || 'Slider'}
                  fill
                  className="object-cover"
                  sizes="160px"
                  onError={() => {}}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-muted-foreground">#{index + 1}</span>
                {slider.isActive ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Hiển thị
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                    Ẩn
                  </span>
                )}
              </div>
              {slider.altText && (
                <p className="text-sm font-medium text-foreground truncate">{slider.altText}</p>
              )}
              {slider.linkUrl && (
                <p className="text-xs text-blue-600 truncate flex items-center gap-1 mt-0.5">
                  <LinkIcon className="h-3 w-3 flex-shrink-0" />
                  {slider.linkUrl}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {slider.creator?.fullName || 'Hệ thống'}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 pr-3 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onToggleActive(slider)}
                title={slider.isActive ? 'Ẩn slider' : 'Hiện slider'}
              >
                {slider.isActive
                  ? <EyeOff className="h-4 w-4 text-muted-foreground" />
                  : <Eye className="h-4 w-4 text-muted-foreground" />
                }
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onEdit(slider)}
                title="Chỉnh sửa"
              >
                <Edit className="h-4 w-4 text-muted-foreground" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Xóa">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Xóa slider?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Hành động này không thể hoàn tác.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(slider.id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Xóa
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// --- Main page ---
export default function SlidersManagementPage() {
  const [sliders, setSliders] = useState<SliderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSlider, setEditingSlider] = useState<SliderItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)

  const [imageUrl, setImageUrl] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [altText, setAltText] = useState('')
  const [isActive, setIsActive] = useState(true)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  useEffect(() => {
    fetchSliders()
  }, [])

  const fetchSliders = async () => {
    try {
      const res = await fetch('/api/cms/sliders')
      const data = await res.json()
      if (data.success) setSliders(data.data)
    } catch {
      toast.error('Lỗi tải danh sách slider')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setImageUrl('')
    setLinkUrl('')
    setAltText('')
    setIsActive(true)
    setEditingSlider(null)
  }

  const openEditDialog = (slider: SliderItem) => {
    setEditingSlider(slider)
    setImageUrl(slider.imageUrl)
    setLinkUrl(slider.linkUrl || '')
    setAltText(slider.altText || '')
    setIsActive(slider.isActive)
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!imageUrl.trim()) {
      toast.error('Vui lòng nhập URL ảnh')
      return
    }

    setSaving(true)
    try {
      const url = editingSlider
        ? `/api/cms/sliders/${editingSlider.id}`
        : '/api/cms/sliders'

      const res = await fetch(url, {
        method: editingSlider ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, linkUrl, altText, isActive }),
      })

      const data = await res.json()
      if (data.success) {
        toast.success(editingSlider ? 'Đã cập nhật slider' : 'Đã thêm slider mới')
        fetchSliders()
        setIsDialogOpen(false)
        resetForm()
      } else {
        toast.error(data.error || 'Lỗi lưu slider')
      }
    } catch {
      toast.error('Lỗi lưu slider')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/cms/sliders/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Đã xóa slider')
        fetchSliders()
      } else {
        toast.error(data.error || 'Lỗi xóa slider')
      }
    } catch {
      toast.error('Lỗi xóa slider')
    }
  }

  const handleToggleActive = async (slider: SliderItem) => {
    try {
      const res = await fetch(`/api/cms/sliders/${slider.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !slider.isActive }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(slider.isActive ? 'Đã ẩn slider' : 'Đã hiện slider')
        fetchSliders()
      }
    } catch {
      toast.error('Lỗi cập nhật')
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = sliders.findIndex(s => s.id === active.id)
    const newIndex = sliders.findIndex(s => s.id === over.id)
    const reordered = arrayMove(sliders, oldIndex, newIndex)

    setSliders(reordered)

    // Update display orders for moved items
    const [a, b] = [reordered[newIndex], sliders[newIndex]]
    try {
      await Promise.all([
        fetch(`/api/cms/sliders/${a.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ displayOrder: b.displayOrder }),
        }),
        fetch(`/api/cms/sliders/${b.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ displayOrder: a.displayOrder }),
        }),
      ])
    } catch {
      toast.error('Lỗi lưu thứ tự')
      fetchSliders()
    }
  }

  const activeSliders = sliders.filter(s => s.isActive)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
            <Layers className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Slider Trang chủ</h1>
            <p className="text-sm text-muted-foreground">
              Kéo thả để sắp xếp • {sliders.length} slider • {activeSliders.length} đang hiển thị
            </p>
          </div>
        </div>
        <Button
          onClick={() => { resetForm(); setIsDialogOpen(true) }}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Thêm Slider
        </Button>
      </div>

      {/* Sortable list */}
      {sliders.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-14 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="font-medium text-muted-foreground">Chưa có slider nào</p>
            <p className="text-sm text-muted-foreground mt-1">Click "Thêm Slider" để bắt đầu</p>
          </CardContent>
        </Card>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sliders.map(s => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {sliders.map((slider, index) => (
                <SortableSliderCard
                  key={slider.id}
                  slider={slider}
                  index={index}
                  total={sliders.length}
                  onEdit={openEditDialog}
                  onDelete={handleDelete}
                  onToggleActive={handleToggleActive}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Preview carousel */}
      {activeSliders.length > 0 && (
        <Card className="shadow-sm overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Xem trước Slider</CardTitle>
            <CardDescription className="text-xs">Giao diện hiển thị trên trang chủ</CardDescription>
          </CardHeader>
          <CardContent className="p-0 pb-4">
            <div className="max-w-3xl mx-auto px-4">
              <div className="relative aspect-[3/1] bg-muted rounded-xl overflow-hidden">
                <Image
                  src={activeSliders[previewIndex % activeSliders.length]?.imageUrl || ''}
                  alt="Preview"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 768px"
                  onError={() => {}}
                />
                {activeSliders.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setPreviewIndex(i => (i - 1 + activeSliders.length) % activeSliders.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewIndex(i => (i + 1) % activeSliders.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </>
                )}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {activeSliders.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPreviewIndex(i)}
                      className={`rounded-full transition-all ${
                        i === previewIndex % activeSliders.length
                          ? 'bg-white w-5 h-2'
                          : 'bg-white/50 w-2 h-2'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open)
        if (!open) resetForm()
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingSlider ? 'Chỉnh sửa Slider' : 'Thêm Slider mới'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>URL Ảnh <span className="text-red-500">*</span></Label>
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://... hoặc /uploads/..."
              />
              {imageUrl && (
                <div className="relative aspect-[3/1] bg-muted rounded-lg overflow-hidden border">
                  <Image
                    src={imageUrl}
                    alt="Preview"
                    fill
                    className="object-cover"
                    sizes="448px"
                    onError={() => {}}
                  />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Liên kết khi click</Label>
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="/issues/... hoặc https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Mô tả ảnh (Alt text)</Label>
              <Input
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Mô tả ngắn gọn về ảnh"
              />
            </div>
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium">Hiển thị</p>
                <p className="text-xs text-muted-foreground">Slider sẽ xuất hiện trên trang chủ</p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingSlider ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
