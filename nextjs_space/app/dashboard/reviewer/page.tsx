'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import {
  FileText, Clock, CheckCircle, AlertCircle, Star, Calendar,
  TrendingUp, Award, Loader2, BookOpen, ChevronRight, Target, Zap
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

const REC_COLORS: Record<string, string> = {
  ACCEPT: '#059669',
  MINOR: '#3b82f6',
  MAJOR: '#f59e0b',
  REJECT: '#ef4444',
}
const REC_LABELS: Record<string, string> = {
  ACCEPT: 'Chấp nhận',
  MINOR: 'Sửa nhỏ',
  MAJOR: 'Sửa lớn',
  REJECT: 'Từ chối',
}

interface ReviewerSelfData {
  completionRate: number
  avgReviewDays: number
  avgScoreGiven: number
  totalInvited: number
  totalSubmitted: number
  byRecommendation: Record<string, number>
  monthlyTrend: Array<{ month: string; count: number }>
  upcomingDeadlines: Array<{ submissionTitle: string; submissionCode: string; deadline: string; daysLeft: number; type: string }>
  pendingReviews: Array<{
    id: string; submissionTitle: string; submissionCode: string;
    category: string | null; roundNo: number; invitedAt: string | null; daysWaiting: number
  }>
}

function PerfCard({ label, value, sub, gradient, icon: Icon }: {
  label: string; value: string | number; sub: string; gradient: string; icon: React.ElementType
}) {
  return (
    <Card className={`border-0 shadow-lg bg-gradient-to-br ${gradient} text-white overflow-hidden`}>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white/80">{label}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            <p className="text-xs text-white/60 mt-0.5">{sub}</p>
          </div>
          <Icon className="w-10 h-10 text-white/30" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function ReviewerDashboardPage() {
  const [user, setUser] = useState<{ fullName: string } | null>(null)
  const [data, setData] = useState<ReviewerSelfData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [meRes, statsRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/statistics/reviewer-self'),
      ])
      const me = await meRes.json()
      if (me?.data?.user) setUser(me.data.user)
      if (statsRes.ok) {
        const json = await statsRes.json()
        if (json.success) setData(json.data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  // Build pie data for recommendations
  const recPieData = data
    ? Object.entries(data.byRecommendation)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => ({ name: REC_LABELS[k] || k, value: v, key: k }))
    : []

  const pendingReviews = data?.pendingReviews || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand/5 via-background to-gold/5 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 md:p-6 space-y-6">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-5 shadow-lg border border-slate-200 dark:border-slate-700"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand flex items-center justify-center shadow-md flex-shrink-0">
            <Star className="w-6 h-6 text-brand-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-brand dark:text-emerald-300">
              Dashboard Phản biện
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Xin chào, {user?.fullName || 'Phản biện viên'} · Quản lý công việc phản biện
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(data?.pendingReviews?.length ?? 0) > 0 && (
            <Badge className="bg-red-100 text-red-700 border-red-200 text-sm px-3 py-1">
              {data!.pendingReviews.length} bài đang chờ
            </Badge>
          )}
          <Button asChild>
            <Link href="/dashboard/reviewer/history">
              <BookOpen className="w-4 h-4 mr-2" />
              Lịch sử
            </Link>
          </Button>
        </div>
      </motion.div>

      {/* Row 1: Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { title: 'Tổng được gán', value: data?.totalInvited ?? 0, icon: FileText, color: 'bg-blue-50 dark:bg-blue-900/20', textColor: 'text-blue-700', desc: 'Tất cả bài được gán' },
          { title: 'Chờ phản biện', value: pendingReviews.length, icon: Clock, color: 'bg-amber-50 dark:bg-amber-900/20', textColor: 'text-amber-700', desc: 'Cần hoàn thành' },
          { title: 'Đã hoàn thành', value: data?.totalSubmitted ?? 0, icon: CheckCircle, color: 'bg-emerald-50 dark:bg-emerald-900/20', textColor: 'text-emerald-700', desc: 'Đã nộp phản biện' },
          { title: 'Hoàn thành đúng hạn', value: `${data?.completionRate ?? 0}%`, icon: Award, color: 'bg-purple-50 dark:bg-purple-900/20', textColor: 'text-purple-700', desc: 'Tỷ lệ hoàn thành' },
        ].map((card, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <Card className={`${card.color} border-0 shadow-md`}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs font-medium ${card.textColor}`}>{card.title}</p>
                    <p className={`text-2xl font-bold ${card.textColor} mt-0.5`}>{card.value}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{card.desc}</p>
                  </div>
                  <card.icon className={`w-8 h-8 ${card.textColor} opacity-30`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Row 2: Performance stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PerfCard label="Tỷ lệ hoàn thành" value={`${data?.completionRate ?? 0}%`} sub="Bài đã nộp / được gán" gradient="from-brand to-emerald-700" icon={Target} />
        <PerfCard label="Thời gian trung bình" value={`${data?.avgReviewDays ?? 0} ngày`} sub="Từ gán đến nộp" gradient="from-blue-500 to-indigo-600" icon={Zap} />
        <PerfCard label="Điểm TB đã chấm" value={data?.avgScoreGiven ?? '—'} sub="Trên thang điểm 10" gradient="from-purple-500 to-violet-600" icon={Star} />
      </div>

      {/* Row 3: Recommendation pie + Monthly workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <Card className="shadow-xl border-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl h-full">
            <CardHeader className="border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-brand">
                  <Award className="w-5 h-5 text-brand-foreground" />
                </div>
                <div>
                  <CardTitle className="text-base">Phân bổ khuyến nghị</CardTitle>
                  <CardDescription>Thống kê các quyết định phản biện của bạn</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {recPieData.length > 0 ? (
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="55%" height={180}>
                    <PieChart>
                      <Pie data={recPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4}>
                        {recPieData.map((d, i) => (
                          <Cell key={i} fill={REC_COLORS[d.key] || '#94a3b8'} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-3">
                    {recPieData.map((d, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: REC_COLORS[d.key] || '#94a3b8' }} />
                          <span className="text-sm text-slate-600 dark:text-slate-300">{d.name}</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">Chưa có phản biện nào hoàn thành</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
          <Card className="shadow-xl border-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl h-full">
            <CardHeader className="border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base">Hoạt động 12 tháng</CardTitle>
                  <CardDescription>Số phản biện hoàn thành theo tháng</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data?.monthlyTrend || []} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 9 }} interval={2} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Phản biện hoàn thành" fill="#059669" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Row 4: Upcoming Deadlines */}
      {(data?.upcomingDeadlines?.length ?? 0) > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="shadow-xl border-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl">
            <CardHeader className="border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-rose-500 to-red-700">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base">Deadline sắp tới</CardTitle>
                  <CardDescription>Các hạn chót cần hoàn thành</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {data!.upcomingDeadlines.map((d, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3">
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="text-sm font-medium truncate">{d.submissionTitle}</p>
                      <p className="text-xs text-muted-foreground">{d.submissionCode} · {d.type}</p>
                    </div>
                    <Badge className={
                      d.daysLeft <= 1 ? 'bg-red-100 text-red-700 border-red-200'
                      : d.daysLeft <= 3 ? 'bg-orange-100 text-orange-700 border-orange-200'
                      : 'bg-blue-100 text-blue-700 border-blue-200'
                    }>
                      {d.daysLeft === 0 ? 'Hôm nay' : d.daysLeft < 0 ? 'Quá hạn' : `còn ${d.daysLeft} ngày`}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Row 5: Pending reviews list */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <Card className="shadow-xl border-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl">
          <CardHeader className="border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base">Bài cần phản biện ({pendingReviews.length})</CardTitle>
                  <CardDescription>Danh sách bài viết đang chờ phản biện của bạn</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {pendingReviews.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-emerald-400 opacity-60" />
                <p className="font-medium text-slate-600 dark:text-slate-300">Bạn đã hoàn thành tất cả phản biện!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingReviews.map(review => (
                  <motion.div
                    key={review.id}
                    whileHover={{ scale: 1.005, x: 2 }}
                    className="flex items-start justify-between p-4 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-slate-800 dark:text-slate-100 truncate">{review.submissionTitle}</h4>
                        <Badge variant="outline" className="text-xs flex-shrink-0">Vòng {review.roundNo}</Badge>
                        {review.daysWaiting > 10 && (
                          <Badge variant="destructive" className="text-xs flex-shrink-0">Đã {review.daysWaiting}d</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{review.submissionCode}</span>
                        {review.category && <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded-full">{review.category}</span>}
                        <span>Gán {review.daysWaiting} ngày trước</span>
                      </div>
                    </div>
                    <Button asChild size="sm" className="ml-3 flex-shrink-0">
                      <Link href={`/dashboard/reviewer/review/${review.id}`}>
                        Phản biện <ChevronRight className="w-4 h-4 ml-1" />
                      </Link>
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
