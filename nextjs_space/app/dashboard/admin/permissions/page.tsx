
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Shield,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  XCircle,
  Upload,
  RefreshCw,
  Zap,
  Search,
  FileText,
  GitBranch,
  Users,
  LayoutDashboard,
  Settings,
  Lock,
  BarChart2,
  Grid3X3,
  ChevronDown,
  ChevronRight,
  Crown,
  BookOpen,
  Eye,
  PenLine,
  Layers,
  ArrowUpDown,
  RotateCcw,
  Copy,
  CheckCheck,
  Monitor,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Permission {
  id: string
  code: string
  name: string
  description?: string
  category: string
  isGranted: boolean
}

type RoleValue =
  | 'READER'
  | 'AUTHOR'
  | 'REVIEWER'
  | 'SECTION_EDITOR'
  | 'LAYOUT_EDITOR'
  | 'MANAGING_EDITOR'
  | 'DEPUTY_EIC'
  | 'SECURITY_AUDITOR'
  | 'EIC'
  | 'SYSADMIN'
  | 'COMMANDER'

type ColorKey =
  | 'slate' | 'blue' | 'cyan' | 'teal' | 'green'
  | 'violet' | 'rose' | 'amber' | 'orange' | 'indigo'

type CategoryKey = 'CONTENT' | 'WORKFLOW' | 'USERS' | 'CMS' | 'SYSTEM' | 'SECURITY' | 'ANALYTICS'

type ConfirmType = 'grantAll' | 'revokeAll' | 'seed' | 'seedReset'

// ─── Role config ──────────────────────────────────────────────────────────────

const ROLES: {
  value: RoleValue
  label: string
  labelShort: string
  icon: React.ElementType
  color: ColorKey
  level: number
  description: string
}[] = [
  { value: 'READER',           label: 'Độc giả',                   labelShort: 'Độc giả',     icon: Eye,          color: 'slate',  level: 1, description: 'Xem nội dung công khai' },
  { value: 'AUTHOR',           label: 'Tác giả',                   labelShort: 'Tác giả',     icon: PenLine,      color: 'blue',   level: 2, description: 'Nộp và quản lý bài viết' },
  { value: 'REVIEWER',         label: 'Phản biện viên',            labelShort: 'Phản biện',   icon: BookOpen,     color: 'cyan',   level: 3, description: 'Đánh giá và phản biện bài' },
  { value: 'SECTION_EDITOR',   label: 'Biên tập chuyên mục',       labelShort: 'BT Chuyên mục',icon: FileText,    color: 'teal',   level: 4, description: 'Quản lý bài trong chuyên mục' },
  { value: 'LAYOUT_EDITOR',    label: 'Biên tập dàn trang',        labelShort: 'BT Dàn trang',icon: Layers,       color: 'green',  level: 4, description: 'Sản xuất và dàn trang' },
  { value: 'MANAGING_EDITOR',  label: 'Thư ký tòa soạn',           labelShort: 'Thư ký tòa soạn',icon: ArrowUpDown, color: 'violet', level: 5, description: 'Điều phối toàn bộ workflow biên tập' },
  { value: 'SECURITY_AUDITOR', label: 'Kiểm định bảo mật',         labelShort: 'KĐ Bảo mật', icon: ShieldAlert,  color: 'rose',   level: 5, description: 'Giám sát bảo mật và audit' },
  { value: 'DEPUTY_EIC',       label: 'Phó Tổng biên tập',         labelShort: 'Phó TBT',     icon: ArrowUpDown, color: 'rose',   level: 6, description: 'Giám sát toàn tòa soạn, không ký xuất bản cuối' },
  { value: 'EIC',              label: 'Tổng biên tập',             labelShort: 'Tổng biên tập',icon: Crown,       color: 'amber',  level: 7, description: 'Quyền hạn cao nhất về nội dung, ký xuất bản' },
  { value: 'COMMANDER',        label: 'Chỉ huy / Giám sát',        labelShort: 'Chỉ huy',    icon: Monitor,      color: 'indigo', level: 8, description: 'Giám sát tổng thể, không can thiệp' },
  { value: 'SYSADMIN',         label: 'Quản trị hệ thống',         labelShort: 'Quản trị',    icon: Settings,     color: 'orange', level: 9, description: 'Toàn quyền hệ thống' },
]

// ─── Color map ────────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<ColorKey, {
  card: string; cardActive: string; icon: string; iconBg: string; iconBgActive: string
  dot: string; bar: string; count: string; badge: string
}> = {
  slate:  { card: 'border-slate-200 hover:border-slate-300 hover:bg-slate-50', cardActive: 'border-slate-500 bg-slate-50 shadow-md', icon: 'text-slate-600', iconBg: 'bg-slate-100', iconBgActive: 'bg-white shadow-sm', dot: 'bg-slate-400', bar: 'bg-slate-400', count: 'text-slate-500', badge: 'bg-slate-100 text-slate-700' },
  blue:   { card: 'border-blue-200 hover:border-blue-300 hover:bg-blue-50/40', cardActive: 'border-blue-500 bg-blue-50 shadow-md', icon: 'text-blue-600', iconBg: 'bg-blue-100', iconBgActive: 'bg-white shadow-sm', dot: 'bg-blue-500', bar: 'bg-blue-500', count: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' },
  cyan:   { card: 'border-cyan-200 hover:border-cyan-300 hover:bg-cyan-50/40', cardActive: 'border-cyan-500 bg-cyan-50 shadow-md', icon: 'text-cyan-600', iconBg: 'bg-cyan-100', iconBgActive: 'bg-white shadow-sm', dot: 'bg-cyan-500', bar: 'bg-cyan-500', count: 'text-cyan-600', badge: 'bg-cyan-100 text-cyan-700' },
  teal:   { card: 'border-teal-200 hover:border-teal-300 hover:bg-teal-50/40', cardActive: 'border-teal-500 bg-teal-50 shadow-md', icon: 'text-teal-600', iconBg: 'bg-teal-100', iconBgActive: 'bg-white shadow-sm', dot: 'bg-teal-500', bar: 'bg-teal-500', count: 'text-teal-600', badge: 'bg-teal-100 text-teal-700' },
  green:  { card: 'border-green-200 hover:border-green-300 hover:bg-green-50/40', cardActive: 'border-green-500 bg-green-50 shadow-md', icon: 'text-green-600', iconBg: 'bg-green-100', iconBgActive: 'bg-white shadow-sm', dot: 'bg-green-500', bar: 'bg-green-500', count: 'text-green-600', badge: 'bg-green-100 text-green-700' },
  violet: { card: 'border-violet-200 hover:border-violet-300 hover:bg-violet-50/40', cardActive: 'border-violet-500 bg-violet-50 shadow-md', icon: 'text-violet-600', iconBg: 'bg-violet-100', iconBgActive: 'bg-white shadow-sm', dot: 'bg-violet-500', bar: 'bg-violet-500', count: 'text-violet-600', badge: 'bg-violet-100 text-violet-700' },
  rose:   { card: 'border-rose-200 hover:border-rose-300 hover:bg-rose-50/40', cardActive: 'border-rose-500 bg-rose-50 shadow-md', icon: 'text-rose-600', iconBg: 'bg-rose-100', iconBgActive: 'bg-white shadow-sm', dot: 'bg-rose-500', bar: 'bg-rose-500', count: 'text-rose-600', badge: 'bg-rose-100 text-rose-700' },
  amber:  { card: 'border-amber-200 hover:border-amber-300 hover:bg-amber-50/40', cardActive: 'border-amber-500 bg-amber-50 shadow-md', icon: 'text-amber-600', iconBg: 'bg-amber-100', iconBgActive: 'bg-white shadow-sm', dot: 'bg-amber-500', bar: 'bg-amber-500', count: 'text-amber-600', badge: 'bg-amber-100 text-amber-700' },
  orange: { card: 'border-orange-200 hover:border-orange-300 hover:bg-orange-50/40', cardActive: 'border-orange-500 bg-orange-50 shadow-md', icon: 'text-orange-600', iconBg: 'bg-orange-100', iconBgActive: 'bg-white shadow-sm', dot: 'bg-orange-500', bar: 'bg-orange-500', count: 'text-orange-600', badge: 'bg-orange-100 text-orange-700' },
  indigo: { card: 'border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50/40', cardActive: 'border-indigo-500 bg-indigo-50 shadow-md', icon: 'text-indigo-600', iconBg: 'bg-indigo-100', iconBgActive: 'bg-white shadow-sm', dot: 'bg-indigo-500', bar: 'bg-indigo-500', count: 'text-indigo-600', badge: 'bg-indigo-100 text-indigo-700' },
}

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: 'all',       label: 'Tất cả',          icon: Grid3X3,       pillActive: 'bg-slate-800 text-white border-slate-800',       pillBase: 'bg-white text-slate-600 border-slate-200 hover:border-slate-400' },
  { value: 'CONTENT',   label: 'Nội dung',         icon: FileText,      pillActive: 'bg-blue-600 text-white border-blue-600',         pillBase: 'bg-white text-blue-700 border-blue-200 hover:border-blue-400 hover:bg-blue-50' },
  { value: 'WORKFLOW',  label: 'Quy trình',        icon: GitBranch,     pillActive: 'bg-purple-600 text-white border-purple-600',     pillBase: 'bg-white text-purple-700 border-purple-200 hover:border-purple-400 hover:bg-purple-50' },
  { value: 'USERS',     label: 'Người dùng',       icon: Users,         pillActive: 'bg-emerald-600 text-white border-emerald-600',   pillBase: 'bg-white text-emerald-700 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50' },
  { value: 'CMS',       label: 'CMS / Website',    icon: LayoutDashboard,pillActive: 'bg-pink-600 text-white border-pink-600',       pillBase: 'bg-white text-pink-700 border-pink-200 hover:border-pink-400 hover:bg-pink-50' },
  { value: 'SYSTEM',    label: 'Hệ thống',         icon: Settings,      pillActive: 'bg-orange-600 text-white border-orange-600',    pillBase: 'bg-white text-orange-700 border-orange-200 hover:border-orange-400 hover:bg-orange-50' },
  { value: 'SECURITY',  label: 'Bảo mật',          icon: Lock,          pillActive: 'bg-red-600 text-white border-red-600',          pillBase: 'bg-white text-red-700 border-red-200 hover:border-red-400 hover:bg-red-50' },
  { value: 'ANALYTICS', label: 'Thống kê',         icon: BarChart2,     pillActive: 'bg-indigo-600 text-white border-indigo-600',    pillBase: 'bg-white text-indigo-700 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50' },
]

const CATEGORY_META: Record<CategoryKey, {
  label: string; headerBg: string; headerBorder: string; iconBg: string
  iconColor: string; badgeBg: string; progressColor: string; icon: React.ElementType
}> = {
  CONTENT:   { label: 'Nội dung & Bài báo',      headerBg: 'bg-blue-50',    headerBorder: 'border-blue-100',   iconBg: 'bg-blue-100',    iconColor: 'text-blue-600',   badgeBg: 'bg-blue-100 text-blue-700',     progressColor: 'bg-blue-500',   icon: FileText },
  WORKFLOW:  { label: 'Quy trình biên tập',       headerBg: 'bg-purple-50',  headerBorder: 'border-purple-100', iconBg: 'bg-purple-100',  iconColor: 'text-purple-600', badgeBg: 'bg-purple-100 text-purple-700', progressColor: 'bg-purple-500', icon: GitBranch },
  USERS:     { label: 'Người dùng & Phản biện',   headerBg: 'bg-emerald-50', headerBorder: 'border-emerald-100',iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600',badgeBg: 'bg-emerald-100 text-emerald-700',progressColor: 'bg-emerald-500',icon: Users },
  CMS:       { label: 'CMS & Nội dung Website',   headerBg: 'bg-pink-50',    headerBorder: 'border-pink-100',   iconBg: 'bg-pink-100',    iconColor: 'text-pink-600',   badgeBg: 'bg-pink-100 text-pink-700',     progressColor: 'bg-pink-500',   icon: LayoutDashboard },
  SYSTEM:    { label: 'Quản trị Hệ thống',        headerBg: 'bg-orange-50',  headerBorder: 'border-orange-100', iconBg: 'bg-orange-100',  iconColor: 'text-orange-600', badgeBg: 'bg-orange-100 text-orange-700', progressColor: 'bg-orange-500', icon: Settings },
  SECURITY:  { label: 'Bảo mật & Kiểm toán',     headerBg: 'bg-red-50',     headerBorder: 'border-red-100',    iconBg: 'bg-red-100',     iconColor: 'text-red-600',    badgeBg: 'bg-red-100 text-red-700',       progressColor: 'bg-red-500',    icon: Lock },
  ANALYTICS: { label: 'Thống kê & Báo cáo',       headerBg: 'bg-indigo-50',  headerBorder: 'border-indigo-100', iconBg: 'bg-indigo-100',  iconColor: 'text-indigo-600', badgeBg: 'bg-indigo-100 text-indigo-700', progressColor: 'bg-indigo-500', icon: BarChart2 },
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PermissionsManagementPage() {
  // ── State ────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true)
  const [loadingCounts, setLoadingCounts] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [grantingAll, setGrantingAll] = useState(false)
  const [revokingAll, setRevokingAll] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const [selectedRole, setSelectedRole] = useState<RoleValue>('MANAGING_EDITOR')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // permissions của role đang chọn
  const [permissions, setPermissions] = useState<Permission[]>([])
  // tổng số permission active trong DB (không phụ thuộc role)
  const [systemTotal, setSystemTotal] = useState(0)
  // counts theo từng role — load một lần qua /api/permissions/counts
  const [roleCounts, setRoleCounts] = useState<Record<string, { granted: number; total: number }>>({})

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(Object.keys(CATEGORY_META))
  )
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; type: ConfirmType }>({
    open: false, type: 'seed',
  })

  // ── Load tất cả counts (sidebar) ─────────────────────────────────────────

  const loadCounts = useCallback(async () => {
    try {
      setLoadingCounts(true)
      const res = await fetch('/api/permissions/counts')
      const data = await res.json()
      if (data.success) {
        setSystemTotal(data.total)
        setRoleCounts(data.counts)
      }
    } catch {
      // không block UI
    } finally {
      setLoadingCounts(false)
    }
  }, [])

  // ── Load permissions của role hiện tại ───────────────────────────────────

  const loadPermissions = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/permissions/role?role=${selectedRole}`)
      const data = await res.json()
      if (data.success) {
        setPermissions(data.permissions ?? [])
      } else {
        toast.error(data.error || 'Không thể tải danh sách quyền')
      }
    } catch {
      toast.error('Đã xảy ra lỗi khi tải danh sách quyền')
    } finally {
      setLoading(false)
    }
  }, [selectedRole])

  useEffect(() => {
    loadCounts()
  }, [loadCounts])

  useEffect(() => {
    loadPermissions()
  }, [loadPermissions])

  // ── Toggle một quyền ─────────────────────────────────────────────────────

  const handleToggle = async (permissionId: string, currentGranted: boolean) => {
    const newGranted = !currentGranted
    setTogglingId(permissionId)

    // Optimistic update
    setPermissions(prev =>
      prev.map(p => p.id === permissionId ? { ...p, isGranted: newGranted } : p)
    )
    // Cập nhật sidebar count ngay
    setRoleCounts(prev => {
      const cur = prev[selectedRole] ?? { granted: 0, total: systemTotal }
      return {
        ...prev,
        [selectedRole]: { ...cur, granted: cur.granted + (newGranted ? 1 : -1) },
      }
    })

    try {
      const res = await fetch('/api/permissions/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole, permissionId, isGranted: newGranted }),
      })
      const data = await res.json()
      if (!data.success) {
        // Rollback
        setPermissions(prev =>
          prev.map(p => p.id === permissionId ? { ...p, isGranted: currentGranted } : p)
        )
        setRoleCounts(prev => {
          const cur = prev[selectedRole] ?? { granted: 0, total: systemTotal }
          return {
            ...prev,
            [selectedRole]: { ...cur, granted: cur.granted + (currentGranted ? 1 : -1) },
          }
        })
        toast.error(data.error || 'Không thể cập nhật quyền')
      }
    } catch {
      // Rollback
      setPermissions(prev =>
        prev.map(p => p.id === permissionId ? { ...p, isGranted: currentGranted } : p)
      )
      setRoleCounts(prev => {
        const cur = prev[selectedRole] ?? { granted: 0, total: systemTotal }
        return {
          ...prev,
          [selectedRole]: { ...cur, granted: cur.granted + (currentGranted ? 1 : -1) },
        }
      })
      toast.error('Đã xảy ra lỗi khi cập nhật quyền')
    } finally {
      setTogglingId(null)
    }
  }

  // ── Grant all ─────────────────────────────────────────────────────────────

  const handleGrantAll = async () => {
    setConfirmDialog(p => ({ ...p, open: false }))
    try {
      setGrantingAll(true)
      const res = await fetch('/api/permissions/role/grant-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Đã cấp ${data.granted} quyền cho ${currentRole.label}`)
        await Promise.all([loadPermissions(), loadCounts()])
      } else {
        toast.error(data.error || 'Không thể cấp quyền')
      }
    } catch {
      toast.error('Đã xảy ra lỗi khi cấp quyền')
    } finally {
      setGrantingAll(false)
    }
  }

  // ── Revoke all ────────────────────────────────────────────────────────────

  const handleRevokeAll = async () => {
    setConfirmDialog(p => ({ ...p, open: false }))
    try {
      setRevokingAll(true)
      const res = await fetch('/api/permissions/role/revoke-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Đã thu hồi ${data.revoked} quyền của ${currentRole.label}`)
        await Promise.all([loadPermissions(), loadCounts()])
      } else {
        toast.error(data.error || 'Không thể thu hồi quyền')
      }
    } catch {
      toast.error('Đã xảy ra lỗi khi thu hồi quyền')
    } finally {
      setRevokingAll(false)
    }
  }

  // ── Seed ──────────────────────────────────────────────────────────────────

  const handleSeed = async (resetGrants: boolean) => {
    setConfirmDialog(p => ({ ...p, open: false }))
    try {
      setSeeding(true)
      const res = await fetch('/api/permissions/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetGrants }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || 'Đã khởi tạo permissions thành công')
        await Promise.all([loadPermissions(), loadCounts()])
      } else {
        toast.error(data.error || 'Không thể khởi tạo permissions')
      }
    } catch {
      toast.error('Đã xảy ra lỗi khi khởi tạo permissions')
    } finally {
      setSeeding(false)
    }
  }

  // ── Derived state ─────────────────────────────────────────────────────────

  const filteredPermissions = useMemo(() =>
    permissions.filter(p => {
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory
      const q = searchQuery.toLowerCase()
      const matchSearch = !q
        || p.name.toLowerCase().includes(q)
        || p.code.toLowerCase().includes(q)
        || (p.description?.toLowerCase().includes(q) ?? false)
      return matchCat && matchSearch
    }),
    [permissions, selectedCategory, searchQuery]
  )

  const groupedPermissions = useMemo(() =>
    filteredPermissions.reduce<Record<string, Permission[]>>((acc, p) => {
      if (!acc[p.category]) acc[p.category] = []
      acc[p.category].push(p)
      return acc
    }, {}),
    [filteredPermissions]
  )

  // Số liệu chính xác: tính trực tiếp từ mảng permissions (single source of truth)
  const grantedCount = useMemo(() => permissions.filter(p => p.isGranted).length, [permissions])
  const totalCount = permissions.length  // tổng quyền active (cùng với systemTotal)
  const grantedPercent = totalCount > 0 ? Math.round((grantedCount / totalCount) * 100) : 0

  const currentRole = ROLES.find(r => r.value === selectedRole)!
  const currentColors = ROLE_COLORS[currentRole.color]

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(cat)) { next.delete(cat) } else { next.add(cat) }
      return next
    })
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-col gap-5 pb-8">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-200">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">Phân quyền RBAC</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Cấu hình quyền truy cập chi tiết cho từng vai trò — {systemTotal > 0 ? `${systemTotal} quyền trong hệ thống` : 'chưa khởi tạo'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline" size="sm"
                  onClick={() => { loadPermissions(); loadCounts() }}
                  disabled={loading}
                  className="h-9"
                >
                  <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                  <span className="ml-1.5 hidden sm:inline">Làm mới</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Tải lại dữ liệu</TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={seeding} className="h-9">
                  {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  <span className="ml-1.5 hidden sm:inline">Khởi tạo</span>
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-68">
                <DropdownMenuItem
                  className="py-2.5"
                  onClick={() => setConfirmDialog({ open: true, type: 'seed' })}
                >
                  <Upload className="h-4 w-4 mr-2.5 text-blue-500 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Seed permissions</p>
                    <p className="text-xs text-slate-400 mt-0.5">Thêm quyền mới, giữ nguyên phân quyền cũ</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="py-2.5 text-red-600 focus:text-red-600 focus:bg-red-50"
                  onClick={() => setConfirmDialog({ open: true, type: 'seedReset' })}
                >
                  <RotateCcw className="h-4 w-4 mr-2.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Seed & Reset toàn bộ</p>
                    <p className="text-xs text-red-400 mt-0.5">Xóa phân quyền cũ, áp ma trận mặc định</p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* ── Stats ────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Tổng quyền hệ thống — từ DB, không phụ thuộc role */}
          <StatCard
            label="Tổng quyền hệ thống"
            value={systemTotal}
            sub="permissions đang active"
            color="indigo"
          />
          {/* Đã cấp — tính từ mảng permissions (nguồn duy nhất) */}
          <StatCard
            label={`Đã cấp · ${currentRole.labelShort}`}
            value={grantedCount}
            sub={`trên ${totalCount} quyền active`}
            color="emerald"
          />
          {/* Chưa cấp */}
          <StatCard
            label="Chưa cấp"
            value={totalCount - grantedCount}
            sub={`quyền bị hạn chế`}
            color="slate"
          />
          {/* Tỉ lệ */}
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-violet-500" />
            <p className="text-[11px] font-semibold text-violet-600 uppercase tracking-widest mb-1">Tỉ lệ cấp quyền</p>
            <p className="text-2xl font-bold text-slate-900">{grantedPercent}%</p>
            <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-700', currentColors.bar)}
                style={{ width: `${grantedPercent}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">{grantedCount}/{totalCount} quyền</p>
          </div>
        </div>

        {/* ── Main Layout ──────────────────────────────────────────────────── */}
        <div className="flex gap-4 items-start">

          {/* ── Sidebar: Role picker ─────────────────────────────────────── */}
          <div className="w-56 flex-shrink-0 flex flex-col gap-2.5">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
              Vai trò ({ROLES.length})
            </p>

            <div className="space-y-1">
              {ROLES.map(role => {
                const RoleIcon = role.icon
                const c = ROLE_COLORS[role.color]
                const isActive = selectedRole === role.value
                // counts: dùng roleCounts từ /api/permissions/counts (load đầu trang)
                const counts = roleCounts[role.value]
                const pct = counts?.total > 0 ? Math.round((counts.granted / counts.total) * 100) : 0

                return (
                  <Tooltip key={role.value}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setSelectedRole(role.value)}
                        className={cn(
                          'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all text-left',
                          isActive ? c.cardActive : c.card
                        )}
                      >
                        <div className={cn('p-1.5 rounded-lg flex-shrink-0 transition-all', isActive ? c.iconBgActive : c.iconBg)}>
                          <RoleIcon className={cn('h-3.5 w-3.5', c.icon)} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className={cn('text-xs font-semibold leading-tight truncate', isActive ? 'text-slate-900' : 'text-slate-700')}>
                            {role.label}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            {loadingCounts ? (
                              <div className="h-1 flex-1 bg-slate-200 rounded-full animate-pulse" />
                            ) : counts ? (
                              <>
                                <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                                  <div className={cn('h-full rounded-full transition-all', c.bar)} style={{ width: `${pct}%` }} />
                                </div>
                                <span className={cn('text-[10px] font-semibold tabular-nums flex-shrink-0', c.count)}>
                                  {counts.granted}/{counts.total}
                                </span>
                              </>
                            ) : (
                              <span className="text-[10px] text-slate-400">–</span>
                            )}
                          </div>
                        </div>

                        {isActive && <div className={cn('h-2 w-2 rounded-full flex-shrink-0', c.dot)} />}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-52">
                      <p className="font-semibold text-sm">{role.label}</p>
                      <p className="text-xs text-slate-300 mt-0.5">{role.description}</p>
                      {counts && (
                        <p className="text-xs text-slate-400 mt-1">
                          Đã cấp: <span className="font-semibold text-white">{counts.granted}</span>/{counts.total} quyền ({pct}%)
                        </p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>

            {/* Actions */}
            <div className="pt-1 flex flex-col gap-1.5">
              <Button
                size="sm"
                disabled={grantingAll || loading}
                onClick={() => setConfirmDialog({ open: true, type: 'grantAll' })}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-sm"
              >
                {grantingAll
                  ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  : <Zap className="h-3.5 w-3.5 mr-1.5" />}
                Cấp toàn bộ
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={revokingAll || loading || grantedCount === 0}
                onClick={() => setConfirmDialog({ open: true, type: 'revokeAll' })}
                className="w-full text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300"
              >
                {revokingAll
                  ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  : <XCircle className="h-3.5 w-3.5 mr-1.5" />}
                Thu hồi tất cả
              </Button>
            </div>
          </div>

          {/* ── Main panel ───────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 flex flex-col gap-3.5">

            {/* Role header */}
            <div className={cn('flex items-center gap-3 px-4 py-3 rounded-xl border bg-white shadow-sm')}>
              <div className={cn('p-2 rounded-lg', currentColors.iconBg)}>
                <currentRole.icon className={cn('h-5 w-5', currentColors.icon)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-slate-900">{currentRole.label}</p>
                  <Badge className={cn('text-[10px] font-semibold border-0', currentColors.badge)}>
                    Cấp {currentRole.level}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">{currentRole.description}</p>
              </div>
              <div className="text-right flex-shrink-0">
                {loading ? (
                  <div className="h-6 w-16 bg-slate-200 rounded animate-pulse" />
                ) : (
                  <>
                    <p className={cn('text-lg font-bold tabular-nums', currentColors.count)}>
                      {grantedCount}
                      <span className="text-sm font-normal text-slate-400">/{totalCount}</span>
                    </p>
                    <p className="text-[10px] text-slate-400">quyền được cấp</p>
                  </>
                )}
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                {CATEGORIES.map(cat => {
                  const CatIcon = cat.icon
                  const isActive = selectedCategory === cat.value
                  return (
                    <button
                      key={cat.value}
                      onClick={() => setSelectedCategory(cat.value)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                        isActive ? cat.pillActive : cat.pillBase
                      )}
                    >
                      <CatIcon className="h-3.5 w-3.5" />
                      {cat.label}
                    </button>
                  )
                })}
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo tên, mã code hoặc mô tả quyền..."
                  className="pl-9 h-9 text-sm bg-white"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Permission list */}
            {loading ? (
              <PermissionsLoadingSkeleton />
            ) : permissions.length === 0 ? (
              <PermissionsEmptyState onSeed={() => setConfirmDialog({ open: true, type: 'seed' })} seeding={seeding} />
            ) : (
              <div className="space-y-2.5">
                {Object.entries(groupedPermissions).map(([category, perms]) => {
                  const meta = CATEGORY_META[category as CategoryKey]
                  const CatIcon = meta?.icon ?? Shield
                  const grantedInCat = perms.filter(p => p.isGranted).length
                  const isExpanded = expandedCategories.has(category)
                  const pct = perms.length > 0 ? Math.round((grantedInCat / perms.length) * 100) : 0

                  return (
                    <Card key={category} className="overflow-hidden border shadow-sm">
                      <button
                        onClick={() => toggleCategory(category)}
                        className={cn(
                          'w-full flex items-center justify-between px-4 py-3 border-b transition-all',
                          meta?.headerBg ?? 'bg-slate-50',
                          meta?.headerBorder ?? 'border-slate-100',
                          'hover:brightness-[0.97]'
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={cn('p-1.5 rounded-lg', meta?.iconBg ?? 'bg-slate-100')}>
                            <CatIcon className={cn('h-4 w-4', meta?.iconColor ?? 'text-slate-600')} />
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-sm text-slate-800 leading-tight">{meta?.label ?? category}</p>
                            <p className="text-[10px] text-slate-400">{perms.length} quyền</p>
                          </div>
                          <span className={cn('text-xs px-2 py-0.5 rounded-full font-semibold', meta?.badgeBg ?? 'bg-slate-100 text-slate-700')}>
                            {grantedInCat}/{perms.length}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className={cn('h-full rounded-full transition-all', meta?.progressColor ?? 'bg-slate-400')}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-400 w-8 text-right tabular-nums">{pct}%</span>
                          </div>
                          {isExpanded
                            ? <ChevronDown className="h-4 w-4 text-slate-400" />
                            : <ChevronRight className="h-4 w-4 text-slate-400" />
                          }
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="divide-y divide-slate-100">
                          {perms.map(perm => (
                            <PermissionRow
                              key={perm.id}
                              permission={perm}
                              isToggling={togglingId === perm.id}
                              onToggle={() => handleToggle(perm.id, perm.isGranted)}
                            />
                          ))}
                        </div>
                      )}
                    </Card>
                  )
                })}

                {Object.keys(groupedPermissions).length === 0 && (
                  <div className="text-center py-14">
                    <Search className="h-10 w-10 mx-auto text-slate-200 mb-3" />
                    <p className="text-sm font-medium text-slate-500">Không tìm thấy quyền nào</p>
                    <p className="text-xs text-slate-400 mt-1">Thử từ khóa khác</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Confirm Dialog ────────────────────────────────────────────────── */}
        <ConfirmActionDialog
          open={confirmDialog.open}
          type={confirmDialog.type}
          roleName={currentRole.label}
          grantedCount={grantedCount}
          totalCount={totalCount}
          onClose={() => setConfirmDialog(p => ({ ...p, open: false }))}
          onConfirm={() => {
            const t = confirmDialog.type
            if (t === 'seed') handleSeed(false)
            else if (t === 'seedReset') handleSeed(true)
            else if (t === 'grantAll') handleGrantAll()
            else if (t === 'revokeAll') handleRevokeAll()
          }}
        />
      </div>
    </TooltipProvider>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color }: { label: string; value: number; sub: string; color: string }) {
  const colors: Record<string, { label: string; bar: string }> = {
    indigo:  { label: 'text-indigo-600',  bar: 'bg-indigo-500' },
    emerald: { label: 'text-emerald-600', bar: 'bg-emerald-500' },
    slate:   { label: 'text-slate-500',   bar: 'bg-slate-400' },
    violet:  { label: 'text-violet-600',  bar: 'bg-violet-500' },
  }
  const c = colors[color] ?? colors.slate
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm overflow-hidden relative">
      <div className={cn('absolute top-0 left-0 right-0 h-0.5', c.bar)} />
      <p className={cn('text-[11px] font-semibold uppercase tracking-widest mb-1', c.label)}>{label}</p>
      <p className="text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
    </div>
  )
}

function PermissionRow({
  permission, isToggling, onToggle,
}: {
  permission: Permission
  isToggling: boolean
  onToggle: () => void
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(permission.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3 transition-colors group',
      permission.isGranted ? 'bg-white hover:bg-slate-50/60' : 'bg-slate-50/30 hover:bg-slate-50/70'
    )}>
      <Switch
        checked={permission.isGranted}
        onCheckedChange={onToggle}
        disabled={isToggling}
        className="data-[state=checked]:bg-indigo-600 flex-shrink-0"
      />

      <div className="w-4 flex-shrink-0">
        {isToggling
          ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          : permission.isGranted
            ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            : <XCircle className="h-4 w-4 text-slate-300" />
        }
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn('text-sm font-medium', permission.isGranted ? 'text-slate-800' : 'text-slate-500')}>
            {permission.name}
          </span>
          <button onClick={handleCopy} className="group/code flex items-center gap-1" title="Sao chép mã quyền">
            <code className={cn(
              'text-[11px] px-1.5 py-0.5 rounded font-mono leading-tight transition-colors',
              permission.isGranted ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'
            )}>
              {permission.code}
            </code>
            <span className="opacity-0 group-hover/code:opacity-100 transition-opacity">
              {copied
                ? <CheckCheck className="h-3 w-3 text-emerald-500" />
                : <Copy className="h-3 w-3 text-slate-300" />
              }
            </span>
          </button>
        </div>
        {permission.description && (
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{permission.description}</p>
        )}
      </div>
    </div>
  )
}

function PermissionsLoadingSkeleton() {
  return (
    <div className="space-y-2.5">
      {[1, 2, 3].map(i => (
        <Card key={i} className="overflow-hidden border shadow-sm">
          <div className="px-4 py-3 bg-slate-50 border-b flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-slate-200 animate-pulse" />
            <div className="h-4 w-32 rounded bg-slate-200 animate-pulse" />
            <div className="h-5 w-10 rounded-full bg-slate-200 animate-pulse" />
          </div>
          <div className="divide-y divide-slate-100">
            {[1, 2, 3, 4].map(j => (
              <div key={j} className="flex items-center gap-3 px-4 py-3">
                <div className="h-5 w-9 rounded-full bg-slate-200 animate-pulse" />
                <div className="h-4 w-4 rounded-full bg-slate-200 animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="flex gap-2">
                    <div className="h-4 w-40 rounded bg-slate-200 animate-pulse" />
                    <div className="h-4 w-28 rounded bg-slate-100 animate-pulse" />
                  </div>
                  <div className="h-3 w-72 rounded bg-slate-100 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  )
}

function PermissionsEmptyState({ onSeed, seeding }: { onSeed: () => void; seeding: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 ring-1 ring-indigo-100 mb-5">
        <Shield className="h-12 w-12 text-indigo-400" />
      </div>
      <p className="font-bold text-slate-800 text-lg mb-1.5">Chưa có permissions nào</p>
      <p className="text-sm text-slate-500 mb-6 max-w-sm leading-relaxed">
        Khởi tạo bộ quyền đầy đủ (77 quyền, 7 nhóm) và phân quyền mặc định cho tất cả 10 vai trò.
      </p>
      <Button
        onClick={onSeed}
        disabled={seeding}
        className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white border-0 shadow-md"
      >
        {seeding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
        Khởi tạo Permissions mặc định
      </Button>
    </div>
  )
}

function ConfirmActionDialog({
  open, type, roleName, grantedCount, totalCount, onClose, onConfirm,
}: {
  open: boolean
  type: ConfirmType
  roleName: string
  grantedCount: number
  totalCount: number
  onClose: () => void
  onConfirm: () => void
}) {
  type Config = {
    title: string; desc: string; confirmLabel: string
    confirmClass: string; icon: React.ElementType; iconBg: string
  }

  const CONFIG: Record<ConfirmType, Config> = {
    seed: {
      title: 'Khởi tạo Permissions mặc định',
      desc: 'Thêm các quyền mới vào hệ thống và cập nhật phân quyền mặc định cho tất cả vai trò. Phân quyền đã tùy chỉnh sẽ được giữ nguyên.',
      confirmLabel: 'Khởi tạo',
      confirmClass: 'bg-blue-600 hover:bg-blue-700 text-white',
      icon: Upload,
      iconBg: 'bg-blue-100',
    },
    seedReset: {
      title: 'Seed & Reset toàn bộ phân quyền',
      desc: 'Xóa toàn bộ phân quyền hiện tại và áp lại ma trận mặc định. Mọi thay đổi tùy chỉnh sẽ bị mất.',
      confirmLabel: 'Seed & Reset',
      confirmClass: 'bg-red-600 hover:bg-red-700 text-white',
      icon: RotateCcw,
      iconBg: 'bg-red-100',
    },
    grantAll: {
      title: `Cấp toàn bộ quyền cho "${roleName}"`,
      desc: `Cấp tất cả ${totalCount} quyền active cho vai trò "${roleName}". Các quyền đã cấp giữ nguyên.`,
      confirmLabel: 'Cấp toàn bộ',
      confirmClass: 'bg-amber-500 hover:bg-amber-600 text-white',
      icon: Zap,
      iconBg: 'bg-amber-100',
    },
    revokeAll: {
      title: `Thu hồi toàn bộ quyền của "${roleName}"`,
      desc: `Thu hồi ${grantedCount} quyền đang được cấp cho vai trò "${roleName}". Vai trò sẽ không còn bất kỳ quyền nào.`,
      confirmLabel: 'Thu hồi tất cả',
      confirmClass: 'bg-rose-600 hover:bg-rose-700 text-white',
      icon: XCircle,
      iconBg: 'bg-rose-100',
    },
  }

  const c = CONFIG[type]
  const Icon = c.icon

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <div className={cn('p-2 rounded-lg', c.iconBg)}>
              <Icon className="h-4 w-4 text-slate-700" />
            </div>
            {c.title}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed pt-1.5 text-slate-600">
            {c.desc}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={onConfirm} className={c.confirmClass}>
            <Icon className="h-4 w-4 mr-1.5" />
            {c.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
