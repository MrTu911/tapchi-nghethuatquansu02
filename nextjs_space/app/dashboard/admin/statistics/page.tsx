
'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import {
  BarChart3, Users, FileText, UserCheck, TrendingUp, TrendingDown,
  Clock, RefreshCw, Download, BookOpen, Award, AlertCircle,
  CheckCircle, XCircle, Activity, Layers, PenLine, Eye
} from 'lucide-react'
import {
  Area, AreaChart, Bar, BarChart, Line, LineChart,
  Pie, PieChart, Cell, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, RadialBar, RadialBarChart
} from 'recharts'
import { toast } from 'sonner'

// ─── Colour palette ────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  NEW: '#6366f1',
  DESK_REJECT: '#94a3b8',
  UNDER_REVIEW: '#0ea5e9',
  REVISION: '#f59e0b',
  ACCEPTED: '#10b981',
  REJECTED: '#f43f5e',
  IN_PRODUCTION: '#8b5cf6',
  PUBLISHED: '#059669',
}

const CHART_PALETTE = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899', '#14b8a6']

const ROLE_COLORS: Record<string, string> = {
  READER: '#94a3b8',
  AUTHOR: '#6366f1',
  REVIEWER: '#0ea5e9',
  SECTION_EDITOR: '#f59e0b',
  MANAGING_EDITOR: '#f97316',
  EIC: '#10b981',
  LAYOUT_EDITOR: '#8b5cf6',
  SYSADMIN: '#f43f5e',
  SECURITY_AUDITOR: '#ec4899',
  COMMANDER: '#059669',
}

// ─── Label maps ────────────────────────────────────────────────────────────────
const STATUS_LABEL: Record<string, string> = {
  NEW: 'Bài mới',
  DESK_REJECT: 'Từ chối sơ bộ',
  UNDER_REVIEW: 'Đang phản biện',
  REVISION: 'Chờ sửa',
  ACCEPTED: 'Chấp nhận',
  REJECTED: 'Từ chối',
  IN_PRODUCTION: 'Sản xuất',
  PUBLISHED: 'Đã xuất bản',
}

const ROLE_LABEL: Record<string, string> = {
  READER: 'Độc giả',
  AUTHOR: 'Tác giả',
  REVIEWER: 'Phản biện',
  SECTION_EDITOR: 'Biên tập mục',
  MANAGING_EDITOR: 'Thư ký toà soạn',
  EIC: 'Tổng biên tập',
  LAYOUT_EDITOR: 'Biên tập trình bày',
  SYSADMIN: 'Quản trị viên',
  SECURITY_AUDITOR: 'Kiểm toán bảo mật',
  COMMANDER: 'Chỉ huy',
}

// ─── Types ─────────────────────────────────────────────────────────────────────
interface OverviewStats {
  totalUsers: number
  totalSubmissions: number
  totalReviewers: number
  activeReviewers: number
  avgReviewDays: number
  totalPublished: number
  submissionsByMonth: Array<{ month: string; count: number }>
  submissionsByStatus: Array<{ status: string; count: number }>
  usersByRole: Array<{ role: string; count: number }>
}

interface MonthlyReview {
  month: string
  monthLabel: string
  completed: number
  pending: number
  declined: number
  avgResponseDays: number
}

interface EditorPerformance {
  editorId: string
  editorName: string
  editorEmail: string
  role: string
  totalDecisions: number
  acceptedDecisions: number
  rejectedDecisions: number
  revisionDecisions: number
  acceptanceRate: number
  avgDecisionDays: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function calcAcceptanceRate(statuses: Array<{ status: string; count: number }>): number {
  const accepted = statuses.find(s => s.status === 'ACCEPTED')?.count ?? 0
  const published = statuses.find(s => s.status === 'PUBLISHED')?.count ?? 0
  const rejected = statuses.find(s => s.status === 'REJECTED')?.count ?? 0
  const deskReject = statuses.find(s => s.status === 'DESK_REJECT')?.count ?? 0
  const decided = accepted + published + rejected + deskReject
  if (decided === 0) return 0
  return Math.round(((accepted + published) / decided) * 100)
}

// ─── Sub-components ────────────────────────────────────────────────────────────
function KPISkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-3 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

interface KPICardProps {
  title: string
  value: string | number
  sub: string
  icon: React.ReactNode
  gradient: string
  iconBg: string
  trend?: { value: number; label: string }
}

function KPICard({ title, value, sub, icon, gradient, iconBg, trend }: KPICardProps) {
  return (
    <Card className={`border-0 shadow-sm ${gradient}`}>
      <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-snug">
          {title}
        </CardTitle>
        <div className={`rounded-lg p-2 ${iconBg}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">{value}</div>
        <p className="text-xs text-slate-500 mt-1">{sub}</p>
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend.value >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
            {trend.value >= 0
              ? <TrendingUp className="h-3 w-3" />
              : <TrendingDown className="h-3 w-3" />}
            {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const CustomTooltipStyle = {
  backgroundColor: 'white',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
  color: '#1e293b',
  fontSize: 13,
  padding: '10px 14px',
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function StatisticsPage() {
  const [overview, setOverview] = useState<OverviewStats | null>(null)
  const [reviewMonthly, setReviewMonthly] = useState<MonthlyReview[]>([])
  const [editorPerf, setEditorPerf] = useState<EditorPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const safeJson = async (url: string) => {
        const res = await fetch(url)
        if (!res.ok) return null
        return res.json()
      }

      const [overviewJson, reviewJson, editorJson] = await Promise.all([
        safeJson('/api/statistics/overview'),
        safeJson('/api/statistics/review-monthly'),
        safeJson('/api/statistics/editor-performance'),
      ])

      if (overviewJson) setOverview(overviewJson.data ?? overviewJson)
      if (reviewJson?.data) setReviewMonthly(reviewJson.data)
      if (editorJson?.data) setEditorPerf(editorJson.data)
      setLastUpdated(new Date())
    } catch {
      toast.error('Không thể tải dữ liệu thống kê')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Derived metrics ────────────────────────────────────────────────────────
  const acceptanceRate = overview ? calcAcceptanceRate(overview.submissionsByStatus) : 0
  const reviewerActivityRate = overview && overview.totalReviewers > 0
    ? Math.round((overview.activeReviewers / overview.totalReviewers) * 100)
    : 0
  const totalPublishedAndAccepted = overview
    ? (overview.submissionsByStatus.find(s => s.status === 'PUBLISHED')?.count ?? 0) +
      (overview.submissionsByStatus.find(s => s.status === 'ACCEPTED')?.count ?? 0)
    : 0

  // Status distribution enriched with labels & colors
  const statusDistribution = (overview?.submissionsByStatus ?? []).map(s => ({
    ...s,
    label: STATUS_LABEL[s.status] ?? s.status,
    fill: STATUS_COLORS[s.status] ?? '#94a3b8',
  }))

  // Role distribution enriched
  const roleDistribution = (overview?.usersByRole ?? []).map(r => ({
    ...r,
    label: ROLE_LABEL[r.role] ?? r.role,
    fill: ROLE_COLORS[r.role] ?? '#94a3b8',
  }))

  // Submission trend: area chart data (last 12 months from API, already sorted)
  const submissionTrend = overview?.submissionsByMonth ?? []

  // Review funnel data for radial chart
  const reviewFunnelData = [
    { name: 'Hoàn thành', value: reviewMonthly.reduce((s, m) => s + m.completed, 0), fill: '#10b981' },
    { name: 'Chờ xử lý', value: reviewMonthly.reduce((s, m) => s + m.pending, 0), fill: '#f59e0b' },
    { name: 'Từ chối', value: reviewMonthly.reduce((s, m) => s + m.declined, 0), fill: '#f43f5e' },
  ]

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 p-1">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
        <KPISkeleton />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-8">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-100 dark:bg-indigo-900/40 p-2.5">
              <BarChart3 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                Thống kê hệ thống
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Tổng quan toàn diện hoạt động tạp chí
                {lastUpdated && (
                  <span className="ml-2 text-slate-400">
                    · Cập nhật {lastUpdated.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={fetchAll} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </Button>
          <Button size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
            <Download className="h-4 w-4" />
            Xuất báo cáo
          </Button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KPICard
          title="Tổng người dùng"
          value={overview?.totalUsers.toLocaleString() ?? '—'}
          sub="Toàn hệ thống"
          icon={<Users className="h-4 w-4 text-indigo-600" />}
          gradient="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/30 dark:to-slate-900"
          iconBg="bg-indigo-100 dark:bg-indigo-900/40"
        />
        <KPICard
          title="Tổng bài nộp"
          value={overview?.totalSubmissions.toLocaleString() ?? '—'}
          sub="Tất cả thời gian"
          icon={<FileText className="h-4 w-4 text-sky-600" />}
          gradient="bg-gradient-to-br from-sky-50 to-white dark:from-sky-950/30 dark:to-slate-900"
          iconBg="bg-sky-100 dark:bg-sky-900/40"
        />
        <KPICard
          title="Tỷ lệ chấp nhận"
          value={`${acceptanceRate}%`}
          sub="Chấp nhận / đã quyết định"
          icon={<CheckCircle className="h-4 w-4 text-emerald-600" />}
          gradient="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/30 dark:to-slate-900"
          iconBg="bg-emerald-100 dark:bg-emerald-900/40"
        />
        <KPICard
          title="Thời gian xử lý TB"
          value={overview ? `${overview.avgReviewDays} ngày` : '—'}
          sub="Từ nộp đến quyết định"
          icon={<Clock className="h-4 w-4 text-amber-600" />}
          gradient="bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/30 dark:to-slate-900"
          iconBg="bg-amber-100 dark:bg-amber-900/40"
        />
        <KPICard
          title="Bài đã xuất bản"
          value={overview?.totalPublished.toLocaleString() ?? '—'}
          sub="Tổng số bài trên hệ thống"
          icon={<BookOpen className="h-4 w-4 text-violet-600" />}
          gradient="bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/30 dark:to-slate-900"
          iconBg="bg-violet-100 dark:bg-violet-900/40"
        />
        <KPICard
          title="Phản biện hoạt động"
          value={overview?.activeReviewers ?? '—'}
          sub={`/${overview?.totalReviewers ?? 0} tổng số`}
          icon={<UserCheck className="h-4 w-4 text-rose-500" />}
          gradient="bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/30 dark:to-slate-900"
          iconBg="bg-rose-100 dark:bg-rose-900/40"
          trend={{ value: reviewerActivityRate, label: 'hoạt động' }}
        />
      </div>

      {/* ── Main Tabs ── */}
      <Tabs defaultValue="submissions" className="space-y-4">
        <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 h-auto flex-wrap gap-1">
          <TabsTrigger value="submissions" className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm">
            <FileText className="h-4 w-4" /> Bài nộp
          </TabsTrigger>
          <TabsTrigger value="reviews" className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm">
            <Eye className="h-4 w-4" /> Phản biện
          </TabsTrigger>
          <TabsTrigger value="editorial" className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm">
            <PenLine className="h-4 w-4" /> Biên tập
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm">
            <Users className="h-4 w-4" /> Người dùng
          </TabsTrigger>
        </TabsList>

        {/* ══ Tab: Bài nộp ══ */}
        <TabsContent value="submissions" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-5">
            {/* Area chart: trend */}
            <Card className="lg:col-span-3 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-100">
                  Xu hướng bài nộp
                </CardTitle>
                <CardDescription>Số bài nộp theo tháng trong 6 tháng gần nhất</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={submissionTrend} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="subGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={CustomTooltipStyle} formatter={(v: number) => [v, 'Số bài nộp']} />
                    <Area
                      type="monotone"
                      dataKey="count"
                      name="Số bài"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      fill="url(#subGrad)"
                      dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Donut + table: status distribution */}
            <Card className="lg:col-span-2 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-100">
                  Phân bố trạng thái
                </CardTitle>
                <CardDescription>Toàn bộ bài nộp</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="count"
                      paddingAngle={2}
                    >
                      {statusDistribution.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={CustomTooltipStyle}
                      formatter={(v: number, _: string, props: any) => [v, props.payload.label]}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Legend table */}
                <div className="mt-2 space-y-1.5">
                  {statusDistribution.map((s) => {
                    const pct = overview && overview.totalSubmissions > 0
                      ? Math.round((s.count / overview.totalSubmissions) * 100)
                      : 0
                    return (
                      <div key={s.status} className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: s.fill }} />
                        <span className="text-xs text-slate-600 dark:text-slate-400 flex-1 truncate">{s.label}</span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{s.count}</span>
                        <span className="text-xs text-slate-400 w-8 text-right">{pct}%</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Acceptance funnel KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: 'Chấp nhận & Xuất bản',
                value: totalPublishedAndAccepted,
                total: overview?.totalSubmissions ?? 1,
                color: 'bg-emerald-500',
                icon: <CheckCircle className="h-4 w-4 text-emerald-600" />,
              },
              {
                label: 'Đang phản biện',
                value: overview?.submissionsByStatus.find(s => s.status === 'UNDER_REVIEW')?.count ?? 0,
                total: overview?.totalSubmissions ?? 1,
                color: 'bg-sky-500',
                icon: <Activity className="h-4 w-4 text-sky-600" />,
              },
              {
                label: 'Chờ sửa bài',
                value: overview?.submissionsByStatus.find(s => s.status === 'REVISION')?.count ?? 0,
                total: overview?.totalSubmissions ?? 1,
                color: 'bg-amber-500',
                icon: <AlertCircle className="h-4 w-4 text-amber-600" />,
              },
              {
                label: 'Bị từ chối',
                value: (overview?.submissionsByStatus.find(s => s.status === 'REJECTED')?.count ?? 0) +
                  (overview?.submissionsByStatus.find(s => s.status === 'DESK_REJECT')?.count ?? 0),
                total: overview?.totalSubmissions ?? 1,
                color: 'bg-rose-500',
                icon: <XCircle className="h-4 w-4 text-rose-500" />,
              },
            ].map((item) => {
              const pct = Math.round((item.value / item.total) * 100)
              return (
                <Card key={item.label} className="shadow-sm">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {item.icon}
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.label}</span>
                      </div>
                      <span className="text-xl font-bold text-slate-800 dark:text-slate-100">{item.value}</span>
                    </div>
                    <Progress value={pct} className="h-1.5" indicatorClassName={item.color} />
                    <p className="text-xs text-slate-400 mt-1.5">{pct}% tổng bài nộp</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* ══ Tab: Phản biện ══ */}
        <TabsContent value="reviews" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Monthly review multi-line */}
            <Card className="lg:col-span-2 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-100">
                  Hoạt động phản biện theo tháng
                </CardTitle>
                <CardDescription>Hoàn thành, chờ xử lý và từ chối trong 6 tháng</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={reviewMonthly} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={CustomTooltipStyle} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="completed" name="Hoàn thành" stroke="#10b981" strokeWidth={2.5}
                      dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="pending" name="Chờ xử lý" stroke="#f59e0b" strokeWidth={2.5}
                      dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="declined" name="Từ chối" stroke="#f43f5e" strokeWidth={2.5}
                      dot={{ r: 4, fill: '#f43f5e', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Review funnel radial */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-100">
                  Tổng kết phản biện
                </CardTitle>
                <CardDescription>6 tháng gần nhất</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <RadialBarChart
                    cx="50%" cy="50%"
                    innerRadius="30%" outerRadius="90%"
                    data={reviewFunnelData}
                    startAngle={90} endAngle={-270}
                  >
                    <RadialBar dataKey="value" cornerRadius={6} />
                    <Tooltip contentStyle={CustomTooltipStyle} formatter={(v: number, _: string, props: any) => [v, props.payload.name]} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="mt-3 space-y-2">
                  {reviewFunnelData.map((d) => (
                    <div key={d.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                        <span className="text-xs text-slate-600 dark:text-slate-400">{d.name}</span>
                      </div>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{d.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Avg response days bar chart */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-100">
                Thời gian phản hồi trung bình
              </CardTitle>
              <CardDescription>Số ngày trung bình từ mời đến hoàn thành phản biện</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={reviewMonthly} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit=" ngày" />
                  <Tooltip contentStyle={CustomTooltipStyle} formatter={(v: number) => [`${v} ngày`, 'Thời gian TB']} />
                  <Bar dataKey="avgResponseDays" name="Ngày TB" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Reviewer activity rate */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-100">
                    Năng lực phản biện
                  </CardTitle>
                  <CardDescription>Tỷ lệ hoạt động của đội ngũ phản biện</CardDescription>
                </div>
                <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
                  {overview?.activeReviewers}/{overview?.totalReviewers} đang hoạt động
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Tỷ lệ hoạt động</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{reviewerActivityRate}%</span>
                  </div>
                  <Progress value={reviewerActivityRate} className="h-3" />
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-indigo-600">{overview?.activeReviewers ?? 0}</div>
                  <div className="text-xs text-slate-400 mt-1">phản biện viên</div>
                  <div className="text-xs text-slate-400">đang hoạt động</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══ Tab: Biên tập ══ */}
        <TabsContent value="editorial" className="space-y-4">
          {editorPerf.length === 0 ? (
            <Card className="shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <PenLine className="h-12 w-12 text-slate-300 mb-3" />
                <p className="text-slate-500 text-sm">Chưa có dữ liệu biên tập viên</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Acceptance rate bar chart */}
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-100">
                    Tỷ lệ chấp nhận theo biên tập viên
                  </CardTitle>
                  <CardDescription>So sánh hiệu suất quyết định của từng biên tập</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      data={editorPerf.slice(0, 8)}
                      layout="vertical"
                      margin={{ top: 4, right: 60, left: 8, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
                      <YAxis
                        type="category"
                        dataKey="editorName"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                        width={110}
                      />
                      <Tooltip
                        contentStyle={CustomTooltipStyle}
                        formatter={(v: number) => [`${v}%`, 'Tỷ lệ chấp nhận']}
                      />
                      <Bar dataKey="acceptanceRate" name="Tỷ lệ chấp nhận" fill="#10b981" radius={[0, 6, 6, 0]} label={{ position: 'right', fontSize: 11, fill: '#64748b', formatter: (v: number) => `${v}%` }} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Editor performance table */}
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-100">
                    Chi tiết hiệu suất biên tập
                  </CardTitle>
                  <CardDescription>Số quyết định, tỷ lệ và thời gian xử lý</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800">
                          <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Biên tập viên</th>
                          <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vai trò</th>
                          <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng QĐ</th>
                          <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Chấp nhận</th>
                          <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Từ chối</th>
                          <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sửa lại</th>
                          <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tỷ lệ chấp nhận</th>
                          <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Thời gian TB</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                        {editorPerf.map((ed) => (
                          <tr key={ed.editorId} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-5 py-3">
                              <div>
                                <div className="font-medium text-slate-800 dark:text-slate-200">{ed.editorName}</div>
                                <div className="text-xs text-slate-400">{ed.editorEmail}</div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Badge variant="outline" className="text-xs">
                                {ROLE_LABEL[ed.role] ?? ed.role}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-center font-semibold text-slate-800 dark:text-slate-200">
                              {ed.totalDecisions}
                            </td>
                            <td className="px-4 py-3 text-center text-emerald-600 font-medium">
                              {ed.acceptedDecisions}
                            </td>
                            <td className="px-4 py-3 text-center text-rose-500 font-medium">
                              {ed.rejectedDecisions}
                            </td>
                            <td className="px-4 py-3 text-center text-amber-600 font-medium">
                              {ed.revisionDecisions}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center gap-2 justify-center">
                                <div className="w-16">
                                  <Progress
                                    value={ed.acceptanceRate}
                                    className="h-1.5"
                                    indicatorClassName="bg-emerald-500"
                                  />
                                </div>
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 w-8">
                                  {ed.acceptanceRate}%
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">
                              {ed.avgDecisionDays} ngày
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Decisions breakdown chart */}
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-100">
                    Phân bổ quyết định biên tập
                  </CardTitle>
                  <CardDescription>Chấp nhận / Từ chối / Sửa lại theo từng biên tập viên</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={editorPerf.slice(0, 6)} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="editorName" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                        tickFormatter={(v) => v.split(' ').slice(-1)[0]} />
                      <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={CustomTooltipStyle} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="acceptedDecisions" name="Chấp nhận" stackId="a" fill="#10b981" />
                      <Bar dataKey="revisionDecisions" name="Sửa lại" stackId="a" fill="#f59e0b" />
                      <Bar dataKey="rejectedDecisions" name="Từ chối" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ══ Tab: Người dùng ══ */}
        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Role distribution bar */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-100">
                  Cơ cấu vai trò
                </CardTitle>
                <CardDescription>Số lượng người dùng theo từng vai trò</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={roleDistribution}
                    layout="vertical"
                    margin={{ top: 4, right: 50, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis
                      type="category"
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      width={120}
                    />
                    <Tooltip
                      contentStyle={CustomTooltipStyle}
                      formatter={(v: number) => [v, 'Người dùng']}
                    />
                    <Bar
                      dataKey="count"
                      name="Số người"
                      radius={[0, 6, 6, 0]}
                      label={{ position: 'right', fontSize: 11, fill: '#64748b' }}
                    >
                      {roleDistribution.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Role donut with legend */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-100">
                  Tỷ lệ vai trò
                </CardTitle>
                <CardDescription>Phân bổ phần trăm theo vai trò</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={roleDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      dataKey="count"
                      paddingAngle={2}
                    >
                      {roleDistribution.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={CustomTooltipStyle}
                      formatter={(v: number, _: string, props: any) => [v, props.payload.label]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {roleDistribution.map((r) => {
                    const pct = overview && overview.totalUsers > 0
                      ? Math.round((r.count / overview.totalUsers) * 100)
                      : 0
                    return (
                      <div key={r.role} className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: r.fill }} />
                        <span className="text-xs text-slate-600 dark:text-slate-400 truncate flex-1">{r.label}</span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{pct}%</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User summary cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                role: 'AUTHOR',
                icon: <FileText className="h-5 w-5 text-indigo-600" />,
                iconBg: 'rounded-lg p-2 bg-indigo-100 dark:bg-indigo-900/30',
              },
              {
                role: 'REVIEWER',
                icon: <Eye className="h-5 w-5 text-sky-600" />,
                iconBg: 'rounded-lg p-2 bg-sky-100 dark:bg-sky-900/30',
              },
              {
                role: 'SECTION_EDITOR',
                icon: <PenLine className="h-5 w-5 text-amber-600" />,
                iconBg: 'rounded-lg p-2 bg-amber-100 dark:bg-amber-900/30',
              },
              {
                role: 'EIC',
                icon: <Award className="h-5 w-5 text-emerald-600" />,
                iconBg: 'rounded-lg p-2 bg-emerald-100 dark:bg-emerald-900/30',
              },
            ].map(({ role, icon, iconBg }) => {
              const entry = roleDistribution.find(r => r.role === role)
              const count = entry?.count ?? 0
              const label = ROLE_LABEL[role] ?? role
              const pct = overview && overview.totalUsers > 0
                ? Math.round((count / overview.totalUsers) * 100)
                : 0
              return (
                <Card key={role} className="shadow-sm">
                  <CardContent className="pt-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className={iconBg}>{icon}</div>
                      <Badge variant="secondary" className="text-xs">{pct}%</Badge>
                    </div>
                    <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">{count}</div>
                    <div className="text-sm text-slate-500 mt-1">{label}</div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Footer note ── */}
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 dark:border-indigo-900/30 dark:bg-indigo-950/20 p-4">
        <div className="flex items-start gap-3">
          <Layers className="h-5 w-5 text-indigo-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">
              Dữ liệu thống kê được tổng hợp từ toàn hệ thống
            </p>
            <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70 mt-0.5">
              Các chỉ số được tính dựa trên dữ liệu thực tế. Số liệu reviewer hoạt động = reviewer đã nộp ít nhất 1 phản biện.
              Tỷ lệ chấp nhận = (Chấp nhận + Xuất bản) / (Chấp nhận + Xuất bản + Từ chối + Từ chối sơ bộ).
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
