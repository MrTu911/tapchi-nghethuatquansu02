'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  ComposedChart, Bar, Line, BarChart, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, BarChart3, Lightbulb, Sparkles } from 'lucide-react'
import { CommanderData, CATEGORY_COLORS, NAVY, GOLD, EMERALD, TEAL, linearForecast } from './types'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200/60 rounded-xl shadow-xl p-3 text-xs">
      <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 mt-0.5">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-medium text-slate-700 dark:text-slate-200">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function TrendForecastTab({ data }: { data: CommanderData }) {
  // Build forecast data: extend publicationTrend with 6 projected months
  const forecastData = useMemo(() => {
    const trend = data.publicationTrend
    const submittedSeries = trend.map(t => t.submitted)
    const acceptedSeries = trend.map(t => t.accepted)
    const submittedForecast = linearForecast(submittedSeries, 6)
    const acceptedForecast = linearForecast(acceptedSeries, 6)

    const lastMonth = trend[trend.length - 1]?.month ?? ''
    const [mm, yyyy] = lastMonth.split('/').map(Number)
    const futureMonths = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(yyyy, mm - 1 + i + 1, 1)
      return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
    })

    const historical = trend.map(t => ({
      month: t.month,
      submitted: t.submitted,
      accepted: t.accepted,
      isForecast: false,
    }))

    const projected = futureMonths.map((month, i) => ({
      month,
      submittedForecast: submittedForecast[i],
      acceptedForecast: acceptedForecast[i],
      isForecast: true,
    }))

    return [...historical, ...projected]
  }, [data.publicationTrend])

  const forecastStartMonth = data.publicationTrend[data.publicationTrend.length - 1]?.month

  // Auto-generate insight text from trend data
  const insight = useMemo(() => {
    const trend = data.publicationTrend
    if (trend.length < 6) return null
    const recent3 = trend.slice(-3).reduce((s, t) => s + t.submitted, 0)
    const prev3 = trend.slice(-6, -3).reduce((s, t) => s + t.submitted, 0)
    if (prev3 === 0) return null
    const change = Math.round(((recent3 - prev3) / prev3) * 100)
    if (change > 10) return { text: `Bài nộp tăng ${change}% trong 3 tháng gần nhất so với 3 tháng trước đó.`, positive: true }
    if (change < -10) return { text: `Bài nộp giảm ${Math.abs(change)}% trong 3 tháng gần nhất — cần có kế hoạch thu hút tác giả.`, positive: false }
    return { text: `Xu hướng bài nộp ổn định, dao động ±${Math.abs(change)}% trong 6 tháng gần nhất.`, positive: true }
  }, [data.publicationTrend])

  // YoY comparison (current year vs previous year, by month)
  const yoyData = useMemo(() => {
    const trend = data.publicationTrend
    const now = new Date()
    const curYear = now.getFullYear()
    const prevYear = curYear - 1
    const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
    return months.map(m => {
      const curKey = `${m}/${curYear}`
      const prevKey = `${m}/${prevYear}`
      const curEntry = trend.find(t => t.month === curKey)
      const prevEntry = trend.find(t => t.month === prevKey)
      return {
        month: `T${parseInt(m)}`,
        [`${curYear}`]: curEntry?.submitted ?? 0,
        [`${prevYear}`]: prevEntry?.submitted ?? 0,
      }
    }).filter(d => (d[`${curYear}`] as number) > 0 || (d[`${prevYear}`] as number) > 0)
  }, [data.publicationTrend])

  // Category growth from API data
  const categoryGrowth = data.categoryGrowthRate?.slice(0, 6) ?? []

  const { years, categoryData } = useMemo(() => {
    const years = data.categoryByYear.years
    const catData = data.categoryByYear.data
      .filter(c => years.length >= 2 && (c[years[years.length - 1]] || 0) > 0)
      .map(c => ({
        category: c.category,
        lastYear: c[years[years.length - 1]] || 0,
        prevYear: years.length >= 2 ? (c[years[years.length - 2]] || 0) : 0,
        growth: c[years[years.length - 2]] > 0
          ? Math.round(((c[years[years.length - 1]] - c[years[years.length - 2]]) / c[years[years.length - 2]]) * 100)
          : 0,
        ...c,
      }))
      .sort((a, b) => b.lastYear - a.lastYear)
      .slice(0, 8)
    return { years, categoryData: catData }
  }, [data.categoryByYear])

  const curYear = new Date().getFullYear()
  const prevYear = curYear - 1

  return (
    <div className="space-y-6">

      {/* Insight Banner */}
      {insight && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className={`flex items-start gap-3 p-4 rounded-2xl border ${insight.positive
            ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/50'
            : 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/50'}`}>
            <div className={`p-2 rounded-xl ${insight.positive ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'bg-amber-100 dark:bg-amber-900/50'}`}>
              {insight.positive
                ? <TrendingUp className="w-4 h-4 text-emerald-600" />
                : <TrendingDown className="w-4 h-4 text-amber-600" />}
            </div>
            <div>
              <p className={`font-semibold text-sm ${insight.positive ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>
                Nhận xét tự động
              </p>
              <p className={`text-sm mt-0.5 ${insight.positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {insight.text}
              </p>
            </div>
            <Badge className="ml-auto flex-shrink-0 bg-white/80 text-slate-500 border text-xs">
              <Sparkles className="w-3 h-3 mr-1" />Auto
            </Badge>
          </div>
        </motion.div>
      )}

      {/* Forecast explanation */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <div className="flex items-start gap-3 p-3.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-xl">
          <Lightbulb className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 dark:text-blue-400">
            <span className="font-semibold">Dự báo xu hướng:</span>{' '}
            6 tháng tiếp theo ước tính bằng hồi quy tuyến tính trên dữ liệu 24 tháng qua. Đường nét đứt = vùng dự báo.
          </p>
        </div>
      </motion.div>

      {/* Forecast Chart + YoY side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Main Forecast Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-xl bg-white dark:bg-slate-800 rounded-2xl overflow-hidden h-full">
            <CardHeader className="pb-3 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-800 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base">Xu hướng & Dự báo</CardTitle>
                  <CardDescription className="text-xs">24 tháng lịch sử + 6 tháng dự báo (nét đứt)</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={forecastData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={3} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} formatter={(v: string) => {
                    const labels: Record<string, string> = {
                      submitted: 'Bài nộp', accepted: 'Chấp nhận',
                      submittedForecast: 'Dự báo nộp', acceptedForecast: 'Dự báo chấp nhận'
                    }
                    return labels[v] || v
                  }} />
                  {forecastStartMonth && (
                    <ReferenceLine x={forecastStartMonth} stroke="#94a3b8" strokeDasharray="4 2"
                      label={{ value: 'Dự báo', position: 'insideTopRight', fontSize: 9, fill: '#94a3b8' }} />
                  )}
                  <Bar dataKey="submitted" fill={NAVY} opacity={0.75} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="accepted" fill={EMERALD} opacity={0.75} radius={[2, 2, 0, 0]} />
                  <Line type="monotone" dataKey="submittedForecast" stroke={NAVY} strokeWidth={2}
                    strokeDasharray="5 3" dot={{ r: 3, fill: NAVY }} connectNulls />
                  <Line type="monotone" dataKey="acceptedForecast" stroke={EMERALD} strokeWidth={2}
                    strokeDasharray="5 3" dot={{ r: 3, fill: EMERALD }} connectNulls />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* YoY Comparison Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="border-0 shadow-xl bg-white dark:bg-slate-800 rounded-2xl overflow-hidden h-full">
            <CardHeader className="pb-3 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-800 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base">So sánh Năm nay vs Năm trước</CardTitle>
                  <CardDescription className="text-xs">{curYear} vs {prevYear} — số bài nộp theo tháng</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {yoyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={yoyData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey={`${curYear}`} name={`Năm ${curYear}`} fill={NAVY} radius={[3, 3, 0, 0]} />
                    <Bar dataKey={`${prevYear}`} name={`Năm ${prevYear}`} fill={TEAL} opacity={0.6} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-40 flex items-center justify-center text-slate-400 text-sm">
                  Chưa đủ dữ liệu so sánh
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Category by Year Stacked + Growth Rate */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="border-0 shadow-xl bg-white dark:bg-slate-800 rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-800 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-600 to-purple-800">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-base">Lĩnh vực nghiên cứu theo năm</CardTitle>
                <CardDescription className="text-xs">Số bài nộp theo chuyên mục — {years.length} năm gần nhất</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {categoryData.length > 0 && years.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="category" tick={{ fontSize: 9, fill: '#94a3b8' }} width={90} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      {years.map((year, i) => (
                        <Bar key={year} dataKey={year} name={`Năm ${year}`}
                          fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
                          radius={[0, 3, 3, 0]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Growth rate sidebar */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Tăng trưởng so năm trước</p>
                  {(categoryGrowth.length > 0 ? categoryGrowth : categoryData.slice(0, 6).map(c => ({
                    name: c.category,
                    growthRate: c.growth,
                    currentYear: c.lastYear,
                    prevYear: c.prevYear,
                  }))).map((cat, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                      <span className="text-xs text-slate-600 dark:text-slate-300 truncate flex-1 mr-2">{cat.name}</span>
                      <div className={`flex items-center gap-1 text-xs font-bold flex-shrink-0 ${cat.growthRate >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {cat.growthRate >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(cat.growthRate)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-slate-400">Chưa đủ dữ liệu theo năm</div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
