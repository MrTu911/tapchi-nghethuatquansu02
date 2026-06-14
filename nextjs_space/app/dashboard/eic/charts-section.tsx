'use client'

import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, BarChart3, Users, Building2 } from 'lucide-react'
import { motion } from 'framer-motion'

const COLORS = ['#4f46e5','#7c3aed','#0891b2','#059669','#d97706','#dc2626','#0e7490','#be185d']

interface ReviewerPerf {
  name: string; total: number; submitted: number; completionRate: number; avgDays: number
}

interface Props {
  trendData: Array<{ month: string; submitted: number; accepted: number; rejected: number }>
  categoryData: Array<{ name: string; count: number }>
  reviewerPerf: ReviewerPerf[]
  topOrgsData: Array<{ org: string; count: number }>
}

export default function EicChartsSection({ trendData, categoryData, reviewerPerf, topOrgsData }: Props) {
  return (
    <div className="space-y-6">
      {/* Trend chart */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="shadow-lg border-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl">
          <CardHeader className="border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-700">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle>Xu hướng bài nộp 12 tháng</CardTitle>
                <CardDescription>Bài nộp / chấp nhận / từ chối theo tháng</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="eicGradSubmit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="eicGradAccept" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="eicGradReject" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Legend />
                <Area type="monotone" dataKey="submitted" name="Bài nộp" stroke="#4f46e5" fill="url(#eicGradSubmit)" strokeWidth={2.5} dot={false} />
                <Area type="monotone" dataKey="accepted" name="Chấp nhận" stroke="#059669" fill="url(#eicGradAccept)" strokeWidth={2.5} dot={false} />
                <Area type="monotone" dataKey="rejected" name="Từ chối" stroke="#dc2626" fill="url(#eicGradReject)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Category + Orgs grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
          <Card className="shadow-lg border-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl h-full">
            <CardHeader className="border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <CardTitle className="text-base">Chuyên mục nổi bật</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {categoryData.length > 0 ? (
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="60%" height={180}>
                    <PieChart>
                      <Pie data={categoryData} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                        {categoryData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-1.5 text-sm">
                    {categoryData.slice(0, 6).map((cat, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="truncate text-slate-600 dark:text-slate-300 flex-1 text-xs">{cat.name}</span>
                        <Badge variant="secondary" className="text-[10px]">{cat.count}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">Chưa có dữ liệu</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <Card className="shadow-lg border-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl h-full">
            <CardHeader className="border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <CardTitle className="text-base">Top tổ chức đóng góp</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {topOrgsData.length > 0 ? (
                <div className="space-y-3">
                  {topOrgsData.map((item, i) => {
                    const max = topOrgsData[0].count
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs font-mono text-slate-400 w-4">{i + 1}</span>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-slate-700 dark:text-slate-300 truncate">{item.org}</span>
                            <span className="text-slate-500 ml-2">{item.count}</span>
                          </div>
                          <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                              style={{ width: `${Math.round((item.count / max) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">Chưa có dữ liệu</div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Reviewer performance table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card className="shadow-lg border-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl">
          <CardHeader className="border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-600 to-violet-700">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle>Hiệu suất Phản biện viên</CardTitle>
                <CardDescription>Tỷ lệ hoàn thành và thời gian trung bình</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {reviewerPerf.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {reviewerPerf.map((rv, i) => (
                  <div key={i} className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white
                        ${rv.completionRate >= 80 ? 'bg-green-500' : rv.completionRate >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}>
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-slate-800 dark:text-slate-100">{rv.name}</p>
                        <p className="text-xs text-slate-400">{rv.total} bài được gán</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className={`font-bold ${rv.completionRate >= 80 ? 'text-green-600' : rv.completionRate >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                          {rv.completionRate}%
                        </p>
                        <p className="text-xs text-slate-400">Hoàn thành</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-slate-700 dark:text-slate-200">{rv.avgDays}d</p>
                        <p className="text-xs text-slate-400">TB ngày</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-muted-foreground text-sm">Chưa có dữ liệu phản biện viên</div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
