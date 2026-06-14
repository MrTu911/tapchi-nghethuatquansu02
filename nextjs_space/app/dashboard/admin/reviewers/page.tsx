'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Users, Search, Plus, Edit, Trash2, Loader2,
  UserCheck, AlertTriangle, Star, TrendingUp,
  BarChart3, ExternalLink, X, ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { TableScrollWrapper } from '@/components/dashboard/table-scroll-wrapper'

// ─── Label Maps ──────────────────────────────────────────────────────────────

const ACADEMIC_TITLE_LABELS: Record<string, string> = {
  giang_vien: 'Giảng viên',
  giang_vien_chinh: 'GV Chính',
  giang_vien_cao_cap: 'GV Cao cấp',
  nghien_cuu_vien: 'NCV',
  nghien_cuu_vien_chinh: 'NCV Chính',
  nghien_cuu_vien_cao_cap: 'NCV Cao cấp',
  pho_giao_su: 'PGS',
  giao_su: 'GS',
}

const ACADEMIC_DEGREE_LABELS: Record<string, string> = {
  cu_nhan: 'Cử nhân',
  thac_si: 'Thạc sĩ',
  tien_si: 'Tiến sĩ',
  tien_si_khoa_hoc: 'TSKH',
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Reviewer {
  id: string
  fullName: string
  email: string
  org?: string
  rank?: string
  position?: string
  academicTitle?: string
  academicDegree?: string
  isActive: boolean
  expertise: string[]
  keywords: string[]
  pendingReviews: number
  completedReviews: number
  totalReviews: number
  averageRating: number
  isAvailable: boolean
  maxConcurrentReviews: number
  unavailableUntil?: string | null
  avgCompletionDays: number
}

type StatusFilter = 'all' | 'available' | 'busy' | 'overloaded' | 'unavailable'
type SortKey = 'name' | 'rating' | 'load'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getReviewerStatus(r: Reviewer) {
  if (!r.isAvailable) {
    return { label: 'Không sẵn sàng', bgClass: 'bg-red-100 text-red-700 border-red-200', dotClass: 'bg-red-500' }
  }
  if (r.pendingReviews >= r.maxConcurrentReviews) {
    return { label: 'Quá tải', bgClass: 'bg-orange-100 text-orange-700 border-orange-200', dotClass: 'bg-orange-500' }
  }
  if (r.pendingReviews >= Math.ceil(r.maxConcurrentReviews * 0.8)) {
    return { label: 'Gần đầy', bgClass: 'bg-yellow-100 text-yellow-700 border-yellow-200', dotClass: 'bg-yellow-500' }
  }
  return { label: 'Sẵn sàng', bgClass: 'bg-emerald-100 text-emerald-700 border-emerald-200', dotClass: 'bg-emerald-500' }
}

function getLoadColor(pending: number, max: number) {
  const ratio = pending / max
  if (ratio >= 1) return 'bg-red-500'
  if (ratio >= 0.8) return 'bg-orange-400'
  if (ratio >= 0.5) return 'bg-yellow-400'
  return 'bg-emerald-500'
}

function renderStars(rating: number) {
  const filled = Math.round(rating)
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`h-3 w-3 ${i <= filled ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
        />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{rating > 0 ? rating.toFixed(1) : '—'}</span>
    </span>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

const DEFAULT_FORM = {
  fullName: '',
  email: '',
  password: '',
  org: '',
  rank: '',
  position: '',
  academicTitle: 'none',
  academicDegree: 'none',
  expertise: '',
  keywords: '',
  maxConcurrentReviews: 5,
  isAvailable: true,
  unavailableUntil: '',
}

export default function ReviewersManagementPage() {
  const [loading, setLoading] = useState(true)
  const [reviewers, setReviewers] = useState<Reviewer[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('name')

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedReviewer, setSelectedReviewer] = useState<Reviewer | null>(null)
  const [formData, setFormData] = useState(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadReviewers() }, [])

  const loadReviewers = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/users?role=REVIEWER&limit=100')
      const data = await res.json()
      if (data.users) {
        const mapped: Reviewer[] = data.users.map((u: any) => {
          const profile = u.reviewerProfile ?? {}
          const total = profile.totalReviews ?? 0
          const completed = profile.completedReviews ?? 0
          const pending = Math.max(0, total - completed)
          return {
            id: u.id,
            fullName: u.fullName,
            email: u.email,
            org: u.org,
            rank: u.rank,
            position: u.position,
            academicTitle: u.academicTitle,
            academicDegree: u.academicDegree,
            isActive: u.isActive ?? true,
            expertise: profile.expertise ?? [],
            keywords: profile.keywords ?? [],
            pendingReviews: pending,
            completedReviews: completed,
            totalReviews: total,
            averageRating: profile.averageRating ?? 0,
            isAvailable: profile.isAvailable ?? true,
            maxConcurrentReviews: profile.maxConcurrentReviews ?? 5,
            unavailableUntil: profile.unavailableUntil ?? null,
            avgCompletionDays: profile.avgCompletionDays ?? 0,
          }
        })
        setReviewers(mapped)
      }
    } catch {
      toast.error('Không thể tải danh sách phản biện viên')
    } finally {
      setLoading(false)
    }
  }

  // ─── Stats ────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total = reviewers.length
    const available = reviewers.filter(r => r.isAvailable && r.pendingReviews < r.maxConcurrentReviews).length
    const overloaded = reviewers.filter(r => !r.isAvailable || r.pendingReviews >= r.maxConcurrentReviews).length
    const withRating = reviewers.filter(r => r.averageRating > 0)
    const avgRating = withRating.length > 0
      ? withRating.reduce((s, r) => s + r.averageRating, 0) / withRating.length
      : 0
    return { total, available, overloaded, avgRating }
  }, [reviewers])

  // ─── Filter + Sort ────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = reviewers.filter(r => {
      const q = searchTerm.toLowerCase()
      if (q && !r.fullName.toLowerCase().includes(q) &&
          !r.email.toLowerCase().includes(q) &&
          !(r.org ?? '').toLowerCase().includes(q) &&
          !(r.rank ?? '').toLowerCase().includes(q) &&
          !r.expertise.some(e => e.toLowerCase().includes(q))
      ) return false

      if (statusFilter === 'available') return r.isAvailable && r.pendingReviews < r.maxConcurrentReviews
      if (statusFilter === 'busy') return r.isAvailable && r.pendingReviews >= Math.ceil(r.maxConcurrentReviews * 0.8) && r.pendingReviews < r.maxConcurrentReviews
      if (statusFilter === 'overloaded') return r.pendingReviews >= r.maxConcurrentReviews
      if (statusFilter === 'unavailable') return !r.isAvailable
      return true
    })

    list = [...list].sort((a, b) => {
      if (sortKey === 'rating') return b.averageRating - a.averageRating
      if (sortKey === 'load') return a.pendingReviews - b.pendingReviews
      return a.fullName.localeCompare(b.fullName, 'vi')
    })

    return list
  }, [reviewers, searchTerm, statusFilter, sortKey])

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleAddReviewer = async () => {
    if (!formData.fullName || !formData.email || !formData.password) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          org: formData.org,
          rank: formData.rank,
          position: formData.position,
          academicTitle: formData.academicTitle === 'none' ? null : formData.academicTitle,
          academicDegree: formData.academicDegree === 'none' ? null : formData.academicDegree,
          role: 'REVIEWER',
          expertise: formData.expertise ? formData.expertise.split(',').map(e => e.trim()).filter(Boolean) : [],
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Thêm phản biện viên thành công')
        setIsAddDialogOpen(false)
        setFormData(DEFAULT_FORM)
        loadReviewers()
      } else {
        toast.error(data.message || 'Không thể thêm phản biện viên')
      }
    } catch {
      toast.error('Đã xảy ra lỗi')
    } finally {
      setSaving(false)
    }
  }

  const handleEditReviewer = async () => {
    if (!selectedReviewer || !formData.fullName || !formData.email) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }
    setSaving(true)
    try {
      const updateData: any = {
        fullName: formData.fullName,
        email: formData.email,
        org: formData.org,
        rank: formData.rank,
        position: formData.position,
        academicTitle: formData.academicTitle === 'none' ? null : formData.academicTitle,
        academicDegree: formData.academicDegree === 'none' ? null : formData.academicDegree,
      }
      if (formData.password) updateData.password = formData.password

      const [userRes, expertiseRes] = await Promise.all([
        fetch(`/api/users/${selectedReviewer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        }),
        fetch(`/api/reviewers/${selectedReviewer.id}/expertise`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            expertise: formData.expertise ? formData.expertise.split(',').map(e => e.trim()).filter(Boolean) : [],
            keywords: formData.keywords ? formData.keywords.split(',').map(k => k.trim()).filter(Boolean) : [],
            isAvailable: formData.isAvailable,
            maxConcurrentReviews: formData.maxConcurrentReviews,
            unavailableUntil: formData.isAvailable ? null : (formData.unavailableUntil || null),
          }),
        }),
      ])

      const userData = await userRes.json()
      const expertiseData = await expertiseRes.json()

      if (userData.success && expertiseData.success) {
        toast.success('Cập nhật phản biện viên thành công')
        setIsEditDialogOpen(false)
        setSelectedReviewer(null)
        setFormData(DEFAULT_FORM)
        loadReviewers()
      } else {
        toast.error(userData.message || expertiseData.message || 'Không thể cập nhật')
      }
    } catch {
      toast.error('Đã xảy ra lỗi khi cập nhật')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteReviewer = async () => {
    if (!selectedReviewer) return
    try {
      const res = await fetch(`/api/users/${selectedReviewer.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Đã xóa phản biện viên')
        setIsDeleteDialogOpen(false)
        setSelectedReviewer(null)
        loadReviewers()
      } else {
        toast.error(data.message || 'Không thể xóa')
      }
    } catch {
      toast.error('Đã xảy ra lỗi')
    }
  }

  const openEditDialog = (reviewer: Reviewer) => {
    setSelectedReviewer(reviewer)
    setFormData({
      fullName: reviewer.fullName,
      email: reviewer.email,
      password: '',
      org: reviewer.org ?? '',
      rank: reviewer.rank ?? '',
      position: reviewer.position ?? '',
      academicTitle: reviewer.academicTitle ?? 'none',
      academicDegree: reviewer.academicDegree ?? 'none',
      expertise: reviewer.expertise.join(', '),
      keywords: reviewer.keywords.join(', '),
      maxConcurrentReviews: reviewer.maxConcurrentReviews,
      isAvailable: reviewer.isAvailable,
      unavailableUntil: reviewer.unavailableUntil
        ? new Date(reviewer.unavailableUntil).toISOString().split('T')[0]
        : '',
    })
    setIsEditDialogOpen(true)
  }

  // ─── Shared form body ─────────────────────────────────────────────────────

  const renderFormBody = (isEdit: boolean) => (
    <div className="space-y-5 py-2">
      {/* Section 1: Thông tin cơ bản */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Thông tin cơ bản
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Họ và tên <span className="text-red-500">*</span></Label>
            <Input
              value={formData.fullName}
              onChange={e => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Nguyễn Văn A"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Email <span className="text-red-500">*</span></Label>
            <Input
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@example.com"
            />
          </div>
        </div>
        <div className="space-y-1.5 mt-3">
          <Label>{isEdit ? 'Mật khẩu mới (để trống nếu không đổi)' : <span>Mật khẩu <span className="text-red-500">*</span></span>}</Label>
          <Input
            type="password"
            value={formData.password}
            onChange={e => setFormData({ ...formData, password: e.target.value })}
            placeholder="••••••••"
          />
        </div>
      </div>

      <Separator />

      {/* Section 2: Chức danh & Đơn vị */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Chức danh & Đơn vị
        </p>
        <div className="space-y-1.5 mb-3">
          <Label>Đơn vị công tác</Label>
          <Input
            value={formData.org}
            onChange={e => setFormData({ ...formData, org: e.target.value })}
            placeholder="Học viện Quốc phòng"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Cấp bậc</Label>
            <Input
              value={formData.rank}
              onChange={e => setFormData({ ...formData, rank: e.target.value })}
              placeholder="Thiếu tá, Trung tá..."
            />
          </div>
          <div className="space-y-1.5">
            <Label>Chức vụ</Label>
            <Input
              value={formData.position}
              onChange={e => setFormData({ ...formData, position: e.target.value })}
              placeholder="Trưởng khoa, Phó BM..."
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Section 3: Học hàm & Học vị */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Học hàm & Học vị
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Học hàm</Label>
            <Select value={formData.academicTitle} onValueChange={v => setFormData({ ...formData, academicTitle: v })}>
              <SelectTrigger><SelectValue placeholder="Chọn học hàm" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Không có</SelectItem>
                {Object.entries(ACADEMIC_TITLE_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Học vị</Label>
            <Select value={formData.academicDegree} onValueChange={v => setFormData({ ...formData, academicDegree: v })}>
              <SelectTrigger><SelectValue placeholder="Chọn học vị" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Không có</SelectItem>
                {Object.entries(ACADEMIC_DEGREE_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* Section 4: Chuyên môn */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Chuyên môn
        </p>
        <div className="space-y-1.5 mb-3">
          <Label>Lĩnh vực chuyên môn</Label>
          <Input
            value={formData.expertise}
            onChange={e => setFormData({ ...formData, expertise: e.target.value })}
            placeholder="Nghệ thuật quân sự, Chiến lược, Lịch sử quân sự (phân cách bằng dấu phẩy)"
          />
          <p className="text-xs text-muted-foreground">Phân cách bằng dấu phẩy</p>
        </div>
        <div className="space-y-1.5 mb-3">
          <Label>Từ khóa phản biện</Label>
          <Input
            value={formData.keywords}
            onChange={e => setFormData({ ...formData, keywords: e.target.value })}
            placeholder="nghệ thuật tác chiến, chiến thuật, lịch sử quân sự (phân cách bằng dấu phẩy)"
          />
          <p className="text-xs text-muted-foreground">Dùng để AI gợi ý phân công</p>
        </div>
        <div className="space-y-1.5">
          <Label>Số phản biện tối đa / lần</Label>
          <Input
            type="number"
            min={1}
            max={20}
            value={formData.maxConcurrentReviews}
            onChange={e => setFormData({ ...formData, maxConcurrentReviews: parseInt(e.target.value) || 5 })}
          />
        </div>
      </div>

      {isEdit && (
        <>
          <Separator />
          {/* Section 5: Trạng thái nhận bài */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Trạng thái nhận bài
            </p>
            <div className="flex items-center gap-3 mb-3">
              <Switch
                checked={formData.isAvailable}
                onCheckedChange={v => setFormData({ ...formData, isAvailable: v, unavailableUntil: v ? '' : formData.unavailableUntil })}
              />
              <div>
                <span className="text-sm font-medium">
                  {formData.isAvailable ? 'Đang sẵn sàng nhận bài' : 'Tạm ngưng nhận bài'}
                </span>
                <p className="text-xs text-muted-foreground">
                  {formData.isAvailable ? 'Phản biện viên có thể được phân công bài mới' : 'Không phân công bài mới cho đến khi mở lại'}
                </p>
              </div>
            </div>
            {!formData.isAvailable && (
              <div className="space-y-1.5">
                <Label>Tạm ngưng đến ngày</Label>
                <Input
                  type="date"
                  value={formData.unavailableUntil}
                  onChange={e => setFormData({ ...formData, unavailableUntil: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Để trống nếu chưa xác định ngày quay lại</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
              <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            Quản lý Phản biện viên
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Quản lý hồ sơ, chuyên môn và trạng thái phản biện viên trong hệ thống
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/admin/reviewers/metrics">
              <BarChart3 className="h-4 w-4 mr-1.5" />
              Hiệu suất
              <ExternalLink className="h-3 w-3 ml-1.5 opacity-60" />
            </Link>
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setFormData(DEFAULT_FORM)}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm phản biện viên
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Thêm phản biện viên mới</DialogTitle>
                <DialogDescription>Điền thông tin để tạo tài khoản phản biện viên</DialogDescription>
              </DialogHeader>
              {renderFormBody(false)}
              <DialogFooter className="pt-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Hủy</Button>
                <Button onClick={handleAddReviewer} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Thêm phản biện viên
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      {!loading && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-background">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">Tổng cộng</span>
                <div className="p-1.5 rounded-md bg-indigo-100 dark:bg-indigo-900/40">
                  <Users className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
              <div className="text-3xl font-bold text-foreground">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-0.5">phản biện viên</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-background">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Sẵn sàng</span>
                <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-900/40">
                  <UserCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <div className="text-3xl font-bold text-foreground">{stats.available}</div>
              <p className="text-xs text-muted-foreground mt-0.5">có thể nhận bài mới</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-background">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wide">Quá tải / ngưng</span>
                <div className="p-1.5 rounded-md bg-red-100 dark:bg-red-900/40">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <div className="text-3xl font-bold text-foreground">{stats.overloaded}</div>
              <p className="text-xs text-muted-foreground mt-0.5">không thể nhận thêm</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-background">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide">Rating TB</span>
                <div className="p-1.5 rounded-md bg-amber-100 dark:bg-amber-900/40">
                  <Star className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <div className="text-3xl font-bold text-foreground">
                {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—'}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">trên thang 5 điểm</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Filter Bar ── */}
      <Card className="border shadow-sm">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên, email, đơn vị, chuyên môn..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>

            <Select value={statusFilter} onValueChange={v => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="available">Sẵn sàng</SelectItem>
                <SelectItem value="busy">Gần đầy</SelectItem>
                <SelectItem value="overloaded">Quá tải</SelectItem>
                <SelectItem value="unavailable">Không sẵn sàng</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortKey} onValueChange={v => setSortKey(v as SortKey)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Tên A → Z</SelectItem>
                <SelectItem value="rating">Rating cao nhất</SelectItem>
                <SelectItem value="load">Tải thấp nhất</SelectItem>
              </SelectContent>
            </Select>

            <span className="text-sm text-muted-foreground ml-auto">
              {filtered.length} / {reviewers.length} kết quả
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ── Table ── */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Danh sách phản biện viên</CardTitle>
          <CardDescription className="text-xs">
            Nhấn vào nút chỉnh sửa để cập nhật thông tin, chuyên môn và trạng thái nhận bài
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Đang tải danh sách...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="p-4 rounded-full bg-muted">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="font-medium text-sm">
                  {searchTerm || statusFilter !== 'all' ? 'Không tìm thấy kết quả' : 'Chưa có phản biện viên'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {searchTerm || statusFilter !== 'all' ? 'Thử thay đổi điều kiện lọc' : 'Nhấn "Thêm phản biện viên" để bắt đầu'}
                </p>
              </div>
            </div>
          ) : (
            <TableScrollWrapper>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="w-[260px] pl-6">Phản biện viên</TableHead>
                    <TableHead className="w-[200px]">Đơn vị & Chức danh</TableHead>
                    <TableHead>Chuyên môn</TableHead>
                    <TableHead className="w-[150px] text-center">Tải công việc</TableHead>
                    <TableHead className="w-[100px] text-center">Rating</TableHead>
                    <TableHead className="w-[130px] text-center">Trạng thái</TableHead>
                    <TableHead className="w-[100px] text-right pr-6">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(reviewer => {
                    const status = getReviewerStatus(reviewer)
                    const loadRatio = reviewer.pendingReviews / reviewer.maxConcurrentReviews
                    const titleLabel = reviewer.academicTitle ? ACADEMIC_TITLE_LABELS[reviewer.academicTitle] : null
                    const degreeLabel = reviewer.academicDegree ? ACADEMIC_DEGREE_LABELS[reviewer.academicDegree] : null

                    return (
                      <TableRow key={reviewer.id} className="group hover:bg-muted/30">
                        {/* Phản biện viên */}
                        <TableCell className="pl-6 py-3">
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold text-sm shrink-0">
                              {reviewer.fullName.split(' ').pop()?.charAt(0).toUpperCase() ?? '?'}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-sm truncate">{reviewer.fullName}</div>
                              <div className="text-xs text-muted-foreground truncate">{reviewer.email}</div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {reviewer.rank && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                    {reviewer.rank}
                                  </span>
                                )}
                                {titleLabel && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                    {titleLabel}
                                  </span>
                                )}
                                {degreeLabel && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                                    {degreeLabel}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Đơn vị & Chức danh */}
                        <TableCell className="py-3">
                          <div className="text-sm truncate">{reviewer.org || <span className="text-muted-foreground italic text-xs">—</span>}</div>
                          {reviewer.position && (
                            <div className="text-xs text-muted-foreground truncate mt-0.5">{reviewer.position}</div>
                          )}
                        </TableCell>

                        {/* Chuyên môn */}
                        <TableCell className="py-3">
                          {reviewer.expertise.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {reviewer.expertise.slice(0, 3).map((exp, i) => (
                                <Badge key={i} variant="secondary" className="text-xs px-2 py-0.5 font-normal">
                                  {exp}
                                </Badge>
                              ))}
                              {reviewer.expertise.length > 3 && (
                                <Badge variant="outline" className="text-xs px-2 py-0.5 text-muted-foreground">
                                  +{reviewer.expertise.length - 3}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic text-xs">Chưa cập nhật</span>
                          )}
                        </TableCell>

                        {/* Tải công việc */}
                        <TableCell className="text-center py-3">
                          <div className="flex flex-col items-center gap-1.5 px-2">
                            <div className="text-sm font-semibold tabular-nums">
                              {reviewer.pendingReviews}
                              <span className="text-muted-foreground font-normal text-xs"> / {reviewer.maxConcurrentReviews}</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${getLoadColor(reviewer.pendingReviews, reviewer.maxConcurrentReviews)}`}
                                style={{ width: `${Math.min(100, loadRatio * 100)}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>

                        {/* Rating */}
                        <TableCell className="text-center py-3">
                          {renderStars(reviewer.averageRating)}
                        </TableCell>

                        {/* Trạng thái */}
                        <TableCell className="text-center py-3">
                          <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${status.bgClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${status.dotClass}`} />
                            {status.label}
                          </span>
                          {reviewer.unavailableUntil && !reviewer.isAvailable && (
                            <div className="text-[10px] text-muted-foreground mt-1">
                              đến {new Date(reviewer.unavailableUntil).toLocaleDateString('vi-VN')}
                            </div>
                          )}
                        </TableCell>

                        {/* Thao tác */}
                        <TableCell className="text-right pr-6 py-3">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => openEditDialog(reviewer)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                              onClick={() => { setSelectedReviewer(reviewer); setIsDeleteDialogOpen(true) }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableScrollWrapper>
          )}
        </CardContent>
      </Card>

      {/* ── Edit Dialog ── */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa phản biện viên</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin cho: <strong>{selectedReviewer?.fullName}</strong>
            </DialogDescription>
          </DialogHeader>
          {renderFormBody(true)}
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleEditReviewer} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Dialog ── */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa phản biện viên</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa <strong>{selectedReviewer?.fullName}</strong>?
              {(selectedReviewer?.pendingReviews ?? 0) > 0 && (
                <span className="block mt-2 text-orange-600 font-medium">
                  ⚠ Người này đang có {selectedReviewer?.pendingReviews} bài phản biện chưa hoàn thành.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedReviewer(null)}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteReviewer} className="bg-red-600 hover:bg-red-700">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
