'use client'

import { motion } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Download, Eye, Library, TrendingUp, Zap, Star } from 'lucide-react'
import { CommanderData, NAVY, TEAL, CATEGORY_COLORS } from './types'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200/60 rounded-xl shadow-xl p-3 text-xs">
      <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 mt-0.5">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-medium text-slate-700 dark:text-slate-200">{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

export default function DigitalLibraryTab({ data }: { data: CommanderData }) {
  const rm = data.repositoryMetrics

  // Calculate impact score = views + downloads * 1.5
  const articlesWithImpact = data.topArticlesByDownload.map(a => ({
    ...a,
    impactScore: Math.round((a.views || 0) + (a.downloads || 0) * 1.5),
  })).sort((x, y) => y.impactScore - x.impactScore)

  const maxImpact = articlesWithImpact[0]?.impactScore || 1

  // Find top period from download trend
  const topPeriod = [...data.monthlyDownloadTrend].sort((a, b) => b.downloads - a.downloads)[0]

  const totalViews = rm.totalViews || 0
  const totalDownloads = rm.totalDownloads || 0

  return (
    <div className="space-y-6">

      {/* Repository KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { title: 'Tổng bài báo', value: rm.totalArticles.toLocaleString(), subtitle: 'Trong kho học liệu', icon: BookOpen, gradient: 'from-blue-600 to-blue-800', delay: 0 },
          { title: 'Lượt xem', value: totalViews.toLocaleString(), subtitle: 'Tổng tất cả thời gian', icon: Eye, gradient: 'from-emerald-500 to-teal-600', delay: 0.05 },
          { title: 'Lượt tải xuống', value: totalDownloads.toLocaleString(), subtitle: 'Tổng tất cả thời gian', icon: Download, gradient: 'from-amber-500 to-orange-600', delay: 0.1 },
        ].map(({ title, value, subtitle, icon: Icon, gradient, delay }) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <Card className="relative border-0 shadow-xl bg-white dark:bg-slate-800 rounded-2xl overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5`} />
              <div className={`h-0.5 bg-gradient-to-r ${gradient}`} />
              <CardContent className="pt-5 pb-4 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{title}</p>
                    <p className={`text-3xl font-bold mt-1 bg-gradient-to-br ${gradient} bg-clip-text text-transparent`}>{value}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Highlight: Top period */}
      {topPeriod && (topPeriod.downloads > 0 || topPeriod.views > 0) && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="flex items-center gap-3 p-3.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-xl">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <Zap className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-400">
              <span className="font-semibold">Tháng hoạt động nhất:</span> {topPeriod.month} —{' '}
              {topPeriod.downloads.toLocaleString()} lượt tải, {topPeriod.views.toLocaleString()} lượt xem
            </p>
          </div>
        </motion.div>
      )}

      {/* Download Trend Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="border-0 shadow-xl bg-white dark:bg-slate-800 rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-800 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-base">Xu hướng Truy cập & Tải xuống</CardTitle>
                <CardDescription className="text-xs">Lượt xem và tải xuống 12 tháng gần nhất</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.monthlyDownloadTrend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradDownloads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={1} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Area type="monotone" dataKey="views" name="Lượt xem" stroke="#3b82f6" strokeWidth={2} fill="url(#gradViews)" />
                <Area type="monotone" dataKey="downloads" name="Lượt tải" stroke="#f59e0b" strokeWidth={2} fill="url(#gradDownloads)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Top Articles by Impact Score */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="border-0 shadow-xl bg-white dark:bg-slate-800 rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-800 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
                <Star className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-base">Top Bài báo có Tầm ảnh hưởng cao</CardTitle>
                <CardDescription className="text-xs">Impact Score = Lượt xem + Lượt tải × 1.5</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-3">
            {articlesWithImpact.length > 0 ? (
              <div className="space-y-2.5">
                {articlesWithImpact.slice(0, 8).map((article, i) => {
                  const pct = Math.round((article.impactScore / maxImpact) * 100)
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + i * 0.04 }}
                    >
                      <div className="flex items-start gap-3 mb-1.5">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-200 line-clamp-1">{article.title}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Eye className="w-3 h-3" /> {(article.views || 0).toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Download className="w-3 h-3" /> {(article.downloads || 0).toLocaleString()}
                            </span>
                            {article.publishedAt && (
                              <span className="text-[10px] text-slate-400">
                                {new Date(article.publishedAt).toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' })}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge className="flex-shrink-0 bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                          {article.impactScore.toLocaleString()}
                        </Badge>
                      </div>
                      <div className="ml-10 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: 0.4 + i * 0.04, duration: 0.5, ease: 'easeOut' }}
                          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                        />
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <div className="h-24 flex items-center justify-center text-slate-400">Chưa có dữ liệu bài báo</div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
