'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3, Users, Calendar, Filter } from 'lucide-react'
import { motion } from 'framer-motion'

interface StageItem { stage: string; count: number; color: string; label: string }
interface CategoryItem { name: string; count: number }
interface ReviewerWorkload { name: string; active: number; overdue: number }
interface DeadlineItem { submissionTitle: string; submissionCode: string; daysLeft: number; type: string }

interface Props {
  stageFunnel: StageItem[]
  categoryBreakdown: CategoryItem[]
  reviewerWorkload: ReviewerWorkload[]
  upcomingDeadlines: DeadlineItem[]
}

export default function EditorChartsSection({ stageFunnel, categoryBreakdown, reviewerWorkload, upcomingDeadlines }: Props) {
  return (
    <div className="space-y-6">
      {/* Stage Funnel + Category breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <Card className="shadow-lg border-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl h-full">
            <CardHeader className="border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-brand to-emerald-600">
                  <Filter className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base">Pipeline xử lý bài</CardTitle>
                  <CardDescription>Số bài viết ở từng giai đoạn</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stageFunnel} layout="vertical" margin={{ top: 0, right: 40, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={95} />
                  <Tooltip formatter={(v) => [`${v} bài`, 'Số lượng']} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    <LabelList dataKey="count" position="right" style={{ fontSize: 12, fontWeight: 600 }} />
                    {stageFunnel.map((s, i) => (
                      <Cell key={i} fill={s.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
          <Card className="shadow-lg border-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl h-full">
            <CardHeader className="border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base">Bài active theo Chuyên mục</CardTitle>
                  <CardDescription>Phân bổ tải trọng biên tập</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {categoryBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={categoryBreakdown} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={40} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Số bài" radius={[6, 6, 0, 0]}>
                      {categoryBreakdown.map((_, i) => {
                        const colors = ['#4f46e5','#0891b2','#059669','#d97706','#dc2626','#7c3aed','#0e7490','#be185d']
                        return <Cell key={i} fill={colors[i % colors.length]} />
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Chưa có dữ liệu</div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Reviewer workload + Upcoming deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="shadow-lg border-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl h-full">
            <CardHeader className="border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-600 to-violet-700">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base">Tải trọng Phản biện viên</CardTitle>
                  <CardDescription>Active vs quá hạn</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {reviewerWorkload.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {reviewerWorkload.map((rv, i) => (
                    <div key={i} className="flex items-center justify-between px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-xs font-bold text-purple-700">
                          {i + 1}
                        </div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{rv.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200">{rv.active} active</Badge>
                        {rv.overdue > 0 && (
                          <Badge className="bg-red-100 text-red-700 border-red-200">{rv.overdue} quá hạn</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-muted-foreground text-sm">Không có phản biện viên đang active</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="shadow-lg border-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl h-full">
            <CardHeader className="border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-rose-500 to-red-700">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base">Deadline 7 ngày tới</CardTitle>
                  <CardDescription>Các hạn chót cần theo dõi</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {upcomingDeadlines.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {upcomingDeadlines.map((d, i) => (
                    <div key={i} className="flex items-center justify-between px-5 py-3">
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="text-sm font-medium truncate text-slate-800 dark:text-slate-100">{d.submissionTitle}</p>
                        <p className="text-xs text-slate-400">{d.submissionCode} · {d.type}</p>
                      </div>
                      <Badge className={
                        d.daysLeft <= 1
                          ? 'bg-red-100 text-red-700 border-red-200'
                          : d.daysLeft <= 3
                          ? 'bg-orange-100 text-orange-700 border-orange-200'
                          : 'bg-blue-100 text-blue-700 border-blue-200'
                      }>
                        {d.daysLeft === 0 ? 'Hôm nay' : d.daysLeft < 0 ? 'Quá hạn' : `${d.daysLeft}d`}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-muted-foreground text-sm">Không có deadline trong 7 ngày tới</div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
