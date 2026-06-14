'use client'

import { motion } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
  BookOpen, Users, Award, Star, FileText, AlertTriangle,
  TrendingUp, TrendingDown, Minus, ChevronRight, Clock,
  Activity, Zap, Eye,
} from 'lucide-react'
import {
  CommanderData, STATUS_LABELS, STATUS_COLORS,
  formatChange, getChangeColor,
} from './types'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  gradient: string
  delay?: number
  alert?: boolean
  change?: number
  invertPositive?: boolean
}

function StatCard({ title, value, subtitle, icon: Icon, gradient, delay = 0, alert = false, change, invertPositive = false }: StatCardProps) {
  const changeText = change !== undefined ? formatChange(change) : null
  const changeColor = change !== undefined ? getChangeColor(change, invertPositive) : ''

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ scale: 1.02, y: -4 }}
    >
      <Card className="relative overflow-hidden border-0 shadow-xl bg-white dark:bg-slate-800 rounded-2xl h-full">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5`} />
        <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${gradient}`} />
        {alert && <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-lg shadow-red-500/50" />}
        <CardContent className="pt-5 pb-4 relative">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide truncate">{title}</p>
              <p className={`text-3xl font-bold mt-1 bg-gradient-to-br ${gradient} bg-clip-text text-transparent`}>
                {value}
              </p>
              {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
              {changeText && (
                <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${changeColor}`}>
                  {change !== undefined && change > 0 && <TrendingUp className="w-3 h-3" />}
                  {change !== undefined && change < 0 && <TrendingDown className="w-3 h-3" />}
                  {change === 0 && <Minus className="w-3 h-3 text-slate-400" />}
                  <span>{changeText} so kỳ trước</span>
                </div>
              )}
            </div>
            <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg flex-shrink-0`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200/60 rounded-xl shadow-xl p-3 text-xs">
      <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 mt-0.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-medium text-slate-700 dark:text-slate-200">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function OverviewTab({ data }: { data: CommanderData }) {
  const ov = data.overview
  const cmp = data.comparison

  const pipelineData = data.workloadPipeline
    .filter(p => p.count > 0)
    .map(p => ({
      ...p,
      label: STATUS_LABELS[p.status] || p.status,
      color: STATUS_COLORS[p.status] || '#94a3b8',
    }))

  const totalPipeline = pipelineData.reduce((sum, p) => sum + p.count, 0)

  // Find reference lines (published issues) in trend chart
  const publishRefs = data.publicationTrend
    .filter(p => p.published > 0)
    .map(p => p.month)
    .slice(-4)

  return (
    <div className="space-y-6">

      {/* ── Alert Banner ──────────────────────────────────────────── */}
      {(ov.overdueCount > 0 || data.qualityMetrics.avgPlagiarismScore > 15) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 dark:bg-red-950/30 dark:border-red-800/50"
        >
          <div className="p-2 bg-red-100 rounded-xl dark:bg-red-900/50">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-red-700 dark:text-red-300 text-sm">Cần xử lý ngay</p>
            <div className="flex flex-wrap gap-3 mt-1">
              {ov.overdueCount > 0 && (
                <span className="text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50 px-2 py-0.5 rounded-full">
                  ⚠ {ov.overdueCount} bài quá hạn phản biện
                </span>
              )}
              {data.qualityMetrics.avgPlagiarismScore > 15 && (
                <span className="text-xs text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/50 px-2 py-0.5 rounded-full">
                  ⚠ Tỷ lệ trùng lặp trung bình {data.qualityMetrics.avgPlagiarismScore}% (ngưỡng: 15%)
                </span>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── KPI Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Bài đã xuất bản" value={ov.totalPublished} subtitle="Tất cả thời gian"
          icon={BookOpen} gradient="from-blue-600 to-blue-800" delay={0}
          change={cmp.totalPublishedChange}
        />
        <StatCard
          title="Số tạp chí" value={ov.totalIssues} subtitle="Đã phát hành"
          icon={FileText} gradient="from-amber-500 to-orange-600" delay={0.05}
        />
        <StatCard
          title="Tác giả" value={ov.totalAuthors} subtitle="Đã đóng góp"
          icon={Users} gradient="from-emerald-500 to-teal-600" delay={0.1}
          change={cmp.totalAuthorsChange}
        />
        <StatCard
          title="Tỷ lệ chấp nhận" value={`${ov.acceptanceRate}%`} subtitle="Chất lượng phản biện"
          icon={Award} gradient="from-purple-600 to-purple-800" delay={0.15}
          change={cmp.acceptanceRateChange}
        />
        <StatCard
          title="Thời gian xử lý"
          value={ov.avgProcessingDays > 0 ? `${ov.avgProcessingDays}d` : '—'}
          subtitle="Trung bình đến quyết định"
          icon={Clock} gradient="from-indigo-500 to-indigo-700" delay={0.2}
        />
        <StatCard
          title="Bài quá hạn" value={ov.overdueCount} subtitle="Cần chú ý"
          icon={AlertTriangle} gradient="from-rose-500 to-red-700" delay={0.25}
          alert={ov.overdueCount > 0}
          change={cmp.overdueCountChange}
          invertPositive={true}
        />
      </div>

      {/* ── Pipeline + Recent Issues ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Pipeline Funnel */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-0 shadow-xl bg-white dark:bg-slate-800 rounded-2xl overflow-hidden h-full">
            <CardHeader className="pb-3 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-800 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base">Pipeline Bài báo</CardTitle>
                  <CardDescription className="text-xs">Phân bố theo trạng thái hiện tại</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2.5">
                {pipelineData.map((item) => {
                  const pct = totalPipeline > 0 ? Math.round((item.count / totalPipeline) * 100) : 0
                  return (
                    <div key={item.status} className="group">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">{pct}%</span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 min-w-[2rem] text-right">{item.count}</span>
                        </div>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: 0.4, duration: 0.6, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{ background: item.color }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-400">
                <span>Tổng cộng</span>
                <span className="font-bold text-slate-600 dark:text-slate-300">{totalPipeline} bài</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Issues */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card className="border-0 shadow-xl bg-white dark:bg-slate-800 rounded-2xl overflow-hidden h-full">
            <CardHeader className="pb-3 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-800 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base">Số mới nhất</CardTitle>
                  <CardDescription className="text-xs">8 số tạp chí vừa phát hành</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-3">
              <div className="space-y-2">
                {data.recentIssues.map((issue, i) => (
                  <motion.div
                    key={issue.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.04 }}
                  >
                    <Link href={`/dashboard/admin/issues/${issue.id}`}>
                      <div className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0">
                            {issue.volume}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Số {issue.volume}/{issue.year}</p>
                            <p className="text-xs text-slate-400">
                              {issue.publishedAt
                                ? new Date(issue.publishedAt).toLocaleDateString('vi-VN')
                                : 'Chưa có ngày'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-50 text-blue-700 border-0 text-xs dark:bg-blue-900/30 dark:text-blue-300">
                            {issue.articleCount} bài
                          </Badge>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 dark:text-slate-600 transition-colors" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Publication Trend Chart ──────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="border-0 shadow-xl bg-white dark:bg-slate-800 rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-800 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-base">Xu hướng Xuất bản</CardTitle>
                <CardDescription className="text-xs">24 tháng gần nhất — Nộp bài / Chấp nhận / Xuất bản</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.publicationTrend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradSubmit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradAccept" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradPublish" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false}
                  interval={Math.floor(data.publicationTrend.length / 8)} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                {publishRefs.map(month => (
                  <ReferenceLine key={month} x={month} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.5} />
                ))}
                <Area type="monotone" dataKey="submitted" name="Nộp bài" stroke="#3b82f6" strokeWidth={2} fill="url(#gradSubmit)" />
                <Area type="monotone" dataKey="accepted" name="Chấp nhận" stroke="#10b981" strokeWidth={2} fill="url(#gradAccept)" />
                <Area type="monotone" dataKey="published" name="Xuất bản" stroke="#f59e0b" strokeWidth={2} fill="url(#gradPublish)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
