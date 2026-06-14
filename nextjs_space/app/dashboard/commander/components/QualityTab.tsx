'use client'

import { motion } from 'framer-motion'
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Shield, Star, TrendingUp, AlertTriangle, CheckCircle2,
  Lightbulb, Lock, Eye,
} from 'lucide-react'
import { CommanderData, PURPLE, SECURITY_COLORS, SECURITY_LABELS } from './types'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200/60 rounded-xl shadow-xl p-3 text-xs">
      <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 mt-0.5">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-medium text-slate-700 dark:text-slate-200">{p.value}{p.name === 'Tỷ lệ chấp nhận' ? '%' : ''}</span>
        </div>
      ))}
    </div>
  )
}

// Circular gauge component using SVG
function CircularGauge({ value, max, label, color, unit = '' }: {
  value: number; max: number; label: string; color: string; unit?: string
}) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  const r = 38
  const circumference = 2 * Math.PI * r
  const strokeDashoffset = circumference - (pct / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="#f1f5f9" strokeWidth="8" />
          <motion.circle
            cx="50" cy="50" r={r} fill="none"
            stroke={color} strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-slate-700 dark:text-slate-200">{value}{unit}</span>
        </div>
      </div>
      <span className="text-xs text-slate-500 text-center leading-tight">{label}</span>
    </div>
  )
}

export default function QualityTab({ data }: { data: CommanderData }) {
  const qm = data.qualityMetrics
  const plagiarismHigh = qm.avgPlagiarismScore > 15
  const acceptanceLow = data.overview.acceptanceRate < 30

  const recommendations: string[] = []
  if (plagiarismHigh) recommendations.push('Tăng cường kiểm tra đạo văn trước khi gửi phản biện')
  if (acceptanceLow) recommendations.push('Xem xét tổ chức hội đồng tư vấn nâng cao chất lượng đầu vào')
  if (data.overview.overdueCount > 3) recommendations.push('Đôn đốc phản biện viên hoàn thành bài quá hạn')
  if (qm.avgReviewScore < 6) recommendations.push('Cân nhắc bổ sung hướng dẫn tiêu chí phản biện')

  const securityTotal = data.securityDistribution.reduce((s, d) => s + d.count, 0)

  return (
    <div className="space-y-6">

      {/* Alert & Recommendations */}
      {recommendations.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                <Lightbulb className="w-4 h-4 text-amber-600" />
              </div>
              <p className="font-semibold text-amber-700 dark:text-amber-300 text-sm">Đề xuất chỉ đạo</p>
            </div>
            <ul className="space-y-1.5">
              {recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400">
                  <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-amber-500" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}

      {/* Quality Gauges */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card className="border-0 shadow-xl bg-white dark:bg-slate-800 rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-800 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-600 to-purple-800">
                <Star className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-base">Chỉ số Chất lượng</CardTitle>
                <CardDescription className="text-xs">Đo lường toàn diện chất lượng tạp chí</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 justify-items-center">
              <CircularGauge
                value={data.overview.acceptanceRate} max={100}
                label="Tỷ lệ chấp nhận" color={acceptanceLow ? '#ef4444' : '#059669'} unit="%"
              />
              <CircularGauge
                value={qm.avgReviewScore} max={10}
                label="Điểm phản biện TB" color="#7c3aed" unit="/10"
              />
              <CircularGauge
                value={qm.avgPlagiarismScore} max={30}
                label="Trùng lặp TB" color={plagiarismHigh ? '#dc2626' : '#f59e0b'} unit="%"
              />
              <CircularGauge
                value={data.overview.overdueCount} max={Math.max(20, data.overview.overdueCount + 5)}
                label="Bài quá hạn" color={data.overview.overdueCount > 0 ? '#ef4444' : '#059669'} unit=""
              />
            </div>

            {/* Threshold alerts */}
            <div className="mt-6 flex flex-wrap gap-2">
              <Badge className={`text-xs ${!plagiarismHigh ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                {plagiarismHigh ? '⚠' : '✓'} Đạo văn: {qm.avgPlagiarismScore}% {plagiarismHigh ? '(> ngưỡng 15%)' : '(trong ngưỡng)'}
              </Badge>
              <Badge className={`text-xs ${!acceptanceLow ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                {acceptanceLow ? '⚠' : '✓'} Tỷ lệ chấp nhận: {data.overview.acceptanceRate}% {acceptanceLow ? '(thấp < 30%)' : '(tốt)'}
              </Badge>
              <Badge className={`text-xs ${qm.avgReviewScore >= 6 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                {qm.avgReviewScore >= 6 ? '✓' : '⚠'} Điểm phản biện: {qm.avgReviewScore}/10
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Acceptance Rate Trend + Security Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Acceptance Rate Trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="border-0 shadow-xl bg-white dark:bg-slate-800 rounded-2xl overflow-hidden h-full">
            <CardHeader className="pb-3 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-800 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base">Xu hướng Chấp nhận</CardTitle>
                  <CardDescription className="text-xs">Tỷ lệ chấp nhận 12 tháng gần nhất</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.acceptanceRateTrend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={2} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} domain={[0, 100]} unit="%" />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="rate" name="Tỷ lệ chấp nhận"
                    stroke="#059669" strokeWidth={2.5}
                    dot={{ r: 3.5, fill: '#059669', strokeWidth: 2, stroke: 'white' }}
                    activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Security Distribution */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-0 shadow-xl bg-white dark:bg-slate-800 rounded-2xl overflow-hidden h-full">
            <CardHeader className="pb-3 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-800 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base">Phân loại Bảo mật</CardTitle>
                  <CardDescription className="text-xs">Mức độ bảo mật bài báo</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {data.securityDistribution.length > 0 ? (
                <div className="space-y-3">
                  {data.securityDistribution.map((d, i) => {
                    const pct = securityTotal > 0 ? Math.round((d.count / securityTotal) * 100) : 0
                    const color = SECURITY_COLORS[d.level] || '#94a3b8'
                    const icon = d.level === 'TOP_SECRET' ? Lock :
                      d.level === 'SECRET' ? Shield :
                        d.level === 'CONFIDENTIAL' ? Eye : CheckCircle2
                    const Icon = icon
                    return (
                      <div key={i} className="group">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: color + '20', border: `1px solid ${color}40` }}>
                              <Icon className="w-3.5 h-3.5" style={{ color }} />
                            </div>
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                              {SECURITY_LABELS[d.level] || d.level}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">{pct}%</span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{d.count}</span>
                          </div>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ delay: 0.3 + i * 0.07, duration: 0.5, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{ background: color }}
                          />
                        </div>
                      </div>
                    )
                  })}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-400">
                    <span>Tổng cộng</span>
                    <span className="font-bold text-slate-600 dark:text-slate-300">{securityTotal} bài</span>
                  </div>
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-slate-400">Chưa có dữ liệu</div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
