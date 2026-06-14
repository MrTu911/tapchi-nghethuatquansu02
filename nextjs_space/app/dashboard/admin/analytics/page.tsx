
'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Area, AreaChart, Bar, BarChart, ComposedChart,
  Line, LineChart, Pie, PieChart, Cell, Scatter, ScatterChart,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  TrendingUp, TrendingDown, Minus,
  FileText, Eye, Activity, Clock, AlertTriangle, CheckCircle,
  XCircle, Zap, Star, Users, Server, Database,
  Download, RefreshCw, BarChart3, Target, Layers,
  ArrowUpRight, ArrowDownRight, Info, AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

// ─── Colour constants ──────────────────────────────────────────────────────────
const C = {
  indigo: '#6366f1',
  sky: '#0ea5e9',
  emerald: '#10b981',
  amber: '#f59e0b',
  rose: '#f43f5e',
  violet: '#8b5cf6',
  teal: '#14b8a6',
  orange: '#f97316',
  slate: '#64748b',
}

const CHART_STYLE = {
  backgroundColor: 'white',
  border: '1px solid #e2e8f0',
  borderRadius: '10px',
  boxShadow: '0 4px 14px rgba(0,0,0,0.07)',
  fontSize: 12,
  padding: '10px 14px',
}

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

const STAGE_LABEL: Record<string, string> = {
  NEW: 'Tiếp nhận',
  UNDER_REVIEW: 'Phản biện',
  REVISION: 'Sửa bài',
  ACCEPTED: 'Chấp nhận',
  IN_PRODUCTION: 'Biên tập xuất bản',
  PUBLISHED: 'Xuất bản',
}

// ─── Types ─────────────────────────────────────────────────────────────────────
interface SubmissionAnalytics {
  overview: {
    totalSubmissions: number
    thisMonth: number
    lastMonth: number
    growthRate: number
  }
  byMonth: { month: string; count: number; accepted: number; rejected: number }[]
  rejectionRate: {
    total: number
    rejected: number
    rate: number
    byReason: { reason: string; count: number }[]
  }
  averageReviewDays: {
    overall: number
    byStatus: { status: string; avgDays: number }[]
    trend: { month: string; avgDays: number }[]
  }
  byCategory: { category: string; count: number; acceptanceRate: number }[]
}

interface ReviewerAnalytics {
  overview: {
    totalReviewers: number
    activeReviewers: number
    avgLoad: number
    overloadedCount: number
  }
  loadDistribution: {
    reviewerId: string
    reviewerName: string
    activeReviews: number
    completedReviews: number
    totalAssigned: number
  }[]
  onTimeRate: {
    overall: number
    byReviewer: { reviewerId: string; reviewerName: string; onTime: number; late: number; rate: number }[]
  }
  reliabilityScore: {
    reviewerId: string
    reviewerName: string
    completionRate: number
    avgResponseDays: number
    score: number
  }[]
  performance: { month: string; completed: number; avgDays: number }[]
}

interface WorkflowAnalytics {
  averageTimeByStage: { stage: string; avgDays: number; submissions: number }[]
  bottlenecks: { stage: string; count: number; avgDays: number; severity: 'high' | 'medium' | 'low' }[]
  completionRate: { total: number; completed: number; inProgress: number; rate: number }
  statusDistribution: {
    status: string; count: number; percentage: number; avgDaysInStatus: number
  }[]
  timeline: { month: string; avgProcessingDays: number; submissions: number }[]
}

interface TrendAnalysis {
  submissionTrend: {
    historical: { month: string; count: number }[]
    predicted: { month: string; count: number; confidence: number }[]
  }
  popularCategories: {
    category: string; current: number; trend: 'up' | 'down' | 'stable'; growthRate: number
  }[]
  reviewerDemand: { current: number; predicted: number; gap: number }
  insights: { type: 'success' | 'warning' | 'info'; message: string; metric: string; value: number }[]
}

interface SystemAnalytics {
  sessions: { total: number; active: number; today: number; avgDuration: number }
  storage: { totalFiles: number; totalSizeGB: number; byType: { type: string; count: number; sizeGB: number }[] }
  database: { totalRecords: number; tables: { name: string; count: number }[] }
  performance: { uptime: number; memoryUsage: number; cpuUsage: number }
  apiMetrics: { totalRequests: number; avgLatency: number; errorRate: number }
}

// ─── Utility components ────────────────────────────────────────────────────────
function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  )
}

function StatChip({
  label, value, color = 'slate', size = 'md'
}: { label: string; value: string | number; color?: string; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'text-xl' : 'text-3xl'
  return (
    <div className="text-center">
      <div className={`${sizeClass} font-bold text-slate-800 dark:text-slate-100`}>{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
  )
}

function InsightCard({
  insight
}: { insight: { type: 'success' | 'warning' | 'info'; message: string; metric: string; value: number } }) {
  const config = {
    success: { bg: 'bg-emerald-50 border-emerald-200', icon: <CheckCircle className="h-4 w-4 text-emerald-600" />, text: 'text-emerald-700' },
    warning: { bg: 'bg-amber-50 border-amber-200', icon: <AlertTriangle className="h-4 w-4 text-amber-600" />, text: 'text-amber-700' },
    info: { bg: 'bg-sky-50 border-sky-200', icon: <Info className="h-4 w-4 text-sky-600" />, text: 'text-sky-700' },
  }[insight.type]
  return (
    <div className={`flex items-start gap-3 rounded-xl border p-3 ${config.bg}`}>
      <div className="mt-0.5 shrink-0">{config.icon}</div>
      <div>
        <p className={`text-sm font-medium ${config.text}`}>{insight.message}</p>
        <p className="text-xs text-slate-500 mt-0.5">{insight.metric}: {insight.value.toFixed(1)}</p>
      </div>
    </div>
  )
}

function GrowthBadge({ rate }: { rate: number }) {
  if (Math.abs(rate) < 1) {
    return <Badge variant="outline" className="gap-1 text-slate-500"><Minus className="h-3 w-3" />Ổn định</Badge>
  }
  if (rate > 0) {
    return <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-200 bg-emerald-50"><TrendingUp className="h-3 w-3" />+{rate.toFixed(1)}%</Badge>
  }
  return <Badge variant="outline" className="gap-1 text-rose-500 border-rose-200 bg-rose-50"><TrendingDown className="h-3 w-3" />{rate.toFixed(1)}%</Badge>
}

function SeverityBadge({ severity }: { severity: 'high' | 'medium' | 'low' }) {
  const map = {
    high: 'bg-rose-100 text-rose-700 border-rose-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  }
  const label = { high: 'Nghiêm trọng', medium: 'Trung bình', low: 'Nhẹ' }
  return <Badge variant="outline" className={map[severity]}>{label[severity]}</Badge>
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [subData, setSubData] = useState<SubmissionAnalytics | null>(null)
  const [reviewerData, setReviewerData] = useState<ReviewerAnalytics | null>(null)
  const [workflowData, setWorkflowData] = useState<WorkflowAnalytics | null>(null)
  const [trendData, setTrendData] = useState<TrendAnalysis | null>(null)
  const [systemData, setSystemData] = useState<SystemAnalytics | null>(null)
  const [loading, setLoading] = useState<Record<string, boolean>>({
    sub: true, reviewer: true, workflow: true, trend: true, system: true
  })
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const setPartialLoading = (key: string, val: boolean) =>
    setLoading(prev => ({ ...prev, [key]: val }))

  const fetchAll = useCallback(async () => {
    setLoading({ sub: true, reviewer: true, workflow: true, trend: true, system: true })

    const safe = async <T,>(url: string, key: string, setter: (d: T) => void) => {
      try {
        const res = await fetch(url)
        if (!res.ok) return
        const json = await res.json()
        if (json.data !== undefined) setter(json.data)
        else if (json.success !== false) setter(json)
      } catch {
        // silently fail — section will show empty state
      } finally {
        setPartialLoading(key, false)
      }
    }

    // Fire all in parallel, each section loads independently
    safe<SubmissionAnalytics>('/api/statistics/submissions', 'sub', setSubData)
    safe<ReviewerAnalytics>('/api/statistics/reviewers-advanced', 'reviewer', setReviewerData)
    safe<WorkflowAnalytics>('/api/statistics/workflow', 'workflow', setWorkflowData)
    safe<TrendAnalysis>('/api/statistics/trends', 'trend', setTrendData)
    safe<SystemAnalytics>('/api/statistics/system', 'system', setSystemData)
    setLastUpdated(new Date())
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Derived data ────────────────────────────────────────────────────────────

  // Merge historical + predicted for trend chart
  const trendChartData = trendData ? [
    ...trendData.submissionTrend.historical.slice(-9).map(h => ({
      month: h.month.substring(5, 7) + '/' + h.month.substring(0, 4),
      actual: h.count,
      predicted: null as number | null,
      confidence: null as number | null,
    })),
    ...trendData.submissionTrend.predicted.map(p => ({
      month: p.month.substring(5, 7) + '/' + p.month.substring(0, 4),
      actual: null as number | null,
      predicted: p.count,
      confidence: p.confidence,
    }))
  ] : []

  const monthlySubmissions = subData?.byMonth.slice(-12).map(m => ({
    ...m,
    monthLabel: m.month.substring(5, 7) + '/' + m.month.substring(0, 4)
  })) ?? []

  const avgDaysTrend = subData?.averageReviewDays.trend.slice(-8).map(t => ({
    ...t,
    monthLabel: t.month.substring(5, 7) + '/' + t.month.substring(0, 4)
  })) ?? []

  const workflowTimeline = workflowData?.timeline.map(t => ({
    ...t,
    monthLabel: t.month.substring(5, 7) + '/' + t.month.substring(0, 4)
  })) ?? []

  const stageData = workflowData?.averageTimeByStage.map(s => ({
    ...s,
    stageLabel: STAGE_LABEL[s.stage] ?? s.stage,
    avgDays: Math.round(s.avgDays * 10) / 10,
  })) ?? []

  const topReviewers = reviewerData?.reliabilityScore.slice(0, 8) ?? []
  const loadDist = reviewerData?.loadDistribution
    .filter(r => r.totalAssigned > 0)
    .slice(0, 10) ?? []
  const reviewerPerf = reviewerData?.performance.map(p => ({
    ...p,
    monthLabel: p.month.substring(5, 7) + '/' + p.month.substring(0, 4)
  })) ?? []

  const categoryData = subData?.byCategory
    .filter(c => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8) ?? []

  const bottlenecks = workflowData?.bottlenecks ?? []

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-10">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-violet-100 dark:bg-violet-900/40 p-2.5">
            <BarChart3 className="h-6 w-6 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              Phân tích chuyên sâu
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Phân tích đa chiều · Dự báo xu hướng · Đánh giá hiệu suất
              {lastUpdated && (
                <span className="ml-2 text-slate-400">
                  · Cập nhật {lastUpdated.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={fetchAll} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </Button>
          <a href="/api/statistics/export?format=xlsx" download>
            <Button size="sm" className="gap-2 bg-violet-600 hover:bg-violet-700 text-white">
              <Download className="h-4 w-4" />
              Xuất Excel
            </Button>
          </a>
        </div>
      </div>

      {/* ── AI Insights Panel ── */}
      {trendData && trendData.insights.length > 0 && (
        <div className="rounded-xl border border-violet-100 bg-violet-50/50 dark:border-violet-900/30 dark:bg-violet-950/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-violet-600" />
            <span className="text-sm font-semibold text-violet-800 dark:text-violet-300">Nhận xét tự động từ dữ liệu</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {trendData.insights.map((ins, i) => (
              <InsightCard key={i} insight={ins} />
            ))}
          </div>
        </div>
      )}

      {/* ── Main Tabs ── */}
      <Tabs defaultValue="submissions" className="space-y-4">
        <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 h-auto flex-wrap gap-1">
          <TabsTrigger value="submissions" className="gap-1.5 text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm">
            <FileText className="h-4 w-4" /> Bài nộp
          </TabsTrigger>
          <TabsTrigger value="reviewers" className="gap-1.5 text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm">
            <Eye className="h-4 w-4" /> Phản biện viên
          </TabsTrigger>
          <TabsTrigger value="workflow" className="gap-1.5 text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm">
            <Activity className="h-4 w-4" /> Quy trình
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-1.5 text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm">
            <TrendingUp className="h-4 w-4" /> Xu hướng & Dự báo
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-1.5 text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm">
            <Server className="h-4 w-4" /> Hệ thống
          </TabsTrigger>
        </TabsList>

        {/* ══════════════════════════════════════════════════════════════
            TAB 1: BÀI NỘP — Submission Deep Dive
        ══════════════════════════════════════════════════════════════ */}
        <TabsContent value="submissions" className="space-y-5">
          {/* Overview KPIs */}
          {loading.sub ? <SectionSkeleton rows={1} /> : subData ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  label: 'Tổng bài nộp',
                  value: subData.overview.totalSubmissions.toLocaleString(),
                  sub: 'Tất cả thời gian',
                  icon: <FileText className="h-5 w-5 text-indigo-600" />,
                  bg: 'bg-indigo-50',
                },
                {
                  label: 'Tháng này',
                  value: subData.overview.thisMonth,
                  sub: `Tháng trước: ${subData.overview.lastMonth}`,
                  icon: <ArrowUpRight className="h-5 w-5 text-sky-600" />,
                  bg: 'bg-sky-50',
                  rate: subData.overview.growthRate,
                },
                {
                  label: 'Tỷ lệ từ chối',
                  value: `${subData.rejectionRate.rate.toFixed(1)}%`,
                  sub: `${subData.rejectionRate.rejected} / ${subData.rejectionRate.total} bài quyết định`,
                  icon: <XCircle className="h-5 w-5 text-rose-500" />,
                  bg: 'bg-rose-50',
                },
                {
                  label: 'Thời gian xử lý TB',
                  value: `${subData.averageReviewDays.overall.toFixed(0)} ngày`,
                  sub: 'Từ nộp đến quyết định cuối',
                  icon: <Clock className="h-5 w-5 text-amber-600" />,
                  bg: 'bg-amber-50',
                },
              ].map((item) => (
                <Card key={item.label} className="shadow-sm">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className={`rounded-lg p-2 ${item.bg}`}>{item.icon}</div>
                      {'rate' in item && <GrowthBadge rate={item.rate!} />}
                    </div>
                    <div className="mt-3 text-2xl font-bold text-slate-800 dark:text-slate-100">{item.value}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{item.sub}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}

          {/* Monthly submissions: Composed Bar+Line */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Xu hướng bài nộp 12 tháng</CardTitle>
                  <CardDescription>Số bài nộp · Chấp nhận · Từ chối theo tháng</CardDescription>
                </div>
                {subData && <GrowthBadge rate={subData.overview.growthRate} />}
              </div>
            </CardHeader>
            <CardContent>
              {loading.sub ? <Skeleton className="h-72 w-full" /> : monthlySubmissions.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={monthlySubmissions} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="subGrad2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={C.indigo} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={C.indigo} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={CHART_STYLE} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="count" name="Tổng nộp" fill={C.indigo} opacity={0.85} radius={[3, 3, 0, 0]} barSize={18} />
                    <Line type="monotone" dataKey="accepted" name="Chấp nhận" stroke={C.emerald} strokeWidth={2.5}
                      dot={{ r: 3, fill: C.emerald, stroke: '#fff', strokeWidth: 2 }} />
                    <Line type="monotone" dataKey="rejected" name="Từ chối" stroke={C.rose} strokeWidth={2.5}
                      dot={{ r: 3, fill: C.rose, stroke: '#fff', strokeWidth: 2 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : <div className="h-72 flex items-center justify-center text-slate-400 text-sm">Chưa có dữ liệu</div>}
            </CardContent>
          </Card>

          {/* Time to decision by status + Category performance */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Avg days by status */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Thời gian xử lý theo trạng thái</CardTitle>
                <CardDescription>Trung bình số ngày từ nộp đến từng kết quả</CardDescription>
              </CardHeader>
              <CardContent>
                {loading.sub ? <SectionSkeleton rows={4} /> : (
                  <div className="space-y-3">
                    {(subData?.averageReviewDays.byStatus ?? []).map((s, i) => {
                      const label = STATUS_LABEL[s.status] ?? s.status
                      const max = Math.max(...(subData?.averageReviewDays.byStatus ?? []).map(x => x.avgDays), 1)
                      const pct = (s.avgDays / max) * 100
                      const colors = [C.indigo, C.sky, C.amber, C.emerald, C.rose, C.violet]
                      const col = colors[i % colors.length]
                      return (
                        <div key={s.status}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                              {s.avgDays.toFixed(1)} ngày
                            </span>
                          </div>
                          <Progress value={pct} className="h-2" indicatorStyle={{ backgroundColor: col }} />
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Category acceptance rates */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Tỷ lệ chấp nhận theo chủ đề</CardTitle>
                <CardDescription>Hiệu suất từng lĩnh vực chuyên môn</CardDescription>
              </CardHeader>
              <CardContent>
                {loading.sub ? <SectionSkeleton rows={5} /> : categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      data={categoryData}
                      layout="vertical"
                      margin={{ top: 0, right: 55, left: 4, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="%" />
                      <YAxis type="category" dataKey="category" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={90} />
                      <Tooltip contentStyle={CHART_STYLE} formatter={(v: number) => [`${v.toFixed(1)}%`, 'Tỷ lệ chấp nhận']} />
                      <Bar dataKey="acceptanceRate" name="Tỷ lệ chấp nhận" fill={C.teal} radius={[0, 4, 4, 0]}
                        label={{ position: 'right', fontSize: 10, fill: '#64748b', formatter: (v: number) => `${v.toFixed(0)}%` }} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="h-56 flex items-center justify-center text-slate-400 text-sm">Chưa có dữ liệu chủ đề</div>}
              </CardContent>
            </Card>
          </div>

          {/* Processing time trend */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Xu hướng thời gian xử lý</CardTitle>
              <CardDescription>Thời gian trung bình (ngày) từ nộp đến quyết định — theo tháng</CardDescription>
            </CardHeader>
            <CardContent>
              {loading.sub ? <Skeleton className="h-52 w-full" /> : avgDaysTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={avgDaysTrend} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="daysGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={C.amber} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={C.amber} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit=" ngày" />
                    <Tooltip contentStyle={CHART_STYLE} formatter={(v: number) => [`${v.toFixed(1)} ngày`, 'Thời gian TB']} />
                    {subData && (
                      <ReferenceLine
                        y={subData.averageReviewDays.overall}
                        stroke={C.rose}
                        strokeDasharray="5 3"
                        label={{ value: `TB: ${subData.averageReviewDays.overall.toFixed(0)}d`, position: 'right', fontSize: 10, fill: C.rose }}
                      />
                    )}
                    <Area type="monotone" dataKey="avgDays" name="Ngày TB" stroke={C.amber} strokeWidth={2.5}
                      fill="url(#daysGrad)" dot={{ r: 4, fill: C.amber, stroke: '#fff', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <div className="h-52 flex items-center justify-center text-slate-400 text-sm">Chưa đủ dữ liệu</div>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════
            TAB 2: PHẢN BIỆN VIÊN
        ══════════════════════════════════════════════════════════════ */}
        <TabsContent value="reviewers" className="space-y-5">
          {/* KPI overview */}
          {!loading.reviewer && reviewerData && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Tổng phản biện viên', value: reviewerData.overview.totalReviewers, sub: 'Đăng ký trong hệ thống', icon: <Users className="h-5 w-5 text-indigo-600" />, bg: 'bg-indigo-50' },
                { label: 'Đang hoạt động', value: reviewerData.overview.activeReviewers, sub: 'Có đánh giá đang mở', icon: <Activity className="h-5 w-5 text-emerald-600" />, bg: 'bg-emerald-50' },
                { label: 'Tải TB mỗi người', value: `${reviewerData.overview.avgLoad.toFixed(1)} bài`, sub: 'Bài đang phản biện/người', icon: <Layers className="h-5 w-5 text-amber-600" />, bg: 'bg-amber-50' },
                { label: 'Quá tải (≥5 bài)', value: reviewerData.overview.overloadedCount, sub: 'Cần phân phối lại', icon: <AlertCircle className="h-5 w-5 text-rose-500" />, bg: 'bg-rose-50' },
              ].map((item) => (
                <Card key={item.label} className="shadow-sm">
                  <CardContent className="pt-4">
                    <div className={`rounded-lg p-2 w-fit ${item.bg}`}>{item.icon}</div>
                    <div className="mt-3 text-2xl font-bold text-slate-800 dark:text-slate-100">{item.value}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{item.sub}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Reliability Scoreboard */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Bảng xếp hạng độ tin cậy</CardTitle>
                  <CardDescription>Điểm tổng hợp: tỷ lệ hoàn thành (50%) + đúng hạn (30%) + tốc độ (20%)</CardDescription>
                </div>
                <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1">
                  <Star className="h-3 w-3" /> Reliability Score
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {loading.reviewer ? <SectionSkeleton rows={6} /> : topReviewers.length > 0 ? (
                <div className="space-y-3">
                  {topReviewers.map((rv, i) => (
                    <div key={rv.reviewerId} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                        i === 0 ? 'bg-amber-100 text-amber-700' :
                        i === 1 ? 'bg-slate-200 text-slate-600' :
                        i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-white text-slate-500'
                      }`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{rv.reviewerName}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Hoàn thành: {rv.completionRate.toFixed(0)}% · TB: {rv.avgResponseDays.toFixed(1)} ngày
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-lg font-bold text-slate-800 dark:text-slate-100">{rv.score.toFixed(0)}</div>
                        <Progress value={rv.score} className="h-1.5 w-20" indicatorClassName={
                          rv.score >= 70 ? 'bg-emerald-500' : rv.score >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                        } />
                      </div>
                    </div>
                  ))}
                </div>
              ) : <div className="py-10 text-center text-slate-400 text-sm">Chưa có dữ liệu</div>}
            </CardContent>
          </Card>

          {/* Load distribution + On-time rate */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Phân bổ khối lượng phản biện</CardTitle>
                <CardDescription>Đang xử lý vs. Đã hoàn thành (top 10)</CardDescription>
              </CardHeader>
              <CardContent>
                {loading.reviewer ? <Skeleton className="h-64 w-full" /> : loadDist.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart
                      data={loadDist}
                      layout="vertical"
                      margin={{ top: 0, right: 16, left: 4, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="reviewerName" tick={{ fontSize: 10, fill: '#64748b' }}
                        axisLine={false} tickLine={false} width={100}
                        tickFormatter={v => v.split(' ').slice(-1)[0]} />
                      <Tooltip contentStyle={CHART_STYLE} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="activeReviews" name="Đang xử lý" stackId="a" fill={C.amber} />
                      <Bar dataKey="completedReviews" name="Hoàn thành" stackId="a" fill={C.emerald} radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="h-64 flex items-center justify-center text-slate-400 text-sm">Chưa có dữ liệu</div>}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Tỷ lệ đúng hạn theo tháng</CardTitle>
                <CardDescription>Số phản biện hoàn thành và thời gian phản hồi</CardDescription>
              </CardHeader>
              <CardContent>
                {loading.reviewer ? <Skeleton className="h-64 w-full" /> : reviewerPerf.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <ComposedChart data={reviewerPerf} margin={{ top: 4, right: 20, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit=" ngày" />
                      <Tooltip contentStyle={CHART_STYLE} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                      <Bar yAxisId="left" dataKey="completed" name="Hoàn thành" fill={C.indigo} radius={[3, 3, 0, 0]} barSize={16} />
                      <Line yAxisId="right" type="monotone" dataKey="avgDays" name="Ngày TB" stroke={C.orange} strokeWidth={2.5}
                        dot={{ r: 3, fill: C.orange, stroke: '#fff', strokeWidth: 2 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : <div className="h-64 flex items-center justify-center text-slate-400 text-sm">Chưa có dữ liệu</div>}
              </CardContent>
            </Card>
          </div>

          {/* On-time rate overall */}
          {!loading.reviewer && reviewerData && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Tỷ lệ đúng hạn tổng thể</CardTitle>
                <CardDescription>Hoàn thành phản biện trong 14 ngày kể từ khi được mời</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-600">Đúng hạn</span>
                      <span className="text-sm font-bold text-slate-800">{reviewerData.onTimeRate.overall.toFixed(1)}%</span>
                    </div>
                    <Progress
                      value={reviewerData.onTimeRate.overall}
                      className="h-3"
                      indicatorClassName={reviewerData.onTimeRate.overall >= 70 ? 'bg-emerald-500' : reviewerData.onTimeRate.overall >= 50 ? 'bg-amber-500' : 'bg-rose-500'}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-slate-400">0%</span>
                      <span className="text-xs text-slate-400">Mục tiêu: 80%</span>
                      <span className="text-xs text-slate-400">100%</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-center px-4 border-l border-slate-200">
                    <div className="text-4xl font-bold text-slate-800 dark:text-slate-100">
                      {reviewerData.onTimeRate.overall.toFixed(0)}%
                    </div>
                    <div className="text-xs text-slate-400 mt-1">tỷ lệ đúng hạn</div>
                    <div className="mt-2">
                      {reviewerData.onTimeRate.overall >= 80
                        ? <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Đạt mục tiêu</Badge>
                        : <Badge className="bg-rose-100 text-rose-700 border-rose-200">Chưa đạt</Badge>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════
            TAB 3: QUY TRÌNH — Workflow Bottleneck Analysis
        ══════════════════════════════════════════════════════════════ */}
        <TabsContent value="workflow" className="space-y-5">
          {/* Completion rate */}
          {!loading.workflow && workflowData && (
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Tổng bài nộp', value: workflowData.completionRate.total, icon: <FileText className="h-5 w-5 text-slate-500" />, bg: 'bg-slate-50' },
                { label: 'Đã quyết định', value: workflowData.completionRate.completed, icon: <CheckCircle className="h-5 w-5 text-emerald-600" />, bg: 'bg-emerald-50' },
                { label: 'Đang xử lý', value: workflowData.completionRate.inProgress, icon: <Activity className="h-5 w-5 text-indigo-600" />, bg: 'bg-indigo-50' },
              ].map(item => (
                <Card key={item.label} className="shadow-sm">
                  <CardContent className="pt-4">
                    <div className={`rounded-lg p-2 w-fit ${item.bg}`}>{item.icon}</div>
                    <div className="mt-3 text-3xl font-bold text-slate-800 dark:text-slate-100">{item.value.toLocaleString()}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{item.label}</div>
                    {item.label === 'Đã quyết định' && (
                      <Progress value={workflowData.completionRate.rate} className="h-1.5 mt-2" indicatorClassName="bg-emerald-500" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Stage time chart */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Thời gian trung bình từng giai đoạn</CardTitle>
              <CardDescription>Số ngày trung bình bài nộp ở mỗi trạng thái trong quy trình</CardDescription>
            </CardHeader>
            <CardContent>
              {loading.workflow ? <Skeleton className="h-64 w-full" /> : stageData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={stageData} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="stageLabel" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit=" ngày" />
                    <Tooltip contentStyle={CHART_STYLE} formatter={(v: number) => [`${v} ngày`, 'Thời gian TB']} />
                    <Bar dataKey="avgDays" name="Ngày TB" radius={[6, 6, 0, 0]}
                      label={{ position: 'top', fontSize: 11, fill: '#64748b' }}>
                      {stageData.map((entry, i) => (
                        <Cell key={i} fill={Object.values(C)[i % Object.values(C).length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="h-64 flex items-center justify-center text-slate-400 text-sm">Chưa có dữ liệu</div>}
            </CardContent>
          </Card>

          {/* Bottleneck analysis */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <CardTitle className="text-base font-semibold">Phân tích điểm nghẽn quy trình</CardTitle>
              </div>
              <CardDescription>Giai đoạn có thời gian xử lý vượt mức trung bình đáng kể</CardDescription>
            </CardHeader>
            <CardContent>
              {loading.workflow ? <SectionSkeleton rows={3} /> : bottlenecks.length > 0 ? (
                <div className="space-y-3">
                  {bottlenecks.map((b) => (
                    <div key={b.stage} className="flex items-center justify-between p-4 rounded-xl border bg-amber-50/50 dark:bg-amber-950/20 border-amber-100">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            Giai đoạn: {STAGE_LABEL[b.stage] ?? b.stage}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {b.count} bài · Trung bình <strong>{b.avgDays.toFixed(1)} ngày</strong>
                          </div>
                        </div>
                      </div>
                      <SeverityBadge severity={b.severity} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
                  <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-emerald-700">Không phát hiện điểm nghẽn</div>
                    <div className="text-xs text-emerald-600/70 mt-0.5">Quy trình đang vận hành đều đặn</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status distribution + Timeline */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Phân bổ trạng thái hiện tại</CardTitle>
                <CardDescription>Số bài và thời gian trung bình ở từng trạng thái</CardDescription>
              </CardHeader>
              <CardContent>
                {loading.workflow ? <SectionSkeleton rows={5} /> : (
                  <div className="space-y-2.5">
                    {(workflowData?.statusDistribution ?? []).map((s, i) => {
                      const label = STATUS_LABEL[s.status] ?? s.status
                      const colors = Object.values(C)
                      const col = colors[i % colors.length]
                      return (
                        <div key={s.status} className="flex items-center gap-3">
                          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: col }} />
                          <span className="text-xs text-slate-600 dark:text-slate-400 flex-1 truncate">{label}</span>
                          <div className="w-24">
                            <Progress value={s.percentage} className="h-1.5" />
                          </div>
                          <span className="text-xs font-semibold text-slate-700 w-8 text-right">{s.count}</span>
                          <span className="text-xs text-slate-400 w-14 text-right">{s.avgDaysInStatus.toFixed(0)}d</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Thời gian xử lý theo tháng</CardTitle>
                <CardDescription>Xu hướng quy trình 6 tháng gần nhất</CardDescription>
              </CardHeader>
              <CardContent>
                {loading.workflow ? <Skeleton className="h-48 w-full" /> : workflowTimeline.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <ComposedChart data={workflowTimeline} margin={{ top: 4, right: 20, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="d" />
                      <Tooltip contentStyle={CHART_STYLE} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                      <Bar yAxisId="left" dataKey="submissions" name="Số bài" fill={C.indigo} radius={[3, 3, 0, 0]} barSize={14} opacity={0.8} />
                      <Line yAxisId="right" type="monotone" dataKey="avgProcessingDays" name="Thời gian TB" stroke={C.rose} strokeWidth={2.5}
                        dot={{ r: 4, fill: C.rose, stroke: '#fff', strokeWidth: 2 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Chưa có dữ liệu</div>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════
            TAB 4: XU HƯỚNG & DỰ BÁO
        ══════════════════════════════════════════════════════════════ */}
        <TabsContent value="trends" className="space-y-5">
          {/* Submission forecast */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Dự báo lượng bài nộp</CardTitle>
                  <CardDescription>12 tháng lịch sử + 3 tháng dự báo (hồi quy tuyến tính)</CardDescription>
                </div>
                <Badge variant="outline" className="gap-1 text-violet-600 border-violet-200 bg-violet-50">
                  <Zap className="h-3 w-3" /> AI Forecast
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {loading.trend ? <Skeleton className="h-72 w-full" /> : trendChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={trendChartData} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={C.indigo} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={C.indigo} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={C.violet} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={C.violet} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={CHART_STYLE}
                      formatter={(val: number | null, name: string) => [val ?? 'N/A', name === 'actual' ? 'Thực tế' : name === 'predicted' ? 'Dự báo' : 'Độ tin cậy (%)']} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area type="monotone" dataKey="actual" name="Thực tế" stroke={C.indigo} strokeWidth={2.5}
                      fill="url(#actualGrad)" dot={{ r: 4, fill: C.indigo, stroke: '#fff', strokeWidth: 2 }} connectNulls={false} />
                    <Area type="monotone" dataKey="predicted" name="Dự báo" stroke={C.violet} strokeWidth={2.5}
                      fill="url(#predGrad)" strokeDasharray="6 3"
                      dot={{ r: 4, fill: C.violet, stroke: '#fff', strokeWidth: 2 }} connectNulls={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : <div className="h-72 flex items-center justify-center text-slate-400 text-sm">Không đủ dữ liệu để dự báo</div>}
            </CardContent>
          </Card>

          {/* Reviewer demand forecast + Category trends */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Reviewer demand */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Dự báo nhu cầu phản biện viên</CardTitle>
                <CardDescription>Ước tính dựa trên xu hướng bài nộp tháng tới</CardDescription>
              </CardHeader>
              <CardContent>
                {loading.trend ? <SectionSkeleton rows={3} /> : trendData ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-3 rounded-xl bg-slate-50">
                        <div className="text-2xl font-bold text-slate-800">{trendData.reviewerDemand.current}</div>
                        <div className="text-xs text-slate-500 mt-1">Hiện có</div>
                      </div>
                      <div className="p-3 rounded-xl bg-violet-50">
                        <div className="text-2xl font-bold text-violet-700">{trendData.reviewerDemand.predicted}</div>
                        <div className="text-xs text-slate-500 mt-1">Cần tháng tới</div>
                      </div>
                      <div className={`p-3 rounded-xl ${trendData.reviewerDemand.gap > 0 ? 'bg-rose-50' : 'bg-emerald-50'}`}>
                        <div className={`text-2xl font-bold ${trendData.reviewerDemand.gap > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {trendData.reviewerDemand.gap > 0 ? `+${trendData.reviewerDemand.gap}` : trendData.reviewerDemand.gap}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {trendData.reviewerDemand.gap > 0 ? 'Cần thêm' : 'Dư thừa'}
                        </div>
                      </div>
                    </div>
                    {trendData.reviewerDemand.gap > 0 && (
                      <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                        <p className="text-xs text-amber-700">
                          Cần tuyển thêm <strong>{trendData.reviewerDemand.gap}</strong> phản biện viên để đáp ứng dự kiến tháng tới
                        </p>
                      </div>
                    )}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {/* Category trend */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Xu hướng chủ đề nghiên cứu</CardTitle>
                <CardDescription>Lĩnh vực nổi bật và tốc độ tăng trưởng</CardDescription>
              </CardHeader>
              <CardContent>
                {loading.trend ? <SectionSkeleton rows={5} /> : (trendData?.popularCategories ?? []).length > 0 ? (
                  <div className="space-y-2.5">
                    {trendData!.popularCategories.slice(0, 7).map((cat, i) => (
                      <div key={i} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-xs font-mono text-slate-400 w-4 shrink-0">{i + 1}</span>
                          <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{cat.category}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-slate-500">{cat.current} bài</span>
                          {cat.trend === 'up' && <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />}
                          {cat.trend === 'down' && <TrendingDown className="h-3.5 w-3.5 text-rose-500" />}
                          {cat.trend === 'stable' && <Minus className="h-3.5 w-3.5 text-slate-400" />}
                          <span className={`text-xs font-medium ${cat.growthRate > 0 ? 'text-emerald-600' : cat.growthRate < 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                            {cat.growthRate > 0 ? '+' : ''}{cat.growthRate.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <div className="py-10 text-center text-slate-400 text-sm">Chưa có dữ liệu chủ đề</div>}
              </CardContent>
            </Card>
          </div>

          {/* All insights */}
          {!loading.trend && trendData && trendData.insights.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-violet-600" />
                  <CardTitle className="text-base font-semibold">Tất cả nhận xét tự động</CardTitle>
                </div>
                <CardDescription>Các phát hiện từ phân tích dữ liệu</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {trendData.insights.map((ins, i) => (
                    <InsightCard key={i} insight={ins} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════
            TAB 5: HỆ THỐNG
        ══════════════════════════════════════════════════════════════ */}
        <TabsContent value="system" className="space-y-5">
          {/* Session metrics */}
          {!loading.system && systemData ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: 'Tổng phiên đăng nhập', value: systemData.sessions.total.toLocaleString(), icon: <Users className="h-5 w-5 text-indigo-600" />, bg: 'bg-indigo-50' },
                  { label: 'Phiên đang hoạt động', value: systemData.sessions.active.toLocaleString(), icon: <Activity className="h-5 w-5 text-emerald-600" />, bg: 'bg-emerald-50' },
                  { label: 'Đăng nhập hôm nay', value: systemData.sessions.today.toLocaleString(), icon: <ArrowUpRight className="h-5 w-5 text-sky-600" />, bg: 'bg-sky-50' },
                  { label: 'Thời gian phiên TB', value: `${systemData.sessions.avgDuration.toFixed(0)} phút`, icon: <Clock className="h-5 w-5 text-amber-600" />, bg: 'bg-amber-50' },
                ].map(item => (
                  <Card key={item.label} className="shadow-sm">
                    <CardContent className="pt-4">
                      <div className={`rounded-lg p-2 w-fit ${item.bg}`}>{item.icon}</div>
                      <div className="mt-3 text-2xl font-bold text-slate-800 dark:text-slate-100">{item.value}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{item.label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Performance health */}
              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">Hiệu năng hệ thống</CardTitle>
                    <CardDescription>Uptime, bộ nhớ và CPU</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { label: 'Uptime', value: systemData.performance.uptime, unit: '%', color: 'bg-emerald-500' },
                      { label: 'Bộ nhớ', value: systemData.performance.memoryUsage, unit: '%', color: 'bg-amber-500' },
                      { label: 'CPU', value: systemData.performance.cpuUsage, unit: '%', color: 'bg-sky-500' },
                    ].map(item => (
                      <div key={item.label}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm text-slate-700 dark:text-slate-300">{item.label}</span>
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{item.value}%</span>
                        </div>
                        <Progress value={item.value} className="h-2" indicatorClassName={item.color} />
                      </div>
                    ))}
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Độ trễ API trung bình</span>
                      <Badge variant="outline" className="text-sky-600 border-sky-200 bg-sky-50">
                        {systemData.apiMetrics.avgLatency} ms
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Tỷ lệ lỗi</span>
                      <Badge variant="outline" className={systemData.apiMetrics.errorRate < 1 ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : 'text-rose-600 border-rose-200 bg-rose-50'}>
                        {systemData.apiMetrics.errorRate}%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">Cơ sở dữ liệu</CardTitle>
                    <CardDescription>Số bản ghi theo từng bảng</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2.5">
                      {systemData.database.tables.map((t, i) => {
                        const colors = [C.indigo, C.sky, C.emerald, C.amber, C.violet]
                        const col = colors[i % colors.length]
                        const max = Math.max(...systemData.database.tables.map(x => x.count), 1)
                        return (
                          <div key={t.name} className="flex items-center gap-3">
                            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: col }} />
                            <span className="text-sm text-slate-700 dark:text-slate-300 flex-1">{t.name}</span>
                            <div className="w-24">
                              <Progress value={(t.count / max) * 100} className="h-1.5" />
                            </div>
                            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 w-14 text-right">
                              {t.count.toLocaleString()}
                            </span>
                          </div>
                        )
                      })}
                      <Separator />
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-sm font-medium text-slate-700">Tổng bản ghi</span>
                        <span className="text-sm font-bold text-slate-800">
                          {systemData.database.totalRecords.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Storage */}
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Bộ lưu trữ tệp</CardTitle>
                  <CardDescription>Tổng số file và phân loại theo định dạng</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-8 mb-4">
                    <StatChip label="Tổng số file" value={systemData.storage.totalFiles.toLocaleString()} />
                    <StatChip label="Tổng dung lượng" value={`${systemData.storage.totalSizeGB.toFixed(1)} GB`} />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {systemData.storage.byType.map((t, i) => (
                      <div key={t.type} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: Object.values(C)[i % Object.values(C).length] }} />
                          <span className="text-xs text-slate-600 dark:text-slate-400 uppercase">{t.type}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{t.count} files</div>
                          <div className="text-xs text-slate-400">{t.sizeGB.toFixed(1)} GB</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : loading.system ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-4"><SectionSkeleton rows={1} /></div>
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <Card className="shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-20">
                <Server className="h-12 w-12 text-slate-200 mb-3" />
                <p className="text-slate-500 text-sm">Không có quyền truy cập dữ liệu hệ thống</p>
                <p className="text-slate-400 text-xs mt-1">Chỉ Quản trị viên (SYSADMIN) mới xem được</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Footer ── */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 dark:border-slate-700/50 dark:bg-slate-800/20 p-4">
        <div className="flex items-start gap-3">
          <Target className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-500">
            Dữ liệu phân tích được tính toán trực tiếp từ CSDL. Dự báo dùng hồi quy tuyến tính đơn giản,
            độ tin cậy giảm dần theo khoảng cách dự báo. Điểm tin cậy reviewer = 50% hoàn thành + 30% đúng hạn + 20% tốc độ phản hồi.
          </p>
        </div>
      </div>
    </div>
  )
}
