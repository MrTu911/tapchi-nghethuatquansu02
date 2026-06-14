'use client'

import { motion } from 'framer-motion'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FlaskConical, Tags, TrendingUp, TrendingDown, Hash } from 'lucide-react'
import { CommanderData, CATEGORY_COLORS } from './types'

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200/60 rounded-xl shadow-xl p-3 text-xs">
      <p className="font-semibold text-slate-700 dark:text-slate-200">{d.name || d.payload?.keyword}</p>
      <p className="text-slate-500 mt-1">Số bài: <span className="font-bold text-slate-700 dark:text-slate-200">{d.value}</span></p>
      {d.payload?.percentage !== undefined && (
        <p className="text-slate-400">{d.payload.percentage}%</p>
      )}
    </div>
  )
}

const RADIAN = Math.PI / 180
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.06) return null
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="600">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

function getHeatColor(intensity: number): string {
  if (intensity >= 80) return 'bg-blue-700 text-white'
  if (intensity >= 60) return 'bg-blue-500 text-white'
  if (intensity >= 40) return 'bg-blue-300 text-blue-900'
  if (intensity >= 20) return 'bg-blue-100 text-blue-800'
  return 'bg-slate-100 text-slate-600'
}

export default function ResearchFieldsTab({ data }: { data: CommanderData }) {
  const maxKeyword = data.topKeywords[0]?.count || 1
  const categoryGrowth = data.categoryGrowthRate ?? []

  const heatmapKeywords = data.topKeywords.slice(0, 20).map(k => ({
    ...k,
    intensity: Math.round((k.count / maxKeyword) * 100),
  }))

  const totalCategoryCount = data.byCategory.reduce((s, c) => s + c.count, 0)

  return (
    <div className="space-y-6">

      {/* Category Donut + Growth Rate side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Donut Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-0 shadow-xl bg-white dark:bg-slate-800 rounded-2xl overflow-hidden h-full">
            <CardHeader className="pb-3 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-800 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-700">
                  <FlaskConical className="w-4 h-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base">Phân bổ Lĩnh vực</CardTitle>
                  <CardDescription className="text-xs">Tỷ lệ bài theo chuyên mục</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {data.byCategory.length > 0 ? (
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <PieChart width={240} height={240}>
                      <Pie
                        data={data.byCategory.slice(0, 8)}
                        cx={120} cy={120}
                        innerRadius={65} outerRadius={105}
                        paddingAngle={2}
                        dataKey="count"
                        labelLine={false}
                        label={renderCustomLabel}
                      >
                        {data.byCategory.slice(0, 8).map((_, i) => (
                          <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-bold text-slate-700 dark:text-slate-200">{totalCategoryCount}</span>
                      <span className="text-xs text-slate-400">bài báo</span>
                    </div>
                  </div>
                  <div className="w-full space-y-1.5 mt-2">
                    {data.byCategory.slice(0, 6).map((cat, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                        <span className="text-xs text-slate-600 dark:text-slate-300 flex-1 truncate">{cat.name}</span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{cat.percentage}%</span>
                        <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${cat.percentage}%`, background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-slate-400">Chưa có dữ liệu</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Growth Rate */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-0 shadow-xl bg-white dark:bg-slate-800 rounded-2xl overflow-hidden h-full">
            <CardHeader className="pb-3 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-800 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base">Tăng trưởng theo Lĩnh vực</CardTitle>
                  <CardDescription className="text-xs">So sánh năm nay vs năm trước</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {categoryGrowth.length > 0 ? (
                <div className="space-y-3">
                  {categoryGrowth.map((cat, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.04 }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate">{cat.name}</span>
                        </div>
                        <Badge className={`text-xs border-0 ml-2 flex-shrink-0 ${cat.growthRate > 0
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : cat.growthRate < 0
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                            : 'bg-slate-100 text-slate-500'}`}>
                          {cat.growthRate > 0 ? '▲' : cat.growthRate < 0 ? '▼' : '—'} {Math.abs(cat.growthRate)}%
                        </Badge>
                      </div>
                      <div className="relative h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (cat.currentYear / (categoryGrowth[0]?.currentYear || 1)) * 100)}%` }}
                          transition={{ delay: 0.3 + i * 0.04, duration: 0.5, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                        />
                      </div>
                      <div className="flex justify-between mt-0.5 text-[10px] text-slate-400">
                        <span>Năm nay: {cat.currentYear}</span>
                        <span>Năm trước: {cat.prevYear}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-slate-400 text-sm">Chưa đủ dữ liệu so sánh</div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Keyword Heatmap */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card className="border-0 shadow-xl bg-white dark:bg-slate-800 rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-800 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600">
                <Hash className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-base">Bản đồ Từ khóa</CardTitle>
                <CardDescription className="text-xs">Màu đậm = từ khóa xuất hiện nhiều hơn</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {heatmapKeywords.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {heatmapKeywords.map((kw, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.02 }}
                    className={`px-3 py-1.5 rounded-full font-medium cursor-default transition-transform hover:scale-105 ${getHeatColor(kw.intensity)}`}
                    title={`${kw.keyword}: ${kw.count} bài`}
                    style={{ fontSize: `${0.65 + (kw.intensity / 100) * 0.3}rem` }}
                  >
                    {kw.keyword}
                    <span className="ml-1.5 opacity-60 text-[10px]">{kw.count}</span>
                  </motion.span>
                ))}
              </div>
            ) : (
              <div className="h-20 flex items-center justify-center text-slate-400 text-sm">Chưa có dữ liệu từ khóa</div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Top Keywords Bar Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="border-0 shadow-xl bg-white dark:bg-slate-800 rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-800 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-600 to-purple-800">
                <Tags className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-base">Top 10 Từ khóa nổi bật</CardTitle>
                <CardDescription className="text-xs">Từ khóa xuất hiện nhiều nhất trong bài báo</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {data.topKeywords.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={data.topKeywords.slice(0, 10)}
                  layout="vertical"
                  margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="keyword" tick={{ fontSize: 10, fill: '#64748b' }} width={120} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Số bài" radius={[0, 6, 6, 0]}>
                    {data.topKeywords.slice(0, 10).map((_, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-40 flex items-center justify-center text-slate-400">Chưa có dữ liệu từ khóa</div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
