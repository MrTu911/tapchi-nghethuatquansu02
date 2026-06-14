
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Monitor,
  Clock,
  MapPin,
  LogOut,
  RefreshCw,
  Activity,
  Users,
  ShieldAlert,
  Smartphone,
  Globe,
  Search,
  Filter,
  TimerReset,
  WifiOff,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'

interface Session {
  id: string
  userId: string
  user: {
    id: string
    fullName: string
    email: string
    role: string
  }
  loginTime: string
  lastActive: string
  ip: string | null
  userAgent: string | null
  expiresAt: string
  duration: number
}

type SortKey = 'loginTime' | 'duration' | 'role' | 'name'

const ROLE_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  SYSADMIN:       { label: 'Quản trị viên',      color: 'text-red-700',    bgColor: 'bg-red-50 border-red-200' },
  EIC:            { label: 'Tổng biên tập',       color: 'text-purple-700', bgColor: 'bg-purple-50 border-purple-200' },
  MANAGING_EDITOR:{ label: 'Thư ký tòa soạn',    color: 'text-blue-700',   bgColor: 'bg-blue-50 border-blue-200' },
  SECTION_EDITOR: { label: 'Biên tập viên',       color: 'text-cyan-700',   bgColor: 'bg-cyan-50 border-cyan-200' },
  LAYOUT_EDITOR:  { label: 'Biên tập bố cục',     color: 'text-teal-700',   bgColor: 'bg-teal-50 border-teal-200' },
  REVIEWER:       { label: 'Phản biện',           color: 'text-orange-700', bgColor: 'bg-orange-50 border-orange-200' },
  AUTHOR:         { label: 'Tác giả',             color: 'text-yellow-700', bgColor: 'bg-yellow-50 border-yellow-200' },
  READER:         { label: 'Độc giả',             color: 'text-gray-700',   bgColor: 'bg-gray-50 border-gray-200' },
  SECURITY_AUDITOR:{ label: 'Kiểm định bảo mật', color: 'text-rose-700',   bgColor: 'bg-rose-50 border-rose-200' },
  COMMANDER:      { label: 'Chỉ huy',             color: 'text-indigo-700', bgColor: 'bg-indigo-50 border-indigo-200' },
}

const ADMIN_ROLES = ['SYSADMIN', 'EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'SECURITY_AUDITOR', 'COMMANDER']

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function getAvatarGradient(role: string): string {
  const gradients: Record<string, string> = {
    SYSADMIN:        'from-red-500 to-rose-600',
    EIC:             'from-purple-500 to-violet-600',
    MANAGING_EDITOR: 'from-blue-500 to-indigo-600',
    SECTION_EDITOR:  'from-cyan-500 to-blue-600',
    REVIEWER:        'from-orange-500 to-amber-600',
    AUTHOR:          'from-yellow-500 to-orange-500',
    LAYOUT_EDITOR:   'from-teal-500 to-cyan-600',
    SECURITY_AUDITOR:'from-rose-500 to-pink-600',
    COMMANDER:       'from-indigo-500 to-purple-600',
  }
  return gradients[role] || 'from-slate-400 to-slate-600'
}

function detectDevice(userAgent: string | null): { icon: React.ReactNode; label: string } {
  if (!userAgent) return { icon: <Globe className="h-4 w-4" />, label: 'Không xác định' }
  const ua = userAgent.toLowerCase()
  if (/android|iphone|ipad|mobile/.test(ua))
    return { icon: <Smartphone className="h-4 w-4" />, label: 'Điện thoại' }
  return { icon: <Monitor className="h-4 w-4" />, label: 'Máy tính' }
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} phút`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}g ${m}p` : `${h} giờ`
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('vi-VN', {
    hour: '2-digit', minute: '2-digit',
    day: '2-digit', month: '2-digit', year: 'numeric'
  })
}

function SessionSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border bg-card">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="flex gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-3 w-48" />
        <div className="flex gap-4">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-8 w-24" />
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
  iconBg,
  iconColor,
  accent,
  sub,
}: {
  title: string
  value: number | string
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  accent: string
  sub?: string
}) {
  return (
    <Card className={`relative overflow-hidden border-l-4 ${accent}`}>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              {title}
            </p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`p-2.5 rounded-lg ${iconBg}`}>
            <div className={iconColor}>{icon}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function SessionsManagementPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [terminatingId, setTerminatingId] = useState<string | null>(null)
  const [showTerminateDialog, setShowTerminateDialog] = useState(false)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [showTerminateAllDialog, setShowTerminateAllDialog] = useState(false)
  const [terminateAllUserId, setTerminateAllUserId] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [sortBy, setSortBy] = useState<SortKey>('loginTime')
  const [lastRefreshed, setLastRefreshed] = useState(new Date())
  const [countdown, setCountdown] = useState(30)

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/users/sessions')
      if (!res.ok) throw new Error('Lỗi kết nối server')
      const data = await res.json()
      setSessions(data.sessions ?? [])
      setLastRefreshed(new Date())
      setCountdown(30)
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Lỗi không xác định'
      toast.error('Lỗi tải phiên đăng nhập: ' + msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSessions()
    const autoRefresh = setInterval(fetchSessions, 30000)
    return () => clearInterval(autoRefresh)
  }, [fetchSessions])

  useEffect(() => {
    if (loading) return
    const tick = setInterval(() => {
      setCountdown(c => (c <= 1 ? 30 : c - 1))
    }, 1000)
    return () => clearInterval(tick)
  }, [loading])

  const terminateSession = async (sessionId: string, userId: string) => {
    try {
      setTerminatingId(sessionId)
      const res = await fetch('/api/users/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Lỗi xử lý')
      toast.success('Đã kết thúc phiên đăng nhập')
      fetchSessions()
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Có lỗi xảy ra'
      toast.error(msg)
    } finally {
      setTerminatingId(null)
      setShowTerminateDialog(false)
      setSelectedSession(null)
    }
  }

  const terminateAllUserSessions = async (userId: string) => {
    try {
      setTerminatingId(userId)
      const res = await fetch('/api/users/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Lỗi xử lý')
      toast.success('Đã kết thúc tất cả phiên của người dùng')
      fetchSessions()
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Có lỗi xảy ra'
      toast.error(msg)
    } finally {
      setTerminatingId(null)
      setShowTerminateAllDialog(false)
      setTerminateAllUserId(null)
    }
  }

  const filtered = useMemo(() => {
    let result = [...sessions]
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        s =>
          s.user.fullName.toLowerCase().includes(q) ||
          s.user.email.toLowerCase().includes(q) ||
          (s.ip || '').includes(q)
      )
    }
    if (roleFilter !== 'all') {
      result = result.filter(s => s.user.role === roleFilter)
    }
    result.sort((a, b) => {
      if (sortBy === 'loginTime') return new Date(b.loginTime).getTime() - new Date(a.loginTime).getTime()
      if (sortBy === 'duration') return b.duration - a.duration
      if (sortBy === 'role') return a.user.role.localeCompare(b.user.role)
      if (sortBy === 'name') return a.user.fullName.localeCompare(b.user.fullName)
      return 0
    })
    return result
  }, [sessions, search, roleFilter, sortBy])

  const stats = useMemo(() => ({
    total: sessions.length,
    adminCount: sessions.filter(s => ADMIN_ROLES.includes(s.user.role)).length,
    avgDuration: sessions.length
      ? Math.floor(sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length)
      : 0,
    longSessions: sessions.filter(s => s.duration >= 120).length,
  }), [sessions])

  const uniqueRoles = useMemo(
    () => [...new Set(sessions.map(s => s.user.role))],
    [sessions]
  )

  const terminateAllCandidate = terminateAllUserId
    ? sessions.find(s => s.userId === terminateAllUserId)
    : null

  return (
    <TooltipProvider>
      <div className="space-y-6 p-1">
        {/* ── Header ──────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-blue-100 text-blue-600">
                <Activity className="h-5 w-5" />
              </span>
              Quản lý phiên đăng nhập
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Theo dõi và quản lý các phiên đăng nhập đang hoạt động trên hệ thống
            </p>
          </div>

          <div className="flex items-center gap-3">
            {!loading && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full cursor-default select-none">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    <span>Làm mới sau {countdown}s</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  Cập nhật lần cuối: {lastRefreshed.toLocaleTimeString('vi-VN')}
                </TooltipContent>
              </Tooltip>
            )}
            <Button
              onClick={fetchSessions}
              variant="outline"
              size="sm"
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
          </div>
        </div>

        {/* ── KPI Cards ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-5 pb-4">
                  <Skeleton className="h-3 w-24 mb-3" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <StatCard
                title="Tổng phiên"
                value={stats.total}
                icon={<Users className="h-5 w-5" />}
                iconBg="bg-blue-100"
                iconColor="text-blue-600"
                accent="border-l-blue-500"
                sub="đang hoạt động"
              />
              <StatCard
                title="Phiên đặc quyền"
                value={stats.adminCount}
                icon={<ShieldAlert className="h-5 w-5" />}
                iconBg="bg-red-100"
                iconColor="text-red-600"
                accent="border-l-red-500"
                sub="admin & quản lý"
              />
              <StatCard
                title="Thời gian TB"
                value={formatDuration(stats.avgDuration)}
                icon={<Clock className="h-5 w-5" />}
                iconBg="bg-green-100"
                iconColor="text-green-600"
                accent="border-l-green-500"
                sub="mỗi phiên"
              />
              <StatCard
                title="Phiên dài (≥2h)"
                value={stats.longSessions}
                icon={<TimerReset className="h-5 w-5" />}
                iconBg="bg-amber-100"
                iconColor="text-amber-600"
                accent="border-l-amber-500"
                sub="cần theo dõi"
              />
            </>
          )}
        </div>

        {/* ── Filter bar ───────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3 pt-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo tên, email, địa chỉ IP..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <div className="flex gap-2">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="h-9 w-[180px]">
                    <Filter className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                    <SelectValue placeholder="Lọc vai trò" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả vai trò</SelectItem>
                    {uniqueRoles.map(role => (
                      <SelectItem key={role} value={role}>
                        {ROLE_CONFIG[role]?.label ?? role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={v => setSortBy(v as SortKey)}>
                  <SelectTrigger className="h-9 w-[160px]">
                    <SelectValue placeholder="Sắp xếp" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="loginTime">Mới nhất</SelectItem>
                    <SelectItem value="duration">Lâu nhất</SelectItem>
                    <SelectItem value="name">Tên A–Z</SelectItem>
                    <SelectItem value="role">Vai trò</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <Separator />

          {/* ── Session List ──────────────────────────────────────── */}
          <CardContent className="pt-4 pb-4">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <SessionSkeleton key={i} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-14 w-14 rounded-full bg-muted/60 flex items-center justify-center mb-3">
                  <WifiOff className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="font-medium text-muted-foreground">
                  {sessions.length === 0
                    ? 'Không có phiên đăng nhập nào đang hoạt động'
                    : 'Không tìm thấy kết quả phù hợp'}
                </p>
                {sessions.length > 0 && search && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-xs"
                    onClick={() => { setSearch(''); setRoleFilter('all') }}
                  >
                    Xóa bộ lọc
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                {filtered.map(session => {
                  const roleInfo = ROLE_CONFIG[session.user.role] ?? {
                    label: session.user.role,
                    color: 'text-gray-700',
                    bgColor: 'bg-gray-50 border-gray-200',
                  }
                  const device = detectDevice(session.user.role === 'SYSADMIN' ? session.userAgent : null)
                  const isLong = session.duration >= 120
                  const isAdmin = ADMIN_ROLES.includes(session.user.role)

                  return (
                    <div
                      key={session.id}
                      className={`flex items-start gap-4 p-4 rounded-xl border transition-all hover:shadow-sm ${
                        isAdmin
                          ? 'bg-red-50/30 border-red-100 hover:border-red-200'
                          : 'bg-card hover:border-primary/30 hover:bg-accent/20'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <Avatar className="h-11 w-11">
                          <AvatarFallback
                            className={`bg-gradient-to-br ${getAvatarGradient(session.user.role)} text-white font-semibold text-sm`}
                          >
                            {getInitials(session.user.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background bg-green-500" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <span className="font-semibold text-sm truncate">{session.user.fullName}</span>
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${roleInfo.color} ${roleInfo.bgColor}`}
                          >
                            {isAdmin && <AlertCircle className="h-3 w-3" />}
                            {roleInfo.label}
                          </span>
                          {isLong && (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                              <TimerReset className="h-3 w-3" />
                              Phiên dài
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground mb-2 truncate">
                          {session.user.email}
                        </p>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 shrink-0" />
                            Đăng nhập: {formatTime(session.loginTime)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Activity className="h-3 w-3 shrink-0" />
                            Hoạt động: {formatTime(session.lastActive)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Monitor className="h-3 w-3 shrink-0" />
                            Thời gian: <span className={`font-medium ${isLong ? 'text-amber-600' : 'text-foreground'}`}>{formatDuration(session.duration)}</span>
                          </span>
                          {session.ip && (
                            <span className="flex items-center gap-1 font-mono">
                              <MapPin className="h-3 w-3 shrink-0" />
                              {session.ip}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0 self-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                setTerminateAllUserId(session.userId)
                                setShowTerminateAllDialog(true)
                              }}
                              disabled={terminatingId === session.userId}
                            >
                              <WifiOff className="h-3.5 w-3.5 mr-1" />
                              Tất cả
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Kết thúc tất cả phiên của người dùng này</TooltipContent>
                        </Tooltip>

                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-8 text-xs gap-1.5"
                          onClick={() => {
                            setSelectedSession(session)
                            setShowTerminateDialog(true)
                          }}
                          disabled={terminatingId === session.id}
                        >
                          <LogOut className="h-3.5 w-3.5" />
                          Kết thúc
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Footer count */}
            {!loading && filtered.length > 0 && (
              <div className="flex justify-between items-center mt-4 pt-3 border-t text-xs text-muted-foreground">
                <span>
                  Hiển thị <strong>{filtered.length}</strong> / <strong>{sessions.length}</strong> phiên
                </span>
                <span>
                  Cập nhật lúc {lastRefreshed.toLocaleTimeString('vi-VN')}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Terminate Single Dialog ───────────────────────────── */}
        <AlertDialog open={showTerminateDialog} onOpenChange={setShowTerminateDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <LogOut className="h-5 w-5 text-destructive" />
                Xác nhận kết thúc phiên
              </AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn kết thúc phiên đăng nhập hiện tại của{' '}
                <strong>{selectedSession?.user.fullName}</strong>?{' '}
                Người dùng sẽ bị đăng xuất ngay lập tức.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={!!terminatingId}>Hủy</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90"
                disabled={!!terminatingId}
                onClick={() => {
                  if (selectedSession) terminateSession(selectedSession.id, selectedSession.userId)
                }}
              >
                {terminatingId ? 'Đang xử lý...' : 'Xác nhận kết thúc'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ── Terminate All Sessions Dialog ─────────────────────── */}
        <AlertDialog open={showTerminateAllDialog} onOpenChange={setShowTerminateAllDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <WifiOff className="h-5 w-5 text-destructive" />
                Kết thúc tất cả phiên
              </AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn kết thúc{' '}
                <strong>tất cả phiên đăng nhập</strong> của{' '}
                <strong>{terminateAllCandidate?.user.fullName}</strong>?{' '}
                Người dùng sẽ bị đăng xuất khỏi tất cả thiết bị.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={!!terminatingId}>Hủy</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90"
                disabled={!!terminatingId}
                onClick={() => {
                  if (terminateAllUserId) terminateAllUserSessions(terminateAllUserId)
                }}
              >
                {terminatingId ? 'Đang xử lý...' : 'Kết thúc tất cả'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  )
}
